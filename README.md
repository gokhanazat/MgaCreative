# Premium Developer Portfolio Website

Bu proje, modern bir full-stack yazılım mimarı için tasarlanmış, üst düzey ve yüksek performanslı kurumsal portföy web sitesidir. Sıfır derleme gereksinimi (zero-build architecture) sayesinde doğrudan GitHub Pages veya herhangi bir statik sunucuda anında yayınlanabilir.

## 🚀 Proje Yapısı

Proje dosyaları kök dizinde organize edilmiş ve birbirleriyle tam uyumlu hale getirilmiştir:
- `index.html` — Ana Sayfa (Hero Alanı, Öne Çıkan Uygulamalar, Referanslar)
- `about.html` — Hakkımızda (Profesyonel Biyografi, Teknik Uzmanlık Bento Grid'i, Zaman Tüneli)
- `portfolio.html` — Uygulamalar (Kategori filtreleme destekli interaktif portföy kartları)
- `contact.html` — İletişim (İnteraktif iletişim formu ve veri görselleştirme haritası)
- `admin.html` — Yönetim Konsolu (Ecosystem yönetimi için responsive dashboard/panel)

## 🎨 Tasarım Sistemi & Teknolojiler

- **Core Framework:** Vanilla HTML5 & ES6 Javascript.
- **Styling:** Tailwind CSS (CDN aracılığıyla, derleme/build gerektirmez).
- **Aesthetic:** Glassmorphism ve premium koyu mod tasarımı.
  - Arka Plan: Derin Lacivert/Siyah (`#101415`)
  - Birincil Detay Rengi (Cyan Glow): `#4cd7f6`
  - İkincil Vurgu Rengi (Electric Purple): `#6001d1`
- **Tipografi:** Google Fonts (`Geist`, `Inter`, `JetBrains Mono`)
- **İkonlar:** Google Material Symbols

## 🌐 Git ve GitHub Pages Üzerinde Yayınlama Kılavuzu

Sitenizi GitHub Pages üzerinden ücretsiz olarak canlıya almak için aşağıdaki adımları izleyin:

1. **Yerel Git Deposunu Başlatın:**
   ```bash
   git init
   git add .
   git commit -m "initial: premium portfolio release"
   ```

2. **GitHub Üzerinde Yeni Bir Repository Oluşturun:**
   - GitHub hesabınıza giriş yapın.
   - **New** butonuna tıklayarak yeni bir repository oluşturun (örneğin: `my-portfolio`).
   - Repository'nizin **Public** (Açık) olduğundan emin olun.

3. **Yerel Deponuzu GitHub'a Bağlayın ve Push Edin:**
   ```bash
   git remote add origin https://github.com/KULLANICI_ADINIZ/REPOSITROY_ADINIZ.git
   git branch -M main
   git push -u origin main
   ```

4. **GitHub Pages'i Etkinleştirin:**
   - GitHub üzerindeki repository sayfanızda **Settings** (Ayarlar) sekmesine gidin.
   - Sol menüden **Pages** seçeneğine tıklayın.
   - **Build and deployment** başlığı altındaki **Source** kısmını "Deploy from a branch" olarak seçin.
   - **Branch** ayarını `main` ve klasörü `/ (root)` yaparak **Save** (Kaydet) deyin.
   - Birkaç dakika içinde siteniz `https://KULLANICI_ADINIZ.github.io/REPOSITORY_ADINIZ/` adresinde canlıya geçecektir!

---
*Built with precision and high-end design aesthetics.*
