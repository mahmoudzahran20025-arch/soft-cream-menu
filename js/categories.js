// ================================================================
// categories.js - إدارة التصنيفات (محسّن)
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
  'classic': 'ice-cream-cone',
  'fruits': 'apple',
  'premium': 'star',
  'luxury': 'crown'
};

// ================================================================
// ===== عرض التصنيفات =====
// ✅ إضافة data-category attribute لكل تاب
// ================================================================
export function renderCategories() {
  try {
    const products = productsManager.getAllProducts();
    
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
    
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const container = document.getElementById('categoriesScroll');
    
    if (!container) {
      console.error('❌ categoriesScroll not found!');
      return;
    }
    
    const currentLang = window.currentLang || 'ar';
    
    // ✅ زر "الكل" مع data-category="all"
    let html = `
      <button class="category-tab active" data-category="all" onclick="window.categoriesModule.selectCategory('all', this)">
        <i data-lucide="grid-3x3"></i>
        <span>${currentLang === 'ar' ? 'الكل' : 'All'}</span>
      </button>
    `;
    
    uniqueCategories.forEach(cat => {
      if (!cat) return;
      
      const catName = getCategoryName(cat, currentLang);
      const icon = getCategoryIcon(cat);
      
      // ✅ CRITICAL: إضافة data-category attribute
      html += `
        <button class="category-tab" data-category="${cat}" onclick="window.categoriesModule.selectCategory('${cat}', this)">
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
    
  } catch (error) {
    console.error('❌ Error rendering categories:', error);
  }
}

// ================================================================
// ===== اختيار تصنيف =====
// ================================================================
export function selectCategory(category, element) {
  try {
    // ✅ إزالة active من جميع التابات
    document.querySelectorAll('.category-tab').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // ✅ إضافة active للتاب المختار
    if (element) {
      element.classList.add('active');
    }
    
    if (category === 'all') {
      // الكل - اسكرول لأعلى
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // فئة محددة - اسكرول للفئة
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
      } else {
        console.warn(`Category element not found: category-${category}`);
      }
    }
  } catch (error) {
    console.error('❌ Error selecting category:', error);
  }
}

// ================================================================
// ===== الحصول على أيقونة التصنيف =====
// ================================================================
export function getCategoryIcon(category) {
  if (!category) return 'ice-cream-cone';
  
  // ✅ Normalize the category (lowercase + trim)
  const normalized = category.toLowerCase().trim();
  
  return iconMap[normalized] || iconMap[category] || 'ice-cream-cone';
}

// ================================================================
// ===== الحصول على اسم التصنيف =====
// ================================================================
export function getCategoryName(category, lang = 'ar') {
  try {
    if (!category) {
      return lang === 'ar' ? 'بدون تصنيف' : 'Uncategorized';
    }
    
    // إذا كانت اللغة عربي، أرجع الفئة مباشرة
    if (lang === 'ar') {
      return category;
    }
    
    // للغة الإنجليزية، ابحث عن الترجمة
    const products = productsManager.getAllProducts();
    
    if (!products || products.length === 0) {
      return category;
    }
    
    // ✅ ابحث عن أول منتج بهذه الفئة وخذ categoryEn منه
    const product = products.find(p => p && p.category === category);
    
    if (product && product.categoryEn) {
      return product.categoryEn;
    }
    
    // Fallback إلى الفئة الأصلية
    return category;
    
  } catch (error) {
    console.error('❌ Error getting category name:', error, { category, lang });
    return category || 'Unknown';
  }
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

console.log('✅ Categories module loaded (Fixed with data-category)');