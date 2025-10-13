// ================================================================
// categories.js - إدارة التصنيفات
// ================================================================

import { productsManager } from './products.js';

// ================================================================
// ===== أيقونات التصنيفات =====
// ================================================================

const iconMap = {
  'كلاسيك': 'ice-cream-cone',
  'فواكه': 'apple',
  'مميز': 'star',
  'فاخر': 'crown',
  // إضافات محتملة:
  'classic': 'ice-cream-cone',
  'fruits': 'apple',
  'premium': 'star',
  'luxury': 'crown'
};

// ================================================================
// ===== عرض التصنيفات =====
// ================================================================
export function renderCategories() {
  // ✅ الحصول على المنتجات من productsManager
  const products = productsManager.getAllProducts();
  
  // إذا لم تكن المنتجات محملة بعد
  if (products.length === 0) {
    console.warn('⚠️ No products loaded yet. Categories will be empty.');
    
    const container = document.getElementById('categoriesScroll');
    if (container) {
      container.innerHTML = `
        <div class="categories-loading">
          <span>${window.currentLang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
        </div>
      `;
    }
    return;
  }
  
  const uniqueCategories = [...new Set(products.map(p => p.category))];
  const container = document.getElementById('categoriesScroll');
  
  if (!container) {
    console.error('❌ categoriesScroll not found!');
    return;
  }
  
  const currentLang = window.currentLang || 'ar';
  
  let html = `
    <button class="category-tab active" onclick="window.categoriesModule.selectCategory('all', this)">
      <i data-lucide="grid-3x3"></i>
      <span>${currentLang === 'ar' ? 'الكل' : 'All'}</span>
    </button>
  `;
  
  uniqueCategories.forEach(cat => {
    const catName = getCategoryName(cat, currentLang);
    const icon = getCategoryIcon(cat);
    
    html += `
      <button class="category-tab" onclick="window.categoriesModule.selectCategory('${cat}', this)">
        <i data-lucide="${icon}"></i>
        <span>${catName}</span>
      </button>
    `;
  });
  
  container.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log('✅ Categories rendered:', uniqueCategories.length);
}

// ================================================================
// ===== اختيار تصنيف =====
// ================================================================
export function selectCategory(category, element) {
  // تحديث الـ active tab
  document.querySelectorAll('.category-tab').forEach(btn => btn.classList.remove('active'));
  if (element) element.classList.add('active');
  
  if (category === 'all') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    const el = document.getElementById(`category-${category}`);
    if (el) {
      const header = document.getElementById('header');
      const categories = document.getElementById('categoriesSection');
      
      const headerHeight = header ? header.getBoundingClientRect().height : 100;
      const categoriesHeight = categories ? categories.getBoundingClientRect().height : 80;
      const offset = headerHeight + categoriesHeight + 20;
      
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ 
        top: elementPosition - offset, 
        behavior: 'smooth' 
      });
    }
  }
}

// ================================================================
// ===== الحصول على أيقونة التصنيف =====
// ================================================================
export function getCategoryIcon(category) {
  return iconMap[category] || 'ice-cream-cone';
}

// ================================================================
// ===== الحصول على اسم التصنيف =====
// ================================================================
export function getCategoryName(category, lang = 'ar') {
  if (lang === 'ar') {
    return category;
  }
  
  // ✅ الحصول على المنتجات من productsManager
  const products = productsManager.getAllProducts();
  const product = products.find(p => p.category === category);
  
  return product?.categoryEn || category;
}

// ================================================================
// ===== تصدير الوحدة للنافذة العامة =====
// ================================================================
if (typeof window !== 'undefined') {
  window.categoriesModule = {
    selectCategory,
    renderCategories,
    getCategoryIcon,
    getCategoryName
  };
}

console.log('✅ Categories module loaded');