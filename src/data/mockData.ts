import type {
  ActivationLoop,
  Agent,
  Approval,
  FeedbackSignal,
  IntegrationOption,
  LogEntry,
  Run,
  ValueMetric
} from "../types";

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

export const valueMetrics: ValueMetric[] = [
  {
    id: "metric-activation",
    label: "Activation rate",
    current: 42,
    target: 60,
    unit: "%",
    trend: "up",
    delta: "+6% WoW",
    note: "Guided checklists are converting trial teams."
  },
  {
    id: "metric-ttv",
    label: "Time-to-value",
    current: 18,
    target: 12,
    unit: "m",
    trend: "down",
    delta: "-4m WoW",
    note: "Auto-approvals cut onboarding friction."
  },
  {
    id: "metric-automation",
    label: "Automation coverage",
    current: 63,
    target: 80,
    unit: "%",
    trend: "up",
    delta: "+9% MoM",
    note: "Playbooks now power 8 common workflows."
  },
  {
    id: "metric-retention",
    label: "Weekly returning teams",
    current: 24,
    target: 35,
    unit: "",
    trend: "flat",
    delta: "+1 team",
    note: "Nudge owners to schedule weekly reviews."
  }
];

export const activationLoops: ActivationLoop[] = [
  {
    id: "loop-1",
    title: "Concierge onboarding",
    description: "Auto-generate kickoff briefs with tailored playbooks.",
    owner: "CS",
    status: "live",
    impact: "Boosts activation by 12%",
    nextStep: "Record a 5-minute walkthrough."
  },
  {
    id: "loop-2",
    title: "Template marketplace",
    description: "Share top playbooks across teams with ratings.",
    owner: "Product",
    status: "planned",
    impact: "Cuts setup time by 30%",
    nextStep: "Curate the first 10 templates."
  },
  {
    id: "loop-3",
    title: "Weekly impact digest",
    description: "Email ROI summaries and wins to stakeholders.",
    owner: "Growth",
    status: "paused",
    impact: "Improves retention and renewal readiness.",
    nextStep: "Add executive-friendly KPI cards."
  }
];

export const integrationOptions: IntegrationOption[] = [
  {
    id: "int-1",
    name: "Slack",
    category: "Comms",
    status: "connected",
    description: "Approval routing + run highlights.",
    benefit: "Saves 2.4h/week on updates."
  },
  {
    id: "int-2",
    name: "Linear",
    category: "Planning",
    status: "available",
    description: "Create issues from agent findings.",
    benefit: "Keeps execution in one backlog."
  },
  {
    id: "int-3",
    name: "Notion",
    category: "Docs",
    status: "available",
    description: "Publish evidence packs and briefs.",
    benefit: "One-click stakeholder sharing."
  },
  {
    id: "int-4",
    name: "Zapier",
    category: "Automation",
    status: "beta",
    description: "Trigger workflows from run events.",
    benefit: "Connect 5,000+ tools."
  }
];

export const feedbackSignals: FeedbackSignal[] = [
  {
    id: "sig-1",
    source: "Customer interview",
    request: "Show ROI by team and project over time.",
    segment: "Head of Ops",
    priority: "high",
    votes: 18
  },
  {
    id: "sig-2",
    source: "Support ticket",
    request: "One-click export to SOC2 evidence binders.",
    segment: "Security lead",
    priority: "medium",
    votes: 11
  },
  {
    id: "sig-3",
    source: "Community Slack",
    request: "Template gallery with ratings + clone flow.",
    segment: "Product manager",
    priority: "high",
    votes: 23
  },
  {
    id: "sig-4",
    source: "Design partner",
    request: "Suggested automation ideas when approvals stall.",
    segment: "Engineering manager",
    priority: "low",
    votes: 6
  }
];
