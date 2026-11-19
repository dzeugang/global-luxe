import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage from '@/components/client/InfoPage';
import { getShopSettings } from '@/lib/shop-server';

export const metadata: Metadata = { title: 'Politique de confidentialité' };

// Modèle : à faire relire et adapter (prestataires réellement utilisés, durées de conservation).
export default async function PrivacyPage() {
  const shop = await getShopSettings();
  return (
    <InfoPage
      title="Politique de confidentialité"
      updated="18 novembre 2026"
      sections={[
        { title: 'Données collectées', body: <p>Lors d&apos;une commande : nom, email, téléphone et adresse de livraison. Lors d&apos;un message : nom, email et contenu du message. Aucune donnée bancaire n&apos;est stockée sur nos serveurs.</p> },
        { title: 'Utilisation', body: <p>Ces données servent uniquement à traiter et livrer vos commandes, à vous informer de leur suivi et à répondre à vos demandes. Elles ne sont jamais revendues.</p> },
        { title: 'Destinataires', body: <p>Elles sont transmises, pour le strict nécessaire, à nos partenaires logistiques (fournisseur, transporteur), à notre prestataire de paiement et à notre service d&apos;envoi d&apos;emails.</p> },
        { title: 'Conservation', body: <p>Les données de commande sont conservées pendant la durée légale de conservation des pièces comptables. Les messages sont supprimés au plus tard 3 ans après le dernier échange.</p> },
        { title: 'Vos droits', body: <p>Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données à tout moment en écrivant à {shop.contact_email} ou via la page <Link href="/contact" className="text-gold hover:underline">Contact</Link>.</p> },
        { title: 'Cookies', body: <p>Le site n&apos;utilise que des stockages techniques nécessaires à son fonctionnement (panier, session). Aucun cookie publicitaire n&apos;est déposé.</p> },
      ]}
    />
  );
}
