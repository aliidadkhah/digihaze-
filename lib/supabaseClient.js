"use client";

import { createClient } from "@supabase/supabase-js";
import { createFetchWithTimeout } from "./fetchWithTimeout";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: { fetch: createFetchWithTimeout(8000) },
  }
);
