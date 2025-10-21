// ================================================================
// ui.js - إدارة واجهة المستخدم
// ================================================================

import { productsManager } from './products.js';
import { addToCart } from './cart.js';
import { getCategoryIcon, getCategoryName } from './categories.js';
import { storage } from './storage.js';

// ================================================================
// ===== متغيرات عامة =====
// ================================================================
export let currentLang = 'ar';
export let currentTab = 'menu';
export let searchQuery = '';
export let fuse;
export let currentProduct = null;
export let modalQuantity = 1;

// ================================================================
// ===== تبديل اللغة =====
// ================================================================
export function toggleLanguage() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  storage.setLang(currentLang); // ✅ بدل localStorage
  
  document.documentElement.setAttribute('lang', currentLang);
  document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
  
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.textContent = currentLang === 'ar' ? 'EN' : 'AR';
  }
  
  updateLanguage();
}

// ================================================================
// ===== تحديث اللغة =====
// ================================================================
export function updateLanguage() {
  const t = window.i18n.t[currentLang];
  if (!t) return;
  
  // تحديث الهيدر
  updateElement('header-title', t.headerTitle);
  updateElement('header-subtitle', t.headerSubtitle);
  
  // تحديث التنقل
  updateElement('nav-menu', t.navMenu);
  updateElement('nav-cart', t.navCart);
  updateElement('nav-about', t.navAbout);
  updateElement('nav-contact', t.navContact);
  
  // تحديث البطل
  updateElement('hero-badge', t.heroBadge);
  updateElement('hero-title', t.heroTitle);
  updateElement('hero-description', t.heroDescription);
  
  // تحديث البحث
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.setAttribute('placeholder', t.searchPlaceholder);
  }
  
  // تحديث نافذة الطلب
  updateCheckoutModal(t);
  
  // إعادة عرض المنتجات والفئات
  if (window.categoriesModule) {
    window.categoriesModule.renderCategories();
  }
  renderProducts();
  
  if (window.cartModule) {
    window.cartModule.updateCartUI?.();
  }
}

function updateElement(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function updateCheckoutModal(t) {
  updateElement('checkout-title', t.checkoutTitle);
  updateElement('checkout-subtitle', t.checkoutSubtitle);
  updateElement('order-summary-title', t.orderSummaryTitle);
  updateElement('pickup-title', t.pickupTitle);
  updateElement('pickup-desc', t.pickupDesc);
  updateElement('delivery-title', t.deliveryTitle);
  updateElement('delivery-desc', t.deliveryDesc);
  updateElement('name-label', t.nameLabel);
  updateElement('phone-label', t.phoneLabel);
  updateElement('address-label', t.addressLabel);
  updateElement('notes-label', t.notesLabel);
  updateElement('location-btn-text', t.locationBtnText);
  updateElement('cancel-btn', t.cancelBtn);
  updateElement('permission-title', t.permissionTitle);
  updateElement('permission-text', t.permissionText);
  updateElement('permission-cancel', t.permissionCancel);
  updateElement('permission-allow', t.permissionAllow);
}

// ================================================================
// ===== تبديل الثيم =====
// ================================================================
  export function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
    storage.setTheme(isDark ? 'dark' : 'light'); // ✅ بدل localStorage
  }

// ================================================================
// ===== تبديل التابات =====
// ================================================================
/*
export function switchTab(tab) {
  currentTab = tab;
  
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (event?.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  const tabContent = document.getElementById(`${tab}-tab`);
  if (tabContent) {
    tabContent.classList.add('active');
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}*/

