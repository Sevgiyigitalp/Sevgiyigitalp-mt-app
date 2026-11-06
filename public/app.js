/**
 * LuminaTranslate AI - İstemci Tarafı Javascript Kodu (app.js)
 * Çeviri istekleri, terimce yönetimi, pano kopyalama ve hata gösterimini yönetir.
 */

// DOM Elemanları
const sourceText = document.getElementById('sourceText');
const targetText = document.getElementById('targetText');
const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const domainSelect = document.getElementById('domainSelect');
const toneSelect = document.getElementById('toneSelect');
const glossaryInput = document.getElementById('glossaryInput');

const translateBtn = document.getElementById('translateBtn');
const swapLangsBtn = document.getElementById('swapLangsBtn');
const copyBtn = document.getElementById('copyBtn');
const copyBtnText = document.getElementById('copyBtnText');
const pasteBtn = document.getElementById('pasteBtn');
const clearSourceBtn = document.getElementById('clearSourceBtn');
const speakBtn = document.getElementById('speakBtn');

const toggleGlossaryBtn = document.getElementById('toggleGlossaryBtn');
const closeGlossaryBtn = document.getElementById('closeGlossaryBtn');
const glossarySection = document.getElementById('glossarySection');
const glossaryCountBadge = document.getElementById('glossaryCountBadge');
const clearGlossaryBtn = document.getElementById('clearGlossaryBtn');

const targetPlaceholder = document.getElementById('targetPlaceholder');
const loadingSkeleton = document.getElementById('loadingSkeleton');
const charCount = document.getElementById('charCount');
const targetCharCount = document.getElementById('targetCharCount');

const errorCard = document.getElementById('errorCard');
const errorTitle = document.getElementById('errorTitle');
const errorDesc = document.getElementById('errorDesc');
const errorSolution = document.getElementById('errorSolution');
const dismissErrorBtn = document.getElementById('dismissErrorBtn');

// Hazır Örnek Şablonlar
const sampleTexts = {
  medical: {
    domain: 'medical',
    tone: 'formal',
    source: 'The patient presented with acute myocardial infarction and severe dyspnea. Immediate catheterization revealed significant left anterior descending artery occlusion.',
    glossary: 'myocardial infarction = kalp krizi (akut miyokard enfarktüsü)\ncatheterization = anjiyografi kateterizasyonu'
  },
  tech: {
    domain: 'tech',
    tone: 'neutral',
    source: 'The CI/CD pipeline failed during docker build due to an uncaught exception in the asynchronous microservice middleware.',
    glossary: 'pipeline = dağıtım hattı\nmiddleware = ara katman yazılımı'
  },
  formal: {
    domain: 'legal',
    tone: 'formal',
    source: 'This Agreement shall enter into force upon signature by both parties and shall remain valid for a term of twelve (12) consecutive months.',
    glossary: 'Agreement = İşbu Sözleşme\nenter into force = yürürlüğe girmek'
  }
};

const glossaryPresets = {
  medical: 'myocardial infarction = miyokard enfarktüsü\nhypertension = hipertansiyon (yüksek tansiyon)\nacute = akut / ivedi\nbiopsy = biyopsi tetkiki',
  tech: 'backend = sunucu tarafı mimarisi\npipeline = sürekli entegrasyon hattı\ncache = önbellek\ndeprecate = kullanımdan kaldırmak',
  legal: 'Agreement = Sözleşme\nParty = Taraf\nbreach = ihlal\nliability = hukuki sorumluluk'
};

// ====================================================================
// Karakter Sayacı ve Giriş Dinleyicileri
// ====================================================================
sourceText.addEventListener('input', () => {
  const count = sourceText.value.length;
  charCount.textContent = `${count} karakter`;
});

glossaryInput.addEventListener('input', updateGlossaryBadge);

function updateGlossaryBadge() {
  const lines = glossaryInput.value
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.includes('='));
  
  if (lines.length > 0) {
    glossaryCountBadge.textContent = lines.length;
    glossaryCountBadge.classList.remove('hidden');
    toggleGlossaryBtn.classList.add('active');
  } else {
    glossaryCountBadge.classList.add('hidden');
    toggleGlossaryBtn.classList.remove('active');
  }
}

