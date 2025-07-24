import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://btozmkrowcrjzvxxhlbn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b3pta3Jvd2Nyanp2eHhobGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTUyNTQsImV4cCI6MjA2ODkzMTI1NH0.b9d4e-ezcr486VRegrcl2CEv3uk4PJNLcwwSdq7mU98'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
