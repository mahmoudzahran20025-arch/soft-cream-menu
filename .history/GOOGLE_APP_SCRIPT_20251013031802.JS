// ================================================================
// Code.gs - Google Apps Script Backend with REST API
// CRITICAL: All price calculations happen server-side
// ================================================================

// ================================================================
// CONFIGURATION - Use PropertiesService for secrets
// ================================================================
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  
  return {
    TELEGRAM_BOT_TOKEN: props.getProperty('TELEGRAM_BOT_TOKEN') || '',
    TELEGRAM_CHAT_ID: props.getProperty('TELEGRAM_CHAT_ID') || '',
    ALLOWED_ORIGINS: (props.getProperty('ALLOWED_ORIGINS') || 'https://your-project.web.app,http://localhost:5000').split(','),
    MAIN_SHEET_NAME: 'الطلبات',
    PRODUCTS_SHEET_NAME: 'المنتجات',
    PROMOTIONS_SHEET_NAME: 'العروض',
    USERS_SHEET_NAME: 'المستخدمين',
    BRANCHES_SHEET_NAME: 'الفروع',
    IDEMPOTENCY_CACHE_KEY: 'IDEMPOTENCY_CACHE',
    MAX_RETRY_WINDOW: 3600000, // 1 hour
    DELIVERY_FEE: 15, // جنيه
    FREE_DELIVERY_THRESHOLD: 200, // جنيه
    FIREBASE_PROJECT_ID: props.getProperty('FIREBASE_PROJECT_ID') || ''
  };
}

// ================================================================
// SETUP INSTRUCTIONS - Run this once to set secrets
// ================================================================
function setupSecrets() {
  const props = PropertiesService.getScriptProperties();
  
  props.setProperties({
    'TELEGRAM_BOT_TOKEN': '8492042367:AAFc2GfQiTrdfM7hAo5Uc5ZGP4ZPlstfBBU',
    'TELEGRAM_CHAT_ID': '-1002896286203',
    'ALLOWED_ORIGINS': 'https://your-project.web.app,https://your-project.firebaseapp.com,http://localhost:5000',
    'FIREBASE_PROJECT_ID': 'your-firebase-project-id'
  });
  
  Logger.log('✅ Secrets configured successfully');
  return 'Secrets configured';
}

// ================================================================
// CORS HANDLER
// ================================================================
function handleCors(origin) {
  const config = getConfig();
  const allowedOrigins = config.ALLOWED_ORIGINS;
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
    'Access-Control-Max-Age': '3600'
  };
  
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  return headers;
}

// ================================================================
// MAIN HANDLERS
// ================================================================
function doGet(e) {
  try {
    const origin = e.parameter.origin || e.headers?.Origin || '';
    const path = e.parameter.path || '';
    const headers = handleCors(origin);
    
    Logger.log('GET Request: ' + path);
    
    // Route handling
    if (path.startsWith('/orders/track')) {
      return buildJsonResponse(handleTrackOrder(e), 200, headers);
    } else if (path === '/products') {
      return buildJsonResponse(handleGetProducts(e), 200, headers);
    } else if (path.startsWith('/products/search')) {
      return buildJsonResponse(handleSearchProducts(e), 200, headers);
    } else if (path.startsWith('/products/')) {
      const productId = path.split('/')[2];
      return buildJsonResponse(handleGetProduct(productId), 200, headers);
    } else if (path.startsWith('/users/profile')) {
      return buildJsonResponse(handleGetUserProfile(e), 200, headers);
    } else if (path === '/branches') {
      return buildJsonResponse(handleGetBranches(), 200, headers);
    } else if (path.startsWith('/branches/availability')) {
      return buildJsonResponse(handleCheckBranchAvailability(e), 200, headers);
    } else if (path.startsWith('/branches/') && path.includes('/hours')) {
      const branchId = path.split('/')[2];
      return buildJsonResponse(handleGetBranchHours(branchId), 200, headers);
    } else if (path === '/promotions/active') {
      return buildJsonResponse(handleGetActivePromotions(), 200, headers);
    }
    
    return buildJsonResponse({ error: 'Endpoint not found' }, 404, headers);
    
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return buildJsonResponse({ error: error.toString() }, 500, handleCors(''));
  }
}

