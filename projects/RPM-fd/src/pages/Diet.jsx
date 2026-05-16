import React, { useState, useEffect } from "react";
import { api } from "../api";
import { useLoading } from "../components/Layout";

const Diet = () => {
    const [healthStatus, setHealthStatus] = useState("Moderate Risk"); // Default for demo
    const [dietPlan, setDietPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { setGlobalLoading } = useLoading();

    const fetchDiet = async (status) => {
        setLoading(true);
        setGlobalLoading(true);
        setError("");
        try {
            const data = await api.getDiet({ health_status: status });
            setDietPlan(data.diet_plan);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    };

    useEffect(() => {
        fetchDiet(healthStatus);
    }, [healthStatus]);

    return (
        <div className="page-panel animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-0">Personalized Diet Plan</h2>
                <div className="flex items-center gap-3">
                    <select
                        value={healthStatus}
                        onChange={(e) => setHealthStatus(e.target.value)}
                        className="bg-white/90 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none focus:border-blue-500/50 transition-all"
                    >
                        <option value="Low Risk">Low Risk</option>
                        <option value="Moderate Risk">Moderate Risk</option>
                        <option value="High Risk">High Risk</option>
                    </select>
                    {loading && <div className="button-spinner !border-blue-500 !border-t-transparent"></div>}
                </div>
            </div>

            <p className="text-gray-600 mb-8 max-w-2xl">
                Based on your current RPM health status, we have curated a specialized diet to help maintain or improve your cardiovascular health.
            </p>

            {error ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-6">
                    {error}
                </div>
            ) : dietPlan ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-8 rounded-3xl group hover:border-blue-500/30 transition-all duration-500">
                        <h3 className="text-xl font-semibold text-blue-600 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            Recommended Summary
                        </h3>
                        <p className="text-gray-800 text-lg leading-relaxed">{dietPlan.summary}</p>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-8 rounded-3xl group hover:border-green-500/30 transition-all duration-500">
                        <h3 className="text-xl font-semibold text-green-600 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Dietary Actions
                        </h3>
                        <ul className="space-y-4">
                            {dietPlan.items.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-700">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}

            <div className="mt-12 p-6 bg-white/80 border border-gray-200 rounded-2xl text-center">
                <p className="text-sm text-gray-600">
                    * These recommendations are generated based on general cardiovascular health guidelines. Always consult with a registered dietitian or your cardiologist before making significant changes to your diet.
                </p>
            </div>
        </div>
    );
};

export default Diet;
