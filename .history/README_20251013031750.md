# 🍦 Soft Cream Menu App - هيكل المشروع

## 📁 هيكل الملفات

```
/js
├── app.js          ← الملف الرئيسي (تهيئة التطبيق)
├── ui.js           ← إدارة واجهة المستخدم
├── cart.js         ← إدارة السلة
├── checkout.js     ← نظام إتمام الطلب
├── api.js          ← خدمة API للتكامل مع Backend (جديد)
├── products.js     ← قائمة المنتجات
├── categories.js   ← إدارة التصنيفات
└── utils.js        ← الدوال المساعدة
```

---

## 🚀 كيفية الاستخدام

### 1️⃣ إضافة الملفات في HTML

أضف هذا الكود في نهاية ملف `index.html` قبل إغلاق وسم `</body>`:

```html
<!-- المكتبات الخارجية -->
<script src="https://cdn.jsdelivr.net/npm/fuse.js@6.6.2"></script>
<script src="https://unpkg.com/lucide@latest"></script>

<!-- ملف الترجمات (يجب إنشاؤه أولاً) -->
<script src="js/translations.js"></script>

<!-- ملفات التطبيق (بالترتيب) -->
<script type="module" src="js/utils.js"></script>
<script type="module" src="js/products.js"></script>
<script type="module" src="js/categories.js"></script>
<script type="module" src="js/cart.js"></script>
<script type="module" src="js/ui.js"></script>
<script type="module" src="js/checkout.js"></script>
<script type="module" src="js/app.js"></script>
```

---

### 2️⃣ إضافة المنتجات في `products.js`

افتح ملف `products.js` وأضف منتجاتك داخل مصفوفة `products`:

```javascript
export let products = [
  {
    id: 'classic-vanilla',
    name: 'فانيليا كلاسيك',
    nameEn: 'Classic Vanilla',
    description: 'آيس كريم فانيليا كريمي ولذيذ',
    descriptionEn: 'Creamy and delicious vanilla ice cream',
    category: 'كلاسيك',
    categoryEn: 'Classic',
    price: 25,
    image: 'https://example.com/vanilla.jpg',
    badge: 'الأكثر مبيعاً' // اختياري
  },
  // أضف المزيد من المنتجات هنا...
];
```

---

### 3️⃣ إنشاء ملف الترجمات `translations.js`

أنشئ ملف `js/translations.js` بهذا المحتوى:

```javascript
window.translations = {
  ar: {
    headerTitle: 'سوفت كريم',
    headerSubtitle: 'أفضل آيس كريم في المدينة',
    navMenu: 'القائمة',
    navCart: 'السلة',
    navAbout: 'عن المتجر',
    navContact: 'اتصل بنا',
    heroBadge: 'مرحباً بك',
    heroTitle: 'استمتع بأفضل آيس كريم',
    heroDescription: 'اختر من مجموعة واسعة من النكهات',
    searchPlaceholder: 'ابحث عن المنتجات...',
    currency: 'ج.م',
    checkoutTitle: 'إتمام الطلب',
    checkoutSubtitle: 'أكمل بياناتك',
    orderSummaryTitle: 'ملخص الطلب',
    pickupTitle: 'استلام من الفرع',
    pickupDesc: 'احصل على طلبك من أقرب فرع',
    deliveryTitle: 'توصيل',
    deliveryDesc: 'توصيل إلى باب منزلك',
    nameLabel: 'الاسم',
    phoneLabel: 'رقم الهاتف',
    addressLabel: 'العنوان',
    notesLabel: 'ملاحظات',
    locationBtnText: 'استخدام الموقع الحالي',
    cancelBtn: 'إلغاء',
    permissionTitle: 'إذن الموقع',
    permissionText: 'نحتاج إذنك للوصول إلى موقعك',
    permissionCancel: 'إلغاء',
    permissionAllow: 'السماح',
    discountFirst: 'خصم 20% للطلب الأول!',
    discountSecond: 'خصم 15% للطلب الثاني!',
    discountLoyal: 'خصم 10% للعملاء المميزين!'
  },
  en: {
    headerTitle: 'Soft Cream',
    headerSubtitle: 'Best Ice Cream in Town',
    navMenu: 'Menu',
    navCart: 'Cart',
    navAbout: 'About',
    navContact: 'Contact',
    heroBadge: 'Welcome',
    heroTitle: 'Enjoy the Best Ice Cream',
    heroDescription: 'Choose from a wide variety of flavors',
    searchPlaceholder: 'Search products...',
    currency: 'EGP',
    checkoutTitle: 'Checkout',
    checkoutSubtitle: 'Complete your details',
    orderSummaryTitle: 'Order Summary',
    pickupTitle: 'Pickup',
    pickupDesc: 'Get your order from nearest branch',
    deliveryTitle: 'Delivery',
    deliveryDesc: 'Delivered to your doorstep',
    nameLabel: 'Name',
    phoneLabel: 'Phone Number',
    addressLabel: 'Address',
    notesLabel: 'Notes',
    locationBtnText: 'Use Current Location',
    cancelBtn: 'Cancel',
    permissionTitle: 'Location Permission',
    permissionText: 'We need your permission to access location',
    permissionCancel: 'Cancel',
    permissionAllow: 'Allow',
    discountFirst: '20% off for first order!',
    discountSecond: '15% off for second order!',
    discountLoyal: '10% off for loyal customers!'
  }
};
```

