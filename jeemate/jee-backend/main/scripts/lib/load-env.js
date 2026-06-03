import dotenv from "dotenv";
import path from "path";

const cwd = process.cwd();
for (const file of [".env.local", ".env", "backend/.env.local"]) {
  dotenv.config({ path: path.resolve(cwd, file) });
}
