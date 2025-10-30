/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./js/**/*.js",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      // ================================================================
      // 🎨 COLORS - Migrated from components.css
      // ================================================================
      colors: {
        // Primary Colors (Pink) - من components.css
        primary: {
          DEFAULT: '#FF6B9D',
          dark: '#E85589',
          light: '#FF8FB3',
          50: '#FFF5F7',
          100: '#FFE4E9',
          200: '#FFCCD6',
          300: '#FFB3C4',
          400: '#FF8FB3',
          500: '#FF6B9D',
          600: '#E85589',
          700: '#D14075',
          800: '#BA2B61',
          900: '#A3164D',
        },
        // Secondary Color (Purple) - من components.css
        secondary: {
          DEFAULT: '#C9A0DC',
          50: '#F5EFFA',
          100: '#EBDFF5',
          200: '#D7BFEB',
          300: '#C9A0DC',
          400: '#B881CD',
          500: '#A762BE',
          600: '#9643AF',
          700: '#7A3690',
          800: '#5E2971',
          900: '#421C52',
        },
        // Accent Color (Mint) - من components.css
        accent: {
          DEFAULT: '#A8E6CF',
          50: '#F0FAF5',
          100: '#E1F5EB',
          200: '#C3EBD7',
          300: '#A8E6CF',
          400: '#8DDFC3',
          500: '#72D8B7',
          600: '#57D1AB',
          700: '#3CCA9F',
          800: '#30A57F',
          900: '#24805F',
        },
        // Cream Colors - من components.css
        cream: {
          50: '#FFF9F5',
          100: '#FFF5EE',
          200: '#FFE4E1',
          300: '#FFD4CE',
          400: '#FFC4BB',
          500: '#FFB4A8',
          600: '#FFA495',
          700: '#FF9482',
          800: '#FF846F',
          900: '#FF745C',
        },
        // Energy Colors (للمنتجات)
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
