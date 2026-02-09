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

it("queues quick runs from top bar and runs panel actions", async () => {
  render(<App />);

  const user = userEvent.setup();
  const runList = document.querySelector<HTMLElement>(".run-list");
  expect(runList).not.toBeNull();

  expect(
    within(runList!).queryAllByText(/Ad hoc control-plane sync/i)
  ).toHaveLength(0);

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /^New run$/i }));
  });
  expect(
    within(runList!).getAllByText(/Ad hoc control-plane sync/i)
  ).toHaveLength(1);

  const runsCard = screen.getByText(/Runs in progress/i).closest(".card") as
    | HTMLElement
    | null;
  expect(runsCard).not.toBeNull();
  await act(async () => {
    await user.click(within(runsCard!).getByRole("button", { name: /^Queue run$/i }));
  });
  expect(
    within(runList!).getAllByText(/Ad hoc control-plane sync/i)
  ).toHaveLength(2);
});

it("queues a run from the selected template card", async () => {
  render(<App />);

  const user = userEvent.setup();
  const runList = document.querySelector<HTMLElement>(".run-list");
  expect(runList).not.toBeNull();
  expect(
    within(runList!).queryByText(/Ship onboarding flow with experiments/i)
  ).not.toBeInTheDocument();

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /Queue from template/i }));
  });

  expect(
    within(runList!).getByText(/Ship onboarding flow with experiments/i)
  ).toBeInTheDocument();
});

it("shows run health summary metrics and at-risk run details", () => {
  render(<App />);

  const healthCard = screen.getByText(/Run health summary/i).closest(".card") as
    | HTMLElement
    | null;
  expect(healthCard).not.toBeNull();
  expect(within(healthCard!).getByText(/Approvals pending/i)).toBeInTheDocument();
  expect(within(healthCard!).getByText(/Across 3 total runs/i)).toBeInTheDocument();
  expect(within(healthCard!).getByText(/\$7\.12/)).toBeInTheDocument();
  expect(
    within(healthCard!).getByText(/r-113 · Compile competitive report/i)
  ).toBeInTheDocument();
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
  const runStatus = targetRun!.querySelector("p.status");
  expect(runStatus).not.toBeNull();
  expect(runStatus).toHaveTextContent("Waiting");
});

