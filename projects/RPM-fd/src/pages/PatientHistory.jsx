import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History, AlertCircle, ArrowLeft } from "lucide-react";
import { api } from "../api";

const PatientHistory = () => {
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [history, alertsRes] = await Promise.all([
          api.getVitalsHistory(100).catch(() => []),
          api.getAlerts(50).catch(() => []),
        ]);
        if (!cancelled) {
          setVitalsHistory(Array.isArray(history) ? history : []);
          setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load patient history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
  }, []);

  const readings = [...vitalsHistory].reverse().map((r) => ({
    date: new Date(r.timestamp).toLocaleDateString(),
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    systolic: r.systolic ?? "—",
    diastolic: r.diastolic ?? "—",
    heartRate: r.heartRate ?? "—",
    bloodOxygen: r.bloodOxygen ?? "—",
    temperature: r.temperature != null ? (typeof r.temperature === "number" ? r.temperature.toFixed(1) : r.temperature) : "—",
    status:
      (r.systolic > 140 || r.diastolic > 90 || r.heartRate > 100 || (r.bloodOxygen != null && r.bloodOxygen < 95))
        ? "Elevated"
        : "Normal",
  }));

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            to="/dashboard"
            className="nav-link"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <History size={28} /> Patient History
            </h1>
            <p className="dashboard-subtitle">
              Vitals timeline and past alerts
            </p>
          </div>
        </div>

        {error && (
          <p style={{ color: "#dc3545", marginBottom: "1rem" }}>{error}</p>
        )}
        {loading && (
          <p style={{ color: "rgba(0,0,0,0.7)" }}>Loading patient history…</p>
        )}

        {!loading && (
          <>
            <div className="alerts-card" style={{ marginBottom: "1.5rem" }}>
              <h2 className="card-title">
                <AlertCircle size={20} /> Alert History
              </h2>
              <div className="alerts-list">
                {alerts.length === 0 ? (
                  <div className="alert-item success">
                    <p className="alert-text">No alerts recorded</p>
                    <p className="alert-time">Alerts will appear here when thresholds are breached</p>
                  </div>
                ) : (
                  alerts.slice(0, 20).map((a, i) => (
                    <div key={i} className={`alert-item ${a.severity === "critical" ? "info" : "success"}`}>
                      <p className="alert-text">{a.message || a.type}</p>
                      <p className="alert-time">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ""}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="readings-card">
              <h2 className="card-title">Vitals History</h2>
              <div className="table-wrapper">
                <table className="readings-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Systolic</th>
                      <th>Diastolic</th>
                      <th>Heart Rate</th>
                      <th>SpO₂</th>
                      <th>Temp</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "1.5rem", color: "rgba(0,0,0,0.6)" }}>
                          No vitals history yet. Start the backend to stream data.
                        </td>
                      </tr>
                    ) : (
                      readings.map((reading, index) => (
                        <tr key={index}>
                          <td>{reading.date}</td>
                          <td>{reading.time}</td>
                          <td>{reading.systolic}</td>
                          <td>{reading.diastolic}</td>
                          <td>{reading.heartRate}</td>
                          <td>{reading.bloodOxygen}</td>
                          <td>{reading.temperature}</td>
                          <td>
                            <span className={`status-badge ${reading.status === "Normal" ? "normal" : "elevated"}`}>
                              {reading.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientHistory;
