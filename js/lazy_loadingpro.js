/*
## 📋 TODO List - خطة العمل:

### **Phase 1: Initial Load** (الأولوية)
```
✅ 1. حمّل الـ categories tabs فقط
✅ 2. حمّل أول كاتيجوري (visible) فقط
❌ 3. باقي الكاتيجوريز lazy load
```

### **Phase 2: Lazy Loading** (مهم)
```
✅ 1. استخدم Intersection Observer
✅ 2. لما الكاتيجوري يقرب يظهر → حمّله
✅ 3. الصور lazy loading (loading="lazy")
```

### **Phase 3: Performance** (تحسينات)
```
✅ 1. Virtualization لو عندك 500+ منتج
✅ 2. Pagination داخل كل كاتيجوري
✅ 3. Cache المنتجات المحملة
// في ui.js - لو عايز تعطله مؤقتاً:
import { setLazyLoadingEnabled } from './lazy-loading.js';

// قبل ما تبدأ التطوير
setLazyLoadingEnabled(false); // يحمل كل حاجة مرة واحدة

// بعد ما تخلص
setLazyLoadingEnabled(true);  // يرجع lazy loading

📋 TODO List - التعديلات المطلوبة فقط:

✅ الملفات اللي محتاجة تعديل:

1️⃣ ui.js (تعديلين)
📍 التعديل الأول: استيراد الدالة الجديدة
javascript// في أول الملف مع الـ imports
import { renderProductsLazy, cleanupLazyLoading } from './lazy-loading.js';
📍 التعديل الثاني: استبدال الدالة
javascript// ❌ احذف أو علق على الدالة القديمة
// export async function renderProducts() { ... }

// ✅ استخدم الدالة الجديدة
export async function renderProducts() {
  await renderProductsLazy();
}

2️⃣ index.html (إضافة واحدة)
📍 في قسم الـ scripts (قبل </body>):
html<!-- قبل -->
<script type="module" src="js/ui.js"></script>
<script type="module" src="js/cart.js"></script>

<!-- ضيف السطر ده -->
<script type="module" src="js/lazy-loading.js"></script>

3️⃣ styles.css (إضافة CSS)
📍 ضيف في آخر الملف:

*/
// ================================================================
// Lazy Loading Strategy for Categories
// ================================================================

// ================================================================
// State Management
// ================================================================
const lazyLoadState = {
  loadedCategories: new Set(),
  observer: null,
  isEnabled: true // يمكن تعطيله للتطوير
};

