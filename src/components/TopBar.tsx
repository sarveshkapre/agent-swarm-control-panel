type TopBarProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onNewRun: () => void;
  queueingPaused: boolean;
  onResumeQueueing: () => void;
};

export default function TopBar({
  theme,
  onToggleTheme,
  onNewRun,
  queueingPaused,
  onResumeQueueing
}: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Agent Swarm</p>
        <h1>Control Panel</h1>
      </div>
      <div className="topbar-actions">
        {queueingPaused ? (
          <>
            <span className="status-pill emergency" aria-label="Queueing paused">
              Emergency stop
            </span>
            <button className="ghost" type="button" onClick={onResumeQueueing}>
              Resume queueing
            </button>
          </>
        ) : null}
        <button className="ghost" onClick={onToggleTheme} type="button">
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button
          className="primary"
          onClick={onNewRun}
          type="button"
          disabled={queueingPaused}
        >
          New run
        </button>
      </div>
    </header>
  );
}
