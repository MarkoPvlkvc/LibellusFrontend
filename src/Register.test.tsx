import "@testing-library/jest-dom";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import Register from "./pages/Register";

vi.mock("axios");
vi.mock("js-cookie", () => ({
  default: {
    set: vi.fn(),
  },
}));

const mockedAxios = axios as unknown as {
  post: ReturnType<typeof vi.fn>;
};

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("Register component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all input fields and buttons", () => {
    renderWithClient(<Register />);
    expect(screen.getByPlaceholderText("Enter first name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter last name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("Enter password")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Register" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("submits the form and sets cookies on success", async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: {
        token: "mock-token",
        user: {
          data: {
            id: "123",
            attributes: {
              type: "member",
            },
          },
        },
      },
    });

    renderWithClient(<Register />);

    fireEvent.change(screen.getByPlaceholderText("Enter first name"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter last name"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("Enter password")[0], {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("Enter password")[1], {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(Cookies.set).toHaveBeenCalledWith(
        "token",
        "mock-token",
        expect.anything()
      );
      expect(Cookies.set).toHaveBeenCalledWith(
        "userType",
        "member",
        expect.anything()
      );
      expect(Cookies.set).toHaveBeenCalledWith(
        "userId",
        "123",
        expect.anything()
      );
    });
  });

  it("shows error if registration fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedAxios.post = vi.fn().mockRejectedValue(new Error("Failed"));

    renderWithClient(<Register />);

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Registration failed:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
