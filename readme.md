# Global Luxe

Plateforme e-commerce de dropshipping (CJ Dropshipping) : boutique client + back-office admin.

- **Backend** : Django 6 + Django REST Framework, JWT (SimpleJWT), SQLite en dev
- **Frontend** : Next.js 16 (App Router), Tailwind, Zustand (panier)

## Structure

```text
global-luxe/
├── backend/
│   ├── globalluxe/            # settings, urls
│   ├── apps/
│   │   ├── products/          # Produits & catégories
│   │   ├── orders/            # Commandes (stock, statuts, envoi CJ)
│   │   ├── customers/         # Clients (dérivés des commandes)
│   │   ├── messaging/         # Messagerie / formulaire de contact
│   │   ├── media_library/     # Médias
│   │   ├── shipping/          # Méthodes de livraison
│   │   ├── settings_app/      # Paramètres
│   │   └── integrations/      # CJ Dropshipping, Stripe, codes pays
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── (client)/          # Boutique : accueil, catégorie, produit, panier, checkout…
│   │   └── admin/             # Back-office
│   ├── components/  lib/  store/  types/  schemas/
│   └── .env.local.example
└── docs/                      # Admin_guide.md, api.md
```

## Installation

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows  (Linux/Mac : source venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env           # puis renseigner SECRET_KEY, clés CJ, SendGrid…
python manage.py migrate
python manage.py createsuperuser   # compte admin (is_staff requis pour l'API admin)
python manage.py runserver
```

Tests : `python manage.py test apps`

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Points importants

- **Accès admin** : seuls les comptes `is_staff` peuvent utiliser les routes d'administration de l'API.
- **Stock** : vérifié et décrémenté à la commande, remis en stock si la commande est annulée.
- **Pays** : stocké en code ISO alpha-2 (ex. `FR`) ; les noms usuels (« France ») sont convertis.
- **CJ** : l'import (`POST /api/integrations/cj/import-products/`) accepte `page`, `margin` (%) et `category` (slug). Le VID de variante est récupéré automatiquement à l'envoi d'une commande.
- **Emails** : envoyés via SendGrid (SMTP) si `SENDGRID_API_KEY` est défini, sinon affichés dans la console.
- **Production** : mettre `DEBUG=False` active HTTPS, cookies sécurisés et HSTS.
- **Paiement** : Stripe/PayPal ne sont pas encore branchés au checkout.
