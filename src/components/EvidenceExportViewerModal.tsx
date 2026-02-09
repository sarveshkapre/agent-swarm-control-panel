import type { RefObject } from "react";
import type { EvidenceExportPayload } from "../utils/evidence";

type EvidenceExportViewerModalProps = {
  payload: EvidenceExportPayload | null;
  loading: boolean;
  error: string | null;
  onCopyJson: () => void;
  onCopyDigest: () => void;
  onDownload: () => void;
  onClose: () => void;
  panelRef: RefObject<HTMLDivElement>;
};

function formatDigestPreview(value: string | null) {
  if (!value) return "—";
  return value.length > 30 ? `${value.slice(0, 30)}...` : value;
}

export default function EvidenceExportViewerModal({
  payload,
  loading,
  error,
  onCopyJson,
  onCopyDigest,
  onDownload,
  onClose,
  panelRef
}: EvidenceExportViewerModalProps) {
  const schemaVersion =
    payload && typeof payload.evidenceSchemaVersion === "number"
      ? payload.evidenceSchemaVersion
      : null;
  const algorithm = payload?.integrity?.algorithm ?? null;
  const digest = payload?.integrity?.digest ?? null;
  const generatedAt = payload?.generatedAt ?? null;
  const jsonPreview = payload ? JSON.stringify(payload, null, 2) : "";

  return (
    <div className="modal">
      <button
        className="overlay-close"
        type="button"
        aria-label="Close evidence export viewer"
        onClick={onClose}
      />
      <div
        className="modal-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-export-title"
      >
        <div className="drawer-header">
          <h2 id="evidence-export-title">Evidence export</h2>
          <button className="ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="modal-body">
          {loading ? <p className="muted">Preparing export preview...</p> : null}
          {error ? (
            <div className="verify-result" role="status" aria-live="polite">
              <div className="verify-result-header">
                <span className="pill high">FAILED</span>
                <strong>Unable to build export</strong>
              </div>
              <p className="muted">{error}</p>
            </div>
          ) : null}

          {payload ? (
            <>
              <div className="verify-grid">
                <div>
                  <p className="muted">Schema</p>
                  <strong>{schemaVersion ?? "—"}</strong>
                </div>
                <div>
                  <p className="muted">Generated</p>
                  <strong className="mono">{generatedAt ?? "—"}</strong>
                </div>
                <div>
                  <p className="muted">Algorithm</p>
                  <strong>{algorithm ?? "—"}</strong>
                </div>
                <div>
                  <p className="muted">Digest</p>
                  <strong className="mono">{formatDigestPreview(digest)}</strong>
                </div>
                <div>
                  <p className="muted">Runs</p>
                  <strong>{payload.runs.length}</strong>
                </div>
                <div>
                  <p className="muted">Approvals</p>
                  <strong>{payload.approvals.length}</strong>
                </div>
              </div>

              <div className="composer-actions">
                <button className="ghost" type="button" onClick={onCopyDigest}>
                  Copy checksum
                </button>
                <button className="ghost" type="button" onClick={onCopyJson}>
                  Copy JSON
                </button>
                <button className="primary" type="button" onClick={onDownload}>
                  Download JSON
                </button>
              </div>

              <div className="field">
                <p className="muted">Preview</p>
                <pre className="code-block mono">{jsonPreview}</pre>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
