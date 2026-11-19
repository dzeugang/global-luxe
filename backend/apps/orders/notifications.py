"""Emails envoyés aux clients et à l'admin au fil de la vie d'une commande."""
import logging

from django.conf import settings
from django.core.mail import send_mail

from apps.settings_app.store import is_enabled

logger = logging.getLogger(__name__)

# Messages envoyés au client à chaque changement de statut (les statuts absents n'envoient rien)
STATUS_MESSAGES = {
    'processing': "Votre commande est en cours de préparation.",
    'shipped': "Bonne nouvelle : votre commande a été expédiée !",
    'delivered': "Votre commande a été livrée. Merci pour votre confiance !",
    'cancelled': "Votre commande a été annulée. Contactez-nous si vous avez la moindre question.",
}


def _send(subject, message, recipients):
    try:
        send_mail(subject, message, settings.EMAIL_FROM, recipients, fail_silently=False)
    except Exception:
        # La commande ne doit jamais échouer à cause d'un email : on trace l'erreur
        logger.exception("Échec d'envoi de l'email « %s »", subject)


def tracking_url(order):
    return f"{settings.FRONTEND_URL}/suivi?order={order.id}"


def send_order_created(order):
    lines = [
        f"- {item.product.name}{item.options_label and f' ({item.options_label})'} × {item.quantity} : {item.total} €"
        for item in order.items.all()
    ]
    _send(
        f"Confirmation de commande #{order.id}",
        (
            f"Bonjour {order.customer_name},\n\n"
            "Merci pour votre commande, nous l'avons bien reçue.\n\n"
            + "\n".join(lines)
            + f"\n\nLivraison : {order.shipping_cost} €\nTotal : {order.total} €\n\n"
            f"Suivre votre commande : {tracking_url(order)}\n"
            "(munissez-vous de votre numéro de commande et de votre email)"
        ),
        [order.customer_email],
    )
    if is_enabled('notify_new_order'):
        _send(
            f"Nouvelle commande #{order.id}",
            f"Nouvelle commande de {order.customer_name} ({order.customer_email}) - Total {order.total} €",
            [settings.ADMIN_EMAIL],
        )


def send_status_changed(order):
    text = STATUS_MESSAGES.get(order.status)
    if not text:
        return
    if order.status == 'shipped' and order.tracking_number:
        text += f"\nNuméro de suivi : {order.tracking_number}"
    _send(
        f"Commande #{order.id} : mise à jour",
        f"Bonjour {order.customer_name},\n\n{text}\n\nSuivre votre commande : {tracking_url(order)}",
        [order.customer_email],
    )
