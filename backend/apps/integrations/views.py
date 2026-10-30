# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.conf import settings
from decimal import Decimal, InvalidOperation
import stripe

from .cj_service import CJDropshippingService
from apps.products.models import Product, Category

stripe.api_key = settings.STRIPE_SECRET_KEY


class CJImportProductsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        service = CJDropshippingService()
        try:
            page = int(request.data.get('page', 1))
            # Marge en % appliquée au prix CJ (paramètre > réglage CJ_DEFAULT_MARGIN)
            margin = Decimal(str(request.data.get('margin', settings.CJ_DEFAULT_MARGIN)))
        except (TypeError, ValueError, InvalidOperation):
            return Response({'detail': 'Paramètres page/margin invalides'}, status=400)

        category = None
        category_slug = request.data.get('category')
        if category_slug:
            category = Category.objects.filter(slug=category_slug).first()
            if category is None:
                return Response({'detail': f'Catégorie « {category_slug} » introuvable'}, status=400)

        data = service.list_products(page=page, page_size=20)
        if not data.get('result'):
            return Response({'detail': data.get('message', 'Erreur CJ')}, status=400)

        imported = 0
        for item in data.get('data', {}).get('list', []):
            cj_id = str(item.get('pid'))
            try:
                base_price = Decimal(str(item.get('sellPrice') or 0))
            except InvalidOperation:
                # CJ renvoie parfois une fourchette "1.20 -- 3.50" : on garde le prix haut
                base_price = Decimal(str(item.get('sellPrice')).split('--')[-1].strip() or 0)
            defaults = {
                'name': item.get('productNameEn', 'Sans nom'),
                'sku': item.get('productSku', ''),
                'base_price': base_price,
                'sale_price': (base_price * (1 + margin / 100)).quantize(Decimal('0.01')),
                'main_image': item.get('productImage', ''),
                'images': item.get('productImageSet', []),
            }
            product, created = Product.objects.update_or_create(cj_product_id=cj_id, defaults=defaults)
            if created:
                # Nouveaux produits : inactifs, à activer manuellement après vérification
                product.is_active = False
                product.category = category
                product.save(update_fields=['is_active', 'category'])
            imported += 1
        return Response({'imported': imported})


class StripeCreatePaymentIntentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        amount = int(float(request.data.get('amount', 0)) * 100)  # cents
        if amount <= 0:
            return Response({'detail': 'Montant invalide'}, status=400)
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='eur',
                automatic_payment_methods={'enabled': True},
            )
            return Response({'client_secret': intent.client_secret})
        except Exception as e:
            return Response({'detail': str(e)}, status=400)
