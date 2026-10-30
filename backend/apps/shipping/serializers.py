# apps/shipping/serializers.py
from rest_framework import serializers
from .models import ShippingMethod


class ShippingMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingMethod
        fields = '__all__'
        read_only_fields = ['id']