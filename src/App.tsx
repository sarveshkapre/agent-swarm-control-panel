import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { agents, approvals, logs, runs } from "./data/mockData";
import type {
  AgentStatus,
  Approval,
  LogBudget,
  PolicySettings,
  Run,
  RunStatus,
  SpikeAlerts
} from "./types";
import ApprovalDrawer from "./components/ApprovalDrawer";
import ApprovalSimulationCard from "./components/ApprovalSimulationCard";
import AgentsRunsSection from "./components/AgentsRunsSection";
import Banner from "./components/Banner";
import ControlSurfaceCard from "./components/ControlSurfaceCard";
import LogsCard from "./components/LogsCard";
import OverviewSection from "./components/OverviewSection";
import PolicyModal from "./components/PolicyModal";
import RunComposerCard from "./components/RunComposerCard";
import RunDetailDrawer from "./components/RunDetailDrawer";
import RunTemplatesCard from "./components/RunTemplatesCard";
import ToastStack from "./components/ToastStack";
import TopBar from "./components/TopBar";

type LogLevelFilter = "all" | "info" | "warn" | "error";

const statusLabel: Record<AgentStatus, string> = {
  idle: "Idle",
  running: "Running",
  paused: "Paused",
  error: "Error"
};

const runStatusLabel: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  waiting: "Waiting",
  failed: "Failed",
  completed: "Completed"
};

const approvalDetails: Record<
  string,
  {
    riskNotes: string[];
    scopeDiff: { label: string; change: "add" | "remove" | "update" }[];
    checklist: string[];
  }
> = {
  "ap-71": {
    riskNotes: [
      "External HTTP access requested with a 50-domain allowlist.",
      "Crawler is read-only; no POSTs or uploads allowed."
    ],
    scopeDiff: [
      { label: "Allow: https://vendor-sites/*", change: "add" },
      { label: "Allow: https://docs.example.com/*", change: "add" },
      { label: "Block: cloud consoles", change: "update" }
    ],
    checklist: ["Rate limit to 2 req/s", "No cookies", "Save evidence pack"]
  },
  "ap-70": {
    riskNotes: [
      "Write access to staging repo requested.",
      "Requires branch protection and audit trail."
    ],
    scopeDiff: [
      { label: "Repo: swarm-ui", change: "add" },
      { label: "Branch: swarm/onboarding", change: "add" },
      { label: "Force push", change: "remove" }
    ],
    checklist: ["Require PR", "Run CI", "Attach test evidence"]
  }
};

const storageKey = "swarm-control-panel-state";

type StoredState = {
  theme: "dark" | "light";
  runSearch: string;
  logSearch: string;
  logLevel: LogLevelFilter;
  logAgent: string;
  pinnedLogs: string[];
  queuedRuns: Run[];
  runOverrides: Record<string, RunStatus>;
  policy: PolicySettings;
  spikeAlerts: SpikeAlerts;
  logBudget: LogBudget;
  selectedTemplateId: string;
};

type ConfirmationToast = {
  id: string;
  message: string;
  confirmLabel: string;
  runId: string;
  nextStatus: RunStatus;
};

const defaultLogBudget: LogBudget = { warnBudget: 5, errorBudget: 2 };
const defaultSpikeAlerts: SpikeAlerts = { enabled: true, windowMinutes: 15, threshold: 3 };

const defaultPolicy: PolicySettings = {
  mode: "Approve-by-default",
  sandbox: "Workspace only",
  timeouts: "30m hard cap",
  requireCitations: true,
  allowExternal: false,
  allowRepoWrites: false,
  allowDeploy: false,
  piiRedaction: true,
  evidenceBundle: true
};

