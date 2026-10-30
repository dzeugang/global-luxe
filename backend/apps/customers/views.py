# models.py - Customers are derived from orders, no explicit model needed
# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, Max
from apps.orders.models import Order


class CustomerListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        data = (
            Order.objects.values('customer_email', 'customer_name')
            .annotate(
                orders_count=Count('id'),
                total_spent=Sum('total'),
                last_order=Max('created_at'),
            )
            .order_by('-last_order')
        )
        return Response(list(data))


class CustomerDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, email):
        orders = Order.objects.filter(customer_email=email).order_by('-created_at')
        from apps.orders.serializers import OrderListSerializer
        return Response({
            'email': email,
            'orders_count': orders.count(),
            'total_spent': float(orders.aggregate(s=Sum('total'))['s'] or 0),
            'orders': OrderListSerializer(orders, many=True).data,
        })