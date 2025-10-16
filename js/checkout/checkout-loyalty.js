// ================================================================
// CHECKOUT LOYALTY - الولاء والـ Gamification (FIXED VERSION)
// ================================================================

console.log('🔄 Loading checkout-loyalty.js');

// ================================================================
// Static Imports
// ================================================================
import { storage } from '../storage.js';
import { api } from '../api.js';
import { showToast } from '../utils.js';

// ================================================================
// ✅ FIX 1: Enhanced getCustomerPhone with Better Validation
// ================================================================
export function getCustomerPhone() {
  console.log('🔄 Getting customer phone...');
  
  // Try to get from form field first
  const phoneField = document.getElementById('customerPhone');
  if (phoneField?.value?.trim()) {
    const phone = phoneField.value.trim();
    console.log('✅ Phone from form field:', phone);
    return phone;
  }
  
  // Fallback to stored user data
  const userData = storage.getUserData();
  if (userData?.phone?.trim()) {
    const phone = userData.phone.trim();
    console.log('✅ Phone from storage:', phone);
    return phone;
  }
  
  console.log('⚠️ No customer phone found');
  return null;
}

// ================================================================
// ✅ FIX 2: Enhanced Tier Management
// ================================================================
export function getTierIcon(tier) {
  const icons = {
    new: '🆕',
    returning: '🎁', 
    vip: '💎',
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💍'
  };
  
  return icons[tier] || '🔹';
}

export function getTierColor(tier) {
  const colors = {
    new: '#4caf50',
    returning: '#2196F3',
    vip: '#9c27b0',
    bronze: '#8d6e63',
    silver: '#607d8b',
    gold: '#ff9800',
    platinum: '#e91e63'
  };
  
  return colors[tier] || '#666';
}

export function getTierName(tier, lang = 'ar') {
  const names = {
    new: { ar: 'عميل جديد', en: 'New Customer' },
    returning: { ar: 'عميل عائد', en: 'Returning Customer' },
    vip: { ar: 'عميل مميز', en: 'VIP Customer' },
    bronze: { ar: 'برونزي', en: 'Bronze' },
    silver: { ar: 'فضي', en: 'Silver' },
    gold: { ar: 'ذهبي', en: 'Gold' },
    platinum: { ar: 'بلاتيني', en: 'Platinum' }
  };
  
  return names[tier]?.[lang] || tier;
}

// ================================================================
// ✅ FIX 3: Enhanced Upgrade Messages
// ================================================================
export function getUpgradeMessage(tier, lang = 'ar') {
  const messages = {
    returning: {
      ar: '🎉 مبروك! أصبحت عميل عائد - خصم 15% على طلباتك القادمة',
      en: '🎉 Congratulations! You\'re now a Returning Customer - 15% off your next orders'
    },
    vip: {
      ar: '⭐ مبروك! أصبحت عميل VIP - خصم 20% + توصيل مجاني',
      en: '⭐ Congratulations! You\'re now VIP - 20% off + Free delivery'
    },
    bronze: {
      ar: '🥉 مبروك! وصلت للمستوى البرونزي - مكافآت وخصومات حصرية',
      en: '🥉 Congratulations! You\'re now Bronze tier - Exclusive rewards and discounts'
    },
    silver: {
      ar: '🥈 مبروك! وصلت للمستوى الفضي - مكافآت أكبر ونقاط إضافية',
      en: '🥈 Congratulations! You\'re now Silver tier - Bigger rewards and bonus points'
    },
    gold: {
      ar: '🥇 مبروك! وصلت للمستوى الذهبي - أولوية في الخدمة وعروض حصرية',
      en: '🥇 Congratulations! You\'re now Gold tier - Priority service and exclusive offers'
    },
    platinum: {
      ar: '💍 مذهل! وصلت للمستوى البلاتيني - أفضل المكافآت والخدمات المميزة',
      en: '💍 Amazing! You\'re now Platinum tier - Best rewards and premium services'
    }
  };
  
  return messages[tier]?.[lang] || '';
}

