type TopBarProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onNewRun: () => void;
};

export default function TopBar({ theme, onToggleTheme, onNewRun }: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Agent Swarm</p>
        <h1>Control Panel</h1>
      </div>
      <div className="topbar-actions">
        <button className="ghost" onClick={onToggleTheme} type="button">
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button className="primary" onClick={onNewRun} type="button">
          New run
        </button>
      </div>
    </header>
  );
}
