import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('[supabase] URL:', supabaseUrl ?? 'UNDEFINED')
console.log('[supabase] KEY:', supabaseKey ? 'ok' : 'UNDEFINED')

export const supabase = createClient(supabaseUrl, supabaseKey)
