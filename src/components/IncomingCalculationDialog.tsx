import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES } from '@/types/inventory';
import { Plus, Trash2, FileInput } from 'lucide-react';

interface IncomingItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

interface IncomingCalculationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (invoiceName: string, items: IncomingItem[]) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const IncomingCalculationDialog = ({
  open,
  onOpenChange,
  onSave,
}: IncomingCalculationDialogProps) => {
  const [invoiceName, setInvoiceName] = useState('');
  const [items, setItems] = useState<IncomingItem[]>([
    { id: generateId(), name: '', category: 'majice', price: 0, quantity: 1 },
  ]);

  const handleAddRow = () => {
    setItems([
      ...items,
      { id: generateId(), name: '', category: 'majice', price: 0, quantity: 1 },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof IncomingItem, value: string | number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = () => {
    const validItems = items.filter(item => item.name.trim() && item.quantity > 0);
    if (invoiceName.trim() && validItems.length > 0) {
      onSave(invoiceName.trim(), validItems);
      handleReset();
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setInvoiceName('');
    setItems([{ id: generateId(), name: '', category: 'majice', price: 0, quantity: 1 }]);
  };

  const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileInput className="h-5 w-5 text-primary" />
            Ulazna kalkulacija
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invoice Name */}
          <div className="space-y-2">
            <Label htmlFor="invoiceName" className="text-base font-medium">
              Naziv kalkulacije / računa
            </Label>
            <Input
              id="invoiceName"
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
              placeholder="npr. Dobavljač XY - 15.12.2024"
              className="text-base"
            />
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Artikli</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Dodaj red
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_140px_100px_80px_40px] gap-2 p-3 bg-muted/50 text-sm font-medium text-muted-foreground">
                <span>Naziv artikla</span>
                <span>Kategorija</span>
                <span>Cijena (€)</span>
                <span>Količina</span>
                <span></span>
              </div>

              {/* Rows */}
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_140px_100px_80px_40px] gap-2 p-3 border-t items-center"
                >
                  <Input
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                    placeholder="Naziv artikla"
                    className="h-9"
                  />
                  <Select
                    value={item.category}
                    onValueChange={(value) => handleItemChange(item.id, 'category', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price || ''}
                    onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="h-9"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity || ''}
                    onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    placeholder="1"
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRow(item.id)}
                    disabled={items.length === 1}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="flex justify-end gap-6 pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Ukupno artikala</p>
              <p className="text-lg font-semibold">{totalQuantity} kom</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Ukupna vrijednost</p>
              <p className="text-lg font-semibold text-primary">
                {new Intl.NumberFormat('hr-HR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(totalValue)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              handleReset();
              onOpenChange(false);
            }}
          >
            Odustani
          </Button>
          <Button
            onClick={handleSave}
            disabled={!invoiceName.trim() || items.every(i => !i.name.trim())}
          >
            Spremi kalkulaciju
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
