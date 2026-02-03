import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Export to CSV
export const exportToCSV = (data: any[], filename: string, headers: string[]) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header.toLowerCase().replace(/ /g, '')];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Export to Excel
export const exportToExcel = (data: any[], filename: string, headers: string[]) => {
  // Format data for Excel
  const excelData = [
    headers,
    ...data.map(row =>
      headers.map(header =>
        row[header.toLowerCase().replace(/ /g, '')]
      )
    )
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  
  // Set column widths
  const columnWidths = headers.map(header => ({ wch: Math.max(header.length + 2, 12) }));
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
};

// Export to PDF
export const exportToPDF = (data: any[], filename: string, headers: string[], title: string = '') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add title
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
  }

  // Prepare table data
  const tableData = data.map(row =>
    headers.map(header =>
      row[header.toLowerCase().replace(/ /g, '')]
    )
  );

  // Add table
  const startY = title ? 25 : 14;
  (doc as any).autoTable({
    head: [headers],
    body: tableData,
    startY: startY,
    margin: 10,
    didDrawPage: function(data: any) {
      // Footer
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      const pageWidth = pageSize.getWidth();
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      
      doc.setFontSize(8);
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  });

  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`${filename}_${timestamp}.pdf`);
};

// Print data
export const printData = (data: any[], filename: string, headers: string[], title: string = '') => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${filename}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          text-align: center;
          color: #1f2937;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #3b82f6;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #1f2937;
        }
        td {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        tr:hover {
          background-color: #f3f4f6;
        }
        .print-footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #6b7280;
        }
        @media print {
          body {
            margin: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <h1>${title || 'Report'}</h1>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(h => `<td>${row[h.toLowerCase().replace(/ /g, '')]}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="print-footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '', 'width=900,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

// Main export function that handles all formats
export const handleExport = (
  data: any[],
  filename: string,
  headers: string[],
  format: 'csv' | 'excel' | 'pdf' | 'print',
  title?: string
) => {
  switch (format) {
    case 'csv':
      exportToCSV(data, filename, headers);
      break;
    case 'excel':
      exportToExcel(data, filename, headers);
      break;
    case 'pdf':
      exportToPDF(data, filename, headers, title);
      break;
    case 'print':
      printData(data, filename, headers, title);
      break;
  }
};
