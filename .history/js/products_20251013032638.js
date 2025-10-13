// ================================================================
// products.js - قائمة المنتجات
// ================================================================

/**
 * قائمة المنتجات الأساسية
 * 
 * البنية المتوقعة لكل منتج:
 * {
 *   id: string,              // معرف فريد للمنتج
 *   name: string,            // الاسم بالعربية
 *   nameEn: string,          // الاسم بالإنجليزية
 *   description: string,     // الوصف بالعربية
 *   descriptionEn: string,   // الوصف بالإنجليزية
 *   category: string,        // الفئة بالعربية (كلاسيك، فواكه، مميز، فاخر)
 *   categoryEn: string,      // الفئة بالإنجليزية
 *   price: number,           // السعر بالجنيه المصري
 *   image: string,           // رابط الصورة
 *   badge?: string           // شارة اختيارية (مثل: جديد، الأكثر مبيعاً)
 * }
 */ 

export let products = [
  // ================================================================
  // ===== أمثلة توضيحية - يمكن استبدالها بالمنتجات الفعلية =====
  // ================================================================
  
  /*
  {
    id: 'classic-vanilla',
    name: 'فانيليا كلاسيك',
    nameEn: 'Classic Vanilla',
    description: 'آيس كريم فانيليا كريمي ولذيذ',
    descriptionEn: 'Creamy and delicious vanilla ice cream',
    category: 'كلاسيك',
    categoryEn: 'Classic',
    price: 25,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb',
    badge: 'الأكثر مبيعاً'
  },
  {
    id: 'fruit-strawberry',
    name: 'فراولة طبيعية',
    nameEn: 'Natural Strawberry',
    description: 'آيس كريم فراولة بقطع الفواكه الطازجة',
    descriptionEn: 'Strawberry ice cream with fresh fruit pieces',
    category: 'فواكه',
    categoryEn: 'Fruits',
    price: 30,
    image: 'https://images.unsplash.com/photo-1488900128323-21503983a07e',
    badge: 'جديد'
  },
  {
    id: 'premium-chocolate',
    name: 'شوكولاتة بلجيكية',
    nameEn: 'Belgian Chocolate',
    description: 'آيس كريم شوكولاتة فاخرة بالكاكاو البلجيكي',
    descriptionEn: 'Premium chocolate ice cream with Belgian cocoa',
    category: 'مميز',
    categoryEn: 'Premium',
    price: 40,
    image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f'
  },
  {
    id: 'luxury-pistachio',
    name: 'فستق حلبي فاخر',
    nameEn: 'Luxury Pistachio',
    description: 'آيس كريم فستق حلبي أصلي مع قطع الفستق المحمص',
    descriptionEn: 'Authentic Aleppo pistachio ice cream with roasted pieces',
    category: 'فاخر',
    categoryEn: 'Luxury',
    price: 50,
    image: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57'
  }
  */
];

// ================================================================
// ===== دالة إضافة منتجات جديدة =====
// ================================================================
export function addProduct(product) {
  // التحقق من وجود جميع الحقول المطلوبة
  const requiredFields = ['id', 'name', 'nameEn', 'description', 'descriptionEn', 'category', 'categoryEn', 'price', 'image'];
  const missingFields = requiredFields.filter(field => !product[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields);
    return false;
  }
  
  // التحقق من عدم تكرار المعرف
  if (products.find(p => p.id === product.id)) {
    console.error('❌ Product with this ID already exists:', product.id);
    return false;
  }
  
  products.push(product);
  console.log('✅ Product added:', product.id);
  return true;
}

// ================================================================
// ===== دالة إضافة عدة منتجات دفعة واحدة =====
// ================================================================
export function addProducts(productsArray) {
  if (!Array.isArray(productsArray)) {
    console.error('❌ Input must be an array');
    return;
  }
  
  let added = 0;
  let failed = 0;
  
  productsArray.forEach(product => {
    if (addProduct(product)) {
      added++;
    } else {
      failed++;
    }
  });
  
  console.log(`📦 Products imported: ${added} successful, ${failed} failed`);
}

// ================================================================
// ===== دالة حذف منتج =====
// ================================================================
export function removeProduct(productId) {
  const index = products.findIndex(p => p.id === productId);
  
  if (index === -1) {
    console.error('❌ Product not found:', productId);
    return false;
  }
  
  products.splice(index, 1);
  console.log('✅ Product removed:', productId);
  return true;
}

// ================================================================
// ===== دالة الحصول على منتج بالمعرف =====
// ================================================================
export function getProductById(productId) {
  return products.find(p => p.id === productId);
}

// ================================================================
// ===== دالة الحصول على منتجات حسب الفئة =====
// ================================================================
export function getProductsByCategory(category) {
  return products.filter(p => p.category === category);
}

// ================================================================
// ===== دالة الحصول على جميع الفئات الفريدة =====
// ================================================================
export function getUniqueCategories() {
  return [...new Set(products.map(p => p.category))];
}

// ================================================================
// ===== دالة تحديث منتج =====
// ================================================================
export function updateProduct(productId, updates) {
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    console.error('❌ Product not found:', productId);
    return false;
  }
  
  Object.assign(product, updates);
  console.log('✅ Product updated:', productId);
  return true;
}

console.log('✅ Products module loaded');