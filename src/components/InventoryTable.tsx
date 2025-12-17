import { useState } from 'react';
import { ClothingItem } from '@/types/inventory';
import { Category } from '@/hooks/useCategories';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit,
  Trash2,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Package,
  Search,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryTableProps {
  items: ClothingItem[];
  categories: Category[];
  getCategoryLabel: (value: string) => string;
  onEdit: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  onRecordSale: (item: ClothingItem) => void;
  onRecordIncoming: (item: ClothingItem) => void;
  onManageCategories: () => void;
}

export const InventoryTable = ({
  items,
  categories,
  getCategoryLabel,
  onEdit,
  onDelete,
  onRecordSale,
  onRecordIncoming,
  onManageCategories,
}: InventoryTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'az' | 'za'>('default');

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOrder === 'az') return a.name.localeCompare(b.name, 'hr');
      if (sortOrder === 'za') return b.name.localeCompare(a.name, 'hr');
      return 0;
    });

  const getStockStatus = (quantity: number) => {
    if (quantity < 0) return { label: 'Negativno', variant: 'destructive' as const };
    if (quantity <= 5) return { label: 'Kritično', variant: 'destructive' as const };
    if (quantity <= 15) return { label: 'Nisko', variant: 'warning' as const };
    return { label: 'U redu', variant: 'success' as const };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži artikle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Sve kategorije</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <Button variant="outline" size="icon" onClick={onManageCategories} title="Upravljaj kategorijama">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'default' | 'az' | 'za')}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="default">Zadani poredak</option>
          <option value="az">A - Ž</option>
          <option value="za">Ž - A</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card card-shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold w-12">#</TableHead>
              <TableHead className="font-semibold">Artikl</TableHead>
              <TableHead className="font-semibold">Kategorija</TableHead>
              <TableHead className="font-semibold text-right">Cijena</TableHead>
              <TableHead className="font-semibold text-center">Na stanju</TableHead>
              <TableHead className="font-semibold text-center">Prodano</TableHead>
              <TableHead className="font-semibold text-center">Dolazno</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="font-semibold text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  Nema artikala za prikaz
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item, index) => {
                const stockStatus = getStockStatus(item.quantityOwned);
                return (
                  <TableRow
                    key={item.id}
                    className="group transition-colors hover:bg-muted/30"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatPrice(item.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-semibold",
                        item.quantityOwned <= 5 && "text-destructive",
                        item.quantityOwned > 5 && item.quantityOwned <= 15 && "text-warning"
                      )}>
                        {item.quantityOwned}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingDown className="h-3 w-3 text-muted-foreground" />
                        <span>{item.quantitySold}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <span>{item.quantityIncoming}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={stockStatus.variant === 'success' ? 'default' : stockStatus.variant === 'warning' ? 'outline' : 'destructive'}
                        className={cn(
                          stockStatus.variant === 'success' && 'bg-success text-success-foreground',
                          stockStatus.variant === 'warning' && 'border-warning text-warning bg-warning/10'
                        )}
                      >
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onRecordSale(item)}>
                            <TrendingDown className="mr-2 h-4 w-4" />
                            Evidentiraj prodaju
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRecordIncoming(item)}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Evidentiraj dolazak
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Uredi
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(item.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Obriši
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
        <span>Prikazano {filteredItems.length} od {items.length} artikala</span>
        <span>
          Ukupna vrijednost: {formatPrice(filteredItems.reduce((sum, item) => sum + item.price * item.quantityOwned, 0))}
        </span>
      </div>
    </div>
  );
};
