import { useState, useCallback, useEffect } from 'react';
import { ClothingItem, InventoryTransaction, SavedCalculation } from '@/types/inventory';

const generateId = () => Math.random().toString(36).substr(2, 9);
const STORAGE_KEY = 'inventura_data';

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

const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        items: data.items?.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })) || initialItems,
        transactions: data.transactions?.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        })) || [],
        savedCalculations: data.savedCalculations?.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })) || [],
      };
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return { items: initialItems, transactions: [], savedCalculations: [] };
};

export const useInventory = () => {
  const storedData = loadFromLocalStorage();
  const [items, setItems] = useState<ClothingItem[]>(storedData.items);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(storedData.transactions);
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>(storedData.savedCalculations);

  // Auto-save to localStorage
  useEffect(() => {
    const data = {
      items,
      transactions,
      savedCalculations,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [items, transactions, savedCalculations]);

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
              quantityOwned: item.quantityOwned - quantity,
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
    incomingItems: Array<{ id: string; name: string; category: string; price: number; quantity: number }>,
    pdfData?: { base64: string; fileName: string }
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
      pdfBase64: pdfData?.base64,
      pdfFileName: pdfData?.fileName,
    };
    setSavedCalculations(prev => [newCalculation, ...prev]);

    incomingItems.forEach(incomingItem => {
      // Check if item already exists (must match name, category AND price)
      const existingItem = items.find(
        i => i.name.toLowerCase() === incomingItem.name.toLowerCase() && 
             i.category === incomingItem.category &&
             i.price === incomingItem.price
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

  const importSalesFromCSV = useCallback((csvString: string): { success: boolean; message: string; imported: number; notFound: string[] } => {
    try {
      const lines = csvString.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return { success: false, message: 'CSV datoteka je prazna ili nema podataka.', imported: 0, notFound: [] };
      }

      // Helper function to parse CSV line properly handling quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if ((char === ',' || char === ';') && !inQuotes) {
            result.push(current.trim().replace(/"/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/"/g, ''));
        return result;
      };

      // Parse header to find column indices
      const header = parseCSVLine(lines[0]).map(h => h.toLowerCase());
      const proizvodIndex = header.findIndex(h => h === 'proizvod' || h.includes('proizvod'));
      const kolicinaIndex = header.findIndex(h => h === 'količina' || h === 'kolicina' || h.includes('količ') || h.includes('kolic'));
      const razduzenjeIndex = header.findIndex(h => h === 'razduženje' || h === 'razduzenje' || h.includes('razduž') || h.includes('razduz'));

      if (proizvodIndex === -1) {
        return { success: false, message: 'Nije pronađen stupac "proizvod" u CSV datoteci.', imported: 0, notFound: [] };
      }
      if (kolicinaIndex === -1) {
        return { success: false, message: 'Nije pronađen stupac "količina" u CSV datoteci.', imported: 0, notFound: [] };
      }

      let importedCount = 0;
      const notFoundItems: string[] = [];

      // Helper function to normalize item name (remove price suffix)
      const normalizeName = (name: string): string => {
        return name
          .replace(/\s*\d+(?:[.,]\d+)?\s*€?\s*$/, '') // Remove price at end
          .trim()
          .toLowerCase();
      };

      // Helper function to parse price from string like "14,00 €" or "1,50 €"
      const parsePrice = (priceStr: string): number | null => {
        if (!priceStr) return null;
        const match = priceStr.match(/(\d+(?:[.,]\d+)?)\s*€?/);
        if (match) {
          return parseFloat(match[1].replace(',', '.'));
        }
        return null;
      };

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length <= Math.max(proizvodIndex, kolicinaIndex)) continue;

        const proizvodRaw = row[proizvodIndex];
        const kolicinaRaw = row[kolicinaIndex];
        const razduzenjeRaw = razduzenjeIndex !== -1 ? row[razduzenjeIndex] : '';

        if (!proizvodRaw || !kolicinaRaw) continue;

        // Parse quantity
        const quantity = parseInt(kolicinaRaw, 10);
        if (isNaN(quantity) || quantity <= 0) continue;

        // Parse product name and price from "proizvod" field (e.g., "hlače 7€" or "hlače 7")
        const priceMatch = proizvodRaw.match(/(\d+(?:[.,]\d+)?)\s*€?$/);
        let csvProductName = proizvodRaw;
        let csvProductPrice: number | null = null;

        if (priceMatch) {
          csvProductPrice = parseFloat(priceMatch[1].replace(',', '.'));
          csvProductName = proizvodRaw.replace(priceMatch[0], '').trim();
        }

        // If no price in product name, try to calculate from Razduženje column
        if (csvProductPrice === null && razduzenjeRaw) {
          const totalSaleValue = parsePrice(razduzenjeRaw);
          if (totalSaleValue !== null && quantity > 0) {
            csvProductPrice = totalSaleValue / quantity;
          }
        }

        const normalizedCsvName = normalizeName(csvProductName);

        // Find matching item by normalized name (without price) and price
        const matchingItem = items.find(item => {
          const normalizedItemName = normalizeName(item.name);
          
          // Exact match on normalized names
          const exactMatch = normalizedItemName === normalizedCsvName;
          
          // Partial match - one contains the other
          const partialMatch = normalizedItemName.includes(normalizedCsvName) || 
                              normalizedCsvName.includes(normalizedItemName);
          
          const nameMatches = exactMatch || partialMatch;
          
          // If we have a calculated price, also verify the item price matches
          if (csvProductPrice !== null) {
            return nameMatches && Math.abs(item.price - csvProductPrice) < 0.01;
          }
          
          // If no price available at all, just match by name
          return nameMatches;
        });

        if (matchingItem) {
          recordSale(matchingItem.id, quantity);
          importedCount++;
        } else {
          notFoundItems.push(`${proizvodRaw} (količina: ${quantity}${csvProductPrice !== null ? `, cijena: ${csvProductPrice.toFixed(2)}€` : ''})`);
        }
      }

      if (importedCount === 0 && notFoundItems.length > 0) {
        return { 
          success: false, 
          message: `Nijedan artikl nije pronađen u inventuri.`, 
          imported: 0, 
          notFound: notFoundItems 
        };
      }

      return { 
        success: true, 
        message: `Uspješno uvezeno ${importedCount} prodaja.`, 
        imported: importedCount, 
        notFound: notFoundItems 
      };
    } catch (error) {
      return { success: false, message: 'Greška pri čitanju CSV datoteke.', imported: 0, notFound: [] };
    }
  }, [items, recordSale]);

  const resetAllSales = useCallback(() => {
    setItems(prev => prev.map(item => ({
      ...item,
      quantityOwned: item.quantityOwned + item.quantitySold, // Vrati prodano na stanje
      quantitySold: 0,
      updatedAt: new Date(),
    })));
    // Add a transaction for the reset
    addTransaction('all', 'Svi artikli', 'sale', 0, 'Reset prodaje - sve svedeno na 0, stanje vraćeno');
  }, [addTransaction]);

  // Helper function to parse CSV line handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  };

  const importItemsFromCSV = useCallback((csvString: string): { success: boolean; message: string; imported: number } => {
    try {
      // Remove BOM if present
      const cleanedString = csvString.replace(/^\uFEFF/, '');
      const lines = cleanedString.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return { success: false, message: 'CSV datoteka je prazna ili nema podataka.', imported: 0 };
      }

      console.log('=== CSV IMPORT DEBUG ===');
      console.log('First line raw:', lines[0]);

      // Parse header using proper CSV parsing
      const header = parseCSVLine(lines[0]).map(h => h.toLowerCase());
      console.log('Parsed header columns:', header);
      console.log('Number of columns:', header.length);
      
      // Find "Ime" column - exact match first
      let imeIndex = header.findIndex(h => h === 'ime');
      if (imeIndex === -1) {
        imeIndex = header.findIndex(h => h.startsWith('ime') || (h.includes('ime') && !h.includes('cijena') && !h.includes('pdv')));
      }
      
      // Find "Cijena s PDV-om" column - be very specific
      let cijenaIndex = header.findIndex(h => h.includes('cijena s pdv') || h.includes('cijena s pdv-om'));
      if (cijenaIndex === -1) {
        cijenaIndex = header.findIndex(h => h.includes('pdv') && h.includes('cijena'));
      }
      if (cijenaIndex === -1) {
        cijenaIndex = header.findIndex(h => h.includes('cijena') && h !== 'ime');
      }

      // Find "Grupa" column for category
      const grupaIndex = header.findIndex(h => h === 'grupa' || h.includes('grupa'));

      console.log('Found Ime index:', imeIndex, '-> column:', header[imeIndex]);
      console.log('Found Cijena index:', cijenaIndex, '-> column:', header[cijenaIndex]);
      console.log('Found Grupa index:', grupaIndex, '-> column:', header[grupaIndex]);

      if (imeIndex === -1) {
        return { success: false, message: `Nije pronađen stupac "Ime". Pronađeni stupci: ${header.join(' | ')}`, imported: 0 };
      }
      if (cijenaIndex === -1) {
        return { success: false, message: `Nije pronađen stupac "Cijena s PDV-om". Pronađeni stupci: ${header.join(' | ')}`, imported: 0 };
      }

      let importedCount = 0;

      // Process data rows using proper CSV parsing
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        
        if (row.length <= Math.max(imeIndex, cijenaIndex)) {
          console.log(`Row ${i}: skipped - not enough columns (${row.length})`);
          continue;
        }

        const imeRaw = row[imeIndex];
        const cijenaRaw = row[cijenaIndex];
        const grupaRaw = grupaIndex !== -1 ? row[grupaIndex] : '';

        console.log(`Row ${i}: Ime="${imeRaw}", Cijena="${cijenaRaw}", Grupa="${grupaRaw}"`);

        if (!imeRaw) continue;

        // Parse price from "Cijena s PDV-om" column
        // Handle various formats: "1,50", "1.50", "1,50 €", "1.50€", "1 234,50 €", etc.
        let priceStr = cijenaRaw || '0';
        console.log(`  -> Original price string: "${priceStr}" (charCodes: ${[...priceStr].map(c => c.charCodeAt(0)).join(',')})`);
        
        // Remove all non-numeric characters except comma and dot
        priceStr = priceStr.replace(/[^\d,.\-]/g, '');
        console.log(`  -> After removing non-numeric: "${priceStr}"`);
        
        // If there's both dot and comma, determine which is decimal separator
        // European format: 1.234,56 or 1234,56
        // US format: 1,234.56 or 1234.56
        if (priceStr.includes(',') && priceStr.includes('.')) {
          // If comma comes after dot, comma is decimal (European: 1.234,56)
          if (priceStr.lastIndexOf(',') > priceStr.lastIndexOf('.')) {
            priceStr = priceStr.replace(/\./g, '').replace(',', '.');
          } else {
            // Dot is decimal (US: 1,234.56)
            priceStr = priceStr.replace(/,/g, '');
          }
        } else if (priceStr.includes(',')) {
          // Only comma - treat as decimal separator (European)
          priceStr = priceStr.replace(',', '.');
        }
        
        console.log(`  -> Final price string: "${priceStr}"`);
        const price = parseFloat(priceStr);
        const finalPrice = isNaN(price) ? 0 : price;
        
        console.log(`  -> Parsed price: ${finalPrice}`);

        // Parse name from "Ime" field - remove price suffix if present
        const priceMatch = imeRaw.match(/\s+\d+(?:[.,]\d+)?\s*€?\s*$/);
        const productName = priceMatch ? imeRaw.replace(priceMatch[0], '').trim() : imeRaw.trim();

        if (!productName) continue;

        // Check if item already exists
        const existingItem = items.find(item => 
          item.name.toLowerCase() === productName.toLowerCase()
        );

        if (existingItem) {
          updateItem(existingItem.id, { price: finalPrice });
        } else {
          // Map Grupa to category, default to 'ostalo'
          const category = grupaRaw ? grupaRaw.toLowerCase().replace(/\//g, '-') : 'ostalo';
          
          const newItem: ClothingItem = {
            id: generateId(),
            name: productName,
            category: category,
            price: finalPrice,
            quantityOwned: 0,
            quantitySold: 0,
            quantityIncoming: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setItems(prev => [...prev, newItem]);
          addTransaction(newItem.id, newItem.name, 'add', 0, `Uvezeno iz CSV - Cijena: ${finalPrice}€`);
        }
        importedCount++;
      }

      console.log('=== IMPORT COMPLETE ===');
      console.log('Total imported:', importedCount);

      if (importedCount === 0) {
        return { success: false, message: 'Nisu pronađeni valjani artikli za uvoz.', imported: 0 };
      }

      return { 
        success: true, 
        message: `Uspješno uvezeno/ažurirano ${importedCount} artikala. (Stupci: Ime[${imeIndex}]="${header[imeIndex]}", Cijena[${cijenaIndex}]="${header[cijenaIndex]}")`,
        imported: importedCount
      };
    } catch (error) {
      console.error('Error importing items from CSV:', error);
      return { success: false, message: 'Greška pri čitanju CSV datoteke.', imported: 0 };
    }
  }, [items, addTransaction, updateItem]);

  const importInventoryFromCSV = useCallback((csvString: string): { success: boolean; message: string; imported: number } => {
    try {
      const lines = csvString.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return { success: false, message: 'CSV datoteka je prazna ili nema podataka.', imported: 0 };
      }

      // Helper function to parse CSV line properly handling quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if ((char === ',' || char === ';') && !inQuotes) {
            result.push(current.trim().replace(/"/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/"/g, ''));
        return result;
      };

      // Parse header to find column indices
      const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      console.log('CSV Headers:', header);
      
      // Find "Artikli", "Cijena", "Ostalo komada" columns
      const artikliIndex = header.findIndex(h => h === 'artikli' || h.includes('artikl'));
      const cijenaIndex = header.findIndex(h => h === 'cijena' || h.includes('cijen'));
      const ostaloKomadaIndex = header.findIndex(h => 
        h === 'ostalo komada' || 
        h === 'ostalo' || 
        h.includes('ostalo') || 
        h.includes('komada') ||
        h.includes('stanje') ||
        h.includes('količina') ||
        h.includes('kolicina')
      );

      console.log('Column indices - Artikli:', artikliIndex, 'Cijena:', cijenaIndex, 'Ostalo komada:', ostaloKomadaIndex);

      if (artikliIndex === -1) {
        return { success: false, message: 'Nije pronađen stupac "Artikli" u CSV datoteci.', imported: 0 };
      }
      if (cijenaIndex === -1) {
        return { success: false, message: 'Nije pronađen stupac "Cijena" u CSV datoteci.', imported: 0 };
      }
      if (ostaloKomadaIndex === -1) {
        return { success: false, message: 'Nije pronađen stupac "Ostalo komada" u CSV datoteci.', imported: 0 };
      }

      let importedCount = 0;

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length <= Math.max(artikliIndex, cijenaIndex, ostaloKomadaIndex)) continue;

        const artikl = row[artikliIndex]?.trim();
        const cijenaRaw = row[cijenaIndex]?.trim();
        const ostaloRaw = row[ostaloKomadaIndex]?.trim();

        if (!artikl) continue;

        // Parse price - handle both "14,00" and "14.00" formats
        const cijena = parseFloat(cijenaRaw?.replace(',', '.') || '0') || 0;
        
        // Parse quantity
        const ostaloKomada = parseInt(ostaloRaw || '0', 10) || 0;

        console.log(`Row ${i}: artikl="${artikl}", cijena=${cijena}, ostalo=${ostaloKomada}`);

        // Check if item already exists (match by name and price)
        const existingItem = items.find(
          item => item.name.toLowerCase() === artikl.toLowerCase() && item.price === cijena
        );

        if (existingItem) {
          // Update existing item's quantity
          setItems(prev => prev.map(item =>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantityOwned: ostaloKomada,
                  updatedAt: new Date(),
                }
              : item
          ));
          addTransaction(existingItem.id, existingItem.name, 'edit', ostaloKomada, `Inventura uvezena - stanje: ${ostaloKomada}`);
        } else {
          // Add new item
          const newItem: ClothingItem = {
            id: generateId(),
            name: artikl,
            category: 'ostalo',
            price: cijena,
            quantityOwned: ostaloKomada,
            quantitySold: 0,
            quantityIncoming: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setItems(prev => [...prev, newItem]);
          addTransaction(newItem.id, newItem.name, 'add', ostaloKomada, `Inventura uvezena - Cijena: ${cijena}€`);
        }
        importedCount++;
      }

      console.log('=== INVENTORY IMPORT COMPLETE ===');
      console.log('Total imported:', importedCount);

      if (importedCount === 0) {
        return { success: false, message: 'Nisu pronađeni valjani artikli za uvoz.', imported: 0 };
      }

      return { 
        success: true, 
        message: `Uspješno uvezeno/ažurirano ${importedCount} artikala iz inventure.`,
        imported: importedCount
      };
    } catch (error) {
      console.error('Error importing inventory from CSV:', error);
      return { success: false, message: 'Greška pri čitanju CSV datoteke.', imported: 0 };
    }
  }, [items, addTransaction]);

  const deleteAllItems = useCallback(() => {
    const count = items.length;
    setItems([]);
    setTransactions([]);
    setSavedCalculations([]);
    addTransaction('all', 'Svi artikli', 'delete', count, 'Obrisani svi artikli');
  }, [items.length, addTransaction]);

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
    importSalesFromCSV,
    importItemsFromCSV,
    importInventoryFromCSV,
    resetAllSales,
    deleteAllItems,
  };
};
