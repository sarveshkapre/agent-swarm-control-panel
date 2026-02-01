import type { Approval } from "../types";

type OverviewSectionProps = {
  approvals: Approval[];
  onViewAll: () => void;
  onSelectApproval: (approval: Approval) => void;
};

export default function OverviewSection({
  approvals,
  onViewAll,
  onSelectApproval
}: OverviewSectionProps) {
  return (
    <section className="overview">
      <div className="card summary">
        <h2>Swarm status</h2>
        <div className="summary-grid">
          <div>
            <p className="muted">Active agents</p>
            <strong>3</strong>
          </div>
          <div>
            <p className="muted">Runs in flight</p>
            <strong>2</strong>
          </div>
          <div>
            <p className="muted">Approvals waiting</p>
            <strong>2</strong>
          </div>
          <div>
            <p className="muted">Spend today</p>
            <strong>$32.11</strong>
          </div>
        </div>
      </div>
      <div className="card approvals">
        <div className="card-header">
          <h2>Approval inbox</h2>
          <button className="ghost" onClick={onViewAll}>
            View all
          </button>
        </div>
        <ul>
          {approvals.map((approval) => (
            <li key={approval.id} className="approval">
              <button
                className="approval-button"
                onClick={() => onSelectApproval(approval)}
              >
                <div>
                  <p className="approval-title">{approval.title}</p>
                  <p className="muted">
                    {approval.requestedBy} · {approval.scope}
                  </p>
                </div>
                <div className={`pill ${approval.risk}`}>
                  {approval.risk.toUpperCase()} · {approval.requestedAt}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