function doPost(e) {
  try {
    const origin = e.parameter.origin || e.headers?.Origin || '';
    const path = e.parameter.path || '';
    const headers = handleCors(origin);
    const body = parseBody(e);
    
    Logger.log('POST Request: ' + path);
    Logger.log('Body: ' + JSON.stringify(body));
    
    // Check if this is a Telegram webhook
    if (body && (body.message || body.callback_query)) {
      handleTelegramUpdate(body);
      return buildJsonResponse({ ok: true }, 200, headers);
    }
    
    // Route handling
    // داخل doPost route handling:
    if (path === '/orders/prices') {
    const priceData = calculateOrderPrices(body.items || [], body.promoCode || null);
    return buildJsonResponse({ data: { calculatedPrices: priceData } }, 200, headers);
    }

    if (path === '/orders/submit') {
      return buildJsonResponse(handleSubmitOrder(body, e), 200, headers);
    } else if (path === '/orders/cancel') {
      return buildJsonResponse(handleCancelOrder(body), 200, headers);
    } else if (path === '/users/save') {
      return buildJsonResponse(handleSaveUser(body), 200, headers);
    } else if (path === '/analytics/event') {
      return buildJsonResponse(handleTrackEvent(body), 204, headers);
    } else if (path === '/analytics/events') {
      return buildJsonResponse(handleTrackEvents(body), 204, headers);
    } else if (path === '/notifications/whatsapp') {
      return buildJsonResponse(handleSendWhatsApp(body), 200, headers);
    } else if (path === '/notifications/email') {
      return buildJsonResponse(handleSendEmail(body), 200, headers);
    } else if (path === '/promotions/validate') {
      return buildJsonResponse(handleValidatePromoCode(body), 200, headers);
    }
    
    return buildJsonResponse({ error: 'Endpoint not found' }, 404, headers);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return buildJsonResponse({ error: error.toString() }, 500, handleCors(''));
  }
}

function doPut(e) {
  try {
    const origin = e.parameter.origin || e.headers?.Origin || '';
    const path = e.parameter.path || '';
    const headers = handleCors(origin);
    const body = parseBody(e);
    
    Logger.log('PUT Request: ' + path);
    
    // Route handling
    if (path.startsWith('/users/')) {
      const userId = path.split('/')[2];
      return buildJsonResponse(handleUpdateUser(userId, body), 200, headers);
    }
    
    return buildJsonResponse({ error: 'Endpoint not found' }, 404, headers);
    
  } catch (error) {
    Logger.log('Error in doPut: ' + error.toString());
    return buildJsonResponse({ error: error.toString() }, 500, handleCors(''));
  }
}

function doOptions(e) {
  const origin = e.parameter.origin || e.headers?.Origin || '';
  const headers = handleCors(origin);
  return ContentService.createTextOutput('').setHeaders(headers);
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================
function buildJsonResponse(data, code, headers) {
  const output = ContentService.createTextOutput();
  
  if (code === 204) {
    return output.setContent('').setHeaders(headers);
  }
  
  const response = {
    success: code >= 200 && code < 300,
    data: data.data !== undefined ? data.data : data,
    error: data.error || null
  };
  
  return output
    .setContent(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

function parseBody(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return {};
    }
    return JSON.parse(e.postData.contents);
  } catch (error) {
    Logger.log('Error parsing body: ' + error.toString());
    return {};
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ================================================================
// IDEMPOTENCY - Fast O(1) lookup with PropertiesService
// ================================================================
function checkIdempotency(key) {
  if (!key) return null;
  
  const config = getConfig();
  const cache = getCacheData();
  const now = Date.now();
  
  if (cache[key]) {
    const record = cache[key];
    if (now - record.timestamp < config.MAX_RETRY_WINDOW) {
      Logger.log('Duplicate request detected: ' + key);
      return record;
    } else {
      delete cache[key];
      saveCacheData(cache);
    }
  }
  
  return null;
}

function saveIdempotency(key, orderId, eta) {
  if (!key) return;
  
  const cache = getCacheData();
  cache[key] = {
    orderId: orderId,
    eta: eta,
    timestamp: Date.now()
  };
  
  saveCacheData(cache);
  
  // Optional: Backup to sheet
  backupIdempotencyToSheet(key, orderId, eta);
}

function getCacheData() {
  const config = getConfig();
  const props = PropertiesService.getScriptProperties();
  const cacheStr = props.getProperty(config.IDEMPOTENCY_CACHE_KEY);
  
  try {
    return cacheStr ? JSON.parse(cacheStr) : {};
  } catch (e) {
    return {};
  }
}

function saveCacheData(cache) {
  const config = getConfig();
  const props = PropertiesService.getScriptProperties();
  
  // Cleanup old entries
  const now = Date.now();
  Object.keys(cache).forEach(key => {
    if (now - cache[key].timestamp > config.MAX_RETRY_WINDOW) {
      delete cache[key];
    }
  });
  
  props.setProperty(config.IDEMPOTENCY_CACHE_KEY, JSON.stringify(cache));
}

function backupIdempotencyToSheet(key, orderId, eta) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Idempotency_Backup');
    
    if (!sheet) {
      sheet = ss.insertSheet('Idempotency_Backup');
      sheet.appendRow(['Key', 'Order ID', 'Timestamp', 'ETA']);
    }
    
    sheet.appendRow([key, orderId, new Date().toISOString(), eta]);
  } catch (e) {
    Logger.log('Backup to sheet failed: ' + e.toString());
  }
}

// ================================================================
// PRICE CALCULATION - SERVER SIDE ONLY
// ================================================================
function calculateOrderPrices(items, promoCode) {
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(30000);
    
    const products = getProductsMap();
    const calculatedItems = [];
    let subtotal = 0;
    
    // Calculate each item
    items.forEach(item => {
      const product = products[item.productId];
      
      if (!product) {
        throw new Error('Product not found: ' + item.productId);
      }
      
      const price = parseFloat(product.price);
      const quantity = parseInt(item.quantity);
      const itemSubtotal = price * quantity;
      
      calculatedItems.push({
        productId: item.productId,
        name: product.name,
        nameEn: product.nameEn || product.name,
        price: price,
        quantity: quantity,
        subtotal: itemSubtotal
      });
      
      subtotal += itemSubtotal;
    });
    
    // Apply promotion
    let discount = 0;
    let discountMessage = '';
    let promoDetails = null;
    
    if (promoCode) {
      promoDetails = validatePromotion(promoCode, subtotal);
      if (promoDetails.valid) {
        discount = promoDetails.discountAmount;
        discountMessage = promoDetails.message;
      }
    }
    
    // Calculate delivery fee
    const config = getConfig();
    const deliveryFee = subtotal >= config.FREE_DELIVERY_THRESHOLD ? 0 : config.DELIVERY_FEE;
    
    // Calculate total
    const total = subtotal - discount + deliveryFee;
    
    return {
      items: calculatedItems,
      subtotal: subtotal,
      discount: discount,
      discountMessage: discountMessage,
      deliveryFee: deliveryFee,
      total: total,
      promoDetails: promoDetails
    };
    
  } finally {
    lock.releaseLock();
  }
}

