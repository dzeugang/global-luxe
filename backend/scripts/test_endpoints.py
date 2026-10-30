"""
Script de test des endpoints CRUD.

Usage :
    cd backend
    python scripts/test_endpoints.py
"""
import os
import sys
import django

# Configurer Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'globalluxe.settings')
django.setup()

# IMPORTANT : autoriser 'testserver' AVANT toute requête
from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from django.test import Client
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

# ----- Setup -----
client = Client()
admin, created = User.objects.get_or_create(
    username='testadmin',
    defaults={'is_staff': True, 'is_superuser': True, 'email': 'test@admin.com'},
)
admin.set_password('testpass123')
admin.save()

token = str(RefreshToken.for_user(admin).access_token)
auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

# ----- Tests -----
endpoints = [
    # (METHOD, URL, expected_status, auth_required, post_data)
    ('GET',    '/api/products/',                          200, False, None),
    ('GET',    '/api/products/featured/',                 200, False, None),
    ('GET',    '/api/products/best_sellers/',             200, False, None),
    ('GET',    '/api/products/categories/',               200, False, None),
    ('POST',   '/api/products/categories/',               201, True,  {'name': 'TestCat_AUTO'}),
    ('GET',    '/api/orders/',                            200, True,  None),
    ('GET',    '/api/orders/stats/',                      200, True,  None),
    ('GET',    '/api/customers/',                         200, True,  None),
    ('GET',    '/api/messages/',                          200, True,  None),
    ('GET',    '/api/messages/unread_count/',             200, True,  None),
    ('GET',    '/api/media/',                             200, True,  None),
    ('GET',    '/api/shipping/',                          200, False, None),
    ('GET',    '/api/settings/',                          200, True,  None),
    ('GET',    '/api/docs/',                              200, False, None),
]

print("\n" + "=" * 72)
print("  TEST DES ENDPOINTS BACKEND")
print("=" * 72)

ok, ko = 0, 0
for method, url, expected, needs_auth, data in endpoints:
    headers = auth_headers if needs_auth else {}
    try:
        if method == 'GET':
            r = client.get(url, **headers)
        elif method == 'POST':
            r = client.post(url, data=data or {}, content_type='application/json', **headers)

        status_ok = r.status_code == expected
        mark = '[OK]' if status_ok else '[KO]'
        if status_ok:
            ok += 1
        else:
            ko += 1
        print(f"  {mark}  [{method:5}] {url:45} -> {r.status_code} (attendu {expected})")
    except Exception as e:
        ko += 1
        print(f"  [ERR] [{method:5}] {url:45} -> {type(e).__name__}: {e}")

print("=" * 72)
print(f"  RESULTAT : {ok} OK, {ko} KO")
print("=" * 72 + "\n")

# Nettoyage : supprimer la catégorie de test
try:
    from apps.products.models import Category
    Category.objects.filter(name='TestCat_AUTO').delete()
except Exception:
    pass