import re
from decimal import Decimal, InvalidOperation

from rest_framework import serializers
from .models import Product, Category

HEX_COLOR = re.compile(r'^#[0-9a-fA-F]{6}$')


def clean_options(groups):
    """Valide et normalise les options d'un produit (couleurs, tailles…)."""
    if not isinstance(groups, list):
        raise serializers.ValidationError('Liste attendue.')
    cleaned, names = [], set()
    for group in groups:
        if not isinstance(group, dict):
            raise serializers.ValidationError('Chaque option doit être un objet.')
        name = str(group.get('name', '')).strip()
        kind = group.get('type', 'text')
        if not name:
            raise serializers.ValidationError("Chaque option doit avoir un nom (ex. « Couleur »).")
        if name in names:
            raise serializers.ValidationError(f"L'option « {name} » est en double.")
        if kind not in ('color', 'text'):
            raise serializers.ValidationError(f"Type d'option inconnu : {kind}.")
        names.add(name)
        values, labels = [], set()
        for v in group.get('values') or []:
            label = str((v or {}).get('label', '')).strip()
            if not label:
                raise serializers.ValidationError(f"Une valeur de « {name} » n'a pas de libellé.")
            if label in labels:
                raise serializers.ValidationError(f"« {label} » est en double dans « {name} ».")
            labels.add(label)
            try:
                delta = Decimal(str(v.get('price_delta') or 0))
            except InvalidOperation:
                raise serializers.ValidationError(f"Supplément de prix invalide pour « {label} ».")
            value = {'label': label, 'price_delta': float(delta), 'image': str(v.get('image') or '').strip()}
            if kind == 'color':
                hex_ = str(v.get('hex') or '').strip()
                if not HEX_COLOR.match(hex_):
                    raise serializers.ValidationError(f"Couleur invalide pour « {label} » (format #RRGGBB).")
                value['hex'] = hex_
            values.append(value)
        if not values:
            raise serializers.ValidationError(f"L'option « {name} » n'a aucune valeur.")
        cleaned.append({'name': name, 'type': kind, 'values': values})
    return cleaned


class ProductContentValidationMixin:
    def validate_options(self, value):
        return clean_options(value)

    def validate_features(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Liste attendue.')
        return [str(f).strip() for f in value if str(f).strip()]

    def validate_specs(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Liste attendue.')
        return [
            {'label': str(s.get('label', '')).strip(), 'value': str(s.get('value', '')).strip()}
            for s in value if isinstance(s, dict) and str(s.get('label', '')).strip()
        ]


class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(source='products.count', read_only=True)
    image_url = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug',
            'image', 'image_file', 'image_url',         # ✅ NOUVEAU
            'banner', 'banner_file', 'banner_url',      # ✅ NOUVEAU
            'description', 'order', 'is_active',
            'products_count', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'products_count', 'created_at', 'image_url', 'banner_url']

    def get_image_url(self, obj):
        """Renvoie l'URL effective de l'image."""
        request = self.context.get('request')
        if obj.image_file:
            url = obj.image_file.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return obj.image or ''

    def get_banner_url(self, obj):
        """Renvoie l'URL effective de la bannière."""
        request = self.context.get('request')
        if obj.banner_file:
            url = obj.banner_file.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return obj.banner or ''


class ProductListSerializer(ProductContentValidationMixin, serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'description', 'main_image', 'images',
            'sale_price', 'base_price', 'stock',
            'category', 'category_name', 'category_slug',
            'is_featured', 'is_best_seller', 'is_active',
            'rating', 'options', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class ProductDetailSerializer(ProductContentValidationMixin, serializers.ModelSerializer):
    category_data = CategorySerializer(source='category', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']