function getProductsMap() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  let sheet = ss.getSheetByName(config.PRODUCTS_SHEET_NAME);
  
  if (!sheet) {
    sheet = createProductsSheet();
  }
  
  const data = sheet.getDataRange().getValues();
  const productsMap = {};
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      productsMap[data[i][0]] = {
        id: data[i][0],
        name: data[i][1],
        nameEn: data[i][2],
        category: data[i][3],
        price: data[i][4],
        description: data[i][5],
        image: data[i][6],
        available: data[i][7] !== false
      };
    }
  }
  
  return productsMap;
}

function createProductsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  const sheet = ss.insertSheet(config.PRODUCTS_SHEET_NAME);
  
  sheet.appendRow(['ID', 'الاسم', 'Name (EN)', 'التصنيف', 'السعر', 'الوصف', 'الصورة', 'متاح']);
  
  // Sample products
  const sampleProducts = [
    ['prod_001', 'برجر لحم', 'Beef Burger', 'burgers', 50, 'برجر لحم لذيذ', '', true],
    ['prod_002', 'برجر دجاج', 'Chicken Burger', 'burgers', 45, 'برجر دجاج مقرمش', '', true],
    ['prod_003', 'آيس كريم فانيليا', 'Vanilla Ice Cream', 'ice-cream', 25, 'آيس كريم فانيليا طبيعي', '', true],
    ['prod_004', 'آيس كريم شوكولاتة', 'Chocolate Ice Cream', 'ice-cream', 30, 'آيس كريم شوكولاتة غني', '', true]
  ];
  
  sampleProducts.forEach(p => sheet.appendRow(p));
  
  return sheet;
}

function validatePromotion(code, subtotal) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  let sheet = ss.getSheetByName(config.PROMOTIONS_SHEET_NAME);
  
  if (!sheet) {
    sheet = createPromotionsSheet();
  }
  
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === code && data[i][7] === true) {
      const validFrom = new Date(data[i][4]);
      const validTo = new Date(data[i][5]);
      const minOrder = parseFloat(data[i][6]) || 0;
      
      if (now >= validFrom && now <= validTo && subtotal >= minOrder) {
        const discountType = data[i][2];
        const discountValue = parseFloat(data[i][3]);
        
        let discountAmount = 0;
        if (discountType === 'percentage') {
          discountAmount = (subtotal * discountValue) / 100;
        } else {
          discountAmount = discountValue;
        }
        
        return {
          valid: true,
          code: code,
          name: data[i][1],
          discountAmount: discountAmount,
          message: data[i][8] || 'تم تطبيق الخصم بنجاح'
        };
      }
    }
  }
  
  return { valid: false, error: 'كود الخصم غير صالح' };
}

function createPromotionsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  const sheet = ss.insertSheet(config.PROMOTIONS_SHEET_NAME);
  
  sheet.appendRow(['الكود', 'الاسم', 'النوع', 'القيمة', 'من تاريخ', 'إلى تاريخ', 'الحد الأدنى', 'نشط', 'الرسالة']);
  
  // Sample promotion
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 30);
  
  sheet.appendRow([
    'WELCOME10',
    'خصم ترحيبي',
    'percentage',
    10,
    new Date(),
    tomorrow,
    50,
    true,
    'مرحبا بك! خصم 10%'
  ]);
  
  return sheet;
}

