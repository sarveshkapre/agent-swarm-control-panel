import type { IntegrationOption } from "../types";

type IntegrationHubCardProps = {
  integrations: IntegrationOption[];
  onConnect: (id: string) => void;
  onReconnect: (id: string) => void;
};

const statusLabel: Record<IntegrationOption["status"], string> = {
  connected: "Connected",
  available: "Available",
  beta: "Beta"
};

function formatLastSync(lastSyncAtIso: string | null) {
  if (!lastSyncAtIso) return "Not synced yet";
  const parsed = Date.parse(lastSyncAtIso);
  if (!Number.isFinite(parsed)) return "Unknown";
  const minutes = Math.round((Date.now() - parsed) / 60_000);
  if (minutes <= 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const syncLabel: Record<IntegrationOption["sync"]["state"], string> = {
  healthy: "Healthy",
  stale: "Stale",
  error: "Error",
  disconnected: "Disconnected"
};

const syncTone: Record<IntegrationOption["sync"]["state"], string> = {
  healthy: "connected",
  stale: "medium",
  error: "high",
  disconnected: "muted"
};

export default function IntegrationHubCard({
  integrations,
  onConnect,
  onReconnect
}: IntegrationHubCardProps) {
  return (
    <section className="card integration-hub" aria-labelledby="integration-hub-title">
      <div className="card-header">
        <div>
          <p className="eyebrow subtle">Integrations</p>
          <h2 id="integration-hub-title">Launchpad</h2>
        </div>
        <button className="ghost" type="button">
          Browse all
        </button>
      </div>
      <ul className="integration-list">
        {integrations.map((integration) => {
          const isConnected = integration.status === "connected";
          const isError = isConnected && integration.sync.state === "error";
          const buttonLabel = isError ? "Reconnect" : isConnected ? "Connected" : "Connect";
          const buttonClass = isError ? "primary" : isConnected ? "ghost" : "primary";
          return (
            <li key={integration.id} className="integration">
              <div>
                <div className="integration-title">
                  <h3>{integration.name}</h3>
                  <span className="muted">{integration.category}</span>
                </div>
                <p className="muted">{integration.description}</p>
                <p className="integration-benefit">{integration.benefit}</p>
                <p className="muted">
                  Sync:{" "}
                  <span className={`status-pill ${syncTone[integration.sync.state]}`}>
                    {syncLabel[integration.sync.state]}
                  </span>{" "}
                  · Last sync: {formatLastSync(integration.sync.lastSyncAtIso)}
                  {integration.sync.lastError ? ` · ${integration.sync.lastError}` : ""}
                </p>
              </div>
              <div className="integration-actions">
                <span className={`status-pill ${integration.status}`}>
                  {statusLabel[integration.status]}
                </span>
                <button
                  className={buttonClass}
                  type="button"
                  onClick={() =>
                    isError ? onReconnect(integration.id) : onConnect(integration.id)
                  }
                  disabled={isConnected && !isError}
                >
                  {buttonLabel}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