export function switchTab(tabName) {
  console.log('📑 Switching to tab:', tabName);
  
  // Hide all tabs
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Update sidebar active state
  if (typeof updateSidebarActiveNav === 'function') {
    updateSidebarActiveNav(tabName);
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  console.log('✅ Tab switched to:', tabName);
}


// ================================================================
// ===== Update Sidebar Active Navigation =====
// ================================================================
function updateSidebarActiveNav(tabName) {
  // Remove active from all nav items
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active to current tab
  // Map tab names to sidebar items
  const tabMap = {
    'menu': 0,    // الرئيسية/المنيو
    'about': 3,   // من نحن
    'contact': 4  // تواصل
  };
  
  const index = tabMap[tabName];
  if (index !== undefined && navItems[index]) {
    navItems[index].classList.add('active');
  }
}

// ================================================================
// ===== Update Header Cart Badge =====
// ================================================================
export function updateHeaderCartBadge() {
  const badge = document.getElementById('headerCartBadge');
  if (!badge) return;
  
  // Get cart from cartModule
  const cart = typeof window.cartModule?.getCart === 'function' 
    ? window.cartModule.getCart() 
    : [];
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  badge.textContent = totalItems;
  badge.style.display = totalItems > 0 ? 'inline-flex' : 'none';
  
  // Update sidebar badge too
  if (typeof window.updateSidebarBadges === 'function') {
    window.updateSidebarBadges();
  }
}

// ================================================================
// ===== البحث =====
// ================================================================
export function handleSearch() {
  const input = document.getElementById('searchInput');
  searchQuery = input?.value || '';
  
  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) {
    if (searchQuery.trim()) {
      clearBtn.classList.add('show');
    } else {
      clearBtn.classList.remove('show');
    }
  }
  
  renderProducts();
}

export function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  searchQuery = '';
  
  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) {
    clearBtn.classList.remove('show');
  }
  
  renderProducts();
}

// ================================================================
// ===== عرض المنتجات =====
// ================================================================
/*
export async function renderProducts() {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  
  // ✅ الحصول على المنتجات من productsManager
  let filteredProducts = productsManager.getAllProducts();
  
  // ✅ إذا لم تكن المنتجات محملة بعد، حملها من API
  if (filteredProducts.length === 0) {
    // عرض Loading
    container.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">${currentLang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    `;
    
    try {
      await productsManager.loadProducts();
      filteredProducts = productsManager.getAllProducts();
    } catch (error) {
      console.error('Failed to load products:', error);
      
      // عرض رسالة خطأ
      const errorTitle = currentLang === 'ar' ? 'حدث خطأ' : 'Error';
      const errorMsg = currentLang === 'ar' 
        ? 'فشل تحميل المنتجات. الرجاء المحاولة مرة أخرى.' 
        : 'Failed to load products. Please try again.';
      const retryBtn = currentLang === 'ar' ? 'إعادة المحاولة' : 'Retry';
      
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">⚠️</div>
          <h3 class="no-results-title">${errorTitle}</h3>
          <p class="no-results-text">${errorMsg}</p>
          <button onclick="window.uiModule.renderProducts()" class="retry-btn">
            ${retryBtn}
          </button>
        </div>
      `;
      return;
    }
  }
  
  // تطبيق البحث
  if (searchQuery.trim() && fuse) {
    const searchResults = fuse.search(searchQuery);
    const searchIds = new Set(searchResults.map(r => r.item.id));
    filteredProducts = filteredProducts.filter(p => searchIds.has(p.id));
  }
  
  // لا توجد نتائج
  if (filteredProducts.length === 0) {
    const noResultsText = currentLang === 'ar' 
      ? 'لا توجد منتجات مطابقة' 
      : 'No matching products';
    const tryAgainText = currentLang === 'ar'
      ? 'جرب كلمات بحث أخرى'
      : 'Try different search terms';
    
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3 class="no-results-title">${noResultsText}</h3>
        <p class="no-results-text">${tryAgainText}</p>
      </div>
    `;
    return;
  }
  
  // تجميع المنتجات حسب الفئة
  const groupedProducts = {};
  filteredProducts.forEach(product => {
    if (!groupedProducts[product.category]) {
      groupedProducts[product.category] = [];
    }
    groupedProducts[product.category].push(product);
  });
  
  let html = '';
  Object.keys(groupedProducts).forEach(category => {
    const categoryName = getCategoryName(category, currentLang);
    const icon = getCategoryIcon(category);
    
    html += `
      <div class="category-group" id="category-${category}">
        <div class="category-header">
          <div class="category-icon">
            <i data-lucide="${icon}"></i>
          </div>
          <h3 class="category-name">${categoryName}</h3>
        </div>
        <div class="products-grid">
    `;
    
    groupedProducts[category].forEach((product, index) => {
      const name = currentLang === 'ar' ? product.name : product.nameEn;
      const description = currentLang === 'ar' ? product.description : product.descriptionEn;
      const badge = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
      const currency = window.i18n.t[currentLang]?.currency || 'ج.م';
      
      html += `
        <div class="product-card" style="animation-delay: ${index * 0.05}s;" onclick="window.uiModule.openProductModal('${product.id}')">
          <div class="product-image-container">
            <img src="${product.image}" alt="${name}" class="product-image" loading="lazy">
            ${badge}
          </div>
          <div class="product-content">
            <h3 class="product-name">${name}</h3>
            <p class="product-description">${description}</p>
            <div class="product-footer">
              <div class="product-price">${product.price} ${currency}</div>
              <button class="add-to-cart-btn" onclick="window.cartModule.addToCart(event, '${product.id}')">
                <i data-lucide="shopping-cart"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}*/
