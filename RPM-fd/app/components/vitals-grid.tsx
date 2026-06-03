import type { VitalReading } from '@/lib/mock-data';

interface Thresholds {
  heartRateHigh: number;
  heartRateLow: number;
  systolicHigh: number;
  diastolicHigh: number;
  diastolicLow: number;
}

interface VitalsGridProps {
  currentVitals: VitalReading;
  thresholds: Thresholds;
}

function VitalCard({
  label,
  value,
  unit,
  isHigh,
  isLow,
}: {
  label: string;
  value: number | string;
  unit: string;
  isHigh?: boolean;
  isLow?: boolean;
}) {
  let color = 'text-foreground';
  if (isHigh) color = 'text-destructive';
  if (isLow) color = 'text-warning';
  return (
    <div className="rounded-lg border border-[var(--border)] bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>
        {value} <span className="text-base font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

export function VitalsGrid({ currentVitals, thresholds }: VitalsGridProps) {
  const hrHigh = currentVitals.heartRate >= thresholds.heartRateHigh;
  const hrLow = currentVitals.heartRate <= thresholds.heartRateLow;
  const bpHigh =
    currentVitals.systolic >= thresholds.systolicHigh ||
    currentVitals.diastolic >= thresholds.diastolicHigh;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <VitalCard
        label="Heart Rate"
        value={currentVitals.heartRate}
        unit="BPM"
        isHigh={hrHigh}
        isLow={hrLow}
      />
      <VitalCard
        label="Blood Pressure"
        value={`${currentVitals.systolic}/${currentVitals.diastolic}`}
        unit="mmHg"
        isHigh={bpHigh}
      />
      <VitalCard label="SpO2" value={currentVitals.bloodOxygen} unit="%" />
      <VitalCard label="Temperature" value={currentVitals.temperature} unit="°C" />
      <VitalCard label="Resp. Rate" value={currentVitals.respiratoryRate} unit="/min" />
    </div>
  );
}
