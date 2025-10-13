// ================================================================
// products.js - Product Management with API Integration
// ================================================================

import { api } from './api.js';
import { storage } from './storage.js';


/**
 * Products Manager Class
 * يدير المنتجات من الـ API (Backend) مع Caching محلي
 */ 
class ProductsManager {
  constructor() {
    this.products = [];              // المنتجات المحملة من API
    this.categories = [];            // الفئات المتاحة
    this.loading = false;            // حالة التحميل
    this.lastFetch = null;           // آخر وقت تحميل
    this.cacheTimeout = 5 * 60 * 1000; // 5 دقائق
    
    console.log('✅ Products Manager initialized');
  }
  
  // ================================================================
  // LOAD PRODUCTS FROM API (Backend)
  // ================================================================
  
  /**
   * تحميل المنتجات من الـ API
   * @param {boolean} forceRefresh - إجبار التحديث من السيرفر
   * @returns {Promise<Array>}
   *//*
  async loadProducts(forceRefresh = false) {
    try {
      // 🔄 Check if we need to refresh
      const needsRefresh = forceRefresh || 
                          !this.lastFetch || 
                          (Date.now() - this.lastFetch) > this.cacheTimeout;
      
      if (!needsRefresh && this.products.length > 0) {
        console.log('📦 Using cached products');
        return this.products;
      }
      
      // 🚀 Fetch from API
      console.log('🌐 Loading products from API...');
      this.loading = true;
      
      const productsData = await api.getProducts();
      
      if (!productsData || !Array.isArray(productsData)) {
        throw new Error('Invalid products data received from API');
      }
      
      // ✅ Update local cache
      this.products = productsData;
      this.lastFetch = Date.now();
      this.updateCategories();
      
      console.log(`✅ Loaded ${this.products.length} products from API`);
      
      // 💾 Save to localStorage as backup (optional)
      this.saveToLocalStorage();
      
      return this.products;
      
    } catch (error) {
      console.error('❌ Failed to load products from API:', error);
      
      // 🔄 Fallback to localStorage
      const cachedProducts = this.loadFromLocalStorage();
      if (cachedProducts.length > 0) {
        console.log('⚠️ Using cached products from localStorage');
        this.products = cachedProducts;
        this.updateCategories();
        return this.products;
      }
      
      throw error;
      
    } finally {
      this.loading = false;
    }
  }*/
  async loadProducts(forceRefresh = false) {
      try {
          const needsRefresh = forceRefresh || 
                              !this.lastFetch || 
                              (Date.now() - this.lastFetch) > this.cacheTimeout;

          // 1. التحقق من التخزين المؤقت الداخلي (In-Memory Cache)
          if (!needsRefresh && this.products.length > 0) {
              console.log('📦 Using internal object products cache');
              return this.products;
          }

          // 2. التحقق من التخزين المؤقت في كائن الـ storage (Memory Cache)
          // نفترض أن this.cacheTimeout موجود ومعرّف
          // ونفترض وجود كائن 'storage' يملك الدوال getProductsCache و setProductsCache
          const cached = storage.getProductsCache();
          if (cached && !forceRefresh) {
              const cacheAge = Date.now() - cached.timestamp;
              if (cacheAge < this.cacheTimeout) {
                  this.products = cached.products;
                  this.lastFetch = cached.timestamp;
                  this.updateCategories();
                  console.log('📦 Using external memory cached products');
                  return this.products;
              }
          }
          
          console.log('🌐 Loading products from API...');
          this.loading = true;
          
          const response = await api.getProducts();
          
          // الكود الخاص بتحليل الاستجابة (Response Parsing)
          // تم تبسيطه قليلًا مع الحفاظ على المنطق
          let productsData = [];

          if (response?.data && Array.isArray(response.data)) {
              productsData = response.data;
              console.log('✅ SUCCESS: Extracted from response.data');
          } 
          else if (Array.isArray(response)) {
              productsData = response;
              console.log('✅ SUCCESS: Response is array');
          } 
          else {
              console.error('❌ ERROR: Invalid response structure:', response);
              throw new Error('Invalid response structure - no data array found');
          }
          
          if (!Array.isArray(productsData) || productsData.length === 0) {
              throw new Error('Products array is empty or invalid');
          }
          
          this.products = productsData;
          this.lastFetch = Date.now();
          this.updateCategories();

          // 3. حفظ في memory cache بعد التحميل الناجح
          storage.setProductsCache(this.products, this.lastFetch);
          
          // 4. حفظ في LocalStorage
          this.saveToLocalStorage();
          
          console.log(`✅ Loaded ${this.products.length} products successfully`);
          
          return this.products;
          
      } catch (error) {
          console.error('❌ Failed to load products from API:', error);
          
          // 5. محاولة التحميل من LocalStorage في حالة الفشل
          const cachedProducts = this.loadFromLocalStorage();
          if (cachedProducts.length > 0) {
              console.log('⚠️ Using cached products from localStorage');
              this.products = cachedProducts;
              this.updateCategories();
              return this.products;
          }
          
          throw error;
          
      } finally {
          this.loading = false;
      }
  }
  // ================================================================
  // GET SINGLE PRODUCT (with API fallback)
  // ================================================================
  
