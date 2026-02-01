import type { RefObject } from "react";
import type { Approval, LogEntry, Run } from "../types";

type RunDetailDrawerProps = {
  run: Run;
  logs: LogEntry[];
  approvals: Approval[];
  onClose: () => void;
  panelRef: RefObject<HTMLDivElement>;
};

export default function RunDetailDrawer({
  run,
  logs,
  approvals,
  onClose,
  panelRef
}: RunDetailDrawerProps) {
  return (
    <div className="drawer">
      <button
        className="overlay-close"
        type="button"
        aria-label="Close run details"
        onClick={onClose}
      />
      <div
        className="drawer-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-detail-title"
      >
        <div className="drawer-header">
          <h2 id="run-detail-title">Run details</h2>
          <button className="ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="drawer-body">
          <div>
            <p className="eyebrow">{run.id}</p>
            <h3>{run.objective}</h3>
            <p className="muted">
              Owner {run.owner} · {run.startedAt}
            </p>
            <div className={`pill ${run.status}`}>
              {run.status.toUpperCase()} · {run.costEstimate}
            </div>
          </div>
          <div className="drawer-section">
            <h4>Agents</h4>
            <p className="muted">{run.agents.join(", ")}</p>
          </div>
          <div className="drawer-section">
            <h4>Recent logs</h4>
            {logs.length === 0 ? (
              <p className="muted">No recent logs for this run.</p>
            ) : (
              <ul className="stack">
                {logs.map((log) => (
                  <li key={log.id}>
                    <p className="approval-title">{log.agent}</p>
                    <p className="muted">{log.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="drawer-section">
            <h4>Approval requests</h4>
            {approvals.length === 0 ? (
              <p className="muted">No approvals tied to this run.</p>
            ) : (
              <ul className="stack">
                {approvals.map((approval) => (
                  <li key={approval.id}>
                    <p className="approval-title">{approval.title}</p>
                    <p className="muted">
                      {approval.requestedBy} · {approval.scope}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
