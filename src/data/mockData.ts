import type { Agent, Approval, LogEntry, Run } from "../types";

export const agents: Agent[] = [
  {
    id: "a-1",
    name: "Atlas",
    role: "Researcher",
    status: "running",
    lastActive: "Just now",
    model: "gpt-4.1",
    focus: "Market scan"
  },
  {
    id: "a-2",
    name: "Nova",
    role: "Coder",
    status: "running",
    lastActive: "2m ago",
    model: "gpt-4.1",
    focus: "Frontend slice"
  },
  {
    id: "a-3",
    name: "Kite",
    role: "Tester",
    status: "paused",
    lastActive: "7m ago",
    model: "gpt-4.1-mini",
    focus: "Regression pass"
  },
  {
    id: "a-4",
    name: "Horizon",
    role: "Writer",
    status: "idle",
    lastActive: "20m ago",
    model: "gpt-4.1-mini",
    focus: "Release notes"
  }
];

export const runs: Run[] = [
  {
    id: "r-114",
    objective: "Launch onboarding flow for Agent Swarm",
    owner: "Ops",
    startedAt: "Today 09:12",
    status: "running",
    agents: ["Atlas", "Nova", "Kite"],
    costEstimate: "$18.40",
    tokens: "142k"
  },
  {
    id: "r-113",
    objective: "Compile competitive report",
    owner: "Research",
    startedAt: "Today 08:02",
    status: "waiting",
    agents: ["Atlas", "Horizon"],
    costEstimate: "$7.12",
    tokens: "66k"
  },
  {
    id: "r-112",
    objective: "Regression suite + evidence pack",
    owner: "QA",
    startedAt: "Yesterday",
    status: "completed",
    agents: ["Kite"],
    costEstimate: "$3.55",
    tokens: "21k"
  }
];

export const approvals: Approval[] = [
  {
    id: "ap-71",
    title: "Run open web crawl (50 domains)",
    requestedBy: "Atlas",
    risk: "medium",
    scope: "Allowlist: security vendor sites",
    requestedAt: "4m ago"
  },
  {
    id: "ap-70",
    title: "Write to staging repo",
    requestedBy: "Nova",
    risk: "high",
    scope: "Branch: swarm/onboarding",
    requestedAt: "12m ago"
  }
];

export const logs: LogEntry[] = [
  {
    id: "l-1",
    agent: "Atlas",
    level: "info",
    message: "Pulled 18 relevant sources and ranked by authority.",
    timestamp: "09:24:12"
  },
  {
    id: "l-2",
    agent: "Nova",
    level: "warn",
    message: "2 failing tests in onboarding wizard; requesting approval to refactor.",
    timestamp: "09:23:02"
  },
  {
    id: "l-3",
    agent: "Kite",
    level: "error",
    message: "Staging environment unreachable; retrying in 5 minutes.",
    timestamp: "09:21:44"
  },
  {
    id: "l-4",
    agent: "Horizon",
    level: "info",
    message: "Drafted release notes outline; waiting for product sign-off.",
    timestamp: "09:20:18"
  }
];
