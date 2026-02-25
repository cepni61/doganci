# Doğancı İş İnsanları Admin Panel


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
