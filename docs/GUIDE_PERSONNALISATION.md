# Guide de personnalisation — transformer Global Luxe en boutique client

Ce guide te permet, **seul**, de transformer Global Luxe en boutique au nom d'un client :
nom, couleurs, logo, icône d'onglet, images, textes, contacts.

> Les numéros de ligne indiqués peuvent bouger si le code change.
> Fie-toi au **texte à chercher** (colonne « Chercher ») plutôt qu'au numéro.

---

## ⭐ Le plus simple : tout se règle dans l'admin, sans code

Dans **Admin > Paramètres** (`/admin/parametres`), puis bouton **Enregistrer** :

| Onglet | Ce que tu changes |
|---|---|
| **Général** | Nom de la boutique, slogan, email, téléphone, réseaux sociaux, informations légales |
| **Apparence** | **Couleurs** (palettes en un clic ou couleur au choix, avec aperçu) et **logo** (envoi d'image) |
| **Référencement** | Titre et description affichés sur Google et dans l'onglet du navigateur |
| **Livraison** | Délai affiché, délai de retour, seuil de livraison gratuite |
| **Notifications** | Emails reçus à chaque commande / message |
| **Intégrations** | État de CJ, des emails et du paiement + boutons de test |
| **Sécurité** | Changer le mot de passe admin |

Les changements apparaissent sur le site **en moins d'une minute**.

Les **options d'un produit** (couleurs avec pastille et photo, tailles, suppléments de prix),
ses **points forts** et ses **caractéristiques** se règlent dans **Admin > Produits > Modifier**.

Les sections ci-dessous (modifier le code) ne servent plus que pour aller plus loin :
changer la police, la mise en page, la bannière d'accueil, etc.

---

## 0. Préparer son poste (une seule fois)

1. Installer **VS Code** : https://code.visualstudio.com
2. Ouvrir le dossier du projet : `Fichier > Ouvrir le dossier… > global-luxe`
3. Les 3 raccourcis qui vont te servir tout le temps :

| Raccourci | Ce que ça fait |
|---|---|
| `Ctrl + P` | Ouvrir un fichier en tapant son nom (ex. `Footer.tsx`) |
| `Ctrl + F` | Chercher un texte **dans le fichier ouvert** |
| `Ctrl + Shift + F` | Chercher un texte **dans tout le projet** ← le plus utile |
| `Ctrl + Shift + H` | Remplacer un texte **dans tout le projet** |

4. Lancer le site en local pour voir tes changements en direct (2 terminaux) :

```bash
# Terminal 1 — backend
cd backend
venv\Scripts\activate
python manage.py runserver
```

```bash
# Terminal 2 — frontend
cd frontend
npm run dev
```

Puis ouvre http://localhost:3000 (boutique) et http://localhost:3000/admin (admin).
**Chaque fois que tu enregistres un fichier (`Ctrl + S`), la page se recharge toute seule.**

---

## 1. Partir d'une copie pour le client

Ne modifie jamais directement `global-luxe` : c'est ton **modèle**.

1. Sur GitHub, ouvre `dzeugang/global-luxe` > **Settings** > coche **Template repository** (une seule fois).
2. Pour chaque client : bouton vert **Use this template** > **Create a new repository**
   > nom : `boutique-nomclient` (privé de préférence).
3. Sur ton PC :

```bash
git clone https://github.com/dzeugang/boutique-nomclient.git
cd boutique-nomclient
```

4. Installe le projet (voir `readme.md`, section Installation) et crée les fichiers `.env`
   avec **les comptes du client** (son Stripe, son SendGrid, son CJ…).

---

## 2. Changer le nom de la boutique

### Méthode rapide (recommandée)

1. `Ctrl + Shift + H` (remplacer dans tout le projet)
> **Commence par `frontend/lib/brand.ts`** : nom, raison sociale, email, téléphone, adresse,
> délais de livraison, durée de retour et réseaux sociaux. Le footer, la page Contact, la FAQ,
> la page Livraison, les CGV, la confidentialité et les mentions légales lisent ces valeurs.
> Un réseau social laissé vide (`''`) n'est pas affiché.

2. Dans « Fichiers à inclure », mets : `frontend/app, frontend/components, frontend/lib`
3. Remplace, **dans cet ordre** (coche « Respecter la casse », icône `Aa`) :

| Chercher | Remplacer par (exemple) |
|---|---|
| `Global Luxe` | `Maison Awa` |
| `GLOBAL LUXE` | `MAISON AWA` |
| `globalluxe.com` | `maisonawa.com` |

4. Vérifie ensuite les endroits où le nom est **coupé en deux** (non trouvés par la recherche) :

| Fichier | Chercher | Quoi faire |
|---|---|---|
| `frontend/components/client/HeaderClient.tsx` (~ligne 80) | `GLOBAL` puis `LUXE` | Logo du haut : mettre les 2 mots du client (ou remplacer par une image, voir §4) |
| `frontend/app/admin/login/page.tsx` (~ligne 36) | `GLOBAL <span` | Titre de la page de connexion admin |
| `frontend/components/client/HeaderClient.tsx` (~ligne 89) | `GL` | Petites initiales au survol du logo |

### Liste complète des endroits (pour vérifier)

| Fichier | Ce que c'est |
|---|---|
| `frontend/app/layout.tsx` | **Titre de l'onglet** du navigateur et description Google (`title`, `description`) |
| `frontend/components/client/HeaderClient.tsx` | Logo du haut + logo du menu mobile |
| `frontend/components/client/Footer.tsx` | Logo du bas, email de contact, copyright |
| `frontend/components/client/HeroHeader.tsx` | Texte du badge par défaut |
| `frontend/app/(client)/page.tsx` | Page d'accueil : badge, bandeau défilant, titre « L'expérience … » |
| `frontend/components/admin/Sidebar.tsx` | Nom dans le menu de l'admin |
| `frontend/components/admin/TopBar.tsx` | Email affiché dans l'admin |
| `frontend/app/admin/login/page.tsx` | Page de connexion admin |
| `frontend/app/admin/parametres/page.tsx` | Valeurs par défaut de la page Paramètres |
| `backend/.env` | `EMAIL_FROM`, `ADMIN_EMAIL` (emails envoyés aux clients) |

> Le dossier `backend/globalluxe/` est le nom **technique** du projet Django.
> Le client ne le voit jamais : **ne le renomme pas** (ça casserait le lancement).

---

## 3. Changer les couleurs

Les couleurs du site viennent de **`frontend/app/globals.css`**. C'est le seul fichier qui compte
(le projet utilise Tailwind v4, qui lit les couleurs dans ce fichier).

### a) `frontend/app/globals.css` (en haut du fichier) — **obligatoire**

```css
@theme {
  /* === COULEURS DE MARQUE === */
  --color-gold: #D4AF37;        /* couleur principale (boutons, liens, accents) */
  --color-gold-dark: #B8941F;   /* version plus foncée (survol des boutons) */
  --color-gold-light: #F4D272;  /* version plus claire (dégradés) */
  --color-dark: #0A0A0A;        /* noir des fonds sombres (footer, login) */
  --color-dark-soft: #1A1A1A;
  --color-dark-muted: #2A2A2A;
  ...
  --color-border-focus: #D4AF37;  /* bordure d'un champ sélectionné → mettre la couleur principale */
```

### b) `frontend/tailwind.config.ts` (~ligne 16) — facultatif

Ce fichier n'est pas lu par Tailwind v4. Mets-y les mêmes valeurs pour rester cohérent,
mais si tu l'oublies, le site n'est pas affecté.

```ts
colors: {
  gold: { DEFAULT: '#D4AF37', dark: '#B8941F', light: '#F4D272' },
  dark: { DEFAULT: '#0A0A0A', soft: '#1A1A1A', muted: '#2A2A2A' },
},
```

**Exemple : boutique en vert émeraude**

| Variable | Avant (or) | Après (vert) |
|---|---|---|
| `gold` | `#D4AF37` | `#059669` |
| `gold-dark` | `#B8941F` | `#047857` |
| `gold-light` | `#F4D272` | `#34D399` |

> La couleur s'appelle toujours « gold » dans le code, même si elle devient verte.
> C'est normal : on change **la valeur**, pas le nom. Tout le site suit automatiquement.

**Trouver de jolies couleurs** : https://coolors.co ou https://tailwindcolor.com
Prends 3 nuances d'une même couleur : normale, foncée, claire.

**Autres couleurs à adapter**
- `frontend/app/layout.tsx` → `themeColor: '#0A0A0A'` (couleur de la barre du navigateur sur mobile)
- `frontend/app/admin/dashboard/page.tsx` → les graphiques utilisent `#D4AF37` écrit en dur :
  `Ctrl + F` sur `#D4AF37` et remplace.

---

## 4. Mettre le logo du client

### a) Déposer les fichiers

Mets les images dans `frontend/public/` (tout ce qui est dans `public/` est accessible depuis le site) :

```
frontend/public/logo.png          ← logo sur fond clair (header)
frontend/public/logo-blanc.png    ← logo clair pour fond sombre (footer, login) — optionnel
```

Conseils : format **PNG transparent** ou **SVG**, environ **400 × 120 px**, moins de 200 Ko
(compresser sur https://tinypng.com).

### b) Remplacer le logo texte par l'image

Dans `frontend/components/client/HeaderClient.tsx`, cherche `{/* LOGO */}`.
Remplace **tout le bloc** `<Link href="/" ...> ... </Link>` qui suit par :

```tsx
{/* LOGO */}
<Link href="/" className="flex items-center">
  <img src="/logo.png" alt="Maison Awa" className="h-10 lg:h-12 w-auto" />
</Link>
```

Fais pareil aux autres endroits si tu veux le logo partout :

| Fichier | Chercher | Classe conseillée |
|---|---|---|
| `HeaderClient.tsx` (menu mobile) | le 2ᵉ `GLOBAL LUXE` (~ligne 287) | `h-8 w-auto` |
| `Footer.tsx` | `GLOBAL LUXE` dans `{/* Logo signature en bas */}` | `h-10 w-auto` avec `/logo-blanc.png` |
| `admin/Sidebar.tsx` | `GLOBAL LUXE` | `h-8 w-auto` avec `/logo-blanc.png` |
| `admin/login/page.tsx` | `<h1 className="font-serif` | `h-14 w-auto mx-auto mb-2` |

Exemple pour remplacer un `<span>` de texte :

```tsx
<img src="/logo-blanc.png" alt="Maison Awa" className="h-10 w-auto" />
```

> `h-10` = hauteur (10 = 40 px). Agrandis avec `h-12`, `h-14`… ou réduis avec `h-8`.

### c) Icône de l'onglet (favicon)

1. Crée une icône carrée (512 × 512 px) sur https://favicon.io ou https://realfavicongenerator.net
2. Dépose le fichier dans **`frontend/app/`** (pas dans `public/`) avec ce nom exact :
   - `favicon.ico` **ou** `icon.png`
3. Next.js l'utilise automatiquement. Fais `Ctrl + F5` dans le navigateur pour vider le cache.

---

## 5. Les images du site

### a) Grande image de la page d'accueil (bannière)

Fichier : `frontend/app/(client)/page.tsx`, cherche `<HeroHeader` (~ligne 50).

```tsx
<HeroHeader
  mediaSrc="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1920&q=80"
  mediaType="image"
  badgeText="✨ Global Luxe Premium"
  title={['Shop Smarter.', 'Live Better.', 'Experience Luxury.']}
  subtitle="Votre marketplace premium..."
  ctaText="Explorer les produits"
  ctaHref="/categorie/electronics"
  ...
/>
```

- **Image à toi** : dépose `frontend/public/banners/accueil.jpg` (1920 × 1080 px, < 500 Ko)
  puis mets `mediaSrc="/banners/accueil.jpg"`.
- **Vidéo** : dépose `frontend/public/banners/accueil.mp4`, puis
  `mediaSrc="/banners/accueil.mp4"` et `mediaType="video"`.
- **Image gratuite** : sur https://unsplash.com, clic droit sur l'image > « Copier l'adresse de l'image ».
- `title` : les phrases qui défilent ; `subtitle` : le sous-titre ;
  `ctaText` / `ctaHref` : le texte et le lien du bouton (mets le slug d'une vraie catégorie du client).

### b) Images des catégories et des produits → **par l'admin, sans toucher au code**

1. Va sur http://localhost:3000/admin et connecte-toi.
2. **Catégories** : bouton Modifier > champ image (fichier ou URL) + bannière.
3. **Produits** > Nouveau / Modifier : glisse les photos ou colle une URL. La 1ʳᵉ image = image principale.
4. **Médias** : tous les fichiers envoyés, réutilisables.

Les fichiers envoyés par l'admin sont stockés dans `backend/media/`.

Conseils photos produits : carrées (1000 × 1000 px), fond blanc ou uni, < 300 Ko.

### c) Image de remplacement manquante

La page de confirmation utilise `/placeholder-product.jpg`, qui **n'existe pas** encore.
Ajoute une image neutre (carrée, logo du client sur fond clair) sous
`frontend/public/placeholder-product.jpg`.

---

## 6. Les textes

| Où | Fichier | Chercher |
|---|---|---|
| Bandeau qui défile | `frontend/app/(client)/page.tsx` | `Smart Shopping!` |
| Section « L'expérience … » | `frontend/app/(client)/page.tsx` | `L&apos;expérience` |
| Titre Google + onglet | `frontend/app/layout.tsx` | `title:` et `description:` |
| Colonnes du pied de page, email, réseaux | `frontend/components/client/Footer.tsx` | `contact@` |

> Dans le code, une apostrophe `'` au milieu d'un texte s'écrit `&apos;`
> (ex. `L&apos;expérience`). Sinon le site affiche une erreur.

---

## 7. Mettre le catalogue du client

Plusieurs façons, selon le volume :

| Volume | Méthode |
|---|---|
| Quelques produits | Admin > Produits > **Nouveau** |
| Produits CJ Dropshipping | Mettre les identifiants CJ du client dans `backend/.env`, puis import CJ (voir `readme.md`). Les produits arrivent **inactifs** : vérifie-les, mets un **stock** et active-les. |
| Démo rapide | `python manage.py seed_products` (produits d'exemple, à supprimer avant la mise en ligne) |

Pense aussi à : **Livraison** (créer les modes de livraison et leurs prix) et **Paramètres**.

---

## 8. Vérifier avant de livrer

```bash
cd frontend
npm run build
```

- S'il affiche la liste des pages à la fin → tout est bon.
- S'il affiche `error` → lis le nom du fichier et le numéro de ligne indiqués, c'est souvent
  une balise mal fermée ou une apostrophe oubliée (voir §6).

```bash
cd backend
python manage.py test apps
```

Checklist visuelle (sur ordinateur **et** sur téléphone, `F12` > icône mobile) :

- [ ] Nom du client partout, plus aucun « Global Luxe » (`Ctrl + Shift + F` sur `luxe`)
- [ ] Logo en haut, en bas, dans l'admin et sur la page de connexion
- [ ] Icône d'onglet
- [ ] Couleurs du client (boutons, liens, survols)
- [ ] Bannière d'accueil et bouton qui mène à une vraie catégorie
- [ ] Catégories avec images, produits avec photos, prix et stock
- [ ] Emails de contact du client (footer, `.env`)
- [ ] Une commande de test passe jusqu'à la page de confirmation

---

## 9. Enregistrer et envoyer sur GitHub

```bash
git add -A
git commit -m "Personnalisation pour Maison Awa : nom, logo, couleurs, images"
git push
```

Si tu fais une erreur, rien n'est perdu : chaque commit est une sauvegarde.
Pour annuler les modifications **non encore commitées** d'un fichier :

```bash
git restore chemin/du/fichier
```

---

## Récapitulatif — par où commencer

| Je veux changer… | Fichier(s) |
|---|---|
| Le nom | `Ctrl + Shift + H` sur `Global Luxe` / `GLOBAL LUXE` + logo du header (§2) |
| Les couleurs | `frontend/app/globals.css` (§3) |
| Le logo | `frontend/public/logo.png` + `HeaderClient.tsx`, `Footer.tsx`, `Sidebar.tsx`, `login/page.tsx` (§4) |
| L'icône d'onglet | `frontend/app/favicon.ico` ou `frontend/app/icon.png` (§4c) |
| La grande image d'accueil | `frontend/public/banners/` + `frontend/app/(client)/page.tsx` (§5a) |
| Les images produits / catégories | Admin, sans code (§5b) |
| Le titre Google | `frontend/app/layout.tsx` (§6) |
| Les emails | `backend/.env` + `Footer.tsx` (§2, §6) |
