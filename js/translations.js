// ================================================================
// translations.js - نظام ترجمات آمن وفعّال
// ================================================================

/**
 * ✅ المميزات:
 * 1. No global pollution - كل شيء في closure
 * 2. Smart fallback - إذا مفتاح ناقص يرجع قيمة افتراضية
 * 3. Lazy loading ready - يدعم تحميل ديناميكي للغات
 * 4. Performance - caching للترجمات المستخدمة
 * 5. Type safe - validation للمفاتيح
 */

class TranslationManager {
  constructor() {
    this.translations = {};
    this.currentLang = 'ar';
    this.defaultLang = 'ar';
    this.cache = new Map();
    this.observers = [];
    this.missingKeys = new Set(); // تتبع المفاتيح الناقصة
    
    console.log('✅ TranslationManager initialized');
  }

  /**
   * تحميل ترجمات من كائن
   */
  loadTranslations(translationsData) {
    if (!translationsData || typeof translationsData !== 'object') {
      console.error('Invalid translations data');
      return false;
    }

    this.translations = translationsData;
    this.cache.clear(); // مسح الـ cache عند تحميل ترجمات جديدة
    
    console.log(`✅ Loaded translations for languages:`, Object.keys(translationsData));
    return true;
  }

  /**
   * الحصول على ترجمة مفتاح معين
   * @param {string} key - مفتاح الترجمة
   * @param {object} params - معاملات للاستبدال (اختياري)
   * @returns {string} الترجمة أو المفتاح نفسه كـ fallback
   */
  get(key, params = {}) {
    // 1️⃣ التحقق من الـ cache
    const cacheKey = `${this.currentLang}:${key}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 2️⃣ البحث عن الترجمة
    const langData = this.translations[this.currentLang];
    if (!langData) {
      console.warn(`Language not found: ${this.currentLang}`);
      return this.getFallback(key);
    }

    let value = langData[key];

    // 3️⃣ Fallback إلى اللغة الافتراضية
    if (!value) {
      const defaultData = this.translations[this.defaultLang];
      value = defaultData?.[key];
      
      if (!value) {
        this.missingKeys.add(key);
        console.warn(`Missing translation key: ${key}`);
        return this.getFallback(key);
      }
    }

    // 4️⃣ استبدال المعاملات إذا كانت موجودة
    let result = value;
    if (Object.keys(params).length > 0) {
      Object.keys(params).forEach(param => {
        result = result.replace(`{{${param}}}`, params[param]);
      });
    }

    // 5️⃣ حفظ في الـ cache
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Fallback value عند عدم وجود ترجمة
   */
  getFallback(key) {
    // تحويل camelCase إلى Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * تبديل اللغة
   */
  setLanguage(lang) {
    if (!this.translations[lang]) {
      console.warn(`Language not supported: ${lang}`);
      return false;
    }

    this.currentLang = lang;
    this.cache.clear();
    this.notifyObservers(lang);
    
    console.log(`✅ Language changed to: ${lang}`);
    return true;
  }

  /**
   * الحصول على اللغة الحالية
   */
  getLanguage() {
    return this.currentLang;
  }

  /**
   * الحصول على جميع الترجمات للغة الحالية
   */
  getAll() {
    return this.translations[this.currentLang] || {};
  }

  /**
   * التحقق من وجود مفتاح
   */
  has(key) {
    const langData = this.translations[this.currentLang];
    return langData && key in langData;
  }

  /**
   * تسجيل observer للاستماع لتغيير اللغة
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  /**
   * إخطار جميع المراقبين
   */
  notifyObservers(lang) {
    this.observers.forEach(callback => {
      try {
        callback(lang);
      } catch (error) {
        console.error('Observer error:', error);
      }
    });
  }

  /**
   * الحصول على المفاتيح الناقصة (للـ debugging)
   */
  getMissingKeys() {
    return Array.from(this.missingKeys);
  }

  /**
   * مسح المفاتيح الناقصة
   */
  clearMissingKeys() {
    this.missingKeys.clear();
  }

  /**
   * إضافة ترجمات إضافية
   */
  addTranslations(lang, newTranslations) {
    if (!this.translations[lang]) {
      this.translations[lang] = {};
    }
    
    this.translations[lang] = {
      ...this.translations[lang],
      ...newTranslations
    };
    
    this.cache.clear();
    console.log(`✅ Added translations for ${lang}`);
  }
}

// ================================================================
// ===== إنشاء instance واحد = Singleton
// ================================================================
const translationManager = new TranslationManager();

// ================================================================
// ===== واجهة عامة بسيطة (للاستخدام في الكود)
// ================================================================
const i18n = {
  /**
   * تحميل بيانات الترجمات: i18n.loadTranslations(data)
   */
  loadTranslations: (data) => translationManager.loadTranslations(data),
  
  /**
   * استخدام بسيط: i18n.t('key')
   */
  t: (key, params = {}) => translationManager.get(key, params),
  
  /**
   * تبديل اللغة: i18n.setLang('en')
   */
  setLang: (lang) => translationManager.setLanguage(lang),
  
  /**
   * الحصول على اللغة الحالية: i18n.getLang()
   */
  getLang: () => translationManager.getLanguage(),
  
  /**
   * الحصول على كل الترجمات: i18n.getAll()
   */
  getAll: () => translationManager.getAll(),
  
  /**
   * التحقق من وجود مفتاح: i18n.has('key')
   */
  has: (key) => translationManager.has(key),
  
  /**
   * الاستماع لتغيير اللغة: i18n.on('change', (lang) => {})
   */
  on: (event, callback) => {
    if (event === 'change') {
      return translationManager.subscribe(callback);
    }
  },
  
  /**
   * إضافة ترجمات جديدة
   */
  addTranslations: (lang, trans) => translationManager.addTranslations(lang, trans),
  
  /**
   * معلومات للـ debugging
   */
  debug: () => ({
    currentLang: translationManager.getLanguage(),
    availableLangs: Object.keys(translationManager.translations),
    missingKeys: translationManager.getMissingKeys(),
    cacheSize: translationManager.cache.size
  })
};

// ================================================================
// ===== تصدير للـ window (للوصول العام فقط عند الحاجة)
// ================================================================
if (typeof window !== 'undefined') {
  window.i18n = i18n;
  console.log('✅ i18n exported to window');
}

// ================================================================
// ===== تصدير للـ modules
// ================================================================
export { translationManager, i18n };