  /**
   * الحصول على منتج واحد
   * @param {string} productId
   * @returns {Promise<Object>}
   */
  async getProduct(productId) {
    try {
      // 1️⃣ Try local cache first
      if (this.products.length > 0) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
          console.log('📦 Product found in cache:', productId);
          return product;
        }
      }
      
      // 2️⃣ Fetch from API
      console.log('🌐 Fetching product from API:', productId);
      const product = await api.getProduct(productId);
      
      // Update cache
      const index = this.products.findIndex(p => p.id === productId);
      if (index !== -1) {
        this.products[index] = product;
      } else {
        this.products.push(product);
      }
      
      this.saveToLocalStorage();
      
      return product;
      
    } catch (error) {
      console.error('❌ Failed to get product:', error);
      throw error;
    }
  }
  
  // ================================================================
  // SEARCH PRODUCTS
  // ================================================================
  
  /**
   * البحث في المنتجات
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchProducts(query) {
    try {
      if (!query || query.trim().length === 0) {
        return this.products;
      }
      
      console.log('🔍 Searching products:', query);
      
      // Search from API for fresh results
      const results = await api.searchProducts(query);
      
      console.log(`✅ Found ${results.length} products`);
      return results;
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      
      // Fallback to local search
      const queryLower = query.toLowerCase();
      return this.products.filter(p => 
        p.name.toLowerCase().includes(queryLower) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(queryLower)) ||
        (p.description && p.description.toLowerCase().includes(queryLower))
      );
    }
  }
  
  // ================================================================
  // FILTER BY CATEGORY
  // ================================================================
  
  /**
   * تصفية المنتجات حسب الفئة
   * @param {string} category
   * @returns {Array}
   */
  getProductsByCategory(category) {
    if (!category) return this.products;
    
    return this.products.filter(p => p.category === category);
  }
  
  // ================================================================
  // GET CATEGORIES
  // ================================================================
  
  /**
   * الحصول على قائمة الفئات
   * @returns {Array}
   */
  getCategories() {
    return this.categories;
  }
  
  /**
   * تحديث قائمة الفئات من المنتجات
   * @private
   */
  updateCategories() {
    const uniqueCategories = [...new Set(this.products.map(p => p.category))];
    this.categories = uniqueCategories.map(cat => ({
      name: cat,
      nameEn: this.products.find(p => p.category === cat)?.categoryEn || cat,
      count: this.products.filter(p => p.category === cat).length
    }));
  }
  
  // ================================================================
  // GET ALL PRODUCTS (from cache)
  // ================================================================
  
  /**
   * الحصول على جميع المنتجات (من الـ cache)
   * @returns {Array}
   */
  getAllProducts() {
    return this.products;
  }
  
  // ================================================================
  // CHECK IF PRODUCT EXISTS
  // ================================================================
  
  /**
   * التحقق من وجود منتج
   * @param {string} productId
   * @returns {boolean}
   */
  hasProduct(productId) {
    return this.products.some(p => p.id === productId);
  }
  
  // ================================================================
  // GET LOADING STATE
  // ================================================================
  
  /**
   * التحقق من حالة التحميل
   * @returns {boolean}
   */
  isLoading() {
    return this.loading;
  }
  
  // ================================================================
  // REFRESH PRODUCTS
  // ================================================================
  
  /**
   * تحديث المنتجات من السيرفر
   * @returns {Promise<Array>}
   */
  async refresh() {
    return this.loadProducts(true);
  }
  
  // ================================================================
  // LOCAL STORAGE HELPERS (Backup only)
  // ================================================================
  
  /**
   * حفظ المنتجات في localStorage كـ backup
   * @private
   */
  saveToLocalStorage() {
    try {
      const data = {
        products: this.products,
        timestamp: this.lastFetch
      };
      localStorage.setItem('products_cache', JSON.stringify(data));
    } catch (e) {
      console.warn('⚠️ Failed to save products to localStorage:', e);
    }
  }
  
  /**
   * تحميل المنتجات من localStorage
   * @private
   * @returns {Array}
   */
  loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem('products_cache');
      if (!cached) return [];
      
      const data = JSON.parse(cached);
      
      // Check if cache is too old (24 hours)
      const cacheAge = Date.now() - (data.timestamp || 0);
      if (cacheAge > 24 * 60 * 60 * 1000) {
        console.log('⚠️ localStorage cache is too old, ignoring');
        return [];
      }
      
      return data.products || [];
      
    } catch (e) {
      console.warn('⚠️ Failed to load products from localStorage:', e);
      return [];
    }
  }
  
  /**
   * مسح الـ cache
    */
  // حذف clearCache القديم واستبداله:
  clearCache() {
    this.products = [];
    this.categories = [];
    this.lastFetch = null;
    storage.clearProductsCache();
    console.log('🗑️ Products cache cleared');
  }
}

