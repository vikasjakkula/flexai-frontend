import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gywajswoztldhjdwepkv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5d2Fqc3dvenRsZGhqZHdlcGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDI3OTIsImV4cCI6MjA2NDExODc5Mn0.W1K-UrncnN57sC5xqjwKE2OWc2WHvQqIQh0F-nCSFQI';
 
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 