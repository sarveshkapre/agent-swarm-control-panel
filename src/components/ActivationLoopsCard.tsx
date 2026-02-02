import type { ActivationLoop } from "../types";

type ActivationLoopsCardProps = {
  loops: ActivationLoop[];
  onToggle: (id: string) => void;
};

const statusLabel: Record<ActivationLoop["status"], string> = {
  live: "Live",
  paused: "Paused",
  planned: "Planned"
};

export default function ActivationLoopsCard({ loops, onToggle }: ActivationLoopsCardProps) {
  return (
    <section className="card activation-loops" aria-labelledby="activation-loops-title">
      <div className="card-header">
        <div>
          <p className="eyebrow subtle">Growth loops</p>
          <h2 id="activation-loops-title">Activation engine</h2>
        </div>
        <button className="ghost" type="button">
          Add loop
        </button>
      </div>
      <ul className="loop-list">
        {loops.map((loop) => {
          const isLive = loop.status === "live";
          const actionLabel = isLive ? "Pause" : "Activate";
          return (
            <li key={loop.id} className="loop">
              <div className="loop-main">
                <div>
                  <div className="loop-title-row">
                    <h3>{loop.title}</h3>
                    <span className={`status-pill ${loop.status}`}>
                      {statusLabel[loop.status]}
                    </span>
                  </div>
                  <p className="muted">{loop.description}</p>
                </div>
                <div className="loop-actions">
                  <button
                    className={isLive ? "ghost" : "primary"}
                    type="button"
                    aria-pressed={isLive}
                    onClick={() => onToggle(loop.id)}
                  >
                    {actionLabel}
                  </button>
                </div>
              </div>
              <div className="loop-meta">
                <span className="pill muted">Owner: {loop.owner}</span>
                <span className="pill success">{loop.impact}</span>
                <span className="muted">Next: {loop.nextStep}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
