import requests
from django.conf import settings
from django.core.cache import cache


class CJDropshippingService:
    """Service d'intégration avec l'API CJ Dropshipping v2.0"""

    def __init__(self):
        self.base = settings.CJ_API_BASE
        self.email = settings.CJ_EMAIL
        self.api_key = settings.CJ_API_KEY

    def _get_token(self):
        token = cache.get('cj_access_token')
        if token:
            return token
        try:
            r = requests.post(
                f"{self.base}/authentication/getAccessToken",
                json={'email': self.email, 'password': self.api_key},
                timeout=20,
            )
            data = r.json()
            if data.get('result'):
                token = data['data']['accessToken']
                cache.set('cj_access_token', token, 60 * 60 * 4)  # 4h cache
                return token
        except Exception as e:
            print(f"CJ auth error: {e}")
        return None

    def _headers(self):
        return {'CJ-Access-Token': self._get_token() or '', 'Content-Type': 'application/json'}

    def list_products(self, page=1, page_size=20):
        try:
            r = requests.get(
                f"{self.base}/product/list",
                headers=self._headers(),
                params={'pageNum': page, 'pageSize': page_size},
                timeout=30,
            )
            return r.json()
        except Exception as e:
            return {'result': False, 'message': str(e)}

    def get_variants(self, pid):
        """Liste les variantes (vid) d'un produit CJ."""
        try:
            r = requests.get(
                f"{self.base}/product/variant/query",
                headers=self._headers(),
                params={'pid': pid},
                timeout=30,
            )
            data = r.json()
            if not data.get('result'):
                return []
            return data.get('data') or []
        except Exception as e:
            print(f"CJ variant error: {e}")
            return []

    def resolve_variant_id(self, product):
        """Retourne le vid CJ du produit, en le récupérant (et le mémorisant) si besoin."""
        if product.cj_variant_id:
            return product.cj_variant_id
        if not product.cj_product_id:
            return None
        variants = self.get_variants(product.cj_product_id)
        if not variants:
            return None
        vid = str(variants[0].get('vid', ''))
        if vid:
            product.cj_variant_id = vid
            product.save(update_fields=['cj_variant_id'])
        return vid or None

    def create_order(self, order):
        """Envoie une commande à CJ."""
        from .countries import to_iso2

        country_code = to_iso2(order.country)
        if not country_code:
            return {'success': False, 'error': f"Code pays introuvable pour « {order.country} »."}

        products, missing = [], []
        for item in order.items.select_related('product'):
            if not item.product.cj_product_id:
                missing.append(item.product.name)
                continue
            vid = self.resolve_variant_id(item.product)
            if not vid:
                return {'success': False, 'error': f"Variante CJ introuvable pour « {item.product.name} »."}
            products.append({'vid': vid, 'quantity': item.quantity})
        if missing:
            return {'success': False, 'error': f"Produits non liés à CJ : {', '.join(missing)}."}

        try:
            payload = {
                'orderNumber': f"GL-{order.id}",
                'shippingCountryCode': country_code,
                'shippingProvince': '',
                'shippingCity': order.city,
                'shippingAddress': order.address_line1,
                'shippingAddress2': order.address_line2,
                'shippingZip': order.postal_code,
                'shippingCustomerName': order.customer_name,
                'shippingPhone': order.customer_phone,
                'email': order.customer_email,
                'remark': '',
                'products': products,
            }
            r = requests.post(
                f"{self.base}/shopping/order/createOrder",
                json=payload,
                headers=self._headers(),
                timeout=30,
            )
            data = r.json()
            if data.get('result'):
                return {
                    'success': True,
                    'cj_order_id': data.get('data', {}).get('orderId', ''),
                    'raw': data,
                }
            return {'success': False, 'error': data.get('message', 'Erreur inconnue'), 'raw': data}
        except Exception as e:
            return {'success': False, 'error': str(e)}