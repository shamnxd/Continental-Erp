/**
 * Generate and download invoice as PDF using browser's print functionality
 */
export function downloadInvoiceAsPDF(
  elementId: string,
  invoiceNo: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Invoice element not found");
      }

      // Create a new window for printing
      const printWindow = window.open("", "", "height=800,width=900");
      if (!printWindow) {
        throw new Error("Unable to open print window");
      }

      // Write the invoice HTML to the print window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${invoiceNo}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
              line-height: 1.4;
              color: #1f2937;
              background: white;
            }
            
            .invoice-content {
              padding: 40px;
              max-width: 900px;
              margin: 0 auto;
              background: white;
              color: black;
            }
            
            h1 { color: #be185d; }
            table { border-collapse: collapse; width: 100%; }
            th { background-color: #be185d; color: white; padding: 10px; text-align: left; }
            td { border: 1px solid #d1d5db; padding: 10px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-900 { color: #111827; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .pt-2 { padding-top: 0.5rem; }
            .pb-6 { padding-bottom: 1.5rem; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .gap-4 { gap: 1rem; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .rounded { border-radius: 0.375rem; }
            .bg-gray-50 { background-color: #f9fafb; }
            .text-pink-700 { color: #be185d; }
            .border-pink-700 { border-color: #be185d; }
            .border-2 { border-width: 2px; }
            
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
              * { box-shadow: none !important; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert blob to base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
