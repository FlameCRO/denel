import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SavedCalculation } from '@/types/inventory';
import { Category } from '@/hooks/useCategories';
import { Plus, Trash2, FileInput, History, FileText, ChevronDown, ChevronUp, Upload, Loader2, Eye, Pencil, Download, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IncomingItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

interface IncomingCalculationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (invoiceName: string, items: IncomingItem[], pdfData?: { base64: string; fileName: string }) => void;
  onUpdate?: (calculationId: string, invoiceName: string, items: IncomingItem[], pdfData?: { base64: string; fileName: string }) => void;
  savedCalculations: SavedCalculation[];
  categories: Category[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const IncomingCalculationDialog = ({
  open,
  onOpenChange,
  onSave,
  onUpdate,
  savedCalculations,
  categories,
}: IncomingCalculationDialogProps) => {
  const [invoiceName, setInvoiceName] = useState('');
  const [items, setItems] = useState<IncomingItem[]>([
    { id: generateId(), name: '', category: 'majice', price: 0, quantity: 1 },
  ]);
  const [expandedCalculations, setExpandedCalculations] = useState<Set<string>>(new Set());
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [uploadedPdfName, setUploadedPdfName] = useState<string | null>(null);
  const [uploadedPdfBase64, setUploadedPdfBase64] = useState<string | null>(null);
  const [editingCalculationId, setEditingCalculationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('new');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Helper function to guess category from item name
  const guessCategory = (itemName: string): string => {
    const name = itemName.toLowerCase();
    
    // Try to match category keywords
    for (const cat of categories) {
      const label = cat.label.toLowerCase();
      const value = cat.value.toLowerCase();
      if (name.includes(label) || name.includes(value)) {
        return cat.value;
      }
    }
    
    // Common mappings
    if (name.includes('majic') || name.includes('t-shirt')) return 'majice';
    if (name.includes('hlač') || name.includes('pant')) return 'hlace';
    if (name.includes('jakn') || name.includes('jacket')) return 'jakne';
    if (name.includes('haljin') || name.includes('dress')) return 'haljine';
    if (name.includes('sukn') || name.includes('skirt')) return 'suknje';
    if (name.includes('košulj') || name.includes('shirt')) return 'kosulje';
    if (name.includes('džemper') || name.includes('pulover') || name.includes('sweater')) return 'dzemperi';
    if (name.includes('kaput') || name.includes('coat')) return 'kaputi';
    
    return categories[0]?.value || 'majice';
  };

  const handlePdfImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Pogrešan format',
        description: 'Molimo odaberite PDF datoteku.',
        variant: 'destructive',
      });
      return;
    }

    // Store PDF for preview
    const pdfUrl = URL.createObjectURL(file);
    setUploadedPdfUrl(pdfUrl);
    setUploadedPdfName(file.name);

    setIsParsingPdf(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix to get just the base64
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const pdfBase64 = await base64Promise;
      
      // Store base64 for saving with calculation
      setUploadedPdfBase64(pdfBase64);

      // Call edge function to parse PDF
      const { data, error } = await supabase.functions.invoke('parse-invoice-pdf', {
        body: { pdfBase64 },
      });

      if (error) {
        throw new Error(error.message || 'Greška pri parsiranju PDF-a');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Fill the form with parsed data
      const pkv = data.pkv_broj || '';
      const dobavljac = data.dobavljac || '';
      const calculationName = [pkv, dobavljac].filter(Boolean).join(' - ') || file.name;
      
      setInvoiceName(calculationName);

      if (data.items && data.items.length > 0) {
        const parsedItems: IncomingItem[] = data.items.map((item: { naziv: string; kolicina: number; cijena: number }) => ({
          id: generateId(),
          name: item.naziv || '',
          category: guessCategory(item.naziv || ''),
          price: item.cijena || 0,
          quantity: Math.round(item.kolicina) || 1,
        }));
        setItems(parsedItems);
      }

      toast({
        title: 'PDF uspješno parsiran',
        description: `Učitano ${data.items?.length || 0} artikala. Pregledajte i spremite.`,
      });

    } catch (error) {
      console.error('PDF parse error:', error);
      toast({
        title: 'Greška pri parsiranju',
        description: error instanceof Error ? error.message : 'Nepoznata greška',
        variant: 'destructive',
      });
    } finally {
      setIsParsingPdf(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleViewPdf = () => {
    if (uploadedPdfUrl) {
      window.open(uploadedPdfUrl, '_blank');
    }
  };

  const handleAddRow = () => {
    setItems([
      ...items,
      { id: generateId(), name: '', category: 'majice', price: 0, quantity: 1 },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof IncomingItem, value: string | number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = () => {
    const validItems = items.filter(item => item.name.trim() && item.quantity > 0);
    if (invoiceName.trim() && validItems.length > 0) {
      const pdfData = uploadedPdfBase64 && uploadedPdfName 
        ? { base64: uploadedPdfBase64, fileName: uploadedPdfName }
        : undefined;
      
      if (editingCalculationId && onUpdate) {
        onUpdate(editingCalculationId, invoiceName.trim(), validItems, pdfData);
        toast({
          title: 'Kalkulacija ažurirana',
          description: `"${invoiceName.trim()}" je uspješno ažurirana.`,
        });
      } else {
        onSave(invoiceName.trim(), validItems, pdfData);
      }
      handleReset();
    }
  };

  const handleEdit = (calc: SavedCalculation) => {
    setEditingCalculationId(calc.id);
    setInvoiceName(calc.name);
    setItems(calc.items.map(item => ({
      id: generateId(),
      name: item.name,
      category: item.category,
      price: item.price,
      quantity: item.quantity,
    })));
    if (calc.pdfBase64) {
      setUploadedPdfBase64(calc.pdfBase64);
      setUploadedPdfName(calc.pdfFileName || 'faktura.pdf');
    }
    setActiveTab('new');
  };

  const handleReset = () => {
    setInvoiceName('');
    setItems([{ id: generateId(), name: '', category: 'majice', price: 0, quantity: 1 }]);
    setEditingCalculationId(null);
    // Clean up PDF URL to free memory
    if (uploadedPdfUrl) {
      URL.revokeObjectURL(uploadedPdfUrl);
    }
    setUploadedPdfUrl(null);
    setUploadedPdfName(null);
    setUploadedPdfBase64(null);
  };

  const handleViewSavedPdf = (pdfBase64: string, fileName: string) => {
    // Convert base64 to blob and open
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const toggleExpanded = (id: string) => {
    setExpandedCalculations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Export calculations with PDFs
  const handleExport = () => {
    if (savedCalculations.length === 0) return;

    const exportData = {
      exportDate: new Date().toISOString(),
      calculations: savedCalculations.map(calc => ({
        id: calc.id,
        name: calc.name,
        createdAt: calc.createdAt,
        totalQuantity: calc.totalQuantity,
        totalValue: calc.totalValue,
        items: calc.items,
        pdfFileName: calc.pdfFileName || null,
        pdfBase64: calc.pdfBase64 || null,
      })),
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalkulacije_izvoz_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Izvoz uspješan',
      description: `Izvezeno ${savedCalculations.length} kalkulacija${savedCalculations.filter(c => c.pdfBase64).length > 0 ? ' s PDF datotekama' : ''}.`,
    });
  };

  // Parse search query for name and optional price (e.g., "hlače 20" -> name: "hlače", price: 20)
  const parseSearchQuery = (query: string): { nameQuery: string; priceQuery: number | null } => {
    const trimmed = query.trim();
    if (!trimmed) return { nameQuery: '', priceQuery: null };
    
    // Check if the last part is a number (price)
    const parts = trimmed.split(/\s+/);
    const lastPart = parts[parts.length - 1];
    const priceMatch = lastPart.match(/^(\d+(?:[.,]\d+)?)$/);
    
    if (priceMatch && parts.length > 1) {
      const price = parseFloat(lastPart.replace(',', '.'));
      const nameQuery = parts.slice(0, -1).join(' ').toLowerCase();
      return { nameQuery, priceQuery: price };
    }
    
    return { nameQuery: trimmed.toLowerCase(), priceQuery: null };
  };

  const { nameQuery, priceQuery } = parseSearchQuery(searchQuery);

  // Check if item matches search criteria
  const itemMatchesSearch = (item: { name: string; price: number }): boolean => {
    if (!item || !item.name) return false;
    const nameMatches = item.name.toLowerCase().includes(nameQuery);
    if (priceQuery !== null) {
      // Price must match exactly (comparing as integers to avoid float issues)
      const priceMatches = Math.abs((item.price || 0) - priceQuery) < 0.01;
      return nameMatches && priceMatches;
    }
    return nameMatches;
  };

  // Filter calculations by search query
  const filteredCalculations = (savedCalculations || []).filter(calc => {
    if (!calc) return false;
    if (!searchQuery.trim()) return true;
    if (calc.name?.toLowerCase().includes(nameQuery) && priceQuery === null) return true;
    return (calc.items || []).some(item => itemMatchesSearch(item));
  });

  // Find which items match the search
  const getMatchingItems = (calc: SavedCalculation) => {
    if (!searchQuery.trim() || !calc?.items) return [];
    return calc.items.filter(item => itemMatchesSearch(item));
  };

  const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileInput className="h-5 w-5 text-primary" />
            Ulazna kalkulacija
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new" className="gap-2">
              <FileText className="h-4 w-4" />
              {editingCalculationId ? 'Uredi kalkulaciju' : 'Nova kalkulacija'}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Spremljene ({savedCalculations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-6 py-4">
            {/* PDF Import */}
            <div className="flex items-center gap-4 p-4 border border-dashed rounded-lg bg-muted/30">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfImport}
                className="hidden"
                id="pdf-import"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsingPdf}
                className="gap-2"
              >
                {isParsingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Parsiranje...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Uvezi iz PDF-a
                  </>
                )}
              </Button>
              {uploadedPdfUrl ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleViewPdf}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Pregledaj PDF
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Automatski učitaj podatke iz računa/fakture
                </span>
              )}
              {uploadedPdfName && (
                <span className="text-sm text-muted-foreground truncate max-w-[200px]" title={uploadedPdfName}>
                  {uploadedPdfName}
                </span>
              )}
            </div>

            {/* Invoice Name */}
            <div className="space-y-2">
              <Label htmlFor="invoiceName" className="text-base font-medium">
                Naziv kalkulacije / računa
              </Label>
              <Input
                id="invoiceName"
                value={invoiceName}
                onChange={(e) => setInvoiceName(e.target.value)}
                placeholder="npr. Dobavljač XY - 15.12.2024"
                className="text-base"
              />
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Artikli</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRow}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Dodaj red
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_140px_100px_80px_40px] gap-2 p-3 bg-muted/50 text-sm font-medium text-muted-foreground">
                  <span>Naziv artikla</span>
                  <span>Kategorija</span>
                  <span>Cijena (€)</span>
                  <span>Količina</span>
                  <span></span>
                </div>

                {/* Rows */}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_140px_100px_80px_40px] gap-2 p-3 border-t items-center"
                  >
                    <Input
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      placeholder="Naziv artikla"
                      className="h-9"
                    />
                    <Select
                      value={item.category}
                      onValueChange={(value) => handleItemChange(item.id, 'category', value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price || ''}
                      onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-9"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="1"
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRow(item.id)}
                      disabled={items.length === 1}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="flex justify-end gap-6 pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Ukupno artikala</p>
                <p className="text-lg font-semibold">{totalQuantity} kom</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Ukupna vrijednost</p>
                <p className="text-lg font-semibold text-primary">
                  {new Intl.NumberFormat('hr-HR', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(totalValue)}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  handleReset();
                  onOpenChange(false);
                }}
              >
                Odustani
              </Button>
              <Button
                onClick={handleSave}
                disabled={!invoiceName.trim() || items.every(i => !i.name.trim())}
              >
                {editingCalculationId ? 'Ažuriraj kalkulaciju' : 'Spremi kalkulaciju'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="history" className="py-4">
            {/* Search and Export bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pretraži artikle ili kalkulacije..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={savedCalculations.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Izvezi sve
              </Button>
            </div>

            {searchQuery && (
              <p className="text-sm text-muted-foreground mb-3">
                Pronađeno {filteredCalculations.length} kalkulacija
                {filteredCalculations.length > 0 && ` s "${searchQuery}"`}
              </p>
            )}

            {savedCalculations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nema spremljenih kalkulacija</p>
                <p className="text-sm">Kreirajte novu kalkulaciju u kartici "Nova kalkulacija"</p>
              </div>
            ) : filteredCalculations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nema rezultata</p>
                <p className="text-sm">Pokušajte s drugom pretragom</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCalculations.map((calc) => {
                  const matchingItems = getMatchingItems(calc);
                  return (
                    <div
                      key={calc.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleExpanded(calc.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{calc.name}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(calc);
                              }}
                              className="h-7 gap-1 text-xs"
                            >
                              <Pencil className="h-3 w-3" />
                              Uredi
                            </Button>
                            {calc.pdfBase64 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewSavedPdf(calc.pdfBase64!, calc.pdfFileName || 'faktura.pdf');
                                }}
                                className="h-7 gap-1 text-xs"
                              >
                                <Eye className="h-3 w-3" />
                                PDF
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(calc.createdAt), 'dd.MM.yyyy HH:mm', { locale: hr })}
                          </p>
                          {/* Show matching items when searching */}
                          {matchingItems.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {matchingItems.slice(0, 3).map(item => (
                                <span key={item.id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  {item.name}
                                </span>
                              ))}
                              {matchingItems.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{matchingItems.length - 3} više
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{calc.totalQuantity} artikala</p>
                            <p className="font-semibold text-primary">
                              {new Intl.NumberFormat('hr-HR', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(calc.totalValue)}
                            </p>
                          </div>
                          {expandedCalculations.has(calc.id) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {expandedCalculations.has(calc.id) && (
                        <div className="border-t bg-muted/30">
                          <div className="grid grid-cols-[1fr_120px_80px_100px] gap-2 p-3 text-sm font-medium text-muted-foreground border-b">
                            <span>Artikl</span>
                            <span>Kategorija</span>
                            <span>Količina</span>
                            <span className="text-right">Cijena</span>
                          </div>
                          {calc.items.map((item) => {
                            const isMatch = searchQuery && item.name.toLowerCase().includes(searchQuery.toLowerCase());
                            return (
                              <div
                                key={item.id}
                                className={`grid grid-cols-[1fr_120px_80px_100px] gap-2 p-3 text-sm border-b last:border-b-0 ${isMatch ? 'bg-primary/5' : ''}`}
                              >
                                <span className={`font-medium ${isMatch ? 'text-primary' : ''}`}>{item.name}</span>
                                <span className="text-muted-foreground">{getCategoryLabel(item.category)}</span>
                                <span>{item.quantity} kom</span>
                                <span className="text-right">
                                  {new Intl.NumberFormat('hr-HR', {
                                    style: 'currency',
                                    currency: 'EUR',
                                  }).format(item.price)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
