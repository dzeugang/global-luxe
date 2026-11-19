import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage from '@/components/client/InfoPage';
import { getShopSettings } from '@/lib/shop-server';
import { returnDays } from '@/lib/shop';

export const metadata: Metadata = { title: 'Questions fréquentes' };

export default async function FaqPage() {
  const shop = await getShopSettings();
  return (
    <InfoPage
      title="Questions fréquentes"
      intro="Les réponses aux questions que l'on nous pose le plus souvent."
      sections={[
        {
          title: 'Quels sont les délais de livraison ?',
          body: <p>Comptez {shop.delivery_days} après l&apos;expédition. Les détails par mode de livraison sont sur la page <Link href="/livraison" className="text-gold hover:underline">Livraison</Link>.</p>,
        },
        {
          title: 'Comment suivre ma commande ?',
          body: <p>Rendez-vous sur <Link href="/suivi" className="text-gold hover:underline">Suivre ma commande</Link> avec votre numéro de commande et votre email. Vous recevez aussi un email à chaque étape (préparation, expédition, livraison).</p>,
        },
        {
          title: 'Puis-je modifier ou annuler ma commande ?',
          body: <p>Oui, tant qu&apos;elle n&apos;a pas été expédiée. <Link href="/contact" className="text-gold hover:underline">Contactez-nous</Link> rapidement en indiquant votre numéro de commande.</p>,
        },
        {
          title: 'Comment retourner un produit ?',
          body: <p>Vous disposez de {returnDays(shop)} jours après réception pour changer d&apos;avis. Contactez-nous avant tout renvoi : nous vous indiquerons l&apos;adresse de retour. Le remboursement intervient sous 14 jours après réception du produit.</p>,
        },
        {
          title: 'Mes données sont-elles protégées ?',
          body: <p>Oui. Nous n&apos;utilisons vos informations que pour traiter votre commande. Voir notre <Link href="/confidentialite" className="text-gold hover:underline">politique de confidentialité</Link>.</p>,
        },
      ]}
    />
  );
}
