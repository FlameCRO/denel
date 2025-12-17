import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClothingItem, InventoryTransaction } from '@/types/inventory';
import { Printer, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

interface DailyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ClothingItem[];
  transactions: InventoryTransaction[];
  todaySales: number;
  todayIncoming: number;
  totalValue: number;
  totalSalesValue: number;
}

export const DailyReportDialog = ({
  open,
  onOpenChange,
  items,
  transactions,
  todaySales,
  todayIncoming,
  totalValue,
  totalSalesValue,
}: DailyReportDialogProps) => {
  const today = new Date();
  const todayTransactions = transactions.filter(t => {
    const transDate = new Date(t.timestamp);
    transDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return transDate.getTime() === todayDate.getTime();
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantityOwned, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto print:max-w-full print:m-0 print:shadow-none">
        <DialogHeader className="print:mb-4">
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Dnevni izvještaj</span>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden gap-2">
              <Printer className="h-4 w-4" />
              Ispis
            </Button>
          </DialogTitle>
          <p className="text-muted-foreground">
            {format(today, "EEEE, d. MMMM yyyy.", { locale: hr })}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary/10 rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">Danas prodano</span>
              </div>
              <p className="text-2xl font-bold">{todaySales} kom</p>
            </div>
            <div className="bg-success/10 rounded-lg p-4">
              <div className="flex items-center gap-2 text-success mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Danas zaprimljeno</span>
              </div>
              <p className="text-2xl font-bold">{todayIncoming} kom</p>
            </div>
            <div className="bg-secondary rounded-lg p-4">
              <div className="flex items-center gap-2 text-secondary-foreground mb-2">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">Trenutno stanje</span>
              </div>
              <p className="text-2xl font-bold">{totalItems} kom</p>
            </div>
            <div className="bg-accent rounded-lg p-4">
              <div className="flex items-center gap-2 text-accent-foreground mb-2">
                <span className="text-sm font-medium">Vrijednost</span>
              </div>
              <p className="text-2xl font-bold">{formatPrice(totalValue)}</p>
            </div>
          </div>

          {/* Today's Transactions */}
          <div>
            <h3 className="font-semibold mb-3">Današnje aktivnosti ({todayTransactions.length})</h3>
            {todayTransactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nema aktivnosti za danas.</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {todayTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{transaction.itemName}</p>
                      <p className="text-sm text-muted-foreground">{transaction.details}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'sale' ? 'bg-primary/20 text-primary' :
                        transaction.type === 'incoming' ? 'bg-success/20 text-success' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {transaction.type === 'sale' ? 'Prodaja' :
                         transaction.type === 'incoming' ? 'Dolazak' :
                         transaction.type === 'add' ? 'Dodano' :
                         transaction.type === 'edit' ? 'Izmjena' : 'Obrisano'}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(transaction.timestamp), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Sažetak inventure</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Ukupno artikala:</p>
                <p className="font-medium">{items.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ukupno komada:</p>
                <p className="font-medium">{totalItems}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vrijednost inventure:</p>
                <p className="font-medium">{formatPrice(totalValue)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ukupna prodaja:</p>
                <p className="font-medium">{formatPrice(totalSalesValue)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
