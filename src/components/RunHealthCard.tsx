import type { Run, RunHealthSummary } from "../types";

type RunHealthCardProps = {
  summary: RunHealthSummary;
  atRiskRuns: Run[];
  onViewRun: (run: Run) => void;
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export default function RunHealthCard({
  summary,
  atRiskRuns,
  onViewRun
}: RunHealthCardProps) {
  return (
    <div className="card run-health">
      <div className="card-header">
        <h2>Run health summary</h2>
        <span className="hint">Live state snapshot</span>
      </div>
      <div className="summary-grid">
        <div>
          <p className="muted">At-risk runs</p>
          <strong>{summary.atRiskRuns}</strong>
          <p className="muted">Breached: {summary.breachedRuns}</p>
        </div>
        <div>
          <p className="muted">Approvals pending</p>
          <strong>{summary.pendingApprovals}</strong>
          <p className="muted">Queued runs: {summary.queuedRuns}</p>
        </div>
        <div>
          <p className="muted">Error logs</p>
          <strong>{summary.errorLogs}</strong>
          <p className="muted">Across {summary.totalRuns} total runs</p>
        </div>
        <div>
          <p className="muted">Spend at risk</p>
          <strong>{formatUsd(summary.spendAtRisk)}</strong>
          <p className="muted">Estimated from at-risk runs</p>
        </div>
      </div>
      <div className="run-health-list">
        <p className="muted">Runs needing attention</p>
        {atRiskRuns.length === 0 ? (
          <p className="muted">No at-risk runs right now.</p>
        ) : (
          <ul className="stack">
            {atRiskRuns.map((run) => (
              <li key={run.id} className="run-health-item">
                <span>
                  {run.id} · {run.objective}
                </span>
                <button className="ghost" type="button" onClick={() => onViewRun(run)}>
                  View
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
