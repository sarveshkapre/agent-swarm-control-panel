export type AgentStatus = "idle" | "running" | "paused" | "error";

export type Agent = {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  lastActive: string;
  model: string;
  focus: string;
};

export type RunStatus = "queued" | "running" | "waiting" | "failed" | "completed";

export type RunPhaseStatus = "done" | "current" | "upcoming" | "blocked";

export type RunPhase = {
  label: string;
  status: RunPhaseStatus;
  time?: string;
  note?: string;
};

export type RunActivityType = "milestone" | "agent" | "system" | "approval" | "alert";

export type RunActivity = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: RunActivityType;
};

export type Run = {
  id: string;
  objective: string;
  owner: string;
  startedAt: string;
  status: RunStatus;
  agents: string[];
  costEstimate: string;
  tokens: string;
};

export type Approval = {
  id: string;
  title: string;
  requestedBy: string;
  risk: "low" | "medium" | "high";
  scope: string;
  requestedAt: string;
};

export type PolicySettings = {
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

export type SpikeAlerts = {
  enabled: boolean;
  windowMinutes: number;
  threshold: number;
};

export type LogBudget = {
  warnBudget: number;
  errorBudget: number;
};

export type LogEntry = {
  id: string;
  agent: string;
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
};

export type ValueMetric = {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "flat";
  delta: string;
  note: string;
};

export type ActivationLoop = {
  id: string;
  title: string;
  description: string;
  owner: string;
  status: "live" | "paused" | "planned";
  impact: string;
  nextStep: string;
};

export type IntegrationOption = {
  id: string;
  name: string;
  category: string;
  status: "connected" | "available" | "beta";
  description: string;
  benefit: string;
};

export type FeedbackSignal = {
  id: string;
  source: string;
  request: string;
  segment: string;
  priority: "high" | "medium" | "low";
  votes: number;
};

export type RunTemplate = {
  id: string;
  name: string;
  objective: string;
  agents: string[];
  approvals: string[];
  estCost: string;
  playbook: string[];
};

export type RunHealthSummary = {
  totalRuns: number;
  queuedRuns: number;
  atRiskRuns: number;
  breachedRuns: number;
  pendingApprovals: number;
  errorLogs: number;
  spendAtRisk: number;
};
