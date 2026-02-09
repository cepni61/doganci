// Supabase Configuration
const SUPABASE_URL = 'https://nxywtyvcqkejvehpnoyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54eXd0eXZjcWtlanZlaHBub3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjMzMjEsImV4cCI6MjA4NjIzOTMyMX0.udISw2KZBfiUuXGXHuG0at3byAPchtQi2IGkfdLuECY';

// Supabase client initialization
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
