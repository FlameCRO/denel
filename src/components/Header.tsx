import { useState, useEffect } from 'react';
import { Package2, Settings, Warehouse, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Toggle } from '@/components/ui/toggle';

export const Header = () => {
  const location = useLocation();
  const [isMobileView, setIsMobileView] = useState(false);
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

  useEffect(() => {
    if (isMobileView) {
      document.body.classList.add('force-mobile-view');
    } else {
      document.body.classList.remove('force-mobile-view');
    }
    return () => document.body.classList.remove('force-mobile-view');
  }, [isMobileView]);

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
            {/* Desktop/Mobile View Toggle */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Toggle
                pressed={!isMobileView}
                onPressedChange={() => setIsMobileView(false)}
                size="sm"
                className={cn(
                  "data-[state=on]:bg-background data-[state=on]:shadow-sm"
                )}
                aria-label="Desktop prikaz"
              >
                <Monitor className="h-4 w-4" />
              </Toggle>
              <Toggle
                pressed={isMobileView}
                onPressedChange={() => setIsMobileView(true)}
                size="sm"
                className={cn(
                  "data-[state=on]:bg-background data-[state=on]:shadow-sm"
                )}
                aria-label="Mobile prikaz"
              >
                <Smartphone className="h-4 w-4" />
              </Toggle>
            </div>

            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
