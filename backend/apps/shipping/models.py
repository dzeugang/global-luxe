from django.db import models

class ShippingMethod(models.Model):
    name = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_days = models.CharField(max_length=50, default='7-14 jours')
    cj_code = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['price', 'name']      # ← Ajouter cette ligne

    def __str__(self):
        return f"{self.name} - {self.price} €"