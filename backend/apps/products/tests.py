from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Product


class ProductSearchTests(APITestCase):
    def setUp(self):
        Product.objects.create(name='Montre dorée', sale_price=300)
        Product.objects.create(name='Sac cuir', sale_price=100)
        Product.objects.create(name='Montre cachée', sale_price=50, is_active=False)

    def names(self, response):
        return [p['name'] for p in response.data['results']]

    def test_search_filters_products(self):
        r = self.client.get('/api/products/', {'search': 'montre'})
        self.assertEqual(self.names(r), ['Montre dorée'])

    def test_ordering_by_price(self):
        r = self.client.get('/api/products/', {'ordering': 'sale_price'})
        self.assertEqual(self.names(r), ['Sac cuir', 'Montre dorée'])

    def test_staff_sees_inactive_products(self):
        self.client.force_authenticate(User.objects.create_user('a', password='x', is_staff=True))
        r = self.client.get('/api/products/', {'search': 'montre'})
        self.assertEqual(len(r.data['results']), 2)
