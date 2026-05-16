import React, { useState } from "react";
import { Stethoscope, Calculator, ChevronRight } from "lucide-react";
import { api } from "../api";
import { useLoading } from "../components/Layout";

function Predict() {
  const [form, setForm] = useState({
    name: "", age: "", sex: "", cholesterol: "", bp: "",
    fbs: false, thalachh: "", diabetes: false, obesity: false,
    shortness_of_breath: false, chest_pain: false, sweating: false,
    stress: false, poor_sleep: false, smoking: false,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { setGlobalLoading } = useLoading();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalLoading(true); // Central loader
    setResult(null);
    setError(null);
    try {
      const data = await api.predict(form);
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to fetch prediction.");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <div className="page-panel">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Risk Assessment</h1>
          <p className="text-gray-600">Complete the form below for a comprehensive Heart Attack risk analysis.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Patient Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange} required
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500/50 transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Age</label>
                    <input
                      type="number" name="age" value={form.age} onChange={handleChange} required
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sex</label>
                    <select
                      name="sex" value={form.sex} onChange={handleChange} required
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500/50 transition-all"
                    >
                      <option value="">Select</option>
                      <option value="1">Male</option>
                      <option value="0">Female</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Clinical Metrics</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Cholesterol</label>
                    <input
                      type="number" name="cholesterol" value={form.cholesterol} onChange={handleChange} required
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Blood Pressure</label>
                    <input
                      type="number" name="bp" value={form.bp} onChange={handleChange} required
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Max Heart Rate</label>
                  <input
                    type="number" name="thalachh" value={form.thalachh} onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Symptoms & Habits</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "diabetes", label: "Diabetes" },
                { name: "obesity", label: "Obesity" },
                { name: "smoking", label: "Smoker" },
                { name: "chest_pain", label: "Chest Pain" },
                { name: "shortness_of_breath", label: "Dyspnea" },
                { name: "sweating", label: "Sweating" },
                { name: "stress", label: "High Stress" },
                { name: "poor_sleep", label: "Poor Sleep" },
              ].map((item) => (
                <label key={item.name} className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${form[item.name] ? 'bg-blue-500/10 border-blue-500/40 text-blue-600' : 'bg-white/80 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <input
                    type="checkbox" name={item.name} checked={form[item.name]} onChange={handleChange}
                    className="hidden"
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              disabled={loading}
              className="btn btn-primary btn-large min-w-[240px]"
            >
              {loading ? "Processing Analysis..." : "Generate Risk Profile"}
              {loading && <div className="button-loader"></div>}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-12 animate-fadeIn">
            <div className="glass-card !bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calculator className="text-blue-400" size={20} />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Prediction Results</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Diagnosis for {form.name || "Patient"}
                  </h2>
                  <div className="inline-block px-4 py-2 rounded-xl bg-white/90 border border-gray-200 mb-6">
                    <span className="text-gray-600">Health Status: </span>
                    <span className={`font-bold ${result.health_status === "High Risk" ? "text-red-400" : "text-green-400"}`}>
                      {result.health_status}
                    </span>
                  </div>
                  {result.llm_summary && (
                    <p className="text-gray-700 leading-relaxed italic border-l-2 border-blue-500/30 pl-4 py-1">
                      "{result.llm_summary}"
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <div className="rpm-score-container !w-48 !h-48">
                    <svg className="rpm-progress-ring" width="180" height="180">
                      <circle stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="transparent" r="75" cx="90" cy="90" />
                      <circle
                        stroke={result.health_status === "High Risk" ? "#ef4444" : "#10b981"}
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 75}
                        strokeDashoffset={2 * Math.PI * 75 * (1 - result.risk_percentage / 100)}
                        strokeLinecap="round"
                        fill="transparent" r="75" cx="90" cy="90"
                      />
                    </svg>
                    <div className="rpm-score-value">
                      <span className="rpm-score-number !text-4xl">{Math.round(result.risk_percentage)}%</span>
                      <span className="rpm-score-label !text-[10px]">Risk Score</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default Predict;
