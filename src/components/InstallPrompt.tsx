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
    <div className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground px-4 py-3 z-50 shadow-lg animate-in slide-in-from-top-4">
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
                Pritisni <span className="inline-flex items-center"><svg className="h-3 w-3 mx-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 14V20H20V14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></span> pa "Dodaj na početni zaslon"
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