---

### 4️⃣ الدوال المتاحة عالمياً

بعد تحميل التطبيق، يمكنك استخدام هذه الدوال من أي مكان:

#### 📦 السلة (`window.cartModule`)
```javascript
// إضافة منتج للسلة
window.cartModule.addToCart(event, 'product-id', quantity);

// تحديث الكمية
window.cartModule.updateQuantity('product-id', 1); // زيادة
window.cartModule.updateQuantity('product-id', -1); // تقليل

// حذف منتج
window.cartModule.removeFromCart('product-id');

// فتح نافذة السلة
window.cartModule.openCartModal();

// إغلاق نافذة السلة
window.cartModule.closeCartModal();

// الحصول على محتوى السلة
const cart = window.cartModule.getCart();

// الحصول على الإجماليات
const totals = window.cartModule.getCartTotals();
// { totalItems: 5, total: 150 }
```

#### 🛒 إتمام الطلب (`window.checkoutModule`)
```javascript
// بدء عملية الشراء
window.checkoutModule.initiateCheckout();

// اختيار طريقة التوصيل
window.checkoutModule.selectDeliveryMethod('pickup'); // أو 'delivery'

// اختيار فرع
window.checkoutModule.selectBranch('maadi'); // أو 'zamalek', 'downtown'

// تأكيد الطلب
window.checkoutModule.confirmOrder();

// طلب الموقع
window.checkoutModule.requestLocation();

// تتبع الطلب
window.checkoutModule.openTrackingModal('ORD-123456');

// الحصول على بيانات الطلب الحالي
const orderData = window.checkoutModule.getCurrentOrderData();

// الحصول على الفروع
const branches = window.checkoutModule.getBranches();
```

// تبديل اللغة
window.uiModule.toggleLanguage();

// تبديل الثيم
window.uiModule.toggleTheme();

// فتح نافذة منتج
window.uiModule.openProductModal('product-id');

// البحث
window.uiModule.handleSearch();

// مسح البحث
window.uiModule.clearSearch();

// الحصول على اللغة الحالية
const lang = window.uiModule.getCurrentLang(); // 'ar' or 'en'
```

#### 📂 التصنيفات (`window.categoriesModule`)
```javascript
// اختيار تصنيف
window.categoriesModule.selectCategory('كلاسيك', element);

// إعادة عرض التصنيفات
window.categoriesModule.renderCategories();

// الحصول على أيقونة التصنيف
const icon = window.categoriesModule.getCategoryIcon('كلاسيك');

// الحصول على اسم التصنيف
const name = window.categoriesModule.getCategoryName('كلاسيك', 'en');
```

---

## 🔧 استخدام دوال المنتجات

في ملف `products.js` يمكنك استخدام:

```javascript
import { addProduct, addProducts, removeProduct, getProductById } from './products.js';

