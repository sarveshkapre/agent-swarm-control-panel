import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { agents, approvals, logs, runs } from "./data/mockData";
import type { AgentStatus, Approval, RunStatus } from "./types";

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
  policy: {
    mode: string;
    sandbox: string;
    timeouts: string;
    requireCitations: boolean;
    allowExternal: boolean;
    allowRepoWrites: boolean;
    allowDeploy: boolean;
    piiRedaction: boolean;
    evidenceBundle: boolean;
  };
  spikeAlerts: {
    enabled: boolean;
    windowMinutes: number;
    threshold: number;
  };
  logBudget: {
    warnBudget: number;
    errorBudget: number;
  };
  selectedTemplateId: string;
};

const defaultLogBudget = { warnBudget: 5, errorBudget: 2 };
const defaultSpikeAlerts = { enabled: true, windowMinutes: 15, threshold: 3 };

const defaultPolicy: StoredState["policy"] = {
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
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policy, setPolicy] = useState(() => ({
    ...defaultPolicy,
    ...(initialStoredState?.policy ?? {})
  }));
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
  const importInputRef = useRef<HTMLInputElement>(null);

  const queueRun = useCallback((source?: string) => {
    setBanner(
      source
        ? `Queued a new swarm run from ${source}. Approval required for external tools.`
        : "Queued a new swarm run. Approval required for external tools."
    );
  }, []);

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
    policy,
    spikeAlerts,
    logBudget,
    selectedTemplateId
  ]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
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
        setPolicyOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queueRun]);

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
    if (!runSearch.trim()) return runs;
    const value = runSearch.trim().toLowerCase();
    return runs.filter((run) =>
      [run.objective, run.owner, run.status, run.id].some((field) =>
        field.toLowerCase().includes(value)
      )
    );
  }, [runSearch]);

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

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Agent Swarm</p>
          <h1>Control Panel</h1>
        </div>
        <div className="topbar-actions">
          <button
            className="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            type="button"
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button className="primary" onClick={() => queueRun()} type="button">
            New run
          </button>
        </div>
      </header>

      {banner ? (
        <div className="banner" role="status">
          <span>{banner}</span>
          <button className="ghost" onClick={() => setBanner(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <section className="overview">
        <div className="card summary">
          <h2>Swarm status</h2>
          <div className="summary-grid">
            <div>
              <p className="muted">Active agents</p>
              <strong>3</strong>
            </div>
            <div>
              <p className="muted">Runs in flight</p>
              <strong>2</strong>
            </div>
            <div>
              <p className="muted">Approvals waiting</p>
              <strong>2</strong>
            </div>
            <div>
              <p className="muted">Spend today</p>
              <strong>$32.11</strong>
            </div>
          </div>
        </div>
        <div className="card approvals">
          <div className="card-header">
            <h2>Approval inbox</h2>
            <button
              className="ghost"
              onClick={() => setSelectedApproval(approvals[0] ?? null)}
            >
              View all
            </button>
          </div>
          <ul>
            {approvals.map((approval) => (
              <li key={approval.id} className="approval">
                <button
                  className="approval-button"
                  onClick={() => setSelectedApproval(approval)}
                >
                  <div>
                    <p className="approval-title">{approval.title}</p>
                    <p className="muted">
                      {approval.requestedBy} · {approval.scope}
                    </p>
                  </div>
                  <div className={`pill ${approval.risk}`}>
                    {approval.risk.toUpperCase()} · {approval.requestedAt}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="card-header">
            <h2>Active agents</h2>
            <span className="hint">Press / to search</span>
          </div>
          <div className="search-row">
            <input
              data-search
              value={runSearch}
              onChange={(event) => setRunSearch(event.target.value)}
              placeholder="Search runs, owners, statuses"
              aria-label="Search runs"
            />
            <button className="ghost" type="button">
              Filters
            </button>
          </div>
          <div className="agent-list">
            {agents.map((agent) => (
              <div key={agent.id} className="agent">
                <div>
                  <p className="agent-name">{agent.name}</p>
                  <p className="muted">
                    {agent.role} · {agent.model}
                  </p>
                </div>
                <div>
                  <p className={`status ${agent.status}`}>
                    {statusLabel[agent.status]}
                  </p>
                  <p className="muted">{agent.focus}</p>
                </div>
                <div>
                  <p className="muted">Last active</p>
                  <p>{agent.lastActive}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Runs in progress</h2>
            <button className="ghost" onClick={() => queueRun()} type="button">
              Queue run
            </button>
          </div>
          <div className="run-list">
            {filteredRuns.map((run) => (
              <article key={run.id} className="run">
                <div>
                  <p className="run-title">{run.objective}</p>
                  <p className="muted">
                    {run.id} · {run.owner} · {run.startedAt}
                  </p>
                </div>
                <div className="run-meta">
                  <div>
                    <p className={`status ${run.status}`}>
                      {runStatusLabel[run.status]}
                    </p>
                    <p className="muted">Agents: {run.agents.join(", ")}</p>
                  </div>
                  <div>
                    <p className="muted">Est. cost</p>
                    <p>{run.costEstimate}</p>
                  </div>
                  <div>
                    <p className="muted">Tokens</p>
                    <p>{run.tokens}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="card-header">
            <h2>Live logs</h2>
              <div className="header-actions">
              <button
                className="ghost"
                onClick={() => setStreaming((prev) => !prev)}
                type="button"
              >
                {streaming ? "Pause stream" : "Start stream"}
              </button>
              <button className="ghost" onClick={exportEvidence} type="button">
                Export
              </button>
            </div>
          </div>
          <div className="filters">
            <input
              value={logSearch}
              onChange={(event) => setLogSearch(event.target.value)}
              placeholder="Search logs"
              aria-label="Search logs"
            />
            <select
              value={logLevel}
              onChange={(event) => setLogLevel(event.target.value as LogLevelFilter)}
              aria-label="Filter by level"
            >
              <option value="all">All levels</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
            <select
              value={logAgent}
              onChange={(event) => setLogAgent(event.target.value)}
              aria-label="Filter by agent"
            >
              <option value="all">All agents</option>
              {Array.from(new Set(logs.map((log) => log.agent))).map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>
          <div className="budget-row">
            <div>
              <p className="muted">Warn budget</p>
              <strong>{logBudget.warnBudget} / hr</strong>
            </div>
            <div>
              <p className="muted">Error budget</p>
              <strong>{logBudget.errorBudget} / hr</strong>
            </div>
            <div>
              <p className="muted">Spike alerts</p>
              <strong>
                {spikeAlerts.enabled
                  ? `${spikeAlerts.threshold}+ in ${spikeAlerts.windowMinutes}m`
                  : "Off"}
              </strong>
            </div>
          </div>
          {spikeAlerts.enabled ? (
            <div className="alert-card">
              <p className="muted">Spike alert</p>
              <strong>3 errors in last 12 minutes · Atlas</strong>
              <p className="muted">Triggering auto-paused retries.</p>
            </div>
          ) : null}
          <div className="log-list">
            {filteredLogs.map((log) => (
              <div key={log.id} className={`log ${log.level}`}>
                <div>
                  <p className="log-title">{log.agent}</p>
                  <p className="muted">{log.message}</p>
                </div>
                <div className="log-meta">
                  <button
                    className={`pin ${pinnedLogs.includes(log.id) ? "active" : ""}`}
                    onClick={() => togglePin(log.id)}
                    type="button"
                  >
                    {pinnedLogs.includes(log.id) ? "Pinned" : "Pin"}
                  </button>
                  <span className={`pill ${log.level}`}>{log.level}</span>
                  <span className="muted">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card control">
          <h2>Control surface</h2>
          <p className="muted">
            Guardrails are enforced before any agent can touch external tools,
            files, or deployments.
          </p>
          <div className="control-grid">
            <div>
              <p className="muted">Policy mode</p>
              <strong>{policy.mode}</strong>
            </div>
            <div>
              <p className="muted">Sandbox</p>
              <strong>{policy.sandbox}</strong>
            </div>
            <div>
              <p className="muted">Timeouts</p>
              <strong>{policy.timeouts}</strong>
            </div>
            <div>
              <p className="muted">Export bundle</p>
              <strong>{policy.evidenceBundle ? "Evidence pack ready" : "Disabled"}</strong>
            </div>
          </div>
          <div className="control-actions">
            <button className="primary" onClick={() => setPolicyOpen(true)}>
              Open policy editor
            </button>
            <button className="ghost" onClick={exportState}>
              Export state
            </button>
            <button
              className="ghost"
              onClick={() => importInputRef.current?.click()}
            >
              Import state
            </button>
            <input
              ref={importInputRef}
              className="file-input"
              type="file"
              accept="application/json"
              onChange={(event) => importState(event.target.files?.[0] ?? null)}
            />
          </div>
          <p className="hint">Tip: Press N to queue a run.</p>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="card-header">
            <h2>Approval policy simulation</h2>
            <span className="hint">Preview what auto-approves before enabling it.</span>
          </div>
          <div className="simulation-controls">
            <label className="field">
              <span>Auto-approve up to</span>
              <select
                value={autoApproveRisk}
                onChange={(event) => setAutoApproveRisk(event.target.value as Approval["risk"])}
              >
                <option value="low">Low risk</option>
                <option value="medium">Medium risk</option>
                <option value="high">High risk</option>
              </select>
            </label>
            <div className="pill muted">Mode: {policy.mode}</div>
          </div>
          <div className="simulation-list">
            {autoApprovalPreview.map((approval) => (
              <div key={approval.id} className="simulation-item">
                <div>
                  <p className="approval-title">{approval.title}</p>
                  <p className="muted">{approval.scope}</p>
                </div>
                <div className="simulation-meta">
                  <span className={`pill ${approval.risk}`}>{approval.risk}</span>
                  <span className={`pill ${approval.decision === "Auto-approve" ? "low" : "high"}`}>
                    {approval.decision}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2>Run templates</h2>
            <button className="ghost" onClick={() => setBanner("Saved new playbook draft.")}>New template</button>
          </div>
          <div className="template-grid">
            {templates.map((template) => (
              <button
                key={template.id}
                className={`template-card ${template.id === selectedTemplateId ? "active" : ""}`}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <div>
                  <p className="run-title">{template.name}</p>
                  <p className="muted">{template.objective}</p>
                </div>
                <div className="template-meta">
                  <span className="pill low">{template.agents.join(" · ")}</span>
                  <span className="pill">{template.estCost}</span>
                </div>
              </button>
            ))}
          </div>
          {selectedTemplate ? (
            <div className="template-detail">
              <div>
                <p className="muted">Approvals</p>
                <strong>{selectedTemplate.approvals.join(", ")}</strong>
              </div>
              <div>
                <p className="muted">Playbook</p>
                <ol className="stack">
                  {selectedTemplate.playbook.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
              <button
                className="primary"
                onClick={() => queueRun(`template “${selectedTemplate.name}”`)}
                type="button"
              >
                Queue from template
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {selectedApproval ? (
        <div className="drawer" role="dialog" aria-modal="true">
          <div className="drawer-panel">
            <div className="drawer-header">
              <h2>Approval request</h2>
              <button className="ghost" onClick={() => setSelectedApproval(null)}>
                Close
              </button>
            </div>
            <div className="drawer-body">
              <div>
                <p className="eyebrow">{selectedApproval.id}</p>
                <h3>{selectedApproval.title}</h3>
                <p className="muted">
                  Requested by {selectedApproval.requestedBy} · {selectedApproval.requestedAt}
                </p>
                <div className={`pill ${selectedApproval.risk}`}>
                  {selectedApproval.risk.toUpperCase()} risk
                </div>
              </div>
              <div className="drawer-section">
                <h4>Scope summary</h4>
                <p className="muted">{selectedApproval.scope}</p>
                <div className="diff-list">
                  {approvalDetail?.scopeDiff.map((item) => (
                    <div key={item.label} className={`diff ${item.change}`}>
                      <span>
                        {item.change === "add"
                          ? "+"
                          : item.change === "remove"
                          ? "-"
                          : "~"}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="drawer-section">
                <h4>Risk notes</h4>
                <ul className="stack">
                  {approvalDetail?.riskNotes.map((note) => (
                    <li key={note} className="muted">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="drawer-section">
                <h4>Approval checklist</h4>
                <ul className="stack">
                  {approvalDetail?.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="drawer-actions">
              <button
                className="ghost"
                onClick={() => {
                  setSelectedApproval(null);
                  setBanner(`Denied ${selectedApproval.id}.`);
                }}
                type="button"
              >
                Deny
              </button>
              <button
                className="primary"
                onClick={() => {
                  setSelectedApproval(null);
                  setBanner(`Approved ${selectedApproval.id}.`);
                }}
                type="button"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {policyOpen ? (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-panel">
            <div className="drawer-header">
              <h2>Policy editor</h2>
              <button className="ghost" onClick={() => setPolicyOpen(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label htmlFor="policy-mode">Policy mode</label>
                <select
                  id="policy-mode"
                  value={policy.mode}
                  onChange={(event) =>
                    setPolicy((prev) => ({ ...prev, mode: event.target.value }))
                  }
                >
                  <option value="Approve-by-default">Approve-by-default</option>
                  <option value="Approve-on-risk">Approve-on-risk</option>
                  <option value="Manual-only">Manual-only</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="policy-sandbox">Sandbox</label>
                <select
                  id="policy-sandbox"
                  value={policy.sandbox}
                  onChange={(event) =>
                    setPolicy((prev) => ({
                      ...prev,
                      sandbox: event.target.value
                    }))
                  }
                >
                  <option value="Workspace only">Workspace only</option>
                  <option value="Workspace + network">Workspace + network</option>
                  <option value="Full system">Full system</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="policy-timeouts">Timeouts</label>
                <select
                  id="policy-timeouts"
                  value={policy.timeouts}
                  onChange={(event) =>
                    setPolicy((prev) => ({
                      ...prev,
                      timeouts: event.target.value
                    }))
                  }
                >
                  <option value="30m hard cap">30m hard cap</option>
                  <option value="60m hard cap">60m hard cap</option>
                  <option value="90m hard cap">90m hard cap</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="budget-warn">Warn budget (/hr)</label>
                <input
                  id="budget-warn"
                  type="number"
                  value={logBudget.warnBudget}
                  onChange={(event) =>
                    setLogBudget((prev) => ({
                      ...prev,
                      warnBudget: Number(event.target.value)
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="budget-error">Error budget (/hr)</label>
                <input
                  id="budget-error"
                  type="number"
                  value={logBudget.errorBudget}
                  onChange={(event) =>
                    setLogBudget((prev) => ({
                      ...prev,
                      errorBudget: Number(event.target.value)
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="spike-threshold">Spike threshold (errors)</label>
                <input
                  id="spike-threshold"
                  type="number"
                  value={spikeAlerts.threshold}
                  onChange={(event) =>
                    setSpikeAlerts((prev) => ({
                      ...prev,
                      threshold: Number(event.target.value)
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="spike-window">Spike window (minutes)</label>
                <input
                  id="spike-window"
                  type="number"
                  value={spikeAlerts.windowMinutes}
                  onChange={(event) =>
                    setSpikeAlerts((prev) => ({
                      ...prev,
                      windowMinutes: Number(event.target.value)
                    }))
                  }
                />
              </div>
              <div className="toggle-grid">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={policy.requireCitations}
                    onChange={(event) =>
                      setPolicy((prev) => ({
                        ...prev,
                        requireCitations: event.target.checked
                      }))
                    }
                  />
                  <span>Require citations</span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={policy.allowExternal}
                    onChange={(event) =>
                      setPolicy((prev) => ({
                        ...prev,
                        allowExternal: event.target.checked
                      }))
                    }
                  />
                  <span>Allow external HTTP</span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={policy.allowRepoWrites}
                    onChange={(event) =>
                      setPolicy((prev) => ({
                        ...prev,
                        allowRepoWrites: event.target.checked
                      }))
                    }
                  />
                  <span>Allow repo writes</span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={policy.allowDeploy}
                    onChange={(event) =>
                      setPolicy((prev) => ({
                        ...prev,
                        allowDeploy: event.target.checked
                      }))
                    }
                  />
                  <span>Allow deploys</span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={policy.piiRedaction}
                    onChange={(event) =>
                      setPolicy((prev) => ({
                        ...prev,
                        piiRedaction: event.target.checked
                      }))
                    }
                  />
                  <span>PII redaction</span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={policy.evidenceBundle}
                    onChange={(event) =>
                      setPolicy((prev) => ({
                        ...prev,
                        evidenceBundle: event.target.checked
                      }))
                    }
                  />
                  <span>Evidence bundles</span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={spikeAlerts.enabled}
                    onChange={(event) =>
                      setSpikeAlerts((prev) => ({
                        ...prev,
                        enabled: event.target.checked
                      }))
                    }
                  />
                  <span>Spike alerts enabled</span>
                </label>
              </div>
            </div>
            <div className="drawer-actions">
              <button
                className="ghost"
                onClick={() => {
                  setPolicy(defaultPolicy);
                  setLogBudget({ warnBudget: 5, errorBudget: 2 });
                  setSpikeAlerts({ enabled: true, windowMinutes: 15, threshold: 3 });
                }}
              >
                Reset
              </button>
              <button className="primary" onClick={() => setPolicyOpen(false)}>
                Save policy
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