it("exports evidence with integrity metadata", async () => {
  if (!("createObjectURL" in URL)) {
    Object.defineProperty(URL, "createObjectURL", {
      value: () => "blob:unsupported",
      writable: true
    });
  }
  if (!("revokeObjectURL" in URL)) {
    Object.defineProperty(URL, "revokeObjectURL", {
      value: () => undefined,
      writable: true
    });
  }

  const createObjectURLSpy = vi
    .spyOn(URL, "createObjectURL")
    .mockImplementation(() => "blob:mock-url");
  const revokeObjectURLSpy = vi
    .spyOn(URL, "revokeObjectURL")
    .mockImplementation(() => undefined);
  const anchorClickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);

  render(<App />);
  const user = userEvent.setup();
  await act(async () => {
    await user.click(screen.getByRole("button", { name: /^Export$/i }));
  });

  await waitFor(() => {
    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  const latestCall =
    createObjectURLSpy.mock.calls[createObjectURLSpy.mock.calls.length - 1];
  expect(latestCall).toBeTruthy();
  const [blob] = latestCall as [Blob];
  const blobText = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
  const payload = JSON.parse(blobText) as {
    evidenceSchemaVersion: number;
    integrity: {
      algorithm: string;
      digest: string | null;
      computedAt: string;
    };
  };

  expect(payload.evidenceSchemaVersion).toBe(3);
  expect(payload.integrity.computedAt).toEqual(expect.any(String));
  expect(["SHA-256", "none"]).toContain(payload.integrity.algorithm);
  if (payload.integrity.algorithm === "SHA-256") {
    expect(payload.integrity.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
  } else {
    expect(payload.integrity.digest).toBeNull();
  }

  createObjectURLSpy.mockRestore();
  revokeObjectURLSpy.mockRestore();
  anchorClickSpy.mockRestore();
});

it("verifies exported evidence bundles against the embedded checksum", async () => {
  if (!("createObjectURL" in URL)) {
    Object.defineProperty(URL, "createObjectURL", {
      value: () => "blob:unsupported",
      writable: true
    });
  }
  if (!("revokeObjectURL" in URL)) {
    Object.defineProperty(URL, "revokeObjectURL", {
      value: () => undefined,
      writable: true
    });
  }

  const createObjectURLSpy = vi
    .spyOn(URL, "createObjectURL")
    .mockImplementation(() => "blob:mock-url");
  const revokeObjectURLSpy = vi
    .spyOn(URL, "revokeObjectURL")
    .mockImplementation(() => undefined);
  const anchorClickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);

  render(<App />);
  const user = userEvent.setup();

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /^Export$/i }));
  });

  await waitFor(() => {
    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  const latestCall =
    createObjectURLSpy.mock.calls[createObjectURLSpy.mock.calls.length - 1];
  expect(latestCall).toBeTruthy();
  const [blob] = latestCall as [Blob];
  const blobText = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /^Verify$/i }));
  });

  const modal = await screen.findByRole("dialog", { name: /Verify evidence pack/i });
  const textarea = within(modal).getByLabelText(/Evidence JSON/i);
  fireEvent.change(textarea, { target: { value: blobText } });

  await act(async () => {
    await user.click(within(modal).getByRole("button", { name: /Verify checksum/i }));
  });

  await waitFor(() => {
    const verified = within(modal).queryByText(/^Checksum verified$/i);
    const unavailable = within(modal).queryByText(/^Checksum unavailable$/i);
    expect(verified || unavailable).toBeTruthy();
  });
  const pillVerified = within(modal).queryByText(/^VERIFIED$/i);
  const pillWarning = within(modal).queryByText(/^WARNING$/i);
  expect(pillVerified || pillWarning).toBeTruthy();

  createObjectURLSpy.mockRestore();
  revokeObjectURLSpy.mockRestore();
  anchorClickSpy.mockRestore();
});

it("sanitizes malformed imported state instead of applying unsafe values", async () => {
  render(<App />);

  const runList = document.querySelector<HTMLElement>(".run-list");
  expect(runList).not.toBeNull();
  expect(runList!.querySelectorAll(".run")).toHaveLength(3);

  const fileInput = document.querySelector<HTMLInputElement>("input[type='file']");
  expect(fileInput).not.toBeNull();

  const invalidState = {
    theme: "light",
    runSearch: "",
    queuedRuns: [
      {
        id: 123,
        objective: null,
        owner: "Ops",
        startedAt: "Now",
        status: "blocked"
      }
    ],
    runOverrides: {
      "r-114": "blocked"
    },
    logBudget: {
      warnBudget: -1,
      errorBudget: 3
    }
  };
  const file = new File([JSON.stringify(invalidState)], "state.json", {
    type: "application/json"
  });

  await act(async () => {
    fireEvent.change(fileInput!, { target: { files: [file] } });
  });

  await waitFor(() => {
  expect(screen.getByText(/Imported workspace state/i)).toBeInTheDocument();
  });

  expect(document.documentElement.dataset.theme).toBe("light");
  expect(screen.getByLabelText("Search runs")).toHaveValue("");
  expect(runList!.querySelectorAll(".run")).toHaveLength(3);

  const targetRun = within(runList!).getByText(/r-114/i).closest(".run") as HTMLElement | null;
  expect(targetRun).not.toBeNull();
  expect(within(targetRun!).getByText(/Running/i)).toBeInTheDocument();
});