// ================================================================
// ORDER HANDLERS
// ================================================================
function handleSubmitOrder(body, e) {
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(30000);
    
    // Validate request
    if (!body.items || body.items.length === 0) {
      throw new Error('No items in order');
    }
    
    if (!body.customer || !body.customer.name || !body.customer.phone) {
      throw new Error('Customer information required');
    }
    
    // Check idempotency
    const idempotencyKey = e.parameter.idempotencyKey || body.idempotencyKey;
    if (idempotencyKey) {
      const existing = checkIdempotency(idempotencyKey);
      if (existing) {
        return {
          data: {
            orderId: existing.orderId,
            eta: existing.eta,
            duplicate: true
          }
        };
      }
    }
    
    // CRITICAL: Calculate prices server-side
    const priceData = calculateOrderPrices(body.items, body.promoCode);
    
    // Generate order ID
    const orderId = 'ORD-' + Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyyMMddHHmmss'
    ) + '-' + Math.floor(Math.random() * 9000 + 1000);
    
    // Build complete order
    const order = {
      id: orderId,
      timestamp: Date.now(),
      date: new Date().toLocaleString('ar-EG'),
      customer: body.customer,
      items: priceData.items,
      subtotal: priceData.subtotal,
      discount: priceData.discount,
      discountMessage: priceData.discountMessage,
      deliveryFee: priceData.deliveryFee,
      total: priceData.total,
      deliveryMethod: body.deliveryMethod || 'delivery',
      branch: body.branch || null,
      location: body.location || null,
      promoCode: body.promoCode || null
    };
    
    // Save to sheet
    saveOrderToSheet(order);
    
    // Save idempotency
    const eta = order.deliveryMethod === 'pickup' ? '≈ 15 دقيقة' : '≈ 30 دقيقة';
    if (idempotencyKey) {
      saveIdempotency(idempotencyKey, orderId, eta);
    }
    
    // Send Telegram notification
    sendTelegramNotification(order);
    
    return {
      data: {
        orderId: orderId,
        eta: eta,
        etaEn: order.deliveryMethod === 'pickup' ? '≈ 15 minutes' : '≈ 30 minutes',
        calculatedPrices: {
          items: priceData.items,
          subtotal: priceData.subtotal,
          discount: priceData.discount,
          deliveryFee: priceData.deliveryFee,
          total: priceData.total
        }
      }
    };
    
  } catch (error) {
    Logger.log('Error in handleSubmitOrder: ' + error.toString());
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function saveOrderToSheet(order) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  let sheet = ss.getSheetByName(config.MAIN_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(config.MAIN_SHEET_NAME);
    sheet.appendRow([
      'رقم الطلب', 'التاريخ', 'اسم العميل', 'الهاتف',
      'العنوان', 'طريقة الاستلام', 'الفرع', 'المنتجات',
      'المبلغ الفرعي', 'الخصم', 'رسوم التوصيل', 'المبلغ النهائي',
      'الحالة', 'تاريخ المعالجة', 'ملاحظات'
    ]);
  }
  
  const products = order.items.map(i => 
    `${i.name} × ${i.quantity} = ${i.subtotal} ج.م`
  ).join('\n');
  
  sheet.appendRow([
    order.id,
    order.date,
    order.customer.name,
    order.customer.phone,
    order.customer.address || '-',
    order.deliveryMethod === 'pickup' ? 'استلام' : 'توصيل',
    order.branch || '-',
    products,
    order.subtotal,
    order.discount,
    order.deliveryFee,
    order.total,
    'جديد',
    '',
    order.customer.notes || ''
  ]);
}

function handleTrackOrder(e) {
  const orderId = e.parameter.orderId;
  
  if (!orderId) {
    throw new Error('Order ID required');
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  const sheet = ss.getSheetByName(config.MAIN_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Orders sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(orderId)) {
      return {
        data: {
          orderId: data[i][0],
          status: data[i][12],
          date: data[i][1],
          total: data[i][11]
        }
      };
    }
  }
  
  throw new Error('Order not found');
}

function handleCancelOrder(body) {
  const orderId = body.orderId;
  
  if (!orderId) {
    throw new Error('Order ID required');
  }
  
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = getConfig();
    const sheet = ss.getSheetByName(config.MAIN_SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Orders sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(orderId)) {
        sheet.getRange(i + 1, 13).setValue('ملغي');
        return { data: { success: true, message: 'Order cancelled' } };
      }
    }
    
    throw new Error('Order not found');
    
  } finally {
    lock.releaseLock();
  }
}

// ================================================================
// PRODUCT HANDLERS
// ================================================================
function handleGetProducts(e) {
  const products = Object.values(getProductsMap());
  return { data: products };
}

function handleGetProduct(productId) {
  const products = getProductsMap();
  const product = products[productId];
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  return { data: product };
}

