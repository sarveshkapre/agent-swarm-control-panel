import type { RefObject } from "react";
import type {
  Approval,
  LogEntry,
  Run,
  RunActivity,
  RunAnnotation,
  RunPhase,
  RunTraceSpan
} from "../types";
import TraceWaterfall from "./TraceWaterfall";

type RunDetailDrawerProps = {
  run: Run;
  logs: LogEntry[];
  approvals: Approval[];
  timeline: RunPhase[];
  activity: RunActivity[];
  trace: RunTraceSpan[];
  annotations: RunAnnotation[];
  annotationNote: string;
  annotationTags: string;
  onAnnotationNoteChange: (value: string) => void;
  onAnnotationTagsChange: (value: string) => void;
  onAddAnnotation: () => void;
  onCopyHandoff?: () => void;
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
  annotations,
  annotationNote,
  annotationTags,
  onAnnotationNoteChange,
  onAnnotationTagsChange,
  onAddAnnotation,
  onCopyHandoff,
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
            {onCopyHandoff ? (
              <button className="ghost" onClick={onCopyHandoff} type="button">
                Copy handoff
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
          <div className="drawer-section">
            <h4>Operator notes & tags</h4>
            <div className="field">
              <label htmlFor="run-note">Note</label>
              <textarea
                id="run-note"
                rows={3}
                value={annotationNote}
                onChange={(event) => onAnnotationNoteChange(event.target.value)}
                placeholder="Capture a triage note, blocker, or handoff context."
              />
            </div>
            <div className="field">
              <label htmlFor="run-note-tags">Tags (comma or newline separated)</label>
              <textarea
                id="run-note-tags"
                rows={2}
                value={annotationTags}
                onChange={(event) => onAnnotationTagsChange(event.target.value)}
                placeholder="blocked, compliance, qa"
              />
            </div>
            <button className="primary" type="button" onClick={onAddAnnotation}>
              Save note
            </button>
            {annotations.length === 0 ? (
              <p className="muted">No notes yet for this run.</p>
            ) : (
              <ul className="stack note-list">
                {annotations.map((annotation) => (
                  <li key={annotation.id} className="note-item">
                    <p>{annotation.note}</p>
                    <p className="muted">
                      {annotation.author} · {new Date(annotation.createdAtIso).toLocaleString()}
                    </p>
                    {annotation.tags.length > 0 ? (
                      <div className="run-tags">
                        {annotation.tags.map((tag) => (
                          <span key={`${annotation.id}-${tag}`} className="pill muted">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
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
