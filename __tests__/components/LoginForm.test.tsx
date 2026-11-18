/**
 * LoginForm.test.tsx — Tests for LoginForm component
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "@/components/LoginForm";

// Mock next/navigation — useSearchParams
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
jest.mock("next/link", () => {
  return ({ href, children, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

// Mock window.location.href (jsdom doesn't support navigation)
const mockLocation = { href: "" };
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

// Helper: get email/password inputs via querySelector (labels lack htmlFor)
function getEmailInput(container: HTMLElement) {
  return container.querySelector('input[type="email"]') as HTMLInputElement;
}
function getPasswordInput(container: HTMLElement) {
  return container.querySelector('input[type="password"]') as HTMLInputElement;
}

describe("LoginForm — rendering", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockLocation.href = "";
  });

  it("should render email and password fields", () => {
    const { container } = render(React.createElement(LoginForm));
    expect(getEmailInput(container)).toBeTruthy();
    expect(getPasswordInput(container)).toBeTruthy();
  });

  it("should render login button", () => {
    render(React.createElement(LoginForm));
    expect(screen.getByRole("button", { name: /Log in/i })).toBeInTheDocument();
  });

  it("should render link to register", () => {
    render(React.createElement(LoginForm));
    expect(screen.getByText("Create an account")).toBeInTheDocument();
  });

  it("should have type=email on email input", () => {
    const { container } = render(React.createElement(LoginForm));
    expect(getEmailInput(container)).toHaveAttribute("type", "email");
  });

  it("should have type=password on password input", () => {
    const { container } = render(React.createElement(LoginForm));
    expect(getPasswordInput(container)).toHaveAttribute("type", "password");
  });
});

describe("LoginForm — interaction", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockLocation.href = "";
  });

  it("should update email on type", () => {
    const { container } = render(React.createElement(LoginForm));
    const emailInput = getEmailInput(container);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");
  });

  it("should update password on type", () => {
    const { container } = render(React.createElement(LoginForm));
    const pwInput = getPasswordInput(container);
    fireEvent.change(pwInput, { target: { value: "secret123" } });
    expect(pwInput.value).toBe("secret123");
  });

  it("should call fetch on submit with email and password", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { container } = render(React.createElement(LoginForm));
    fireEvent.change(getEmailInput(container), { target: { value: "user@test.com" } });
    fireEvent.change(getPasswordInput(container), { target: { value: "pass123" } });
    fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@test.com", password: "pass123" }),
      }));
    });
  });

  it("should show error on failed login", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    });

    const { container } = render(React.createElement(LoginForm));
    fireEvent.change(getEmailInput(container), { target: { value: "wrong@test.com" } });
    fireEvent.change(getPasswordInput(container), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("should redirect to /dashboard on successful login", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { container } = render(React.createElement(LoginForm));
    fireEvent.change(getEmailInput(container), { target: { value: "good@test.com" } });
    fireEvent.change(getPasswordInput(container), { target: { value: "correct" } });
    fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

    await waitFor(() => {
      expect(mockLocation.href).toBe("/dashboard");
    });
  });

  it("should show MFA step when mfaRequired is true", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ mfaRequired: true, userId: "user-123" }),
    });

    const { container } = render(React.createElement(LoginForm));
    fireEvent.change(getEmailInput(container), { target: { value: "mfa@test.com" } });
    fireEvent.change(getPasswordInput(container), { target: { value: "pass" } });
    fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

    await waitFor(() => {
      expect(screen.getByText("Two-Factor Authentication")).toBeInTheDocument();
      expect(screen.getByText(/6-digit code/)).toBeInTheDocument();
    });
  });
});