// ================================================================
// Phase 1: Initial Render (Categories Only)
// ================================================================
export async function renderProductsLazy() {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  
  let products = productsManager.getAllProducts();
  
  if (products.length === 0) {
    container.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">${currentLang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    `;
    
    try {
      await productsManager.loadProducts();
      products = productsManager.getAllProducts();
    } catch (error) {
      console.error('Failed to load products:', error);
      return;
    }
  }
  
  // Group products by category
  const groupedProducts = {};
  products.forEach(product => {
    if (!groupedProducts[product.category]) {
      groupedProducts[product.category] = [];
    }
    groupedProducts[product.category].push(product);
  });
  
  let html = '';
  
  // ✅ Render category placeholders (not products yet)
  Object.keys(groupedProducts).forEach(category => {
    const categoryName = getCategoryName(category, currentLang);
    const icon = getCategoryIcon(category);
    const productCount = groupedProducts[category].length;
    
    html += `
      <div class="category-group" 
           id="category-${category}" 
           data-category="${category}"
           data-loaded="false">
        
        <!-- Category Header -->
        <div class="category-header">
          <div class="category-icon">
            <i data-lucide="${icon}"></i>
          </div>
          <h3 class="category-name">${categoryName}</h3>
          <span class="category-count">${productCount} ${currentLang === 'ar' ? 'منتج' : 'items'}</span>
        </div>
        
        <!-- Placeholder (will be replaced with products) -->
        <div class="products-placeholder" data-category="${category}">
          <div class="skeleton-grid">
            ${generateSkeletons(Math.min(productCount, 6))}
          </div>
        </div>
        
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // ✅ Setup Intersection Observer
  setupLazyLoading(groupedProducts);
  
  console.log('✅ Categories rendered with lazy loading');
}

// ================================================================
// Phase 2: Lazy Load Products when Category is Near Viewport
// ================================================================
function setupLazyLoading(groupedProducts) {
  if (!lazyLoadState.isEnabled) {
    // Fallback: Load all immediately
    Object.keys(groupedProducts).forEach(category => {
      loadCategoryProducts(category, groupedProducts[category]);
    });
    return;
  }
  
  // ✅ Intersection Observer Config
  const observerOptions = {
    root: null,
    rootMargin: '200px', // Load 200px before entering viewport
    threshold: 0.01
  };
  
  // ✅ Create Observer
  lazyLoadState.observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const categoryGroup = entry.target;
        const category = categoryGroup.dataset.category;
        const isLoaded = categoryGroup.dataset.loaded === 'true';
        
        if (!isLoaded && !lazyLoadState.loadedCategories.has(category)) {
          console.log('🔄 Lazy loading category:', category);
          loadCategoryProducts(category, groupedProducts[category]);
          lazyLoadState.loadedCategories.add(category);
          categoryGroup.dataset.loaded = 'true';
          
          // Unobserve after loading
          lazyLoadState.observer.unobserve(categoryGroup);
        }
      }
    });
  }, observerOptions);
  
  // ✅ Observe all category groups
  const categoryGroups = document.querySelectorAll('.category-group');
  categoryGroups.forEach(group => {
    lazyLoadState.observer.observe(group);
  });
  
  console.log('✅ Lazy loading observer setup for', categoryGroups.length, 'categories');
}

// ================================================================
// Load Products for Specific Category
// ================================================================
function loadCategoryProducts(category, products) {
  const placeholder = document.querySelector(`.products-placeholder[data-category="${category}"]`);
  
  if (!placeholder) {
    console.warn('Placeholder not found for category:', category);
    return;
  }
  
  const currency = window.i18n.t?.[currentLang]?.currency || 'ج.م';
  
  let html = '<div class="products-grid">';
  
  products.forEach((product, index) => {
    if (!product) return;
    
    const name = currentLang === 'ar' 
      ? (product.name || 'بدون اسم')
      : (product.nameEn || product.name || 'No name');
    
    const description = currentLang === 'ar' 
      ? (product.description || '')
      : (product.descriptionEn || product.description || '');
    
    const badge = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
    const imageUrl = product.image || 'path/to/default-image.png';
    const price = product.price || 0;
    
    html += `
      <div class="product-card" style="animation-delay: ${index * 0.05}s;" onclick="window.uiModule.openProductModal('${product.id}')">
        <div class="product-image-container">
          <img src="${imageUrl}" 
               alt="${name}" 
               class="product-image" 
               loading="lazy">
          ${badge}
        </div>
        <div class="product-content">
          <h3 class="product-name">${name}</h3>
          <p class="product-description">${description}</p>
          <div class="product-footer">
            <div class="product-price">${price} ${currency}</div>
            <button class="add-to-cart-btn" onclick="window.cartModule.addToCart(event, '${product.id}')">
              <i data-lucide="shopping-cart"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  // ✅ Replace placeholder with actual products
  placeholder.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log('✅ Loaded', products.length, 'products for category:', category);
}

// ================================================================
// Generate Skeleton Loaders
// ================================================================
function generateSkeletons(count) {
  let html = '';
  
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-description"></div>
          <div class="skeleton-footer">
            <div class="skeleton-price"></div>
            <div class="skeleton-button"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  return html;
}

// ================================================================
// Toggle Lazy Loading (للتطوير)
// ================================================================
export function setLazyLoadingEnabled(enabled) {
  lazyLoadState.isEnabled = enabled;
  console.log('Lazy loading:', enabled ? 'enabled' : 'disabled');
}

// ================================================================
// Cleanup
// ================================================================
export function cleanupLazyLoading() {
  if (lazyLoadState.observer) {
    lazyLoadState.observer.disconnect();
    lazyLoadState.observer = null;
  }
  lazyLoadState.loadedCategories.clear();
  console.log('✅ Lazy loading cleaned up');
}

/* ================================================================
   Skeleton Loaders
   ================================================================ */
   /*

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.dark .skeleton-card {
  background: #1f2937;
}

.skeleton-image {
  width: 100%;
  padding-top: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.dark .skeleton-image {
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
}

.skeleton-content {
  padding: 1.25rem;
}

.skeleton-title {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.skeleton-description {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 1rem;
  width: 80%;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skeleton-price {
  height: 24px;
  width: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.dark .skeleton-title,
.dark .skeleton-description,
.dark .skeleton-price,
.dark .skeleton-button {
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
}
  /* ================================================================
   Skeleton Loaders
   ================================================================ */
/*
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.dark .skeleton-card {
  background: #1f2937;
}

.skeleton-image {
  width: 100%;
  padding-top: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.dark .skeleton-image {
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
}

.skeleton-content {
  padding: 1.25rem;
}

.skeleton-title {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.skeleton-description {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 1rem;
  width: 80%;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skeleton-price {
  height: 24px;
  width: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.dark .skeleton-title,
.dark .skeleton-description,
.dark .skeleton-price,
.dark .skeleton-button {
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
}*/