it("opens run details with recent logs and approvals", async () => {
  render(<App />);

  const user = userEvent.setup();
  const runList = document.querySelector<HTMLElement>(".run-list");
  expect(runList).not.toBeNull();

  const targetRun = within(runList!).getByText(/r-114/i).closest(".run") as
    | HTMLElement
    | null;
  expect(targetRun).not.toBeNull();

  const detailsButton = within(targetRun!).getByRole("button", { name: /Details/i });
  await act(async () => {
    await user.click(detailsButton);
  });

  const dialog = await screen.findByRole("dialog", { name: /Run details/i });
  expect(within(dialog).getByText(/Pulled 18 relevant sources/i)).toBeInTheDocument();
  expect(within(dialog).getByText(/Run open web crawl/i)).toBeInTheDocument();
  expect(within(dialog).getByText(/Timeline/i)).toBeInTheDocument();
  expect(within(dialog).getByText(/Execution/i)).toBeInTheDocument();
  expect(within(dialog).getByText(/Activity feed/i)).toBeInTheDocument();
  expect(within(dialog).getByText(/Kickoff briefing delivered/i)).toBeInTheDocument();
});

it("creates a new run template, persists it, and hydrates on reload", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<App />);

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /New template/i }));
  });

  const modal = await screen.findByRole("dialog", { name: /New template/i });
  await act(async () => {
    await user.type(within(modal).getByLabelText(/^Name$/i), "Churn triage playbook");
  });
  await act(async () => {
    await user.type(within(modal).getByLabelText(/^Objective$/i), "Triage churn spikes and ship fixes");
  });
  await act(async () => {
    await user.type(within(modal).getByLabelText(/Agents/i), "Researcher, Coder, Tester");
  });
  await act(async () => {
    await user.type(within(modal).getByLabelText(/Approvals/i), "External HTTP, Repo write");
  });
  await act(async () => {
    await user.clear(within(modal).getByLabelText(/Est\. cost/i));
    await user.type(within(modal).getByLabelText(/Est\. cost/i), "$8-12");
  });
  await act(async () => {
    await user.type(
      within(modal).getByLabelText(/Playbook steps/i),
      "Collect signals\nIdentify drop-off point\nImplement fixes + tests\nExport evidence"
    );
  });

  await act(async () => {
    await user.click(within(modal).getByRole("button", { name: /Save template/i }));
  });

  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: /New template/i })).not.toBeInTheDocument();
  });

  const templatesCard = screen.getByText(/Run templates/i).closest(".card") as HTMLElement | null;
  expect(templatesCard).not.toBeNull();
  const templateGrid = templatesCard!.querySelector<HTMLElement>(".template-grid");
  expect(templateGrid).not.toBeNull();
  expect(within(templateGrid!).getByText(/^Churn triage playbook$/i)).toBeInTheDocument();

  await waitFor(() => {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as {
      templates?: Array<{ name?: string }>;
    };
    expect(stored.templates?.some((tpl) => tpl.name === "Churn triage playbook")).toBe(true);
  });

  unmount();
  render(<App />);
  const templatesCardAfter = screen.getByText(/Run templates/i).closest(".card") as
    | HTMLElement
    | null;
  expect(templatesCardAfter).not.toBeNull();
  const templateGridAfter = templatesCardAfter!.querySelector<HTMLElement>(".template-grid");
  expect(templateGridAfter).not.toBeNull();
  expect(within(templateGridAfter!).getByText(/^Churn triage playbook$/i)).toBeInTheDocument();
});

it("filters runs by status via chips and persists the selection", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<App />);

  const runList = document.querySelector<HTMLElement>(".run-list");
  expect(runList).not.toBeNull();
  expect(runList!.querySelectorAll(".run")).toHaveLength(3);

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /^Running$/i }));
  });

  expect(runList!.querySelectorAll(".run")).toHaveLength(1);
  expect(within(runList!).getByText(/r-114/i)).toBeInTheDocument();

  await waitFor(() => {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as {
      runStatusFilter?: string;
    };
    expect(stored.runStatusFilter).toBe("running");
  });

  unmount();
  render(<App />);
  const runListAfter = document.querySelector<HTMLElement>(".run-list");
  expect(runListAfter).not.toBeNull();
  expect(runListAfter!.querySelectorAll(".run")).toHaveLength(1);
  expect(within(runListAfter!).getByText(/r-114/i)).toBeInTheDocument();
  const storedAfterReload = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as {
    runStatusFilter?: string;
  };
  expect(storedAfterReload.runStatusFilter).toBe("running");
});