// ====================================================================
// Terimce Paneli Açma / Kapatma & Şablonlar
// ====================================================================
toggleGlossaryBtn.addEventListener('click', () => {
  const isHidden = glossarySection.classList.toggle('hidden');
  toggleGlossaryBtn.setAttribute('aria-expanded', !isHidden);
  if (!isHidden) glossaryInput.focus();
});

closeGlossaryBtn.addEventListener('click', () => {
  glossarySection.classList.add('hidden');
  toggleGlossaryBtn.setAttribute('aria-expanded', 'false');
});

document.querySelectorAll('.template-btn[data-preset]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const presetKey = btn.getAttribute('data-preset');
    glossaryInput.value = glossaryPresets[presetKey] || '';
    updateGlossaryBadge();
  });
});

clearGlossaryBtn.addEventListener('click', () => {
  glossaryInput.value = '';
  updateGlossaryBadge();
});

// ====================================================================
// Hızlı Örnek Doldurucular (Chips)
// ====================================================================
document.querySelectorAll('.sample-chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    const sampleKey = btn.getAttribute('data-sample');
    const data = sampleTexts[sampleKey];
    if (data) {
      sourceText.value = data.source;
      domainSelect.value = data.domain;
      toneSelect.value = data.tone;
      sourceLang.value = 'İngilizce';
      targetLang.value = 'Türkçe';
      if (data.glossary) {
        glossaryInput.value = data.glossary;
        glossarySection.classList.remove('hidden');
      }
      charCount.textContent = `${data.source.length} karakter`;
      updateGlossaryBadge();
      hideError();
    }
  });
});

// ====================================================================
// Dilleri Değiştir (Swap Languages)
// ====================================================================
swapLangsBtn.addEventListener('click', () => {
  if (sourceLang.value === 'auto') {
    // Otomatik algıla ise varsayılan İngilizceye al
    sourceLang.value = targetLang.value;
    targetLang.value = 'İngilizce';
  } else {
    const temp = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = temp;
  }

  // Eğer hedef metin varsa kaynakla da yer değiştirebilir
  if (targetText.value && !targetText.classList.contains('hidden')) {
    const tempText = sourceText.value;
    sourceText.value = targetText.value;
    targetText.value = tempText;
    charCount.textContent = `${sourceText.value.length} karakter`;
    targetCharCount.textContent = `${targetText.value.length} karakter`;
  }
});

// ====================================================================
// Pano Yapıştırma & Temizleme
// ====================================================================
pasteBtn.addEventListener('click', async () => {
  try {
    const clipText = await navigator.clipboard.readText();
    if (clipText) {
      sourceText.value = clipText;
      charCount.textContent = `${clipText.length} karakter`;
      sourceText.focus();
    }
  } catch (err) {
    alert('Panodan yapıştırma izni verilemedi. Lütfen elle Ctrl+V ile yapıştırın.');
  }
});

clearSourceBtn.addEventListener('click', () => {
  sourceText.value = '';
  charCount.textContent = '0 karakter';
  sourceText.focus();
});

// ====================================================================
// Tek Tıkla Çeviriyi Kopyalama
// ====================================================================
copyBtn.addEventListener('click', async () => {
  const text = targetText.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add('copied');
    copyBtnText.textContent = 'Kopyalandı! ✓';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtnText.textContent = 'Kopyala';
    }, 2000);
  } catch (err) {
    // Eski yöntem yedeği
    targetText.select();
    document.execCommand('copy');
    copyBtnText.textContent = 'Kopyalandı! ✓';
    setTimeout(() => {
      copyBtnText.textContent = 'Kopyala';
    }, 2000);
  }
});

