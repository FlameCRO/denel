export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantityOwned: number;
  quantitySold: number;
  quantityIncoming: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'sale' | 'restock' | 'adjustment';
  quantity: number;
  timestamp: Date;
}

export type CategoryType = 'majice' | 'hlače' | 'haljine' | 'jakne' | 'obuća' | 'dodaci' | 'ostalo';

export const CATEGORIES: { value: CategoryType; label: string }[] = [
  { value: 'majice', label: 'Majice' },
  { value: 'hlače', label: 'Hlače' },
  { value: 'haljine', label: 'Haljine' },
  { value: 'jakne', label: 'Jakne' },
  { value: 'obuća', label: 'Obuća' },
  { value: 'dodaci', label: 'Dodaci' },
  { value: 'ostalo', label: 'Ostalo' },
];
