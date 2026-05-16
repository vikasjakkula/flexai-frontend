import React, { useState } from "react";
import { BarChart3 } from "lucide-react";
import { api } from "../api";

function parseNumbers(input) {
  if (!input || typeof input !== "string") return [];
  return input
    .split(/[\s,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseFloat(s))
    .filter((n) => !Number.isNaN(n));
}

function Histogram() {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("Distribution");
  const [xlabel, setXlabel] = useState("Value");
  const [bins, setBins] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numbers = parseNumbers(input);
    if (numbers.length === 0) {
      setError("Enter at least one number (comma or space separated).");
      setImageUrl(null);
      return;
    }
    setError(null);
    setLoading(true);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    try {
      const blob = await api.getHistogram({
        numbers,
        title: title || "Distribution",
        xlabel: xlabel || "Value",
        bins: bins ? parseInt(bins, 10) : undefined,
      });
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (err) {
      setError(err.message || "Failed to generate histogram.");
    }
    setLoading(false);
  };

  return (
    <div className="predict-page" style={{ padding: "2rem 0" }}>
      <div className="container">
        <div className="predict-content">
          <h1
            className="predict-title"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "2rem",
            }}
          >
            <BarChart3 size={32} />
            Histogram from your numbers
          </h1>
          <p style={{ textAlign: "center", marginBottom: "1.5rem", color: "rgba(0,0,0,0.7)" }}>
            Enter numbers below (comma or space separated). The backend uses matplotlib to generate the histogram.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              maxWidth: "560px",
              margin: "0 auto 2rem",
              textAlign: "left",
            }}
          >
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>
                Numbers
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. 60, 72, 65, 80, 70, 68, 75 or one per line"
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid rgba(0,0,0,0.2)",
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                />
              </label>
            </div>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>
                Title
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Distribution"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    border: "1px solid rgba(0,0,0,0.2)",
                    borderRadius: "6px",
                  }}
                />
              </label>
            </div>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>
                X-axis label
                <input
                  type="text"
                  value={xlabel}
                  onChange={(e) => setXlabel(e.target.value)}
                  placeholder="Value"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    border: "1px solid rgba(0,0,0,0.2)",
                    borderRadius: "6px",
                  }}
                />
              </label>
            </div>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>
                Bins (optional)
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={bins}
                  onChange={(e) => setBins(e.target.value)}
                  placeholder="auto"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    border: "1px solid rgba(0,0,0,0.2)",
                    borderRadius: "6px",
                  }}
                />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Generating…" : "Generate histogram"}
              </button>
            </div>
          </form>

          {error && <p className="error" style={{ textAlign: "center", color: "#dc3545" }}>{error}</p>}
          {imageUrl && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <img
                src={imageUrl}
                alt="Histogram"
                style={{ maxWidth: "100%", height: "auto", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Histogram;
