-- ============================================
-- TABLO YAPISINI KONTROL ET
-- ============================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırarak
-- members tablosundaki kolonları görebilirsiniz

-- Members tablosundaki tüm kolonları göster
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'members'
ORDER BY ordinal_position;

-- Eğer phone ve email kolonları yoksa, şu SQL'i çalıştırın:
-- ALTER TABLE members ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
-- ALTER TABLE members ADD COLUMN IF NOT EXISTS email VARCHAR(255);
