import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleClearStorage = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <h1 className="text-xl font-semibold text-foreground">Došlo je do greške</h1>
            </div>
            
            <p className="text-muted-foreground mb-4">
              Aplikacija je naišla na neočekivanu grešku. Možete pokušati osvježiti stranicu ili očistiti lokalne podatke.
            </p>
            
            {this.state.error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Detalji greške
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Pokušaj ponovo
              </Button>
              <Button onClick={this.handleClearStorage} variant="destructive" className="flex-1">
                Očisti podatke
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
