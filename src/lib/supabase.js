import { createClient } from "@supabase/supabase-js";

// .env доторх утгуудыг ашиглана
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Env байхгүй үед app унахаас сэргийлж null буцаана
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
