import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClothingItem } from '@/types/inventory';
import { Plus, Minus, ArrowRightLeft, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExchangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ClothingItem[];
  onExchange: (exchanges: ExchangeData[]) => void;
}

export interface ExchangeData {
  itemId: string;
  itemName: string;
  soldChange: number;
  stockChange: number;
  originalSold: number;
  originalStock: number;
}

export const ExchangeDialog = ({
  open,
  onOpenChange,
  items,
  onExchange,
}: ExchangeDialogProps) => {
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [selectedItem1, setSelectedItem1] = useState<ClothingItem | null>(null);
  const [selectedItem2, setSelectedItem2] = useState<ClothingItem | null>(null);
  
  // Track changes for both items
  const [item1SoldChange, setItem1SoldChange] = useState(0);
  const [item1StockChange, setItem1StockChange] = useState(0);
  const [item2SoldChange, setItem2SoldChange] = useState(0);
  const [item2StockChange, setItem2StockChange] = useState(0);

  const filteredItems1 = useMemo(() => {
    if (!search1.trim()) return [];
    return items.filter(item =>
      item.name.toLowerCase().includes(search1.toLowerCase())
    ).slice(0, 10);
  }, [items, search1]);

  const filteredItems2 = useMemo(() => {
    if (!search2.trim()) return [];
    return items.filter(item =>
      item.name.toLowerCase().includes(search2.toLowerCase())
    ).slice(0, 10);
  }, [items, search2]);

  const handleSelectItem1 = (item: ClothingItem) => {
    setSelectedItem1(item);
    setSearch1(item.name);
    setItem1SoldChange(0);
    setItem1StockChange(0);
  };

  const handleSelectItem2 = (item: ClothingItem) => {
    setSelectedItem2(item);
    setSearch2(item.name);
    setItem2SoldChange(0);
    setItem2StockChange(0);
  };

  const handleConfirm = () => {
    const exchanges: ExchangeData[] = [];
    
    if (selectedItem1 && (item1SoldChange !== 0 || item1StockChange !== 0)) {
      exchanges.push({
        itemId: selectedItem1.id,
        itemName: selectedItem1.name,
        soldChange: item1SoldChange,
        stockChange: item1StockChange,
        originalSold: selectedItem1.quantitySold,
        originalStock: selectedItem1.quantityOwned,
      });
    }
    
    if (selectedItem2 && (item2SoldChange !== 0 || item2StockChange !== 0)) {
      exchanges.push({
        itemId: selectedItem2.id,
        itemName: selectedItem2.name,
        soldChange: item2SoldChange,
        stockChange: item2StockChange,
        originalSold: selectedItem2.quantitySold,
        originalStock: selectedItem2.quantityOwned,
      });
    }
    
    if (exchanges.length > 0) {
      onExchange(exchanges);
    }
    
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setSearch1('');
    setSearch2('');
    setSelectedItem1(null);
    setSelectedItem2(null);
    setItem1SoldChange(0);
    setItem1StockChange(0);
    setItem2SoldChange(0);
    setItem2StockChange(0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const hasChanges = 
    (selectedItem1 && (item1SoldChange !== 0 || item1StockChange !== 0)) ||
    (selectedItem2 && (item2SoldChange !== 0 || item2StockChange !== 0));

  const renderItemControl = (
    item: ClothingItem | null,
    soldChange: number,
    stockChange: number,
    setSoldChange: (val: number) => void,
    setStockChange: (val: number) => void
  ) => {
    if (!item) return null;

    const newSold = item.quantitySold + soldChange;
    const newStock = item.quantityOwned + stockChange;

    return (
      <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
        <div className="font-medium text-sm truncate">{item.name}</div>
        <div className="text-xs text-muted-foreground">{formatPrice(item.price)}</div>
        
        {/* Prodano */}
        <div className="space-y-2">
          <Label className="text-xs">Prodano</Label>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setSoldChange(soldChange + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <div className="text-lg font-semibold">{newSold}</div>
              {soldChange !== 0 && (
                <div className="text-xs text-muted-foreground">
                  Originalno: {item.quantitySold} ({soldChange > 0 ? '+' : ''}{soldChange})
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (newSold > 0) setSoldChange(soldChange - 1);
              }}
              disabled={newSold <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Na stanju */}
        <div className="space-y-2">
          <Label className="text-xs">Na stanju</Label>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setStockChange(stockChange + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <div className="text-lg font-semibold">{newStock}</div>
              {stockChange !== 0 && (
                <div className="text-xs text-muted-foreground">
                  Originalno: {item.quantityOwned} ({stockChange > 0 ? '+' : ''}{stockChange})
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (newStock > 0) setStockChange(stockChange - 1);
              }}
              disabled={newStock <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleReset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Razmjeni artikle
          </DialogTitle>
          <DialogDescription>
            Pretražite artikle i prilagodite količine "Prodano" i "Na stanju".
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 overflow-y-auto flex-1">
          {/* Item 1 */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži prvi artikl..."
                value={search1}
                onChange={(e) => {
                  setSearch1(e.target.value);
                  if (selectedItem1 && e.target.value !== selectedItem1.name) {
                    setSelectedItem1(null);
                    setItem1SoldChange(0);
                    setItem1StockChange(0);
                  }
                }}
                className="pl-10"
              />
            </div>
            
            {!selectedItem1 && filteredItems1.length > 0 && (
              <ScrollArea className="h-[200px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredItems1.map(item => (
                    <button
                      key={item.id}
                      className="w-full text-left p-2 hover:bg-muted rounded-md transition-colors"
                      onClick={() => handleSelectItem1(item)}
                    >
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(item.price)} • Na stanju: {item.quantityOwned} • Prodano: {item.quantitySold}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {renderItemControl(
              selectedItem1,
              item1SoldChange,
              item1StockChange,
              setItem1SoldChange,
              setItem1StockChange
            )}
          </div>

          {/* Item 2 */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži drugi artikl..."
                value={search2}
                onChange={(e) => {
                  setSearch2(e.target.value);
                  if (selectedItem2 && e.target.value !== selectedItem2.name) {
                    setSelectedItem2(null);
                    setItem2SoldChange(0);
                    setItem2StockChange(0);
                  }
                }}
                className="pl-10"
              />
            </div>
            
            {!selectedItem2 && filteredItems2.length > 0 && (
              <ScrollArea className="h-[200px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredItems2.map(item => (
                    <button
                      key={item.id}
                      className="w-full text-left p-2 hover:bg-muted rounded-md transition-colors"
                      onClick={() => handleSelectItem2(item)}
                    >
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(item.price)} • Na stanju: {item.quantityOwned} • Prodano: {item.quantitySold}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {renderItemControl(
              selectedItem2,
              item2SoldChange,
              item2StockChange,
              setItem2SoldChange,
              setItem2StockChange
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Odustani
          </Button>
          <Button onClick={handleConfirm} disabled={!hasChanges}>
            Potvrdi razmjenu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
