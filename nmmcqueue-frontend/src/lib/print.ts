import { notify } from "@/shared/lib/notify";

export function printThermalReceipt(htmlContent: string) {
    // Open a new window (or tab, depending on user browser settings)
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
        notify.error("Please allow popups for this site to print tickets.");
        return;
    }

    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Queue Ticket</title>
            <style>
                @page { 
                    size: 80mm auto; 
                    margin: 0; 
                }
                body { 
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                    text-align: center; 
                    margin: 0; 
                    padding: 15px; 
                    color: #000;
                    width: 80mm;
                    box-sizing: border-box;
                }
                .header {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .sub-header {
                    font-size: 10px;
                    margin-bottom: 15px;
                    color: #555;
                }
                .ticket-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .ticket-number {
                    font-size: 42px;
                    font-weight: 900;
                    letter-spacing: -1px;
                    margin: 10px 0;
                    line-height: 1;
                }
                .patient-name {
                    font-size: 14px;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .date-time {
                    font-size: 10px;
                    color: #555;
                    margin-top: 15px;
                    margin-bottom: 10px;
                }
                .footer {
                    font-size: 11px;
                    margin-top: 20px;
                    padding-top: 10px;
                    border-top: 1px dashed #ccc;
                }
            </style>
        </head>
        <body>
            ${htmlContent}
            <script>
                // For a real silent print with Epson, you typically configure the browser 
                // in kiosk mode (e.g. Chrome with --kiosk-printing) or use a local 
                // printing proxy like QZ Tray.
                
                // For this example, we just open the tab to show the layout 
                // without triggering the blocking print dialog.
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
