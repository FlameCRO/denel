import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import denelLogo from '@/assets/denel-logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Store the deferred prompt globally so it persists across re-renders
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

// Set up listener immediately when module loads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    console.log('PWA: beforeinstallprompt event captured');
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    console.log('PWA: App was installed');
  });
}

export const InstallPrompt = () => {
  const [canInstall, setCanInstall] = useState(globalDeferredPrompt !== null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS] = useState(() => typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent));
  const [isStandalone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches);

  useEffect(() => {
    // Check if dismissed recently
    const dismissedAt = localStorage.getItem('installPromptDismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }

    // Also listen for the event in case it fires after component mounts
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
      console.log('PWA: beforeinstallprompt event captured in component');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Check periodically if the prompt became available
    const interval = setInterval(() => {
      if (globalDeferredPrompt && !canInstall) {
        setCanInstall(true);
      }
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearInterval(interval);
    };
  }, [canInstall]);

  const handleInstall = async () => {
    console.log('PWA: Install button clicked, globalDeferredPrompt:', !!globalDeferredPrompt);
    
    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const { outcome } = await globalDeferredPrompt.userChoice;
        console.log('PWA: User choice:', outcome);
        
        if (outcome === 'accepted') {
          setDismissed(true);
        }
        globalDeferredPrompt = null;
        setCanInstall(false);
      } catch (error) {
        console.error('PWA: Install error:', error);
      }
    } else if (isIOS) {
      // For iOS, just dismiss since they need to use Safari's share menu
      setDismissed(true);
    } else {
      console.log('PWA: No deferred prompt available');
      // Still allow dismissing
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Hide if dismissed or if already installed
  if (dismissed || isStandalone) {
    return null;
  }

  return (
    <div className="w-full bg-primary text-primary-foreground px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            <img src={denelLogo} alt="Denel" className="w-8 h-8 object-contain" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-sm">
              Instaliraj Denel aplikaciju
            </h3>
            
            {isIOS ? (
              <p className="text-xs opacity-80">
                Pritisni dijeli ikonu pa "Dodaj na početni zaslon"
              </p>
            ) : (
              <p className="text-xs opacity-80">
                Dodaj aplikaciju na početni zaslon za brži pristup
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            variant="secondary"
            className="whitespace-nowrap"
          >
            <Download className="h-4 w-4 mr-2" />
            Instaliraj
          </Button>
          
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-md hover:bg-primary-foreground/20 transition-colors"
            aria-label="Zatvori"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
