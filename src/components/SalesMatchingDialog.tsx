import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ClothingItem } from '@/types/inventory';
import { Search, ShoppingCart, Check, X } from 'lucide-react';

interface UnmatchedSaleItem {
  originalName: string;
  parsedName: string;
  parsedPrice: number | null;
  quantity: number;
}

interface SalesMatchingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unmatchedItems: UnmatchedSaleItem[];
  inventoryItems: ClothingItem[];
  onMatchItem: (inventoryItemId: string, quantity: number) => void;
  onSkipItem: (item: UnmatchedSaleItem) => void;
  onComplete: (skippedItems: UnmatchedSaleItem[]) => void;
}

export const SalesMatchingDialog = ({
  open,
  onOpenChange,
  unmatchedItems,
  inventoryItems,
  onMatchItem,
  onSkipItem,
  onComplete,
}: SalesMatchingDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [skippedItems, setSkippedItems] = useState<UnmatchedSaleItem[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);

  // Reset state only when dialog opens (not on every unmatchedItems change)
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setSearchQuery('');
      setSkippedItems([]);
      setMatchedCount(0);
    }
  }, [open]);

  const currentItem = unmatchedItems[currentIndex];
  const totalItems = unmatchedItems.length;
  const remainingItems = totalItems - currentIndex;
  const progress = totalItems > 0 ? ((currentIndex) / totalItems) * 100 : 0;

  // Filter inventory items - prioritize same price, then filter by search
  const filteredInventory = useMemo(() => {
    if (!currentItem) return [];

    let filtered = [...inventoryItems];

    // If we have a price, sort by matching price first
    if (currentItem.parsedPrice !== null) {
      filtered = filtered.sort((a, b) => {
        const aMatches = Math.abs(a.price - currentItem.parsedPrice!) < 0.01;
        const bMatches = Math.abs(b.price - currentItem.parsedPrice!) < 0.01;
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [inventoryItems, currentItem, searchQuery]);

  const handleSelectMatch = (inventoryItem: ClothingItem) => {
    if (!currentItem) return;

    onMatchItem(inventoryItem.id, currentItem.quantity);
    setMatchedCount(prev => prev + 1);
    
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(prev => prev + 1);
      setSearchQuery('');
    } else {
      // All items processed
      onComplete(skippedItems);
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    if (!currentItem) return;

    setSkippedItems(prev => [...prev, currentItem]);
    onSkipItem(currentItem);
    
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(prev => prev + 1);
      setSearchQuery('');
    } else {
      // All items processed
      onComplete([...skippedItems, currentItem]);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    // Complete with remaining items as skipped
    const remainingSkipped = unmatchedItems.slice(currentIndex);
    onComplete([...skippedItems, ...remainingSkipped]);
    onOpenChange(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price) + ' €';
  };

  if (!currentItem) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 pb-4 border-b bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">RUČNO UPARIVANJE PRODAJE</h2>
              <p className="text-xs md:text-sm text-slate-400">STAVKA {currentIndex + 1} OD {totalItems}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile: Current item card at top */}
        <div className="lg:hidden bg-slate-50 dark:bg-slate-900/50 p-4 border-b shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border">
            <p className="text-xs font-semibold text-primary tracking-wide mb-1">
              NEPOZNAT ARTIKL IZ CSV-A
            </p>
            <h3 className="text-xl font-bold text-foreground mb-3">
              {currentItem.parsedName}
            </h3>
            
            <div className="flex gap-2 mb-3">
              <div className="bg-slate-800 dark:bg-slate-700 text-white px-3 py-1.5 rounded-lg flex-1 text-center">
                <p className="text-xs opacity-70">CIJENA</p>
                <p className="text-base font-bold">
                  {currentItem.parsedPrice !== null 
                    ? formatPrice(currentItem.parsedPrice) 
                    : 'N/A'}
                </p>
              </div>
              <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg flex-1 text-center">
                <p className="text-xs opacity-70">KOLIČINA</p>
                <p className="text-base font-bold">{currentItem.quantity} kom</p>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="w-full"
              size="sm"
            >
              PRESKOČI OVU STAVKU
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 min-h-0">
          {/* Left side - Current item (desktop only) */}
          <div className="hidden lg:flex w-2/5 p-6 bg-slate-50 dark:bg-slate-900/50 flex-col items-center justify-center border-r">
            <div className="text-center space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border">
                <p className="text-xs font-semibold text-primary tracking-wide mb-2">
                  NEPOZNAT ARTIKL IZ CSV-A
                </p>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {currentItem.parsedName}
                </h3>
                
                <div className="flex justify-center gap-3">
                  <div className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg">
                    <p className="text-xs opacity-70">CIJENA</p>
                    <p className="text-lg font-bold">
                      {currentItem.parsedPrice !== null 
                        ? formatPrice(currentItem.parsedPrice) 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg">
                    <p className="text-xs opacity-70">KOLIČINA</p>
                    <p className="text-lg font-bold">{currentItem.quantity} kom</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground italic px-4">
                Pronađite odgovarajući artikl u inventuri desno ili preskočite ako artikl ne postoji.
              </p>

              <Button 
                variant="outline" 
                onClick={handleSkip}
                className="w-full max-w-[200px]"
              >
                PRESKOČI OVU STAVKU
              </Button>
            </div>
          </div>

          {/* Right side - Inventory list */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Traži po nazivu u inventuri..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Inventory list */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {filteredInventory.map(item => {
                  const isPriceMatch = currentItem.parsedPrice !== null && 
                    Math.abs(item.price - currentItem.parsedPrice) < 0.01;
                  
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5 ${
                        isPriceMatch 
                          ? 'border-primary/30 bg-primary/5' 
                          : 'border-border bg-background'
                      }`}
                      onClick={() => handleSelectMatch(item)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={isPriceMatch ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                            {formatPrice(item.price)}
                          </span>
                          <span className="text-muted-foreground">
                            Zaliha: {item.quantityOwned}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={isPriceMatch ? "default" : "outline"}
                        size="icon"
                        className={isPriceMatch ? 'bg-primary hover:bg-primary/90' : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMatch(item);
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}

                {filteredInventory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nema pronađenih artikala
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer with progress */}
        <div className="border-t bg-slate-900 dark:bg-slate-950 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-xs text-slate-400">UPARENO DO SADA</p>
                <p className="text-lg font-bold text-emerald-400">{matchedCount} stavki</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">PREOSTALO</p>
                <p className="text-lg font-bold text-emerald-400">{remainingItems} stavki</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <span className="text-xs text-slate-400 whitespace-nowrap">Ukupni napredak</span>
              <Progress value={progress} className="h-2 flex-1" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to parse unfound items for matching
export const parseUnmatchedItems = (notFoundList: string[]): UnmatchedSaleItem[] => {
  return notFoundList.map(item => {
    // Parse format like: "hlače 7 (količina: 2, cijena: 7.00€) [CSV norm.: "hlace 7", ...]"
    const quantityMatch = item.match(/\(količina:\s*(\d+)/);
    const priceMatch = item.match(/cijena:\s*(\d+(?:[.,]\d+)?)/);
    
    // Get the original product name (before the parentheses)
    const nameMatch = item.match(/^([^(]+)/);
    const originalName = nameMatch ? nameMatch[1].trim() : item;
    
    // Parse the name without price suffix
    const priceInNameMatch = originalName.match(/(\d+(?:[.,]\d+)?)\s*€?\s*$/);
    let parsedName = originalName;
    let parsedPrice: number | null = null;
    
    if (priceInNameMatch) {
      parsedPrice = parseFloat(priceInNameMatch[1].replace(',', '.'));
      parsedName = originalName.replace(priceInNameMatch[0], '').trim();
    } else if (priceMatch) {
      parsedPrice = parseFloat(priceMatch[1].replace(',', '.'));
    }
    
    return {
      originalName,
      parsedName,
      parsedPrice,
      quantity: quantityMatch ? parseInt(quantityMatch[1], 10) : 1,
    };
  });
};
