import { Package2, Settings, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const Header = () => {
  const location = useLocation();
  const today = new Date().toLocaleDateString('hr-HR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const warehouses = [
    { id: 'warehouse1', name: 'Skladište 1', path: '/' },
    { id: 'warehouse2', name: 'Skladište 2', path: '/skladiste-2' },
  ];

  return (
    <header className="border-b bg-card card-shadow sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Package2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Skladište - Inventura
              </h1>
              <p className="text-sm text-muted-foreground">{today}</p>
            </div>
          </div>

          {/* Warehouse Navigation Tabs */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            {warehouses.map((warehouse) => (
              <Link key={warehouse.id} to={warehouse.path}>
                <Button
                  variant={location.pathname === warehouse.path ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "gap-2",
                    location.pathname === warehouse.path && "shadow-sm"
                  )}
                >
                  <Warehouse className="h-4 w-4" />
                  {warehouse.name}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
