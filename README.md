# Doğancı İş İnsanları Admin Panel

## 🚀 Kurulum ve Kullanım

### ✅ Tamamlanan İşlemler

1. **Supabase Projesi Oluşturuldu**
   - URL: https://nxywtyvcqkejvehpnoyw.supabase.co
   - API Key yapılandırıldı

2. **Database Tabloları Oluşturuldu**
   - `members` tablosu (üye bilgileri)
   - `news` tablosu (haberler)

3. **Storage Bucket'ları Oluşturuldu**
   - `member-photos` (üye fotoğrafları)
   - `news-images` (haber görselleri)
   - ⚠️ **ÖNEMLİ:** Bu bucket'ları PUBLIC yapmalısınız!

### 📋 Yapılması Gerekenler

#### 1. Storage Bucket'larını Public Yapın

Supabase Dashboard → Storage:

**member-photos bucket:**
1. `member-photos` bucket'ına tıklayın
2. Sağ üstte ⚙️ (Settings) → "Policies"
3. "Public bucket" toggle'ını açın ✅

**news-images bucket:**
1. `news-images` bucket'ına tıklayın
2. Sağ üstte ⚙️ (Settings) → "Policies"  
3. "Public bucket" toggle'ını açın ✅

#### 2. Admin Kullanıcı Oluşturun

Supabase Dashboard → Authentication → Users → "Add User":

```
Email: admin@doganci.com (veya istediğiniz email)
Password: Güçlü bir şifre oluşturun
```

Bu email ve şifre ile admin paneline giriş yapacaksınız.

#### 3. Dosyaları GitHub'a Yükleyin

```bash
cd C:\Users\omer.uygun\flutter\doganci

# Yeni dosyaları ekle
git add .
git commit -m "Admin panel ve Supabase entegrasyonu eklendi"
git push origin main
```

### 📁 Dosya Yapısı

```
doganci/
├── index.html              # Ana sayfa
├── members.html            # Üye listesi (Supabase'den çekiyor)
├── news.html              # Haberler (Supabase'den çekiyor)
├── admin/
│   ├── index.html         # Admin giriş sayfası
│   ├── dashboard.html     # Admin panel
│   └── admin.js          # Admin JavaScript
├── js/
│   └── supabase-config.js # Supabase yapılandırması
└── css/
    └── style.css          # (Eğer varsa)
```

### 🎯 Kullanım

#### Admin Paneli

1. **Giriş:** https://cepni61.github.io/doganci/admin/
2. Email ve şifrenizle giriş yapın
3. Dashboard'da özet bilgileri görün

#### Üye Ekleme

1. "Üyeler" sekmesine tıklayın
2. "+ Yeni Üye Ekle" butonuna tıklayın
3. Formu doldurun:
   - Ad Soyad (zorunlu)
   - Meslek, Telefon, Email
   - Şirket, Website, Adres
   - Fotoğraf (sürükle-bırak veya tıkla)
4. "Kaydet" butonuna tıklayın

#### Haber Ekleme

1. "Haberler" sekmesine tıklayın
2. "+ Yeni Haber Ekle" butonuna tıklayın
3. Formu doldurun:
   - Başlık (zorunlu)
   - İçerik
   - Yazar
   - Görsel (sürükle-bırak)
4. "Kaydet" butonuna tıklayın

### 🌐 Canlı URL'ler

- **Ana Site:** https://cepni61.github.io/doganci/
- **Üyeler:** https://cepni61.github.io/doganci/members.html
- **Haberler:** https://cepni61.github.io/doganci/news.html
- **Admin Panel:** https://cepni61.github.io/doganci/admin/

### 🔐 Güvenlik

- Admin paneli şifre korumalıdır
- Supabase Row Level Security (RLS) aktif
- Herkes okuyabilir, sadece admin yazabilir
- API anahtarı güvenli (anon key, public kullanım için)

### 📱 Mobil Uygulama İçin Sonraki Adımlar

1. **Bubblewrap ile Android APK:**
```bash
npx @bubblewrap/cli init --manifest https://cepni61.github.io/doganci/manifest.json
npx @bubblewrap/cli build
```

2. **Capacitor ile iOS/Android:**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Doğancı İş İnsanları" com.doganci.app
npx cap add android
npx cap add ios
```

### 🆘 Sorun Giderme

**Resimler görünmüyor:**
- Storage bucket'larının public olduğundan emin olun

**Giriş yapamıyorum:**
- Supabase Dashboard → Authentication'da kullanıcı oluşturdunuz mu?
- Email ve şifre doğru mu?

**Veriler yüklenmiyor:**
- Tarayıcı console'una bakın (F12)
- Supabase URL ve API key doğru mu?
- RLS politikaları doğru mu?

### 💡 İpuçları

- Test için birkaç üye ve haber ekleyin
- Fotoğrafları PNG veya JPG formatında yükleyin
- Admin paneline giriş yapmayı unutmayın
- Tüm değişiklikler anında siteye yansır!

### 📞 Destek

Sorun yaşarsanız Supabase Dashboard → Settings → API kısmından API anahtarlarını kontrol edin.

---

**Hazırlayan:** Claude AI
**Tarih:** 9 Şubat 2026