const defaultTemplates = [
  {
    id: "tpl-onboarding",
    name: "Onboarding launch",
    objective: "Ship onboarding flow with experiments",
    agents: ["Researcher", "Coder", "Tester"],
    approvals: ["Repo write", "External HTTP"],
    estCost: "$18-24",
    playbook: [
      "Kickoff checklist + requirements",
      "Implement UI + tests",
      "QA validation + evidence pack"
    ]
  },
  {
    id: "tpl-breach-report",
    name: "Weekly threat brief",
    objective: "Collect threats and publish report",
    agents: ["Researcher", "Writer"],
    approvals: ["External HTTP"],
    estCost: "$6-9",
    playbook: [
      "Curate sources",
      "Draft brief",
      "Fact check + citations"
    ]
  },
  {
    id: "tpl-regression",
    name: "Regression + evidence",
    objective: "Run regression suite and export pack",
    agents: ["Tester"],
    approvals: ["Repo read"],
    estCost: "$3-5",
    playbook: ["Run tests", "Capture logs", "Export evidence"]
  }
];

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    if (!storage) return null;
    if (typeof storage.getItem !== "function") return null;
    if (typeof storage.setItem !== "function") return null;
    if (typeof storage.removeItem !== "function") return null;
    return storage;
  } catch {
    return null;
  }
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readStoredState(): Partial<StoredState> | null {
  const raw = getStorage()?.getItem(storageKey);
  if (!raw) return null;
  const parsed = safeJsonParse<Partial<StoredState>>(raw);
  if (!parsed || typeof parsed !== "object") return null;
  return parsed;
}