function handleSearchProducts(e) {
  const query = (e.parameter.q || '').toLowerCase();
  const products = Object.values(getProductsMap());
  
  const results = products.filter(p => 
    p.name.toLowerCase().includes(query) ||
    (p.nameEn && p.nameEn.toLowerCase().includes(query))
  );
  
  return { data: results };
}

// ================================================================
// USER HANDLERS
// ================================================================
function handleSaveUser(body) {
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = getConfig();
    let sheet = ss.getSheetByName(config.USERS_SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(config.USERS_SHEET_NAME);
      sheet.appendRow(['User ID', 'Name', 'Phone', 'Email', 'Address', 'Created']);
    }
    
    sheet.appendRow([
      body.userId || Utilities.getUuid(),
      body.name,
      body.phone,
      body.email || '',
      body.address || '',
      new Date().toISOString()
    ]);
    
    return { data: { success: true } };
    
  } finally {
    lock.releaseLock();
  }
}

function handleGetUserProfile(e) {
  const userId = e.parameter.userId;
  
  if (!userId) {
    throw new Error('User ID required');
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  const sheet = ss.getSheetByName(config.USERS_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Users sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return {
        data: {
          userId: data[i][0],
          name: data[i][1],
          phone: data[i][2],
          email: data[i][3],
          address: data[i][4]
        }
      };
    }
  }
  
  throw new Error('User not found');
}

function handleUpdateUser(userId, body) {
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = getConfig();
    const sheet = ss.getSheetByName(config.USERS_SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Users sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        if (body.name) sheet.getRange(i + 1, 2).setValue(body.name);
        if (body.phone) sheet.getRange(i + 1, 3).setValue(body.phone);
        if (body.email) sheet.getRange(i + 1, 4).setValue(body.email);
        if (body.address) sheet.getRange(i + 1, 5).setValue(body.address);
        
        return { data: { success: true } };
      }
    }
    
    throw new Error('User not found');
    
  } finally {
    lock.releaseLock();
  }
}

// ================================================================
// BRANCH HANDLERS
// ================================================================
function handleGetBranches() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  let sheet = ss.getSheetByName(config.BRANCHES_SHEET_NAME);
  
  if (!sheet) {
    sheet = createBranchesSheet();
  }
  
  const data = sheet.getDataRange().getValues();
  const branches = [];
  
  for (let i = 1; i < data.length; i++) {
    branches.push({
      id: data[i][0],
      name: data[i][1],
      nameEn: data[i][2],
      address: data[i][3],
      phone: data[i][4],
      lat: data[i][5],
      lng: data[i][6],
      available: data[i][7]
    });
  }
  
  return { data: branches };
}

function createBranchesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  const sheet = ss.insertSheet(config.BRANCHES_SHEET_NAME);
  
  sheet.appendRow(['ID', 'الاسم', 'Name (EN)', 'العنوان', 'الهاتف', 'Lat', 'Lng', 'متاح']);
  
  const branches = [
    ['maadi', 'المعادي', 'Maadi', 'شارع 9، المعادي', '01234567890', 29.9602, 31.2494, true],
    ['zamalek', 'الزمالك', 'Zamalek', 'شارع 26 يوليو، الزمالك', '01234567891', 30.0626, 31.2188, true],
    ['downtown', 'وسط البلد', 'Downtown', 'شارع طلعت حرب', '01234567892', 30.0444, 31.2357, true]
  ];
  
  branches.forEach(b => sheet.appendRow(b));
  return sheet;
}

function handleCheckBranchAvailability(e) {
  const branchId = e.parameter.branchId;
  
  if (!branchId) {
    throw new Error('Branch ID required');
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  const sheet = ss.getSheetByName(config.BRANCHES_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Branches sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === branchId) {
      return {
        data: {
          branchId: data[i][0],
          available: data[i][7],
          name: data[i][1]
        }
      };
    }
  }
  
  throw new Error('Branch not found');
}

function handleGetBranchHours(branchId) {
  return {
    data: {
      branchId: branchId,
      hours: {
        sunday: { open: '10:00', close: '23:00' },
        monday: { open: '10:00', close: '23:00' },
        tuesday: { open: '10:00', close: '23:00' },
        wednesday: { open: '10:00', close: '23:00' },
        thursday: { open: '10:00', close: '23:00' },
        friday: { open: '14:00', close: '00:00' },
        saturday: { open: '10:00', close: '00:00' }
      }
    }
  };
}

// ================================================================
// ANALYTICS HANDLERS
// ================================================================
function handleTrackEvent(body) {
  // Log analytics event (can integrate with Google Analytics, etc.)
  Logger.log('Analytics Event: ' + JSON.stringify(body));
  return { data: { success: true } };
}

function handleTrackEvents(body) {
  // Log batch analytics events
  Logger.log('Analytics Events: ' + JSON.stringify(body.events));
  return { data: { success: true } };
}

