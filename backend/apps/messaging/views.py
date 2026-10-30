from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from django.core.mail import send_mail
from django.conf import settings
from .models import Message
from .serializers import MessageSerializer


class MessageViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour les messages.
    Endpoints disponibles :
    - GET    /api/messages/                  (list)
    - POST   /api/messages/                  (create, public — contact form)
    - GET    /api/messages/{id}/             (retrieve)
    - PATCH  /api/messages/{id}/             (partial_update)
    - DELETE /api/messages/{id}/             (destroy)
    - POST   /api/messages/{id}/reply/       (custom action — envoyer réponse)
    - POST   /api/messages/{id}/mark_read/   (custom action — marquer lu)
    - POST   /api/messages/{id}/mark_unread/ (custom action — marquer non lu)
    - GET    /api/messages/unread_count/     (custom action — nombre non lus)
    """
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

    def get_permissions(self):
        # Le formulaire de contact public peut créer un message
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_throttles(self):
        # Limite les envois du formulaire de contact public (anti-spam)
        if self.action == 'create':
            self.throttle_scope = 'public_create'
            return [ScopedRateThrottle()]
        return super().get_throttles()

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Envoie une réponse au client par email + enregistre le message."""
        original = self.get_object()
        content = request.data.get('content', '').strip()

        if not content:
            return Response({'detail': 'Le contenu est requis'}, status=400)

        # Créer le message de réponse
        msg = Message.objects.create(
            customer_email=original.customer_email,
            customer_name=original.customer_name,
            subject=f"Re: {original.subject}",
            content=content,
            is_from_admin=True,
            is_read=True,
        )

        # Envoyer l'email
        try:
            send_mail(
                subject=msg.subject,
                message=content,
                from_email=settings.EMAIL_FROM,
                recipient_list=[original.customer_email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({
                'detail': f"Message créé mais email non envoyé : {str(e)}",
                'message': MessageSerializer(msg).data,
            }, status=207)

        return Response(MessageSerializer(msg).data, status=201)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        msg = self.get_object()
        msg.is_read = True
        msg.save(update_fields=['is_read'])
        return Response({'status': 'ok', 'is_read': True})

    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        msg = self.get_object()
        msg.is_read = False
        msg.save(update_fields=['is_read'])
        return Response({'status': 'ok', 'is_read': False})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Message.objects.filter(is_read=False, is_from_admin=False).count()
        return Response({'unread_count': count})