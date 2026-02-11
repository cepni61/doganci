-- ============================================
-- MEMBERS TABLOSUNA PHONE VE EMAIL EKLE
-- ============================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- Phone kolonu ekle (eğer yoksa)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Email kolonu ekle (eğer yoksa)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Kontrol et
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'members'
ORDER BY ordinal_position;