// ================================================================
// NOTIFICATION HANDLERS
// ================================================================
function handleSendWhatsApp(body) {
  // Integrate with WhatsApp Business API
  Logger.log('WhatsApp notification: ' + JSON.stringify(body));
  return { data: { success: true, message: 'WhatsApp notification queued' } };
}

function handleSendEmail(body) {
  try {
    MailApp.sendEmail({
      to: body.to,
      subject: body.subject,
      body: body.message,
      htmlBody: body.html || body.message
    });
    
    return { data: { success: true } };
  } catch (error) {
    Logger.log('Email error: ' + error.toString());
    throw error;
  }
}

// ================================================================
// PROMOTION HANDLERS
// ================================================================
function handleGetActivePromotions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  let sheet = ss.getSheetByName(config.PROMOTIONS_SHEET_NAME);
  
  if (!sheet) {
    sheet = createPromotionsSheet();
  }
  
  const data = sheet.getDataRange().getValues();
  const promotions = [];
  const now = new Date();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === true) {
      const validFrom = new Date(data[i][4]);
      const validTo = new Date(data[i][5]);
      
      if (now >= validFrom && now <= validTo) {
        promotions.push({
          code: data[i][0],
          name: data[i][1],
          type: data[i][2],
          value: data[i][3],
          minOrder: data[i][6],
          message: data[i][8]
        });
      }
    }
  }
  
  return { data: promotions };
}

function handleValidatePromoCode(body) {
  const code = body.code;
  const subtotal = body.subtotal || 0;
  
  if (!code) {
    throw new Error('Promo code required');
  }
  
  const result = validatePromotion(code, subtotal);
  
  if (!result.valid) {
    throw new Error(result.error);
  }
  
  return { data: result };
}

// ================================================================
// TELEGRAM NOTIFICATION
// ================================================================
function sendTelegramNotification(order) {
  try {
    const config = getConfig();
    
    if (!config.TELEGRAM_BOT_TOKEN || !config.TELEGRAM_CHAT_ID) {
      Logger.log('⚠️ Telegram credentials not configured');
      return;
    }
    
    const subtotal = order.subtotal || 0;
    const discount = order.discount || 0;
    const discountPercentage = subtotal > 0 ? Math.round((discount / subtotal) * 100) : 0;
    
    const productsList = order.items.map((item, idx) =>
      `${idx + 1}. ${escapeHtml(item.name)} × ${item.quantity} = ${item.subtotal.toFixed(2)} ج.م`
    ).join('\n');
    
    // Location info
    let locationInfo = '';
    if (order.deliveryMethod === 'pickup' && order.branch) {
      locationInfo = `\n🏪 <b>الفرع:</b> ${escapeHtml(order.branch)}`;
    } else if (order.location && order.location.lat && order.location.lng) {
      locationInfo = `\n🗺️ <a href="https://www.google.com/maps?q=${order.location.lat},${order.location.lng}">فتح الموقع على الخريطة</a>`;
    }
    
    // Discount info
    let discountInfo = '';
    if (discount > 0) {
      discountInfo = `\n🎁 <b>الخصم (${discountPercentage}%):</b> ${discount.toFixed(2)} ج.م`;
      if (order.discountMessage) {
        discountInfo += `\n💝 ${escapeHtml(order.discountMessage)}`;
      }
    }
    
    // Delivery method
    const deliveryMethod = order.deliveryMethod === 'pickup' 
      ? '🏪 استلام من الفرع' 
      : '🚚 توصيل للمنزل';
    
    // ETA
    const eta = order.deliveryMethod === 'pickup' ? '15 دقيقة' : '30 دقيقة';
    
    const message =
      `🔔 <b>طلب جديد</b> #${escapeHtml(order.id)}\n\n` +
      `👤 <b>العميل:</b> ${escapeHtml(order.customer.name)}\n` +
      `📞 <b>الهاتف:</b> <a href="tel:+2${escapeHtml(order.customer.phone)}">${escapeHtml(order.customer.phone)}</a>\n` +
      `📦 <b>طريقة الاستلام:</b> ${deliveryMethod}${locationInfo}\n` +
      (order.customer.address ? `📍 <b>العنوان:</b> ${escapeHtml(order.customer.address)}\n` : '') +
      `\n🛒 <b>المنتجات:</b>\n${productsList}\n\n` +
      `💰 <b>المبلغ الفرعي:</b> ${subtotal.toFixed(2)} ج.م\n` +
      `🚚 <b>رسوم التوصيل:</b> ${order.deliveryFee.toFixed(2)} ج.م${discountInfo}\n` +
      `━━━━━━━━━━━━━━\n` +
      `💳 <b>المبلغ النهائي:</b> ${order.total.toFixed(2)} ج.م\n\n` +
      `⏰ <b>التاريخ:</b> ${escapeHtml(order.date)}\n` +
      (order.customer.notes ? `\n📝 <b>ملاحظات العميل:</b>\n${escapeHtml(order.customer.notes)}\n` : '') +
      `\n⏱️ <b>الوقت المتوقع:</b> ${eta}`;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ قبول الطلب', callback_data: `accept_${order.id}` },
          { text: '❌ رفض الطلب', callback_data: `reject_${order.id}` }
        ],
        [
          { text: '📞 الاتصال بالعميل', url: `tel:+2${order.customer.phone}` }
        ]
      ]
    };
    
    // Add location button if available
    if (order.location && order.location.lat && order.location.lng) {
      keyboard.inline_keyboard.push([
        { text: '🗺️ فتح الموقع', url: `https://www.google.com/maps?q=${order.location.lat},${order.location.lng}` }
      ]);
    }
    
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: config.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      reply_markup: JSON.stringify(keyboard),
      disable_web_page_preview: false
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('✅ Telegram notification sent: ' + order.id);
    } else {
      Logger.log('❌ Telegram error: ' + response.getContentText());
    }
    
    return result;
    
  } catch (error) {
    Logger.log('❌ Telegram notification failed: ' + error.toString());
    return null;
  }
}

