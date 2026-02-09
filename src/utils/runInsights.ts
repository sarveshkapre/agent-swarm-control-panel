import type { Run, RunActivity } from "../types";

export type RunSlaBadge = {
  label: string;
  tone: "low" | "medium" | "high" | "muted";
};

function parseIsoTimestamp(value: string | undefined) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function getActivityBounds(activity: RunActivity[]) {
  const timestamps = activity
    .map((event) => parseIsoTimestamp(event.occurredAtIso))
    .filter((value): value is number => typeof value === "number");
  if (timestamps.length === 0) return null;
  return {
    firstMs: Math.min(...timestamps),
    lastMs: Math.max(...timestamps)
  };
}

export function getRunDurationMinutes(run: Run, activity: RunActivity[], nowMs: number) {
  const activityBounds = getActivityBounds(activity);
  const startMs = parseIsoTimestamp(run.createdAtIso) ?? activityBounds?.firstMs ?? null;
  if (startMs === null) return null;

  const endMs =
    run.status === "completed" || run.status === "failed"
      ? activityBounds?.lastMs ?? nowMs
      : nowMs;
  if (endMs < startMs) return null;
  return Math.floor((endMs - startMs) / 60_000);
}

export function getRunSlaBadge(run: Run, durationMinutes: number | null): RunSlaBadge {
  if (run.status === "completed") return { label: "Met", tone: "low" };
  if (run.status === "failed") return { label: "Breached", tone: "high" };
  if (run.status === "queued") return { label: "Pending", tone: "muted" };

  if (run.status === "waiting") {
    if (durationMinutes === null) return { label: "Waiting", tone: "muted" };
    return durationMinutes > 30
      ? { label: "At risk", tone: "medium" }
      : { label: "Waiting", tone: "muted" };
  }

  if (run.status === "running") {
    if (durationMinutes === null) return { label: "On track", tone: "low" };
    return durationMinutes > 60
      ? { label: "At risk", tone: "medium" }
      : { label: "On track", tone: "low" };
  }

  return { label: "—", tone: "muted" };
}

export function formatRunDurationLabel(run: Run, durationMinutes: number | null) {
  if (durationMinutes !== null) {
    if (durationMinutes < 60) return `${durationMinutes}m`;
    const hours = Math.floor(durationMinutes / 60);
    const remainder = durationMinutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  }
  if (run.status === "queued") return "Queued now";
  if (run.status === "waiting") return "Queued";
  if (run.status === "running") return "In progress";
  return "—";
}
