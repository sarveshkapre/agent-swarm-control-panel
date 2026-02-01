import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

it("traps focus inside the approval drawer and restores focus on close", async () => {
  render(<App />);

  const user = userEvent.setup();
  const viewAll = screen.getByRole("button", { name: /View all/i });
  viewAll.focus();
  expect(document.activeElement).toBe(viewAll);

  fireEvent.click(viewAll);

  const drawer = await screen.findByRole("dialog", { name: /Approval request/i });
  const closeButton = within(drawer).getByRole("button", { name: /Close/i });
  closeButton.focus();

  await user.tab();
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Deny/i })).toHaveFocus();
  });

  closeButton.focus();
  await user.tab({ shift: true });
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Approve/i })).toHaveFocus();
  });

  const overlayClose = screen.getByRole("button", { name: /Close approval drawer/i });
  fireEvent.click(overlayClose);
  await waitFor(() => expect(viewAll).toHaveFocus());
});

it("traps focus inside the policy modal and restores focus on close", async () => {
  render(<App />);

  const user = userEvent.setup();
  const openPolicy = screen.getByRole("button", { name: /Open policy editor/i });
  openPolicy.focus();
  fireEvent.click(openPolicy);

  const modal = await screen.findByRole("dialog", { name: /Policy editor/i });
  const closeButton = within(modal).getByRole("button", { name: /Close/i });
  closeButton.focus();

  await user.tab();
  await waitFor(() => {
    expect(screen.getByLabelText(/Policy mode/i)).toHaveFocus();
  });

  await user.tab({ shift: true });
  await waitFor(() => {
    expect(within(modal).getByRole("button", { name: /Close/i })).toHaveFocus();
  });

  const overlayClose = screen.getByRole("button", { name: /Close policy editor/i });
  fireEvent.click(overlayClose);
  await waitFor(() => expect(openPolicy).toHaveFocus());
});

it("queues a run from the composer and shows it in the list", async () => {
  render(<App />);

  const user = userEvent.setup();
  const composer = screen.getByRole("form", { name: /Run composer/i });
  const objectiveInput = within(composer).getByLabelText(/Objective/i);
  await act(async () => {
    await user.type(objectiveInput, "Investigate customer churn spikes");
  });

  await act(async () => {
    await user.selectOptions(
      within(composer).getByLabelText(/Owner/i),
      "Research"
    );
  });

  await act(async () => {
    await user.click(within(composer).getByRole("button", { name: /Queue run/i }));
  });

  const runList = document.querySelector<HTMLElement>(".run-list");
  expect(runList).not.toBeNull();
  expect(within(runList!).getByText(/Investigate customer churn spikes/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Queued/i).length).toBeGreaterThan(0);
});

it("confirms run actions via toast and updates status", async () => {
  render(<App />);

  const user = userEvent.setup();
  const runList = document.querySelector<HTMLElement>(".run-list");
  expect(runList).not.toBeNull();

  const pauseButtons = within(runList!).getAllByRole("button", { name: /Pause/i });
  const pauseButton = pauseButtons.find((button) => !button.hasAttribute("disabled"));
  expect(pauseButton).toBeTruthy();
  await act(async () => {
    await user.click(pauseButton!);
  });

  const confirmButton = await screen.findByRole("button", { name: /Pause run/i });
  await act(async () => {
    await user.click(confirmButton);
  });

  const targetRun = within(runList!)
    .getByText(/r-114/i)
    .closest(".run") as HTMLElement | null;
  expect(targetRun).not.toBeNull();
  expect(within(targetRun!).getByText(/Waiting/i)).toBeInTheDocument();
});
