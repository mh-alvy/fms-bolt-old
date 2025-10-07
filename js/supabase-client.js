import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDA1NDYsImV4cCI6MjA3NTIwMDU0Nn0.W5DjODAriKlXomlCqSe-QE1ILcMDTYr4YCcdtwymOwA';

console.log('Initializing Supabase client with proper configuration...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    },
    global: {
        headers: {
            'apikey': supabaseAnonKey
        }
    }
});

window.supabase = supabase;
console.log('Supabase client initialized successfully');