function isTypingTarget(target: EventTarget | null) {
  if (!target) return false;
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (target.isContentEditable) return true;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function getFocusableElements(container: HTMLElement) {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex >= 0
  );
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function App() {
  const [initialStoredState] = useState<Partial<StoredState> | null>(() =>
    readStoredState()
  );

  const [runSearch, setRunSearch] = useState(() => initialStoredState?.runSearch ?? "");
  const [logSearch, setLogSearch] = useState(() => initialStoredState?.logSearch ?? "");
  const [logLevel, setLogLevel] = useState<LogLevelFilter>(() => {
    const value = initialStoredState?.logLevel;
    return value === "info" || value === "warn" || value === "error" || value === "all"
      ? value
      : "all";
  });
  const [logAgent, setLogAgent] = useState(() => initialStoredState?.logAgent ?? "all");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const value = initialStoredState?.theme;
    return value === "light" || value === "dark" ? value : "dark";
  });
  const [banner, setBanner] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(
    null
  );
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policy, setPolicy] = useState<PolicySettings>(() => ({
    ...defaultPolicy,
    ...(initialStoredState?.policy ?? {})
  }));
  const [queuedRuns, setQueuedRuns] = useState<Run[]>(
    () => initialStoredState?.queuedRuns ?? []
  );
  const [runOverrides, setRunOverrides] = useState<Record<string, RunStatus>>(
    () => initialStoredState?.runOverrides ?? {}
  );
  const [pinnedLogs, setPinnedLogs] = useState<string[]>(
    () => initialStoredState?.pinnedLogs ?? []
  );
  const [streaming, setStreaming] = useState(false);
  const streamIntervalRef = useRef<number | null>(null);
  const [logBudget, setLogBudget] = useState(
    () => initialStoredState?.logBudget ?? defaultLogBudget
  );
  const [spikeAlerts, setSpikeAlerts] = useState(
    () => initialStoredState?.spikeAlerts ?? defaultSpikeAlerts
  );
  const [templates] = useState(defaultTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    return initialStoredState?.selectedTemplateId ?? (defaultTemplates[0]?.id ?? "");
  });
  const [autoApproveRisk, setAutoApproveRisk] = useState<Approval["risk"]>("medium");
  const [composerObjective, setComposerObjective] = useState("");
  const [composerOwner, setComposerOwner] = useState("Ops");
  const [composerTemplateId, setComposerTemplateId] = useState("none");
  const importInputRef = useRef<HTMLInputElement>(null);
  const [confirmationToasts, setConfirmationToasts] = useState<ConfirmationToast[]>([]);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const modalPanelRef = useRef<HTMLDivElement>(null);
  const runDetailPanelRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const queueRun = useCallback((source?: string) => {
    setBanner(
      source
        ? `Queued a new swarm run from ${source}. Approval required for external tools.`
        : "Queued a new swarm run. Approval required for external tools."
    );
  }, []);

  const overlayOpen = selectedApproval !== null || selectedRun !== null || policyOpen;
  const activePanelRef = selectedApproval
    ? drawerPanelRef
    : selectedRun
      ? runDetailPanelRef
      : modalPanelRef;

  const runData = useMemo(() => {
    const baseRuns = queuedRuns.length === 0 ? runs : [...queuedRuns, ...runs];
    if (Object.keys(runOverrides).length === 0) return baseRuns;
    return baseRuns.map((run) => {
      const override = runOverrides[run.id];
      return override ? { ...run, status: override } : run;
    });
  }, [queuedRuns, runOverrides]);

  useEffect(() => {
    if (overlayOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      lastActiveElementRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      const panel = activePanelRef.current;
      if (!panel) {
        document.body.style.overflow = previousOverflow;
        return;
      }

      window.setTimeout(() => {
        const focusables = getFocusableElements(panel);
        const next = focusables[0];
        if (next) {
          next.focus();
          return;
        }
        panel.focus();
      }, 0);
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    const last = lastActiveElementRef.current;
    if (!last) return;
    if (!document.contains(last)) return;
    window.setTimeout(() => last.focus(), 0);
  }, [overlayOpen, selectedApproval, selectedRun, activePanelRef]);

  useEffect(() => {
    if (!overlayOpen) return;
    const panel = activePanelRef.current;
    if (!panel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusables = getFocusableElements(panel);
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !(active instanceof HTMLElement) || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlayOpen, selectedApproval, selectedRun, activePanelRef]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const storage = getStorage();
    if (!storage || typeof storage.setItem !== "function") return;
    const state: StoredState = {
      theme,
      runSearch,
      logSearch,
      logLevel,
      logAgent,
      pinnedLogs,
      queuedRuns,
      runOverrides,
      policy,
      spikeAlerts,
      logBudget,
      selectedTemplateId
    };
    storage.setItem(storageKey, JSON.stringify(state));
  }, [
    theme,
    runSearch,
    logSearch,
    logLevel,
    logAgent,
    pinnedLogs,
    queuedRuns,
    runOverrides,
    policy,
    spikeAlerts,
    logBudget,
    selectedTemplateId
  ]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (overlayOpen) {
        if (event.key === "Escape") {
          setSelectedApproval(null);
          setSelectedRun(null);
          setPolicyOpen(false);
        }
        return;
      }
      if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        const input = document.querySelector<HTMLInputElement>("[data-search]");
        input?.focus();
      }
      if (event.key.toLowerCase() === "n" && !isTypingTarget(event.target)) {
        event.preventDefault();
        queueRun();
      }
      if (event.key === "Escape") {
        setSelectedApproval(null);
        setSelectedRun(null);
        setPolicyOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen, queueRun]);

  useEffect(() => {
    if (!streaming) {
      const existing = streamIntervalRef.current;
      if (existing !== null) window.clearInterval(existing);
      streamIntervalRef.current = null;
      return;
    }
    const handle = window.setInterval(() => {
      setBanner("Streaming logs: pulling the latest agent output.");
    }, 5000);
    streamIntervalRef.current = handle;
    return () => {
      window.clearInterval(handle);
      if (streamIntervalRef.current === handle) streamIntervalRef.current = null;
    };
  }, [streaming]);

  const filteredRuns = useMemo(() => {
    if (!runSearch.trim()) return runData;
    const value = runSearch.trim().toLowerCase();
    return runData.filter((run) =>
      [run.objective, run.owner, run.status, run.id].some((field) =>
        field.toLowerCase().includes(value)
      )
    );
  }, [runSearch, runData]);

  const filteredLogs = useMemo(() => {
    const value = logSearch.trim().toLowerCase();
    return logs.filter((log) => {
      if (logLevel !== "all" && log.level !== logLevel) return false;
      if (logAgent !== "all" && log.agent !== logAgent) return false;
      if (!value) return true;
      return [log.agent, log.level, log.message].some((field) =>
        field.toLowerCase().includes(value)
      );
    });
  }, [logSearch, logLevel, logAgent]);

  const togglePin = (id: string) => {
    setPinnedLogs((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const exportEvidence = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      policy,
      agents,
      runs,
      approvals,
      logs
    };
    downloadJson("agent-swarm-evidence-pack.json", payload);
  };

  const exportState = () => {
    const payload: StoredState = {
      theme,
      runSearch,
      logSearch,
      logLevel,
      logAgent,
      pinnedLogs,
      queuedRuns,
      runOverrides,
      policy,
      spikeAlerts,
      logBudget,
      selectedTemplateId
    };
    downloadJson("agent-swarm-state.json", payload);
  };

  const importState = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = safeJsonParse<Partial<StoredState>>(String(reader.result));
      if (!parsed) {
        setBanner("Import failed. Invalid JSON file.");
        return;
      }

      const nextTheme =
        parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "dark";
      const nextLogLevel =
        parsed.logLevel === "info" ||
        parsed.logLevel === "warn" ||
        parsed.logLevel === "error" ||
        parsed.logLevel === "all"
          ? parsed.logLevel
          : "all";

      setTheme(nextTheme);
      setRunSearch(parsed.runSearch ?? "");
      setLogSearch(parsed.logSearch ?? "");
      setLogLevel(nextLogLevel);
      setLogAgent(parsed.logAgent ?? "all");
      setPinnedLogs(parsed.pinnedLogs ?? []);
      setQueuedRuns(parsed.queuedRuns ?? []);
      setRunOverrides(parsed.runOverrides ?? {});
      setPolicy({ ...defaultPolicy, ...(parsed.policy ?? {}) });
      setSpikeAlerts(parsed.spikeAlerts ?? defaultSpikeAlerts);
      setLogBudget(parsed.logBudget ?? defaultLogBudget);
      setSelectedTemplateId(parsed.selectedTemplateId ?? (defaultTemplates[0]?.id ?? ""));
      setBanner("Imported workspace state.");
      if (importInputRef.current) importInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const approvalDetail = selectedApproval
    ? approvalDetails[selectedApproval.id]
    : null;

  const riskRank = (risk: Approval["risk"]) => {
    if (risk === "low") return 0;
    if (risk === "medium") return 1;
    return 2;
  };

  const autoApproveRank = autoApproveRisk === "low" ? 0 : autoApproveRisk === "medium" ? 1 : 2;

  const autoApprovalPreview = approvals.map((approval) => ({
    ...approval,
    decision: riskRank(approval.risk) <= autoApproveRank ? "Auto-approve" : "Manual review"
  }));

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const composerTemplate =
    composerTemplateId === "none"
      ? null
      : templates.find((template) => template.id === composerTemplateId) ?? null;
  const runDetailLogs = selectedRun
    ? logs.filter((log) => selectedRun.agents.includes(log.agent)).slice(0, 3)
    : [];
  const runDetailApprovals = selectedRun
    ? approvals.filter((approval) => selectedRun.agents.includes(approval.requestedBy))
    : [];

  const submitComposer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedObjective = composerObjective.trim();
    if (!trimmedObjective) {
      setBanner("Add a run objective before queuing.");
      return;
    }

    const nextRun: Run = {
      id: `r-${Date.now()}`,
      objective: trimmedObjective,
      owner: composerOwner,
      startedAt: "Just now",
      status: "queued",
      agents: composerTemplate?.agents ?? ["TBD"],
      costEstimate: composerTemplate?.estCost ?? "—",
      tokens: "—"
    };

    setQueuedRuns((prev) => [nextRun, ...prev]);
    setComposerObjective("");
    setComposerTemplateId("none");
    setBanner(
      composerTemplate
        ? `Queued run from ${composerTemplate.name}.`
        : `Queued run: ${trimmedObjective}.`
    );
  };

  const handleRunAction = (run: Run, action: "pause" | "retry" | "cancel") => {
    const config = {
      pause: {
        message: `Pause ${run.id}?`,
        confirmLabel: "Pause run",
        nextStatus: "waiting" as const
      },
      retry: {
        message: `Retry ${run.id}?`,
        confirmLabel: "Retry run",
        nextStatus: "running" as const
      },
      cancel: {
        message: `Cancel ${run.id}?`,
        confirmLabel: "Cancel run",
        nextStatus: "failed" as const
      }
    }[action];

    const toast: ConfirmationToast = {
      id: `${run.id}-${action}-${Date.now()}`,
      message: config.message,
      confirmLabel: config.confirmLabel,
      runId: run.id,
      nextStatus: config.nextStatus
    };
    setConfirmationToasts((prev) => [toast, ...prev].slice(0, 3));
  };

  const confirmToast = (id: string) => {
    setConfirmationToasts((prev) => {
      const toast = prev.find((item) => item.id === id);
      if (!toast) return prev;
      const updater = (current: Run[]) =>
        current.map((run) =>
          run.id === toast.runId ? { ...run, status: toast.nextStatus } : run
        );
      setQueuedRuns((current) => updater(current));
      setRunOverrides((current) => ({
        ...current,
        [toast.runId]: toast.nextStatus
      }));
      setBanner(`Updated ${toast.runId} to ${toast.nextStatus}.`);
      return prev.filter((item) => item.id !== id);
    });
  };

  const dismissToast = (id: string) => {
    setConfirmationToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const logAgents = useMemo(
    () => Array.from(new Set(logs.map((log) => log.agent))),
    []
  );

  return (
    <div className="app">
      <TopBar
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        onNewRun={() => queueRun()}
      />

      {banner ? <Banner message={banner} onDismiss={() => setBanner(null)} /> : null}

      <OverviewSection
        approvals={approvals}
        onViewAll={() => setSelectedApproval(approvals[0] ?? null)}
        onSelectApproval={(approval) => setSelectedApproval(approval)}
      />

      <AgentsRunsSection
        agents={agents}
        statusLabel={statusLabel}
        runSearch={runSearch}
        onRunSearchChange={setRunSearch}
        filteredRuns={filteredRuns}
        runStatusLabel={runStatusLabel}
        onQueueRun={() => queueRun()}
        onRunAction={handleRunAction}
        onViewDetails={setSelectedRun}
      />

      <section className="grid">
        <LogsCard
          logSearch={logSearch}
          onLogSearchChange={setLogSearch}
          logLevel={logLevel}
          onLogLevelChange={(value) => setLogLevel(value as LogLevelFilter)}
          logAgent={logAgent}
          onLogAgentChange={setLogAgent}
          logAgents={logAgents}
          logBudget={logBudget}
          spikeAlerts={spikeAlerts}
          filteredLogs={filteredLogs}
          pinnedLogs={pinnedLogs}
          onTogglePin={togglePin}
          streaming={streaming}
          onToggleStreaming={() => setStreaming((prev) => !prev)}
          onExportEvidence={exportEvidence}
        />
        <ControlSurfaceCard
          policy={policy}
          onOpenPolicy={() => setPolicyOpen(true)}
          onExportState={exportState}
          onImportClick={() => importInputRef.current?.click()}
          onImportFile={importState}
          importInputRef={importInputRef}
        />
      </section>

      <section className="grid">
        <ApprovalSimulationCard
          autoApproveRisk={autoApproveRisk}
          onAutoApproveRiskChange={setAutoApproveRisk}
          policyMode={policy.mode}
          autoApprovalPreview={autoApprovalPreview}
        />
        <RunComposerCard
          objective={composerObjective}
          owner={composerOwner}
          templateId={composerTemplateId}
          templates={templates}
          onObjectiveChange={setComposerObjective}
          onOwnerChange={setComposerOwner}
          onTemplateChange={setComposerTemplateId}
          onSubmit={submitComposer}
          onReset={() => {
            setComposerObjective("");
            setComposerOwner("Ops");
            setComposerTemplateId("none");
          }}
        />
        <RunTemplatesCard
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={setSelectedTemplateId}
          selectedTemplate={selectedTemplate}
          onQueueTemplate={(template) => queueRun(`template “${template.name}”`)}
          onNewTemplate={() => setBanner("Saved new playbook draft.")}
        />
      </section>

      {selectedApproval ? (
        <ApprovalDrawer
          approval={selectedApproval}
          approvalDetail={approvalDetail ?? null}
          onClose={() => setSelectedApproval(null)}
          onDeny={() => {
            setSelectedApproval(null);
            setBanner(`Denied ${selectedApproval.id}.`);
          }}
          onApprove={() => {
            setSelectedApproval(null);
            setBanner(`Approved ${selectedApproval.id}.`);
          }}
          panelRef={drawerPanelRef}
        />
      ) : null}

      {selectedRun ? (
        <RunDetailDrawer
          run={selectedRun}
          logs={runDetailLogs}
          approvals={runDetailApprovals}
          onClose={() => setSelectedRun(null)}
          panelRef={runDetailPanelRef}
        />
      ) : null}

      {policyOpen ? (
        <PolicyModal
          policy={policy}
          setPolicy={setPolicy}
          logBudget={logBudget}
          setLogBudget={setLogBudget}
          spikeAlerts={spikeAlerts}
          setSpikeAlerts={setSpikeAlerts}
          defaultPolicy={defaultPolicy}
          defaultLogBudget={defaultLogBudget}
          defaultSpikeAlerts={defaultSpikeAlerts}
          onClose={() => setPolicyOpen(false)}
          panelRef={modalPanelRef}
        />
      ) : null}

      <ToastStack
        toasts={confirmationToasts}
        onConfirm={confirmToast}
        onDismiss={dismissToast}
      />
    </div>
  );
}
