from decimal import Decimal

from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.orders.models import Order
from apps.products.models import Product
from apps.shipping.models import ShippingMethod
from .models import AppSetting


class ShopSettingsTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user('admin', password='Ancien-mdp-123', is_staff=True)

    def test_public_settings_have_defaults_and_hide_private_ones(self):
        r = self.client.get('/api/settings/public/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['color_primary'], '#D4AF37')
        self.assertNotIn('notify_new_order', r.data)

    def test_admin_saves_colors_and_public_endpoint_reflects_them(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post('/api/settings/shop/', {'shop_name': 'Maison Awa', 'color_primary': '#059669'}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.client.force_authenticate(None)
        r = self.client.get('/api/settings/public/')
        self.assertEqual(r.data['shop_name'], 'Maison Awa')
        self.assertEqual(r.data['color_primary'], '#059669')

    def test_invalid_color_or_unknown_key_is_rejected(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post('/api/settings/shop/', {'color_primary': 'vert'}, format='json').status_code, 400)
        self.assertEqual(self.client.post('/api/settings/shop/', {'hack': '1'}, format='json').status_code, 400)

    def test_anonymous_cannot_save_settings(self):
        self.assertEqual(self.client.post('/api/settings/shop/', {'shop_name': 'X'}, format='json').status_code, 401)

    def test_change_password(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post('/api/auth/change-password/', {'current_password': 'faux', 'new_password': 'Nouveau-mdp-456'}, format='json')
        self.assertEqual(r.status_code, 400)
        r = self.client.post('/api/auth/change-password/', {'current_password': 'Ancien-mdp-123', 'new_password': 'Nouveau-mdp-456'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.check_password('Nouveau-mdp-456'))


class ProductOptionsOrderTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user('admin', password='x', is_staff=True)
        self.product = Product.objects.create(name='Sac', sale_price=Decimal('100.00'), stock=10, options=[
            {'name': 'Couleur', 'type': 'color', 'values': [
                {'label': 'Noir', 'hex': '#000000', 'price_delta': 0, 'image': ''},
                {'label': 'Or', 'hex': '#D4AF37', 'price_delta': 20, 'image': ''},
            ]},
        ])
        self.shipping = ShippingMethod.objects.create(name='Standard', price=Decimal('9.90'))

    def order(self, options, **extra):
        data = {
            'customer_email': 'a@example.com', 'customer_name': 'Awa', 'customer_phone': '0600',
            'address_line1': '1 rue', 'city': 'Paris', 'postal_code': '75001', 'country': 'FR',
            'payment_method': 'stripe', 'shipping_method_id': self.shipping.id,
            'items': [{'product_id': self.product.id, 'quantity': 2, 'options': options}],
        }
        data.update(extra)
        return self.client.post('/api/orders/', data, format='json')

    def test_option_price_delta_and_choice_are_saved(self):
        r = self.order({'Couleur': 'Or'})
        self.assertEqual(r.status_code, 201, r.data)
        item = Order.objects.get().items.get()
        self.assertEqual(item.unit_price, Decimal('120.00'))
        self.assertEqual(item.options, {'Couleur': 'Or'})

    def test_missing_or_unknown_option_is_rejected(self):
        self.assertEqual(self.order({}).status_code, 400)
        self.assertEqual(self.order({'Couleur': 'Rose'}).status_code, 400)
        self.assertFalse(Order.objects.exists())

    def test_free_shipping_threshold(self):
        AppSetting.objects.create(key='free_shipping_threshold', value='150')
        self.order({'Couleur': 'Noir'})
        self.assertEqual(Order.objects.get().shipping_cost, 0)

    def test_admin_cannot_save_invalid_options(self):
        self.client.force_authenticate(self.admin)
        bad = [{'name': 'Couleur', 'type': 'color', 'values': [{'label': 'Noir', 'hex': 'noir'}]}]
        r = self.client.patch(f'/api/products/{self.product.id}/', {'options': bad}, format='json')
        self.assertEqual(r.status_code, 400)
