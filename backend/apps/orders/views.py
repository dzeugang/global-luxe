# apps/orders/views.py
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F
from apps.products.models import Product
from django.conf import settings
from .models import Order
from .serializers import OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer
from apps.integrations.cj_service import CJDropshippingService

logger = logging.getLogger(__name__)


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
    """
    queryset = Order.objects.all().prefetch_related('items', 'items__product')

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        if self.action in ['retrieve', 'update', 'partial_update']:
            return OrderDetailSerializer
        return OrderListSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_throttles(self):
        # Limite les créations de commandes anonymes (anti-spam)
        if self.action == 'create':
            self.throttle_scope = 'public_create'
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        # Emails de confirmation
        try:
            send_mail(
                subject=f"Confirmation de commande #{order.id}",
                message=f"Merci {order.customer_name}, votre commande a bien été reçue.\nTotal : {order.total} €",
                from_email=settings.EMAIL_FROM,
                recipient_list=[order.customer_email],
                fail_silently=False,
            )
            send_mail(
                subject=f"Nouvelle commande #{order.id}",
                message=f"Nouvelle commande de {order.customer_name} ({order.customer_email}) - Total {order.total} €",
                from_email=settings.EMAIL_FROM,
                recipient_list=[settings.ADMIN_EMAIL],
                fail_silently=False,
            )
        except Exception:
            # La commande est enregistrée même si l'email échoue : on trace l'erreur
            logger.exception("Échec d'envoi des emails pour la commande #%s", order.id)

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
        if tracking and order.status == 'sent_to_cj':
            order.status = 'shipped'
        order.save()
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
            order.status = new_status
            order.save(update_fields=['status'])
        return Response(OrderDetailSerializer(order).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Sum
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        last_30 = now - timedelta(days=30)

        total_orders = Order.objects.count()
        total_revenue = Order.objects.filter(paid=True).aggregate(s=Sum('total'))['s'] or 0
        recent = Order.objects.filter(created_at__gte=last_30).count()

        weeks = []
        for i in range(7, -1, -1):
            start = now - timedelta(weeks=i + 1)
            end = now - timedelta(weeks=i)
            rev = Order.objects.filter(paid=True, created_at__range=(start, end)).aggregate(s=Sum('total'))['s'] or 0
            weeks.append({'week': f'S-{i}', 'revenue': float(rev)})

        return Response({
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'orders_last_30d': recent,
            'revenue_per_week': weeks,
        })