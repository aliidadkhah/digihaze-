import { createClient } from "@supabase/supabase-js";
import { createFetchWithTimeout } from "./fetchWithTimeout";

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    global: { fetch: createFetchWithTimeout(4000) },
  }
);
