import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import App from "./App";

const storageKey = "swarm-control-panel-state";

beforeEach(() => {
  if (typeof window.localStorage.removeItem === "function") {
    window.localStorage.removeItem(storageKey);
  }
  window.history.pushState({}, "", "/");
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
  const copyLinkButton = within(drawer).getByRole("button", { name: /Copy link/i });
  const closeButton = within(drawer).getByRole("button", { name: /Close/i });
  closeButton.focus();

  await user.tab();
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Deny/i })).toHaveFocus();
  });

  copyLinkButton.focus();
  await user.tab({ shift: true });
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Approve/i })).toHaveFocus();
  });

  const overlayClose = screen.getByRole("button", { name: /Close approval drawer/i });
  fireEvent.click(overlayClose);
  await waitFor(() => expect(viewAll).toHaveFocus());
});

it("hydrates the run drawer from a shareable URL parameter", async () => {
  window.history.pushState({}, "", "/?runId=r-113");
  render(<App />);

  const drawer = await screen.findByRole("dialog", { name: /Run details/i });
  expect(within(drawer).getByText(/r-113/i)).toBeInTheDocument();
});

it("hydrates the approval drawer from a shareable URL parameter", async () => {
  window.history.pushState({}, "", "/?approvalId=ap-70");
  render(<App />);

  const drawer = await screen.findByRole("dialog", { name: /Approval request/i });
  expect(within(drawer).getByText(/ap-70/i)).toBeInTheDocument();
});

it("updates the URL when opening run and approval drawers", async () => {
  render(<App />);
  const user = userEvent.setup();

  const runCard = screen.getByText(/Launch onboarding flow/i).closest("article") as HTMLElement | null;
  expect(runCard).not.toBeNull();
  await act(async () => {
    await user.click(within(runCard!).getByRole("button", { name: /Details/i }));
  });
  await waitFor(() => {
    expect(window.location.search).toContain("runId=r-114");
  });

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /View all/i }));
  });
  await waitFor(() => {
    expect(window.location.search).toContain("approvalId=ap-71");
  });
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

it("pauses queueing via the emergency stop policy and blocks shortcut queue actions", async () => {
  render(<App />);

  const user = userEvent.setup();
  const openPolicy = screen.getByRole("button", { name: /Open policy editor/i });
  fireEvent.click(openPolicy);

  const modal = await screen.findByRole("dialog", { name: /Policy editor/i });
  const emergencyStopToggle = within(modal).getByLabelText(/Emergency stop/i);
  await act(async () => {
    await user.click(emergencyStopToggle);
  });
  expect(emergencyStopToggle).toBeChecked();

  await act(async () => {
    await user.click(within(modal).getByRole("button", { name: /Save policy/i }));
  });

  const newRun = screen.getByRole("button", { name: /^New run$/i });
  expect(newRun).toBeDisabled();
  expect(screen.getByText(/Emergency stop/i)).toBeInTheDocument();

  const runList = document.querySelector<HTMLElement>(".run-list");
  expect(runList).not.toBeNull();
  const beforeCount = within(runList!).getAllByRole("article").length;

  fireEvent.keyDown(window, { key: "n" });
  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent(/Queueing is paused/i);
  });

  const afterCount = within(runList!).getAllByRole("article").length;
  expect(afterCount).toBe(beforeCount);
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

it("saves run annotations with tags and filters runs by selected tag", async () => {
  render(<App />);

  const user = userEvent.setup();
  const runList = document.querySelector<HTMLElement>(".run-list");
  expect(runList).not.toBeNull();

  const targetRun = within(runList!).getByText(/r-113/i).closest(".run") as HTMLElement | null;
  expect(targetRun).not.toBeNull();

  await act(async () => {
    await user.click(within(targetRun!).getByRole("button", { name: /Details/i }));
  });

  const dialog = await screen.findByRole("dialog", { name: /Run details/i });
  await act(async () => {
    await user.type(
      within(dialog).getByLabelText(/^Note$/i),
      "Approval has been pending for too long, escalate to owner."
    );
  });
  await act(async () => {
    await user.type(within(dialog).getByLabelText(/Tags/i), "blocked, escalation");
  });
  await act(async () => {
    await user.click(within(dialog).getByRole("button", { name: /Save note/i }));
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent(/Saved note for r-113/i);
  });

  await act(async () => {
    await user.click(within(dialog).getByRole("button", { name: /^Close$/i }));
  });

  await act(async () => {
    await user.selectOptions(screen.getByLabelText(/Filter by run tag/i), "blocked");
  });

  expect(within(runList!).getAllByRole("article")).toHaveLength(1);
  expect(within(runList!).getByText(/r-113/i)).toBeInTheDocument();
  expect(within(runList!).getByText(/^#blocked$/i)).toBeInTheDocument();
});

it("copies a run handoff bundle from run details", async () => {
  try {
    Object.defineProperty(window.navigator, "clipboard", {
      value: undefined,
      configurable: true
    });
  } catch {
    // Some environments expose a non-configurable clipboard; banner assertions below are still valid.
  }
  if (!document.execCommand) {
    Object.defineProperty(document, "execCommand", { value: () => true, configurable: true });
  }
  vi.spyOn(document, "execCommand").mockImplementation(() => true);

  render(<App />);
  const user = userEvent.setup();
  const runList = document.querySelector<HTMLElement>(".run-list");
  expect(runList).not.toBeNull();

  const targetRun = within(runList!).getByText(/r-114/i).closest(".run") as HTMLElement | null;
  expect(targetRun).not.toBeNull();
  await act(async () => {
    await user.click(within(targetRun!).getByRole("button", { name: /Details/i }));
  });

  const dialog = await screen.findByRole("dialog", { name: /Run details/i });
  await act(async () => {
    await user.click(within(dialog).getByRole("button", { name: /Copy handoff/i }));
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent(/Copied handoff bundle for r-114/i);
  });
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

it("shows agent workload heatmap and SLA alerts", () => {
  render(<App />);

  const workloadCard = screen.getByText(/Agent workload/i).closest(".card") as
    | HTMLElement
    | null;
  expect(workloadCard).not.toBeNull();

  const table = within(workloadCard!).getByRole("table", { name: /Agent workload/i });
  expect(within(table).getByText(/Atlas/i)).toBeInTheDocument();
  expect(within(table).getByText(/Horizon/i)).toBeInTheDocument();
  expect(within(table).getByText(/Queued/i)).toBeInTheDocument();
  expect(within(table).getByText(/Waiting/i)).toBeInTheDocument();

  const alerts = within(workloadCard!).getByText(/SLA alerts/i).closest(".workload-alerts");
  expect(alerts).not.toBeNull();
  expect(within(alerts as HTMLElement).getByText(/Atlas/i)).toBeInTheDocument();
});

it("copies escalation drafts from the run health summary card", async () => {
  try {
    Object.defineProperty(window.navigator, "clipboard", {
      value: undefined,
      configurable: true
    });
  } catch {
    // Some environments expose a non-configurable clipboard; banner assertions below are still valid.
  }
  if (!document.execCommand) {
    Object.defineProperty(document, "execCommand", { value: () => true, configurable: true });
  }
  vi.spyOn(document, "execCommand").mockImplementation(() => true);

  render(<App />);
  const user = userEvent.setup();

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /Copy incident draft/i }));
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent(/Copied incident draft/i);
  });

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /Copy owner ping/i }));
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent(/Copied owner ping/i);
  });
});

