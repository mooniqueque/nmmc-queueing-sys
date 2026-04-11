import type { VisitClassification } from "./enums";

export interface TicketPrintPayload {
    station: string;
    label: string;
    displayNumber: string;
    date: string;
    labelBold?: boolean;
    windowAssignment?: string;
    footer?: string;
}

export type TicketPrintJob =
    | {
          type: "triage";
          triageTicket: number;
          classification: VisitClassification;
          timestamp?: string;
      }
    | {
          type: "releasing";
          serviceTicket: number;
          departmentCode: string;
          classification: VisitClassification;
          priorityName?: string | null;
          timestamp?: string;
      };
