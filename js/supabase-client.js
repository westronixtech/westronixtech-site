import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  "https://ekzspqjnwlsraxzsydjl.supabase.co",
  "sb_publishable_J3hcLDLwj1hm_TtXUD23lA_mF7ys6_0",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
