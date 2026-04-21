import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../nmmcqueue-frontend/src/features/shared/api", () => ({
  getDepartments: vi.fn(async () => ({ success: true, data: [{ id: "dept-1", name: "CARDIOLOGY" }] })),
  getQueueOptions: vi.fn(async () => ([
    { id: "cat-reg", name: "REGULAR", code: "REG", isPriority: false },
    { id: "cat-pwd", name: "PWD", code: "PWD", isPriority: true },
  ])),
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

import { useClinicQueue } from "../../../nmmcqueue-frontend/src/app/(admin)/_hooks/use-clinic-queue";
import { callNextPatient, callPatient, noShowPatient } from "../../../nmmcqueue-frontend/src/features/caller/api";
import { useCallerStore } from "../../../nmmcqueue-frontend/src/features/caller/store/use-caller-store";
import UserCallerDashboard from "../../../nmmcqueue-frontend/src/features/caller/components/user-caller-dashboard";

const mockCallNextPatient = vi.mocked(callNextPatient);
const mockCallPatient = vi.mocked(callPatient);
const mockNoShowPatient = vi.mocked(noShowPatient);
const mockUseClinicQueue = vi.mocked(useClinicQueue);
const mockUseCallerStore = vi.mocked(useCallerStore);

describe("Caller dashboard unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCallerStore.mockReturnValue({
      activeTab: "waitlist",
      setActiveTab: vi.fn(),
      allDepartments: [{ id: "dept-1", name: "CARDIOLOGY" }],
      setDepartments: vi.fn(),
      isReferralModalOpen: false,
      setReferralModalOpen: vi.fn(),
      targetDeptId: "",
      setTargetDeptId: vi.fn(),
      resetReferral: vi.fn(),
    } as any);
    mockUseClinicQueue.mockReturnValue({
      activeQueue: [
        {
          id: "visit-1",
          status: "IN_PROGRESS",
          classification: "REGULAR",
          categories: [{ categoryId: "cat-reg", category: { id: "cat-reg", code: "REG", name: "REGULAR", isPriority: false } }],
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
    } as any);
  });

  it("renders department header and active service ticket", () => {
    render(<UserCallerDashboard department="CARDIOLOGY" callerUserId="caller-1" initialQueue={[]} />);

    expect(screen.getAllByText("CARDIOLOGY")[0]).toBeInTheDocument();
    expect(screen.getByText("#101")).toBeInTheDocument();
    expect(screen.getByText(/patient is currently being served/i)).toBeInTheDocument();
    expect(screen.getByText("REG")).toBeInTheDocument();
  });

  it("calls next priority patient by selected queue option from dropdown", async () => {
    mockUseClinicQueue.mockReturnValue({
      activeQueue: [
        {
          id: "visit-priority",
          status: "WAITING_CLINIC",
          classification: "PRIORITY",
          categories: [{ categoryId: "cat-pwd", category: { id: "cat-pwd", code: "PWD", name: "PWD", isPriority: true } }],
          createdAt: "2026-04-12T08:10:00.000Z",
          serviceTicket: 102,
          isReferred: false,
          department: { name: "CARDIOLOGY" },
          patient: {
            firstName: "Juan",
            lastName: "Dela Cruz",
            dateOfBirth: "1992-02-02T00:00:00.000Z",
            gender: "M",
            contactNo: "09171111111",
          },
        },
      ],
    } as any);

    mockCallNextPatient.mockResolvedValue({
      success: true,
      data: null,
    } as any);

    render(<UserCallerDashboard department="CARDIOLOGY" callerUserId="caller-1" initialQueue={[]} />);

    fireEvent.click(screen.getByLabelText(/select priority queue option/i));
    fireEvent.click(await screen.findByText("PWD"));

    await waitFor(() => {
      expect(mockCallNextPatient).toHaveBeenCalledWith("PRIORITY", "PWD");
    });
  });

  it("recalls an owned no-show patient from the no-show tab", async () => {
    mockUseCallerStore.mockReturnValue({
      activeTab: "noshow",
      setActiveTab: vi.fn(),
      allDepartments: [{ id: "dept-1", name: "CARDIOLOGY" }],
      setDepartments: vi.fn(),
      isReferralModalOpen: false,
      setReferralModalOpen: vi.fn(),
      targetDeptId: "",
      setTargetDeptId: vi.fn(),
      resetReferral: vi.fn(),
    } as any);

    mockUseClinicQueue.mockReturnValue({
      activeQueue: [
        {
          id: "visit-no-show",
          status: "NO_SHOW",
          classification: "PRIORITY",
          categories: [{ categoryId: "cat-pwd", category: { id: "cat-pwd", code: "PWD", name: "PWD", isPriority: true } }],
          createdAt: "2026-04-12T08:10:00.000Z",
          serviceTicket: 103,
          sequenceKey: "DEPT_dept-1",
          calledByUserId: "caller-1",
          department: { name: "CARDIOLOGY" },
          patient: {
            firstName: "Liza",
            lastName: "Reyes",
            dateOfBirth: "1995-03-03T00:00:00.000Z",
            gender: "F",
            contactNo: "09172222222",
          },
        },
      ],
    } as any);

    mockCallPatient.mockResolvedValue({
      success: true,
      data: {
        id: "visit-no-show",
        status: "IN_PROGRESS",
        classification: "PRIORITY",
        categories: [{ categoryId: "cat-pwd", category: { id: "cat-pwd", code: "PWD", name: "PWD", isPriority: true } }],
        createdAt: "2026-04-12T08:10:00.000Z",
        serviceTicket: 103,
        department: { name: "CARDIOLOGY" },
        patient: {
          firstName: "Liza",
          lastName: "Reyes",
          dateOfBirth: "1995-03-03T00:00:00.000Z",
          gender: "F",
          contactNo: "09172222222",
        },
      },
    } as any);

    render(<UserCallerDashboard department="CARDIOLOGY" callerUserId="caller-1" initialQueue={[]} />);

    fireEvent.click(await screen.findByRole("button", { name: /call patient again/i }));

    await waitFor(() => {
      expect(mockCallPatient).toHaveBeenCalledWith("visit-no-show");
    });
  });

  it("moves a no-show patient into the no-show tab immediately with the queue tag", async () => {
    mockUseCallerStore.mockReturnValue({
      activeTab: "noshow",
      setActiveTab: vi.fn(),
      allDepartments: [{ id: "dept-1", name: "CARDIOLOGY" }],
      setDepartments: vi.fn(),
      isReferralModalOpen: false,
      setReferralModalOpen: vi.fn(),
      targetDeptId: "",
      setTargetDeptId: vi.fn(),
      resetReferral: vi.fn(),
    } as any);

    mockUseClinicQueue.mockReturnValue({
      activeQueue: [
        {
          id: "visit-1",
          status: "IN_PROGRESS",
          classification: "PRIORITY",
          categories: [{ categoryId: "cat-pwd", category: { id: "cat-pwd", code: "PWD", name: "PWD", isPriority: true } }],
          createdAt: "2026-04-12T08:00:00.000Z",
          serviceTicket: 101,
          departmentId: "dept-1",
          department: { name: "CARDIOLOGY" },
          calledByUserId: "caller-1",
          patient: {
            firstName: "Jason",
            lastName: "Fabria",
            dateOfBirth: "1990-01-01T00:00:00.000Z",
            gender: "M",
            contactNo: "09170000000",
          },
        },
      ],
    } as any);

    mockNoShowPatient.mockResolvedValue({
      success: true,
      data: {
        id: "visit-1",
        status: "NO_SHOW",
        sequenceKey: "DEPT_dept-1",
        calledByUserId: "caller-1",
      },
    } as any);

    render(<UserCallerDashboard department="CARDIOLOGY" callerUserId="caller-1" initialQueue={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /no show/i }));

    await waitFor(() => {
      expect(mockNoShowPatient).toHaveBeenCalledWith("visit-1");
    });

    expect(await screen.findByText(/fabria/i)).toBeInTheDocument();
    expect(screen.getByText("PWD")).toBeInTheDocument();
    expect(screen.getByText(/no shows \(1\)/i)).toBeInTheDocument();
  });
});