// إضافة منتج واحد
addProduct({
  id: 'new-product',
  name: 'منتج جديد',
  nameEn: 'New Product',
  // ... باقي البيانات
});

// إضافة عدة منتجات
addProducts([product1, product2, product3]);

// حذف منتج
removeProduct('product-id');

// الحصول على منتج
const product = getProductById('product-id');
```

---

## 📋 الوظائف الإضافية

### تأثير الثلج
```javascript
// يتم تشغيله تلقائياً، لكن يمكنك إيقافه بحذف السطر من app.js
// createSnowflakes();
```

### Lazy Loading للصور
```javascript
// استخدم data-src بدلاً من src
<img data-src="image.jpg" class="lazy" alt="Product">

// سيتم تحميل الصورة عند ظهورها في الشاشة
```

---

## 🎯 نصائح مهمة

### 1. ترتيب تحميل الملفات
يجب تحميل الملفات بالترتيب التالي:
1. `utils.js` (الدوال المساعدة)
2. `products.js` (البيانات)
3. `categories.js` (التصنيفات)
4. `cart.js` (السلة)
5. `ui.js` (الواجهة)
6. `checkout.js` (نظام الدفع)
7. `app.js` (التهيئة الرئيسية)

### 2. استخدام `type="module"`
جميع الملفات يجب أن تحمل بـ `type="module"` لدعم `import/export`.

### 3. التعامل مع localStorage
- السلة تُحفظ تلقائياً في `localStorage`
- بيانات المستخدم تُحفظ في `localStorage`
- الثيم واللغة يُحفظان في `localStorage`

### 4. الوصول للمتغيرات العامة
```javascript
// اللغة الحالية
console.log(window.currentLang);

// بيانات المستخدم
console.log(window.userData);

// السلة
const cart = window.cartModule.getCart();
```

---

## 🐛 حل المشاكل الشائعة

### المشكلة: الدوال غير معرفة
**الحل:** تأكد من تحميل جميع الملفات بـ `type="module"` وبالترتيب الصحيح.

### المشكلة: المنتجات لا تظهر
**الحل:** 
1. تأكد من إضافة المنتجات في `products.js`
2. افتح Console وتحقق من وجود أخطاء
3. تأكد من استدعاء `renderProducts()` في `app.js`

### المشكلة: السلة لا تعمل
**الحل:**
1. تأكد من تحميل `cart.js` بعد `products.js`
2. تحقق من وجود العناصر في HTML بالـ IDs الصحيحة

### المشكلة: الأيقونات لا تظهر
**الحل:**
1. تأكد من تحميل مكتبة Lucide
2. تأكد من استدعاء `lucide.createIcons()` بعد إضافة العناصر

---

## 📱 التوافق

- ✅ جميع المتصفحات الحديثة (Chrome, Firefox, Safari, Edge)
- ✅ الهواتف المحمولة (iOS & Android)
- ✅ وضع RTL للعربية
- ✅ الوضع الداكن (Dark Mode)
- ✅ Lazy Loading للصور

---

## 🔐 الأمان

- ✅ لا يتم استخدام `localStorage` أو `sessionStorage` في الأكواد (متوافق مع Claude.ai)
- ✅ جميع البيانات تُخزن في الذاكرة فقط
- ✅ التحقق من المدخلات (رقم الهاتف، الاسم، العنوان)

---

## 📞 الدعم

للمزيد من المساعدة، راجع:
- Console في المتصفح للأخطاء
- التعليقات داخل الملفات
- استخدم `console.log()` لتتبع المشاكل

---

## 🎉 ملاحظات نهائية

هذا الهيكل:
- ✅ **منظم:** كل ملف له وظيفة محددة
- ✅ **قابل للتوسع:** يمكن إضافة ميزات جديدة بسهولة
- ✅ **قابل للصيانة:** التعليقات والتنظيم يسهلان التطوير
- ✅ **عالي الأداء:** استخدام Lazy Loading و Request Animation Frame
- ✅ **متوافق:** يعمل على جميع الأجهزة والمتصفحات

🍦 **استمتع ببناء تطبيقك!**