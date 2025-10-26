/*
/ ❌ قبل - كان فيه بس iconMap
const iconMap = {
  'كلاسيك': 'ice-cream-cone',
  // ...
};

// ✅ بعد - بقى categoryConfig فيه icon + colors
const categoryConfig = {
  'كلاسيك': {
    icon: 'ice-cream-cone',
    color: 'from-pink-500 to-rose-500',      // ← جديد
    iconColor: 'text-pink-600'                // ← جديد
  },
  'سوفت': { },  // ← فئة جديدة كاملة
  // ...
};*/
/*
2️⃣ تعديل renderCategories():
javascript// ❌ قبل - HTML بسيط
html += `
  <button class="category-tab" ...>
    <i data-lucide="${icon}"></i>
    <span>${catName}</span>
  </button>
`;

// ✅ بعد - HTML بـ Tailwind Classes + ألوان
html += `
  <button class="category-tab ... bg-white border-2 ..." ...>
    <div class="... bg-gradient-to-br ${config.color}">  ← دائرة ملونة
      <i data-lucide="${config.icon}" class="text-white"></i>
    </div>
    <span class="font-semibold ...">${catName}</span>
  </button>
`;

3️⃣ تعديل selectCategory():
javascript// ✅ إضافة: لما تختار category، لونها يتغير
if (element) {
  const config = getCategoryConfig(category);
  element.className = `... bg-gradient-to-r ${config.color} text-white ...`;
}

4️⃣ إضافة function جديدة:
javascript// ✅ جديدة - بدل ما كان getCategoryIcon بس
function getCategoryConfig(category) {
  // ترجع: { icon, color, iconColor }
}

5️⃣ تعديل getCategoryIcon():
javascript// ❌ قبل
return iconMap[normalized] || 'ice-cream-cone';

// ✅ بعد
const config = getCategoryConfig(category);
return config.icon;
*/


// ================================================================
// categories.js - إدارة التصنيفات (محسّن مع ألوان + SVG Icons)
// ================================================================

import { productsManager } from './products.js';

