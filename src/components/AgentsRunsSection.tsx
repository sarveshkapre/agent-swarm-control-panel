import type { Agent, AgentStatus, Run, RunStatus } from "../types";

type AgentsRunsSectionProps = {
  agents: Agent[];
  statusLabel: Record<AgentStatus, string>;
  runSearch: string;
  onRunSearchChange: (value: string) => void;
  filteredRuns: Run[];
  runStatusLabel: Record<RunStatus, string>;
  onQueueRun: () => void;
  onRunAction: (run: Run, action: "pause" | "retry" | "cancel") => void;
};

export default function AgentsRunsSection({
  agents,
  statusLabel,
  runSearch,
  onRunSearchChange,
  filteredRuns,
  runStatusLabel,
  onQueueRun,
  onRunAction
}: AgentsRunsSectionProps) {
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
          <button className="ghost" type="button">
            Filters
          </button>
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
          <button className="ghost" onClick={onQueueRun} type="button">
            Queue run
          </button>
        </div>
        <div className="run-list">
          {filteredRuns.map((run) => (
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
              <div className="run-actions">
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
          ))}
        </div>
      </div>
    </section>
  );
}
