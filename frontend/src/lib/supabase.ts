import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
// Capture before client initialization consumes and removes the PKCE code.
export const authCallback = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('code')
export const authCallbackError = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get('error_description')
  : null
export const supabase = url && key ? createClient(url,key,{auth:{flowType:'pkce',persistSession:true,detectSessionInUrl:true}}) : null
