import type { RunTraceSpan } from "../types";

type TraceWaterfallProps = {
  spans: RunTraceSpan[];
};

function formatMs(value: number) {
  if (value < 1000) return `${value}ms`;
  const seconds = value / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${minutes}m ${remainder.toFixed(0)}s`;
}

export default function TraceWaterfall({ spans }: TraceWaterfallProps) {
  if (spans.length === 0) {
    return <p className="muted">No trace spans captured for this run.</p>;
  }

  const sorted = [...spans].sort((a, b) => a.startOffsetMs - b.startOffsetMs);
  const totalMs = sorted.reduce((max, span) => {
    const end = span.startOffsetMs + span.durationMs;
    return end > max ? end : max;
  }, 0);
  const safeTotalMs = totalMs > 0 ? totalMs : 1;

  return (
    <div className="trace-waterfall" role="list">
      {sorted.map((span) => {
        const leftPct = (span.startOffsetMs / safeTotalMs) * 100;
        const widthPct = Math.max((span.durationMs / safeTotalMs) * 100, 1.5);
        return (
          <div key={span.id} className="trace-row" role="listitem">
            <div className="trace-meta" style={{ paddingLeft: `${span.depth * 14}px` }}>
              <p className="approval-title">{span.name}</p>
              <p className="muted">
                {span.agent} · +{formatMs(span.startOffsetMs)} · {formatMs(span.durationMs)}
                {span.detail ? ` · ${span.detail}` : ""}
              </p>
            </div>
            <div className="trace-bar" aria-hidden="true">
              <span
                className={`trace-segment ${span.status}`}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

