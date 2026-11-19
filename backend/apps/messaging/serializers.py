from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

class ContactMessageSerializer(serializers.ModelSerializer):
    """Formulaire de contact public : seuls les champs saisis par le visiteur."""
    class Meta:
        model = Message
        fields = ['id', 'customer_name', 'customer_email', 'subject', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {'customer_name': {'required': True, 'allow_blank': False}}
