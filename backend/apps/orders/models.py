from django.db import models


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En préparation'),
        ('sent_to_cj', 'Transmise au fournisseur'),
        ('shipped', 'Expédiée'),
        ('delivered', 'Livrée'),
        ('cancelled', 'Annulée'),
    ]
    PAYMENT_METHODS = [
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
    ]

    # Client info (no account required)
    customer_email = models.EmailField()
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=30)
    # Shipping address
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=120)
    # Order
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='stripe')
    payment_intent_id = models.CharField(max_length=200, blank=True)
    paid = models.BooleanField(default=False)
    # Shipping
    shipping_method = models.ForeignKey('shipping.ShippingMethod', null=True, blank=True, on_delete=models.SET_NULL)
    tracking_number = models.CharField(max_length=200, blank=True)
    # CJ
    cj_order_id = models.CharField(max_length=200, blank=True)
    cj_response = models.JSONField(default=dict, blank=True)
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.customer_email}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    options = models.JSONField(default=dict, blank=True)  # ex. {"Couleur": "Noir", "Taille": "M"}

    @property
    def options_label(self):
        return ', '.join(f'{k} : {v}' for k, v in (self.options or {}).items())

    @property
    def total(self):
        return self.quantity * self.unit_price