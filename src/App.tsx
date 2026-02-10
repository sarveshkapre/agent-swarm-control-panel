import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  activationLoops as defaultActivationLoops,
  agents,
  approvals,
  feedbackSignals as defaultFeedbackSignals,
  integrationOptions as defaultIntegrationOptions,
  logs,
  runs,
  valueMetrics
} from "./data/mockData";
import type {
  AgentStatus,
  Approval,
  LogLevelFilter,
  LogBudget,
  IntegrationOption,
  PolicySettings,
  Run,
  RunActivity,
  RunHealthSummary,
  RunPhase,
  RunTraceSpan,
  RunStatus,
  RunStatusFilter,
  RunTemplate,
  StoredState,
  SpikeAlerts
} from "./types";
import ApprovalDrawer from "./components/ApprovalDrawer";
import ApprovalSimulationCard from "./components/ApprovalSimulationCard";
import AgentsRunsSection from "./components/AgentsRunsSection";
import ActivationLoopsCard from "./components/ActivationLoopsCard";
import AgentWorkloadCard from "./components/AgentWorkloadCard";
import Banner from "./components/Banner";
import ControlSurfaceCard from "./components/ControlSurfaceCard";
import FeedbackPulseCard from "./components/FeedbackPulseCard";
import EvidenceExportViewerModal from "./components/EvidenceExportViewerModal";
import EvidenceVerifyModal, {
  type EvidenceVerifySummary
} from "./components/EvidenceVerifyModal";
import IntegrationHubCard from "./components/IntegrationHubCard";
import LogsCard from "./components/LogsCard";
import OverviewSection from "./components/OverviewSection";
import OutcomeScorecard from "./components/OutcomeScorecard";
import PolicyModal from "./components/PolicyModal";
import RunComposerCard from "./components/RunComposerCard";
import RunDetailDrawer from "./components/RunDetailDrawer";
import RunHealthCard from "./components/RunHealthCard";
import RunTemplatesCard from "./components/RunTemplatesCard";
import TemplateModal, { type TemplateDraft } from "./components/TemplateModal";
import ToastStack from "./components/ToastStack";
import TopBar from "./components/TopBar";
import {
  buildEvidenceExportPayload,
  type EvidenceExportPayload,
  verifyEvidenceExportPayload
} from "./utils/evidence";
import { copyToClipboard } from "./utils/clipboard";
import {
  formatRunDurationLabel,
  getRunDurationMinutes,
  getRunSlaBadge
} from "./utils/runInsights";

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
  pauseNewRuns: false,
  requireCitations: true,
  allowExternal: false,
  allowRepoWrites: false,
  allowDeploy: false,
  piiRedaction: true,
  evidenceBundle: true
};

const defaultTemplates: RunTemplate[] = [
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

const defaultQuickRunObjective = "Ad hoc control-plane sync";
const defaultQuickRunAgents = ["Atlas", "Nova"];
const defaultQuickRunCostEstimate = "$5.00";

function parseCostEstimate(value: string) {
  const matches = value.replace(/,/g, "").match(/\d+(\.\d+)?/g);
  if (!matches || matches.length === 0) return null;
  const numbers = matches.map((item) => Number.parseFloat(item)).filter(Number.isFinite);
  if (numbers.length === 0) return null;
  const total = numbers.reduce((sum, current) => sum + current, 0);
  return total / numbers.length;
}

const runStatuses: RunStatus[] = ["queued", "running", "waiting", "failed", "completed"];
const logLevels: LogLevelFilter[] = ["all", "info", "warn", "error"];

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRunStatus(value: unknown): value is RunStatus {
  return typeof value === "string" && runStatuses.includes(value as RunStatus);
}

function isRunStatusFilter(value: unknown): value is RunStatusFilter {
  return value === "all" || isRunStatus(value);
}

function isLogLevelFilter(value: unknown): value is LogLevelFilter {
  return typeof value === "string" && logLevels.includes(value as LogLevelFilter);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function sanitizeRun(value: unknown): Run | null {
  if (!isObjectRecord(value)) return null;
  const run: Run = {
    id: typeof value.id === "string" ? value.id : "",
    objective: typeof value.objective === "string" ? value.objective : "",
    owner: typeof value.owner === "string" ? value.owner : "",
    startedAt: typeof value.startedAt === "string" ? value.startedAt : "",
    status: isRunStatus(value.status) ? value.status : "queued",
    agents: isStringArray(value.agents) ? value.agents : [],
    costEstimate: typeof value.costEstimate === "string" ? value.costEstimate : "$0.00",
    tokens: typeof value.tokens === "string" ? value.tokens : "—"
  };
  if (!run.id || !run.objective || !run.owner || !run.startedAt) return null;
  if (isIsoTimestamp(value.createdAtIso)) run.createdAtIso = value.createdAtIso;
  return run;
}

function sanitizeRunList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((run) => sanitizeRun(run))
    .filter((run): run is Run => run !== null);
}

function sanitizeRunOverrides(value: unknown) {
  if (!isObjectRecord(value)) return {};
  return Object.entries(value).reduce<Record<string, RunStatus>>((acc, [id, status]) => {
    if (isRunStatus(status)) {
      acc[id] = status;
    }
    return acc;
  }, {});
}

function sanitizeRunTemplate(value: unknown): RunTemplate | null {
  if (!isObjectRecord(value)) return null;
  const template: RunTemplate = {
    id: typeof value.id === "string" ? value.id : "",
    name: typeof value.name === "string" ? value.name : "",
    objective: typeof value.objective === "string" ? value.objective : "",
    agents: isStringArray(value.agents) ? value.agents : [],
    approvals: isStringArray(value.approvals) ? value.approvals : [],
    estCost: typeof value.estCost === "string" ? value.estCost : "$0.00",
    playbook: isStringArray(value.playbook) ? value.playbook : []
  };
  if (!template.id || !template.name || !template.objective) return null;
  return template;
}

function sanitizeTemplateList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((template) => sanitizeRunTemplate(template))
    .filter((template): template is RunTemplate => template !== null);
}

