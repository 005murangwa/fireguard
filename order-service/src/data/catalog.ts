/** Available extinguisher types clients can order from FireGuard LTD. */
export interface CatalogItem {
  type: string;
  manufacturer: string;
  capacity: string;
  description: string;
  unitPrice: number;
}

export const EXTinguisher_CATALOG: CatalogItem[] = [
  {
    type: 'CO2',
    manufacturer: 'Kidde',
    capacity: '5kg',
    description: 'CO2 extinguisher for electrical fires and server rooms.',
    unitPrice: 85000,
  },
  {
    type: 'Foam',
    manufacturer: 'Ansul',
    capacity: '9L',
    description: 'Foam extinguisher for flammable liquid fires.',
    unitPrice: 72000,
  },
  {
    type: 'Dry Powder',
    manufacturer: 'Amerex',
    capacity: '6kg',
    description: 'Multi-purpose ABC dry powder extinguisher.',
    unitPrice: 65000,
  },
  {
    type: 'Water',
    manufacturer: 'FireGuard',
    capacity: '9L',
    description: 'Water extinguisher for Class A combustible materials.',
    unitPrice: 55000,
  },
];

export function getCatalogItem(type: string): CatalogItem | undefined {
  return EXTinguisher_CATALOG.find((item) => item.type.toLowerCase() === type.toLowerCase());
}
