import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClothingItem } from '@/types/inventory';
import { getWarehouseManagers } from '@/components/WarehouseManagerDialog';

interface ExportPDFOptions {
  items: ClothingItem[];
  warehouseId: string;
  getTotalValue: () => number;
}

const getWarehouseOwner = (warehouseId: string): string => {
  const managers = getWarehouseManagers();
  switch (warehouseId) {
    case 'warehouse1':
      return managers.warehouse1;
    case 'warehouse2':
      return managers.warehouse2;
    default:
      return 'Nepoznato skladište';
  }
};

const getWarehouseDisplayName = (warehouseId: string): string => {
  switch (warehouseId) {
    case 'warehouse1':
      return 'Skladište 1';
    case 'warehouse2':
      return 'Skladište 2';
    default:
      return 'Skladište';
  }
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Load font dynamically and convert to base64
const loadFontAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const exportInventoryToPDF = async ({
  items,
  warehouseId,
  getTotalValue,
}: ExportPDFOptions) => {
  const doc = new jsPDF();
  
  // Load and embed Roboto font that supports Croatian characters
  try {
    const robotoUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf';
    const fontBase64 = await loadFontAsBase64(robotoUrl);
    
    doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
  } catch (error) {
    console.warn('Could not load Roboto font, falling back to Helvetica');
    doc.setFont('helvetica');
  }

  const ownerName = getWarehouseOwner(warehouseId);
  const warehouseName = getWarehouseDisplayName(warehouseId);
  const currentDate = formatDate(new Date());

  // Header
  doc.setFontSize(20);
  doc.text('INVENTURA', 105, 20, { align: 'center' });

  // Warehouse info
  doc.setFontSize(12);
  doc.text(`${warehouseName}`, 14, 35);
  doc.text(`Odgovorna osoba: ${ownerName}`, 14, 42);
  doc.text(`Datum izrade: ${currentDate}`, 14, 49);

  // Calculate totals
  const totalStock = items.reduce((sum, item) => sum + item.quantityOwned, 0);
  const inventoryValue = getTotalValue();

  // Sort items alphabetically (A-Ž) for PDF export
  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name, 'hr'));

  // Prepare table data - only Artikl, Cijena, Na stanju
  const tableData = sortedItems.map((item, index) => [
    (index + 1).toString(),
    item.name,
    formatPrice(item.price),
    item.quantityOwned.toString(),
  ]);

  // Create table
  autoTable(doc, {
    startY: 58,
    head: [['#', 'Artikl', 'Cijena', 'Na stanju']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      font: 'Roboto',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 80 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'center', cellWidth: 40 },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      font: 'Roboto',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  const pageHeight = doc.internal.pageSize.height;
  
  // Check if there's enough space for summary (need ~80px), if not add new page
  let summaryY = finalY;
  if (finalY + 80 > pageHeight) {
    doc.addPage();
    summaryY = 20;
  }

  // Summary section
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(14, summaryY + 10, 196, summaryY + 10);

  doc.setFontSize(12);
  doc.setFont('Roboto', 'normal');
  doc.text('SAŽETAK:', 14, summaryY + 22);

  doc.setFontSize(11);
  doc.text(`Ukupno artikala na stanju:`, 14, summaryY + 34);
  doc.text(`${totalStock} kom`, 100, summaryY + 34);

  doc.text(`Ukupna vrijednost inventure:`, 14, summaryY + 44);
  doc.text(formatPrice(inventoryValue), 100, summaryY + 44);

  // Footer line
  doc.line(14, summaryY + 52, 196, summaryY + 52);

  // Footer with signature area
  doc.setFontSize(9);
  doc.text('Potpis:', 14, summaryY + 64);
  doc.line(30, summaryY + 64, 80, summaryY + 64);

  doc.text(`${ownerName}`, 55, summaryY + 72, { align: 'center' });

  // Save the PDF
  const fileName = `inventura_${warehouseId}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return fileName;
};
