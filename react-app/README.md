# 🍦 Soft Cream React Mini-App

React Mini-App for Smart Nutrition & Energy system.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd react-app
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

الآن افتح: http://localhost:3000

### 3. Build for Production
```bash
npm run build
```

الملفات ستكون في: `../dist/react-app`

---

## 📁 Project Structure

```
react-app/
├── src/
│   ├── components/          # React Components
│   │   ├── ProductCard.jsx
│   │   ├── ProductModal.jsx
│   │   ├── ProductsGrid.jsx
│   │   ├── NutritionSummary.jsx
│   │   ├── FilterBar.jsx
│   │   └── EnergyBadge.jsx
│   ├── context/
│   │   └── ProductsContext.jsx  # Global State
│   ├── hooks/
│   │   └── useNutrition.js      # Custom Hooks
│   ├── styles/
│   │   └── index.css            # Tailwind + Custom CSS
│   ├── App.jsx                  # Main App Component
│   └── main.jsx                 # Entry Point
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 🎨 Features

- ✅ **Smart Discovery**: فلترة بالطاقة والسعرات
- ✅ **FTS5 Search**: بحث ذكي وسريع
- ✅ **Nutrition Summary**: ملخص تغذية للسلة
- ✅ **Product Recommendations**: منتجات مشابهة
- ✅ **Energy Badges**: عرض نوع الطاقة
- ✅ **Responsive Design**: متجاوب مع جميع الشاشات
- ✅ **RTL Support**: دعم كامل للعربية

---

## 🔧 Technologies

- **React 18** - UI Framework
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Swiper** - Touch Slider
- **Lucide React** - Icons

---

## 📡 API Integration

يتصل التطبيق بـ Backend API:
```
https://softcream-api.mahmoud-zahran20025.workers.dev
```

### Available Endpoints:
- `GET /products` - جميع المنتجات
- `GET /products/discover` - فلترة ذكية
- `GET /products/search` - بحث
- `POST /products/nutrition-summary` - ملخص التغذية
- `GET /products/recommendations/:id` - توصيات

---

## 🎯 Next Steps

1. ✅ إنشاء Components المتبقية
2. ✅ إضافة Swiper للمنتجات
3. ✅ تحسين UX/UI
4. ✅ اختبار التكامل مع Backend

---

## 📝 Notes

- التطبيق يعمل بشكل مستقل عن الموقع الأصلي
- يمكن دمجه لاحقاً في `index.html` الرئيسي
- جميع الأسعار تُحسب من Backend فقط (أمان)
