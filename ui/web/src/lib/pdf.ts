// PDF generation utility for FIR documents

export interface FIRPDFData {
  firNumber?: string;
  stationName: string;
  stationCode?: string;
  complainantName: string;
  complainantFatherName?: string;
  complainantPhone: string;
  complainantAddress: string;
  complainantAge?: string;
  complainantGender?: string;
  incidentDate: string;
  incidentTime?: string;
  incidentLocation: string;
  offenceCategory?: string;
  offenceType?: string;
  ipcSections: string[];
  description: string;
  propertyItems?: Array<{
    item: string;
    description: string;
    estimatedValue: string;
  }>;
  registeredBy: string;
  registrationDate?: string;
}

/**
 * Generate FIR PDF content as HTML string for printing/PDF conversion
 */
export function generateFIRHTML(data: FIRPDFData): string {
  const totalPropertyValue = data.propertyItems?.reduce(
    (sum, item) => sum + (parseFloat(item.estimatedValue) || 0),
    0
  ) || 0;

  const registrationDate = data.registrationDate || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>FIR - ${data.firNumber || 'Draft'}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.5;
          padding: 20mm;
          background: white;
          color: black;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid black;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .header h2 {
          font-size: 14pt;
          font-weight: normal;
        }
        .header .station {
          font-size: 11pt;
          color: #333;
          margin-top: 5px;
        }
        .fir-number {
          background: #f0f0f0;
          padding: 10px;
          margin-bottom: 20px;
          border: 1px solid #ccc;
        }
        .fir-number strong {
          font-size: 14pt;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-weight: bold;
          font-size: 13pt;
          border-bottom: 1px solid #333;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .field-row {
          display: flex;
          margin-bottom: 8px;
        }
        .field-label {
          width: 150px;
          font-weight: bold;
          color: #333;
        }
        .field-value {
          flex: 1;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .ipc-sections {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 5px;
        }
        .ipc-badge {
          background: #e3f2fd;
          border: 1px solid #1976d2;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11pt;
        }
        .description-box {
          border: 1px solid #ccc;
          padding: 15px;
          background: #fafafa;
          white-space: pre-wrap;
          min-height: 100px;
        }
        .property-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .property-table th,
        .property-table td {
          border: 1px solid #333;
          padding: 8px;
          text-align: left;
        }
        .property-table th {
          background: #f0f0f0;
        }
        .property-total {
          text-align: right;
          font-weight: bold;
          margin-top: 10px;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #333;
          padding-top: 20px;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
        }
        .signature-box {
          width: 200px;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid black;
          margin-top: 50px;
          padding-top: 5px;
        }
        .print-notice {
          font-size: 9pt;
          color: #666;
          text-align: center;
          margin-top: 30px;
          font-style: italic;
        }
        @media print {
          body {
            padding: 15mm;
          }
          .print-notice {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FIRST INFORMATION REPORT</h1>
        <h2>(Under Section 154 Cr.P.C.)</h2>
        <div class="station">
          Police Station: ${data.stationName}${data.stationCode ? ` (${data.stationCode})` : ''}
        </div>
      </div>

      <div class="fir-number">
        <strong>FIR No: ${data.firNumber || 'PENDING ASSIGNMENT'}</strong>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        Date: ${registrationDate}
      </div>

      <div class="section">
        <div class="section-title">1. COMPLAINANT DETAILS</div>
        <div class="grid-2">
          <div class="field-row">
            <span class="field-label">Name:</span>
            <span class="field-value">${data.complainantName}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Father's Name:</span>
            <span class="field-value">${data.complainantFatherName || 'N/A'}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Phone:</span>
            <span class="field-value">${data.complainantPhone}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Age/Gender:</span>
            <span class="field-value">${data.complainantAge || 'N/A'} / ${data.complainantGender || 'N/A'}</span>
          </div>
        </div>
        <div class="field-row" style="margin-top: 8px;">
          <span class="field-label">Address:</span>
          <span class="field-value">${data.complainantAddress}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">2. INCIDENT DETAILS</div>
        <div class="grid-2">
          <div class="field-row">
            <span class="field-label">Date:</span>
            <span class="field-value">${data.incidentDate}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Time:</span>
            <span class="field-value">${data.incidentTime || 'Not specified'}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Category:</span>
            <span class="field-value">${data.offenceCategory || 'N/A'}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Type:</span>
            <span class="field-value">${data.offenceType || 'N/A'}</span>
          </div>
        </div>
        <div class="field-row" style="margin-top: 8px;">
          <span class="field-label">Location:</span>
          <span class="field-value">${data.incidentLocation}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">3. APPLICABLE SECTIONS</div>
        <div class="ipc-sections">
          ${data.ipcSections.map(section => `<span class="ipc-badge">${section}</span>`).join('')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">4. INCIDENT DESCRIPTION</div>
        <div class="description-box">${data.description}</div>
      </div>

      ${data.propertyItems && data.propertyItems.length > 0 ? `
      <div class="section">
        <div class="section-title">5. PROPERTY INVOLVED</div>
        <table class="property-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item</th>
              <th>Description</th>
              <th>Estimated Value (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${data.propertyItems.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.item}</td>
              <td>${item.description}</td>
              <td>${parseFloat(item.estimatedValue).toLocaleString('en-IN')}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="property-total">
          Total Estimated Value: Rs. ${totalPropertyValue.toLocaleString('en-IN')}
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <div class="field-row">
          <span class="field-label">Recorded By:</span>
          <span class="field-value">${data.registeredBy}</span>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Complainant's Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Recording Officer's Signature</div>
          </div>
        </div>
      </div>

      <div class="print-notice">
        This is a computer-generated document. Official copy must bear stamp and signature.
      </div>
    </body>
    </html>
  `;
}

/**
 * Open FIR as printable PDF in new window
 */
export function printFIR(data: FIRPDFData): void {
  const html = generateFIRHTML(data);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Download FIR as PDF (opens in new tab for browser PDF)
 */
export function downloadFIRPDF(data: FIRPDFData): void {
  const html = generateFIRHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  // Open in new window for print/save as PDF
  const printWindow = window.open(url, '_blank');

  if (printWindow) {
    // Clean up URL after window loads
    printWindow.onload = () => {
      URL.revokeObjectURL(url);

      // Show print dialog (user can save as PDF)
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
}

/**
 * Generate blob for API upload
 */
export function generateFIRBlob(data: FIRPDFData): Blob {
  const html = generateFIRHTML(data);
  return new Blob([html], { type: 'text/html' });
}
