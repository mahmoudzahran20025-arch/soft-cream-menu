# 🚀 GA4 Quick Start - 5 Minutes Setup

**Measurement ID:** `G-5TWQ7CZF2Q`

---

## ⚡ Step 1: Add GA4 to index.html (2 min)

### Open `index.html` and add this in `<head>` (before closing `</head>`):

```html
<!-- Google Analytics 4 - Soft Cream Webapp -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5TWQ7CZF2Q"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-5TWQ7CZF2Q', {
    'anonymize_ip': true,
    'send_page_view': true,
    'allow_google_signals': false,
    'allow_ad_personalization_signals': false
  });
  console.log('✅ GA4 initialized');
</script>
```

---

## ⚡ Step 2: Add Cookie Consent (2 min)

### Add this before closing `</body>` in `index.html`:

```html
<!-- Cookie Consent -->
<div id="cookieConsent" style="display:none;position:fixed;bottom:0;left:0;right:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:20px;z-index:10000;box-shadow:0 -4px 20px rgba(0,0,0,0.2)">
  <div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap">
    <p style="margin:0;flex:1;min-width:250px">
      🍪 نستخدم ملفات تعريف الارتباط لتحسين تجربتك
    </p>
    <div style="display:flex;gap:10px">
      <button id="acceptCookies" style="padding:10px 24px;border:none;border-radius:8px;background:white;color:#667eea;font-weight:bold;cursor:pointer">قبول</button>
      <button id="declineCookies" style="padding:10px 24px;border:none;border-radius:8px;background:rgba(255,255,255,0.2);color:white;font-weight:bold;cursor:pointer">رفض</button>
    </div>
  </div>
</div>

<script>
(function() {
  const consent = localStorage.getItem('cookieConsent');
  const banner = document.getElementById('cookieConsent');
  if (!consent) banner.style.display = 'block';
  
  document.getElementById('acceptCookies').addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    banner.style.display = 'none';
    window['ga-disable-G-5TWQ7CZF2Q'] = false;
  });
  
  document.getElementById('declineCookies').addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'declined');
    banner.style.display = 'none';
    window['ga-disable-G-5TWQ7CZF2Q'] = true;
  });
  
  if (consent === 'declined') window['ga-disable-G-5TWQ7CZF2Q'] = true;
})();
</script>
```

---

## ⚡ Step 3: Test (1 min)

### Open Console (F12) and check:

```javascript
// Should see:
✅ GA4 initialized

// Test event:
gtag('event', 'test_event', { test: 'working' });
```

### Check GA4 Dashboard:
1. Go to: https://analytics.google.com/
2. Select: Soft Cream webapp
3. Realtime → Events
4. You should see events appearing!

---

## 🎯 Done!

**Basic tracking is now active:**
- ✅ Page views
- ✅ Scroll tracking
- ✅ Outbound clicks
- ✅ User engagement

---

## 📊 Next Steps (Optional):

### Add E-commerce Tracking:

1. **Copy** `js/analytics.js` (already created)

2. **Import** in your cart/checkout files:
```javascript
import { trackAddToCart, trackPurchase } from './analytics.js';
```

3. **Use** in your functions:
```javascript
// In addToCart()
trackAddToCart(product, quantity);

// In confirmOrder()
trackPurchase(orderId, cartItems, total, deliveryFee);
```

---

## 🔍 Full Documentation:

See `GA4-INTEGRATION.md` for:
- Complete event tracking
- E-commerce integration
- Custom events
- Privacy best practices
- SPA navigation tracking

---

**🎉 You're all set!** 🚀
