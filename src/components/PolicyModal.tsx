import type { Dispatch, RefObject, SetStateAction } from "react";
import type { LogBudget, PolicySettings, SpikeAlerts } from "../types";

type PolicyModalProps = {
  policy: PolicySettings;
  setPolicy: Dispatch<SetStateAction<PolicySettings>>;
  logBudget: LogBudget;
  setLogBudget: Dispatch<SetStateAction<LogBudget>>;
  spikeAlerts: SpikeAlerts;
  setSpikeAlerts: Dispatch<SetStateAction<SpikeAlerts>>;
  defaultPolicy: PolicySettings;
  defaultLogBudget: LogBudget;
  defaultSpikeAlerts: SpikeAlerts;
  onClose: () => void;
  panelRef: RefObject<HTMLDivElement>;
};

export default function PolicyModal({
  policy,
  setPolicy,
  logBudget,
  setLogBudget,
  spikeAlerts,
  setSpikeAlerts,
  defaultPolicy,
  defaultLogBudget,
  defaultSpikeAlerts,
  onClose,
  panelRef
}: PolicyModalProps) {
  return (
    <div className="modal">
      <button
        className="overlay-close"
        type="button"
        aria-label="Close policy editor"
        onClick={onClose}
      />
      <div
        className="modal-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-title"
      >
        <div className="drawer-header">
          <h2 id="policy-title">Policy editor</h2>
          <button className="ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label htmlFor="policy-mode">Policy mode</label>
            <select
              id="policy-mode"
              value={policy.mode}
              onChange={(event) => setPolicy((prev) => ({ ...prev, mode: event.target.value }))}
            >
              <option value="Approve-by-default">Approve-by-default</option>
              <option value="Approve-on-risk">Approve-on-risk</option>
              <option value="Manual-only">Manual-only</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="policy-sandbox">Sandbox</label>
            <select
              id="policy-sandbox"
              value={policy.sandbox}
              onChange={(event) =>
                setPolicy((prev) => ({
                  ...prev,
                  sandbox: event.target.value
                }))
              }
            >
              <option value="Workspace only">Workspace only</option>
              <option value="Workspace + network">Workspace + network</option>
              <option value="Full system">Full system</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="policy-timeouts">Timeouts</label>
            <select
              id="policy-timeouts"
              value={policy.timeouts}
              onChange={(event) =>
                setPolicy((prev) => ({
                  ...prev,
                  timeouts: event.target.value
                }))
              }
            >
              <option value="30m hard cap">30m hard cap</option>
              <option value="60m hard cap">60m hard cap</option>
              <option value="90m hard cap">90m hard cap</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="budget-warn">Warn budget (/hr)</label>
            <input
              id="budget-warn"
              type="number"
              value={logBudget.warnBudget}
              onChange={(event) =>
                setLogBudget((prev) => ({
                  ...prev,
                  warnBudget: Number(event.target.value)
                }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="budget-error">Error budget (/hr)</label>
            <input
              id="budget-error"
              type="number"
              value={logBudget.errorBudget}
              onChange={(event) =>
                setLogBudget((prev) => ({
                  ...prev,
                  errorBudget: Number(event.target.value)
                }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="spike-threshold">Spike threshold (errors)</label>
            <input
              id="spike-threshold"
              type="number"
              value={spikeAlerts.threshold}
              onChange={(event) =>
                setSpikeAlerts((prev) => ({
                  ...prev,
                  threshold: Number(event.target.value)
                }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="spike-window">Spike window (minutes)</label>
            <input
              id="spike-window"
              type="number"
              value={spikeAlerts.windowMinutes}
              onChange={(event) =>
                setSpikeAlerts((prev) => ({
                  ...prev,
                  windowMinutes: Number(event.target.value)
                }))
              }
            />
          </div>
          <div className="toggle-grid">
            <label className="toggle">
              <input
                type="checkbox"
                checked={policy.pauseNewRuns}
                onChange={(event) =>
                  setPolicy((prev) => ({
                    ...prev,
                    pauseNewRuns: event.target.checked
                  }))
                }
              />
              <span>Emergency stop (pause new runs)</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={policy.requireCitations}
                onChange={(event) =>
                  setPolicy((prev) => ({
                    ...prev,
                    requireCitations: event.target.checked
                  }))
                }
              />
              <span>Require citations</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={policy.allowExternal}
                onChange={(event) =>
                  setPolicy((prev) => ({
                    ...prev,
                    allowExternal: event.target.checked
                  }))
                }
              />
              <span>Allow external HTTP</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={policy.allowRepoWrites}
                onChange={(event) =>
                  setPolicy((prev) => ({
                    ...prev,
                    allowRepoWrites: event.target.checked
                  }))
                }
              />
              <span>Allow repo writes</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={policy.allowDeploy}
                onChange={(event) =>
                  setPolicy((prev) => ({
                    ...prev,
                    allowDeploy: event.target.checked
                  }))
                }
              />
              <span>Allow deploys</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={policy.piiRedaction}
                onChange={(event) =>
                  setPolicy((prev) => ({
                    ...prev,
                    piiRedaction: event.target.checked
                  }))
                }
              />
              <span>PII redaction</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={policy.evidenceBundle}
                onChange={(event) =>
                  setPolicy((prev) => ({
                    ...prev,
                    evidenceBundle: event.target.checked
                  }))
                }
              />
              <span>Evidence bundles</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={spikeAlerts.enabled}
                onChange={(event) =>
                  setSpikeAlerts((prev) => ({
                    ...prev,
                    enabled: event.target.checked
                  }))
                }
              />
              <span>Spike alerts enabled</span>
            </label>
          </div>
        </div>
        <div className="drawer-actions">
          <button
            className="ghost"
            onClick={() => {
              setPolicy(defaultPolicy);
              setLogBudget(defaultLogBudget);
              setSpikeAlerts(defaultSpikeAlerts);
            }}
          >
            Reset
          </button>
          <button className="primary" onClick={onClose}>
            Save policy
          </button>
        </div>
      </div>
    </div>
  );
}
