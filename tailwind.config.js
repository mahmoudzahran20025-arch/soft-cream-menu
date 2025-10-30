/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./js/**/*.js",
    "./styles/**/*.css",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ================================================================
      // 🎨 COLORS - Single Source of Truth (HEX Values)
      // ================================================================
      colors: {
        // Primary Colors (Pink)
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
        // Secondary Color (Purple)
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
        // Accent Color (Mint)
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
        // Cream Colors
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
          mental: '#8b5cf6',
          physical: '#f59e0b',
          balanced: '#10b981',
        }
      },
      
      // ================================================================
      // 🔤 FONTS
      // ================================================================
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
        english: ['Poppins', 'sans-serif'],
      },
      
      // ================================================================
      // 🔢 Z-INDEX
      // ================================================================
      zIndex: {
        'base': 0,
        'content': 10,
        'dropdown': 100,
        'sticky-categories': 200,
        'sticky': 300,
        'header': 500,
        'header-elements': 510,
        'sidebar-overlay': 800,
        'sidebar': 900,
        'modal-overlay': 1000,
        'modal': 1100,
        'toast': 5000,
        'product-hover': 15,
      },
      
      // ================================================================
      // 🎬 ANIMATIONS & KEYFRAMES
      // ================================================================
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'fadeOut': 'fadeOut 0.3s ease-in-out',
        'fadeInUp': 'fadeInUp 0.6s ease-out',
        'slideInLeft': 'slideInLeft 0.4s ease-out',
        'slideInRight': 'slideInRight 0.4s ease-out',
        'slideInLeftSidebar': 'slideInLeftSidebar 0.35s ease',
        'slideInRightSidebar': 'slideInRightSidebar 0.35s ease',
        'fadeInOverlay': 'fadeInOverlay 0.3s ease',
        'bounce-gentle': 'bounce-gentle 2s infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gentlePulse': 'gentlePulse 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'scale-in-modal': 'scaleInModal 0.3s ease-out',
        'skeleton-pulse': 'skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        fadeOut: {
          'from': { opacity: '1' },
          'to': { opacity: '0' },
        },
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          'from': { transform: 'translateX(-100%)' },
          'to': { transform: 'translateX(0)' },
        },
        slideInRight: {
          'from': { transform: 'translateX(100%)' },
          'to': { transform: 'translateX(0)' },
        },
        slideInLeftSidebar: {
          'from': { transform: 'translateX(-100%)' },
          'to': { transform: 'translateX(0)' },
        },
        slideInRightSidebar: {
          'from': { transform: 'translateX(100%)' },
          'to': { transform: 'translateX(0)' },
        },
        fadeInOverlay: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        gentlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'spin-slow': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
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
