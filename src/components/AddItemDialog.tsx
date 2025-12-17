import { useState, useEffect } from 'react';
import { ClothingItem } from '@/types/inventory';
import { Category } from '@/hooks/useCategories';
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
import { Plus, Save } from 'lucide-react';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Omit<ClothingItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editItem?: ClothingItem | null;
  categories: Category[];
}

export const AddItemDialog = ({
  open,
  onOpenChange,
  onSave,
  editItem,
  categories,
}: AddItemDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'majice',
    price: '',
    quantityOwned: '',
    quantitySold: '0',
    quantityIncoming: '0',
  });

  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name,
        category: editItem.category,
        price: editItem.price.toString(),
        quantityOwned: editItem.quantityOwned.toString(),
        quantitySold: editItem.quantitySold.toString(),
        quantityIncoming: editItem.quantityIncoming.toString(),
      });
    } else {
      setFormData({
        name: '',
        category: 'majice',
        price: '',
        quantityOwned: '',
        quantitySold: '0',
        quantityIncoming: '0',
      });
    }
  }, [editItem, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      quantityOwned: parseInt(formData.quantityOwned) || 0,
      quantitySold: parseInt(formData.quantitySold) || 0,
      quantityIncoming: parseInt(formData.quantityIncoming) || 0,
    });
    onOpenChange(false);
  };

  const isValid = formData.name.trim() && formData.price && formData.quantityOwned;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editItem ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editItem ? 'Uredi artikl' : 'Dodaj novi artikl'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naziv artikla</Label>
            <Input
              id="name"
              placeholder="npr. Bijela pamučna majica"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorija</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Odaberi kategoriju" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Cijena (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityOwned">Količina na stanju</Label>
              <Input
                id="quantityOwned"
                type="number"
                min="0"
                placeholder="0"
                value={formData.quantityOwned}
                onChange={(e) => setFormData(prev => ({ ...prev, quantityOwned: e.target.value }))}
                required
              />
            </div>
          </div>

          {editItem && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantitySold">Prodano</Label>
                <Input
                  id="quantitySold"
                  type="number"
                  min="0"
                  value={formData.quantitySold}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantitySold: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityIncoming">Dolazno</Label>
                <Input
                  id="quantityIncoming"
                  type="number"
                  min="0"
                  value={formData.quantityIncoming}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantityIncoming: e.target.value }))}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Odustani
            </Button>
            <Button type="submit" disabled={!isValid}>
              {editItem ? 'Spremi promjene' : 'Dodaj artikl'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
