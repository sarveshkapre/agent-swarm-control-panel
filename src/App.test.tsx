import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import App from "./App";

const storageKey = "swarm-control-panel-state";

beforeEach(() => {
  if (typeof window.localStorage.removeItem === "function") {
    window.localStorage.removeItem(storageKey);
  }
});

it("renders the control panel header", () => {
  render(<App />);
  expect(screen.getByText(/Control Panel/i)).toBeInTheDocument();
});

it("hydrates UI state from localStorage without wiping it", async () => {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      theme: "light",
      runSearch: "ops",
      logSearch: "error"
    })
  );

  render(<App />);

  await waitFor(() => {
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  expect(screen.getByLabelText("Search runs")).toHaveValue("ops");
  expect(screen.getByLabelText("Search logs")).toHaveValue("error");

  await waitFor(() => {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as {
      runSearch?: string;
      logSearch?: string;
    };
    expect(stored.runSearch).toBe("ops");
    expect(stored.logSearch).toBe("error");
  });
});

it("starts and stops log streaming without creating multiple intervals", async () => {
  vi.useFakeTimers();
  const setIntervalSpy = vi.spyOn(window, "setInterval");
  const clearIntervalSpy = vi.spyOn(window, "clearInterval");

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const { unmount } = render(<App />);

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /Start stream/i }));
  });
  expect(setIntervalSpy.mock.calls.filter(([, delay]) => delay === 5000)).toHaveLength(1);

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /Pause stream/i }));
  });
  expect(clearIntervalSpy).toHaveBeenCalled();

  unmount();
  setIntervalSpy.mockRestore();
  clearIntervalSpy.mockRestore();
  vi.useRealTimers();
});

it("does not steal focus when pressing / inside an input", async () => {
  render(<App />);

  const runSearch = screen.getByLabelText("Search runs");
  const logSearch = screen.getByLabelText("Search logs");

  logSearch.focus();
  expect(document.activeElement).toBe(logSearch);

  fireEvent.keyDown(logSearch, { key: "/" });
  expect(document.activeElement).toBe(logSearch);

  fireEvent.keyDown(window, { key: "/" });
  await waitFor(() => expect(document.activeElement).toBe(runSearch));
});
