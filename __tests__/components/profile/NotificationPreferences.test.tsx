import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DigestPreferences from "@/components/profile/DigestPreferences";

// Mock fetch globally
global.fetch = vi.fn();

describe("DigestPreferences Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    (global.fetch as any).mockImplementation(() =>
      new Promise(() => {}) // Never resolves
    );

    render(<DigestPreferences />);
    expect(screen.getByText(/loading digest preferences/i)).toBeInTheDocument();
  });

  it("should fetch and display digest preferences", async () => {
    const mockPreferences = {
      preferences: {
        enabled: true,
        frequency: "daily",
        timeOfDay: 9,
        dayOfWeek: 1,
        minNotifications: 5,
        includeChannels: ["email", "pushover"],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPreferences,
    });

    render(<DigestPreferences />);

    await waitFor(() => {
      expect(screen.getByText(/notification digest settings/i)).toBeInTheDocument();
    });

    // Check if the enabled checkbox is checked
    const enabledCheckbox = screen.getByRole("checkbox", {
      name: /enable notification digest/i,
    });
    expect(enabledCheckbox).toBeChecked();
  });

  it("should allow toggling digest enabled state", async () => {
    const mockPreferences = {
      preferences: {
        enabled: false,
        frequency: "daily",
        timeOfDay: 9,
        dayOfWeek: 1,
        minNotifications: 1,
        includeChannels: ["email"],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPreferences,
    });

    render(<DigestPreferences />);

    await waitFor(() => {
      expect(screen.getByText(/notification digest settings/i)).toBeInTheDocument();
    });

    const enabledCheckbox = screen.getByRole("checkbox", {
      name: /enable notification digest/i,
    });

    expect(enabledCheckbox).not.toBeChecked();

    // Toggle the checkbox
    fireEvent.click(enabledCheckbox);

    // Checkbox should now be checked
    expect(enabledCheckbox).toBeChecked();
  });

  it("should save preferences on button click", async () => {
    const mockPreferences = {
      preferences: {
        enabled: true,
        frequency: "daily",
        timeOfDay: 9,
        dayOfWeek: 1,
        minNotifications: 1,
        includeChannels: ["email"],
      },
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferences,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<DigestPreferences />);

    await waitFor(() => {
      expect(screen.getByText(/notification digest settings/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", {
      name: /save digest settings/i,
    });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/digest preferences saved successfully/i)).toBeInTheDocument();
    });
  });

  it("should display error message on save failure", async () => {
    const mockPreferences = {
      preferences: {
        enabled: true,
        frequency: "daily",
        timeOfDay: 9,
        dayOfWeek: 1,
        minNotifications: 1,
        includeChannels: ["email"],
      },
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferences,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed to update" }),
      });

    render(<DigestPreferences />);

    await waitFor(() => {
      expect(screen.getByText(/notification digest settings/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", {
      name: /save digest settings/i,
    });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update/i)).toBeInTheDocument();
    });
  });

  it("should show frequency-specific options based on selection", async () => {
    const mockPreferences = {
      preferences: {
        enabled: true,
        frequency: "daily",
        timeOfDay: 9,
        dayOfWeek: 1,
        minNotifications: 1,
        includeChannels: ["email"],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPreferences,
    });

    render(<DigestPreferences />);

    await waitFor(() => {
      expect(screen.getByText(/delivery time/i)).toBeInTheDocument();
    });

    // Daily should show time selector but not day selector
    expect(screen.getByText(/delivery time/i)).toBeInTheDocument();
    expect(screen.queryByText(/delivery day/i)).not.toBeInTheDocument();

    // Change to weekly
    const frequencySelect = screen.getByRole("combobox", { name: /digest frequency/i });
    fireEvent.change(frequencySelect, { target: { value: "weekly" } });

    // Weekly should show both time and day selectors
    await waitFor(() => {
      expect(screen.getByText(/delivery day/i)).toBeInTheDocument();
    });
  });

  it("should allow toggling channel selections", async () => {
    const mockPreferences = {
      preferences: {
        enabled: true,
        frequency: "daily",
        timeOfDay: 9,
        dayOfWeek: 1,
        minNotifications: 1,
        includeChannels: ["email"],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPreferences,
    });

    render(<DigestPreferences />);

    await waitFor(() => {
      expect(screen.getByText(/channels to include/i)).toBeInTheDocument();
    });

    // Email should be checked
    const emailCheckbox = screen.getByRole("checkbox", { name: /email/i });
    expect(emailCheckbox).toBeChecked();

    // Pushover should not be checked
    const pushoverCheckbox = screen.getByRole("checkbox", { name: /pushover/i });
    expect(pushoverCheckbox).not.toBeChecked();

    // Toggle Pushover
    fireEvent.click(pushoverCheckbox);
    expect(pushoverCheckbox).toBeChecked();
  });
});
