export type ManagedAsset = {
  readonly key: string;
  readonly label: string;
  readonly group: 'menu' | 'atmosphere' | 'food';
  readonly accept: string;
};

export const MANAGED_ASSETS: readonly ManagedAsset[] = [
  { key: 'menu.pdf', label: 'Menu PDF', group: 'menu', accept: 'application/pdf' },

  { key: 'indoor.avif', label: 'Indoor photo', group: 'atmosphere', accept: 'image/avif,image/jpeg,image/png' },
  { key: 'outdoor.avif', label: 'Outdoor photo', group: 'atmosphere', accept: 'image/avif,image/jpeg,image/png' },
  {
    key: 'retro-diner-red-booths.avif',
    label: 'Retro diner / red booths',
    group: 'atmosphere',
    accept: 'image/avif,image/jpeg,image/png',
  },

  { key: 'images/food/famous-crepes.avif', label: 'Famous crêpes', group: 'food', accept: 'image/avif,image/jpeg,image/png' },
  { key: 'images/food/grilled-cheese-smoked-meat.avif', label: 'Grilled cheese (smoked meat)', group: 'food', accept: 'image/avif,image/jpeg,image/png' },
  { key: 'images/food/grilled-chicken-burger-piri-piri.avif', label: 'Grilled chicken burger (piri piri)', group: 'food', accept: 'image/avif,image/jpeg,image/png' },
  { key: 'images/food/homemade-meat-sauce.avif', label: 'Homemade meat sauce', group: 'food', accept: 'image/avif,image/jpeg,image/png' },
  { key: 'images/food/omelette-compagnarde.avif', label: 'Omelette compagnarde', group: 'food', accept: 'image/avif,image/jpeg,image/png' },
  { key: 'images/food/popcorn-poutine-piri-piri.avif', label: 'Popcorn poutine (piri piri)', group: 'food', accept: 'image/avif,image/jpeg,image/png' },
  { key: 'images/food/poutine-extra-cheese.avif', label: 'Poutine extra cheese', group: 'food', accept: 'image/avif,image/jpeg,image/png' },
  { key: 'images/food/poutine-pop-n-hot.avif', label: 'Poutine pop n hot', group: 'food', accept: 'image/avif,image/jpeg,image/png' },
  { key: 'images/food/southwest-club-grilled-chicken.avif', label: 'Southwest club (grilled chicken)', group: 'food', accept: 'image/avif,image/jpeg,image/png' },
  { key: 'images/food/swag.avif', label: 'Swag', group: 'food', accept: 'image/avif,image/jpeg,image/png' },
  { key: 'images/food/veggie-burger.avif', label: 'Veggie burger', group: 'food', accept: 'image/avif,image/jpeg,image/png' },
];

export const findAsset = (key: string): ManagedAsset | undefined =>
  MANAGED_ASSETS.find((a) => a.key === key);
