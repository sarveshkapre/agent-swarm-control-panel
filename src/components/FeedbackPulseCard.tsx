import type { FeedbackSignal } from "../types";

type FeedbackPulseCardProps = {
  signals: FeedbackSignal[];
  onBoost: (id: string) => void;
};

const priorityLabel: Record<FeedbackSignal["priority"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low"
};

export default function FeedbackPulseCard({ signals, onBoost }: FeedbackPulseCardProps) {
  return (
    <section className="card feedback-pulse" aria-labelledby="feedback-pulse-title">
      <div className="card-header">
        <div>
          <p className="eyebrow subtle">Customer signal</p>
          <h2 id="feedback-pulse-title">Feedback radar</h2>
        </div>
        <button className="ghost" type="button">
          Sync notes
        </button>
      </div>
      <ul className="signal-list">
        {signals.map((signal) => (
          <li key={signal.id} className="signal">
            <div>
              <div className="signal-title">
                <h3>{signal.request}</h3>
                <span className={`status-pill ${signal.priority}`}>
                  {priorityLabel[signal.priority]}
                </span>
              </div>
              <p className="muted">
                {signal.source} · {signal.segment}
              </p>
            </div>
            <div className="signal-actions">
              <div className="signal-votes">
                <span className="pill muted">{signal.votes} votes</span>
              </div>
              <button className="ghost" type="button" onClick={() => onBoost(signal.id)}>
                Boost
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
