import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types'; // We will define this next or use generic for now

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const mockSupabaseFallback = !supabaseUrl || !supabaseAnonKey;
