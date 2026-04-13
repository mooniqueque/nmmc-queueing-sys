import type { TicketPrintJob, TicketPrintPayload } from "@nmmc/types";
import { spawn } from "child_process";
import { characterSet as CharacterSet, types as PrinterTypes, printer as ThermalPrinter } from "node-thermal-printer";
import path from "path";
import logger from "../lib/logger.js";

type TriagePrintSource = {
    triageTicket: number;
    classification: "PRIORITY" | "REGULAR";
};

type ReleasingPrintSource = {
    serviceTicket: number;
    departmentCode: string;
    classification: "PRIORITY" | "REGULAR";
    priorityName?: string;
};

type TicketPrintInput = TicketPrintJob | TriagePrintSource | ReleasingPrintSource;

class TicketPrintingService {
    async print(input: TicketPrintInput): Promise<void> {
        const job = this.normalizeJob(input);
        const payload = this.buildPayload(job);
        await this.printPayload(payload);
    }

    async printPayload(payload: TicketPrintPayload): Promise<void> {
        const printerName = process.env.PRINTER_NAME || "XP-58 (copy 1)";
        const printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: `printer:${printerName}`,
            characterSet: CharacterSet.PC437_USA,
            removeSpecialCharacters: false,
            lineCharacter: "-",
            width: 32,
            driver: this.createWin32PrintDriver(),
        });

        try {
            printer.alignCenter();
            printer.println("Northern Mindanao Medical Center");
            printer.println(payload.station || "Station");
            printer.drawLine();

            if (payload.labelBold) {
                printer.bold(true);
                printer.println(payload.label || "Queue Number");
                printer.bold(false);
            } else {
                printer.println(payload.label || "Queue Number");
            }

            printer.newLine();
            printer.setTextSize(2, 2);
            printer.bold(true);
            printer.println(payload.displayNumber || "000");
            printer.bold(false);
            printer.setTextNormal();

            printer.newLine();
            printer.println(payload.date || new Date().toLocaleString());
            printer.drawLine();

            if (payload.windowAssignment) {
                printer.alignCenter();
                printer.bold(true);
                printer.println(payload.windowAssignment);
                printer.bold(false);
            } else {
                printer.newLine();
            }

            if (payload.footer) {
                printer.alignCenter();
                printer.println(payload.footer);
            }

            printer.cut({ verticalTabAmount: 1 });
            await printer.execute();
            logger.info(`Ticket printed successfully to: ${printerName}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown printer error";
            logger.error(`Print Failed on ${printerName}: ${message}`);
            printer.clear();
            throw new Error(`Queue Print Error: ${message}`);
        }
    }

    private buildPayload(job: TicketPrintJob): TicketPrintPayload {
        if (job.type === "triage") {
            const prefix = job.classification === "PRIORITY" ? "PRIO" : "REG";
            return {
                station: "Triage Station",
                label: "Triage Ticket",
                displayNumber: `${prefix}-${job.triageTicket.toString().padStart(2, "0")}`,
                date: job.timestamp || new Date().toLocaleString(),
                windowAssignment: job.classification === "PRIORITY" ? "Proceed to Window 1" : "Proceed to Window 4",
                footer: "This ticket is valid for today only.",
            };
        }

        const formattedTicket = `${job.departmentCode} - ${job.serviceTicket.toString().padStart(2, "0")}`;
        let labelText = "REGULAR";
        if (job.classification === "PRIORITY") {
            const upperName = (job.priorityName || "").toUpperCase();
            if (upperName === "PRIORITY" || upperName === "PRIORITY CLASS" || !upperName) {
                labelText = "PRIORITY";
            } else {
                labelText = `PRIO: ${upperName}`;
            }
        }

        return {
            station: "Releasing Window",
            label: labelText,
            labelBold: true,
            displayNumber: formattedTicket,
            date: job.timestamp || new Date().toLocaleString(),
            footer: "This ticket is valid for today only.",
        };
    }

    private normalizeJob(input: TicketPrintInput): TicketPrintJob {
        if ("type" in input) {
            return input;
        }

        if ("triageTicket" in input) {
            return {
                type: "triage",
                triageTicket: input.triageTicket,
                classification: input.classification,
            };
        }

        if ("serviceTicket" in input) {
            return {
                type: "releasing",
                serviceTicket: input.serviceTicket,
                departmentCode: input.departmentCode,
                classification: input.classification,
                priorityName: input.priorityName,
            };
        }

        throw new Error("Unsupported print payload");
    }

    private createWin32PrintDriver() {
        return {
            printDirect: (options: { data: Buffer; printer: string; success: (msg: string) => void; error: (err: Error) => void }) => {
                const { data, printer, success, error } = options;
                const b64Data = data.toString("base64");
                const pyScript = path.join(process.cwd(), "src", "lib", "raw_print.py");
                const py = spawn("python", [pyScript, printer]);
                let errStr = "";

                py.stdin.write(b64Data);
                py.stdin.end();

                py.stderr.on("data", (chunk) => {
                    errStr += chunk.toString();
                });

                py.on("close", (code) => {
                    if (code === 0) success("Job Completed");
                    else error(new Error(errStr.trim() || "win32print process failed"));
                });

                py.on("error", (err) => error(err));
            },
        };
    }
}

export const ticketPrintingService = new TicketPrintingService();
