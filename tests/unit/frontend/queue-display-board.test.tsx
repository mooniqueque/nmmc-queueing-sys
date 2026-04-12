import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { HistoryTable } from "../../../nmmcqueue-frontend/src/features/shared/components/history-table";

describe("Queue display board unit", () => {
  it("renders ticket entries with status badges", () => {
    render(
      <HistoryTable
        items={[
          {
            id: "1",
            triageTicket: 1,
            serviceTicket: 100,
            patientName: "Patient Waiting",
            status: "WAITING_CLINIC",
            timestamp: "2026-04-12T08:00:00.000Z",
            classification: "REGULAR",
            department: "CARDIOLOGY",
          },
          {
            id: "2",
            triageTicket: 2,
            serviceTicket: 101,
            patientName: "Patient Called",
            status: "IN_PROGRESS",
            timestamp: "2026-04-12T08:10:00.000Z",
            classification: "PRIORITY",
            department: "CARDIOLOGY",
          },
          {
            id: "3",
            triageTicket: 3,
            serviceTicket: 102,
            patientName: "Patient Serving",
            status: "COMPLETED",
            timestamp: "2026-04-12T08:20:00.000Z",
            classification: "REGULAR",
            department: "CARDIOLOGY",
          },
        ]}
      />
    );

    expect(screen.getByText("Service #100")).toBeInTheDocument();
    expect(screen.getByText("Service #101")).toBeInTheDocument();
    expect(screen.getByText("Service #102")).toBeInTheDocument();

    expect(screen.getByText("WAITING CLINIC")).toBeInTheDocument();
    expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
  });
});
