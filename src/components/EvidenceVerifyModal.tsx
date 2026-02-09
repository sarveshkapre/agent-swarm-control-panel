import type { ChangeEvent, RefObject } from "react";

export type EvidenceVerifySummary = {
  tone: "low" | "medium" | "high" | "muted";
  title: string;
  message: string;
  schemaVersion: number | null;
  algorithm: string | null;
  expectedDigest: string | null;
  actualDigest: string | null;
};

type EvidenceVerifyModalProps = {
  value: string;
  onValueChange: (value: string) => void;
  onLoadFile: (file: File | null) => void;
  onVerify: () => void;
  onClear: () => void;
  onClose: () => void;
  result: EvidenceVerifySummary | null;
  panelRef: RefObject<HTMLDivElement>;
};

function formatDigestPreview(value: string | null) {
  if (!value) return "—";
  return value.length > 22 ? `${value.slice(0, 22)}...` : value;
}

export default function EvidenceVerifyModal({
  value,
  onValueChange,
  onLoadFile,
  onVerify,
  onClear,
  onClose,
  result,
  panelRef
}: EvidenceVerifyModalProps) {
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onLoadFile(event.target.files?.[0] ?? null);
    // Allow selecting the same file twice.
    event.target.value = "";
  };

  return (
    <div className="modal">
      <button
        className="overlay-close"
        type="button"
        aria-label="Close evidence verification"
        onClick={onClose}
      />
      <div
        className="modal-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-evidence-title"
      >
        <div className="drawer-header">
          <h2 id="verify-evidence-title">Verify evidence pack</h2>
          <button className="ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label htmlFor="evidence-json">Evidence JSON</label>
            <textarea
              id="evidence-json"
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              placeholder="Paste an exported agent-swarm-evidence-pack.json payload here."
              rows={10}
            />
          </div>
          <div className="composer-actions">
            <label className="ghost file-button">
              Upload JSON
              <input type="file" accept="application/json" onChange={onFileChange} />
            </label>
            <button className="primary" type="button" onClick={onVerify}>
              Verify checksum
            </button>
            <button className="ghost" type="button" onClick={onClear}>
              Clear
            </button>
          </div>

          {result ? (
            <div className="verify-result" role="status" aria-live="polite">
              <div className="verify-result-header">
                <span className={`pill ${result.tone}`}>
                  {result.tone === "low"
                    ? "VERIFIED"
                    : result.tone === "medium"
                      ? "WARNING"
                      : "FAILED"}
                </span>
                <strong>{result.title}</strong>
              </div>
              <p className="muted">{result.message}</p>
              <div className="verify-grid">
                <div>
                  <p className="muted">Schema</p>
                  <strong>{result.schemaVersion ?? "—"}</strong>
                </div>
                <div>
                  <p className="muted">Algorithm</p>
                  <strong>{result.algorithm ?? "—"}</strong>
                </div>
                <div>
                  <p className="muted">Expected</p>
                  <strong className="mono">{formatDigestPreview(result.expectedDigest)}</strong>
                </div>
                <div>
                  <p className="muted">Computed</p>
                  <strong className="mono">{formatDigestPreview(result.actualDigest)}</strong>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

