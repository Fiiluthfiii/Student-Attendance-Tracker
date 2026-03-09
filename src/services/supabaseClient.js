import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://mqqnrdutmfoxqoazdndl.supabase.co"
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_IaEvQLnH9WVTqGm3Ss6UxQ_bkAg4-YA"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