function sanitizePolicy(value: unknown) {
  if (!isObjectRecord(value)) return defaultPolicy;
  return {
    mode: typeof value.mode === "string" ? value.mode : defaultPolicy.mode,
    sandbox: typeof value.sandbox === "string" ? value.sandbox : defaultPolicy.sandbox,
    timeouts: typeof value.timeouts === "string" ? value.timeouts : defaultPolicy.timeouts,
    pauseNewRuns:
      typeof value.pauseNewRuns === "boolean"
        ? value.pauseNewRuns
        : defaultPolicy.pauseNewRuns,
    requireCitations:
      typeof value.requireCitations === "boolean"
        ? value.requireCitations
        : defaultPolicy.requireCitations,
    allowExternal:
      typeof value.allowExternal === "boolean"
        ? value.allowExternal
        : defaultPolicy.allowExternal,
    allowRepoWrites:
      typeof value.allowRepoWrites === "boolean"
        ? value.allowRepoWrites
        : defaultPolicy.allowRepoWrites,
    allowDeploy:
      typeof value.allowDeploy === "boolean" ? value.allowDeploy : defaultPolicy.allowDeploy,
    piiRedaction:
      typeof value.piiRedaction === "boolean"
        ? value.piiRedaction
        : defaultPolicy.piiRedaction,
    evidenceBundle:
      typeof value.evidenceBundle === "boolean"
        ? value.evidenceBundle
        : defaultPolicy.evidenceBundle
  };
}

function sanitizeLogBudget(value: unknown): LogBudget {
  if (!isObjectRecord(value)) return defaultLogBudget;
  const warnBudget =
    typeof value.warnBudget === "number" && value.warnBudget >= 0
      ? value.warnBudget
      : defaultLogBudget.warnBudget;
  const errorBudget =
    typeof value.errorBudget === "number" && value.errorBudget >= 0
      ? value.errorBudget
      : defaultLogBudget.errorBudget;
  return { warnBudget, errorBudget };
}

function sanitizeSpikeAlerts(value: unknown): SpikeAlerts {
  if (!isObjectRecord(value)) return defaultSpikeAlerts;
  const windowMinutes =
    typeof value.windowMinutes === "number" && value.windowMinutes > 0
      ? value.windowMinutes
      : defaultSpikeAlerts.windowMinutes;
  const threshold =
    typeof value.threshold === "number" && value.threshold > 0
      ? value.threshold
      : defaultSpikeAlerts.threshold;
  const enabled =
    typeof value.enabled === "boolean" ? value.enabled : defaultSpikeAlerts.enabled;
  return { enabled, windowMinutes, threshold };
}

function isIntegrationStatus(value: unknown): value is IntegrationOption["status"] {
  return value === "connected" || value === "available" || value === "beta";
}

function isIntegrationSyncState(value: unknown): value is IntegrationOption["sync"]["state"] {
  return (
    value === "healthy" ||
    value === "stale" ||
    value === "error" ||
    value === "disconnected"
  );
}

function sanitizeIntegrationOption(value: unknown): IntegrationOption | null {
  if (!isObjectRecord(value)) return null;
  const syncRaw = isObjectRecord(value.sync) ? value.sync : null;
  const sync: IntegrationOption["sync"] = {
    state: isIntegrationSyncState(syncRaw?.state) ? syncRaw!.state : "disconnected",
    lastSyncAtIso: isIsoTimestamp(syncRaw?.lastSyncAtIso) ? syncRaw!.lastSyncAtIso : null,
    lastError: typeof syncRaw?.lastError === "string" ? syncRaw!.lastError : null
  };
  const integration: IntegrationOption = {
    id: typeof value.id === "string" ? value.id : "",
    name: typeof value.name === "string" ? value.name : "",
    category: typeof value.category === "string" ? value.category : "",
    status: isIntegrationStatus(value.status) ? value.status : "available",
    description: typeof value.description === "string" ? value.description : "",
    benefit: typeof value.benefit === "string" ? value.benefit : "",
    sync
  };
  if (!integration.id || !integration.name || !integration.category) return null;
  return integration;
}

function sanitizeIntegrationList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((integration) => sanitizeIntegrationOption(integration))
    .filter((integration): integration is IntegrationOption => integration !== null);
}

function sanitizeStoredState(value: unknown): Partial<StoredState> | null {
  if (!isObjectRecord(value)) return null;
  return {
    theme: value.theme === "light" || value.theme === "dark" ? value.theme : undefined,
    runSearch: typeof value.runSearch === "string" ? value.runSearch : undefined,
    runStatusFilter: isRunStatusFilter(value.runStatusFilter)
      ? value.runStatusFilter
      : undefined,
    logSearch: typeof value.logSearch === "string" ? value.logSearch : undefined,
    logLevel: isLogLevelFilter(value.logLevel) ? value.logLevel : undefined,
    logAgent: typeof value.logAgent === "string" ? value.logAgent : undefined,
    pinnedLogs: isStringArray(value.pinnedLogs) ? value.pinnedLogs : undefined,
    queuedRuns: sanitizeRunList(value.queuedRuns),
    runOverrides: sanitizeRunOverrides(value.runOverrides),
    policy: sanitizePolicy(value.policy),
    spikeAlerts: sanitizeSpikeAlerts(value.spikeAlerts),
    logBudget: sanitizeLogBudget(value.logBudget),
    integrationOptions: sanitizeIntegrationList(value.integrationOptions),
    templates: sanitizeTemplateList(value.templates),
    selectedTemplateId:
      typeof value.selectedTemplateId === "string" ? value.selectedTemplateId : undefined
  };
}

const referenceNowMs = Date.now();

function minutesAgoIso(minutes: number) {
  return new Date(referenceNowMs - minutes * 60_000).toISOString();
}

const defaultRunPhaseTimeline: Record<string, RunPhase[]> = {
  "r-114": [
    { label: "Queued", status: "done", time: "09:12", note: "Run accepted" },
    { label: "Planning", status: "done", time: "09:15", note: "Playbook assigned" },
    { label: "Execution", status: "current", time: "09:24", note: "3 tasks running" },
    { label: "Review", status: "upcoming", note: "Awaiting QA pass" },
    { label: "Complete", status: "upcoming" }
  ],
  "r-113": [
    { label: "Queued", status: "done", time: "08:02", note: "Run accepted" },
    { label: "Planning", status: "current", time: "08:11", note: "Waiting on approval" },
    { label: "Execution", status: "upcoming" },
    { label: "Review", status: "upcoming" },
    { label: "Complete", status: "upcoming" }
  ],
  "r-112": [
    { label: "Queued", status: "done", time: "Yesterday 13:40" },
    { label: "Planning", status: "done", time: "Yesterday 13:55" },
    { label: "Execution", status: "done", time: "Yesterday 14:20" },
    { label: "Review", status: "done", time: "Yesterday 15:02" },
    { label: "Complete", status: "done", time: "Yesterday 15:22", note: "Evidence pack exported" }
  ]
};

