interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="border-b border-[var(--border)] bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">RPM Vitals Dashboard</h1>
        <button
          type="button"
          onClick={onSettingsClick}
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
        >
          Thresholds
        </button>
      </div>
    </header>
  );
}
