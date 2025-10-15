import { createClient } from '@supabase/supabase-js'

// It's okay to expose the URL and Anon key to the browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in the .env file");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
