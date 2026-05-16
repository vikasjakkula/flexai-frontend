import type { VitalReading } from './mock-data';

export interface VitalAlert {
  type: string;
  message: string;
  severity: 'warning' | 'critical';
  timestamp: number;
  value?: number;
  threshold?: number;
}

export interface Thresholds {
  heartRateHigh: number;
  heartRateLow: number;
  systolicHigh: number;
  diastolicHigh: number;
  diastolicLow: number;
}

export function detectCriticalAlerts(
  reading: VitalReading,
  thresholds: Thresholds
): VitalAlert[] {
  const alerts: VitalAlert[] = [];
  const ts = Date.now();

  if (reading.heartRate >= thresholds.heartRateHigh) {
    alerts.push({
      type: 'heartRate',
      message: `High heart rate: ${reading.heartRate} BPM`,
      severity: 'critical',
      timestamp: ts,
      value: reading.heartRate,
      threshold: thresholds.heartRateHigh,
    });
  }
  if (reading.heartRate <= thresholds.heartRateLow) {
    alerts.push({
      type: 'heartRate',
      message: `Low heart rate: ${reading.heartRate} BPM`,
      severity: 'critical',
      timestamp: ts,
      value: reading.heartRate,
      threshold: thresholds.heartRateLow,
    });
  }
  if (reading.systolic >= thresholds.systolicHigh) {
    alerts.push({
      type: 'bloodPressure',
      message: `High systolic: ${reading.systolic} mmHg`,
      severity: 'critical',
      timestamp: ts,
      value: reading.systolic,
      threshold: thresholds.systolicHigh,
    });
  }
  if (reading.diastolic >= thresholds.diastolicHigh) {
    alerts.push({
      type: 'bloodPressure',
      message: `High diastolic: ${reading.diastolic} mmHg`,
      severity: 'critical',
      timestamp: ts,
      value: reading.diastolic,
      threshold: thresholds.diastolicHigh,
    });
  }
  if (reading.diastolic <= thresholds.diastolicLow && reading.diastolic > 0) {
    alerts.push({
      type: 'bloodPressure',
      message: `Low diastolic: ${reading.diastolic} mmHg`,
      severity: 'warning',
      timestamp: ts,
      value: reading.diastolic,
      threshold: thresholds.diastolicLow,
    });
  }
  if (reading.bloodOxygen < 92) {
    alerts.push({
      type: 'bloodOxygen',
      message: `Low SpO2: ${reading.bloodOxygen}%`,
      severity: 'critical',
      timestamp: ts,
      value: reading.bloodOxygen,
      threshold: 92,
    });
  }

  return alerts;
}
