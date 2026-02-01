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

export type LogEntry = {
  id: string;
  agent: string;
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
};
