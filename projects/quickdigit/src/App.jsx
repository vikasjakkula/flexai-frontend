import DrawBoard from "./DrawBoard";
import "./App.css";
import { useState, useRef } from "react";

function App() {
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    setPrediction(null);
    setConfidence(null);
    setError(null);
  };

  const handlePredict = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);
    setPrediction(null);
    setConfidence(null);
    setError(null);

    const image = canvas.toDataURL("image/png");

    try {
      const response = await fetch("https://quickdigit-backend.onrender.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await response.json();

      if (response.ok && data.prediction !== undefined) {
        setPrediction(data.prediction);
        setConfidence(typeof data.confidence === "number" ? data.confidence : null);
      } else {
        const message = data.error || "Prediction failed";
        setError(message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <main className="panel">
        <header className="panel__header">
          <h1>Digit Recognizer</h1>
          <p>Sketch a number on the grid and let the model guess it in real time.</p>
        </header>

        <div className="panel__canvas">
          <DrawBoard canvasRef={canvasRef} />
        </div>

        <div className="panel__controls">
          <button className="btn btn--primary" onClick={handlePredict} disabled={loading}>
            {loading ? "Predicting…" : "Predict"}
          </button>
          <button className="btn" onClick={handleClear} disabled={loading}>
            Clear
          </button>
        </div>

        <section className="panel__result" aria-live="polite">
          {error && <span className="result result--error">{error}</span>}
          {prediction !== null && !error && (
            <span className="result result--success">
              {`Model thinks it is ${prediction}`}
              {confidence !== null && ` (confidence ${confidence.toFixed(1)}%)`}
            </span>
          )}
          {!error && prediction === null && !loading && (
            <span className="result result--hint">Draw a digit and tap Predict.</span>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
