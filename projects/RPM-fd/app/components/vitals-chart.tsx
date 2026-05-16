import type { VitalReading } from '@/lib/mock-data';

interface VitalsChartProps {
  data: VitalReading[];
  title: string;
  dataKey: keyof VitalReading;
  dataKey2?: keyof VitalReading;
}

export function VitalsChart({ data, title, dataKey, dataKey2 }: VitalsChartProps) {
  const values = data.map((d) => d[dataKey] as number);
  const values2 = dataKey2 ? data.map((d) => d[dataKey2] as number) : null;
  const max = Math.max(...values, ...(values2 || []), 1);
  const min = Math.min(...values, ...(values2 || [0]));

  return (
    <div className="rounded-lg border border-[var(--border)] bg-card p-4">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="flex h-32 items-end gap-0.5">
        {values.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col gap-0.5">
            {values2 ? (
              <>
                <div
                  className="w-full rounded-t bg-chart-1"
                  style={{
                    height: `${((v - min) / (max - min || 1)) * 100}%`,
                    minHeight: '2px',
                  }}
                  title={`${v}`}
                />
                <div
                  className="w-full rounded-t bg-chart-2"
                  style={{
                    height: `${((values2[i] - min) / (max - min || 1)) * 100}%`,
                    minHeight: '2px',
                  }}
                  title={`${values2[i]}`}
                />
              </>
            ) : (
              <div
                className="w-full rounded-t bg-chart-1"
                style={{
                  height: `${((v - min) / (max - min || 1)) * 100}%`,
                  minHeight: '2px',
                }}
                title={`${v}`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>Earlier</span>
        <span>Latest</span>
      </div>
    </div>
  );
}
