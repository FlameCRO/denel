import { useState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

interface UnfoundItem {
  originalName: string;
  parsedName: string;
  parsedPrice: number | null;
  quantity: number;
}

interface UnfoundItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unfoundItems: UnfoundItem[];
  onAddItems: (items: Array<{ name: string; price: number; quantity: number }>) => void;
}

interface EditableItem {
  id: string;
  selected: boolean;
  name: string;
  price: string;
  quantity: string;
}

export const UnfoundItemsDialog = ({
  open,
  onOpenChange,
  unfoundItems,
  onAddItems,
}: UnfoundItemsDialogProps) => {
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);

  // Initialize editable items when dialog opens
  useState(() => {
    if (open && unfoundItems.length > 0) {
      setEditableItems(
        unfoundItems.map((item, index) => ({
          id: `unfound-${index}`,
          selected: true,
          name: item.parsedName,
          price: item.parsedPrice?.toFixed(2) || '',
          quantity: item.quantity.toString(),
        }))
      );
    }
  });

  // Reset items when unfoundItems change
  const resetItems = () => {
    setEditableItems(
      unfoundItems.map((item, index) => ({
        id: `unfound-${index}`,
        selected: true,
        name: item.parsedName,
        price: item.parsedPrice?.toFixed(2) || '',
        quantity: item.quantity.toString(),
      }))
    );
  };

  // Call reset when dialog opens
  if (open && editableItems.length === 0 && unfoundItems.length > 0) {
    resetItems();
  }

  const handleItemChange = (id: string, field: keyof EditableItem, value: string | boolean) => {
    setEditableItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setEditableItems(prev =>
      prev.map(item => ({ ...item, selected: checked }))
    );
  };

  const handleRemoveItem = (id: string) => {
    setEditableItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = () => {
    const itemsToAdd = editableItems
      .filter(item => item.selected && item.name.trim() && item.price && item.quantity)
      .map(item => ({
        name: item.name.trim(),
        price: parseFloat(item.price.replace(',', '.')),
        quantity: parseInt(item.quantity, 10),
      }))
      .filter(item => !isNaN(item.price) && !isNaN(item.quantity) && item.quantity > 0);

    if (itemsToAdd.length > 0) {
      onAddItems(itemsToAdd);
    }
    
    setEditableItems([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setEditableItems([]);
    onOpenChange(false);
  };

  const selectedCount = editableItems.filter(item => item.selected).length;
  const validCount = editableItems.filter(
    item => item.selected && item.name.trim() && item.price && item.quantity
  ).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nepronađeni artikli</DialogTitle>
          <DialogDescription>
            Sljedeći artikli nisu pronađeni u inventuri. Možete ih ručno dodati s ispravnim podacima.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2 border-b">
          <Checkbox
            id="select-all"
            checked={selectedCount === editableItems.length && editableItems.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Odaberi sve ({selectedCount}/{editableItems.length})
          </Label>
        </div>

        <ScrollArea className="flex-1 max-h-[400px] pr-4">
          <div className="space-y-3">
            {editableItems.map((item, index) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border ${
                  item.selected ? 'bg-muted/50 border-primary/30' : 'bg-muted/20 border-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={(checked) => handleItemChange(item.id, 'selected', !!checked)}
                    className="mt-2"
                  />
                  
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <Label className="text-xs text-muted-foreground">Naziv</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        placeholder="Naziv artikla"
                        className="mt-1"
                        disabled={!item.selected}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Cijena (€)</Label>
                      <Input
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                        placeholder="0.00"
                        className="mt-1"
                        disabled={!item.selected}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Količina</Label>
                      <Input
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        placeholder="0"
                        type="number"
                        min="1"
                        className="mt-1"
                        disabled={!item.selected}
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {unfoundItems[index] && (
                  <p className="text-xs text-muted-foreground mt-2 ml-7">
                    Originalni: {unfoundItems[index].originalName}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <div className="flex-1 text-sm text-muted-foreground">
            {validCount > 0 
              ? `${validCount} artikala spremno za dodavanje`
              : 'Ispunite podatke za artikle koje želite dodati'
            }
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Odustani
            </Button>
            <Button onClick={handleSubmit} disabled={validCount === 0} className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj u inventuru ({validCount})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to parse unfound items from the import result
export const parseUnfoundItems = (notFoundList: string[]): UnfoundItem[] => {
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
