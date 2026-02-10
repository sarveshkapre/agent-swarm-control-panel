import type {
  IntegrationOption,
  LogBudget,
  LogLevelFilter,
  PolicySettings,
  Run,
  RunStatus,
  RunStatusFilter,
  RunTemplate,
  SpikeAlerts,
  StoredState
} from "../types";
import { safeJsonParse } from "./json";

const runStatuses: RunStatus[] = ["queued", "running", "waiting", "failed", "completed"];
const logLevels: LogLevelFilter[] = ["all", "info", "warn", "error"];

export type StoredStateDefaults = {
  policy: PolicySettings;
  logBudget: LogBudget;
  spikeAlerts: SpikeAlerts;
};

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

function sanitizePolicy(value: unknown, defaults: StoredStateDefaults): PolicySettings {
  if (!isObjectRecord(value)) return defaults.policy;
  return {
    mode: typeof value.mode === "string" ? value.mode : defaults.policy.mode,
    sandbox: typeof value.sandbox === "string" ? value.sandbox : defaults.policy.sandbox,
    timeouts: typeof value.timeouts === "string" ? value.timeouts : defaults.policy.timeouts,
    pauseNewRuns:
      typeof value.pauseNewRuns === "boolean"
        ? value.pauseNewRuns
        : defaults.policy.pauseNewRuns,
    requireCitations:
      typeof value.requireCitations === "boolean"
        ? value.requireCitations
        : defaults.policy.requireCitations,
    allowExternal:
      typeof value.allowExternal === "boolean"
        ? value.allowExternal
        : defaults.policy.allowExternal,
    allowRepoWrites:
      typeof value.allowRepoWrites === "boolean"
        ? value.allowRepoWrites
        : defaults.policy.allowRepoWrites,
    allowDeploy:
      typeof value.allowDeploy === "boolean" ? value.allowDeploy : defaults.policy.allowDeploy,
    piiRedaction:
      typeof value.piiRedaction === "boolean"
        ? value.piiRedaction
        : defaults.policy.piiRedaction,
    evidenceBundle:
      typeof value.evidenceBundle === "boolean"
        ? value.evidenceBundle
        : defaults.policy.evidenceBundle
  };
}

function sanitizeLogBudget(value: unknown, defaults: StoredStateDefaults): LogBudget {
  if (!isObjectRecord(value)) return defaults.logBudget;
  const warnBudget =
    typeof value.warnBudget === "number" && value.warnBudget >= 0
      ? value.warnBudget
      : defaults.logBudget.warnBudget;
  const errorBudget =
    typeof value.errorBudget === "number" && value.errorBudget >= 0
      ? value.errorBudget
      : defaults.logBudget.errorBudget;
  return { warnBudget, errorBudget };
}

function sanitizeSpikeAlerts(value: unknown, defaults: StoredStateDefaults): SpikeAlerts {
  if (!isObjectRecord(value)) return defaults.spikeAlerts;
  const windowMinutes =
    typeof value.windowMinutes === "number" && value.windowMinutes > 0
      ? value.windowMinutes
      : defaults.spikeAlerts.windowMinutes;
  const threshold =
    typeof value.threshold === "number" && value.threshold > 0
      ? value.threshold
      : defaults.spikeAlerts.threshold;
  const enabled =
    typeof value.enabled === "boolean" ? value.enabled : defaults.spikeAlerts.enabled;
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

export function sanitizeStoredState(
  value: unknown,
  defaults: StoredStateDefaults
): Partial<StoredState> | null {
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
    policy: sanitizePolicy(value.policy, defaults),
    spikeAlerts: sanitizeSpikeAlerts(value.spikeAlerts, defaults),
    logBudget: sanitizeLogBudget(value.logBudget, defaults),
    integrationOptions: sanitizeIntegrationList(value.integrationOptions),
    templates: sanitizeTemplateList(value.templates),
    selectedTemplateId:
      typeof value.selectedTemplateId === "string" ? value.selectedTemplateId : undefined
  };
}

export function getSafeStorage(): Storage | null {
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

export function readStoredState(
  storageKey: string,
  defaults: StoredStateDefaults
): Partial<StoredState> | null {
  const raw = getSafeStorage()?.getItem(storageKey);
  if (!raw) return null;
  return sanitizeStoredState(safeJsonParse(raw), defaults);
}