// ================================================================
// ✅ FIX 4: Enhanced Tier Upgrade Modal
// ================================================================
export function showTierUpgradeModal(tier, lang = 'ar') {
  console.log('🔄 Showing tier upgrade modal:', { tier, lang });
  
  const tierData = {
    returning: {
      title: lang === 'ar' ? '🎉 مبروك الترقية!' : '🎉 Congratulations!',
      subtitle: getTierName(tier, lang),
      benefits: [
        lang === 'ar' ? '✨ خصم 15% على الطلبات' : '✨ 15% off orders',
        lang === 'ar' ? '🎁 عروض حصرية' : '🎁 Exclusive offers',
        lang === 'ar' ? '⏰ أولوية في الخدمة' : '⏰ Priority service'
      ],
      color: getTierColor(tier),
      icon: getTierIcon(tier)
    },
    vip: {
      title: lang === 'ar' ? '⭐ أهلاً بك في VIP!' : '⭐ Welcome to VIP!',
      subtitle: getTierName(tier, lang),
      benefits: [
        lang === 'ar' ? '💎 خصم 20% على جميع الطلبات' : '💎 20% off all orders',
        lang === 'ar' ? '🚚 توصيل مجاني' : '🚚 Free delivery',
        lang === 'ar' ? '⭐ دعم مميز 24/7' : '⭐ Premium 24/7 support',
        lang === 'ar' ? '🎯 عروض حصرية فقط لك' : '🎯 Exclusive offers just for you'
      ],
      color: getTierColor(tier),
      icon: getTierIcon(tier)
    }
  };
  
  const data = tierData[tier] || tierData.returning;
  
  // Create modal if it doesn't exist
  let modal = document.getElementById('tierUpgradeModal');
  if (!modal) {
    modal = createTierUpgradeModal();
    document.body.appendChild(modal);
  }
  
  // Update modal content
  updateTierUpgradeModal(modal, data, lang);
  
  // Show modal with animation
  modal.classList.remove('hidden');
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Auto-hide after 8 seconds
  setTimeout(() => {
    closeTierUpgradeModal();
  }, 8000);
  
  console.log('✅ Tier upgrade modal shown');
}

function createTierUpgradeModal() {
  const modal = document.createElement('div');
  modal.id = 'tierUpgradeModal';
  modal.className = 'tier-upgrade-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  `;
  
  modal.innerHTML = `
    <div class="tier-upgrade-content" style="
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      animation: tierUpgradeSlideIn 0.5s ease;
    ">
      <button class="tier-upgrade-close" onclick="closeTierUpgradeModal()" style="
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      ">×</button>
      
      <div class="tier-upgrade-icon" style="font-size: 64px; margin-bottom: 16px;"></div>
      <h2 class="tier-upgrade-title" style="margin: 0 0 8px; color: #333;"></h2>
      <p class="tier-upgrade-subtitle" style="margin: 0 0 24px; color: #666; font-size: 18px;"></p>
      
      <div class="tier-upgrade-benefits" style="text-align: left; margin-bottom: 24px;"></div>
      
      <button class="tier-upgrade-continue" onclick="closeTierUpgradeModal()" style="
        background: linear-gradient(45deg, #2196F3, #21CBF3);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
      ">
        <span class="continue-text">متابعة</span>
      </button>
    </div>
  `;
  
  return modal;
}

function updateTierUpgradeModal(modal, data, lang) {
  const icon = modal.querySelector('.tier-upgrade-icon');
  const title = modal.querySelector('.tier-upgrade-title');
  const subtitle = modal.querySelector('.tier-upgrade-subtitle');
  const benefits = modal.querySelector('.tier-upgrade-benefits');
  const continueBtn = modal.querySelector('.continue-text');
  
  if (icon) icon.textContent = data.icon;
  if (title) title.textContent = data.title;
  if (subtitle) {
    subtitle.textContent = data.subtitle;
    subtitle.style.color = data.color;
  }
  
  if (benefits && data.benefits) {
    benefits.innerHTML = data.benefits.map(benefit => `
      <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
        <span>${benefit}</span>
      </div>
    `).join('');
  }
  
  if (continueBtn) {
    continueBtn.textContent = lang === 'ar' ? 'متابعة' : 'Continue';
  }
}

