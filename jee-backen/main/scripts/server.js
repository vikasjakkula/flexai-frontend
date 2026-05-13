/**
 * NOTE: This file is meant to be run as `main/scripts/server.js`.
 * If your dev command is using `main/server.js`, please update it to:
 *   "dev": "nodemon main/scripts/server.js"
 */
import http from "node:http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env.local") });

import solveRoute from "./routes/solve.js";

const app = express();

const basePort = parseInt(process.env.PORT, 10) || 5000;
const portSpan = Math.max(1, parseInt(process.env.PORT_SEARCH_SPAN, 10) || 15);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // 10mb because images are big

// Health check — includes the port this TCP connection landed on (avoids guessing)
app.get("/", (req, res) => {
  const port = Number(req.socket?.localPort);
  // req.hostname is sometimes guessed incorrectly; prefer explicit header fallback
  const host =
    typeof req.hostname === "string" && req.hostname
      ? req.hostname
      : req.headers.host
      ? req.headers.host.split(":")[0]
      : "localhost";
  res.json({
    status: "JeeMate backend is alive 🚀",
    port: Number.isFinite(port) ? port : undefined,
    solveUrl:
      Number.isFinite(port)
        ? `http://${host}:${port}/api/solve`
        : undefined,
  });
});

// Routes
app.use("/api/solve", solveRoute);

function listenOnce(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    const onErr = (err) => reject(err);
    server.once("error", onErr);
    server.listen(port, () => {
      server.off("error", onErr);
      resolve(server);
    });
  });
}

async function start() {
  let lastBusy = null;
  for (let offset = 0; offset < portSpan; offset++) {
    const tryPort = basePort + offset;
    try {
      const server = await listenOnce(tryPort);
      if (offset > 0) {
        console.warn(
          `⚠️  Port ${basePort} is busy — started on ${tryPort} instead. Use this URL in your REST client / frontend.`
        );
      }
      console.log(`✅ JeeMate backend running on http://localhost:${tryPort}`);
      console.log(`   POST http://localhost:${tryPort}/api/solve`);
      server.on("error", (err) => {
        console.error("HTTP server error:", err);
      });
      return;
    } catch (err) {
      if (err && err.code === "EADDRINUSE") {
        lastBusy = tryPort;
        continue;
      }
      console.error("❌ Server failed to start:", err);
      process.exit(1);
    }
  }
  console.error(`
❌ No free port in range ${basePort}–${basePort + portSpan - 1} (last busy: ${lastBusy}).
   Stop old servers:   fuser -k ${basePort}/tcp
   Or widen search:    PORT_SEARCH_SPAN=30 npm run dev
`);
  process.exit(1);
}

// Fix for legacy dev commands: allow running as `main/server.js` by redirecting to correct file.
if (process.argv[1]?.endsWith("/main/server.js") || process.argv[1]?.endsWith("\\main\\server.js")) {
  // eslint-disable-next-line no-console
  console.error(
    "\nERROR: You are running 'main/server.js' which does not exist. Please update your dev script to:\n" +
    '    "dev": "nodemon main/scripts/server.js"\n' +
    "and run 'npm run dev' again.\n"
  );
  process.exit(1);
}

start();