// ================================================================
// SINGLETON INSTANCE
// ================================================================
export const productsManager = new ProductsManager();

// ================================================================
// LEGACY COMPATIBILITY (للكود القديم - للتوافق فقط)
// ================================================================

/**
 * @deprecated Use productsManager.getAllProducts() instead
 * هذا للتوافق مع الكود القديم فقط
 */
export let products = [];

// تحديث products array عند تحميل المنتجات
const originalLoadProducts = productsManager.loadProducts.bind(productsManager);
productsManager.loadProducts = async function(...args) {
  const result = await originalLoadProducts(...args);
  products = result; // تحديث للتوافق مع الكود القديم
  return result;
};

/**
 * @deprecated Use productsManager.getProduct() instead
 */
export async function getProductById(productId) {
  console.warn('⚠️ getProductById is deprecated, use productsManager.getProduct()');
  return productsManager.getProduct(productId);
}

/**
 * @deprecated Use productsManager.getProductsByCategory() instead
 */
export function getProductsByCategory(category) {
  console.warn('⚠️ getProductsByCategory is deprecated, use productsManager.getProductsByCategory()');
  return productsManager.getProductsByCategory(category);
}

/**
 * @deprecated Use productsManager.getCategories() instead
 */
export function getUniqueCategories() {
  console.warn('⚠️ getUniqueCategories is deprecated, use productsManager.getCategories()');
  return productsManager.getCategories();
}

/**
 * @deprecated Not needed with API - products managed by backend
 */
export function addProduct(product) {
  console.warn('⚠️ addProduct is deprecated - products are managed by the backend API');
  return false;
}

/**
 * @deprecated Not needed with API - products managed by backend
 */
export function addProducts(productsArray) {
  console.warn('⚠️ addProducts is deprecated - products are managed by the backend API');
}

/**
 * @deprecated Not needed with API - products managed by backend
 */
export function removeProduct(productId) {
  console.warn('⚠️ removeProduct is deprecated - products are managed by the backend API');
  return false;
}

/**
 * @deprecated Not needed with API - products managed by backend
 */
export function updateProduct(productId, updates) {
  console.warn('⚠️ updateProduct is deprecated - products are managed by the backend API');
  return false;
}

// ================================================================
// EXPOSE TO WINDOW
// ================================================================
if (typeof window !== 'undefined') {
  window.productsManager = productsManager;
  window.products = products; // للتوافق مع الكود القديم
}

console.log('✅ Products module loaded (API-powered)');