it("persists integration sync health when connecting and hydrates on reload", async () => {
  const { unmount } = render(<App />);

  const user = userEvent.setup();
  const linear = screen.getByText("Linear").closest("li");
  expect(linear).not.toBeNull();

  await act(async () => {
    await user.click(within(linear as HTMLElement).getByRole("button", { name: /^Connect$/i }));
  });

  await waitFor(() => {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as {
      integrationOptions?: { id: string; status: string; sync?: { lastSyncAtIso?: string | null } }[];
    };
    const match = stored.integrationOptions?.find((item) => item.id === "int-2");
    expect(match?.status).toBe("connected");
    expect(match?.sync?.lastSyncAtIso).toEqual(expect.any(String));
  });

  unmount();
  render(<App />);

  const linearReloaded = screen.getByText("Linear").closest("li");
  expect(linearReloaded).not.toBeNull();
  expect(within(linearReloaded as HTMLElement).getByRole("button", { name: /Connected/i })).toBeDisabled();
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

it("opens the evidence export viewer with schema metadata preview", async () => {
  render(<App />);
  const user = userEvent.setup();

  await act(async () => {
    await user.click(screen.getByRole("button", { name: /View export/i }));
  });

  const modal = await screen.findByRole("dialog", { name: /Evidence export/i });
  await waitFor(() => {
    expect(within(modal).getByText("Schema")).toBeInTheDocument();
    expect(within(modal).getByRole("button", { name: /Copy JSON/i })).toBeInTheDocument();
  });
  expect(within(modal).getByRole("button", { name: /Download JSON/i })).toBeInTheDocument();
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

  const controlCard = screen.getByText(/Control surface/i).closest(".card");
  expect(controlCard).not.toBeNull();
  const fileInput = controlCard!.querySelector<HTMLInputElement>("input[type='file']");
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
  expect(within(dialog).getByText(/Trace waterfall/i)).toBeInTheDocument();
  expect(within(dialog).getByText(/Implement: UI slice/i)).toBeInTheDocument();
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

it("exports and imports template library JSON separately from workspace state", async () => {
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
    await user.click(screen.getByRole("button", { name: /Export JSON/i }));
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
    templateSchemaVersion: number;
    templates: Array<{ id: string; name: string }>;
  };

  expect(payload.templateSchemaVersion).toBe(1);
  expect(payload.templates.length).toBeGreaterThan(0);

  const templatesCard = screen.getByText(/Run templates/i).closest(".card") as
    | HTMLElement
    | null;
  expect(templatesCard).not.toBeNull();
  const fileInput = templatesCard!.querySelector<HTMLInputElement>("input[type='file']");
  expect(fileInput).not.toBeNull();

  const importPayload = {
    templateSchemaVersion: 1,
    exportedAt: "2026-02-11T00:00:00.000Z",
    templates: [
      {
        id: "tpl-import-incident",
        name: "Incident rapid triage",
        objective: "Triage active incident and produce owner-ready update",
        agents: ["Researcher", "Tester"],
        approvals: ["External HTTP"],
        estCost: "$4-6",
        playbook: ["Capture incident context", "Validate impact", "Publish owner update"]
      }
    ]
  };

  const file = new File([JSON.stringify(importPayload)], "templates.json", {
    type: "application/json"
  });

  await act(async () => {
    fireEvent.change(fileInput!, { target: { files: [file] } });
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent(/Imported 1 templates/i);
  });
  expect(within(templatesCard!).getByText(/^Incident rapid triage$/i)).toBeInTheDocument();

  createObjectURLSpy.mockRestore();
  revokeObjectURLSpy.mockRestore();
  anchorClickSpy.mockRestore();
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