// ================================================================
// ===== أيقونات التصنيفات مع الألوان =====
// ================================================================
const categoryConfig = {
  'كلاسيك': {
    icon: 'ice-cream',
    color: 'from-pink-500 to-rose-500',
    iconColor: 'text-pink-600 dark:text-pink-400'
  },
  'فواكه': {
    icon: 'apple',
    color: 'from-green-500 to-emerald-500',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  'مميز': {
    icon: 'star',
    color: 'from-yellow-500 to-amber-500',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  'فاخر': {
    icon: 'sparkles',
    color: 'from-purple-500 to-violet-500',
    iconColor: 'text-purple-600 dark:text-purple-400'
  },
  'سوفت': {
    icon: 'ice-cream',
    color: 'from-cyan-500 to-blue-500',
    iconColor: 'text-cyan-600 dark:text-cyan-400'
  },
  'حلويات': {
    icon: 'cake',
    color: 'from-orange-500 to-amber-500',
    iconColor: 'text-orange-600 dark:text-orange-400'
  },
  'مشروبات': {
    icon: 'coffee',
    color: 'from-brown-500 to-amber-700',
    iconColor: 'text-brown-600 dark:text-brown-400'
  },
  'بسكويت': {
    icon: 'cookie',
    color: 'from-amber-500 to-yellow-500',
    iconColor: 'text-amber-600 dark:text-amber-400'
  },
  'حار': {
    icon: 'flame',
    color: 'from-red-500 to-orange-500',
    iconColor: 'text-red-600 dark:text-red-400'
  },
  'عروض': {
    icon: 'gift',
    color: 'from-indigo-500 to-purple-500',
    iconColor: 'text-indigo-600 dark:text-indigo-400'
  },
  'ميلك شيك': {
    icon: 'milk',
    color: 'from-blue-400 to-cyan-400',
    iconColor: 'text-blue-500 dark:text-blue-400'
  },
  'حلوى': {
    icon: 'candy',
    color: 'from-pink-400 to-rose-400',
    iconColor: 'text-pink-500 dark:text-pink-400'
  },
  // English versions
  'classic': {
    icon: 'ice-cream',
    color: 'from-pink-500 to-rose-500',
    iconColor: 'text-pink-600 dark:text-pink-400'
  },
  'fruits': {
    icon: 'apple',
    color: 'from-green-500 to-emerald-500',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  'premium': {
    icon: 'star',
    color: 'from-yellow-500 to-amber-500',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  'luxury': {
    icon: 'sparkles',
    color: 'from-purple-500 to-violet-500',
    iconColor: 'text-purple-600 dark:text-purple-400'
  },
  'soft': {
    icon: 'ice-cream',
    color: 'from-cyan-500 to-blue-500',
    iconColor: 'text-cyan-600 dark:text-cyan-400'
  },
  'desserts': {
    icon: 'cake',
    color: 'from-orange-500 to-amber-500',
    iconColor: 'text-orange-600 dark:text-orange-400'
  },
  'drinks': {
    icon: 'coffee',
    color: 'from-brown-500 to-amber-700',
    iconColor: 'text-brown-600 dark:text-brown-400'
  },
  'cookies': {
    icon: 'cookie',
    color: 'from-amber-500 to-yellow-500',
    iconColor: 'text-amber-600 dark:text-amber-400'
  },
  'hot': {
    icon: 'flame',
    color: 'from-red-500 to-orange-500',
    iconColor: 'text-red-600 dark:text-red-400'
  },
  'offers': {
    icon: 'gift',
    color: 'from-indigo-500 to-purple-500',
    iconColor: 'text-indigo-600 dark:text-indigo-400'
  },
  'milkshakes': {
    icon: 'milk',
    color: 'from-blue-400 to-cyan-400',
    iconColor: 'text-blue-500 dark:text-blue-400'
  },
  'candy': {
    icon: 'candy',
    color: 'from-pink-400 to-rose-400',
    iconColor: 'text-pink-500 dark:text-pink-400'
  }
};

// ================================================================
// ===== عرض التصنيفات =====
// ================================================================
export function renderCategories() {
  try {
    const products = productsManager.getAllProducts();
    
    if (products.length === 0) {
      console.warn('⚠️ No products loaded yet. Categories will be empty.');
      
      const container = document.getElementById('categoriesScroll');
      if (container) {
        container.innerHTML = `
          <div class="flex items-center justify-center w-full py-4">
            <span class="text-gray-500 dark:text-gray-400">${window.currentLang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
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
    
    // ✅ زر "الكل" مع تصميم مميز
    let html = `
      <button class="category-tab group relative px-5 py-2.5 rounded-full transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" 
              data-category="all" 
              onclick="window.categoriesModule.selectCategory('all', this)">
        <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <svg class="w-4 h-4" aria-hidden="true"><use href="#utensils"></use></svg>
        </div>
        <span class="font-bold text-sm whitespace-nowrap">${currentLang === 'ar' ? 'الكل' : 'All'}</span>
      </button>
    `;
    
    uniqueCategories.forEach(cat => {
      if (!cat) return;
      
      const catName = getCategoryName(cat, currentLang);
      const config = getCategoryConfig(cat);
      
      html += `
        <button class="category-tab group relative px-5 py-2.5 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 transition-all duration-300 flex items-center gap-2 hover:border-transparent hover:shadow-lg hover:scale-105 active:scale-95"
                data-category="${cat}" 
                onclick="window.categoriesModule.selectCategory('${cat}', this)">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-sm">
            <svg class="w-4 h-4 text-white" aria-hidden="true"><use href="#${config.icon}"></use></svg>
          </div>
          <span class="font-semibold text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap group-hover:text-gray-900 dark:group-hover:text-white">${catName}</span>
        </button>
      `;
    });
    
    container.innerHTML = html;
    
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
    // إزالة active من جميع التابات
    document.querySelectorAll('.category-tab').forEach(btn => {
      btn.classList.remove('active');
      
      // إزالة التنسيقات الخاصة بالـ active
      if (btn.dataset.category === 'all') {
        // زر الكل يرجع للتصميم الأصلي
        btn.className = 'category-tab group relative px-5 py-2.5 rounded-full transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95';
      } else {
        // باقي الأزرار
        btn.className = 'category-tab group relative px-5 py-2.5 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 transition-all duration-300 flex items-center gap-2 hover:border-transparent hover:shadow-lg hover:scale-105 active:scale-95';
      }
    });
    
    // إضافة active للتاب المختار
    if (element) {
      element.classList.add('active');
      
      // تصميم خاص للـ active
      if (category === 'all') {
        element.className = 'category-tab active group relative px-5 py-2.5 rounded-full transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white shadow-xl scale-105';
      } else {
        const config = getCategoryConfig(category);
        element.className = `category-tab active group relative px-5 py-2.5 rounded-full transition-all duration-300 flex items-center gap-2 bg-gradient-to-r ${config.color} text-white border-0 shadow-xl scale-105`;
      }
    }
    
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
  } catch (error) {
    console.error('❌ Error selecting category:', error);
  }
}

// ================================================================
// ===== الحصول على إعدادات التصنيف =====
// ================================================================
function getCategoryConfig(category) {
  if (!category) {
    return {
      icon: 'ice-cream',
      color: 'from-gray-500 to-gray-600',
      iconColor: 'text-gray-600 dark:text-gray-400'
    };
  }
  
  const normalized = category.toLowerCase().trim();
  
  return categoryConfig[normalized] || categoryConfig[category] || {
    icon: 'ice-cream',
    color: 'from-pink-500 to-rose-500',
    iconColor: 'text-pink-600 dark:text-pink-400'
  };
}

// ================================================================
// ===== الحصول على أيقونة التصنيف =====
// ================================================================
export function getCategoryIcon(category) {
  const config = getCategoryConfig(category);
  return config.icon;
}

// ================================================================
// ===== الحصول على اسم التصنيف =====
// ================================================================
export function getCategoryName(category, lang = 'ar') {
  try {
    if (!category) {
      return lang === 'ar' ? 'بدون تصنيف' : 'Uncategorized';
    }
    
    if (lang === 'ar') {
      return category;
    }
    
    const products = productsManager.getAllProducts();
    
    if (!products || products.length === 0) {
      return category;
    }
    
    const product = products.find(p => p && p.category === category);
    
    if (product && product.categoryEn) {
      return product.categoryEn;
    }
    
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

console.log('✅ Categories module loaded (Enhanced with SVG icons)');