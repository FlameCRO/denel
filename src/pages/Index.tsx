import { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { StatsCard } from '@/components/StatsCard';
import { InventoryTable } from '@/components/InventoryTable';
import { AddItemDialog } from '@/components/AddItemDialog';
import { QuantityDialog } from '@/components/QuantityDialog';
import { DailyReportDialog } from '@/components/DailyReportDialog';
import { TransactionHistoryDialog } from '@/components/TransactionHistoryDialog';
import { IncomingCalculationDialog } from '@/components/IncomingCalculationDialog';
import { CategoryManagementDialog } from '@/components/CategoryManagementDialog';
import { useInventory } from '@/hooks/useInventory';
import { useCategories } from '@/hooks/useCategories';
import { ClothingItem } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Euro,
  FileText,
  Download,
  History,
  FileInput,
  Upload,
  Save,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const {
    items,
    transactions,
    savedCalculations,
    addItem,
    updateItem,
    deleteItem,
    recordSale,
    recordIncoming,
    addIncomingCalculation,
    getTotalValue,
    getTotalSalesValue,
    getLowStockItems,
    getTodaySales,
    getTodayIncoming,
    exportToCSV,
    exportToJSON,
    importFromJSON,
    importSalesFromCSV,
    importItemsFromCSV,
    resetAllSales,
    deleteAllItems,
  } = useInventory();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvSalesInputRef = useRef<HTMLInputElement>(null);
  const csvItemsInputRef = useRef<HTMLInputElement>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClothingItem | null>(null);
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [quantityDialogType, setQuantityDialogType] = useState<'sale' | 'incoming'>('sale');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [dailyReportOpen, setDailyReportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [incomingCalcOpen, setIncomingCalcOpen] = useState(false);
  const [categoryManagementOpen, setCategoryManagementOpen] = useState(false);
  
  const { categories, addCategory, renameCategory, deleteCategory, getCategoryLabel } = useCategories();

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

  const handleExportCSV = () => {
    exportToCSV();
    toast({
      title: 'Izvoz uspješan',
      description: 'CSV datoteka je preuzeta.',
    });
  };

  const handleExportJSON = () => {
    exportToJSON();
    toast({
      title: 'Backup spremljen',
      description: 'JSON datoteka s kompletnim podacima je preuzeta.',
    });
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importFromJSON(content);
      
      if (result.success) {
        toast({
          title: 'Uvoz uspješan',
          description: result.message,
        });
      } else {
        toast({
          title: 'Greška pri uvozu',
          description: result.message,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportSalesCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        console.log('File content loaded, length:', content?.length);
        
        const result = importSalesFromCSV(content);
        console.log('Import result:', result);
        
        if (result.success) {
          let description = result.message;
          if (result.notFound.length > 0) {
            description += ` (${result.notFound.length} nije pronađeno)`;
          }
          toast({
            title: 'Uvoz prodaja uspješan',
            description,
          });
        } else {
          toast({
            title: 'Greška pri uvozu',
            description: result.message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error processing CSV:', error);
        toast({
          title: 'Greška pri uvozu',
          description: 'Došlo je do greške pri obradi datoteke.',
          variant: 'destructive',
        });
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      toast({
        title: 'Greška pri čitanju',
        description: 'Nije moguće pročitati datoteku.',
        variant: 'destructive',
      });
    };
    
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    if (csvSalesInputRef.current) {
      csvSalesInputRef.current.value = '';
    }
  };

  const handleImportItemsCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = importItemsFromCSV(content);
        
        if (result.success) {
          toast({
            title: 'Uvoz artikala uspješan',
            description: result.message,
          });
        } else {
          toast({
            title: 'Greška pri uvozu',
            description: result.message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Greška pri uvozu',
          description: 'Došlo je do greške pri obradi datoteke.',
          variant: 'destructive',
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    if (csvItemsInputRef.current) {
      csvItemsInputRef.current.value = '';
    }
  };

  const handleIncomingCalculation = (
    invoiceName: string,
    incomingItems: Array<{ id: string; name: string; category: string; price: number; quantity: number }>
  ) => {
    addIncomingCalculation(invoiceName, incomingItems);
    toast({
      title: 'Kalkulacija spremljena',
      description: `${invoiceName} - dodano ${incomingItems.length} artikala.`,
    });
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-semibold text-foreground">Inventura</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setDailyReportOpen(true)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Dnevni izvještaj
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Izvezi CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportJSON}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Backup
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Uvezi
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => csvSalesInputRef.current?.click()}
              className="gap-2"
            >
              <FileInput className="h-4 w-4" />
              Uvezi prodaju (CSV)
            </Button>
            <input
              ref={csvSalesInputRef}
              type="file"
              accept=".csv,text/csv,text/plain,application/vnd.ms-excel,*/*"
              onChange={handleImportSalesCSV}
              style={{ display: 'none', position: 'absolute', left: '-9999px' }}
            />
            <Button
              variant="outline"
              onClick={() => csvItemsInputRef.current?.click()}
              className="gap-2"
            >
              <FileInput className="h-4 w-4" />
              Uvezi artikle (CSV)
            </Button>
            <input
              ref={csvItemsInputRef}
              type="file"
              accept=".csv,text/csv,text/plain,application/vnd.ms-excel,*/*"
              onChange={handleImportItemsCSV}
              style={{ display: 'none', position: 'absolute', left: '-9999px' }}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset prodano
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Resetirati sve prodano?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ova akcija će postaviti prodanu količinu na 0 za sve artikle. Ova radnja se ne može poništiti.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Odustani</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      resetAllSales();
                      toast({
                        title: 'Reset uspješan',
                        description: 'Sve prodane količine su postavljene na 0.',
                      });
                    }}
                  >
                    Resetiraj
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Obriši sve
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Obrisati sve artikle?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ova akcija će trajno obrisati SVE artikle, povijest transakcija i spremljene kalkulacije. Ova radnja se NE MOŽE poništiti!
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Odustani</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteAllItems();
                      toast({
                        title: 'Brisanje uspješno',
                        description: 'Svi artikli su obrisani.',
                        variant: 'destructive',
                      });
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Obriši sve
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              onClick={() => setHistoryOpen(true)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Povijest
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIncomingCalcOpen(true)}
              className="gap-2"
            >
              <FileInput className="h-4 w-4" />
              Ulazna kalkulacija
            </Button>
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
        </div>

        {/* Inventory Table */}
        <InventoryTable
          items={items}
          categories={categories}
          getCategoryLabel={getCategoryLabel}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRecordSale={handleRecordSale}
          onRecordIncoming={handleRecordIncoming}
          onManageCategories={() => setCategoryManagementOpen(true)}
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
        categories={categories}
      />

      <QuantityDialog
        open={quantityDialogOpen}
        onOpenChange={setQuantityDialogOpen}
        item={selectedItem}
        type={quantityDialogType}
        onConfirm={handleQuantityConfirm}
      />

      <DailyReportDialog
        open={dailyReportOpen}
        onOpenChange={setDailyReportOpen}
        items={items}
        transactions={transactions}
        todaySales={getTodaySales()}
        todayIncoming={getTodayIncoming()}
        totalValue={getTotalValue()}
        totalSalesValue={getTotalSalesValue()}
      />

      <TransactionHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        transactions={transactions}
      />

      <IncomingCalculationDialog
        open={incomingCalcOpen}
        onOpenChange={setIncomingCalcOpen}
        onSave={handleIncomingCalculation}
        savedCalculations={savedCalculations}
        categories={categories}
      />

      <CategoryManagementDialog
        open={categoryManagementOpen}
        onOpenChange={setCategoryManagementOpen}
        categories={categories}
        onAddCategory={addCategory}
        onRenameCategory={renameCategory}
        onDeleteCategory={deleteCategory}
      />
    </div>
  );
};

export default Index;
