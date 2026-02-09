import type { RefObject } from "react";
import type { Approval } from "../types";

type ApprovalDetail = {
  riskNotes: string[];
  scopeDiff: { label: string; change: "add" | "remove" | "update" }[];
  checklist: string[];
};

type ApprovalDrawerProps = {
  approval: Approval;
  approvalDetail: ApprovalDetail | null;
  onClose: () => void;
  onCopyLink?: () => void;
  onDeny: () => void;
  onApprove: () => void;
  panelRef: RefObject<HTMLDivElement>;
};

export default function ApprovalDrawer({
  approval,
  approvalDetail,
  onClose,
  onCopyLink,
  onDeny,
  onApprove,
  panelRef
}: ApprovalDrawerProps) {
  return (
    <div className="drawer">
      <button
        className="overlay-close"
        type="button"
        aria-label="Close approval drawer"
        onClick={onClose}
      />
      <div
        className="drawer-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="drawer-header">
          <h2 id="drawer-title">Approval request</h2>
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
            <p className="eyebrow">{approval.id}</p>
            <h3>{approval.title}</h3>
            <p className="muted">
              Requested by {approval.requestedBy} · {approval.requestedAt}
            </p>
            <div className={`pill ${approval.risk}`}>
              {approval.risk.toUpperCase()} risk
            </div>
          </div>
          <div className="drawer-section">
            <h4>Scope summary</h4>
            <p className="muted">{approval.scope}</p>
            <div className="diff-list">
              {approvalDetail?.scopeDiff.map((item) => (
                <div key={item.label} className={`diff ${item.change}`}>
                  <span>
                    {item.change === "add" ? "+" : item.change === "remove" ? "-" : "~"}
                  </span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="drawer-section">
            <h4>Risk notes</h4>
            <ul className="stack">
              {approvalDetail?.riskNotes.map((note) => (
                <li key={note} className="muted">
                  {note}
                </li>
              ))}
            </ul>
          </div>
          <div className="drawer-section">
            <h4>Approval checklist</h4>
            <ul className="stack">
              {approvalDetail?.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="drawer-actions">
          <button className="ghost" onClick={onDeny} type="button">
            Deny
          </button>
          <button className="primary" onClick={onApprove} type="button">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
