import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';

interface WarehouseManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WarehouseManagers {
  warehouse1: string;
  warehouse2: string;
}

const DEFAULT_MANAGERS: WarehouseManagers = {
  warehouse1: 'Elvis Perika',
  warehouse2: 'Ivana Majdak',
};

export const getWarehouseManagers = (): WarehouseManagers => {
  if (typeof window === 'undefined') return DEFAULT_MANAGERS;
  
  const saved = localStorage.getItem('warehouseManagers');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_MANAGERS;
    }
  }
  return DEFAULT_MANAGERS;
};

export const WarehouseManagerDialog = ({ open, onOpenChange }: WarehouseManagerDialogProps) => {
  const { toast } = useToast();
  const [managers, setManagers] = useState<WarehouseManagers>(DEFAULT_MANAGERS);

  useEffect(() => {
    if (open) {
      setManagers(getWarehouseManagers());
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem('warehouseManagers', JSON.stringify(managers));
    toast({
      title: 'Spremljeno',
      description: 'Odgovorne osobe su ažurirane.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Odgovorne osobe skladišta</DialogTitle>
          <DialogDescription>
            Unesite imena odgovornih osoba za svako skladište.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="warehouse1-manager">Skladište 1 - Odgovorna osoba</Label>
            <Input
              id="warehouse1-manager"
              value={managers.warehouse1}
              onChange={(e) => setManagers({ ...managers, warehouse1: e.target.value })}
              placeholder="Unesite ime odgovorne osobe"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="warehouse2-manager">Skladište 2 - Odgovorna osoba</Label>
            <Input
              id="warehouse2-manager"
              value={managers.warehouse2}
              onChange={(e) => setManagers({ ...managers, warehouse2: e.target.value })}
              placeholder="Unesite ime odgovorne osobe"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Odustani
          </Button>
          <Button onClick={handleSave}>Spremi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
