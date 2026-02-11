// Supabase Configuration
const SUPABASE_URL = 'https://nxywtyvcqkejvehpnoyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54eXd0eXZjcWtlanZlaHBub3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjMzMjEsImV4cCI6MjA4NjIzOTMyMX0.udISw2KZBfiUuXGXHuG0at3byAPchtQi2IGkfdLuECY';

// "supabase" adı çakışıyor, "supabaseClient" olarak tanımla
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Geriye dönük uyumluluk için "supabase" adıyla da erişilebilsin
const supabase = supabaseClient;
