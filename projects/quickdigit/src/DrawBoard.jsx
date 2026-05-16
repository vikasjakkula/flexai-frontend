import { useRef, useEffect, useState } from "react";

function DrawBoard({ canvasRef: externalCanvasRef }) {
  const internalCanvasRef = useRef(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const CANVAS_SIZE = 28;
    const DISPLAY_SCALE = 10;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    canvas.style.width = `${CANVAS_SIZE * DISPLAY_SCALE}px`;
    canvas.style.height = `${CANVAS_SIZE * DISPLAY_SCALE}px`;
    canvas.style.imageRendering = "pixelated";

    ctx.lineWidth = 1.8;
    ctx.strokeStyle = "black";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getScaledCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getScaledCoords(e.nativeEvent);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getScaledCoords(e.nativeEvent);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  // Extra container to help with alignment
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "100vh",
        justifyContent: "center",
      }}
    >
      <div>
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          style={{
            background: "white",
            border: "2px solid black",
            cursor: "crosshair",
            display: "block",
            borderRadius: "8px"
          }}
        />
      </div>
    </div>
  );
}

export default DrawBoard;
