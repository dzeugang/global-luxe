from rest_framework import serializers
from .models import Product, Category


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


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'description', 'main_image', 'images',
            'sale_price', 'base_price', 'stock',
            'category', 'category_name', 'category_slug',
            'is_featured', 'is_best_seller', 'is_active',
            'rating', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class ProductDetailSerializer(serializers.ModelSerializer):
    category_data = CategorySerializer(source='category', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']