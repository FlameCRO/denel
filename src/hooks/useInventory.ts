import { useState, useCallback } from 'react';
import { ClothingItem, InventoryTransaction, SavedCalculation } from '@/types/inventory';
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
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const addTransaction = useCallback((
    itemId: string,
    itemName: string,
    type: InventoryTransaction['type'],
    quantity: number,
    details?: string
  ) => {
    const newTransaction: InventoryTransaction = {
      id: generateId(),
      itemId,
      itemName,
      type,
      quantity,
      timestamp: new Date(),
      details,
    };
    setTransactions(prev => [newTransaction, ...prev]);
  }, []);

  const addItem = useCallback((item: Omit<ClothingItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: ClothingItem = {
      ...item,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setItems(prev => [...prev, newItem]);
    addTransaction(newItem.id, newItem.name, 'add', item.quantityOwned, `Cijena: ${item.price}€`);
    return newItem;
  }, [addTransaction]);

  const updateItem = useCallback((id: string, updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        addTransaction(id, item.name, 'edit', 0, 'Artikl ažuriran');
      }
      return prev.map(item =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date() }
          : item
      );
    });
  }, [addTransaction]);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        addTransaction(id, item.name, 'delete', item.quantityOwned, 'Artikl obrisan');
      }
      return prev.filter(item => item.id !== id);
    });
  }, [addTransaction]);

  const recordSale = useCallback((id: string, quantity: number) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        addTransaction(id, item.name, 'sale', quantity, `Prodano ${quantity} kom`);
      }
      return prev.map(item =>
        item.id === id
          ? {
              ...item,
              quantitySold: item.quantitySold + quantity,
              quantityOwned: Math.max(0, item.quantityOwned - quantity),
              updatedAt: new Date(),
            }
          : item
      );
    });
  }, [addTransaction]);

  const recordIncoming = useCallback((id: string, quantity: number) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        addTransaction(id, item.name, 'incoming', quantity, `Zaprimljeno ${quantity} kom`);
      }
      return prev.map(item =>
        item.id === id
          ? {
              ...item,
              quantityIncoming: item.quantityIncoming + quantity,
              quantityOwned: item.quantityOwned + quantity,
              updatedAt: new Date(),
            }
          : item
      );
    });
  }, [addTransaction]);

  const addIncomingCalculation = useCallback((
    invoiceName: string,
    incomingItems: Array<{ id: string; name: string; category: string; price: number; quantity: number }>
  ) => {
    // Save the calculation
    const newCalculation: SavedCalculation = {
      id: generateId(),
      name: invoiceName,
      items: incomingItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
      })),
      totalValue: incomingItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      totalQuantity: incomingItems.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: new Date(),
    };
    setSavedCalculations(prev => [newCalculation, ...prev]);

    incomingItems.forEach(incomingItem => {
      // Check if item already exists
      const existingItem = items.find(
        i => i.name.toLowerCase() === incomingItem.name.toLowerCase() && i.category === incomingItem.category
      );

      if (existingItem) {
        // Update existing item
        setItems(prev => prev.map(item =>
          item.id === existingItem.id
            ? {
                ...item,
                quantityIncoming: item.quantityIncoming + incomingItem.quantity,
                quantityOwned: item.quantityOwned + incomingItem.quantity,
                price: incomingItem.price > 0 ? incomingItem.price : item.price,
                updatedAt: new Date(),
              }
            : item
        ));
        addTransaction(
          existingItem.id,
          existingItem.name,
          'incoming',
          incomingItem.quantity,
          `Ulazna kalkulacija: ${invoiceName}`
        );
      } else {
        // Add new item
        const newItem: ClothingItem = {
          id: generateId(),
          name: incomingItem.name,
          category: incomingItem.category,
          price: incomingItem.price,
          quantityOwned: incomingItem.quantity,
          quantitySold: 0,
          quantityIncoming: incomingItem.quantity,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setItems(prev => [...prev, newItem]);
        addTransaction(
          newItem.id,
          newItem.name,
          'incoming',
          incomingItem.quantity,
          `Ulazna kalkulacija: ${invoiceName} (novi artikl)`
        );
      }
    });
  }, [items, addTransaction]);

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

  const getTodayTransactions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactions.filter(t => {
      const transDate = new Date(t.timestamp);
      transDate.setHours(0, 0, 0, 0);
      return transDate.getTime() === today.getTime();
    });
  };

  const getTodaySales = () => {
    return getTodayTransactions()
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.quantity, 0);
  };

  const getTodayIncoming = () => {
    return getTodayTransactions()
      .filter(t => t.type === 'incoming')
      .reduce((sum, t) => sum + t.quantity, 0);
  };

  const exportToCSV = () => {
    const headers = ['Naziv', 'Kategorija', 'Cijena (€)', 'Na stanju', 'Prodano', 'U dolasku', 'Vrijednost'];
    const rows = items.map(item => [
      item.name,
      item.category,
      item.price.toFixed(2),
      item.quantityOwned.toString(),
      item.quantitySold.toString(),
      item.quantityIncoming.toString(),
      (item.price * item.quantityOwned).toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventura_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = useCallback(() => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      transactions,
      savedCalculations,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventura_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }, [items, transactions, savedCalculations]);

  const importFromJSON = useCallback((jsonString: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.items || !Array.isArray(data.items)) {
        return { success: false, message: 'Nevažeća JSON datoteka - nedostaju artikli.' };
      }

      // Validate items structure
      const validItems = data.items.every((item: any) => 
        item.name && item.category && typeof item.price === 'number'
      );
      
      if (!validItems) {
        return { success: false, message: 'Nevažeća struktura artikala u JSON datoteci.' };
      }

      // Import items with new IDs to avoid conflicts
      const importedItems: ClothingItem[] = data.items.map((item: any) => ({
        ...item,
        id: generateId(),
        createdAt: new Date(item.createdAt || new Date()),
        updatedAt: new Date(item.updatedAt || new Date()),
      }));

      setItems(importedItems);

      // Import transactions if available
      if (data.transactions && Array.isArray(data.transactions)) {
        const importedTransactions: InventoryTransaction[] = data.transactions.map((t: any) => ({
          ...t,
          id: generateId(),
          timestamp: new Date(t.timestamp || new Date()),
        }));
        setTransactions(importedTransactions);
      }

      // Import saved calculations if available
      if (data.savedCalculations && Array.isArray(data.savedCalculations)) {
        const importedCalculations: SavedCalculation[] = data.savedCalculations.map((c: any) => ({
          ...c,
          id: generateId(),
          createdAt: new Date(c.createdAt || new Date()),
        }));
        setSavedCalculations(importedCalculations);
      }

      return { 
        success: true, 
        message: `Uspješno uvezeno ${importedItems.length} artikala.` 
      };
    } catch (error) {
      return { success: false, message: 'Greška pri čitanju JSON datoteke.' };
    }
  }, []);

  return {
    items,
    transactions,
    savedCalculations,
    addItem,
    updateItem,
    deleteItem,
    recordSale,
    recordIncoming,
    addIncomingCalculation,
    getRemaining,
    getTotalValue,
    getTotalSalesValue,
    getLowStockItems,
    getTodayTransactions,
    getTodaySales,
    getTodayIncoming,
    exportToCSV,
    exportToJSON,
    importFromJSON,
  };
};
