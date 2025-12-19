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
      return 'Nepoznato skladiste';
  }
};

const getWarehouseDisplayName = (warehouseId: string): string => {
  switch (warehouseId) {
    case 'warehouse1':
      return 'Skladiste 1';
    case 'warehouse2':
      return 'Skladiste 2';
    default:
      return 'Skladiste';
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

// Function to transliterate Croatian characters for PDF compatibility
const transliterate = (text: string): string => {
  const charMap: { [key: string]: string } = {
    'č': 'c', 'Č': 'C',
    'ć': 'c', 'Ć': 'C',
    'ž': 'z', 'Ž': 'Z',
    'š': 's', 'Š': 'S',
    'đ': 'd', 'Đ': 'D',
  };
  
  return text.replace(/[čČćĆžŽšŠđĐ]/g, (char) => charMap[char] || char);
};

export const exportInventoryToPDF = ({
  items,
  warehouseId,
  getTotalValue,
  getTotalSalesValue,
}: ExportPDFOptions) => {
  const doc = new jsPDF();
  const ownerName = getWarehouseOwner(warehouseId);
  const warehouseName = getWarehouseDisplayName(warehouseId);
  const currentDate = formatDate(new Date());

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVENTURA', 105, 20, { align: 'center' });

  // Warehouse info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${warehouseName}`, 14, 35);
  doc.text(`Odgovorna osoba: ${ownerName}`, 14, 42);
  doc.text(`Datum izrade: ${currentDate}`, 14, 49);

  // Calculate totals
  const totalStock = items.reduce((sum, item) => sum + item.quantityOwned, 0);
  const totalSold = items.reduce((sum, item) => sum + item.quantitySold, 0);
  const inventoryValue = getTotalValue();
  const salesValue = getTotalSalesValue();

  // Prepare table data - transliterate Croatian characters for PDF compatibility
  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    transliterate(item.name),
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
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 50 },
      2: { halign: 'right', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 30 },
      6: { halign: 'right', cellWidth: 30 },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
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
  doc.setFont('helvetica', 'bold');
  doc.text('SAŽETAK:', 14, finalY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Left column - quantities
  doc.text(`Ukupno artikala na stanju: ${totalStock} kom`, 14, finalY + 30);
  doc.text(`Ukupno prodanih artikala: ${totalSold} kom`, 14, finalY + 38);

  // Right column - values
  doc.setFont('helvetica', 'bold');
  doc.text('VRIJEDNOST INVENTURE (na stanju):', 110, finalY + 30);
  doc.text(formatPrice(inventoryValue), 196, finalY + 30, { align: 'right' });

  doc.text('UKUPAN PROMET (prodano):', 110, finalY + 38);
  doc.text(formatPrice(salesValue), 196, finalY + 38, { align: 'right' });

  // Footer line
  doc.line(14, finalY + 45, 196, finalY + 45);

  // Footer with signature area
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Potpis:', 14, finalY + 55);
  doc.line(30, finalY + 55, 80, finalY + 55);

  doc.text(`${ownerName}`, 55, finalY + 62, { align: 'center' });

  // Save the PDF
  const fileName = `inventura_${warehouseId}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return fileName;
};
