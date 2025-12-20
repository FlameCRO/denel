import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    // Check if in Lovable preview (iframe or localhost)
    const inPreview = window.location.hostname.includes('lovableproject.com') || 
                      window.location.hostname === 'localhost' ||
                      window.self !== window.top;
    setIsPreview(inPreview);

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if prompt was dismissed recently
    const dismissedAt = localStorage.getItem('installPromptDismissed');
    if (dismissedAt && !inPreview) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show for 7 days after dismissal
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show iOS prompt after a delay, or show preview prompt immediately
    if (inPreview) {
      setTimeout(() => setShowPrompt(true), 1000);
    } else if (ios && !standalone) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isPreview) {
      // Demo mode - just hide the prompt
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (!isPreview) {
      localStorage.setItem('installPromptDismissed', Date.now().toString());
    }
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Zatvori"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm">
            Instaliraj Denel aplikaciju
          </h3>
          
          {isPreview ? (
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-amber-500 font-medium">[Preview]</span> Ovako će izgledati prompt na mobilnom uređaju
            </p>
          ) : isIOS ? (
            <p className="text-xs text-muted-foreground mt-1">
              Pritisni <span className="inline-flex items-center"><svg className="h-3 w-3 mx-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 14V20H20V14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></span> pa "Dodaj na početni zaslon"
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Dodaj aplikaciju na početni zaslon za brži pristup
            </p>
          )}

          <Button
            onClick={handleInstall}
            size="sm"
            className="mt-3 w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isPreview ? 'Instaliraj (Demo)' : 'Instaliraj'}
          </Button>
        </div>
      </div>
    </div>
  );
};
