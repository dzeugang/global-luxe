from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    # ✅ Image principale (URL OU fichier uploadé)
    image = models.URLField(blank=True, null=True, help_text="URL de l'image principale")
    image_file = models.ImageField(
        upload_to='categories/',
        blank=True,
        null=True,
        help_text="Ou uploader un fichier image"
    )

    # ✅ Bannière (URL OU fichier uploadé)
    banner = models.URLField(blank=True, null=True, help_text="URL de la bannière")
    banner_file = models.ImageField(
        upload_to='categories/banners/',
        blank=True,
        null=True,
        help_text="Ou uploader un fichier bannière"
    )

    description = models.TextField(blank=True, help_text="Description de la catégorie")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def image_url(self):
        """Retourne l'URL effective de l'image (fichier ou URL)."""
        if self.image_file:
            return self.image_file.url
        return self.image or ''

    @property
    def banner_url(self):
        """Retourne l'URL effective de la bannière."""
        if self.banner_file:
            return self.banner_file.url
        return self.banner or ''

class Product(models.Model):
    cj_product_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    cj_variant_id = models.CharField(max_length=100, blank=True, help_text="VID CJ de la variante commandée")
    sku = models.CharField(max_length=100, blank=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, blank=True)
    description = models.TextField(blank=True)
    main_image = models.URLField(blank=True)
    images = models.JSONField(default=list, blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:280]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name