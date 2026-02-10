import type { RefObject } from "react";
import type { Approval, LogEntry, Run, RunActivity, RunPhase, RunTraceSpan } from "../types";
import TraceWaterfall from "./TraceWaterfall";

type RunDetailDrawerProps = {
  run: Run;
  logs: LogEntry[];
  approvals: Approval[];
  timeline: RunPhase[];
  activity: RunActivity[];
  trace: RunTraceSpan[];
  onClose: () => void;
  onCopyLink?: () => void;
  panelRef: RefObject<HTMLDivElement>;
};

export default function RunDetailDrawer({
  run,
  logs,
  approvals,
  timeline,
  activity,
  trace,
  onClose,
  onCopyLink,
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
          <div className="drawer-header-actions">
            {onCopyLink ? (
              <button className="ghost" onClick={onCopyLink} type="button">
                Copy link
              </button>
            ) : null}
            <button className="ghost" onClick={onClose} type="button">
              Close
            </button>
          </div>
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
            <h4>Timeline</h4>
            <ul className="timeline">
              {timeline.map((phase) => {
                const detail = [phase.time, phase.note].filter(Boolean).join(" · ");
                return (
                  <li key={phase.label} className={`timeline-item ${phase.status}`}>
                    <span className="timeline-marker" aria-hidden="true" />
                    <div>
                      <p className="approval-title">{phase.label}</p>
                      <p className="muted">
                        {detail || (phase.status === "upcoming" ? "Pending" : "—")}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="drawer-section">
            <h4>Trace waterfall</h4>
            <TraceWaterfall spans={trace} />
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
          <div className="drawer-section">
            <h4>Activity feed</h4>
            {activity.length === 0 ? (
              <p className="muted">No recent activity logged.</p>
            ) : (
              <ul className="activity">
                {activity.map((item) => (
                  <li key={item.id} className="activity-item">
                    <span className={`pill ${item.type}`}>{item.type}</span>
                    <div>
                      <p className="approval-title">{item.title}</p>
                      <p className="muted">
                        {item.detail} · {item.timestamp}
                      </p>
                    </div>
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
