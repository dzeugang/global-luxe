# apps/orders/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import F, Sum, Count
from django.utils import timezone
from datetime import timedelta
from apps.products.models import Product
from .models import Order, OrderItem
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer,
    OrderTrackRequestSerializer, OrderTrackSerializer,
)
from .notifications import send_order_created, send_status_changed
from apps.integrations.cj_service import CJDropshippingService

# Seuil en dessous duquel un produit actif est signalé « stock faible »
LOW_STOCK_THRESHOLD = 5



class OrderViewSet(viewsets.ModelViewSet):
    """
    CRUD pour les commandes.
    - POST   /api/orders/                       (create — public, depuis checkout)
    - GET    /api/orders/                       (list — admin)
    - GET    /api/orders/{id}/                  (retrieve — admin)
    - PATCH  /api/orders/{id}/                  (partial_update — admin)
    - DELETE /api/orders/{id}/                  (destroy — admin)
    - POST   /api/orders/{id}/send_to_cj/       (custom — envoyer à CJ)
    - POST   /api/orders/{id}/set_tracking/     (custom — saisir suivi)
    - POST   /api/orders/{id}/update_status/    (custom — changer statut)
    - GET    /api/orders/stats/                 (custom — KPIs)
    - POST   /api/orders/track/                 (public — suivi client avec n° + email)
    """
    queryset = Order.objects.all().prefetch_related('items', 'items__product')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'paid', 'customer_email']
    search_fields = ['=id', 'customer_name', 'customer_email', 'tracking_number', 'cj_order_id']
    ordering_fields = ['created_at', 'total', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        if self.action in ['retrieve', 'update', 'partial_update']:
            return OrderDetailSerializer
        return OrderListSerializer

    def get_permissions(self):
        if self.action in ('create', 'track'):
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_throttles(self):
        # Limite les appels anonymes (anti-spam / anti-énumération)
        if self.action in ('create', 'track'):
            self.throttle_scope = 'public_create' if self.action == 'create' else 'public_track'
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def perform_destroy(self, instance):
        # Supprimer une commande non annulée remet ses articles en stock
        with transaction.atomic():
            if instance.status != 'cancelled':
                for item in instance.items.all():
                    Product.objects.filter(pk=item.product_id).update(stock=F('stock') + item.quantity)
            instance.delete()

    @action(detail=False, methods=['post'])
    def track(self, request):
        """Suivi public : le client donne son n° de commande et son email."""
        data = OrderTrackRequestSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        order = (
            Order.objects.prefetch_related('items__product')
            .filter(id=data.validated_data['order_id'], customer_email__iexact=data.validated_data['email'])
            .first()
        )
        if order is None:
            # Même réponse que l'ordre existe ou non, pour ne rien divulguer
            return Response({'detail': 'Aucune commande ne correspond à ce numéro et cet email.'}, status=404)
        return Response(OrderTrackSerializer(order).data)

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        send_order_created(order)

        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def send_to_cj(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response({'detail': 'Cette commande a déjà été envoyée.'}, status=400)

        service = CJDropshippingService()
        result = service.create_order(order)

        if result.get('success'):
            order.cj_order_id = result.get('cj_order_id', '')
            order.cj_response = result.get('raw', {})
            order.status = 'sent_to_cj'
            order.save()
            return Response(OrderDetailSerializer(order).data)
        return Response({'detail': result.get('error', 'Erreur CJ')}, status=400)

    @action(detail=True, methods=['post'])
    def set_tracking(self, request, pk=None):
        order = self.get_object()
        tracking = request.data.get('tracking_number', '').strip()
        order.tracking_number = tracking
        newly_shipped = bool(tracking) and order.status in ('pending', 'processing', 'sent_to_cj')
        if newly_shipped:
            order.status = 'shipped'
        order.save()
        if newly_shipped:
            send_status_changed(order)
        return Response(OrderDetailSerializer(order).data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'detail': f'Statut invalide. Valides : {valid_statuses}'}, status=400)
        with transaction.atomic():
            # Remettre en stock les articles d'une commande annulée (et inversement)
            if new_status == 'cancelled' and order.status != 'cancelled':
                delta = 1
            elif order.status == 'cancelled' and new_status != 'cancelled':
                delta = -1
            else:
                delta = 0
            if delta:
                items = list(order.items.select_related('product'))
                if delta < 0:
                    short = [i.product.name for i in items if i.product.stock < i.quantity]
                    if short:
                        return Response({'detail': f"Stock insuffisant pour réactiver : {', '.join(short)}"}, status=400)
                for item in items:
                    Product.objects.filter(pk=item.product_id).update(stock=F('stock') + delta * item.quantity)
            changed = order.status != new_status
            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])
        if changed and request.data.get('notify', True):
            send_status_changed(order)
        return Response(OrderDetailSerializer(order).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """KPIs du tableau de bord. « Ventes » = commandes non annulées (payées ou non)."""
        from apps.messaging.models import Message

        now = timezone.now()
        sales = Order.objects.exclude(status='cancelled')

        weeks = []
        for i in range(7, -1, -1):
            start, end = now - timedelta(weeks=i + 1), now - timedelta(weeks=i)
            week = sales.filter(created_at__gt=start, created_at__lte=end)
            agg = week.aggregate(total=Sum('total'), count=Count('id'))
            paid = week.filter(paid=True).aggregate(s=Sum('total'))['s'] or 0
            weeks.append({
                'week': 'Cette sem.' if i == 0 else f'S-{i}',
                'sales': float(agg['total'] or 0),
                'revenue': float(paid),
                'orders': agg['count'],
            })

        by_category = (
            OrderItem.objects.exclude(order__status='cancelled')
            .values('product__category__name')
            .annotate(total=Sum(F('quantity') * F('unit_price')), quantity=Sum('quantity'))
            .order_by('-total')
        )
        low_stock = (
            Product.objects.filter(is_active=True, stock__lte=LOW_STOCK_THRESHOLD)
            .order_by('stock')
            .values('id', 'name', 'stock')[:5]
        )
        status_counts = dict(Order.objects.values_list('status').annotate(c=Count('id')))

        return Response({
            'total_orders': Order.objects.count(),
            'total_sales': float(sales.aggregate(s=Sum('total'))['s'] or 0),
            'total_revenue': float(Order.objects.filter(paid=True).aggregate(s=Sum('total'))['s'] or 0),
            'orders_last_30d': Order.objects.filter(created_at__gte=now - timedelta(days=30)).count(),
            'average_order': float(sales.aggregate(s=Sum('total'))['s'] or 0) / max(sales.count(), 1),
            'status_counts': {key: status_counts.get(key, 0) for key, _ in Order.STATUS_CHOICES},
            'revenue_per_week': weeks,
            'sales_by_category': [
                {'name': row['product__category__name'] or 'Sans catégorie',
                 'total': float(row['total'] or 0), 'quantity': row['quantity']}
                for row in by_category
            ],
            'low_stock': list(low_stock),
            'low_stock_threshold': LOW_STOCK_THRESHOLD,
            'unread_messages': Message.objects.filter(is_read=False, is_from_admin=False).count(),
        })
