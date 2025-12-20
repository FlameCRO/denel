import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS] = useState(() => /iPad|iPhone|iPod/.test(navigator.userAgent));
  const [isStandalone] = useState(() => window.matchMedia('(display-mode: standalone)').matches);
  const [isPreview] = useState(() => 
    window.location.hostname.includes('lovableproject.com') || 
    window.location.hostname === 'localhost' ||
    window.self !== window.top
  );

  useEffect(() => {
    // Check if dismissed recently (only in production)
    if (!isPreview) {
      const dismissedAt = localStorage.getItem('installPromptDismissed');
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          setDismissed(true);
        }
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [isPreview]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (!isPreview) {
      localStorage.setItem('installPromptDismissed', Date.now().toString());
    }
  };

  // Hide if dismissed or if already installed (but always show in preview)
  if (dismissed || (!isPreview && isStandalone)) {
    return null;
  }

  return (
    <div className="w-full bg-primary text-primary-foreground px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Smartphone className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-sm">
              Instaliraj Denel aplikaciju
            </h3>
            
            {isPreview ? (
              <p className="text-xs opacity-80">
                <span className="text-yellow-300 font-medium">[Preview]</span> Ovako će izgledati prompt na mobilnom uređaju
              </p>
            ) : isIOS ? (
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
            {isPreview ? 'Instaliraj (Demo)' : 'Instaliraj'}
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
