import type { Approval } from "../types";

type ApprovalPreview = Approval & { decision: string };

type ApprovalSimulationCardProps = {
  autoApproveRisk: Approval["risk"];
  onAutoApproveRiskChange: (value: Approval["risk"]) => void;
  policyMode: string;
  autoApprovalPreview: ApprovalPreview[];
};

export default function ApprovalSimulationCard({
  autoApproveRisk,
  onAutoApproveRiskChange,
  policyMode,
  autoApprovalPreview
}: ApprovalSimulationCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Approval policy simulation</h2>
        <span className="hint">Preview what auto-approves before enabling it.</span>
      </div>
      <div className="simulation-controls">
        <label className="field">
          <span>Auto-approve up to</span>
          <select
            value={autoApproveRisk}
            onChange={(event) => onAutoApproveRiskChange(event.target.value as Approval["risk"])}
          >
            <option value="low">Low risk</option>
            <option value="medium">Medium risk</option>
            <option value="high">High risk</option>
          </select>
        </label>
        <div className="pill muted">Mode: {policyMode}</div>
      </div>
      <div className="simulation-list">
        {autoApprovalPreview.map((approval) => (
          <div key={approval.id} className="simulation-item">
            <div>
              <p className="approval-title">{approval.title}</p>
              <p className="muted">{approval.scope}</p>
            </div>
            <div className="simulation-meta">
              <span className={`pill ${approval.risk}`}>{approval.risk}</span>
              <span className={`pill ${approval.decision === "Auto-approve" ? "low" : "high"}`}>
                {approval.decision}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
