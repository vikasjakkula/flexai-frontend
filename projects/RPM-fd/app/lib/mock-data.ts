export interface VitalReading {
  timestamp: number;
  heartRate: number;
  systolic: number;
  diastolic: number;
  bloodOxygen: number;
  temperature: number;
  respiratoryRate: number;
}

function randomInRange(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

export function generateMockVitalData(count: number): VitalReading[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: now - (count - 1 - i) * 2000,
    heartRate: randomInRange(60, 100),
    systolic: randomInRange(110, 130),
    diastolic: randomInRange(70, 85),
    bloodOxygen: randomInRange(96, 100),
    temperature: Number((36.2 + Math.random() * 1.2).toFixed(1)),
    respiratoryRate: randomInRange(12, 20),
  }));
}
