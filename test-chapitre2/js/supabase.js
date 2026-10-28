const SUPABASE_URL = "https://hyscehlibdafesftcqql.supabase.co";
const SUPABASE_KEY = "sb_publishable_HILh8is912jI0eHRdE04qw_TQqqoC7z";

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  { auth: { storageKey: "612104-preview-auth" } }
);
