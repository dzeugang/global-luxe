import type { Metadata } from 'next';
import InfoPage from '@/components/client/InfoPage';
import { getShopSettings } from '@/lib/shop-server';
import { legalName } from '@/lib/shop';

export const metadata: Metadata = { title: 'Mentions légales' };

// Les informations se remplissent dans Admin > Paramètres > Général (rubrique « Informations légales »).
export default async function LegalPage() {
  const shop = await getShopSettings();
  return (
    <InfoPage
      title="Mentions légales"
      sections={[
        {
          title: 'Éditeur du site',
          body: (
            <>
              <p>{legalName(shop)}</p>
              {shop.legal_address && <p>{shop.legal_address}</p>}
              <p>Contact : {shop.contact_email}{shop.contact_phone ? ` — ${shop.contact_phone}` : ''}</p>
              {shop.legal_id && <p>Immatriculation : {shop.legal_id}</p>}
            </>
          ),
        },
        ...(shop.legal_host ? [{ title: 'Hébergement', body: <p>{shop.legal_host}</p> }] : []),
        { title: 'Propriété intellectuelle', body: <p>Les contenus du site (textes, logos, visuels) sont protégés. Toute reproduction sans autorisation est interdite.</p> },
      ]}
    />
  );
}
