import type { ValueMetric } from "../types";

type OutcomeScorecardProps = {
  metrics: ValueMetric[];
};

const formatValue = (value: number, unit: string) =>
  `${value}${unit ? unit : ""}`;

const getProgress = (metric: ValueMetric) => {
  if (metric.target <= 0) return 0;
  return Math.min(100, Math.round((metric.current / metric.target) * 100));
};

const trendLabel: Record<ValueMetric["trend"], string> = {
  up: "Trending up",
  down: "Trending down",
  flat: "Stable"
};

export default function OutcomeScorecard({ metrics }: OutcomeScorecardProps) {
  return (
    <section className="card outcome-scorecard" aria-labelledby="outcome-scorecard-title">
      <div className="card-header">
        <div>
          <p className="eyebrow subtle">Value momentum</p>
          <h2 id="outcome-scorecard-title">Outcome scorecard</h2>
        </div>
        <button className="ghost" type="button">
          Share update
        </button>
      </div>
      <ul className="metric-list">
        {metrics.map((metric) => {
          const progress = getProgress(metric);
          return (
            <li key={metric.id} className="metric">
              <div className="metric-row">
                <div>
                  <p className="metric-label">{metric.label}</p>
                  <p className="muted">{metric.note}</p>
                </div>
                <div className={`trend ${metric.trend}`} aria-label={trendLabel[metric.trend]}>
                  <span>{metric.delta}</span>
                </div>
              </div>
              <div
                className="metric-progress"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="metric-target">
                <strong>{formatValue(metric.current, metric.unit)}</strong>
                <span className="muted">
                  {" "}
                  / {formatValue(metric.target, metric.unit)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
