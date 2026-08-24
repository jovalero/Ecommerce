export const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') : (import.meta.env.VITE_API_BASE_URL || 'https://holux-api.onrender.com');
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fmbhcfsrsfkglmvgbnlm.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aAzQcAqCATpYDGBVRNJRQQ_1CKarnEb';
