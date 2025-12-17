import { useState } from 'react';
import { Header } from '@/components/Header';
import { StatsCard } from '@/components/StatsCard';
import { InventoryTable } from '@/components/InventoryTable';
import { AddItemDialog } from '@/components/AddItemDialog';
import { QuantityDialog } from '@/components/QuantityDialog';
import { useInventory } from '@/hooks/useInventory';
import { ClothingItem } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Euro,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const {
    items,
    addItem,
    updateItem,
    deleteItem,
    recordSale,
    recordIncoming,
    getTotalValue,
    getTotalSalesValue,
    getLowStockItems,
  } = useInventory();

  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClothingItem | null>(null);
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [quantityDialogType, setQuantityDialogType] = useState<'sale' | 'incoming'>('sale');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleSaveItem = (item: Omit<ClothingItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editItem) {
      updateItem(editItem.id, item);
      toast({
        title: 'Artikl ažuriran',
        description: `${item.name} je uspješno ažuriran.`,
      });
    } else {
      addItem(item);
      toast({
        title: 'Artikl dodan',
        description: `${item.name} je uspješno dodan u inventuru.`,
      });
    }
    setEditItem(null);
  };

  const handleEdit = (item: ClothingItem) => {
    setEditItem(item);
    setAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const item = items.find(i => i.id === id);
    deleteItem(id);
    toast({
      title: 'Artikl obrisan',
      description: `${item?.name} je obrisan iz inventure.`,
      variant: 'destructive',
    });
  };

  const handleRecordSale = (item: ClothingItem) => {
    setSelectedItem(item);
    setQuantityDialogType('sale');
    setQuantityDialogOpen(true);
  };

  const handleRecordIncoming = (item: ClothingItem) => {
    setSelectedItem(item);
    setQuantityDialogType('incoming');
    setQuantityDialogOpen(true);
  };

  const handleQuantityConfirm = (id: string, quantity: number) => {
    if (quantityDialogType === 'sale') {
      recordSale(id, quantity);
      toast({
        title: 'Prodaja evidentirana',
        description: `Prodano ${quantity} komada.`,
      });
    } else {
      recordIncoming(id, quantity);
      toast({
        title: 'Dolazak evidentiran',
        description: `Zaprimljeno ${quantity} komada.`,
      });
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantityOwned, 0);
  const totalSold = items.reduce((sum, item) => sum + item.quantitySold, 0);
  const lowStockCount = getLowStockItems().length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Ukupno artikala"
            value={items.length}
            subtitle={`${totalItems} kom na stanju`}
            icon={Package}
            variant="primary"
          />
          <StatsCard
            title="Vrijednost inventure"
            value={formatPrice(getTotalValue())}
            subtitle="Na trenutnom stanju"
            icon={Euro}
            variant="default"
          />
          <StatsCard
            title="Ukupna prodaja"
            value={formatPrice(getTotalSalesValue())}
            subtitle={`${totalSold} prodanih artikala`}
            icon={TrendingUp}
            variant="success"
          />
          <StatsCard
            title="Dolazna roba"
            value={items.reduce((sum, item) => sum + item.quantityIncoming, 0)}
            subtitle="Komada u dolasku"
            icon={TrendingDown}
            variant="default"
          />
          <StatsCard
            title="Niska zaliha"
            value={lowStockCount}
            subtitle={lowStockCount > 0 ? 'Potrebna nabava' : 'Sve u redu'}
            icon={AlertTriangle}
            variant={lowStockCount > 0 ? 'warning' : 'default'}
          />
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Inventura</h2>
          <Button
            onClick={() => {
              setEditItem(null);
              setAddDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Dodaj artikl
          </Button>
        </div>

        {/* Inventory Table */}
        <InventoryTable
          items={items}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRecordSale={handleRecordSale}
          onRecordIncoming={handleRecordIncoming}
        />
      </main>

      {/* Dialogs */}
      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditItem(null);
        }}
        onSave={handleSaveItem}
        editItem={editItem}
      />

      <QuantityDialog
        open={quantityDialogOpen}
        onOpenChange={setQuantityDialogOpen}
        item={selectedItem}
        type={quantityDialogType}
        onConfirm={handleQuantityConfirm}
      />
    </div>
  );
};

export default Index;
