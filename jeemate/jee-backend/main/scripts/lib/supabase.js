import { createClient } from "@supabase/supabase-js";
import "./load-env.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

export const supabase =
  url && key
    ? createClient(url, key, { auth: { persistSession: false } })
    : null;

if (!supabase) {
  console.warn(
    "[supabase] SUPABASE_URL or SUPABASE_SERVICE_KEY not set — RAG/notes search disabled. Add them to .env.local (see .env.example)."
  );
}