import type {
  Agent,
  Approval,
  LogBudget,
  LogEntry,
  PolicySettings,
  Run,
  RunHealthSummary,
  RunStatus,
  SpikeAlerts
} from "../types";

type EvidenceCorePayload = {
  generatedAt: string;
  policy: PolicySettings;
  runHealthSummary: RunHealthSummary;
  agents: Agent[];
  runs: Run[];
  queuedRuns: Run[];
  runOverrides: Record<string, RunStatus>;
  approvals: Approval[];
  logs: LogEntry[];
  logBudget: LogBudget;
  spikeAlerts: SpikeAlerts;
};

export type EvidenceExportPayload = EvidenceCorePayload & {
  evidenceSchemaVersion: number;
  integrity: {
    algorithm: "SHA-256" | "none";
    digest: string | null;
    computedAt: string;
  };
};

async function sha256Hex(value: string) {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildEvidenceExportPayload(
  payload: EvidenceCorePayload
): Promise<EvidenceExportPayload> {
  const serialized = JSON.stringify(payload);
  const hash = await sha256Hex(serialized);
  const computedAt = new Date().toISOString();

  return {
    evidenceSchemaVersion: 2,
    integrity: hash
      ? {
          algorithm: "SHA-256",
          digest: `sha256:${hash}`,
          computedAt
        }
      : {
          algorithm: "none",
          digest: null,
          computedAt
        },
    ...payload
  };
}
