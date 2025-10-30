/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // React Mini-App files
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    
    // 🔗 Vanilla JS files (for unified CSS)
    "../index.html",
    "../js/**/*.js",
    "../styles/**/*.css",
  ],
  theme: {
    extend: {
      // ================================================================
      // 🎨 COLORS - Migrated from components.css
      // ================================================================
      colors: {
        // ✅ الربط: كلاسات Tailwind تقرأ من CSS Variables
        // Primary Colors (Pink) - يقرأ من components.css
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        // Secondary Color (Purple) - يقرأ من components.css
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          50: 'var(--color-secondary-50)',
          100: 'var(--color-secondary-100)',
          200: 'var(--color-secondary-200)',
          300: 'var(--color-secondary-300)',
          400: 'var(--color-secondary-400)',
          500: 'var(--color-secondary-500)',
          600: 'var(--color-secondary-600)',
          700: 'var(--color-secondary-700)',
          800: 'var(--color-secondary-800)',
          900: 'var(--color-secondary-900)',
        },
        // Accent Color (Mint) - يقرأ من components.css
        accent: {
          DEFAULT: 'var(--color-accent)',
          50: 'var(--color-accent-50)',
          100: 'var(--color-accent-100)',
          200: 'var(--color-accent-200)',
          300: 'var(--color-accent-300)',
          400: 'var(--color-accent-400)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
          800: 'var(--color-accent-800)',
          900: 'var(--color-accent-900)',
        },
        // Cream Colors - يقرأ من components.css
        cream: {
          50: 'var(--color-cream-50)',
          100: 'var(--color-cream-100)',
          200: 'var(--color-cream-200)',
          300: 'var(--color-cream-300)',
          400: 'var(--color-cream-400)',
          500: 'var(--color-cream-500)',
          600: 'var(--color-cream-600)',
          700: 'var(--color-cream-700)',
          800: 'var(--color-cream-800)',
          900: 'var(--color-cream-900)',
        },
        // Energy Colors (للمنتجات) - قيم ثابتة (لا تحتاج CSS Variables)
        energy: {
          mental: '#8b5cf6',    // Purple for mental energy
          physical: '#f59e0b',  // Orange for physical energy
          balanced: '#10b981',  // Green for balanced
        }
      },
      
      // ================================================================
      // 🔤 FONTS - Migrated from components.css
      // ================================================================
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
        english: ['Poppins', 'sans-serif'],
      },
      
      // ================================================================
      // 📏 Z-INDEX HIERARCHY - Migrated from components.css
      // ================================================================
      zIndex: {
        'base': '0',
        'content': '10',
        'carousel': '5',
        'carousel-controls': '10',
        'products': '2',
        'product-hover': '3',
        'sticky-categories': '90',
        'dropdown': '50',
        'header': '100',
        'header-elements': '101',
        'sidebar-overlay': '900',
        'sidebar': '1000',
        'modal-overlay': '1900',
        'modal-base': '2000',
        'modal-nested': '2100',
        'modal-processing': '2200',
        'modal-close-btn': '2300',
        'toast': '5000',
      },
      
      // ================================================================
      // 🎬 ANIMATIONS - Enhanced from components.css
      // ================================================================
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'gentle-pulse': 'gentlePulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'slide-in-right-sidebar': 'slideInRightSidebar 0.3s ease-out',
        'slide-in-left-sidebar': 'slideInLeftSidebar 0.3s ease-out',
        'fade-in-overlay': 'fadeInOverlay 0.3s ease-out',
        'scale-in-modal': 'scaleInModal 0.3s ease-out',
        'skeleton-pulse': 'skeleton-pulse 2s ease-in-out infinite',
      },
      
      // ================================================================
      // 🎨 KEYFRAMES - Migrated from components.css
      // ================================================================
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(50px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(255, 107, 157, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 107, 157, 0.6)' },
        },
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        gentlePulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideInRightSidebar: {
          'from': { transform: 'translateX(100%)' },
          'to': { transform: 'translateX(0)' },
        },
        slideInLeftSidebar: {
          'from': { transform: 'translateX(-100%)' },
          'to': { transform: 'translateX(0)' },
        },
        fadeInOverlay: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        scaleInModal: {
          'from': { transform: 'scale(0.9)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        'skeleton-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      
      // ================================================================
      // 📐 SPACING & LAYOUT
      // ================================================================
      spacing: {
        'sidebar': '320px',
      },
    },
  },
  plugins: [],
}