// ✅ الكود الصحيح - استبدل renderProducts بالكود ده:

export async function renderProducts() {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  
  let filteredProducts = productsManager.getAllProducts();
  
  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">${currentLang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    `;
    
    try {
      await productsManager.loadProducts();
      filteredProducts = productsManager.getAllProducts();
    } catch (error) {
      console.error('Failed to load products:', error);
      
      const errorTitle = currentLang === 'ar' ? 'حدث خطأ' : 'Error';
      const errorMsg = currentLang === 'ar' 
        ? 'فشل تحميل المنتجات. الرجاء المحاولة مرة أخرى.' 
        : 'Failed to load products. Please try again.';
      const retryBtn = currentLang === 'ar' ? 'إعادة المحاولة' : 'Retry';
      
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">⚠️</div>
          <h3 class="no-results-title">${errorTitle}</h3>
          <p class="no-results-text">${errorMsg}</p>
          <button onclick="window.uiModule.renderProducts()" class="retry-btn">
            ${retryBtn}
          </button>
        </div>
      `;
      return;
    }
  }
  
  if (searchQuery.trim() && fuse) {
    const searchResults = fuse.search(searchQuery);
    const searchIds = new Set(searchResults.map(r => r.item.id));
    filteredProducts = filteredProducts.filter(p => searchIds.has(p.id));
  }
  
  if (filteredProducts.length === 0) {
    const noResultsText = currentLang === 'ar' 
      ? 'لا توجد منتجات مطابقة' 
      : 'No matching products';
    const tryAgainText = currentLang === 'ar'
      ? 'جرب كلمات بحث أخرى'
      : 'Try different search terms';
    
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3 class="no-results-title">${noResultsText}</h3>
        <p class="no-results-text">${tryAgainText}</p>
      </div>
    `;
    return;
  }
  
  const groupedProducts = {};
  filteredProducts.forEach(product => {
    if (!groupedProducts[product.category]) {
      groupedProducts[product.category] = [];
    }
    groupedProducts[product.category].push(product);
  });
  
  let html = '';
  
  try {
    Object.keys(groupedProducts).forEach(category => {
      const categoryName = getCategoryName(category, currentLang);
      const icon = getCategoryIcon(category);
      
      html += `
        <div class="category-group" id="category-${category}">
          <div class="category-header">
            <div class="category-icon">
              <i data-lucide="${icon}"></i>
            </div>
            <h3 class="category-name">${categoryName}</h3>
          </div>
          <div class="products-grid">
      `;
      
      groupedProducts[category].forEach((product, index) => {
        if (!product) {
          console.warn('Skipping null/undefined product');
          return;
        }
        
        const name = currentLang === 'ar' 
          ? (product.name || 'بدون اسم')
          : (product.nameEn || product.name || 'No name');
        
        const description = currentLang === 'ar' 
          ? (product.description || '')
          : (product.descriptionEn || product.description || '');
        
        const badge = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
        const currency = window.i18n.t?.[currentLang]?.currency || 'ج.م';
        const imageUrl = product.image || 'path/to/default-image.png';
        const price = product.price || 0;
        
        html += `
          <div class="product-card" style="animation-delay: ${index * 0.05}s;" onclick="window.uiModule.openProductModal('${product.id}')">
            <div class="product-image-container">
              <img src="${imageUrl}" alt="${name}" class="product-image" loading="lazy">
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
      
      html += `
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error('Error rendering products:', error);
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">⚠️</div>
        <h3 class="no-results-title">خطأ في العرض</h3>
        <p class="no-results-text">${error.message}</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
// ================================================================
// ===== نافذة المنتج =====
// ================================================================
/*
export async function openProductModal(productId) {
  // ✅ الحصول على المنتج من productsManager
  let product;
  try {
    product = await productsManager.getProduct(productId);
  } catch (error) {
    console.error('Failed to load product:', error);
    // يمكن عرض رسالة خطأ للمستخدم هنا
    return;
  }
  
  if (!product) return;
  
  currentProduct = product;
  modalQuantity = 1;
  
  const name = currentLang === 'ar' ? product.name : product.nameEn;
  const description = currentLang === 'ar' ? product.description : product.descriptionEn;
  const currency = window.i18n.t[currentLang]?.currency || 'ج.م';
  
  updateElement('modalTitle', name);
  updateElement('modalDescription', description);
  updateElement('modalPrice', `${product.price} ${currency}`);
  updateElement('modalQuantity', '1');
  
  const modalImage = document.getElementById('modalImage');
  if (modalImage) {
    modalImage.src = product.image;
  }
  
  updateModalAddButton();
  
  // عرض الاقتراحات
  renderSuggestions(productId, product.category);
  
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}*/
// ================================================================
// ===== نافذة المنتج - FIXED for Tailwind =====
// ================================================================

export async function openProductModal(productId) {
  // ✅ الحصول على المنتج من productsManager
  let product;
  try {
    product = await productsManager.getProduct(productId);
  } catch (error) {
    console.error('Failed to load product:', error);
    return;
  }
  
  if (!product) return;
  
  currentProduct = product;
  modalQuantity = 1;
  
  // ✅ تفادي undefined/null
  const name = currentLang === 'ar' 
    ? (product.name || 'بدون اسم')
    : (product.nameEn || product.name || 'No name');
  
  const description = currentLang === 'ar' 
    ? (product.description || '')
    : (product.descriptionEn || product.description || '');
  
  const currency = window.i18n.t[currentLang]?.currency || 'ج.م';
  const price = product.price || 0;
  const imageUrl = product.image || 'path/to/default-image.png';
  
  updateElement('modalTitle', name);
  updateElement('modalDescription', description);
  updateElement('modalPrice', `${price} ${currency}`);
  updateElement('modalQuantity', '1');
  
  const modalImage = document.getElementById('modalImage');
  if (modalImage) {
    modalImage.src = imageUrl;
  }
  
  updateModalAddButton();
  
  // عرض الاقتراحات
  renderSuggestions(productId, product.category);
  
  const modal = document.getElementById('productModal');
  if (modal) {
    // ✅ FIXED: استخدام Tailwind classes بدل 'show'
    modal.classList.remove('hidden');  // شيل hidden
    modal.classList.add('flex');       // حط flex علشان يظهر
    document.body.style.overflow = 'hidden';
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

export function closeProductModal(event) {
  // ✅ FIXED: التحقق الصحيح من الضغط على الـ overlay
  if (event && event.target.id !== 'productModal') return;
  
  const modal = document.getElementById('productModal');
  if (modal) {
    // ✅ FIXED: استخدام Tailwind classes بدل 'show'
    modal.classList.add('hidden');     // حط hidden علشان يختفي
    modal.classList.remove('flex');    // شيل flex
    document.body.style.overflow = '';
  }
  
  currentProduct = null;
  modalQuantity = 1;
}

export function updateModalQuantity(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  updateElement('modalQuantity', modalQuantity);
  updateModalAddButton();
}

function updateModalAddButton() {
  if (!currentProduct) return;
  const total = currentProduct.price * modalQuantity;
  const currency = window.i18n.t[currentLang]?.currency || 'ج.م';
  const btnText = currentLang === 'ar' 
    ? `أضف ${modalQuantity} للسلة - ${total} ${currency}`
    : `Add ${modalQuantity} to Cart - ${total} ${currency}`;
  updateElement('modalAddBtnText', btnText);
}

export function addModalToCart() {
  if (!currentProduct) return;
  addToCart(null, currentProduct.id, modalQuantity);
  closeProductModal();
}

function renderSuggestions(productId, category) {
  // ✅ الحصول على المنتجات من productsManager
  const allProducts = productsManager.getAllProducts();
  
  const suggestions = allProducts
    .filter(p => p.id !== productId && p.category === category)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  
  const suggestionsGrid = document.getElementById('suggestionsGrid');
  if (!suggestionsGrid) return;
  
  const currency = window.i18n.t[currentLang]?.currency || 'ج.م';
  
  let html = '';
  suggestions.forEach(sug => {
    const sugName = currentLang === 'ar' ? sug.name : sug.nameEn;
    html += `
      <div class="suggestion-card" onclick="window.uiModule.openProductModal('${sug.id}')">
        <img src="${sug.image}" alt="${sugName}" class="suggestion-image" loading="lazy">
        <div class="suggestion-info">
          <p class="suggestion-name">${sugName}</p>
          <p class="suggestion-price">${sug.price} ${currency}</p>
        </div>
      </div>
    `;
  });
  
  suggestionsGrid.innerHTML = html;
}
// في دالة renderSuggestions - استبدل بالكود الصحيح:
/*
function renderSuggestions(productId, category) {
  // ✅ الحصول على المنتجات من productsManager
  const allProducts = productsManager.getAllProducts();
  
  const suggestions = allProducts
    .filter(p => p.id !== productId && p.category === category)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  
  const suggestionsGrid = document.getElementById('suggestionsGrid');
  if (!suggestionsGrid) return;
  
  const currency = window.i18n.t[currentLang]?.currency || 'ج.م';
  
  let html = '';
  suggestions.forEach(sug => {
    // ✅ الحل: تفادي undefined/null في الاقتراحات
    const sugName = currentLang === 'ar' 
      ? (sug.name || 'بدون اسم')
      : (sug.nameEn || sug.name || 'No name');
    
    // ✅ التحقق من وجود الصورة
    const sugImage = sug.image || 'path/to/default-image.png';
    
    // ✅ التحقق من السعر
    const sugPrice = sug.price || 0;
    
    html += `
      <div class="suggestion-card" onclick="window.uiModule.openProductModal('${sug.id}')">
        <img src="${sugImage}" alt="${sugName}" class="suggestion-image" loading="lazy">
        <div class="suggestion-info">
          <p class="suggestion-name">${sugName}</p>
          <p class="suggestion-price">${sugPrice} ${currency}</p>
        </div>
      </div>
    `;
  });
  
  suggestionsGrid.innerHTML = html;
}*/

// ================================================================
// ===== تهيئة Fuse.js للبحث =====
// ================================================================
export function initFuse() {
  if (typeof Fuse !== 'undefined') {
    // ✅ الحصول على المنتجات من productsManager
    const allProducts = productsManager.getAllProducts();
    
    fuse = new Fuse(allProducts, {
      keys: ['name', 'nameEn', 'description', 'descriptionEn', 'category', 'categoryEn'],
      threshold: 0.3
    });
    console.log('✅ Fuse.js initialized with', allProducts.length, 'products');
  }
}

// ================================================================
// ===== تصدير الوحدة للنافذة العامة =====
// ================================================================
if (typeof window !== 'undefined') {
  window.uiModule = {
    toggleLanguage,
    toggleTheme,
    switchTab,
    handleSearch,
    clearSearch,
    renderProducts,
    openProductModal,
    closeProductModal,
    updateModalQuantity,
    addModalToCart,
    getCurrentLang: () => currentLang,
    setCurrentLang: (lang) => { currentLang = lang; }
  };
  
  // جعل currentLang متاحًا عالميًا
  window.currentLang = currentLang;
}

console.log('✅ UI module loaded');