# apps/shipping/views.py
from rest_framework import viewsets, permissions
from .models import ShippingMethod
from .serializers import ShippingMethodSerializer


class ShippingMethodViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour les méthodes de livraison.
    - GET    /api/shipping/         (list)
    - POST   /api/shipping/         (create — admin)
    - GET    /api/shipping/{id}/    (retrieve)
    - PATCH  /api/shipping/{id}/    (partial_update — admin)
    - DELETE /api/shipping/{id}/    (destroy — admin)
    """
    serializer_class = ShippingMethodSerializer

    def get_queryset(self):
        qs = ShippingMethod.objects.all()
        # Public ne voit que les méthodes actives
        if self.action in ['list', 'retrieve'] and not self.request.user.is_staff:
            qs = qs.filter(is_active=True)
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]