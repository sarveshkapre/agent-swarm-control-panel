import type { Agent, AgentStatus, Run, RunStatus, RunStatusFilter } from "../types";

type AgentsRunsSectionProps = {
  agents: Agent[];
  statusLabel: Record<AgentStatus, string>;
  runSearch: string;
  onRunSearchChange: (value: string) => void;
  runStatusFilter: RunStatusFilter;
  onRunStatusFilterChange: (value: RunStatusFilter) => void;
  runTagFilter: string;
  runTagOptions: string[];
  onRunTagFilterChange: (value: string) => void;
  filteredRuns: Run[];
  runStatusLabel: Record<RunStatus, string>;
  onQueueRun: () => void;
  queueingPaused: boolean;
  onRunAction: (run: Run, action: "pause" | "retry" | "cancel") => void;
  onViewDetails: (run: Run) => void;
  getRunTags: (run: Run) => string[];
  getRunDurationLabel: (run: Run) => string;
  getRunSlaBadge: (run: Run) => { label: string; tone: "low" | "medium" | "high" | "muted" };
};

export default function AgentsRunsSection({
  agents,
  statusLabel,
  runSearch,
  onRunSearchChange,
  runStatusFilter,
  onRunStatusFilterChange,
  runTagFilter,
  runTagOptions,
  onRunTagFilterChange,
  filteredRuns,
  runStatusLabel,
  onQueueRun,
  queueingPaused,
  onRunAction,
  onViewDetails,
  getRunTags,
  getRunDurationLabel,
  getRunSlaBadge
}: AgentsRunsSectionProps) {
  const filters: { value: RunStatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "queued", label: runStatusLabel.queued },
    { value: "running", label: runStatusLabel.running },
    { value: "waiting", label: runStatusLabel.waiting },
    { value: "failed", label: runStatusLabel.failed },
    { value: "completed", label: runStatusLabel.completed }
  ];

  return (
    <section className="grid">
      <div className="card">
        <div className="card-header">
          <h2>Active agents</h2>
          <span className="hint">Press / to search</span>
        </div>
        <div className="search-row">
          <input
            data-search
            value={runSearch}
            onChange={(event) => onRunSearchChange(event.target.value)}
            placeholder="Search runs, owners, statuses"
            aria-label="Search runs"
          />
          <select
            value={runTagFilter}
            onChange={(event) => onRunTagFilterChange(event.target.value)}
            aria-label="Filter by run tag"
          >
            <option value="all">All tags</option>
            {runTagOptions.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>
        <div className="chip-row" role="group" aria-label="Run status filters">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`chip ${runStatusFilter === filter.value ? "active" : ""}`}
              onClick={() => onRunStatusFilterChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="agent-list">
          {agents.map((agent) => (
            <div key={agent.id} className="agent">
              <div>
                <p className="agent-name">{agent.name}</p>
                <p className="muted">
                  {agent.role} · {agent.model}
                </p>
              </div>
              <div>
                <p className={`status ${agent.status}`}>{statusLabel[agent.status]}</p>
                <p className="muted">{agent.focus}</p>
              </div>
              <div>
                <p className="muted">Last active</p>
                <p>{agent.lastActive}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Runs in progress</h2>
          <button
            className="ghost"
            onClick={onQueueRun}
            type="button"
            disabled={queueingPaused}
          >
            Queue run
          </button>
        </div>
        <div className="run-list">
          {filteredRuns.map((run) => {
            const slaBadge = getRunSlaBadge(run);
            const runTags = getRunTags(run);
            return (
              <article key={run.id} className="run">
                <div>
                  <p className="run-title">{run.objective}</p>
                  <p className="muted">
                    {run.id} · {run.owner} · {run.startedAt}
                  </p>
                </div>
                <div className="run-meta">
                  <div>
                    <p className={`status ${run.status}`}>{runStatusLabel[run.status]}</p>
                    <p className="muted">Agents: {run.agents.join(", ")}</p>
                  </div>
                  <div>
                    <p className="muted">Est. cost</p>
                    <p>{run.costEstimate}</p>
                  </div>
                  <div>
                    <p className="muted">Tokens</p>
                    <p>{run.tokens}</p>
                  </div>
                </div>
                <div className="run-sla">
                  <span className={`pill ${slaBadge.tone}`}>{slaBadge.label}</span>
                  <span className="muted">Duration: {getRunDurationLabel(run)}</span>
                </div>
                {runTags.length > 0 ? (
                  <div className="run-tags" aria-label={`Run tags for ${run.id}`}>
                    {runTags.slice(0, 6).map((tag) => (
                      <span key={`${run.id}-${tag}`} className="pill muted">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="run-actions">
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => onViewDetails(run)}
                  >
                    Details
                  </button>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => onRunAction(run, "pause")}
                    disabled={run.status !== "running"}
                  >
                    Pause
                  </button>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => onRunAction(run, "retry")}
                    disabled={run.status !== "failed"}
                  >
                    Retry
                  </button>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => onRunAction(run, "cancel")}
                    disabled={run.status !== "queued" && run.status !== "waiting"}
                  >
                    Cancel
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
