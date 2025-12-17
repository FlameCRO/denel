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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SavedCalculation } from '@/types/inventory';
import { Category } from '@/hooks/useCategories';
import { Plus, Trash2, FileInput, History, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

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
  savedCalculations: SavedCalculation[];
  categories: Category[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const IncomingCalculationDialog = ({
  open,
  onOpenChange,
  onSave,
  savedCalculations,
  categories,
}: IncomingCalculationDialogProps) => {
  const [invoiceName, setInvoiceName] = useState('');
  const [items, setItems] = useState<IncomingItem[]>([
    { id: generateId(), name: '', category: 'majice', price: 0, quantity: 1 },
  ]);
  const [expandedCalculations, setExpandedCalculations] = useState<Set<string>>(new Set());

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
    }
  };

  const handleReset = () => {
    setInvoiceName('');
    setItems([{ id: generateId(), name: '', category: 'majice', price: 0, quantity: 1 }]);
  };

  const toggleExpanded = (id: string) => {
    setExpandedCalculations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileInput className="h-5 w-5 text-primary" />
            Ulazna kalkulacija
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new" className="gap-2">
              <FileText className="h-4 w-4" />
              Nova kalkulacija
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Spremljene ({savedCalculations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-6 py-4">
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
                {items.map((item) => (
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
                        {categories.map((cat) => (
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
          </TabsContent>

          <TabsContent value="history" className="py-4">
            {savedCalculations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nema spremljenih kalkulacija</p>
                <p className="text-sm">Kreirajte novu kalkulaciju u kartici "Nova kalkulacija"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedCalculations.map((calc) => (
                  <div
                    key={calc.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleExpanded(calc.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{calc.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(calc.createdAt), 'dd.MM.yyyy HH:mm', { locale: hr })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{calc.totalQuantity} artikala</p>
                          <p className="font-semibold text-primary">
                            {new Intl.NumberFormat('hr-HR', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(calc.totalValue)}
                          </p>
                        </div>
                        {expandedCalculations.has(calc.id) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {expandedCalculations.has(calc.id) && (
                      <div className="border-t bg-muted/30">
                        <div className="grid grid-cols-[1fr_120px_80px_100px] gap-2 p-3 text-sm font-medium text-muted-foreground border-b">
                          <span>Artikl</span>
                          <span>Kategorija</span>
                          <span>Količina</span>
                          <span className="text-right">Cijena</span>
                        </div>
                        {calc.items.map((item) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-[1fr_120px_80px_100px] gap-2 p-3 text-sm border-b last:border-b-0"
                          >
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground">{getCategoryLabel(item.category)}</span>
                            <span>{item.quantity} kom</span>
                            <span className="text-right">
                              {new Intl.NumberFormat('hr-HR', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