const defaultRunActivityFeed: Record<string, RunActivity[]> = {
  "r-114": [
    {
      id: "act-114-1",
      title: "Kickoff briefing delivered",
      detail: "Atlas posted briefing in #swarm-launch.",
      timestamp: "09:14",
      occurredAtIso: minutesAgoIso(18),
      type: "milestone"
    },
    {
      id: "act-114-2",
      title: "Approval requested",
      detail: "Nova requested write access to staging repo.",
      timestamp: "09:18",
      occurredAtIso: minutesAgoIso(14),
      type: "approval"
    },
    {
      id: "act-114-3",
      title: "Automation step running",
      detail: "Kite executing onboarding checklist.",
      timestamp: "09:24",
      occurredAtIso: minutesAgoIso(8),
      type: "agent"
    }
  ],
  "r-113": [
    {
      id: "act-113-1",
      title: "Research queue created",
      detail: "Horizon assembled competitor list (12 targets).",
      timestamp: "08:04",
      occurredAtIso: minutesAgoIso(35),
      type: "milestone"
    },
    {
      id: "act-113-2",
      title: "Approval pending",
      detail: "Waiting on open web crawl approval.",
      timestamp: "08:11",
      occurredAtIso: minutesAgoIso(32),
      type: "approval"
    }
  ],
  "r-112": [
    {
      id: "act-112-1",
      title: "Regression suite complete",
      detail: "Kite finished 18/18 critical paths.",
      timestamp: "Yesterday 14:48",
      occurredAtIso: minutesAgoIso(70),
      type: "milestone"
    },
    {
      id: "act-112-2",
      title: "Evidence pack generated",
      detail: "Exported bundle to compliance share.",
      timestamp: "Yesterday 15:22",
      occurredAtIso: minutesAgoIso(60),
      type: "system"
    }
  ]
};

const defaultRunTrace: Record<string, RunTraceSpan[]> = {
  "r-114": [
    {
      id: "sp-114-1",
      name: "Plan: assign playbook",
      agent: "Atlas",
      startOffsetMs: 0,
      durationMs: 1800,
      depth: 0,
      status: "ok",
      detail: "Selected onboarding template"
    },
    {
      id: "sp-114-2",
      name: "Research: gather sources",
      agent: "Atlas",
      startOffsetMs: 900,
      durationMs: 7200,
      depth: 1,
      status: "running",
      detail: "18 sources ranked"
    },
    {
      id: "sp-114-3",
      name: "Implement: UI slice",
      agent: "Nova",
      startOffsetMs: 2200,
      durationMs: 16500,
      depth: 0,
      status: "running",
      detail: "Wizard + tests"
    },
    {
      id: "sp-114-4",
      name: "QA: regression pass",
      agent: "Kite",
      startOffsetMs: 8800,
      durationMs: 5200,
      depth: 0,
      status: "waiting",
      detail: "Blocked on staging"
    }
  ],
  "r-113": [
    {
      id: "sp-113-1",
      name: "Plan: approval gate",
      agent: "Atlas",
      startOffsetMs: 0,
      durationMs: 2200,
      depth: 0,
      status: "waiting",
      detail: "External crawl approval pending"
    },
    {
      id: "sp-113-2",
      name: "Draft: competitive brief",
      agent: "Horizon",
      startOffsetMs: 1800,
      durationMs: 7800,
      depth: 0,
      status: "waiting",
      detail: "Waiting on sources"
    }
  ]
};

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
  return sanitizeStoredState(safeJsonParse(raw));
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

