import { createClient } from '@supabase/supabase-js'

// Memberikan nilai default jika variabel environment belum terbaca saat build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hysbwfqxdiegargugidr.supabase.co'
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  'sb_publishable_jcelbftGObaphFf5LJBtsA_qGs5ujmh'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
