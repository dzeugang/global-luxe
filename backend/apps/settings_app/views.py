# apps/settings_app/views.py
import re

from django.conf import settings as django_settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AppSetting
from .serializers import AppSettingSerializer
from .store import ALL_DEFAULTS, PUBLIC_DEFAULTS, get_settings

HEX_COLOR = re.compile(r'^#[0-9a-fA-F]{6}$')


class AppSettingViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour les paramètres applicatifs.
    Lookup par clé (string).
    - GET    /api/settings/              (list)
    - POST   /api/settings/              (create)
    - GET    /api/settings/{key}/        (retrieve)
    - PATCH  /api/settings/{key}/        (partial_update)
    - DELETE /api/settings/{key}/        (destroy)
    - GET    /api/settings/public/       (public — identité, couleurs, SEO du site)
    - GET    /api/settings/shop/         (admin — tous les réglages de la boutique)
    - POST   /api/settings/shop/         (admin — enregistre plusieurs réglages d'un coup)
    - GET    /api/settings/status/       (admin — état des intégrations)
    - POST   /api/settings/test_email/   (admin — envoie un email de test)
    - POST   /api/settings/test_cj/      (admin — teste la connexion CJ)
    """
    queryset = AppSetting.objects.all()
    serializer_class = AppSettingSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'key'
    lookup_value_regex = '[^/]+'  # Permet les clés avec n'importe quel caractère sauf "/"

    def get_permissions(self):
        if self.action == 'public':
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def public(self, request):
        return Response(get_settings(list(PUBLIC_DEFAULTS)))

    @action(detail=False, methods=['get', 'post'])
    def shop(self, request):
        if request.method == 'GET':
            return Response(get_settings(list(ALL_DEFAULTS)))

        data = request.data if isinstance(request.data, dict) else {}
        unknown = [k for k in data if k not in ALL_DEFAULTS]
        if unknown:
            return Response({'detail': f"Paramètres inconnus : {', '.join(unknown)}"}, status=400)
        for key in ('color_primary', 'color_dark'):
            if key in data and not HEX_COLOR.match(str(data[key])):
                return Response({'detail': f'Couleur invalide pour {key} (format attendu : #RRGGBB)'}, status=400)

        for key, value in data.items():
            AppSetting.objects.update_or_create(key=key, defaults={'value': str(value).strip()})
        return Response(get_settings(list(ALL_DEFAULTS)))

    @action(detail=False, methods=['get'])
    def status(self, request):
        s = django_settings
        return Response({
            'stripe': bool(s.STRIPE_SECRET_KEY and s.STRIPE_PUBLIC_KEY),
            'stripe_mode': 'test' if s.STRIPE_SECRET_KEY.startswith('sk_test') else ('live' if s.STRIPE_SECRET_KEY else ''),
            'paypal': bool(s.PAYPAL_CLIENT_ID and s.PAYPAL_SECRET),
            'sendgrid': bool(s.SENDGRID_API_KEY),
            'cj': bool(s.CJ_EMAIL and s.CJ_API_KEY),
            'email_from': s.EMAIL_FROM,
            'admin_email': s.ADMIN_EMAIL,
            'email_backend': 'SendGrid' if s.SENDGRID_API_KEY else 'Console (développement)',
        })

    @action(detail=False, methods=['post'])
    def test_email(self, request):
        to = request.data.get('to') or request.user.email or django_settings.ADMIN_EMAIL
        try:
            send_mail(
                'Email de test',
                "Si vous lisez ce message, l'envoi d'emails de la boutique fonctionne.",
                django_settings.EMAIL_FROM, [to], fail_silently=False,
            )
        except Exception as e:
            return Response({'detail': f"Échec de l'envoi : {e}"}, status=400)
        return Response({'detail': f'Email de test envoyé à {to}.'})

    @action(detail=False, methods=['post'])
    def test_cj(self, request):
        from apps.integrations.cj_service import CJDropshippingService

        if not (django_settings.CJ_EMAIL and django_settings.CJ_API_KEY):
            return Response({'detail': 'Identifiants CJ absents du fichier .env (CJ_EMAIL, CJ_API_KEY).'}, status=400)
        data = CJDropshippingService().list_products(page=1, page_size=1)
        if data.get('result'):
            return Response({'detail': 'Connexion à CJ réussie.'})
        return Response({'detail': f"Connexion à CJ impossible : {data.get('message', 'erreur inconnue')}"}, status=400)


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ — l'admin connecté change son mot de passe."""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        current = request.data.get('current_password', '')
        new = request.data.get('new_password', '')
        if not request.user.check_password(current):
            return Response({'detail': 'Mot de passe actuel incorrect.'}, status=400)
        try:
            validate_password(new, request.user)
        except ValidationError as e:
            return Response({'detail': ' '.join(e.messages)}, status=400)
        request.user.set_password(new)
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Mot de passe mis à jour.'})