function parseTokenList(raw: string) {
  const parts = raw
    .split(/[\n,]/g)
    .map((part) => part.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function parseLineList(raw: string) {
  const parts = raw
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function getDrawerParamsFromLocation() {
  const url = new URL(window.location.href);
  return {
    approvalId: url.searchParams.get("approvalId"),
    runId: url.searchParams.get("runId")
  };
}

function buildShareLocation(params: { approvalId: string | null; runId: string | null }) {
  const url = new URL(window.location.href);

  if (params.approvalId) {
    url.searchParams.set("approvalId", params.approvalId);
    url.searchParams.delete("runId");
  } else if (params.runId) {
    url.searchParams.set("runId", params.runId);
    url.searchParams.delete("approvalId");
  } else {
    url.searchParams.delete("approvalId");
    url.searchParams.delete("runId");
  }

  return {
    href: url.toString(),
    path: `${url.pathname}${url.search}${url.hash}`
  };
}

export default function App() {
  const [initialStoredState] = useState<Partial<StoredState> | null>(() =>
    readStoredState()
  );

  const [runSearch, setRunSearch] = useState(() => initialStoredState?.runSearch ?? "");
  const [runStatusFilter, setRunStatusFilter] = useState<RunStatusFilter>(() => {
    const value = initialStoredState?.runStatusFilter;
    return isRunStatusFilter(value) ? value : "all";
  });
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
  const [evidenceViewerOpen, setEvidenceViewerOpen] = useState(false);
  const [evidenceViewerLoading, setEvidenceViewerLoading] = useState(false);
  const [evidenceViewerError, setEvidenceViewerError] = useState<string | null>(null);
  const [evidenceViewerPayload, setEvidenceViewerPayload] =
    useState<EvidenceExportPayload | null>(null);
  const [verifyEvidenceOpen, setVerifyEvidenceOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [verifyEvidenceText, setVerifyEvidenceText] = useState("");
  const [verifyEvidenceResult, setVerifyEvidenceResult] =
    useState<EvidenceVerifySummary | null>(null);
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
  const initialTemplates =
    initialStoredState?.templates && initialStoredState.templates.length > 0
      ? initialStoredState.templates
      : defaultTemplates;
  const [templates, setTemplates] = useState<RunTemplate[]>(() => initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    const stored = initialStoredState?.selectedTemplateId ?? "";
    if (stored && initialTemplates.some((tpl) => tpl.id === stored)) return stored;
    return initialTemplates[0]?.id ?? "";
  });
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>(() => ({
    mode: "create",
    id: null,
    name: "",
    objective: "",
    agentsText: "",
    approvalsText: "",
    estCost: "$0.00",
    playbookText: ""
  }));
  const [activationLoops, setActivationLoops] = useState(() => defaultActivationLoops);
  const [integrationOptions, setIntegrationOptions] = useState<IntegrationOption[]>(() => {
    const stored = initialStoredState?.integrationOptions;
    return stored && stored.length > 0 ? stored : defaultIntegrationOptions;
  });
  const [feedbackSignals, setFeedbackSignals] = useState(() => defaultFeedbackSignals);
  const [autoApproveRisk, setAutoApproveRisk] = useState<Approval["risk"]>("medium");
  const [composerObjective, setComposerObjective] = useState("");
  const [composerOwner, setComposerOwner] = useState("Ops");
  const [composerTemplateId, setComposerTemplateId] = useState("none");
  const importInputRef = useRef<HTMLInputElement>(null);
  const [confirmationToasts, setConfirmationToasts] = useState<ConfirmationToast[]>([]);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const policyModalPanelRef = useRef<HTMLDivElement>(null);
  const evidenceViewerPanelRef = useRef<HTMLDivElement>(null);
  const verifyModalPanelRef = useRef<HTMLDivElement>(null);
  const runDetailPanelRef = useRef<HTMLDivElement>(null);
  const templateModalPanelRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const [clockMs, setClockMs] = useState(() => Date.now());
  const suppressDrawerUrlSyncRef = useRef(false);
  const hydratedDrawerFromUrlRef = useRef(false);

  const queueRun = useCallback(
    (options?: {
      source?: string;
      template?: RunTemplate | null;
      objective?: string;
      owner?: string;
      bannerMessage?: string;
    }) => {
      if (policy.pauseNewRuns) {
        setBanner("Queueing is paused (Emergency stop). Resume in Policy editor.");
        return;
      }
      const template = options?.template ?? null;
      const nextRun: Run = {
        id: `r-${Date.now()}-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`,
        objective:
          options?.objective?.trim() ||
          template?.objective ||
          defaultQuickRunObjective,
        owner: options?.owner ?? "Ops",
        startedAt: "Just now",
        createdAtIso: new Date().toISOString(),
        status: "queued",
        agents: template?.agents ?? defaultQuickRunAgents,
        costEstimate: template?.estCost ?? defaultQuickRunCostEstimate,
        tokens: "—"
      };
      setQueuedRuns((prev) => [nextRun, ...prev]);

      if (options?.bannerMessage) {
        setBanner(options.bannerMessage);
        return;
      }

      if (template) {
        setBanner(
          `Queued run from template “${template.name}”. Approval required for external tools.`
        );
        return;
      }

      setBanner(
        options?.source
          ? `Queued a new swarm run from ${options.source}. Approval required for external tools.`
          : "Queued a new swarm run. Approval required for external tools."
      );
    },
    [policy.pauseNewRuns]
  );

  const overlayOpen =
    selectedApproval !== null ||
    selectedRun !== null ||
    policyOpen ||
    evidenceViewerOpen ||
    verifyEvidenceOpen ||
    templateModalOpen;
  const activePanelRef = selectedApproval
    ? drawerPanelRef
    : selectedRun
      ? runDetailPanelRef
      : policyOpen
        ? policyModalPanelRef
        : evidenceViewerOpen
          ? evidenceViewerPanelRef
          : verifyEvidenceOpen
            ? verifyModalPanelRef
            : templateModalPanelRef;

  const runData = useMemo(() => {
    const baseRuns = queuedRuns.length === 0 ? runs : [...queuedRuns, ...runs];
    if (Object.keys(runOverrides).length === 0) return baseRuns;
    return baseRuns.map((run) => {
      const override = runOverrides[run.id];
      return override ? { ...run, status: override } : run;
    });
  }, [queuedRuns, runOverrides]);

  const openApprovalDrawer = useCallback((approval: Approval | null) => {
    setSelectedRun(null);
    setSelectedApproval(approval);
    if (approval) {
      setPolicyOpen(false);
      setEvidenceViewerOpen(false);
      setVerifyEvidenceOpen(false);
      setTemplateModalOpen(false);
    }
  }, []);

  const openRunDrawer = useCallback((run: Run | null) => {
    setSelectedApproval(null);
    setSelectedRun(run);
    if (run) {
      setPolicyOpen(false);
      setEvidenceViewerOpen(false);
      setVerifyEvidenceOpen(false);
      setTemplateModalOpen(false);
    }
  }, []);

  useEffect(() => {
    if (hydratedDrawerFromUrlRef.current) return;
    hydratedDrawerFromUrlRef.current = true;

    const { approvalId, runId } = getDrawerParamsFromLocation();
    const approval = approvalId
      ? approvals.find((item) => item.id === approvalId) ?? null
      : null;
    const run = !approval && runId ? runData.find((item) => item.id === runId) ?? null : null;

    if (approval) openApprovalDrawer(approval);
    else if (run) openRunDrawer(run);
  }, [openApprovalDrawer, openRunDrawer, runData]);

  useEffect(() => {
    const onPopState = () => {
      suppressDrawerUrlSyncRef.current = true;
      const { approvalId, runId } = getDrawerParamsFromLocation();
      const approval = approvalId
        ? approvals.find((item) => item.id === approvalId) ?? null
        : null;
      const run = !approval && runId ? runData.find((item) => item.id === runId) ?? null : null;

      if (approval) openApprovalDrawer(approval);
      else if (run) openRunDrawer(run);
      else {
        setSelectedApproval(null);
        setSelectedRun(null);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [openApprovalDrawer, openRunDrawer, runData]);

  useEffect(() => {
    if (suppressDrawerUrlSyncRef.current) {
      suppressDrawerUrlSyncRef.current = false;
      return;
    }

    const approvalId = selectedApproval?.id ?? null;
    const runId = selectedRun?.id ?? null;
    const desired = buildShareLocation({ approvalId, runId });
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (desired.path === currentPath) return;

    // Share links should be stable and navigable with back/forward.
    window.history.pushState(null, "", desired.path);
  }, [selectedApproval?.id, selectedRun?.id]);

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
    const handle = window.setInterval(() => setClockMs(Date.now()), 60_000);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    const storage = getStorage();
    if (!storage || typeof storage.setItem !== "function") return;
    const state: StoredState = {
      theme,
      runSearch,
      runStatusFilter,
      logSearch,
      logLevel,
      logAgent,
      pinnedLogs,
      queuedRuns,
      runOverrides,
      policy,
      spikeAlerts,
      logBudget,
      integrationOptions,
      templates,
      selectedTemplateId
    };
    storage.setItem(storageKey, JSON.stringify(state));
  }, [
    theme,
    runSearch,
    runStatusFilter,
    logSearch,
    logLevel,
    logAgent,
    pinnedLogs,
    queuedRuns,
    runOverrides,
    policy,
    spikeAlerts,
    logBudget,
    integrationOptions,
    templates,
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
          setEvidenceViewerOpen(false);
          setVerifyEvidenceOpen(false);
          setTemplateModalOpen(false);
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
        queueRun({ source: "shortcut" });
      }
      if (event.key === "Escape") {
        setSelectedApproval(null);
        setSelectedRun(null);
        setPolicyOpen(false);
        setEvidenceViewerOpen(false);
        setVerifyEvidenceOpen(false);
        setTemplateModalOpen(false);
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

  useEffect(() => {
    if (templates.length === 0) {
      setTemplates(defaultTemplates);
      setSelectedTemplateId(defaultTemplates[0]?.id ?? "");
      return;
    }
    if (!selectedTemplateId || !templates.some((tpl) => tpl.id === selectedTemplateId)) {
      setSelectedTemplateId(templates[0]?.id ?? "");
    }
    if (
      composerTemplateId !== "none" &&
      !templates.some((tpl) => tpl.id === composerTemplateId)
    ) {
      setComposerTemplateId("none");
    }
  }, [composerTemplateId, selectedTemplateId, templates]);

  const filteredRuns = useMemo(() => {
    const statusFiltered =
      runStatusFilter === "all"
        ? runData
        : runData.filter((run) => run.status === runStatusFilter);
    if (!runSearch.trim()) return statusFiltered;
    const value = runSearch.trim().toLowerCase();
    return statusFiltered.filter((run) =>
      [run.objective, run.owner, run.status, run.id].some((field) =>
        field.toLowerCase().includes(value)
      )
    );
  }, [runSearch, runData, runStatusFilter]);

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

  const getRunActivityFeed = useCallback(
    (run: Run) => defaultRunActivityFeed[run.id] ?? [],
    []
  );

  const runDurationsById = useMemo(
    () =>
      runData.reduce<Record<string, number | null>>((acc, run) => {
        acc[run.id] = getRunDurationMinutes(run, getRunActivityFeed(run), clockMs);
        return acc;
      }, {}),
    [clockMs, getRunActivityFeed, runData]
  );

  const getRunSlaBadgeForRun = useCallback(
    (run: Run) => getRunSlaBadge(run, runDurationsById[run.id] ?? null),
    [runDurationsById]
  );

  const atRiskRuns = useMemo(
    () =>
      runData.filter((run) => {
        const tone = getRunSlaBadgeForRun(run).tone;
        return tone === "medium" || tone === "high";
      }),
    [getRunSlaBadgeForRun, runData]
  );

  const runHealthSummary = useMemo<RunHealthSummary>(() => {
    const breachedRuns = runData.filter((run) => getRunSlaBadgeForRun(run).tone === "high").length;
    const spendAtRisk = atRiskRuns.reduce((total, run) => {
      return total + (parseCostEstimate(run.costEstimate) ?? 0);
    }, 0);
    return {
      totalRuns: runData.length,
      queuedRuns: runData.filter((run) => run.status === "queued").length,
      atRiskRuns: atRiskRuns.length,
      breachedRuns,
      pendingApprovals: approvals.length,
      errorLogs: logs.filter((log) => log.level === "error").length,
      spendAtRisk
    };
  }, [atRiskRuns, getRunSlaBadgeForRun, runData]);

  const setQueueingPaused = useCallback((paused: boolean) => {
    setPolicy((prev) => ({ ...prev, pauseNewRuns: paused }));
    setBanner(paused ? "Emergency stop enabled. New runs will not queue." : "Queueing resumed.");
  }, []);

  const buildOwnerPingDraft = useCallback(() => {
    const now = new Date().toISOString();
    if (atRiskRuns.length === 0) {
      return `Owner ping (${now}): No at-risk runs detected.`;
    }
    const runLines = atRiskRuns
      .slice(0, 8)
      .map((run) => `- ${run.owner}: ${run.id} (${run.status}) ${run.objective}`);
    const suffix =
      atRiskRuns.length > 8 ? `\n- +${atRiskRuns.length - 8} more at-risk runs` : "";
    return [
      `Owner ping (${now})`,
      `At-risk runs: ${runHealthSummary.atRiskRuns} (breached: ${runHealthSummary.breachedRuns})`,
      `Approvals pending: ${runHealthSummary.pendingApprovals} | Error logs: ${runHealthSummary.errorLogs}`,
      "",
      "Runs needing attention:",
      ...runLines
    ].join("\n") + suffix;
  }, [atRiskRuns, runHealthSummary]);

  const buildIncidentDraft = useCallback(() => {
    const now = new Date().toISOString();
    const runLines =
      atRiskRuns.length === 0
        ? ["- None"]
        : atRiskRuns.map(
            (run) => `- ${run.id} | owner=${run.owner} | status=${run.status} | ${run.objective}`
          );
    return [
      `# Incident draft: Agent swarm run health (${now})`,
      "",
      "## Summary",
      `- Total runs: ${runHealthSummary.totalRuns}`,
      `- At-risk runs: ${runHealthSummary.atRiskRuns} (breached: ${runHealthSummary.breachedRuns})`,
      `- Approvals pending: ${runHealthSummary.pendingApprovals}`,
      `- Error logs: ${runHealthSummary.errorLogs}`,
      `- Spend at risk (est.): $${runHealthSummary.spendAtRisk.toFixed(2)}`,
      `- Emergency stop (pause new runs): ${policy.pauseNewRuns ? "ON" : "OFF"}`,
      "",
      "## Affected runs",
      ...runLines,
      "",
      "## Immediate actions",
      "- [ ] Enable emergency stop if error pressure is rising",
      "- [ ] Review approval backlog and unblock high-risk items",
      "- [ ] Inspect run logs for repeating errors and rollback risky changes"
    ].join("\n");
  }, [atRiskRuns, policy.pauseNewRuns, runHealthSummary]);

  const copyOwnerPing = useCallback(async () => {
    const ok = await copyToClipboard(buildOwnerPingDraft());
    setBanner(ok ? "Copied owner ping draft." : "Unable to copy owner ping in this browser.");
  }, [buildOwnerPingDraft]);

  const copyIncidentDraft = useCallback(async () => {
    const ok = await copyToClipboard(buildIncidentDraft());
    setBanner(ok ? "Copied incident draft." : "Unable to copy incident draft in this browser.");
  }, [buildIncidentDraft]);

  const copyApprovalLink = useCallback(async () => {
    const share = buildShareLocation({ approvalId: selectedApproval?.id ?? null, runId: null });
    const ok = await copyToClipboard(share.href);
    setBanner(ok ? "Copied approval link." : "Unable to copy approval link in this browser.");
  }, [selectedApproval?.id]);

  const copyRunLink = useCallback(async () => {
    const share = buildShareLocation({ approvalId: null, runId: selectedRun?.id ?? null });
    const ok = await copyToClipboard(share.href);
    setBanner(ok ? "Copied run link." : "Unable to copy run link in this browser.");
  }, [selectedRun?.id]);

  const copyEvidenceDigest = useCallback(async () => {
    const digest = evidenceViewerPayload?.integrity?.digest;
    if (!digest) {
      setBanner("No checksum available for this export.");
      return;
    }
    const ok = await copyToClipboard(digest);
    setBanner(ok ? "Copied evidence checksum." : "Unable to copy checksum in this browser.");
  }, [evidenceViewerPayload]);

  const copyEvidenceJson = useCallback(async () => {
    if (!evidenceViewerPayload) return;
    const ok = await copyToClipboard(JSON.stringify(evidenceViewerPayload, null, 2));
    setBanner(ok ? "Copied evidence JSON." : "Unable to copy evidence JSON in this browser.");
  }, [evidenceViewerPayload]);

  const togglePin = (id: string) => {
    setPinnedLogs((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const exportEvidence = async () => {
    const payload = await buildEvidenceExportPayload({
      generatedAt: new Date().toISOString(),
      policy,
      runHealthSummary,
      agents,
      runs: runData,
      queuedRuns,
      runOverrides,
      approvals,
      logs,
      logBudget,
      spikeAlerts,
      templates,
      selectedTemplateId
    });
    downloadJson("agent-swarm-evidence-pack.json", payload);
    setBanner(
      payload.integrity.digest
        ? `Evidence exported (${payload.integrity.digest.slice(0, 18)}...).`
        : "Evidence exported (checksum unavailable in this browser)."
    );
  };

  const openEvidenceViewer = () => {
    setSelectedApproval(null);
    setSelectedRun(null);
    setPolicyOpen(false);
    setTemplateModalOpen(false);
    setVerifyEvidenceOpen(false);
    setEvidenceViewerOpen(true);
    setEvidenceViewerLoading(true);
    setEvidenceViewerError(null);
    setEvidenceViewerPayload(null);

    void buildEvidenceExportPayload({
      generatedAt: new Date().toISOString(),
      policy,
      runHealthSummary,
      agents,
      runs: runData,
      queuedRuns,
      runOverrides,
      approvals,
      logs,
      logBudget,
      spikeAlerts,
      templates,
      selectedTemplateId
    })
      .then((payload) => {
        setEvidenceViewerPayload(payload);
      })
      .catch((error: unknown) => {
        setEvidenceViewerError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => setEvidenceViewerLoading(false));
  };

  const closeEvidenceViewer = () => {
    setEvidenceViewerOpen(false);
  };

  const openVerifyEvidence = () => {
    setSelectedApproval(null);
    setSelectedRun(null);
    setPolicyOpen(false);
    setTemplateModalOpen(false);
    setEvidenceViewerOpen(false);
    setVerifyEvidenceOpen(true);
    setVerifyEvidenceResult(null);
  };

  const closeVerifyEvidence = () => {
    setVerifyEvidenceOpen(false);
  };

  const clearVerifyEvidence = () => {
    setVerifyEvidenceText("");
    setVerifyEvidenceResult(null);
  };

  const loadVerifyEvidenceFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setVerifyEvidenceText(String(reader.result ?? ""));
      setVerifyEvidenceResult(null);
    };
    reader.readAsText(file);
  };

  const verifyEvidence = async () => {
    setVerifyEvidenceResult(null);
    const parsed = safeJsonParse<unknown>(verifyEvidenceText);
    if (!parsed || typeof parsed !== "object") {
      setVerifyEvidenceResult({
        tone: "high",
        title: "Invalid JSON",
        message: "Paste a valid exported evidence JSON payload to verify its checksum.",
        schemaVersion: null,
        algorithm: null,
        expectedDigest: null,
        actualDigest: null
      });
      return;
    }

    const payload = parsed as EvidenceExportPayload;
    const schemaVersion =
      typeof payload.evidenceSchemaVersion === "number" ? payload.evidenceSchemaVersion : null;
    const algorithm = payload.integrity?.algorithm ? String(payload.integrity.algorithm) : null;

    if (!payload.integrity) {
      setVerifyEvidenceResult({
        tone: "high",
        title: "Missing integrity metadata",
        message: "This payload does not include an integrity block to verify against.",
        schemaVersion,
        algorithm,
        expectedDigest: null,
        actualDigest: null
      });
      return;
    }

    const outcome = await verifyEvidenceExportPayload(payload);
    const tone = outcome.ok ? "low" : outcome.algorithm === "none" ? "medium" : "high";
    setVerifyEvidenceResult({
      tone,
      title: outcome.ok
        ? "Checksum verified"
        : outcome.algorithm === "none"
          ? "Checksum unavailable"
          : "Checksum verification failed",
      message: outcome.message,
      schemaVersion,
      algorithm: outcome.algorithm,
      expectedDigest: outcome.expectedDigest,
      actualDigest: outcome.actualDigest
    });

    if (outcome.ok && outcome.expectedDigest) {
      setBanner(`Evidence verified (${outcome.expectedDigest.slice(0, 18)}...).`);
    }
  };

  const exportState = () => {
    const payload: StoredState = {
      theme,
      runSearch,
      runStatusFilter,
      logSearch,
      logLevel,
      logAgent,
      pinnedLogs,
      queuedRuns,
      runOverrides,
      policy,
      spikeAlerts,
      logBudget,
      integrationOptions,
      templates,
      selectedTemplateId
    };
    downloadJson("agent-swarm-state.json", payload);
  };

  const importState = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = sanitizeStoredState(safeJsonParse(String(reader.result)));
      if (!parsed) {
        setBanner("Import failed. Invalid JSON file.");
        return;
      }

      setTheme(parsed.theme ?? "dark");
      setRunSearch(parsed.runSearch ?? "");
      setRunStatusFilter(parsed.runStatusFilter ?? "all");
      setLogSearch(parsed.logSearch ?? "");
      setLogLevel(parsed.logLevel ?? "all");
      setLogAgent(parsed.logAgent ?? "all");
      setPinnedLogs(parsed.pinnedLogs ?? []);
      setQueuedRuns(parsed.queuedRuns ?? []);
      setRunOverrides(parsed.runOverrides ?? {});
      setPolicy(parsed.policy ?? defaultPolicy);
      setSpikeAlerts(parsed.spikeAlerts ?? defaultSpikeAlerts);
      setLogBudget(parsed.logBudget ?? defaultLogBudget);
      const nextIntegrations =
        parsed.integrationOptions && parsed.integrationOptions.length > 0
          ? parsed.integrationOptions
          : defaultIntegrationOptions;
      setIntegrationOptions(nextIntegrations);
      const nextTemplates =
        parsed.templates && parsed.templates.length > 0 ? parsed.templates : defaultTemplates;
      setTemplates(nextTemplates);
      const nextSelectedId =
        parsed.selectedTemplateId && nextTemplates.some((tpl) => tpl.id === parsed.selectedTemplateId)
          ? parsed.selectedTemplateId
          : nextTemplates[0]?.id ?? "";
      setSelectedTemplateId(nextSelectedId);
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

  const getRunDurationLabel = (run: Run) =>
    formatRunDurationLabel(run, runDurationsById[run.id] ?? null);

  const buildDefaultTimeline = (run: Run): RunPhase[] => {
    const phaseLabels = ["Queued", "Planning", "Execution", "Review", "Complete"];
    const statusIndexMap: Record<RunStatus, number> = {
      queued: 0,
      waiting: 1,
      running: 2,
      failed: 2,
      completed: 4
    };
    const currentIndex = statusIndexMap[run.status] ?? 0;
    return phaseLabels.map((label, index) => {
      if (run.status === "completed") {
        return { label, status: "done" };
      }
      if (run.status === "failed" && index === currentIndex) {
        return { label, status: "blocked", note: "Needs intervention" };
      }
      if (index < currentIndex) {
        return { label, status: "done" };
      }
      if (index === currentIndex) {
        return { label, status: "current" };
      }
      return { label, status: "upcoming" };
    });
  };

  const getRunTimeline = (run: Run) => defaultRunPhaseTimeline[run.id] ?? buildDefaultTimeline(run);

  const buildDefaultTrace = (run: Run): RunTraceSpan[] => {
    const status: RunTraceSpan["status"] =
      run.status === "failed"
        ? "error"
        : run.status === "waiting"
          ? "waiting"
          : run.status === "running"
            ? "running"
            : "ok";
    return [
      {
        id: `${run.id}-trace-plan`,
        name: "Plan: kickoff",
        agent: run.agents[0] ?? "System",
        startOffsetMs: 0,
        durationMs: 2400,
        depth: 0,
        status: status === "error" ? "error" : "ok",
        detail: "Default trace (synthetic)"
      },
      {
        id: `${run.id}-trace-exec`,
        name: "Execute: agent loop",
        agent: run.agents[0] ?? "System",
        startOffsetMs: 2400,
        durationMs: 8400,
        depth: 0,
        status,
        detail: "Default trace (synthetic)"
      }
    ];
  };

  const getRunTrace = (run: Run) => defaultRunTrace[run.id] ?? buildDefaultTrace(run);

  const submitComposer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedObjective = composerObjective.trim();
    if (!trimmedObjective) {
      setBanner("Add a run objective before queuing.");
      return;
    }

    queueRun({
      owner: composerOwner,
      objective: trimmedObjective,
      template: composerTemplate,
      bannerMessage: composerTemplate
        ? `Queued run from ${composerTemplate.name}.`
        : `Queued run: ${trimmedObjective}.`
    });
    setComposerObjective("");
    setComposerTemplateId("none");
  };

  const buildBlankTemplateDraft = (): TemplateDraft => ({
    mode: "create",
    id: null,
    name: "",
    objective: "",
    agentsText: "",
    approvalsText: "",
    estCost: "$0.00",
    playbookText: ""
  });

  const buildDraftFromTemplate = (template: RunTemplate, mode: TemplateDraft["mode"]): TemplateDraft => ({
    mode,
    id: mode === "edit" ? template.id : null,
    name: template.name,
    objective: template.objective,
    agentsText: template.agents.join(", "),
    approvalsText: template.approvals.join(", "),
    estCost: template.estCost,
    playbookText: template.playbook.join("\n")
  });

  const openTemplateEditor = (draft: TemplateDraft) => {
    setSelectedApproval(null);
    setSelectedRun(null);
    setPolicyOpen(false);
    setEvidenceViewerOpen(false);
    setVerifyEvidenceOpen(false);
    setTemplateDraft(draft);
    setTemplateModalOpen(true);
  };

  const closeTemplateEditor = () => {
    setTemplateModalOpen(false);
  };

  const openNewTemplate = () => openTemplateEditor(buildBlankTemplateDraft());

  const openEditTemplate = (template: RunTemplate) =>
    openTemplateEditor(buildDraftFromTemplate(template, "edit"));

  const openDuplicateTemplate = (template: RunTemplate) => {
    const draft = buildDraftFromTemplate(template, "create");
    openTemplateEditor({
      ...draft,
      name: `Copy of ${template.name}`
    });
  };

  const saveTemplate = () => {
    const name = templateDraft.name.trim();
    const objective = templateDraft.objective.trim();
    if (!name) {
      setBanner("Add a template name before saving.");
      return;
    }
    if (!objective) {
      setBanner("Add a template objective before saving.");
      return;
    }

    const agents = parseTokenList(templateDraft.agentsText);
    if (agents.length === 0) {
      setBanner("Add at least one agent to the template.");
      return;
    }

    const playbook = parseLineList(templateDraft.playbookText);
    if (playbook.length === 0) {
      setBanner("Add at least one playbook step to the template.");
      return;
    }

    const approvals = parseTokenList(templateDraft.approvalsText);
    const estCost = templateDraft.estCost.trim() || "$0.00";
    const id =
      templateDraft.id ??
      `tpl-${Date.now()}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`;

    const nextTemplate: RunTemplate = {
      id,
      name,
      objective,
      agents,
      approvals,
      estCost,
      playbook
    };

    setTemplates((prev) => {
      if (templateDraft.mode === "edit" && templateDraft.id) {
        return prev.map((template) => (template.id === templateDraft.id ? nextTemplate : template));
      }
      return [nextTemplate, ...prev];
    });
    setSelectedTemplateId(id);
    setTemplateModalOpen(false);
    setBanner(`Saved template “${name}”.`);
  };

  const deleteTemplate = (template: RunTemplate) => {
    setTemplates((prev) => {
      if (prev.length <= 1) {
        setBanner("Keep at least one template in the library.");
        return prev;
      }
      const next = prev.filter((item) => item.id !== template.id);
      const nextSelected =
        next.some((item) => item.id === selectedTemplateId) ? selectedTemplateId : next[0]?.id ?? "";
      setSelectedTemplateId(nextSelected);
      if (composerTemplateId === template.id) setComposerTemplateId("none");
      setTemplateModalOpen(false);
      setBanner(`Deleted template “${template.name}”.`);
      return next;
    });
  };

  const deleteEditingTemplate = () => {
    if (!templateDraft.id) return;
    const target = templates.find((template) => template.id === templateDraft.id);
    if (!target) return;
    deleteTemplate(target);
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

  const toggleLoopStatus = (id: string) => {
    setActivationLoops((prev) =>
      prev.map((loop) => {
        if (loop.id !== id) return loop;
        return {
          ...loop,
          status: loop.status === "live" ? "paused" : "live"
        };
      })
    );
  };

  const connectIntegration = (id: string) => {
    setIntegrationOptions((prev) => {
      const target = prev.find((integration) => integration.id === id);
      if (target && target.status !== "connected") {
        setBanner(`Connected ${target.name}. Runs will sync automatically.`);
      }
      return prev.map((integration) => {
        if (integration.id !== id) return integration;
        if (integration.status === "connected") return integration;
        const now = new Date().toISOString();
        return {
          ...integration,
          status: "connected",
          sync: {
            state: "healthy",
            lastSyncAtIso: now,
            lastError: null
          }
        };
      });
    });
  };

  const reconnectIntegration = (id: string) => {
    setIntegrationOptions((prev) => {
      const target = prev.find((integration) => integration.id === id);
      if (target) {
        setBanner(`Reconnected ${target.name}. Sync restarted.`);
      }
      const now = new Date().toISOString();
      return prev.map((integration) => {
        if (integration.id !== id) return integration;
        return {
          ...integration,
          status: "connected",
          sync: {
            state: "healthy",
            lastSyncAtIso: now,
            lastError: null
          }
        };
      });
    });
  };

  const boostSignal = (id: string) => {
    setFeedbackSignals((prev) =>
      prev.map((signal) =>
        signal.id === id ? { ...signal, votes: signal.votes + 1 } : signal
      )
    );
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
        onNewRun={() => queueRun({ source: "top bar" })}
        queueingPaused={policy.pauseNewRuns}
        onResumeQueueing={() => setPolicy((prev) => ({ ...prev, pauseNewRuns: false }))}
      />

      {banner ? <Banner message={banner} onDismiss={() => setBanner(null)} /> : null}

      <OverviewSection
        approvals={approvals}
        onViewAll={() => openApprovalDrawer(approvals[0] ?? null)}
        onSelectApproval={(approval) => openApprovalDrawer(approval)}
      />

      <section className="grid growth-grid">
        <OutcomeScorecard metrics={valueMetrics} />
        <RunHealthCard
          summary={runHealthSummary}
          atRiskRuns={atRiskRuns}
          onViewRun={openRunDrawer}
          queueingPaused={policy.pauseNewRuns}
          onSetQueueingPaused={setQueueingPaused}
          onCopyOwnerPing={() => void copyOwnerPing()}
          onCopyIncidentDraft={() => void copyIncidentDraft()}
        />
        <AgentWorkloadCard
          agents={agents}
          runs={runData}
          getRunSlaTone={(run) => getRunSlaBadgeForRun(run).tone}
        />
        <ActivationLoopsCard loops={activationLoops} onToggle={toggleLoopStatus} />
        <IntegrationHubCard
          integrations={integrationOptions}
          onConnect={connectIntegration}
          onReconnect={reconnectIntegration}
        />
        <FeedbackPulseCard signals={feedbackSignals} onBoost={boostSignal} />
      </section>

      <AgentsRunsSection
        agents={agents}
        statusLabel={statusLabel}
        runSearch={runSearch}
        onRunSearchChange={setRunSearch}
        runStatusFilter={runStatusFilter}
        onRunStatusFilterChange={setRunStatusFilter}
        filteredRuns={filteredRuns}
        runStatusLabel={runStatusLabel}
        onQueueRun={() => queueRun({ source: "runs panel" })}
        queueingPaused={policy.pauseNewRuns}
        onRunAction={handleRunAction}
        onViewDetails={openRunDrawer}
        getRunDurationLabel={getRunDurationLabel}
        getRunSlaBadge={getRunSlaBadgeForRun}
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
          onViewEvidence={openEvidenceViewer}
          onExportEvidence={() => {
            void exportEvidence();
          }}
          onVerifyEvidence={openVerifyEvidence}
        />
        <ControlSurfaceCard
          policy={policy}
          onOpenPolicy={() => {
            setEvidenceViewerOpen(false);
            setVerifyEvidenceOpen(false);
            setTemplateModalOpen(false);
            setPolicyOpen(true);
          }}
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
          queueingPaused={policy.pauseNewRuns}
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
          onQueueTemplate={(template) => queueRun({ template })}
          queueingPaused={policy.pauseNewRuns}
          onNewTemplate={openNewTemplate}
          onEditTemplate={openEditTemplate}
          onDuplicateTemplate={openDuplicateTemplate}
          onDeleteTemplate={deleteTemplate}
        />
      </section>

      {selectedApproval ? (
        <ApprovalDrawer
          approval={selectedApproval}
          approvalDetail={approvalDetail ?? null}
          onClose={() => setSelectedApproval(null)}
          onCopyLink={() => void copyApprovalLink()}
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
          timeline={getRunTimeline(selectedRun)}
          activity={getRunActivityFeed(selectedRun)}
          trace={getRunTrace(selectedRun)}
          onClose={() => setSelectedRun(null)}
          onCopyLink={() => void copyRunLink()}
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
          panelRef={policyModalPanelRef}
        />
      ) : null}

      {evidenceViewerOpen ? (
        <EvidenceExportViewerModal
          payload={evidenceViewerPayload}
          loading={evidenceViewerLoading}
          error={evidenceViewerError}
          onCopyDigest={() => void copyEvidenceDigest()}
          onCopyJson={() => void copyEvidenceJson()}
          onDownload={() => {
            if (!evidenceViewerPayload) return;
            downloadJson("agent-swarm-evidence-pack.json", evidenceViewerPayload);
            setBanner("Downloaded evidence JSON.");
          }}
          onClose={closeEvidenceViewer}
          panelRef={evidenceViewerPanelRef}
        />
      ) : null}

      {verifyEvidenceOpen ? (
        <EvidenceVerifyModal
          value={verifyEvidenceText}
          onValueChange={setVerifyEvidenceText}
          onLoadFile={loadVerifyEvidenceFile}
          onVerify={() => {
            void verifyEvidence();
          }}
          onClear={clearVerifyEvidence}
          onClose={closeVerifyEvidence}
          result={verifyEvidenceResult}
          panelRef={verifyModalPanelRef}
        />
      ) : null}

      {templateModalOpen ? (
        <TemplateModal
          draft={templateDraft}
          setDraft={setTemplateDraft}
          onClose={closeTemplateEditor}
          onSave={saveTemplate}
          onDelete={templateDraft.mode === "edit" ? deleteEditingTemplate : undefined}
          panelRef={templateModalPanelRef}
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
