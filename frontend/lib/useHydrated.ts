import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// false pendant le rendu serveur et la 1re hydratation, true ensuite.
// Sert à n'afficher le panier (stocké dans le navigateur) qu'une fois côté client,
// pour éviter les erreurs d'hydratation.
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
