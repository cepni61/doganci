# 🔐 Güvenlik Kurulumu (RLS)

## Adım Adım Kurulum

### 1️⃣ Supabase Dashboard'a Giriş Yapın
1. https://supabase.com adresine gidin
2. Projenizi seçin: `nxywtyvcqkejvehpnoyw`

### 2️⃣ Storage Bucket'larını Oluşturun (Eğer yoksa)
1. Sol menüden **Storage** > **Buckets** tıklayın
2. **Create Bucket** butonuna tıklayın
3. İki bucket oluşturun:
   - **Bucket Name:** `member-photos`
     - **Public:** ✅ (İşaretli olsun)
   - **Bucket Name:** `news-images`
     - **Public:** ✅ (İşaretli olsun)

### 3️⃣ SQL Politikalarını Çalıştırın
1. Sol menüden **SQL Editor** tıklayın
2. **New query** butonuna tıklayın
3. `supabase-rls-policies.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. **RUN** butonuna tıklayın (sağ alt köşe)

### 4️⃣ Kontrol Edin

#### Members ve News tablolarında RLS aktif mi?
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('members', 'news');
```

Sonuç:
```
tablename  | rowsecurity
-----------+------------
members    | true
news       | true
```

#### Politikalar doğru mu?
```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('members', 'news')
ORDER BY tablename, policyname;
```

### 5️⃣ Storage Politikalarını Kontrol Edin
1. Sol menüden **Storage** > **Policies** tıklayın
2. Her bucket için politikaları görmelisiniz:
   - `member-photos`: 3 policy (SELECT public, INSERT/DELETE authenticated)
   - `news-images`: 3 policy (SELECT public, INSERT/DELETE authenticated)

## ✅ RLS Aktif Olduktan Sonra

### Artık güvenli çünkü:
- ✅ Herkes üyeleri ve haberleri **görebilir** (web sitesi için)
- ✅ Sadece **giriş yapmış adminler** veri ekleyebilir/silebilir
- ✅ API anahtarı GitHub'da görünse bile **zarar veremezler**
- ✅ Storage'daki görseller public görünebilir ama sadece admin yükleyebilir

### Örnek Senaryo:
1. Kötü niyetli biri GitHub'dan ANON_KEY'i görüyor
2. API'ye doğrudan istek gönderiyor
3. **RLS devreye giriyor:** "Sen authenticated değilsin, INSERT/UPDATE/DELETE yapamazsın!"
4. Sadece SELECT (okuma) yapabiliyor - zaten public olan datayı görüyor

## 🧪 Test Edin

### Test 1: Public Okuma (Başarılı olmalı)
Browser console'da:
```javascript
const { data, error } = await supabaseClient
  .from('members')
  .select('*');
console.log(data); // Tüm üyeleri görmeli
```

### Test 2: Authenticated Olmadan Yazma (BAŞARISIZ olmalı)
```javascript
// Önce logout olun
await supabaseClient.auth.signOut();

// Şimdi eklemeye çalışın
const { data, error } = await supabaseClient
  .from('members')
  .insert([{ name: 'Test' }]);
console.log(error); // "new row violates row-level security policy"
```

### Test 3: Authenticated ile Yazma (Başarılı olmalı)
```javascript
// Admin paneline giriş yapın
// Sonra üye eklemeyi deneyin - çalışmalı ✅
```

## 🚨 Sorun Giderme

### "Policy already exists" hatası alırsanız:
Politikalar zaten var demektir. Önce silin:
```sql
DROP POLICY IF EXISTS "Herkes üyeleri görebilir" ON members;
DROP POLICY IF EXISTS "Sadece admin üye ekleyebilir" ON members;
-- vs...
```

### Storage politikaları çalışmıyorsa:
1. Storage > Policies sayfasına gidin
2. Her bucket için manuel olarak policy ekleyin
3. Target roles: `public` veya `authenticated`
4. Policy definition: `true` (hepsine izin ver)

### Tablolar bulunamadı hatası:
```sql
-- Tabloları kontrol edin
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

## 📚 Daha Fazla Bilgi
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
