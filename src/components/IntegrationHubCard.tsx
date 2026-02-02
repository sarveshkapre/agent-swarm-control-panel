import type { IntegrationOption } from "../types";

type IntegrationHubCardProps = {
  integrations: IntegrationOption[];
  onConnect: (id: string) => void;
};

const statusLabel: Record<IntegrationOption["status"], string> = {
  connected: "Connected",
  available: "Available",
  beta: "Beta"
};

export default function IntegrationHubCard({
  integrations,
  onConnect
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
          const buttonLabel = isConnected ? "Connected" : "Connect";
          return (
            <li key={integration.id} className="integration">
              <div>
                <div className="integration-title">
                  <h3>{integration.name}</h3>
                  <span className="muted">{integration.category}</span>
                </div>
                <p className="muted">{integration.description}</p>
                <p className="integration-benefit">{integration.benefit}</p>
              </div>
              <div className="integration-actions">
                <span className={`status-pill ${integration.status}`}>
                  {statusLabel[integration.status]}
                </span>
                <button
                  className={isConnected ? "ghost" : "primary"}
                  type="button"
                  onClick={() => onConnect(integration.id)}
                  disabled={isConnected}
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
