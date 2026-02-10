import type { Agent, Run, RunStatus } from "../types";

type SlaTone = "low" | "medium" | "high" | "muted";

type AgentWorkloadCardProps = {
  agents: Agent[];
  runs: Run[];
  getRunSlaTone: (run: Run) => SlaTone;
};

type WorkloadRow = {
  key: string;
  name: string;
  role: string;
  status: Agent["status"] | "unknown";
  counts: Record<RunStatus, number>;
  atRisk: number;
  breached: number;
  pressure: number;
};

const runStatuses: RunStatus[] = ["queued", "running", "waiting", "failed", "completed"];

function emptyCounts(): Record<RunStatus, number> {
  return { queued: 0, running: 0, waiting: 0, failed: 0, completed: 0 };
}

function getPressure(counts: Record<RunStatus, number>, atRisk: number, breached: number) {
  // Simple operator-centric heuristic: failures and at-risk states compound.
  return (
    counts.running * 2 +
    counts.waiting * 2 +
    counts.queued +
    counts.failed * 4 +
    atRisk * 2 +
    breached * 3
  );
}

function getPressureTone(pressure: number): SlaTone {
  if (pressure >= 12) return "high";
  if (pressure >= 6) return "medium";
  if (pressure >= 1) return "low";
  return "muted";
}

function formatStatus(status: WorkloadRow["status"]) {
  if (status === "unknown") return "Unknown";
  if (status === "idle") return "Idle";
  if (status === "running") return "Running";
  if (status === "paused") return "Paused";
  return "Error";
}

export default function AgentWorkloadCard({ agents, runs, getRunSlaTone }: AgentWorkloadCardProps) {
  const known = new Map<string, Agent>();
  agents.forEach((agent) => known.set(agent.name, agent));

  const referencedAgentNames = Array.from(
    new Set(runs.flatMap((run) => run.agents).filter(Boolean))
  );

  const rows: WorkloadRow[] = referencedAgentNames
    .map((name) => {
      const agent = known.get(name);
      const counts = emptyCounts();
      let atRisk = 0;
      let breached = 0;
      for (const run of runs) {
        if (!run.agents.includes(name)) continue;
        counts[run.status] += 1;
        const tone = getRunSlaTone(run);
        if (tone === "high") breached += 1;
        if (tone === "medium" || tone === "high") atRisk += 1;
      }

      const pressure = getPressure(counts, atRisk, breached);
      const status: WorkloadRow["status"] = agent ? agent.status : "unknown";
      return {
        key: agent?.id ?? `agent:${name}`,
        name,
        role: agent?.role ?? "Agent",
        status,
        counts,
        atRisk,
        breached,
        pressure
      };
    })
    .sort((a, b) => b.pressure - a.pressure || a.name.localeCompare(b.name));

  const alertingAgents = rows.filter((row) => row.breached > 0 || row.atRisk > 0 || row.pressure >= 6);

  return (
    <div className="card workload-card">
      <div className="card-header">
        <h2>Agent workload</h2>
        <span className="hint">
          Alerts: <strong>{alertingAgents.length}</strong>
        </span>
      </div>

      <div className="workload-table-wrap">
        <table className="workload-table" aria-label="Agent workload">
          <thead>
            <tr>
              <th scope="col">Agent</th>
              <th scope="col">Status</th>
              {runStatuses.map((status) => (
                <th key={status} scope="col">
                  {status === "completed" ? "Done" : status.charAt(0).toUpperCase() + status.slice(1)}
                </th>
              ))}
              <th scope="col">At risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pressureTone = getPressureTone(row.pressure);
              return (
                <tr key={row.key} className={`workload-row ${pressureTone}`}>
                  <th scope="row">
                    <div className="workload-agent">
                      <span className="workload-name">{row.name}</span>
                      <span className="muted workload-role">{row.role}</span>
                    </div>
                  </th>
                  <td>
                    <span className={`pill ${pressureTone}`}>{formatStatus(row.status)}</span>
                  </td>
                  {runStatuses.map((status) => (
                    <td key={status} className="workload-count">
                      {row.counts[status]}
                    </td>
                  ))}
                  <td>
                    {row.atRisk === 0 ? (
                      <span className="pill muted">0</span>
                    ) : (
                      <span className={`pill ${row.breached > 0 ? "high" : "medium"}`}>
                        {row.atRisk}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {alertingAgents.length > 0 ? (
        <div className="workload-alerts">
          <p className="muted">SLA alerts</p>
          <ul className="stack">
            {alertingAgents.slice(0, 4).map((row) => (
              <li key={row.key} className="workload-alert-item">
                <span>
                  <strong>{row.name}</strong> · at-risk {row.atRisk} · queued {row.counts.queued} · waiting {row.counts.waiting}
                </span>
                <span className={`pill ${getPressureTone(row.pressure)}`}>
                  pressure {row.pressure}
                </span>
              </li>
            ))}
          </ul>
          {alertingAgents.length > 4 ? (
            <p className="muted">+{alertingAgents.length - 4} more agents with elevated pressure.</p>
          ) : null}
        </div>
      ) : (
        <p className="muted">No workload alerts right now.</p>
      )}
    </div>
  );
}
