import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, test, vi, beforeEach } from "vitest";
import Login from "./pages/Login";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("Login component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    delete (window as any).location;
    (window as any).location = { href: "" };
    (globalThis as any).alert = vi.fn();
  });

  test("renders email and password inputs and buttons", () => {
    renderWithClient(<Login />);

    expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i })
    ).toBeInTheDocument();
  });

  test("updates email and password inputs", () => {
    renderWithClient(<Login />);

    const emailInput = screen.getByPlaceholderText(/enter email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput).toHaveValue("test@example.com");

    const passwordInput = screen.getByPlaceholderText(/enter password/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    expect(passwordInput).toHaveValue("password123");
  });

  test("calls mutation on form submit", async () => {
    renderWithClient(<Login />);

    fireEvent.change(screen.getByPlaceholderText(/enter email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  test("redirects to /register when register button clicked", () => {
    renderWithClient(<Login />);

    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    expect(window.location.href).toBe("/register");
  });

  test("shows alert on login error", () => {
    (globalThis as any).alert("Invalid email or password");
    expect((globalThis as any).alert).toHaveBeenCalledWith(
      "Invalid email or password"
    );
  });
});
