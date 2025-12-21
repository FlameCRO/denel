import { useState, useEffect } from 'react';
import { Settings, Warehouse, Monitor, Smartphone, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Toggle } from '@/components/ui/toggle';
import denelLogo from '@/assets/denel-logo.png';

export const Header = () => {
  const location = useLocation();
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('viewMode') === 'mobile';
    }
    return false;
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
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
      localStorage.setItem('viewMode', 'mobile');
    } else {
      document.body.classList.remove('force-mobile-view');
      localStorage.setItem('viewMode', 'desktop');
    }
    return () => document.body.classList.remove('force-mobile-view');
  }, [isMobileView]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Apply initial dark mode class on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <header className="border-b bg-card card-shadow sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        {/* Top row - Logo, Title, Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white overflow-hidden">
              <img src={denelLogo} alt="Denel logo" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                Skladište - Inventura
              </h1>
              <p className="text-xs text-muted-foreground">{today}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark/Light Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Toggle
                pressed={!isDarkMode}
                onPressedChange={() => setIsDarkMode(false)}
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                )}
                aria-label="Light mode"
              >
                <Sun className="h-4 w-4" />
              </Toggle>
              <Toggle
                pressed={isDarkMode}
                onPressedChange={() => setIsDarkMode(true)}
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                )}
                aria-label="Dark mode"
              >
                <Moon className="h-4 w-4" />
              </Toggle>
            </div>

            {/* Desktop/Mobile View Toggle */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Toggle
                pressed={!isMobileView}
                onPressedChange={() => setIsMobileView(false)}
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm"
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
                  "h-8 w-8 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                )}
                aria-label="Mobile prikaz"
              >
                <Smartphone className="h-4 w-4" />
              </Toggle>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bottom row - Warehouse tabs */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
          {warehouses.map((warehouse) => (
            <Link key={warehouse.id} to={warehouse.path}>
              <Button
                variant={location.pathname === warehouse.path ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "gap-2 text-sm",
                  location.pathname === warehouse.path && "shadow-sm"
                )}
              >
                <Warehouse className="h-4 w-4" />
                {warehouse.name}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};
