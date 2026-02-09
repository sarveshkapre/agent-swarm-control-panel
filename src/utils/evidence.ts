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

export type EvidenceVerificationResult = {
  ok: boolean;
  algorithm: EvidenceExportPayload["integrity"]["algorithm"];
  expectedDigest: string | null;
  actualDigest: string | null;
  message: string;
};

function stripEvidenceMeta(payload: EvidenceExportPayload): EvidenceCorePayload {
  // Preserve key insertion order from the export (schemaVersion + integrity are prepended).
  // The evidence digest is computed over the "core" payload only.
  const core = { ...payload } as Record<string, unknown>;
  delete core.evidenceSchemaVersion;
  delete core.integrity;
  return core as unknown as EvidenceCorePayload;
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

export async function verifyEvidenceExportPayload(
  payload: EvidenceExportPayload
): Promise<EvidenceVerificationResult> {
  const expectedDigest = payload.integrity.digest;

  if (payload.integrity.algorithm !== "SHA-256") {
    return {
      ok: false,
      algorithm: payload.integrity.algorithm,
      expectedDigest,
      actualDigest: null,
      message:
        payload.integrity.algorithm === "none"
          ? "Evidence pack was exported without a checksum (crypto unavailable)."
          : "Evidence pack uses an unsupported integrity algorithm."
    };
  }

  if (!expectedDigest || !expectedDigest.startsWith("sha256:")) {
    return {
      ok: false,
      algorithm: payload.integrity.algorithm,
      expectedDigest,
      actualDigest: null,
      message: "Evidence pack is missing a SHA-256 digest."
    };
  }

  const core = stripEvidenceMeta(payload);
  const serialized = JSON.stringify(core);
  const actualHex = await sha256Hex(serialized);
  if (!actualHex) {
    return {
      ok: false,
      algorithm: payload.integrity.algorithm,
      expectedDigest,
      actualDigest: null,
      message: "Unable to compute checksum in this environment."
    };
  }

  const actualDigest = `sha256:${actualHex}`;
  const ok = actualDigest === expectedDigest;
  return {
    ok,
    algorithm: payload.integrity.algorithm,
    expectedDigest,
    actualDigest,
    message: ok ? "Checksum verified." : "Checksum mismatch."
  };
}
