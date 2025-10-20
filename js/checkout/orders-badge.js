// ================================================================
// orders-badge.js - Orders Badge Manager
// ================================================================

import { storage } from '../storage.js';

// ================================================================
// Update Orders Badge
// ================================================================
export function updateOrdersBadge() {
  console.log('🔄 Updating orders badge...');
  
  const activeCount = storage.getActiveOrdersCount();
  
  // Update sidebar badge
  const sidebarBadge = document.getElementById('sidebarOrdersBadge');
  if (sidebarBadge) {
    if (activeCount > 0) {
      sidebarBadge.textContent = activeCount;
      sidebarBadge.style.display = 'inline-block';
    } else {
      sidebarBadge.style.display = 'none';
    }
  }
  
  // Update header badge (if exists)
  const headerBadge = document.getElementById('headerOrdersBadge');
  if (headerBadge) {
    if (activeCount > 0) {
      headerBadge.textContent = activeCount;
      headerBadge.style.display = 'inline-block';
    } else {
      headerBadge.style.display = 'none';
    }
  }
  
  console.log('✅ Orders badge updated:', activeCount);
}

// ================================================================
// Initialize Badge Listener
// ================================================================
export function initOrdersBadge() {
  console.log('🔧 Initializing orders badge...');
  
  // Update badge on page load
  updateOrdersBadge();
  
  // Listen for orders updates
  window.addEventListener('ordersUpdated', (event) => {
    console.log('📢 Orders updated event received:', event.detail);
    updateOrdersBadge();
  });
  
  console.log('✅ Orders badge initialized');
}

// ================================================================
// Open Orders Page
// ================================================================
export function openOrdersPage() {
  console.log('📦 Opening orders page...');
  
  const lang = window.currentLang || 'ar';
  const orders = storage.getOrders();
  
  if (orders.length === 0) {
    // No orders - show empty state
    showToast(
      lang === 'ar' ? 'لا توجد طلبات' : 'No Orders',
      lang === 'ar' ? 'لم تقم بأي طلبات بعد' : 'You haven\'t placed any orders yet',
      'info'
    );
    return;
  }
  
  // Create orders modal
  showOrdersModal(orders);
}

// ================================================================
// Show Orders Modal
// ================================================================
function showOrdersModal(orders) {
  const lang = window.currentLang || 'ar';
  
  // Check if modal exists
  let modal = document.getElementById('ordersModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ordersModal';
    modal.className = 'modal-overlay orders-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
    `;
    
    document.body.appendChild(modal);
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeOrdersModal();
      }
    });
  }
  
  // Build orders list
  const ordersHtml = orders.map(order => {
    const statusInfo = getStatusInfo(order.status, lang);
    const orderDate = new Date(order.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
    
    return `
      <div class="order-card" style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div>
            <div style="font-weight: 700; color: #333; font-size: 16px; margin-bottom: 4px;">
              ${order.id}
            </div>
            <div style="font-size: 13px; color: #666;">
              ${orderDate}
            </div>
          </div>
          <div style="background: ${statusInfo.color}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
            ${statusInfo.text}
          </div>
        </div>
        
        <div style="border-top: 1px solid #f0f0f0; padding-top: 12px; margin-bottom: 12px;">
          ${order.items.slice(0, 2).map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
              <span style="color: #666;">${item.name} × ${item.quantity}</span>
              <span style="font-weight: 600; color: #333;">${item.total.toFixed(2)} EGP</span>
            </div>
          `).join('')}
          ${order.items.length > 2 ? `
            <div style="font-size: 13px; color: #999; margin-top: 4px;">
              ${lang === 'ar' ? 'و' : 'and'} ${order.items.length - 2} ${lang === 'ar' ? 'عنصر آخر' : 'more items'}
            </div>
          ` : ''}
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f0f0f0;">
          <div style="font-size: 16px; font-weight: 700; color: #667eea;">
            ${order.totals.total.toFixed(2)} EGP
          </div>
          <button 
            onclick="trackOrderFromModal('${order.id}')" 
            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;"
          >
            ${lang === 'ar' ? 'تتبع' : 'Track'}
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 16px; max-width: 600px; width: 100%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
      <div style="padding: 20px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <i data-lucide="package" style="width: 24px; height: 24px; color: white;"></i>
          <h2 style="margin: 0; color: white; font-size: 20px;">${lang === 'ar' ? 'طلباتي' : 'My Orders'}</h2>
        </div>
        <button onclick="closeOrdersModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <i data-lucide="x" style="width: 20px; height: 20px;"></i>
        </button>
      </div>
      
      <div style="padding: 20px; overflow-y: auto; flex: 1;">
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 14px; color: #666;">
            ${lang === 'ar' ? 'إجمالي الطلبات:' : 'Total Orders:'} <strong>${orders.length}</strong>
          </div>
          <div style="font-size: 14px; color: #666;">
            ${lang === 'ar' ? 'النشطة:' : 'Active:'} <strong style="color: #667eea;">${storage.getActiveOrdersCount()}</strong>
          </div>
        </div>
        
        ${ordersHtml}
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Refresh icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// Close Orders Modal
// ================================================================
export function closeOrdersModal() {
  const modal = document.getElementById('ordersModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ================================================================
// Track Order from Modal
// ================================================================
window.trackOrderFromModal = async function(orderId) {
  console.log('🔍 Tracking order from modal:', orderId);
  
  closeOrdersModal();
  
  // Import and call tracking function
  try {
    const { showTrackingModal } = await import('./checkout-ui.js');
    showTrackingModal(orderId);
  } catch (err) {
    console.error('❌ Failed to open tracking:', err);
  }
};

// ================================================================
// Get Status Info
// ================================================================
function getStatusInfo(status, lang) {
  const statusMap = {
    'pending': {
      ar: 'قيد الانتظار',
      en: 'Pending',
      color: '#ff9800'
    },
    'confirmed': {
      ar: 'تم التأكيد',
      en: 'Confirmed',
      color: '#2196F3'
    },
    'preparing': {
      ar: 'قيد التحضير',
      en: 'Preparing',
      color: '#ff5722'
    },
    'ready': {
      ar: 'جاهز',
      en: 'Ready',
      color: '#4caf50'
    },
    'out_for_delivery': {
      ar: 'في الطريق',
      en: 'Out for Delivery',
      color: '#9c27b0'
    },
    'delivered': {
      ar: 'تم التوصيل',
      en: 'Delivered',
      color: '#4caf50'
    },
    'cancelled': {
      ar: 'ملغي',
      en: 'Cancelled',
      color: '#f44336'
    }
  };
  
  const info = statusMap[status] || statusMap['pending'];
  
  return {
    text: lang === 'ar' ? info.ar : info.en,
    color: info.color
  };
}

// ================================================================
// Import showToast for notifications
// ================================================================
let showToast;
import('../utils.js').then(module => {
  showToast = module.showToast;
}).catch(err => {
  console.warn('⚠️ Could not import showToast:', err);
  showToast = (title, msg, type) => alert(`${title}: ${msg}`);
});

// ================================================================
// Expose to Window
// ================================================================
window.openOrdersPage = openOrdersPage;
window.closeOrdersModal = closeOrdersModal;

console.log('✅ Orders badge manager loaded');
