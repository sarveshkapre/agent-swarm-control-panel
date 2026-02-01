import type { RefObject } from "react";
import type { PolicySettings } from "../types";

type ControlSurfaceCardProps = {
  policy: PolicySettings;
  onOpenPolicy: () => void;
  onExportState: () => void;
  onImportClick: () => void;
  onImportFile: (file: File | null) => void;
  importInputRef: RefObject<HTMLInputElement>;
};

export default function ControlSurfaceCard({
  policy,
  onOpenPolicy,
  onExportState,
  onImportClick,
  onImportFile,
  importInputRef
}: ControlSurfaceCardProps) {
  return (
    <div className="card control">
      <h2>Control surface</h2>
      <p className="muted">
        Guardrails are enforced before any agent can touch external tools, files, or
        deployments.
      </p>
      <div className="control-grid">
        <div>
          <p className="muted">Policy mode</p>
          <strong>{policy.mode}</strong>
        </div>
        <div>
          <p className="muted">Sandbox</p>
          <strong>{policy.sandbox}</strong>
        </div>
        <div>
          <p className="muted">Timeouts</p>
          <strong>{policy.timeouts}</strong>
        </div>
        <div>
          <p className="muted">Export bundle</p>
          <strong>{policy.evidenceBundle ? "Evidence pack ready" : "Disabled"}</strong>
        </div>
      </div>
      <div className="control-actions">
        <button className="primary" onClick={onOpenPolicy} type="button">
          Open policy editor
        </button>
        <button className="ghost" onClick={onExportState} type="button">
          Export state
        </button>
        <button className="ghost" onClick={onImportClick} type="button">
          Import state
        </button>
        <input
          ref={importInputRef}
          className="file-input"
          type="file"
          accept="application/json"
          onChange={(event) => onImportFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <p className="hint">Tip: Press N to queue a run.</p>
    </div>
  );
}
