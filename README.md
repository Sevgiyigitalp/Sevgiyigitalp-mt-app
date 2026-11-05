# 🌐 LuminaTranslate AI - Gemini Destekli Akıllı Çeviri Uygulaması

Google Gemini API kullanan, alan (tıp, hukuk, bilişim vb.) ve üslup seçimi yapabilen, özel terimce (glossary) destekli, göz alıcı modern tasarıma (Cyber Neon & Mavi/Pembe cam efektleri) sahip Node.js makine çevirisi uygulaması.

---

## 🚀 Yeni Başlayanlar İçin Adım Adım Kurulum ve Çalıştırma

### 1. Adım: API Anahtarınızı `.env` Dosyasına Ekleyin
1. Proje klasöründeki [`.env`](file:///c:/Users/PCLAB1/Desktop/Al/s/.env) dosyasını herhangi bir metin düzenleyiciyle (Not Defteri, VS Code vb.) açın.
2. `GEMINI_API_KEY=` ifadesinin karşısına kendi Gemini API anahtarınızı yapıştırın:
   ```env
   GEMINI_API_KEY=AIzaSy...SizinKeyinizBuraya...
   ```
3. Dosyayı kaydedip kapatın.

> ℹ️ *API anahtarınız yoksa [Google AI Studio](https://aistudio.google.com/app/apikey) adresinden ücretsiz temin edebilirsiniz.*

---

### 2. Adım: Bağımlılıkları Yükleyin (Gerekirse)
Proje dizininde komut satırını (Terminal / PowerShell / CMD) açın ve şunu çalıştırın:
```bash
npm install
```
*(Paketler halihazırda yüklendiği için bu adım çok hızlı tamamlanacaktır).*

---

### 3. Adım: Sunucuyu Başlatın
Terminalde şu komutu çalıştırın:
```bash
npm start
```

Sunucu başarıyla çalıştığında şu mesajı görürsünüz:
```text
======================================================
🚀 Gemini Çeviri Sunucusu Başarıyla Başlatıldı!
🌐 Tarayıcınızda açın: http://localhost:3000
======================================================
```

---

### 4. Adım: Tarayıcıda Açın
Tarayıcınızı (Chrome, Edge, Firefox vb.) açın ve şu adrese gidin:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🌟 Öne Çıkan Özellikler

1. **Geniş Dil Yelpazesi**:
   - İngilizce, Türkçe, Almanca, İspanyolca, Fransızca, İtalyanca, Rusça, Arapça, Çince, Japonca ve Otomatik Dil Algılama.
   - Tek tıkla dilleri ve metinleri yer değiştirme butonu (`⇄`).

2. **Alan (Domain) Odaklı Çeviri**:
   - 🩺 **Tıp & Sağlık**: Klinik ve medikal terminolojiye uygun çeviri.
   - ⚖️ **Hukuk**: Sözleşme ve kanuni kesinlik odaklı terminoloji.
   - 💻 **Yazılım & IT**: Bilişim ve mühendislik terimleri.
   - 🎓 **Akademik & Bilimsel**
   - 💼 **İş Dünyası & Finans**
   - 🌐 **Genel Günlük Dil**

3. **Üslup (Tone) Seçimi**:
   - 👔 **Resmi (Formal)**: "Siz" hitabı, iş ve resmi yazışmalar için.
   - 💬 **Samimi (Casual)**: "Sen" hitabı, günlük sohbet dili.
   - ⚖️ **Doğal & Dengeli (Neutral)**
   - ✨ **Edebi (Literary)**

4. **Özel Terimce (Glossary)**:
   - Kullanıcı `kaynak terim = hedef terim` formatında özel sözlük satırları tanımlayabilir.
   - Gemini modeline verilen katı sistem talimatı sayesinde model bu terimleri çeviride **kesinlikle** uygular.
   - Tıp, Yazılım ve Hukuk için hazır şablon butonları mevcuttur.

5. **Saf Çeviri Çıktısı**:
   - Modele iletilen sistem talimatıyla gereksiz açıklamalar, tırnaklar veya `"İşte çeviri:"` gibi fazlalıklar tamamen filtrelenir; yalnızca arı çeviri döndürülür.

6. **Kullanıcı Dostu Türkçe Hata Yönetimi**:
   - Anahtar eksik veya yanlışsa, kota bittiyse veya internet koptuğunda kullanıcıya tam olarak ne olduğu ve **"Ne Yapmalısınız?"** kutucuğunda adım adım çözüm önerisi gösterilir.

7. **Tek Tıkla Kopyalama & Sesli Okuma**:
   - Çevrilen metni tek tıkla panoya kopyalama ve dinleme özelliği.

8. **Göz Alıcı Görünüm & Mobil Uyumluluk**:
   - Cyber-Luxe Neon Mavi ve Canlı Pembe cam (glassmorphism) efektleri.
   - Telefon, tablet ve masaüstü ekranlarda kusursuz duyarlı (responsive) yerleşim.

---

## 📁 Proje Dosya Yapısı
- [`server.js`](file:///c:/Users/PCLAB1/Desktop/Al/s/server.js): Express backend sunucusu, Gemini API entegrasyonu ve Türkçe hata yakalama mekanizması.
- [`public/index.html`](file:///c:/Users/PCLAB1/Desktop/Al/s/public/index.html): Responsive semantik arayüz.
- [`public/style.css`](file:///c:/Users/PCLAB1/Desktop/Al/s/public/style.css): Neon mavi ve pembe cam efektli stil dosyası.
- [`public/app.js`](file:///c:/Users/PCLAB1/Desktop/Al/s/public/app.js): İstemci kontrol mantığı, terimce yönetimi, kopyalama ve seslendirme.
- [`.env`](file:///c:/Users/PCLAB1/Desktop/Al/s/.env): API anahtarınızın yer aldığı ortam dosyası.
