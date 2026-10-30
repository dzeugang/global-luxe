import os
from rest_framework import viewsets, permissions, parsers
from rest_framework.response import Response
from .models import MediaFile
from .serializers import MediaFileSerializer


class MediaFileViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour les fichiers médias.
    Endpoints disponibles :
    - GET    /api/media/         (list)
    - POST   /api/media/         (create — upload)
    - GET    /api/media/{id}/    (retrieve)
    - PATCH  /api/media/{id}/    (partial_update)
    - DELETE /api/media/{id}/    (destroy — supprime BD + fichier disque)
    """
    queryset = MediaFile.objects.all().order_by('-created_at')
    serializer_class = MediaFileSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def perform_create(self, serializer):
        """Détecte automatiquement le type MIME du fichier."""
        instance = serializer.save()
        if instance.file and not instance.file_type:
            ext = os.path.splitext(instance.file.name)[1].lower().lstrip('.')
            instance.file_type = ext
            if not instance.name:
                instance.name = os.path.basename(instance.file.name)
            instance.save()

    def perform_destroy(self, instance):
        """Supprime le fichier du disque ET l'entrée en BD."""
        if instance.file:
            try:
                if os.path.isfile(instance.file.path):
                    os.remove(instance.file.path)
            except Exception as e:
                print(f"Erreur suppression fichier : {e}")
        instance.delete()