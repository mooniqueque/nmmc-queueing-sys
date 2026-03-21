import { spawn } from 'child_process';
import { characterSet as CharacterSet, types as PrinterTypes, printer as ThermalPrinter } from 'node-thermal-printer';
import path from 'path';
import logger from './logger.js';

export async function printTicket(data: any): Promise<void> {
    // Determine the printer name from environment variables, fallback is 'XP-58 (copy 1)'
    const printerName = process.env.PRINTER_NAME || 'XP-58 (copy 1)';

    // Custom Driver to bypass native Node.js C++ Windows API compilation issues via python win32print
    const win32PrintDriver = {
        printDirect: function (options: any) {
            const { data, printer, success, error } = options;
            const b64Data = data.toString('base64');
            const pyScript = path.join(process.cwd(), 'src', 'lib', 'raw_print.py');

            const py = spawn('python', [pyScript, printer]);
            let errStr = '';
            
            // Send the payload directly through the standard input stream to bypass Windows 8KB arg limits
            py.stdin.write(b64Data);
            py.stdin.end();
            
            py.stderr.on('data', (d) => errStr += d.toString());

            py.on('close', (code) => {
                if (code === 0) success('Job Completed');
                else error(new Error(errStr.trim() || 'win32print process failed'));
            });

            py.on('error', (err) => error(err));
        }
    };

    // We instantiate the printer per job to prevent connection hang-ups on USB Generic POS devices.
    const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: `printer:${printerName}`,
        characterSet: CharacterSet.PC437_USA,
        removeSpecialCharacters: false,
        lineCharacter: "-",
        width: 32, // 58mm Thermal Printers are typically 32 characters wide. (Use 48 for 80mm)
        driver: win32PrintDriver, // Uses our custom Python win32print bridge
    });

    try {
        printer.alignCenter();
        printer.println("Northern Mindanao Medical Center");
        printer.println("Capitol Rd, Cagayan De Oro City, 9000 Misamis Oriental");
        printer.println(data.station || 'Station');
        printer.drawLine();
        printer.println(data.label || 'Queue Number');
        printer.newLine();

        // Huge bold typography for the ticket number
        printer.setTextSize(2, 2);
        printer.bold(true);
        printer.println(data.ticketNumber || '000');
        printer.bold(false);
        printer.setTextNormal();

        // Revert sizes and add spacer
        printer.newLine();
        printer.println(data.date || new Date().toLocaleString());
        printer.drawLine();

        if (data.windowAssignment) {
            printer.alignCenter();
            printer.bold(true);
            printer.println(data.windowAssignment);
            printer.bold(false);
        } else {
            printer.newLine();
        }

        if (data.footer) {
            printer.alignCenter();
            // Wrap text if needed natively
            printer.println(data.footer);
        }

        // Feed exactly enough paper so the blade sits below the final letters
        printer.cut({ verticalTabAmount: 1 });

        // Perform the print command dispatch
        await printer.execute();
        logger.info(`Ticket printed successfully to: ${printerName}`);

    } catch (error: any) {
        logger.error(`Print Failed on ${printerName}: ${error.message}`);
        printer.clear();
        throw new Error(`Queue Print Error: ${error.message}`);
    }
}