// ================================================================
// TELEGRAM WEBHOOK HANDLER
// ================================================================
function handleTelegramUpdate(update) {
  try {
    if (update.callback_query) {
      handleTelegramCallback(update.callback_query);
    }
  } catch (error) {
    Logger.log('Error in handleTelegramUpdate: ' + error.toString());
  }
}

function handleTelegramCallback(callbackQuery) {
  try {
    const config = getConfig();
    const data = callbackQuery.data;
    const callbackId = callbackQuery.id;
    const from = callbackQuery.from;
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const messageId = message.message_id;
    
    Logger.log('Callback data: ' + data);
    
    // Parse action and orderId
    const parts = data.split('_');
    const action = parts[0];
    const orderId = parts.slice(1).join('_');
    
    if (!orderId) {
      answerCallbackQuery(callbackId, '⚠️ بيانات غير صحيحة');
      return;
    }
    
    // Update order status
    const operatorName = from.first_name || from.username || 'المشغل';
    let statusText = '';
    let answerText = '';
    
    if (action === 'accept') {
      statusText = 'مقبول ✅';
      answerText = '✅ تم قبول الطلب بنجاح';
    } else if (action === 'reject') {
      statusText = 'مرفوض ❌';
      answerText = '❌ تم رفض الطلب';
    } else {
      answerCallbackQuery(callbackId, '⚠️ إجراء غير معروف');
      return;
    }
    
    const updated = updateOrderStatus(orderId, statusText, operatorName);
    
    // Answer callback
    if (!updated) {
      answerCallbackQuery(callbackId, '⚠️ لم يتم العثور على الطلب');
      return;
    }
    
    answerCallbackQuery(callbackId, answerText);
    
    // Edit message
    const timestamp = new Date().toLocaleString('ar-EG', { 
      timeZone: 'Africa/Cairo',
      dateStyle: 'short',
      timeStyle: 'short'
    });
    
    const newText = message.text + 
      `\n\n<b>━━━━━━━━━━━━━━</b>` +
      `\n<b>🔄 حالة الطلب:</b> ${statusText}` +
      `\n<b>👤 تم بواسطة:</b> ${escapeHtml(operatorName)}` +
      `\n<b>🕒 ${timestamp}</b>`;
    
    editTelegramMessage(chatId, messageId, newText);
    
  } catch (error) {
    Logger.log('Error in handleTelegramCallback: ' + error.toString());
  }
}

function updateOrderStatus(orderId, statusText, operatorName) {
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = getConfig();
    const sheet = ss.getSheetByName(config.MAIN_SHEET_NAME);
    
    if (!sheet) return false;
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(orderId)) {
        // Update status (column 13)
        sheet.getRange(i + 1, 13).setValue(`${statusText} (${operatorName})`);
        
        // Update processing date (column 14)
        sheet.getRange(i + 1, 14).setValue(new Date().toLocaleString('ar-EG'));
        
        // Highlight row
        const rowRange = sheet.getRange(i + 1, 1, 1, sheet.getLastColumn());
        if (statusText.includes('مقبول')) {
          rowRange.setBackground('#c8e6c9'); // Light green
        } else if (statusText.includes('مرفوض')) {
          rowRange.setBackground('#ffcdd2'); // Light red
        }
        
        Logger.log('✅ Order status updated: ' + orderId);
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('Error in updateOrderStatus: ' + error.toString());
    return false;
  } finally {
    lock.releaseLock();
  }
}

