from django.db import transaction
from django.db.models import F
from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.models import Product


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.CharField(source='product.main_image', read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'unit_price', 'total']


class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'customer_email', 'total', 'status',
            'paid', 'created_at', 'items_count', 'tracking_number'
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    customer_email = serializers.EmailField()
    customer_name = serializers.CharField(max_length=255)
    customer_phone = serializers.CharField(max_length=30)
    address_line1 = serializers.CharField(max_length=255)
    address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=120)
    postal_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=120)
    shipping_method_id = serializers.IntegerField(required=False, allow_null=True)
    payment_method = serializers.ChoiceField(choices=['stripe', 'paypal'])
    items = OrderItemCreateSerializer(many=True, allow_empty=False)

    def validate_country(self, value):
        from apps.integrations.countries import to_iso2
        code = to_iso2(value)
        if not code:
            raise serializers.ValidationError('Pays inconnu. Utilisez un code ISO (ex : FR) ou un nom de pays.')
        return code

    def validate_items(self, items):
        # Fusionner les doublons d'un même produit
        merged = {}
        for item in items:
            merged[item['product_id']] = merged.get(item['product_id'], 0) + item['quantity']
        return [{'product_id': pid, 'quantity': qty} for pid, qty in merged.items()]

    def validate_shipping_method_id(self, value):
        if value is None:
            return value
        from apps.shipping.models import ShippingMethod
        if not ShippingMethod.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Méthode de livraison invalide.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        shipping_method_id = validated_data.pop('shipping_method_id', None)
        order = Order(**validated_data)

        # Verrouiller les lignes produits pour éviter les ventes concurrentes au-delà du stock
        ids = [item['product_id'] for item in items_data]
        products = Product.objects.select_for_update().filter(id__in=ids, is_active=True).in_bulk()

        subtotal = 0
        items_objects = []
        errors = []
        for item in items_data:
            product = products.get(item['product_id'])
            if product is None:
                errors.append(f"Produit #{item['product_id']} introuvable ou indisponible.")
                continue
            if product.stock < item['quantity']:
                errors.append(f"Stock insuffisant pour « {product.name} » ({product.stock} disponible(s)).")
                continue
            unit_price = product.sale_price
            subtotal += unit_price * item['quantity']
            items_objects.append((product, item['quantity'], unit_price))
        if errors:
            raise serializers.ValidationError({'items': errors})

        shipping_cost = 0
        if shipping_method_id:
            from apps.shipping.models import ShippingMethod
            sm = ShippingMethod.objects.get(id=shipping_method_id)
            order.shipping_method = sm
            shipping_cost = sm.price

        order.subtotal = subtotal
        order.shipping_cost = shipping_cost
        order.total = subtotal + shipping_cost
        order.save()

        for product, qty, price in items_objects:
            OrderItem.objects.create(order=order, product=product, quantity=qty, unit_price=price)
            Product.objects.filter(pk=product.pk).update(stock=F('stock') - qty)

        return order