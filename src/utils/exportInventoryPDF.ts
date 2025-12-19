import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClothingItem } from '@/types/inventory';

interface ExportPDFOptions {
  items: ClothingItem[];
  warehouseId: string;
  getTotalValue: () => number;
  getTotalSalesValue: () => number;
}

const getWarehouseOwner = (warehouseId: string): string => {
  switch (warehouseId) {
    case 'warehouse1':
      return 'Elvis Perika';
    case 'warehouse2':
      return 'Ivana Majdak';
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
  getTotalSalesValue,
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
  const totalSold = items.reduce((sum, item) => sum + item.quantitySold, 0);
  const inventoryValue = getTotalValue();
  const salesValue = getTotalSalesValue();

  // Prepare table data
  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    item.name,
    formatPrice(item.price),
    item.quantityOwned.toString(),
    item.quantitySold.toString(),
    formatPrice(item.price * item.quantityOwned),
    formatPrice(item.price * item.quantitySold),
  ]);

  // Create table
  autoTable(doc, {
    startY: 58,
    head: [['#', 'Artikl', 'Cijena', 'Na stanju', 'Prodano', 'Vrijednost stanja', 'Vrijednost prodaje']],
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
      1: { halign: 'left', cellWidth: 45 },
      2: { halign: 'right', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 30 },
      6: { halign: 'right', cellWidth: 30 },
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

  // Summary section
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(14, finalY + 10, 196, finalY + 10);

  doc.setFontSize(11);
  doc.text('SAŽETAK:', 14, finalY + 20);

  doc.setFontSize(10);

  // Left column - quantities
  doc.text(`Ukupno artikala na stanju: ${totalStock} kom`, 14, finalY + 30);
  doc.text(`Ukupno prodanih artikala: ${totalSold} kom`, 14, finalY + 38);

  // Right column - values
  doc.text('VRIJEDNOST INVENTURE (na stanju):', 110, finalY + 30);
  doc.text(formatPrice(inventoryValue), 196, finalY + 30, { align: 'right' });

  doc.text('UKUPAN PROMET (prodano):', 110, finalY + 38);
  doc.text(formatPrice(salesValue), 196, finalY + 38, { align: 'right' });

  // Footer line
  doc.line(14, finalY + 45, 196, finalY + 45);

  // Footer with signature area
  doc.setFontSize(9);
  doc.text('Potpis:', 14, finalY + 55);
  doc.line(30, finalY + 55, 80, finalY + 55);

  doc.text(`${ownerName}`, 55, finalY + 62, { align: 'center' });

  // Save the PDF
  const fileName = `inventura_${warehouseId}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return fileName;
};
