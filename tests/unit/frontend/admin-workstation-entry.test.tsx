import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { createWorkstationMock } = vi.hoisted(() => ({
  createWorkstationMock: vi.fn(async () => ({ success: true })),
}));

vi.mock("../../../nmmcqueue-frontend/src/features/admin/workstation-actions", () => ({
  createWorkstation: createWorkstationMock,
}));

import { WorkstationForm } from "../../../nmmcqueue-frontend/src/features/admin/components/workstation/WorkstationForm";

describe("Admin workstation management entry unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders add workstation entry and handles add button click", async () => {
    const user = userEvent.setup();

    render(<WorkstationForm workstations={[]} departments={[]} />);

    expect(screen.getByText(/add workstation/i)).toBeInTheDocument();

    const addButton = screen.getByRole("button", { name: /\+ add/i });
    expect(addButton).toBeInTheDocument();

    await user.click(addButton);

    expect(createWorkstationMock).toHaveBeenCalledTimes(1);
  });
});
