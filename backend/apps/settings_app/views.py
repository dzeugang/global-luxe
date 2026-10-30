# apps/settings_app/views.py
from rest_framework import viewsets, permissions
from .models import AppSetting
from .serializers import AppSettingSerializer


class AppSettingViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour les paramètres applicatifs.
    Lookup par clé (string).
    - GET    /api/settings/          (list)
    - POST   /api/settings/          (create)
    - GET    /api/settings/{key}/    (retrieve)
    - PATCH  /api/settings/{key}/    (partial_update)
    - DELETE /api/settings/{key}/    (destroy)
    """
    queryset = AppSetting.objects.all()
    serializer_class = AppSettingSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'key'
    lookup_value_regex = '[^/]+'  # Permet les clés avec n'importe quel caractère sauf "/"