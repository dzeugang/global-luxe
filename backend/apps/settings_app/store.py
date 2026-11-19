"""Paramètres de la boutique modifiables depuis l'admin (stockés dans AppSetting)."""
from decimal import Decimal, InvalidOperation

from .models import AppSetting

# Paramètres lisibles publiquement par le site (identité, apparence, SEO, livraison).
# Valeur = défaut utilisé tant que l'admin n'a rien enregistré.
PUBLIC_DEFAULTS = {
    'shop_name': 'Global Luxe',
    'shop_tagline': 'Boutique premium en ligne',
    'contact_email': 'contact@globalluxe.com',
    'contact_phone': '',
    'legal_name': '',
    'legal_address': '',
    'legal_id': '',
    'legal_host': '',
    'logo_url': '',
    'color_primary': '#D4AF37',
    'color_dark': '#0A0A0A',
    'meta_title': 'Global Luxe - Boutique de luxe en ligne',
    'meta_description': 'Découvrez notre sélection de produits high-tech et lifestyle',
    'delivery_days': '7 à 12 jours ouvrés',
    'return_days': '14',
    'free_shipping_threshold': '',
    'social_instagram': '',
    'social_facebook': '',
    'social_tiktok': '',
}

# Paramètres réservés à l'admin (préférences de notification)
PRIVATE_DEFAULTS = {
    'notify_new_order': 'true',
    'notify_new_message': 'true',
}

ALL_DEFAULTS = {**PUBLIC_DEFAULTS, **PRIVATE_DEFAULTS}


def get_settings(keys):
    stored = dict(AppSetting.objects.filter(key__in=keys).values_list('key', 'value'))
    return {key: stored.get(key, ALL_DEFAULTS.get(key, '')) for key in keys}


def get_setting(key):
    return get_settings([key])[key]


def is_enabled(key):
    return get_setting(key).strip().lower() in ('1', 'true', 'oui', 'yes', 'on')


def free_shipping_threshold():
    """Seuil de livraison gratuite en euros, ou None si désactivé."""
    try:
        value = Decimal(get_setting('free_shipping_threshold').replace(',', '.'))
    except (InvalidOperation, AttributeError):
        return None
    return value if value > 0 else None
