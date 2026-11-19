from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.products.models import Category, Product
from apps.shipping.models import ShippingMethod
from .models import Order


class OrderCreateTests(APITestCase):
    def setUp(self):
        cache.clear()  # remet à zéro les compteurs de throttling
        cat = Category.objects.create(name='Montres')
        self.product = Product.objects.create(name='Montre', sale_price=Decimal('100.00'), stock=5, category=cat)
        self.shipping = ShippingMethod.objects.create(name='Standard', price=Decimal('9.90'))
        self.admin = User.objects.create_user('admin', password='x', is_staff=True)

    def payload(self, **overrides):
        data = {
            'customer_email': 'client@example.com',
            'customer_name': 'Client Test',
            'customer_phone': '0600000000',
            'address_line1': '1 rue de Paris',
            'city': 'Paris',
            'postal_code': '75001',
            'country': 'France',
            'payment_method': 'stripe',
            'shipping_method_id': self.shipping.id,
            'items': [{'product_id': self.product.id, 'quantity': 2}],
        }
        data.update(overrides)
        return data

    def test_create_order_computes_total_and_decrements_stock(self):
        r = self.client.post('/api/orders/', self.payload(), format='json')
        self.assertEqual(r.status_code, 201, r.data)
        order = Order.objects.get()
        self.assertEqual(order.total, Decimal('209.90'))
        self.assertEqual(order.country, 'FR')
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)

    def test_duplicate_lines_are_merged(self):
        items = [{'product_id': self.product.id, 'quantity': 1}] * 2
        r = self.client.post('/api/orders/', self.payload(items=items), format='json')
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(Order.objects.get().items.get().quantity, 2)

    def test_insufficient_stock_is_rejected(self):
        items = [{'product_id': self.product.id, 'quantity': 6}]
        r = self.client.post('/api/orders/', self.payload(items=items), format='json')
        self.assertEqual(r.status_code, 400)
        self.assertFalse(Order.objects.exists())
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)

    def test_unknown_or_inactive_product_returns_400(self):
        inactive = Product.objects.create(name='Off', sale_price=1, stock=5, is_active=False)
        for pid in (9999, inactive.id):
            r = self.client.post('/api/orders/', self.payload(items=[{'product_id': pid, 'quantity': 1}]), format='json')
            self.assertEqual(r.status_code, 400)
        self.assertFalse(Order.objects.exists())

    def test_empty_cart_and_unknown_country_are_rejected(self):
        self.assertEqual(self.client.post('/api/orders/', self.payload(items=[]), format='json').status_code, 400)
        self.assertEqual(self.client.post('/api/orders/', self.payload(country='Atlantide'), format='json').status_code, 400)

    def test_invalid_shipping_method_returns_400(self):
        r = self.client.post('/api/orders/', self.payload(shipping_method_id=9999), format='json')
        self.assertEqual(r.status_code, 400)

    def test_cancel_restores_stock(self):
        self.client.post('/api/orders/', self.payload(), format='json')
        order = Order.objects.get()
        self.client.force_authenticate(self.admin)
        r = self.client.post(f'/api/orders/{order.id}/update_status/', {'status': 'cancelled'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)


class AdminPermissionTests(APITestCase):
    def test_non_staff_user_cannot_access_admin_endpoints(self):
        user = User.objects.create_user('client', password='x')
        self.client.force_authenticate(user)
        for url in ('/api/orders/', '/api/customers/', '/api/settings/', '/api/media/', '/api/messages/'):
            self.assertEqual(self.client.get(url).status_code, 403, url)

    def test_staff_user_can_access_admin_endpoints(self):
        self.client.force_authenticate(User.objects.create_user('admin', password='x', is_staff=True))
        self.assertEqual(self.client.get('/api/orders/').status_code, 200)

    def test_anonymous_cannot_list_orders(self):
        self.assertEqual(self.client.get('/api/orders/').status_code, 401)


class SendToCJTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user('admin', password='x', is_staff=True)
        self.product = Product.objects.create(name='Sac', sale_price=50, stock=5, cj_product_id='PID-1')
        self.order = Order.objects.create(
            customer_email='c@example.com', customer_name='C', customer_phone='1',
            address_line1='a', city='Lyon', postal_code='69000', country='France',
        )
        self.order.items.create(product=self.product, quantity=1, unit_price=50)
        self.client.force_authenticate(self.admin)

    @patch('apps.integrations.cj_service.CJDropshippingService._get_token', return_value='tok')
    @patch('apps.integrations.cj_service.requests')
    def test_send_uses_variant_id_and_iso_country(self, mock_requests, _token):
        mock_requests.get.return_value.json.return_value = {'result': True, 'data': [{'vid': 'VID-9'}]}
        mock_requests.post.return_value.json.return_value = {'result': True, 'data': {'orderId': 'CJ-1'}}

        r = self.client.post(f'/api/orders/{self.order.id}/send_to_cj/')

        self.assertEqual(r.status_code, 200, r.data)
        payload = mock_requests.post.call_args.kwargs['json']
        self.assertEqual(payload['shippingCountryCode'], 'FR')
        self.assertEqual(payload['products'], [{'vid': 'VID-9', 'quantity': 1}])
        self.product.refresh_from_db()
        self.assertEqual(self.product.cj_variant_id, 'VID-9')
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'sent_to_cj')

    def test_product_not_linked_to_cj_is_reported(self):
        self.product.cj_product_id = None
        self.product.save()
        r = self.client.post(f'/api/orders/{self.order.id}/send_to_cj/')
        self.assertEqual(r.status_code, 400)
        self.assertIn('non liés à CJ', r.data['detail'])


class TrackingAndNotificationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user('admin', password='x', is_staff=True)
        self.product = Product.objects.create(name='Bague', sale_price=80, stock=3)
        self.order = Order.objects.create(
            customer_email='Client@Example.com', customer_name='Awa', customer_phone='1',
            address_line1='a', city='Dakar', postal_code='1', country='SN', total=80,
        )
        self.order.items.create(product=self.product, quantity=1, unit_price=80)

    def test_track_with_matching_email(self):
        r = self.client.post('/api/orders/track/', {'order_id': self.order.id, 'email': 'client@example.com'}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data['status_label'], 'En attente')
        self.assertNotIn('customer_phone', r.data)
        self.assertNotIn('cj_response', r.data)

    def test_track_with_wrong_email_is_404(self):
        r = self.client.post('/api/orders/track/', {'order_id': self.order.id, 'email': 'autre@example.com'}, format='json')
        self.assertEqual(r.status_code, 404)

    def test_status_change_emails_customer(self):
        from django.core import mail
        self.client.force_authenticate(self.admin)
        self.client.post(f'/api/orders/{self.order.id}/set_tracking/', {'tracking_number': 'LP123'}, format='json')
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'shipped')
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('LP123', mail.outbox[0].body)

    def test_stats_contains_dashboard_data(self):
        self.client.force_authenticate(self.admin)
        r = self.client.get('/api/orders/stats/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['total_sales'], 80.0)
        self.assertEqual(r.data['status_counts']['pending'], 1)
        self.assertEqual(r.data['low_stock'][0]['name'], 'Bague')
        self.assertEqual(len(r.data['revenue_per_week']), 8)

    def test_admin_search_by_email(self):
        self.client.force_authenticate(self.admin)
        r = self.client.get('/api/orders/', {'search': 'example.com'})
        self.assertEqual(r.data['count'], 1)

    def test_deleting_ordered_product_deactivates_it(self):
        self.client.force_authenticate(self.admin)
        r = self.client.delete(f'/api/products/{self.product.id}/')
        self.assertEqual(r.status_code, 200)
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_active)


class ContactFormTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_public_contact_cannot_impersonate_admin(self):
        from apps.messaging.models import Message
        r = self.client.post('/api/messages/', {
            'customer_name': 'Awa', 'customer_email': 'awa@example.com',
            'subject': 'Question', 'content': 'Bonjour', 'is_from_admin': True, 'is_read': True,
        }, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        msg = Message.objects.get()
        self.assertFalse(msg.is_from_admin)
        self.assertFalse(msg.is_read)
