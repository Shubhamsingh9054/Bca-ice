import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite environment variables or localStorage override
export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('bca_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('bca_supabase_anon_key') || '' : '';

  const url = (envUrl && !envUrl.includes('your-project.supabase.co') ? envUrl : localUrl).trim();
  const key = (envKey && !envKey.includes('your-anon-key') ? envKey : localKey).trim();

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http') && key.length > 20);
}

let clientInstance: SupabaseClient | null = null;
let currentConfig = { url: '', key: '' };

export function resetSupabaseClient(): void {
  clientInstance = null;
  currentConfig = { url: '', key: '' };
}

export function saveSupabaseCredentials(url: string, key: string): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    if (url.trim()) {
      localStorage.setItem('bca_supabase_url', url.trim());
    } else {
      localStorage.removeItem('bca_supabase_url');
    }

    if (key.trim()) {
      localStorage.setItem('bca_supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('bca_supabase_anon_key');
    }
  }

  resetSupabaseClient();
  return getSupabaseClient();
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key || !url.startsWith('http')) {
    return null;
  }
  if (!clientInstance || currentConfig.url !== url || currentConfig.key !== key) {
    currentConfig = { url, key };
    clientInstance = createClient(url, key, {
      auth: { persistSession: true },
    });
  }
  return clientInstance;
}

export const supabase = getSupabaseClient();
