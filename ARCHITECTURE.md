# 🏗️ Software Architecture

> **Hybrid Application:** 50% Vanilla JS + 50% React

---

## 📊 **Overview**

```
┌─────────────────────────────────────────────────────────┐
│                    Soft Cream App                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │   Vanilla Zone   │      │    React Zone    │       │
│  │   (#vanilla-app) │      │   (#react-root)  │       │
│  ├──────────────────┤      ├──────────────────┤       │
│  │ • Header         │      │ • Products Grid  │       │
│  │ • Sidebar        │      │ • Product Modal  │       │
│  │ • Featured       │      │ • Cart Modal     │       │
│  │ • Marquee        │      │ • Checkout       │       │
│  └──────────────────┘      └──────────────────┘       │
│           │                         │                  │
│           └─────────┬───────────────┘                  │
│                     ▼                                  │
│         ┌───────────────────────┐                      │
│         │   Communication       │                      │
│         │   • StateBridge       │                      │
│         │   • AppEvents         │                      │
│         │   • CSS Variables     │                      │
│         └───────────────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 **Communication Strategy**

### **1️⃣ State Management (StateBridge)**

**المبدأ:** Single source of truth للـ state المشترك

```javascript
// Vanilla → React
window.stateBridge.setState('cart', [
  { id: 1, name: 'Ice Cream', price: 50 }
]);

// React يستقبل تلقائياً
function Cart() {
  const [cart] = useStateBridge('cart', []);
  return <div>Items: {cart.length}</div>;
}
```

**الملفات:**
- `js/state-bridge.js` - Core implementation
- `react-app/src/hooks/useStateBridge.js` - React hook

---

### **2️⃣ Event System (AppEvents)**

**المبدأ:** Custom Events للتواصل بين المناطق

```javascript
// Vanilla يرسل
import { emit, AppEvents } from './js/app-events.js';
emit(AppEvents.CART_UPDATED, { count: 3 });

// React يستقبل
import { listen, AppEvents } from '@/js/app-events';
useEffect(() => {
  return listen(AppEvents.CART_UPDATED, (data) => {
    console.log('Cart updated:', data);
  });
}, []);
```

**Event Names:**
- `app:cart:updated` - تحديث السلة
- `app:language:changed` - تغيير اللغة
- `app:theme:changed` - تغيير الثيم
- `app:modal:opened` - فتح Modal
- [المزيد في `js/app-events.js`]

---

### **3️⃣ CSS Strategy (Variables)**

**المبدأ:** CSS Variables كمصدر واحد

```css
/* components.css - المصدر الوحيد */
:root {
  --color-primary: #FF6B9D;
  --color-secondary: #C9A0DC;
}

/* tailwind.config.js - يقرأ من المصدر */
colors: {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
}
```

**النتيجة:**
- ✅ Vanilla: `var(--color-primary)` → #FF6B9D
- ✅ React: `bg-primary` → #FF6B9D
- ✅ موحد 100%!

---

## 📁 **File Structure**

```
soft-cream/
├── index.html                 # Vanilla HTML
├── js/
│   ├── app.bootstrap.js       # تهيئة التطبيق
│   ├── state-bridge.js        # ✅ State management
│   ├── app-events.js          # ✅ Event system
│   ├── translations.js        # نظام الترجمة
│   ├── global-functions.js    # وظائف عامة
│   └── modules/
│       ├── sidebar.js
│       ├── featured-swiper.js
│       └── marquee-swiper.js
├── styles/
│   └── components.css         # ✅ CSS Variables (المصدر)
├── react-app/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── context/
│   │   │   └── ProductsContext.jsx
│   │   ├── hooks/
│   │   │   ├── useStateBridge.js   # ✅ State hook
│   │   │   └── useAppEvent.js      # ✅ Event hook
│   │   └── components/
│   └── tailwind.config.js     # ✅ يقرأ من CSS Variables
└── dist/                      # Build output
```

---

## 🎯 **DOM Ownership Rules**

### **القاعدة الذهبية:**
> كل عنصر DOM له مالك واحد فقط!

```html
<!-- ✅ صحيح -->
<body>
  <!-- Vanilla Zone -->
  <div id="vanilla-app">
    <header id="vanilla-header">...</header>
    <aside id="vanilla-sidebar">...</aside>
  </div>
  
  <!-- React Zone -->
  <div id="react-root"></div>
  
  <!-- Shared Zone (Portals) -->
  <div id="modal-root"></div>
</body>
```

```html
<!-- ❌ خطأ -->
<div id="header">
  <!-- Vanilla يتحكم هنا -->
  <button id="cart-btn">السلة</button>
</div>

<script>
  // React يحاول التحكم في نفس المنطقة! ❌
  ReactDOM.render(<Header />, document.getElementById('header'));
</script>
```

---

## 🏷️ **Naming Conventions**

### **1. DOM IDs**

**القاعدة:**
```
[owner]-[section]-[element]-[action]
```

**أمثلة:**
```html
<!-- ✅ صحيح -->
<button id="vanilla-header-cart-btn">السلة</button>
<div id="react-modal-close-btn">إغلاق</div>

<!-- ❌ خطأ -->
<button id="btn">زر</button>
<button id="submit">إرسال</button>
```

---

### **2. CSS Classes**

**القاعدة:**

| النوع | Prefix | مثال | الاستخدام |
|-------|--------|------|-----------|
| **Vanilla Only** | `v-` | `.v-header` | Vanilla HTML فقط |
| **React Only** | `r-` | `.r-modal` | React Components فقط |
| **Shared** | لا يوجد | `.btn-primary` | كلاهما |
| **Tailwind** | لا يوجد | `.bg-blue-500` | كلاهما |

**أمثلة:**
```css
/* components.css */
@layer components {
  /* Vanilla-specific */
  .v-card { ... }
  .v-sidebar { ... }
  
  /* React-specific */
  .r-product-card { ... }
  .r-modal { ... }
  
  /* Shared */
  .btn-primary { ... }
  .form-input { ... }
}
```

---

## 🔧 **Build Process**

### **Development:**

```bash
# Vanilla + React معاً
npm run dev:both

