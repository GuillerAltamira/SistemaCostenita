import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Sanitizar la URL para remover sufijos como /rest/v1/ o barras al final si fueron introducidos en .env
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

// Validar si las credenciales de Supabase están configuradas apropiadamente
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://tu-proyecto.supabase.co' &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey !== 'tu-anon-key-aqui'
);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

console.info(
  `[Costeñita DB] Modo de conexión: ${isSupabaseConfigured ? '🟢 Supabase Cloud Activo' : '🟠 Almacenamiento Local / Simulación Activa (Sin conexión remota)'}`
);
