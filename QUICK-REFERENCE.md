# ⚡ مرجع سريع - Soft Cream Hybrid System

> **دليل سريع للمطورين** - أسئلة وأجوبة

---

## 🎯 أين أذهب لـ...؟

### **تعديل الهيدر**
```
📍 index.html (lines 40-120)
```

### **تعديل السايد بار**
```
📍 index.html (sidebar section)
📍 js/sidebar.js
```

### **تعديل عرض المنتجات**
```
📍 react-app/src/components/ProductsGrid.jsx
📍 react-app/src/components/ProductCard.jsx
```

### **تعديل السلة (Cart)**
```
📍 react-app/src/components/NutritionSummary.jsx
📍 react-app/src/App.jsx (cart state)
```

### **تعديل التشيك أوت**
```
📍 index.html (#checkoutModal)
📍 js/checkout/checkout-core.js (logic)
📍 js/checkout/checkout-ui.js (UI)
```

### **تعديل الألوان**
```
📍 react-app/tailwind.config.js
ثم: npm run build:inject
```

### **تعديل الـ API**
```
📍 js/api.js (Vanilla)
📍 react-app/src/context/ProductsContext.jsx (React)
```

---

## 🔧 أوامر مهمة

### **بناء المشروع**
```bash
cd react-app
npm run build:inject
```

### **تشغيل الـ Dev Server (للاختبار فقط)**
```bash
cd react-app
npm run dev
# ⚠️ لا تنسى build:inject بعد الانتهاء!
```

### **تثبيت Dependencies**
```bash
cd react-app
npm install
```

---

## 📡 الأحداث (Events)

### **Vanilla → React**

| Event | متى يطلق؟ | ماذا يفعل؟ |
|-------|-----------|-----------|
| `open-react-cart` | عند الضغط على أيقونة السلة | يفتح سلة React |
| `clear-react-cart-after-order` | بعد نجاح الطلب | يفرغ سلة React |

### **React → Vanilla**

| Event | متى يطلق؟ | ماذا يفعل؟ |
|-------|-----------|-----------|
| `react-cart-updated` | عند تغيير السلة | يحدث الـ badge |
| `initiate-checkout` | عند الضغط "إتمام الطلب" | يفتح نافذة الدفع |

---

## 🐛 حل المشاكل السريع

### **المشكلة: الزر لا يظهر**
```javascript
// في Console
console.log(cart.length); // يجب أن يكون > 0
document.getElementById('cartFooterMobile').style.display = 'block';
```

### **المشكلة: checkoutModule is not defined**
```javascript
// في Console
console.log(window.checkoutModule); // يجب أن يكون object
// إذا كان undefined، أعد تحميل الصفحة
```

### **المشكلة: CSS لا يعمل**
```bash
cd react-app
npm run build:inject
# ثم Hard Refresh: Ctrl + Shift + R
```

### **المشكلة: المنتجات لا تظهر**
```javascript
// في Console
console.log('API URL:', 'https://softcream-api.mahmoud-zahran20025.workers.dev');
// تأكد من أن الـ API يعمل
```

---

## 📦 الملفات الأساسية (Top 10)

| # | الملف | المسئولية |
|---|-------|-----------|
| 1 | `index.html` | الحاضن الرئيسي |
| 2 | `js/cart.js` | الجسر بين Vanilla و React |
| 3 | `js/checkout.js` | نقطة دخول التشيك أوت |
| 4 | `js/checkout/checkout-core.js` | منطق الدفع |
| 5 | `react-app/src/App.jsx` | دماغ React |
| 6 | `react-app/src/context/ProductsContext.jsx` | Global state |
| 7 | `react-app/src/components/NutritionSummary.jsx` | سلة التسوق |
| 8 | `react-app/tailwind.config.js` | تنسيقات CSS |
| 9 | `react-app/inject-build.js` | أداة الحقن |
| 10 | `js/api.js` | خدمة الـ API |

---

## 🎨 تخصيص الألوان

```javascript
// react-app/tailwind.config.js
colors: {
  primary: {
    500: '#ef4444',  // اللون الأساسي
    600: '#dc2626',  // عند الـ hover
  },
  energy: {
    mental: '#8b5cf6',    // بنفسجي
    physical: '#f59e0b',  // برتقالي
    balanced: '#10b981',  // أخضر
  }
}
```

---

## 🔐 الأمان

### **✅ Do's**
- دائماً validate البيانات في الـ Backend
- لا ترسل الأسعار من الـ Client
- استخدم HTTPS فقط
- احفظ الـ API keys في environment variables

### **❌ Don'ts**
- لا تثق في البيانات من الـ Client
- لا تحسب الأسعار في الـ Frontend
- لا تحفظ بيانات حساسة في localStorage
- لا تعرض الـ API keys في الكود

---

## 📊 الأداء

### **Metrics**
- First Paint: ~1.2s
- Interactive: ~2.5s
- Bundle Size: ~127KB total

### **تحسينات**
- ✅ Code splitting (checkout modules)
- ✅ Lazy loading (React components)
- ✅ CSS purging (Tailwind)
- ✅ Image optimization (WebP)

---

## 🚀 Deployment Checklist

```bash
# 1. Build React
cd react-app
npm run build:inject

# 2. Test locally
# افتح index.html في المتصفح

# 3. Commit changes
git add .
git commit -m "Build: Update React bundle"

# 4. Push to production
git push origin main

# 5. Verify
# افتح الموقع وتأكد من كل شيء
```

---

## 📞 الدعم

### **للمزيد من التفاصيل:**
- `README-dev.md` - دليل الصيانة الكامل
- `TECHNICAL-DEEP-DIVE.md` - التفاصيل التقنية
- `IMPLEMENTATION_PLAN.md` - خطة التنفيذ

### **Console Debugging:**
```javascript
// تفعيل الـ debug mode
localStorage.setItem('debug', 'true');

// عرض جميع الـ events
window.addEventListener('*', (e) => console.log(e.type, e.detail));

// عرض الـ cart state
console.log('Cart:', getCart());
console.log('Checkout Module:', window.checkoutModule);
```

---

**آخر تحديث:** 2025-01-30  
**الإصدار:** 1.0.0
