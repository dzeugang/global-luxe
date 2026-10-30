from rest_framework import serializers
from .models import MediaFile


class MediaFileSerializer(serializers.ModelSerializer):
    file = serializers.FileField(use_url=True)

    class Meta:
        model = MediaFile
        fields = ['id', 'name', 'file', 'file_type', 'created_at']
        read_only_fields = ['id', 'file_type', 'created_at']