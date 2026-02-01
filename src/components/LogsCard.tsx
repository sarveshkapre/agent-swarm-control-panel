import type { LogBudget, LogEntry, SpikeAlerts } from "../types";

type LogsCardProps = {
  logSearch: string;
  onLogSearchChange: (value: string) => void;
  logLevel: string;
  onLogLevelChange: (value: string) => void;
  logAgent: string;
  onLogAgentChange: (value: string) => void;
  logAgents: string[];
  logBudget: LogBudget;
  spikeAlerts: SpikeAlerts;
  filteredLogs: LogEntry[];
  pinnedLogs: string[];
  onTogglePin: (id: string) => void;
  streaming: boolean;
  onToggleStreaming: () => void;
  onExportEvidence: () => void;
};

export default function LogsCard({
  logSearch,
  onLogSearchChange,
  logLevel,
  onLogLevelChange,
  logAgent,
  onLogAgentChange,
  logAgents,
  logBudget,
  spikeAlerts,
  filteredLogs,
  pinnedLogs,
  onTogglePin,
  streaming,
  onToggleStreaming,
  onExportEvidence
}: LogsCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Live logs</h2>
        <div className="header-actions">
          <button className="ghost" onClick={onToggleStreaming} type="button">
            {streaming ? "Pause stream" : "Start stream"}
          </button>
          <button className="ghost" onClick={onExportEvidence} type="button">
            Export
          </button>
        </div>
      </div>
      <div className="filters">
        <input
          value={logSearch}
          onChange={(event) => onLogSearchChange(event.target.value)}
          placeholder="Search logs"
          aria-label="Search logs"
        />
        <select
          value={logLevel}
          onChange={(event) => onLogLevelChange(event.target.value)}
          aria-label="Filter by level"
        >
          <option value="all">All levels</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
        <select
          value={logAgent}
          onChange={(event) => onLogAgentChange(event.target.value)}
          aria-label="Filter by agent"
        >
          <option value="all">All agents</option>
          {logAgents.map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </select>
      </div>
      <div className="budget-row">
        <div>
          <p className="muted">Warn budget</p>
          <strong>{logBudget.warnBudget} / hr</strong>
        </div>
        <div>
          <p className="muted">Error budget</p>
          <strong>{logBudget.errorBudget} / hr</strong>
        </div>
        <div>
          <p className="muted">Spike alerts</p>
          <strong>
            {spikeAlerts.enabled
              ? `${spikeAlerts.threshold}+ in ${spikeAlerts.windowMinutes}m`
              : "Off"}
          </strong>
        </div>
      </div>
      {spikeAlerts.enabled ? (
        <div className="alert-card">
          <p className="muted">Spike alert</p>
          <strong>3 errors in last 12 minutes · Atlas</strong>
          <p className="muted">Triggering auto-paused retries.</p>
        </div>
      ) : null}
      <div className="log-list">
        {filteredLogs.map((log) => (
          <div key={log.id} className={`log ${log.level}`}>
            <div>
              <p className="log-title">{log.agent}</p>
              <p className="muted">{log.message}</p>
            </div>
            <div className="log-meta">
              <button
                className={`pin ${pinnedLogs.includes(log.id) ? "active" : ""}`}
                onClick={() => onTogglePin(log.id)}
                type="button"
              >
                {pinnedLogs.includes(log.id) ? "Pinned" : "Pin"}
              </button>
              <span className={`pill ${log.level}`}>{log.level}</span>
              <span className="muted">{log.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
