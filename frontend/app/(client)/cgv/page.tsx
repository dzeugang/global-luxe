import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage from '@/components/client/InfoPage';
import { getShopSettings } from '@/lib/shop-server';
import { legalName, returnDays } from '@/lib/shop';

export const metadata: Metadata = { title: 'Conditions générales de vente' };

// Modèle de CGV : à faire relire et adapter (statut juridique, pays, médiation) pour chaque boutique.
export default async function CgvPage() {
  const shop = await getShopSettings();
  return (
    <InfoPage
      title="Conditions générales de vente"
      intro={`Les présentes conditions régissent les ventes conclues sur le site ${shop.shop_name}.`}
      updated="18 novembre 2026"
      sections={[
        { title: '1. Objet', body: <p>Elles définissent les droits et obligations de {legalName(shop)} (« le vendeur ») et de toute personne effectuant un achat sur le site (« le client »). Toute commande vaut acceptation des présentes conditions.</p> },
        { title: '2. Produits et prix', body: <p>Les produits sont décrits avec la plus grande exactitude possible. Les prix sont indiqués en euros, toutes taxes comprises, hors frais de livraison, lesquels sont précisés avant la validation de la commande.</p> },
        { title: '3. Commande', body: <p>La commande est validée après saisie des informations de livraison et confirmation. Un email récapitulatif est envoyé au client. Le vendeur se réserve le droit d&apos;annuler une commande en cas de rupture de stock ou de litige ; le client est alors informé et remboursé.</p> },
        { title: '4. Paiement', body: <p>Le paiement est exigible à la commande, selon les moyens proposés sur le site. Les données de paiement sont traitées par des prestataires sécurisés et ne sont jamais conservées par le vendeur.</p> },
        { title: '5. Livraison', body: <p>Les modalités et délais sont décrits sur la page <Link href="/livraison" className="text-gold hover:underline">Livraison et retours</Link>. Le transfert des risques intervient à la réception du produit par le client.</p> },
        { title: '6. Droit de rétractation', body: <p>Le client dispose d&apos;un délai de {returnDays(shop)} jours à compter de la réception pour se rétracter, sans motif. Le remboursement intervient dans les 14 jours suivant la réception du produit retourné. Les frais de retour sont à la charge du client, sauf produit défectueux ou erreur de notre part.</p> },
        { title: '7. Garanties', body: <p>Les produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés, dans les conditions prévues par la loi.</p> },
        { title: '8. Données personnelles', body: <p>Voir la <Link href="/confidentialite" className="text-gold hover:underline">politique de confidentialité</Link>.</p> },
        { title: '9. Litiges', body: <p>En cas de difficulté, le client est invité à <Link href="/contact" className="text-gold hover:underline">nous contacter</Link> afin de rechercher une solution amiable avant toute action.</p> },
      ]}
    />
  );
}
