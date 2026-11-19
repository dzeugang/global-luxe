from django.db import transaction
from django.db.models import F
from rest_framework import serializers
from .models import Order, OrderItem
from decimal import Decimal

from apps.products.models import Product
from apps.settings_app.store import free_shipping_threshold


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    options_label = serializers.CharField(read_only=True)
    product_image = serializers.CharField(source='product.main_image', read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'unit_price', 'options', 'options_label', 'total']


class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'customer_email', 'total', 'status', 'status_label',
            'paid', 'created_at', 'items_count', 'tracking_number'
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    shipping_method_name = serializers.CharField(source='shipping_method.name', read_only=True, default='')

    class Meta:
        model = Order
        fields = '__all__'


class OrderTrackRequestSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(min_value=1)
    email = serializers.EmailField()


class OrderTrackSerializer(serializers.ModelSerializer):
    """Vue client d'une commande : sans données internes (CJ, paiement, téléphone)."""
    items = OrderItemSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    shipping_method_name = serializers.CharField(source='shipping_method.name', read_only=True, default='')

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'status', 'status_label', 'created_at', 'updated_at',
            'subtotal', 'shipping_cost', 'total', 'tracking_number', 'shipping_method_name',
            'city', 'postal_code', 'country', 'items',
        ]


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    options = serializers.DictField(child=serializers.CharField(), required=False, default=dict)


def resolve_options(product, chosen):
    """Vérifie les options choisies et renvoie (options normalisées, supplément de prix)."""
    groups = product.options or []
    chosen = chosen or {}
    unknown = set(chosen) - {g['name'] for g in groups}
    if unknown:
        raise serializers.ValidationError(f"Option inconnue pour « {product.name} » : {', '.join(unknown)}.")
    resolved, delta = {}, Decimal('0')
    for group in groups:
        label = chosen.get(group['name'])
        if not label:
            raise serializers.ValidationError(f"Choisissez « {group['name']} » pour « {product.name} ».")
        value = next((v for v in group['values'] if v['label'] == label), None)
        if value is None:
            raise serializers.ValidationError(f"« {label} » n'est pas disponible pour « {product.name} ».")
        resolved[group['name']] = label
        delta += Decimal(str(value.get('price_delta') or 0))
    return resolved, delta


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
        # Fusionner les doublons d'un même produit avec les mêmes options
        merged = {}
        for item in items:
            key = (item['product_id'], tuple(sorted((item.get('options') or {}).items())))
            merged[key] = merged.get(key, 0) + item['quantity']
        return [{'product_id': pid, 'options': dict(opts), 'quantity': qty} for (pid, opts), qty in merged.items()]

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
        # Le stock est global au produit : on cumule les quantités de toutes ses variantes
        wanted = {}
        for item in items_data:
            wanted[item['product_id']] = wanted.get(item['product_id'], 0) + item['quantity']
        for pid, qty in wanted.items():
            product = products.get(pid)
            if product is None:
                errors.append(f"Produit #{pid} introuvable ou indisponible.")
            elif product.stock < qty:
                errors.append(f"Stock insuffisant pour « {product.name} » ({product.stock} disponible(s)).")
        for item in items_data:
            product = products.get(item['product_id'])
            if product is None:
                continue
            try:
                options, delta = resolve_options(product, item.get('options'))
            except serializers.ValidationError as e:
                errors.extend(str(d) for d in e.detail)
                continue
            unit_price = product.sale_price + delta
            subtotal += unit_price * item['quantity']
            items_objects.append((product, item['quantity'], unit_price, options))
        if errors:
            raise serializers.ValidationError({'items': errors})

        shipping_cost = 0
        if shipping_method_id:
            from apps.shipping.models import ShippingMethod
            sm = ShippingMethod.objects.get(id=shipping_method_id)
            order.shipping_method = sm
            shipping_cost = sm.price

        threshold = free_shipping_threshold()
        if threshold is not None and subtotal >= threshold:
            shipping_cost = 0

        order.subtotal = subtotal
        order.shipping_cost = shipping_cost
        order.total = subtotal + shipping_cost
        order.save()

        for product, qty, price, options in items_objects:
            OrderItem.objects.create(order=order, product=product, quantity=qty, unit_price=price, options=options)
            Product.objects.filter(pk=product.pk).update(stock=F('stock') - qty)

        return order