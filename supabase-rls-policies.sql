-- ============================================
-- DOĞANCI İŞ İNSANLARI - RLS POLİTİKALARI
-- ============================================
-- Bu SQL dosyasını Supabase Dashboard > SQL Editor'de çalıştırın
-- https://supabase.com/dashboard/project/nxywtyvcqkejvehpnoyw/sql

-- ============================================
-- 1. MEMBERS TABLOSU RLS
-- ============================================

-- RLS'i aktif et
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (public görünüm için)
CREATE POLICY "Herkes üyeleri görebilir"
ON members FOR SELECT
TO public
USING (true);

-- Sadece authenticated kullanıcılar ekleyebilir
CREATE POLICY "Sadece admin üye ekleyebilir"
ON members FOR INSERT
TO authenticated
WITH CHECK (true);

-- Sadece authenticated kullanıcılar güncelleyebilir
CREATE POLICY "Sadece admin üye güncelleyebilir"
ON members FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Sadece authenticated kullanıcılar silebilir
CREATE POLICY "Sadece admin üye silebilir"
ON members FOR DELETE
TO authenticated
USING (true);


-- ============================================
-- 2. NEWS TABLOSU RLS
-- ============================================

-- RLS'i aktif et
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (public görünüm için)
CREATE POLICY "Herkes haberleri görebilir"
ON news FOR SELECT
TO public
USING (true);

-- Sadece authenticated kullanıcılar ekleyebilir
CREATE POLICY "Sadece admin haber ekleyebilir"
ON news FOR INSERT
TO authenticated
WITH CHECK (true);

-- Sadece authenticated kullanıcılar güncelleyebilir
CREATE POLICY "Sadece admin haber güncelleyebilir"
ON news FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Sadece authenticated kullanıcılar silebilir
CREATE POLICY "Sadece admin haber silebilir"
ON news FOR DELETE
TO authenticated
USING (true);


-- ============================================
-- 3. STORAGE (Fotoğraf/Görsel Yüklemeleri)
-- ============================================

-- member-photos bucket için politikalar
-- Not: Bu bucket'ı manuel olarak oluşturmanız gerekebilir

-- Herkes resimleri görebilir
CREATE POLICY "Herkes üye fotoğraflarını görebilir"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'member-photos');

-- Sadece authenticated kullanıcılar yükleyebilir
CREATE POLICY "Sadece admin üye fotoğrafı yükleyebilir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'member-photos');

-- Sadece authenticated kullanıcılar silebilir
CREATE POLICY "Sadece admin üye fotoğrafını silebilir"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'member-photos');


-- news-images bucket için politikalar

-- Herkes resimleri görebilir
CREATE POLICY "Herkes haber görsellerini görebilir"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'news-images');

-- Sadece authenticated kullanıcılar yükleyebilir
CREATE POLICY "Sadece admin haber görseli yükleyebilir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'news-images');

-- Sadece authenticated kullanıcılar silebilir
CREATE POLICY "Sadece admin haber görselini silebilir"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'news-images');


-- ============================================
-- KONTROL SORULARI
-- ============================================

-- Mevcut politikaları görüntüle
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('members', 'news')
-- ORDER BY tablename, policyname;

-- RLS durumunu kontrol et
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename IN ('members', 'news');
