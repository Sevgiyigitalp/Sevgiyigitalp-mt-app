/**
 * Gemini Çeviri Uygulaması - Sunucu Kodu (server.js)
 * Express ve Google Generative AI (@google/generative-ai) kullanır.
 */

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// .env dosyasındaki değişkenleri yükle
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// JSON gövdelerini ve form verilerini parse edebilmek için middleware
app.use(express.json({ limit: '5mb' }));

// public klasöründeki statik web dosyalarını (HTML, CSS, JS) sun
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Gemini Hata Mesajı Çevirici ve Çözüm Rehberi
 * Kullanıcıya teknik hata yerine ne olduğunu ve ne yapması gerektiğini açıklar.
 */
function handleGeminiError(error) {
  const message = (error?.message || '').toLowerCase();
  const status = error?.status || 0;

  // 1. API Anahtarı eksik veya geçersiz
  if (message.includes('api_key') || message.includes('api key') || message.includes('unauthorized') || status === 401 || status === 403) {
    return {
      status: 401,
      title: 'API Anahtarı Geçersiz veya Eksik',
      description: 'Gemini API anahtarınız doğrulanamadı.',
      solution: 'Projenin kök dizinindeki .env dosyasını açıp GEMINI_API_KEY değerini kontrol edin veya Google AI Studio üzerinden yeni bir anahtar alıp sunucuyu yeniden başlatın.'
    };
  }

  // 2. Kota / Rate Limit aşımı
  if (message.includes('quota') || message.includes('resource_exhausted') || message.includes('rate limit') || status === 429) {
    return {
      status: 429,
      title: 'API Kullanım Kotası Doldu',
      description: 'Gemini API ücretsiz kullanım sınırına veya anlık istek limitine ulaşıldı.',
      solution: 'Lütfen birkaç dakika bekleyip tekrar deneyin. Sık istek atıyorsanız kısa süre ara verin veya Google Cloud konsolundan kotanızı yükseltin.'
    };
  }

  // 3. Ağ / İnternet bağlantı sorunu
  if (message.includes('enotfound') || message.includes('econnrefused') || message.includes('network') || message.includes('fetch failed')) {
    return {
      status: 503,
      title: 'İnternet Bağlantı Hatası',
      description: 'Google Gemini sunucularına erişilemiyor.',
      solution: 'Lütfen internet bağlantınızı ve varsa VPN/Proxy ayarlarınızı kontrol edip tekrar deneyin.'
    };
  }

  // 4. İçerik güvenlik engeli (Safety / Moderation)
  if (message.includes('safety') || message.includes('blocked') || message.includes('candidate')) {
    return {
      status: 400,
      title: 'İçerik Güvenlik Filtresine Takıldı',
      description: 'Metin, Gemini güvenlik politikaları nedeniyle çevrilemedi.',
      solution: 'Lütfen çevirmek istediğiniz metni gözden geçirip zararlı veya sakıncalı ifadeleri çıkartarak tekrar deneyin.'
    };
  }

  // 5. Model bulunamadı veya geçersiz model adı
  if (message.includes('not found') || message.includes('models/')) {
    return {
      status: 404,
      title: 'Model Erişimi Sorunu',
      description: 'Belirtilen Gemini modeli anahtarınız için aktif olmayabilir.',
      solution: 'API anahtarınızın seçilen modeli desteklediğinden emin olun veya sunucu kodundaki model adını güncelleyin.'
    };
  }

  // Genel beklenmeyen hata
  return {
    status: 500,
    title: 'Çeviri Sırasında Bir Hata Oluştu',
    description: error?.message || 'Bilinmeyen bir sunucu hatası oluştu.',
    solution: 'Lütfen birkaç saniye sonra tekrar deneyin. Sorun sürerse konsol loglarını inceleyin.'
  };
}

