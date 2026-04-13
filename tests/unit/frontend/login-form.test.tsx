import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const {
  signInMock,
  notifyErrorMock,
} = vi.hoisted(() => ({
  signInMock: vi.fn(),
  notifyErrorMock: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: (props: any) => {
    const { alt, ...rest } = props;
    return <img alt={alt ?? "image"} {...rest} />;
  },
}));

vi.mock("../../../nmmcqueue-frontend/src/lib/database/auth-client", () => ({
  authClient: {
    signIn: {
      username: signInMock,
    },
  },
}));

vi.mock("../../../nmmcqueue-frontend/src/shared/lib/notify", () => ({
  notify: {
    error: notifyErrorMock,
    success: vi.fn(),
    info: vi.fn(),
  },
}));

import LoginForm from "../../../nmmcqueue-frontend/src/features/auth/components/login-form";
import { mockRouter } from "../../../nmmcqueue-frontend/tests/mocks/next-navigation";

describe("LoginForm unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.push.mockClear();
    mockRouter.refresh.mockClear();
  });

  it("renders login inputs and submit button", () => {
    render(<LoginForm />);

    const button = screen.getByRole("button", { name: /login/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(document.querySelector('input[name="password"]')).toBeInTheDocument();
  });

  it("shows validation errors for invalid input", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/username/i), "a");
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
    await user.type(passwordInput, "123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText("Username is required.")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
  });

  it("shows auth error and does not redirect on failed sign-in", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ error: { message: "Invalid Username or Password" } });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/username/i), "validuser");
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
    await user.type(passwordInput, "validpass123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(signInMock).toHaveBeenCalledTimes(1);
    expect(notifyErrorMock).toHaveBeenCalledWith("Invalid Username or Password");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