// ====================================================================
// Sesli Okuma (Web Speech API)
// ====================================================================
speakBtn.addEventListener('click', () => {
  const text = targetText.value;
  if (!text || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Hedef dile göre ses dili ayarla
  const langMap = {
    Türkçe: 'tr-TR',
    İngilizce: 'en-US',
    Almanca: 'de-DE',
    İspanyolca: 'es-ES',
    Fransızca: 'fr-FR',
    İtalyanca: 'it-IT',
    Rusça: 'ru-RU',
    Arapça: 'ar-SA',
    Çince: 'zh-CN',
    Japonca: 'ja-JP'
  };
  utterance.lang = langMap[targetLang.value] || 'en-US';
  window.speechSynthesis.speak(utterance);
});

// ====================================================================
// Hata Kartı Yönetimi (Türkçe Açıklama & Çözüm)
// ====================================================================
function showError(errData) {
  errorTitle.textContent = errData.title || 'Bir Hata Oluştu';
  errorDesc.textContent = errData.description || 'İşlem tamamlanamadı.';
  errorSolution.textContent = errData.solution || 'Lütfen internet bağlantınızı ve API anahtarınızı kontrol edin.';
  errorCard.classList.remove('hidden');
  errorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
  errorCard.classList.add('hidden');
}

dismissErrorBtn.addEventListener('click', hideError);

// ====================================================================
// Klavye Kısayolu: Ctrl + Enter / Cmd + Enter ile Çevir
// ====================================================================
sourceText.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    translate();
  }
});

// Çevir Butonuna Tıklama
translateBtn.addEventListener('click', translate);

// ====================================================================
// Ana Çeviri Fonksiyonu (Gemini API İstek Gönderimi)
// ====================================================================
async function translate() {
  const text = sourceText.value.trim();
  if (!text) {
    showError({
      title: 'Kaynak Metin Boş',
      description: 'Çevrilmesini istediğiniz metni girmediniz.',
      solution: 'Lütfen sol taraftaki alana bir metin yazın veya yapıştırın ve ardından "Çevir" düğmesine basın.'
    });
    sourceText.focus();
    return;
  }

  hideError();

  // Yükleme durumu UI aktif et
  setLoadingState(true);

  try {
    const payload = {
      text: text,
      sourceLang: sourceLang.value,
      targetLang: targetLang.value,
      domain: domainSelect.value,
      tone: toneSelect.value,
      glossary: glossaryInput.value
    };

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const err = data.error || {
        title: 'Sunucu Hatası (' + response.status + ')',
        description: 'Çeviri isteği işlenirken beklenmeyen bir durum meydana geldi.',
        solution: 'Lütfen .env dosyasındaki GEMINI_API_KEY anahtarını kontrol edip sayfayı yenileyin.'
      };
      showError(err);
      targetPlaceholder.classList.remove('hidden');
      targetText.classList.add('hidden');
    } else {
      // Başarılı çeviri
      const translated = data.data.translation || '';
      targetText.value = translated;
      targetCharCount.textContent = `${translated.length} karakter`;

      targetPlaceholder.classList.add('hidden');
      targetText.classList.remove('hidden');
    }
  } catch (networkErr) {
    showError({
      title: 'Sunucuya Ulaşılamıyor (Ağ Hatası)',
      description: 'Node.js sunucusu çalışmıyor veya ağ bağlantısı koptu.',
      solution: 'Terminalde "npm start" komutuyla sunucuyu başlattığınızdan ve http://localhost:3000 adresinde olduğunuzdan emin olun.'
    });
    targetPlaceholder.classList.remove('hidden');
    targetText.classList.add('hidden');
  } finally {
    setLoadingState(false);
  }
}

// UI Yükleme Durumu
function setLoadingState(isLoading) {
  if (isLoading) {
    translateBtn.disabled = true;
    translateBtn.querySelector('.btn-text').textContent = 'Çevriliyor...';
    translateBtn.querySelector('.btn-spinner').classList.remove('hidden');
    translateBtn.querySelector('.btn-arrow').classList.add('hidden');

    targetPlaceholder.classList.add('hidden');
    targetText.classList.add('hidden');
    loadingSkeleton.classList.remove('hidden');
  } else {
    translateBtn.disabled = false;
    translateBtn.querySelector('.btn-text').textContent = 'Çevir';
    translateBtn.querySelector('.btn-spinner').classList.add('hidden');
    translateBtn.querySelector('.btn-arrow').classList.remove('hidden');

    loadingSkeleton.classList.add('hidden');
  }
}