/**
 * /api/translate Çeviri Endpoint'i
 * İstek gövdesi:
 * {
 *   text: "Çevrilecek metin",
 *   sourceLang: "auto" | "en" | "tr" ...,
 *   targetLang: "tr" | "en" ...,
 *   domain: "general" | "medical" | "legal" | "tech" ...,
 *   tone: "neutral" | "formal" | "casual" ...,
 *   glossary: "term1 = terim1\nterm2 = terim2"
 * }
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang, targetLang, domain, tone, glossary } = req.body;

    // Metin kontrolü
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          title: 'Metin Eksik',
          description: 'Lütfen çevrilmesini istediğiniz bir metin girin.',
          solution: 'Metin kutusuna en az bir cümle veya kelime yazıp tekrar "Çevir"e tıklayın.'
        }
      });
    }

    // Hedef dil kontrolü
    if (!targetLang) {
      return res.status(400).json({
        success: false,
        error: {
          title: 'Hedef Dil Seçilmedi',
          description: 'Lütfen çevrilecek hedef dili belirleyin.',
          solution: 'Açılır menüden bir hedef dil seçin.'
        }
      });
    }

    // API Anahtarı kontrolü
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('BURAYA_GEMINI_API_KEY')) {
      return res.status(401).json({
        success: false,
        error: {
          title: 'Gemini API Anahtarı Bulunamadı',
          description: 'Projenin .env dosyasında GEMINI_API_KEY tanımlanmamış.',
          solution: 'Proje klasöründeki .env dosyasını bir metin düzenleyiciyle açın ve GEMINI_API_KEY= kısmına Google AI Studio anahtarınızı yazıp kaydedin. Ardından sunucuyu yeniden başlatın.'
        }
      });
    }

    // Alan (Domain) açıklaması
    const domainDescriptions = {
      general: 'Genel günlük kullanım ve standart terminoloji.',
      medical: 'Tıp, sağlık, anatomi ve klinik literatür terminolojisi. Tıbbi terimleri doğru, hassas ve uzman seviyesinde çevir.',
      legal: 'Hukuk, mevzuat, sözleşme ve adli terminoloji. Resmi kanuni terimler ve hukuki kesinlik esastır.',
      tech: 'Bilişim, yazılım mühendisliği, yapay zeka ve teknik donanım terminolojisi. Sektör standardı terimleri gözet.',
      academic: 'Akademik makale, bilimsel araştırma ve akademik yayın üslubu.',
      business: 'İş dünyası, finans, ekonomi, pazarlama ve kurumsal yazışma terminolojisi.'
    };

    // Üslup (Tone) açıklaması
    const toneDescriptions = {
      neutral: 'Doğal, dengeli ve nesnel bir üslup.',
      formal: 'Resmi, kurumsal, saygılı, mesafeli ve ciddi bir üslup (Örn. Siz hitabı, resmi belgeler için).',
      casual: 'Samimi, günlük konuşma dili, akıcı ve rahat bir üslup (Örn. Sen hitabı, sosyal medya/arkadaş sohbeti).',
      literary: 'Edebi, zengin kelime dağarcığına sahip, estetik ve akıcı bir üslup.'
    };

    const selectedDomain = domainDescriptions[domain] || domainDescriptions.general;
    const selectedTone = toneDescriptions[tone] || toneDescriptions.neutral;

    // Terimce (Glossary) ayrıştırma
    let parsedGlossary = [];
    if (glossary && typeof glossary === 'string') {
      const lines = glossary.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && trimmed.includes('=')) {
          const parts = trimmed.split('=');
          const sourceTerm = parts[0].trim();
          const targetTerm = parts.slice(1).join('=').trim();
          if (sourceTerm && targetTerm) {
            parsedGlossary.push({ source: sourceTerm, target: targetTerm });
          }
        }
      }
    }

    // Terimce talimat metni oluşturma
    let glossaryInstruction = '';
    if (parsedGlossary.length > 0) {
      glossaryInstruction = `
ZORUNLU TERİMCE (GLOSSARY) KURALI:
Metin içinde aşağıdaki kaynak terimler geçtiğinde, hedef dilde KESİNLİKLE belirtilen karşılıklarını kullanmalısın. Bu kural tüm diğer çeviri tercihlerine göre en yüksek önceliğe sahiptir:
${parsedGlossary.map((g) => `- "${g.source}" => "${g.target}"`).join('\n')}
`;
    }

    // Model için Sistem Talimatı (System Instruction)
    const systemInstruction = `
Sen dünya standartlarında profesyonel bir makine çevirisi uzmanısın.
Görevin, sana verilen metni kaynak dilden hedef dile en doğru, akıcı ve bağlama uygun şekilde çevirmektir.

TEMEL VE KATI KURALLAR:
1. SADECE VE SADECE ÇEVİRİ METNİNİ DÖNDÜR.
2. Asla tırnak işareti, başlık, "İşte çeviri:", "Translation:", "Çeviri:" gibi açıklamalar veya notlar ekleme.
3. Çeviri dışındaki hiçbir selamlaşma, özet veya dipnot yazma.
4. Kaynak metindeki satır başlarını, paragrafları ve noktalama yapısını koru.
5. Belirtilen Alan (Domain) ve Üslup (Tone) kurallarına eksiksiz uy.
${glossaryInstruction}
`;

    // Kullanıcı istemi (User Prompt)
    const prompt = `
[Kaynak Dil]: ${sourceLang === 'auto' ? 'Otomatik Algıla' : sourceLang}
[Hedef Dil]: ${targetLang}
[Uzmanlık Alanı]: ${selectedDomain}
[Üslup]: ${selectedTone}

[Çevrilecek Metin]:
${text}
`;

    // Google Generative AI İstemcisini Başlat (gemini-3.5-flash-lite)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash-lite',
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.3 // Çeviri tutarlılığı için düşük sıcaklık
      }
    });

    const result = await model.generateContent(prompt);

    const response = await result.response;
    let translatedText = response.text() || '';

    // Çıktıyı temizle: olası baştaki/sondaki tırnakları veya boşlukları kaldır
    translatedText = translatedText.trim();
    if (
      (translatedText.startsWith('"') && translatedText.endsWith('"')) ||
      (translatedText.startsWith('“') && translatedText.endsWith('”'))
    ) {
      translatedText = translatedText.slice(1, -1).trim();
    }

    return res.json({
      success: true,
      data: {
        translation: translatedText,
        detectedLang: sourceLang === 'auto' ? 'Otomatik Algılandı' : sourceLang
      }
    });
  } catch (error) {
    console.error('Gemini API Hatası:', error);
    const parsed = handleGeminiError(error);
    return res.status(parsed.status).json({
      success: false,
      error: {
        title: parsed.title,
        description: parsed.description,
        solution: parsed.solution
      }
    });
  }
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Gemini Çeviri Sunucusu Başarıyla Başlatıldı!`);
  console.log(`🌐 Tarayıcınızda açın: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
