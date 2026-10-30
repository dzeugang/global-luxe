"""
Script pour mettre à jour UNIQUEMENT les images des catégories.

Usage :
    cd backend
    python manage.py seed_category_images
"""
from django.core.management.base import BaseCommand
from apps.products.models import Category


# ============================================
# 🖼️ IMAGES PAR CATÉGORIE (URL Unsplash)
# ============================================
CATEGORY_IMAGES = {
    'smartphones': {
        'name': 'Smartphones',
        'image': 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=800&q=80',
        'banner': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1920&q=80',
    },
    'audio': {
        'name': 'Audio',
        'image': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        'banner': 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1920&q=80',
    },
    'montres': {
        'name': 'Montres',
        'image': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        'banner': 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=1920&q=80',
    },
    'beauty': {
        'name': 'Beauté',
        'image': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
        'banner': 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920&q=80',
    },
    'home': {
        'name': 'Maison',
        'image': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
        'banner': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
    },
    'fashion': {
        'name': 'Mode',
        'image': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
        'banner': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80',
    },
    'photo': {
        'name': 'Photo',
        'image': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
        'banner': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=1920&q=80',
    },
    'gaming': {
        'name': 'Gaming',
        'image': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
        'banner': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1920&q=80',
    },
}


class Command(BaseCommand):
    help = 'Met à jour les images des catégories'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Mise à jour des images de catégories...'))

        updated = 0
        for slug, data in CATEGORY_IMAGES.items():
            try:
                category = Category.objects.get(slug=slug)
                category.image = data['image']
                category.save()
                self.stdout.write(self.style.SUCCESS(
                    f'  ✅ {category.name} → image mise à jour'
                ))
                updated += 1
            except Category.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f'  ⚠️  Catégorie "{slug}" introuvable'
                ))

        self.stdout.write(self.style.SUCCESS(
            f'\n🎉 {updated} image(s) mise(s) à jour !'
        ))