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
