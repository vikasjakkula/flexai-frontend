import { Link } from "react-router-dom";
import { BarChart, TrendingUp, AlertCircle, History, Activity } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../api";
import { useLoading } from "../components/Layout";

const Dashboard = () => {
  const [vitalsLatest, setVitalsLatest] = useState(null);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setGlobalLoading } = useLoading();

  useEffect(() => {
    let cancelled = false;
    const load = async (isFirst = false) => {
      if (isFirst) setGlobalLoading(true);
      try {
        const [latest, history, alertsRes] = await Promise.all([
          api.getVitalsLatest().catch(() => null),
          api.getVitalsHistory(50).catch(() => []),
          api.getAlerts(20).catch(() => []),
        ]);
        if (!cancelled) {
          setVitalsLatest(latest);
          setVitalsHistory(Array.isArray(history) ? history : []);
          setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load data");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setGlobalLoading(false);
        }
      }
    };

    load(true);
    const interval = setInterval(() => load(false), 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [setGlobalLoading]);

  const rpmScore = useMemo(() => {
    if (!vitalsLatest) return 0;
    // Mock RPM Prediction Logic (e.g. Heart Rate + BP factor)
    const hrScale = Math.min(Math.max((vitalsLatest.heartRate - 60) / 40, 0), 1) * 40;
    const bpScale = Math.min(Math.max((vitalsLatest.systolic - 120) / 40, 0), 1) * 60;
    return Math.round(Math.max(100 - (hrScale + bpScale), 0));
  }, [vitalsLatest]);

  const metrics = useMemo(() => {
    const v = vitalsLatest;
    if (!v) return [];

    return [
      {
        title: "Blood Pressure",
        value: `${v.systolic}/${v.diastolic}`,
        unit: "mmHg",
        status: v.systolic > 140 || v.diastolic > 90 ? "High" : "Normal",
        color: v.systolic > 140 ? "#ef4444" : "#3b82f6",
      },
      {
        title: "Heart Rate",
        value: v.heartRate,
        unit: "BPM",
        status: v.heartRate > 100 || v.heartRate < 50 ? "Irregular" : "Normal",
        color: v.heartRate > 100 ? "#f97316" : "#10b981",
      },
      {
        title: "SpO2 Level",
        value: v.bloodOxygen,
        unit: "%",
        status: v.bloodOxygen < 95 ? "Low" : "Optimal",
        color: v.bloodOxygen < 95 ? "#ef4444" : "#06b6d4",
      }
    ];
  }, [vitalsLatest]);

  const lineChartData = useMemo(() => {
    return vitalsHistory
      .slice()
      .reverse()
      .map((r) => ({
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        heartRate: r.heartRate ?? 0,
      }));
  }, [vitalsHistory]);

  return (
    <div className="page-panel">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Patient Overview</h1>
          <p className="text-gray-600">Real-time IoT patient monitoring system</p>
        </div>
        <Link to="/predict" className="btn btn-primary">
          <Activity size={20} /> Run RPM Prediction
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* RPM Health Score Ring */}
        <div className="glass-card flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-600 mb-4">RPM Health Index</h3>
          <div className="rpm-score-container">
            <svg className="rpm-progress-ring" width="220" height="220">
              <circle
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="12" fill="transparent" r="90" cx="110" cy="110"
              />
              <circle
                stroke="#3b82f6"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={2 * Math.PI * 90 * (1 - rpmScore / 100)}
                strokeLinecap="round"
                fill="transparent" r="90" cx="110" cy="110"
              />
            </svg>
            <div className="rpm-score-value">
              <span className="rpm-score-number">{rpmScore}%</span>
              <span className="rpm-score-label">Stability</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Predicted out of 100%</p>
        </div>

        {/* Real-time Metrics */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="glass-card" style={{ "--accent-color": m.color }}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-gray-600 text-sm font-medium">{m.title}</span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 border border-gray-200" style={{ color: m.color }}>
                  {m.status}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">{m.value}</span>
                <span className="text-gray-600 font-medium">{m.unit}</span>
              </div>
            </div>
          ))}
          <Link to="/dashboard/patient-history" className="glass-card group hover:border-purple-500/30 flex items-center justify-center gap-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <History size={24} />
            </div>
            <div className="text-left">
              <h4 className="text-gray-900 font-semibold">View History</h4>
              <p className="text-xs text-gray-600">Historical records & trends</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="glass-card">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Heart Rate Trend
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="rgba(0,0,0,0.4)" fontSize={12} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: '#1f2937' }}
                  itemStyle={{ color: '#2563eb' }}
                />
                <Line type="monotone" dataKey="heartRate" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-500" />
            Security & Vitals Alerts
          </h2>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-gray-600">All systems operational. No alerts detected.</p>
              </div>
            ) : (
              alerts.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/90 border border-gray-200">
                  <div className={`w-2 h-2 rounded-full ${a.severity === 'critical' ? 'bg-red-500 animate-ping' : 'bg-orange-500'}`}></div>
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm font-medium">{a.message || a.type}</p>
                    <p className="text-xs text-gray-500">{new Date(a.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
