# 🌐 تواصل ملفات الترجمة - Connection Map

## 📊 التدفق الكامل للترجمة:

```
1️⃣ js/translations.js
   ↓ (i18n manager)
2️⃣ js/translations-data.js
   ↓ (base translations: 129 keys)
3️⃣ js/translations-data-additions.js
   ↓ (new translations: 60+ keys)
4️⃣ js/app.bootstrap.js
   ↓ (initApp() - merges all)
5️⃣ js/global-functions.js
   ↓ (listens for changes)
6️⃣ React Components & UI
```

---

## 🔗 تفاصيل الاتصال:

### 1️⃣ **js/translations.js**
```javascript
// يصدر i18n manager
export { i18n, translationManager };

// i18n object له:
- t(key, params) - الحصول على ترجمة
- setLang(lang) - تغيير اللغة
- addTranslations(lang, data) - إضافة ترجمات جديدة
- on('change', callback) - الاستماع للتغييرات
```

### 2️⃣ **js/translations-data.js**
```javascript
// بيانات أساسية - 129 مفتاح
export const translationsData = {
  "ar": { "addToCart": "أضف للسلة", ... },
  "en": { "addToCart": "Add to Cart", ... }
};
```

### 3️⃣ **js/translations-data-additions.js**
```javascript
// ترجمات إضافية - 60+ مفتاح جديد
export const translationsAdditions = {
  "ar": { "viewDetails": "التفاصيل", "modeBoostBrain": "تعزيز التركيز", ... },
  "en": { "viewDetails": "View Details", "modeBoostBrain": "Boost Focus", ... }
};
```

### 4️⃣ **js/app.bootstrap.js**
```javascript
// ✅ استيراد كل الملفات
import { i18n } from './translations.js';
import { translationsData } from './translations-data.js';
import { translationsAdditions } from './translations-data-additions.js';

// ✅ دمج كل الترجمات
i18n.loadTranslations(translationsData);           // 129 keys
i18n.addTranslations('ar', translationsAdditions.ar); // +60 keys
i18n.addTranslations('en', translationsAdditions.en); // +60 keys
// الإجمالي: ~189 مفتاح للغة
```

### 5️⃣ **js/global-functions.js**
```javascript
// يستمع لتغييرات اللغة
window.i18n.on('change', (newLang) => {
  updateVanillaUI(newLang);
  // يرسل event للـ React
  window.dispatchEvent(new CustomEvent('language-changed', { 
    detail: { lang: newLang } 
  }));
});
```

---

## 🧪 اختبار التواصل:

### في Console (F12):
```javascript
// 1️⃣ التحقق من إجمالي الترجمات
console.log('Total keys:', Object.keys(window.i18n.getAll()).length);
// يجب تطبع: ~189

// 2️⃣ اختبار ترجمة أساسية
console.log('Base:', window.i18n.t('addToCart'));
// يجب تطبع: "أضف للسلة" (Arabic) أو "Add to Cart" (English)

// 3️⃣ اختبار ترجمة إضافية
console.log('Addition:', window.i18n.t('viewDetails'));
// يجب تطبع: "التفاصيل" (Arabic) أو "View Details" (English)

// 4️⃣ اختبار ترجمة nutrition
console.log('Nutrition:', window.i18n.t('modeBoostBrain'));
// يجب تطبع: "تعزيز التركيز" (Arabic) أو "Boost Focus" (English)
```

---

## 📋 قائمة المفاتيح الجديدة (60+):

### Navigation & UI (2 keys)
- `navOrders`, `navLanguage`

### Search & Filters (13 keys)
- `searchNoResults`, `filterAll`, `sortBy`, `sortPopular`

### Product Features (11 keys)
- `viewDetails`, `quickAdd`, `outOfStock`, `ingredients`, `nutrition`

### Cart Enhancements (9 keys)
- `cartItemsCount`, `cartClearAll`, `cartItemRemove`

### Checkout (15 keys)
- `deliveryMethod`, `customerInfo`, `paymentMethod`

### Coupons (7 keys)
- `couponCode`, `couponApply`, `couponSuccess`

### Order Status (8 keys)
- `statusReady`, `statusOnWay`, `orderDate`

### Nutrition Features (17 keys)
- `modeBoostBrain`, `modeFuelEnergy`, `nutritionConscious`

### Support & Footer (14 keys)
- `contactUs`, `whatsappUs`, `footerAbout`

---

## ✅ التحقق من النجاح:

### Console Messages (بالترتيب):
```
✅ i18n system initialized with base data
✅ i18n additions merged successfully
✅ Language set to: ar
📊 Total translation keys loaded: 189
✅ Subscribed to i18n language change events
```

### HTML Elements Test:
```javascript
// اختبر أي عنصر له data-i18n
document.querySelector('[data-i18n="addToCart"]').textContent;
// يجب يرجع الترجمة الصحيحة
```

---

## 🔧 إذا مش شغال:

### 1️⃣ تحقق من الاستيراد:
```javascript
console.log('i18n available:', typeof window.i18n !== 'undefined');
console.log('translationsData loaded:', typeof translationsData !== 'undefined');
console.log('translationsAdditions loaded:', typeof translationsAdditions !== 'undefined');
```

### 2️⃣ تحقق من الدمج:
```javascript
const keys = Object.keys(window.i18n.getAll());
console.log('Arabic keys:', keys.length);
console.log('Sample addition:', window.i18n.t('viewDetails'));
```

### 3️⃣ تحقق من اللغة:
```javascript
console.log('Current lang:', window.i18n.getLang());
console.log('Available langs:', Object.keys(window.i18n.translations));
```

---

**🎉 كل الملفات متصلة الآن ببعضها بشكل كامل!** 🚀

**التدفق:** Base Data → Additions → Bootstrap → Global Functions → UI
