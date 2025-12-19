import { useState, useRef } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { InventoryTable } from '@/components/InventoryTable';
import { AddItemDialog } from '@/components/AddItemDialog';
import { QuantityDialog } from '@/components/QuantityDialog';
import { DailyReportDialog } from '@/components/DailyReportDialog';
import { TransactionHistoryDialog } from '@/components/TransactionHistoryDialog';
import { IncomingCalculationDialog } from '@/components/IncomingCalculationDialog';
import { CategoryManagementDialog } from '@/components/CategoryManagementDialog';
import { ExchangeDialog, ExchangeData } from '@/components/ExchangeDialog';
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
  Tags,
  Calculator,
  Info,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';

interface WarehousePageProps {
  warehouseId: string;
  warehouseName: string;
}

export const WarehousePage = ({ warehouseId, warehouseName }: WarehousePageProps) => {
  const {
    items,
    transactions,
    savedCalculations,
    addItem,
    updateItem,
    deleteItem,
    recordSale,
    recordIncoming,
    recordExchange,
    addIncomingCalculation,
    updateIncomingCalculation,
    importCalculations,
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
    importInventoryFromCSV,
    resetAllSales,
    deleteAllItems,
    categorizeAllItems,
  } = useInventory(warehouseId);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvSalesInputRef = useRef<HTMLInputElement>(null);
  const csvItemsInputRef = useRef<HTMLInputElement>(null);
  const csvInventoryInputRef = useRef<HTMLInputElement>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClothingItem | null>(null);
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [quantityDialogType, setQuantityDialogType] = useState<'sale' | 'incoming'>('sale');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [dailyReportOpen, setDailyReportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [incomingCalcOpen, setIncomingCalcOpen] = useState(false);
  const [categoryManagementOpen, setCategoryManagementOpen] = useState(false);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  
  const { categories, addCategory, renameCategory, deleteCategory, getCategoryLabel } = useCategories(warehouseId);

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
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportSalesCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('[CSV Import] Starting import for file:', file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        console.log('[CSV Import] File content loaded, length:', content?.length);
        
        const result = importSalesFromCSV(content);
        console.log('[CSV Import] Import result:', result);
        
        if (result.success) {
          let description = result.message;
          if (result.notFound && result.notFound.length > 0) {
            description += `\n\nNepronađeni artikli (${result.notFound.length}):`;
            const itemsToShow = result.notFound.slice(0, 10);
            description += '\n' + itemsToShow.join('\n');
            if (result.notFound.length > 10) {
              description += `\n... i još ${result.notFound.length - 10} artikala`;
            }
          }
          toast({
            title: 'Uvoz prodaja uspješan',
            description: (
              <pre className="whitespace-pre-wrap text-xs max-h-[300px] overflow-y-auto">
                {description}
              </pre>
            ),
            duration: (result.notFound?.length || 0) > 0 ? 15000 : 5000,
          });
        } else {
          toast({
            title: 'Greška pri uvozu',
            description: result.message || 'Nepoznata greška',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('[CSV Import] Error during import:', error);
        toast({
          title: 'Greška pri uvozu',
          description: `Došlo je do greške: ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
          variant: 'destructive',
        });
      }
    };
    
    reader.onerror = () => {
      console.error('[CSV Import] FileReader error');
      toast({
        title: 'Greška pri čitanju',
        description: 'Nije moguće pročitati datoteku.',
        variant: 'destructive',
      });
    };
    
    reader.readAsText(file);
    
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
    
    if (csvItemsInputRef.current) {
      csvItemsInputRef.current.value = '';
    }
  };

  const handleImportInventoryCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = importInventoryFromCSV(content);
        
        if (result.success) {
          toast({
            title: 'Uvoz inventure uspješan',
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
    
    if (csvInventoryInputRef.current) {
      csvInventoryInputRef.current.value = '';
    }
  };

  const handleIncomingCalculation = (
    invoiceName: string,
    incomingItems: Array<{ id: string; name: string; category: string; price: number; quantity: number }>,
    pdfData?: { base64: string; fileName: string }
  ) => {
    addIncomingCalculation(invoiceName, incomingItems, pdfData);
    toast({
      title: 'Kalkulacija spremljena',
      description: `${invoiceName} - dodano ${incomingItems.length} artikala.`,
    });
  };

  const handleUpdateCalculation = (
    calculationId: string,
    invoiceName: string,
    incomingItems: Array<{ id: string; name: string; category: string; price: number; quantity: number }>,
    pdfData?: { base64: string; fileName: string }
  ) => {
    updateIncomingCalculation(calculationId, invoiceName, incomingItems, pdfData);
  };

  const handleCategorizeAll = () => {
    const { categorizedCount, mergedCount } = categorizeAllItems(categories, addCategory);
    const messages: string[] = [];
    if (categorizedCount > 0) messages.push(`Kategorizirano ${categorizedCount} artikala`);
    if (mergedCount > 0) messages.push(`Spojeno ${mergedCount} duplikata`);
    
    toast({
      title: 'Kategorizacija i spajanje završeno',
      description: messages.length > 0 
        ? messages.join('. ') + '.'
        : 'Svi artikli su već pravilno kategorizirani i nema duplikata.',
    });
  };

  const handleRemoveSoldOut = () => {
    const soldOutItems = items.filter(item => item.quantityOwned === 0);
    if (soldOutItems.length === 0) {
      toast({
        title: 'Nema rasprodanih artikala',
        description: 'Nema artikala sa stanjem 0.',
      });
      return;
    }
    
    soldOutItems.forEach(item => deleteItem(item.id));
    toast({
      title: 'Rasprodani artikli uklonjeni',
      description: `Obrisano ${soldOutItems.length} artikala sa stanjem 0.`,
      variant: 'destructive',
    });
  };

  const handleExchange = (exchanges: ExchangeData[]) => {
    recordExchange(exchanges);
    toast({
      title: 'Razmjena izvršena',
      description: `Ažurirano ${exchanges.length} artikala.`,
    });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantityOwned, 0);
  const totalSold = items.reduce((sum, item) => sum + item.quantitySold, 0);
  const lowStockCount = getLowStockItems().length;
  const totalCalculationsValue = savedCalculations.reduce((sum, calc) => {
    return sum + calc.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
          title="Vrijednost kalkulacija"
          value={formatPrice(totalCalculationsValue)}
          subtitle={`${savedCalculations.length} kalkulacija`}
          icon={Calculator}
          variant="primary"
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
        <h2 className="text-2xl font-semibold text-foreground">{warehouseName}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setDailyReportOpen(true)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Dnevni izvještaj
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Izvezi CSV
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Izvoz u CSV format</p>
                <p className="text-xs">Stupci: Naziv, Kategorija, Cijena, Na stanju, Prodano, U dolasku</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleExportJSON}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Backup
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Backup u JSON format</p>
                <p className="text-xs">Sprema kompletne podatke svih artikala uključujući sve količine i kategorije.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Uvezi
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Uvoz iz JSON backupa</p>
                <p className="text-xs">Učitava prethodno spremljeni backup. Zamjenjuje sve trenutne podatke!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => csvSalesInputRef.current?.click()}
                  className="gap-2"
                >
                  <FileInput className="h-4 w-4" />
                  Uvezi prodaju (CSV)
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Uvoz prodaje iz CSV-a</p>
                <p className="text-xs">Očekivani format: Naziv artikla, Količina prodano</p>
                <p className="text-xs mt-1">Traži artikl po imenu i dodaje prodanu količinu.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={csvSalesInputRef}
            type="file"
            accept=".csv,text/csv,text/plain,application/vnd.ms-excel,*/*"
            onChange={handleImportSalesCSV}
            style={{ display: 'none', position: 'absolute', left: '-9999px' }}
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => csvItemsInputRef.current?.click()}
                  className="gap-2"
                >
                  <FileInput className="h-4 w-4" />
                  Uvezi artikle (CSV)
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Uvoz novih artikala iz CSV-a</p>
                <p className="text-xs">Očekivani format: Naziv, Kategorija, Cijena, Količina</p>
                <p className="text-xs mt-1">Dodaje nove artikle u inventuru.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={csvItemsInputRef}
            type="file"
            accept=".csv,text/csv,text/plain,application/vnd.ms-excel,*/*"
            onChange={handleImportItemsCSV}
            style={{ display: 'none', position: 'absolute', left: '-9999px' }}
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => csvInventoryInputRef.current?.click()}
                  className="gap-2"
                >
                  <FileInput className="h-4 w-4" />
                  Uvezi Inventuru
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Uvoz inventure iz CSV-a</p>
                <p className="text-xs">Očekivani format: Naziv, Cijena, Količina na stanju</p>
                <p className="text-xs mt-1">Ažurira količine postojećih artikala ili dodaje nove.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={csvInventoryInputRef}
            type="file"
            accept=".csv,text/csv,text/plain,application/vnd.ms-excel,*/*"
            onChange={handleImportInventoryCSV}
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
          <Button
            variant="outline"
            onClick={handleCategorizeAll}
            className="gap-2"
          >
            <Tags className="h-4 w-4" />
            Kategoriziraj - spoji
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Ukloni rasprodani artikl
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
              <AlertDialogHeader>
                <AlertDialogTitle>Ukloniti rasprodane artikle?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="text-sm text-muted-foreground">
                    <p>Ova akcija će obrisati sve artikle koji imaju stanje 0.</p>
                    {items.filter(item => item.quantityOwned === 0).length > 0 ? (
                      <>
                        <p className="mt-2 font-medium">Artikli za brisanje ({items.filter(item => item.quantityOwned === 0).length}):</p>
                        <ul className="mt-1 max-h-[200px] overflow-y-auto border rounded p-2 bg-muted/50">
                          {items.filter(item => item.quantityOwned === 0).map(item => (
                            <li key={item.id} className="py-1 border-b last:border-b-0">
                              {item.name} - {formatPrice(item.price)} <span className="text-xs text-muted-foreground">({item.category})</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="mt-2">Nema artikala sa stanjem 0.</p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Odustani</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemoveSoldOut}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={items.filter(item => item.quantityOwned === 0).length === 0}
                >
                  Ukloni
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
            onClick={() => setExchangeDialogOpen(true)}
            className="gap-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Razmjeni
          </Button>
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
        onUpdate={handleUpdateCalculation}
        onImportCalculations={importCalculations}
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

      <ExchangeDialog
        open={exchangeDialogOpen}
        onOpenChange={setExchangeDialogOpen}
        items={items}
        onExchange={handleExchange}
      />
    </div>
  );
};
