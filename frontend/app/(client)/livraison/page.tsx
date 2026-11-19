import type { Metadata } from 'next';
import InfoPage from '@/components/client/InfoPage';
import { getShopSettings } from '@/lib/shop-server';
import { returnDays } from '@/lib/shop';

export const metadata: Metadata = { title: 'Livraison et retours' };

export default async function ShippingPage() {
  const shop = await getShopSettings();
  return (
    <InfoPage
      title="Livraison et retours"
      sections={[
        {
          title: 'Modes et frais de livraison',
          body: <p>Les modes de livraison disponibles et leurs tarifs sont affichés au moment de la commande, avant validation. Les frais sont indiqués TTC.</p>,
        },
        {
          title: 'Délais',
          body: (
            <>
              <p>Les commandes sont préparées sous 1 à 3 jours ouvrés, puis livrées en {shop.delivery_days}.</p>
              <p>Dès l&apos;expédition, vous recevez un email avec votre numéro de suivi.</p>
            </>
          ),
        },
        {
          title: 'Colis endommagé ou manquant',
          body: <p>Signalez-le-nous dans les 48 h suivant la réception, avec des photos du colis et du produit. Nous organisons un renvoi ou un remboursement.</p>,
        },
        {
          title: 'Retours et remboursements',
          body: (
            <>
              <p>Vous disposez de {returnDays(shop)} jours après réception pour exercer votre droit de rétractation, sans avoir à vous justifier.</p>
              <p>Le produit doit être renvoyé complet, dans son état d&apos;origine. Contactez-nous avant tout envoi pour obtenir l&apos;adresse de retour. Le remboursement intervient au plus tard 14 jours après réception du retour.</p>
            </>
          ),
        },
      ]}
    />
  );
}
