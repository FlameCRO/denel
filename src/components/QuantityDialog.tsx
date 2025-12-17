import { useState } from 'react';
import { ClothingItem } from '@/types/inventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface QuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ClothingItem | null;
  type: 'sale' | 'incoming';
  onConfirm: (id: string, quantity: number) => void;
}

export const QuantityDialog = ({
  open,
  onOpenChange,
  item,
  type,
  onConfirm,
}: QuantityDialogProps) => {
  const [quantity, setQuantity] = useState('1');

  const handleConfirm = () => {
    if (item && parseInt(quantity) > 0) {
      onConfirm(item.id, parseInt(quantity));
      onOpenChange(false);
      setQuantity('1');
    }
  };

  const isSale = type === 'sale';
  const Icon = isSale ? TrendingDown : TrendingUp;
  const maxQuantity = isSale ? item?.quantityOwned || 0 : 999;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${isSale ? 'text-destructive' : 'text-success'}`} />
            {isSale ? 'Evidentiraj prodaju' : 'Evidentiraj dolazak'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {item?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Količina</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoFocus
            />
            {isSale && (
              <p className="text-xs text-muted-foreground">
                Dostupno na stanju: {item?.quantityOwned || 0}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Odustani
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!quantity || parseInt(quantity) < 1 || (isSale && parseInt(quantity) > maxQuantity)}
            variant={isSale ? 'destructive' : 'default'}
            className={!isSale ? 'bg-success hover:bg-success/90' : ''}
          >
            Potvrdi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
