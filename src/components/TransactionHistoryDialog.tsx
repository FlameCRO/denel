import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InventoryTransaction } from '@/types/inventory';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Pencil, 
  Trash2 
} from 'lucide-react';

interface TransactionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: InventoryTransaction[];
}

const getTransactionIcon = (type: InventoryTransaction['type']) => {
  switch (type) {
    case 'sale':
      return <TrendingDown className="h-4 w-4 text-primary" />;
    case 'incoming':
      return <TrendingUp className="h-4 w-4 text-success" />;
    case 'add':
      return <Plus className="h-4 w-4 text-success" />;
    case 'edit':
      return <Pencil className="h-4 w-4 text-warning" />;
    case 'delete':
      return <Trash2 className="h-4 w-4 text-destructive" />;
  }
};

const getTransactionLabel = (type: InventoryTransaction['type']) => {
  switch (type) {
    case 'sale':
      return 'Prodaja';
    case 'incoming':
      return 'Dolazak';
    case 'add':
      return 'Dodano';
    case 'edit':
      return 'Izmjena';
    case 'delete':
      return 'Obrisano';
  }
};

const getTransactionColor = (type: InventoryTransaction['type']) => {
  switch (type) {
    case 'sale':
      return 'bg-primary/10 text-primary';
    case 'incoming':
      return 'bg-success/10 text-success';
    case 'add':
      return 'bg-success/10 text-success';
    case 'edit':
      return 'bg-warning/10 text-warning';
    case 'delete':
      return 'bg-destructive/10 text-destructive';
  }
};

export const TransactionHistoryDialog = ({
  open,
  onOpenChange,
  transactions,
}: TransactionHistoryDialogProps) => {
  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = format(new Date(transaction.timestamp), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, InventoryTransaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Povijest promjena</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nema zabilježenih promjena.
            </p>
          ) : (
            <div className="space-y-6">
              {sortedDates.map(date => (
                <div key={date}>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                    {format(new Date(date), "EEEE, d. MMMM yyyy.", { locale: hr })}
                  </h3>
                  <div className="space-y-2">
                    {groupedTransactions[date].map(transaction => (
                      <div
                        key={transaction.id}
                        className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-full ${getTransactionColor(transaction.type)}`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{transaction.itemName}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getTransactionColor(transaction.type)}`}>
                              {getTransactionLabel(transaction.type)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{transaction.details}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(transaction.timestamp), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
