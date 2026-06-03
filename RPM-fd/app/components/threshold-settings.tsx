import type { Thresholds } from '@/lib/alert-detection';

interface ThresholdSettingsProps {
  thresholds: Thresholds;
  onThresholdsChange: (t: Thresholds) => void;
  onClose: () => void;
}

export function ThresholdSettings({
  thresholds,
  onThresholdsChange,
  onClose,
}: ThresholdSettingsProps) {
  const update = (key: keyof Thresholds, value: number) => {
    onThresholdsChange({ ...thresholds, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-lg border border-[var(--border)] bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Threshold Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-muted-foreground">Heart rate high (BPM)</span>
            <input
              type="number"
              value={thresholds.heartRateHigh}
              onChange={(e) => update('heartRateHigh', Number(e.target.value))}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">Heart rate low (BPM)</span>
            <input
              type="number"
              value={thresholds.heartRateLow}
              onChange={(e) => update('heartRateLow', Number(e.target.value))}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">Systolic high (mmHg)</span>
            <input
              type="number"
              value={thresholds.systolicHigh}
              onChange={(e) => update('systolicHigh', Number(e.target.value))}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">Diastolic high (mmHg)</span>
            <input
              type="number"
              value={thresholds.diastolicHigh}
              onChange={(e) => update('diastolicHigh', Number(e.target.value))}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">Diastolic low (mmHg)</span>
            <input
              type="number"
              value={thresholds.diastolicLow}
              onChange={(e) => update('diastolicLow', Number(e.target.value))}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-foreground"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-primary py-2 text-primary-foreground hover:opacity-90"
        >
          Done
        </button>
      </div>
    </div>
  );
}