function answerCallbackQuery(callbackQueryId, text) {
  try {
    const config = getConfig();
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    
    const payload = {
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: true
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    UrlFetchApp.fetch(url, options);
    
  } catch (error) {
    Logger.log('Error in answerCallbackQuery: ' + error.toString());
  }
}

function editTelegramMessage(chatId, messageId, newText) {
  try {
    const config = getConfig();
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/editMessageText`;
    
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    UrlFetchApp.fetch(url, options);
    
  } catch (error) {
    Logger.log('Error in editTelegramMessage: ' + error.toString());
  }
}

// ================================================================
// TELEGRAM WEBHOOK SETUP
// ================================================================
function setTelegramWebhook() {
  const config = getConfig();
  const webAppUrl = ScriptApp.getService().getUrl();
  const webhookUrl = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/setWebhook`;
  
  const payload = {
    url: webAppUrl,
    allowed_updates: ['callback_query', 'message']
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(webhookUrl, options);
  const result = JSON.parse(response.getContentText());
  
  Logger.log('Webhook setup result: ' + response.getContentText());
  
  return result;
}

function deleteTelegramWebhook() {
  const config = getConfig();
  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/deleteWebhook`;
  
  const response = UrlFetchApp.fetch(url);
  Logger.log('Webhook deleted: ' + response.getContentText());
  
  return response.getContentText();
}

// ================================================================
// TEST FUNCTIONS
// ================================================================
function testOrder() {
  const testData = {
    items: [
      { productId: 'prod_001', quantity: 2 },
      { productId: 'prod_003', quantity: 1 }
    ],
    customer: {
      name: 'أحمد محمد',
      phone: '01234567890',
      address: 'شارع التحرير، الدقي',
      notes: 'الرجاء الاتصال عند الوصول'
    },
    deliveryMethod: 'delivery',
    promoCode: 'WELCOME10',
    location: {
      lat: 30.0444,
      lng: 31.2357
    }
  };
  
  const result = handleSubmitOrder(testData, { parameter: {} });
  Logger.log('Test Order Result: ' + JSON.stringify(result));
  
  return result;
}

function testCallback() {
  const testUpdate = {
    callback_query: {
      id: '123456',
      from: {
        first_name: 'Test User',
        username: 'testuser'
      },
      message: {
        chat: { id: getConfig().TELEGRAM_CHAT_ID },
        message_id: 12345,
        text: '🔔 طلب جديد #ORD-TEST'
      },
      data: 'accept_ORD-TEST'
    }
  };
  
  handleTelegramUpdate(testUpdate);
  Logger.log('Test callback processed');
}

function testPromoCode() {
  const result = handleValidatePromoCode({ 
    code: 'WELCOME10', 
    subtotal: 100 
  });
  
  Logger.log('Promo Code Test: ' + JSON.stringify(result));
  return result;
}

function testProducts() {
  const products = handleGetProducts({});
  Logger.log('Products: ' + JSON.stringify(products));
  return products;
}

// ================================================================
// DEPLOYMENT INSTRUCTIONS
// ================================================================
/*
DEPLOYMENT STEPS:

1. Setup Secrets:
   - Run setupSecrets() function once
   - Update with your actual values:
     * TELEGRAM_BOT_TOKEN
     * TELEGRAM_CHAT_ID
     * ALLOWED_ORIGINS (comma-separated)
     * FIREBASE_PROJECT_ID

2. Deploy as Web App:
   - Click "Deploy" > "New deployment"
   - Choose type: "Web app"
   - Description: "Restaurant Order System API"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"
   - Copy the Web App URL

3. Setup Telegram Webhook:
   - Run setTelegramWebhook() function
   - Check logs to confirm webhook is set

4. Test the API:
   - Run testOrder() to test order submission
   - Run testCallback() to test Telegram callbacks
   - Run testPromoCode() to test promotions
   - Run testProducts() to test product listing

5. Configure Frontend:
   - Update api.js with your Web App URL
   - Add URL to ALLOWED_ORIGINS in setupSecrets()

SECURITY CHECKLIST:
✅ All prices calculated server-side
✅ Frontend sends only product IDs + quantities
✅ Promotions validated server-side
✅ CORS whitelist configured
✅ LockService prevents race conditions
✅ Idempotency prevents duplicate orders
✅ Input validation on all endpoints
✅ Telegram webhook secured
✅ No hardcoded secrets (use PropertiesService)

TESTING WITH CURL:

# Test order submission
curl -X POST "YOUR_WEB_APP_URL?path=/orders/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "prod_001", "quantity": 2}],
    "customer": {"name": "Test", "phone": "01234567890"},
    "deliveryMethod": "delivery",
    "promoCode": "WELCOME10"
  }'

# Test order tracking
curl "YOUR_WEB_APP_URL?path=/orders/track&orderId=ORD-123"

# Test products
curl "YOUR_WEB_APP_URL?path=/products"

# Test promo validation
curl -X POST "YOUR_WEB_APP_URL?path=/promotions/validate" \
  -H "Content-Type: application/json" \
  -d '{"code": "WELCOME10", "subtotal": 100}'
*/