import { useState, useCallback, useEffect } from 'react';

export interface Category {
  value: string;
  label: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { value: 'majice', label: 'Majice' },
  { value: 'hlače', label: 'Hlače' },
  { value: 'haljine', label: 'Haljine' },
  { value: 'jakne', label: 'Jakne' },
  { value: 'obuća', label: 'Obuća' },
  { value: 'dodaci', label: 'Dodaci' },
  { value: 'ostalo', label: 'Ostalo' },
];

const getStorageKey = (warehouseId: string) => `inventory-categories_${warehouseId}`;

export const useCategories = (warehouseId: string = 'warehouse1') => {
  const storageKey = getStorageKey(warehouseId);
  
  const [categories, setCategories] = useState<Category[]>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_CATEGORIES;
      }
    }
    return DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(categories));
  }, [categories, storageKey]);

  const addCategory = useCallback((label: string) => {
    const value = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zčćžšđ0-9-]/gi, '');
    
    if (categories.some(c => c.value === value)) {
      return { success: false, message: 'Kategorija već postoji.' };
    }

    setCategories(prev => [...prev, { value, label }]);
    return { success: true, message: 'Kategorija dodana.' };
  }, [categories]);

  const renameCategory = useCallback((oldValue: string, newLabel: string) => {
    setCategories(prev => 
      prev.map(c => c.value === oldValue ? { ...c, label: newLabel } : c)
    );
    return { success: true, message: 'Kategorija preimenovana.' };
  }, []);

  const deleteCategory = useCallback((value: string) => {
    if (value === 'ostalo') {
      return { success: false, message: 'Kategorija "Ostalo" ne može se obrisati.' };
    }
    setCategories(prev => prev.filter(c => c.value !== value));
    return { success: true, message: 'Kategorija obrisana.' };
  }, []);

  const getCategoryLabel = useCallback((value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  }, [categories]);

  return {
    categories,
    addCategory,
    renameCategory,
    deleteCategory,
    getCategoryLabel,
  };
};
