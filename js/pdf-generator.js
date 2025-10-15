// PDF Generation Module for FinZen
// Handles all PDF export functionality

/**
 * Downloads a table as a professional PDF document
 * @param {string} tableId - The ID of the table to export
 * @param {string} filename - The base filename for the PDF
 */
function downloadTablePDF(tableId, filename) {
  const table = document.getElementById(tableId);
  const tableWrapper = table.closest('.amortization');

  if (!table || table.rows.length <= 1) {
    alert('No data to download. Please calculate first.');
    return;
  }

  // Create PDF document
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  // PDF options with reduced margins (75% reduction from 0.5in to 0.125in)
  const options = {
    margin: [0.125, 0.125, 0.125, 0.125], // Reduced margins by 75%
    filename: `${filename}-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { 
      scale: 1, 
      useCORS: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 650, // Adjusted for reduced margins
      height: null
    },
    jsPDF: { 
      unit: 'in', 
      format: 'letter', 
      orientation: 'portrait',
      compress: true
    }
  };

  // Set up fonts and colors
  pdf.setFont('helvetica');

  // Add logo
  const logoImg = new Image();
  logoImg.onload = function() {
    // Add logo to PDF (25x25 pixels at position 15, 20)
    pdf.addImage(logoImg, 'PNG', 15, 20, 25, 25);
    
    // Add header text (properly aligned with logo)
    pdf.setFontSize(28);
    pdf.setTextColor(15, 20, 40); // Dark blue
    pdf.text('FinZen', 50, 32, { align: 'left' });
    
    pdf.setFontSize(14);
    pdf.setTextColor(107, 114, 128); // Gray
    pdf.text('Smart Financial Calculator', 50, 42, { align: 'left' });
    
    // Add date (right aligned)
    const today = new Date();
    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99); // Medium gray
    pdf.text(`Generated on: ${today.toLocaleDateString()}`, 185, 25, { align: 'right' });

    // Add line separator
    pdf.setDrawColor(0, 172, 193); // Theme cyan color
    pdf.setLineWidth(0.3);
    pdf.line(15, 55, 185, 55);

    // Continue with table generation
    addTableToPDF(pdf, table, tableWrapper, tableId);

    // Save the PDF
    pdf.save(options.filename);
  };

  logoImg.onerror = function() {
    console.warn('Logo failed to load, generating PDF without logo');
    // Continue without logo - use professional layout
    pdf.setFontSize(28);
    pdf.setTextColor(15, 20, 40); // Dark blue
    pdf.text('FinZen', 15, 32, { align: 'left' });
    
    pdf.setFontSize(14);
    pdf.setTextColor(107, 114, 128); // Gray
    pdf.text('Smart Financial Calculator', 15, 42, { align: 'left' });
    
    // Add date (right aligned)
    const today = new Date();
    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99); // Medium gray
    pdf.text(`Generated on: ${today.toLocaleDateString()}`, 185, 25, { align: 'right' });

    // Add line separator
    pdf.setDrawColor(0, 172, 193); // Theme cyan color
    pdf.setLineWidth(0.3);
    pdf.line(15, 55, 185, 55);

    // Continue with table generation
    addTableToPDF(pdf, table, tableWrapper, tableId);

    // PDF options with reduced margins (75% reduction from 0.5in to 0.125in)
    const options = {
      margin: [0.125, 0.125, 0.125, 0.125], // Reduced margins by 75%
      filename: `${filename}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { 
        scale: 1, 
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 650, // Adjusted for reduced margins
        height: null
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait',
        compress: true
      }
    };

    // Save the PDF
    pdf.save(options.filename);
  };

  logoImg.src = 'assets/finzen-app.png';
}

/**
 * Adds table data to the PDF document
 * @param {jsPDF} pdf - The PDF document instance
 * @param {HTMLTableElement} table - The table element to export
 * @param {HTMLElement} tableWrapper - The table wrapper element
 * @param {string} tableId - The table ID to determine calculator type
 */
function addTableToPDF(pdf, table, tableWrapper, tableId) {
  // Create descriptive table title based on calculator type
  let tableTitle = '';
  if (tableId.includes('ret')) {
    tableTitle = 'Retirement Savings Projection';
  } else if (tableId.includes('mort')) {
    tableTitle = 'Mortgage Amortization Schedule';
  } else if (tableId.includes('inv')) {
    tableTitle = 'Investment Growth Projection';
  } else if (tableId.includes('loan')) {
    tableTitle = 'Loan Amortization Schedule';
  } else {
    // Fallback to original heading
    const heading = tableWrapper.querySelector('h3');
    tableTitle = heading.textContent;
  }

  pdf.setFontSize(16);
  pdf.setTextColor(15, 20, 40);
  pdf.text(tableTitle, 105, 65, { align: 'center' });

  // Extract table data
  const rows = table.rows;
  const data = [];
  const columnWidths = [];

  // Get column count from first row
  const firstRow = rows[0];
  const colCount = firstRow.cells.length;

  // Initialize column widths
  for (let i = 0; i < colCount; i++) {
    columnWidths.push(0);
  }

  // Extract data and calculate column widths
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowData = [];

    for (let j = 0; j < row.cells.length; j++) {
      const cell = row.cells[j];
      let cellText = cell.textContent.trim();

      // Format currency values
      if (cellText.includes('$') || cellText.includes('₹')) {
        // Keep as is
      }

      rowData.push(cellText);

      // Calculate column width (rough estimate)
      const textWidth = pdf.getTextWidth(cellText);
      if (textWidth > columnWidths[j]) {
        columnWidths[j] = textWidth;
      }
    }

    data.push(rowData);
  }

  // Calculate total table width and scale if needed
  const pageWidth = 150; // Conservative width to ensure table fits within margins
  let totalWidth = columnWidths.reduce((sum, width) => sum + width + 10, 0); // +10 for padding

  let scale = 1;
  if (totalWidth > pageWidth) {
    scale = pageWidth / totalWidth;
  }

  // Scale column widths
  const scaledWidths = columnWidths.map(width => width * scale + 10);

  // Add table
  let yPosition = 80;
  const rowHeight = 10;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    let xPosition = 15; // Adjusted for reduced margins

    // Check if we need a new page
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 30;
    }

    for (let j = 0; j < row.length; j++) {
      const cellText = row[j];

      // Draw cell border - using theme color
      pdf.setDrawColor(0, 172, 193); // Theme cyan color #00acc1
      pdf.setLineWidth(0.2); // Slightly thicker for better visibility
      pdf.rect(xPosition, yPosition - 5, scaledWidths[j], rowHeight);

      // Set background for header row - using theme color
      if (i === 0) {
        pdf.setFillColor(235, 248, 250); // Light cyan background
        pdf.rect(xPosition, yPosition - 5, scaledWidths[j], rowHeight, 'F');
        pdf.setTextColor(15, 20, 40); // Dark blue text
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setTextColor(31, 41, 55); // Dark text
        pdf.setFont('helvetica', 'normal');
      }

      // Add text
      pdf.setFontSize(8);
      const lines = pdf.splitTextToSize(cellText, scaledWidths[j] - 4);
      pdf.text(lines, xPosition + 2, yPosition);

      xPosition += scaledWidths[j];
    }

    yPosition += rowHeight;
  }

  // Add footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175); // Light gray
    pdf.text('Generated by FinZen - Smart Financial Calculator', 105, 285, { align: 'center' });
  }
}