function closeTierUpgradeModal() {
  const modal = document.getElementById('tierUpgradeModal');
  if (modal) {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Make function globally available
window.closeTierUpgradeModal = closeTierUpgradeModal;

// ================================================================
// ✅ FIX 5: Enhanced Gamification Functions
// ================================================================
export async function loadGamificationPage() {
  console.log('🔄 Loading gamification page...');
  
  const customerPhone = getCustomerPhone();
  if (!customerPhone) {
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'تنبيه' : 'Notice',
      lang === 'ar' ? 'الرجاء إدخال رقم الهاتف أولاً' : 'Please enter phone number first',
      'warning'
    );
    return;
  }
  
  try {
    const loyaltyData = await api.getLoyaltyData(customerPhone);
    console.log('✅ Loyalty data loaded:', loyaltyData);
    
    showGamificationModal(loyaltyData);
    
  } catch (error) {
    console.error('❌ Failed to load gamification data:', error);
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'فشل في تحميل بيانات الولاء' : 'Failed to load loyalty data',
      'error'
    );
  }
}

function showGamificationModal(loyaltyData) {
  const lang = window.currentLang || 'ar';
  
  // Create or get existing modal
  let modal = document.getElementById('gamificationModal');
  if (!modal) {
    modal = createGamificationModal();
    document.body.appendChild(modal);
  }
  
  // Update modal content
  updateGamificationModal(modal, loyaltyData, lang);
  
  // Show modal
  modal.classList.remove('hidden');
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function createGamificationModal() {
  const modal = document.createElement('div');
  modal.id = 'gamificationModal';
  modal.className = 'gamification-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
  `;
  
  modal.innerHTML = `
    <div class="gamification-content" style="
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    ">
      <button class="gamification-close" onclick="closeGamificationModal()" style="
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      ">×</button>
      
      <div class="gamification-header" style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px; color: #333;">برنامج الولاء</h2>
        <p style="margin: 0; color: #666;">نقاطك ومكافآتك</p>
      </div>
      
      <div class="gamification-body">
        <!-- Will be filled dynamically -->
      </div>
      
      <div class="gamification-actions" style="text-align: center; margin-top: 24px;">
        <button onclick="closeGamificationModal()" style="
          background: #2196F3;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
        ">إغلاق</button>
      </div>
    </div>
  `;
  
  return modal;
}

function updateGamificationModal(modal, loyaltyData, lang) {
  const body = modal.querySelector('.gamification-body');
  const header = modal.querySelector('.gamification-header h2');
  const subtitle = modal.querySelector('.gamification-header p');
  
  if (header) header.textContent = lang === 'ar' ? 'برنامج الولاء' : 'Loyalty Program';
  if (subtitle) subtitle.textContent = lang === 'ar' ? 'نقاطك ومكافآتك' : 'Your Points & Rewards';
  
  if (body && loyaltyData) {
    body.innerHTML = renderGamificationContent(loyaltyData, lang);
  }
}

function renderGamificationContent(data, lang) {
  const {
    currentTier = 'new',
    points = 0,
    totalOrders = 0,
    totalSpent = 0,
    nextTierPoints = 100,
    badges = [],
    challenges = [],
    recentActivity = []
  } = data;
  
  return `
    <!-- Current Status -->
    <div class="loyalty-status" style="background: linear-gradient(45deg, ${getTierColor(currentTier)}, ${getTierColor(currentTier)}AA); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
      <div style="font-size: 48px; margin-bottom: 8px;">${getTierIcon(currentTier)}</div>
      <h3 style="margin: 0 0 8px;">${getTierName(currentTier, lang)}</h3>
      <div style="font-size: 24px; font-weight: 600;">${points} ${lang === 'ar' ? 'نقطة' : 'Points'}</div>
    </div>
    
    <!-- Progress to Next Tier -->
    ${nextTierPoints > points ? `
      <div class="tier-progress" style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>${lang === 'ar' ? 'التقدم للمستوى التالي:' : 'Progress to next tier:'}</span>
          <span>${points}/${nextTierPoints}</span>
        </div>
        <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: ${getTierColor(currentTier)}; height: 100%; width: ${(points / nextTierPoints) * 100}%; transition: width 0.3s ease;"></div>
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">
          ${lang === 'ar' ? `${nextTierPoints - points} نقطة متبقية` : `${nextTierPoints - points} points remaining`}
        </div>
      </div>
    ` : ''}
    
    <!-- Stats -->
    <div class="loyalty-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
      <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; font-weight: 600; color: #2196F3;">${totalOrders}</div>
        <div style="font-size: 12px; color: #666;">${lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</div>
      </div>
      <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; font-weight: 600; color: #4caf50;">${totalSpent} ${lang === 'ar' ? 'ج.م' : 'EGP'}</div>
        <div style="font-size: 12px; color: #666;">${lang === 'ar' ? 'إجمالي الإنفاق' : 'Total Spent'}</div>
      </div>
    </div>
    
    <!-- Badges -->
    ${badges.length > 0 ? `
      <div class="loyalty-badges" style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px; color: #333;">${lang === 'ar' ? 'الأوسمة المكتسبة' : 'Earned Badges'}</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${badges.map(badge => `
            <div style="background: #fff3e0; color: #f57c00; padding: 8px 12px; border-radius: 16px; font-size: 12px; font-weight: 600;">
              ${badge.icon} ${badge.name[lang]}
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    <!-- Active Challenges -->
    ${challenges.length > 0 ? `
      <div class="loyalty-challenges" style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px; color: #333;">${lang === 'ar' ? 'التحديات النشطة' : 'Active Challenges'}</h4>
        ${challenges.map(challenge => `
          <div style="background: #f0f7ff; border: 1px solid #2196F3; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 600; color: #1976D2;">${challenge.name[lang]}</span>
              <span style="background: #2196F3; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                +${challenge.reward} ${lang === 'ar' ? 'نقاط' : 'pts'}
              </span>
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${challenge.description[lang]}</div>
            <div style="background: #e3f2fd; height: 6px; border-radius: 3px; overflow: hidden;">
              <div style="background: #2196F3; height: 100%; width: ${(challenge.progress / challenge.target) * 100}%;"></div>
            </div>
            <div style="font-size: 11px; color: #1976D2; margin-top: 4px;">
              ${challenge.progress}/${challenge.target} ${challenge.unit[lang]}
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function closeGamificationModal() {
  const modal = document.getElementById('gamificationModal');
  if (modal) {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Make function globally available
window.closeGamificationModal = closeGamificationModal;

// ================================================================
// ✅ FIX 6: Loyalty Integration with Order Summary
// ================================================================
export function renderGamificationSummary() {
  console.log('🔄 Rendering gamification summary...');
  
  const upgradeMessage = document.getElementById('upgradeMessage');
  if (!upgradeMessage) return;
  
  const customerPhone = getCustomerPhone();
  if (!customerPhone) return;
  
  const lang = window.currentLang || 'ar';
  
  // Try to get loyalty data from storage or API
  const userData = storage.getUserData();
  if (userData?.tier) {
    const message = getUpgradeMessage(userData.tier, lang);
    if (message) {
      upgradeMessage.innerHTML = `
        <div style="background: linear-gradient(45deg, ${getTierColor(userData.tier)}, ${getTierColor(userData.tier)}AA); color: white; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="font-size: 20px;">${getTierIcon(userData.tier)}</span>
            <span style="font-weight: 600;">${message}</span>
          </div>
        </div>
      `;
      upgradeMessage.style.display = 'block';
    }
  }
}

// ================================================================
// ✅ FIX 7: Phone Validation Helper
// ================================================================
export function isValidEgyptianPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Egyptian phone patterns:
  // Mobile: 010xxxxxxxx, 011xxxxxxxx, 012xxxxxxxx, 015xxxxxxxx (11 digits)
  // Or with country code: +20 10xxxxxxxx (13 digits with +20)
  const mobilePattern = /^(010|011|012|015)\d{8}$/;
  const mobileWithCountryPattern = /^20(010|011|012|015)\d{8}$/;
  
  return mobilePattern.test(cleanPhone) || mobileWithCountryPattern.test(cleanPhone);
}

export function formatEgyptianPhone(phone) {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  // If it starts with 20, remove country code for display
  if (cleanPhone.startsWith('20') && cleanPhone.length === 13) {
    return cleanPhone.substring(2);
  }
  
  return cleanPhone;
}

console.log('✅ checkout-loyalty.js loaded successfully');