# React فقط
npm run dev:react

# Vanilla فقط (Live Server)
npm run dev:vanilla
```

---

### **Production:**

```bash
# Build both
npm run build

# Validate
npm run validate

# Test locally
npm run serve
```

---

### **Build Pipeline:**

```
1. React Build (Vite)
   ├── Bundle React code
   ├── Process Tailwind CSS
   └── Output to dist/react-app/

2. Inject Build
   ├── Read built files
   ├── Inject into index.html
   └── Update paths

3. Validate
   ├── Check file existence
   ├── Verify CSS Variables
   └── Test event system

4. ✅ Ready to deploy!
```

---

## 🧪 **Testing Strategy**

### **1. State Sync Test:**

```javascript
// في Console
// 1. أضف من Vanilla
window.stateBridge.setState('test', { value: 123 });

// 2. تحقق من React
// يجب أن يظهر تلقائياً في React components
```

---

### **2. Event Test:**

```javascript
// في Console
// 1. استمع للحدث
window.appEvents.listen('app:test', (data) => {
  console.log('Received:', data);
});

// 2. أطلق الحدث
window.appEvents.emit('app:test', { message: 'Hello' });

// يجب أن يطبع: Received: { message: 'Hello' }
```

---

### **3. CSS Test:**

```javascript
// في Console
// 1. تحقق من CSS Variable
getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary')
// يجب أن يطبع: "#FF6B9D"

// 2. قارن الألوان
const vanillaHeader = document.querySelector('#vanilla-header');
const reactCard = document.querySelector('.r-product-card');

getComputedStyle(vanillaHeader).backgroundColor;
getComputedStyle(reactCard).backgroundColor;
// يجب أن يكونا متطابقين!
```

---

## 🐛 **Debugging**

### **State Bridge:**

```javascript
// عرض كل الـ state
console.log(window.stateBridge.getAllState());

// مراقبة تغييرات
window.stateBridge.subscribe('cart', (newValue, oldValue) => {
  console.log('Cart changed:', { oldValue, newValue });
});
```

---

### **Events:**

```javascript
// عرض كل الـ listeners
Object.keys(window.appEvents.AppEvents).forEach(key => {
  const eventName = window.appEvents.AppEvents[key];
  console.log(eventName, getEventListeners(window)[eventName]);
});
```

---

### **Performance:**

```javascript
// قياس وقت التحميل
performance.timing.loadEventEnd - performance.timing.navigationStart;

// قياس React render
React.Profiler // في Development mode
```

---

## 📚 **Best Practices**

### **✅ افعل:**

1. **استخدم StateBridge** للـ state المشترك
2. **استخدم AppEvents** للتواصل بين المناطق
3. **استخدم CSS Variables** للألوان
4. **استخدم Namespaced IDs** للعناصر
5. **وثق كل تغيير** في الـ Architecture

---

### **❌ لا تفعل:**

1. **لا تلمس DOM** من منطقة أخرى
2. **لا تستخدم Global Selectors** (`document.querySelectorAll('*')`)
3. **لا تكرر Event Listeners**
4. **لا تستخدم `!important`** في CSS (إلا للضرورة)
5. **لا تخلط State** بين Vanilla و React بدون StateBridge

---

## 🚀 **Performance Guidelines**

### **1. Code Splitting:**

```javascript
// vite.config.js
manualChunks: {
  'vendor': ['react', 'react-dom'],
  'swiper': ['swiper'],
  'ui': ['./src/components/UI'],
}
```

---

### **2. Lazy Loading:**

```javascript
// React
const ProductModal = lazy(() => import('./ProductModal'));

// Vanilla
<img loading="lazy" src="product.jpg">
```

---

### **3. Memoization:**

```javascript
// React
const ProductCard = React.memo(({ product }) => {
  return <div>{product.name}</div>;
});

const handleAdd = useCallback((product) => {
  // ...
}, []);
```

---

## 📖 **Related Documentation**

- **CSS-MIGRATION.md** - استراتيجية CSS
- **COLOR-UNIFICATION.md** - توحيد الألوان
- **I18N-SYSTEM.md** - نظام الترجمة
- **README-dev.md** - دليل التطوير
- **QUICK-REFERENCE.md** - مرجع سريع

---

## 🔄 **Migration Path**

### **من Vanilla إلى React:**

```javascript
// Before (Vanilla)
document.getElementById('cart-btn').addEventListener('click', () => {
  // Add to cart
});

// After (React)
function CartButton() {
  const [cart, setCart] = useStateBridge('cart', []);
  
  const handleAdd = () => {
    setCart([...cart, newItem]);
  };
  
  return <button onClick={handleAdd}>Add</button>;
}
```

---

### **من React إلى Vanilla:**

```javascript
// Before (React state)
const [theme, setTheme] = useState('light');

// After (StateBridge)
const [theme, setTheme] = useStateBridge('theme', 'light');
// الآن Vanilla يمكنه الوصول أيضاً!
```

---

## 📊 **Metrics**

| Metric | Current | Target |
|--------|---------|--------|
| **Bundle Size** | 350KB | < 400KB |
| **Page Load** | 1.5s | < 2s |
| **State Sync** | Instant | < 50ms |
| **Event Latency** | < 10ms | < 20ms |

---

**Last Updated:** 2025-01-30  
**Version:** 2.0.0  
**Status:** ✅ Production Ready
