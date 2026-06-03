import type { VitalAlert } from '@/lib/alert-detection';

interface EmergencyAlertsProps {
  alerts: VitalAlert[];
}

export function EmergencyAlerts({ alerts }: EmergencyAlertsProps) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
      <h2 className="mb-2 font-semibold text-destructive">Critical Alerts</h2>
      <ul className="space-y-1">
        {alerts.map((alert, i) => (
          <li
            key={`${alert.timestamp}-${i}`}
            className="text-sm text-destructive-foreground"
          >
            {alert.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
