"use client";

import { createClient } from "@supabase/supabase-js";
import { createFetchWithTimeout } from "./fetchWithTimeout";

// خواندن‌ها بعد از ۶ ثانیه قطع و دوباره امتحان می‌شن.
// نوشتن‌ها و آپلود عکس (POST/PUT) عمداً تایم‌اوت ندارن، چون آپلود عکس
// محصول با اینترنت کند ممکنه بیشتر از چند ثانیه طول بکشه.
const timeoutFetch = createFetchWithTimeout(6000);

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: { fetch: timeoutFetch },
  }
);
