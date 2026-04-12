import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../../nmmcqueue-frontend/src/features/shared/api", () => ({
  getDepartments: vi.fn(async () => ({ success: true, data: [{ id: "dept-1", name: "CARDIOLOGY" }] })),
}));

vi.mock("../../../nmmcqueue-frontend/src/features/caller/api", () => ({
  CallerApiError: class extends Error {},
  callNextPatient: vi.fn(),
  callPatient: vi.fn(),
  noShowPatient: vi.fn(),
  restorePatient: vi.fn(),
  servePatient: vi.fn(),
  transferPatient: vi.fn(),
}));

vi.mock("../../../nmmcqueue-frontend/src/app/(admin)/_hooks/use-clinic-queue", () => ({
  useClinicQueue: vi.fn(() => ({
    activeQueue: [
      {
        id: "visit-1",
        status: "IN_PROGRESS",
        classification: "REGULAR",
        createdAt: "2026-04-12T08:00:00.000Z",
        serviceTicket: 101,
        department: { name: "CARDIOLOGY" },
        patient: {
          firstName: "Maria",
          lastName: "Santos",
          dateOfBirth: "1990-01-01T00:00:00.000Z",
          gender: "F",
          contactNo: "09170000000",
        },
      },
    ],
  })),
}));

vi.mock("../../../nmmcqueue-frontend/src/features/shared/hooks/use-operational-snapshot", () => ({
  useClinicSnapshot: vi.fn(() => ({
    data: {
      totals: {
        totalPatientsServed: 0,
        clinicNoShowCount: 0,
        avgWaitMinutes: 0,
        avgServeMinutes: 0,
        transferCount: 0,
        transferRate: 0,
      },
      department: { name: "CARDIOLOGY" },
    },
  })),
}));

vi.mock("../../../nmmcqueue-frontend/src/features/caller/store/use-caller-store", () => ({
  useCallerStore: vi.fn(() => ({
    activeTab: "waitlist",
    setActiveTab: vi.fn(),
    allDepartments: [{ id: "dept-1", name: "CARDIOLOGY" }],
    setDepartments: vi.fn(),
    isReferralModalOpen: false,
    setReferralModalOpen: vi.fn(),
    targetDeptId: "",
    setTargetDeptId: vi.fn(),
    resetReferral: vi.fn(),
  })),
}));

import UserCallerDashboard from "../../../nmmcqueue-frontend/src/features/caller/components/user-caller-dashboard";

describe("Caller dashboard unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders department header and active service ticket", () => {
    render(<UserCallerDashboard department="CARDIOLOGY" initialQueue={[]} />);

    expect(screen.getAllByText("CARDIOLOGY")[0]).toBeInTheDocument();
    expect(screen.getByText("#101")).toBeInTheDocument();
    expect(screen.getByText(/patient is currently being served/i)).toBeInTheDocument();
  });
});
