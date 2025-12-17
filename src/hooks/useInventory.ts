import { useState, useCallback } from 'react';
import { ClothingItem } from '@/types/inventory';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialItems: ClothingItem[] = [
  {
    id: generateId(),
    name: 'Bijela pamučna majica',
    category: 'majice',
    price: 15.99,
    quantityOwned: 50,
    quantitySold: 12,
    quantityIncoming: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    name: 'Traper hlače slim fit',
    category: 'hlače',
    price: 45.99,
    quantityOwned: 30,
    quantitySold: 8,
    quantityIncoming: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    name: 'Zimska jakna parka',
    category: 'jakne',
    price: 89.99,
    quantityOwned: 15,
    quantitySold: 3,
    quantityIncoming: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    name: 'Ljetna haljina cvjetni uzorak',
    category: 'haljine',
    price: 35.99,
    quantityOwned: 25,
    quantitySold: 7,
    quantityIncoming: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    name: 'Kožni remen crni',
    category: 'dodaci',
    price: 19.99,
    quantityOwned: 40,
    quantitySold: 15,
    quantityIncoming: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useInventory = () => {
  const [items, setItems] = useState<ClothingItem[]>(initialItems);

  const addItem = useCallback((item: Omit<ClothingItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: ClothingItem = {
      ...item,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date() }
          : item
      )
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const recordSale = useCallback((id: string, quantity: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              quantitySold: item.quantitySold + quantity,
              quantityOwned: Math.max(0, item.quantityOwned - quantity),
              updatedAt: new Date(),
            }
          : item
      )
    );
  }, []);

  const recordIncoming = useCallback((id: string, quantity: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              quantityIncoming: item.quantityIncoming + quantity,
              quantityOwned: item.quantityOwned + quantity,
              updatedAt: new Date(),
            }
          : item
      )
    );
  }, []);

  const getRemaining = (item: ClothingItem) => {
    return item.quantityOwned;
  };

  const getTotalValue = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantityOwned, 0);
  };

  const getTotalSalesValue = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantitySold, 0);
  };

  const getLowStockItems = (threshold = 10) => {
    return items.filter(item => item.quantityOwned <= threshold);
  };

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    recordSale,
    recordIncoming,
    getRemaining,
    getTotalValue,
    getTotalSalesValue,
    getLowStockItems,
  };
};
