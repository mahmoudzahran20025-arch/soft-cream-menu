# 🍦 Soft Cream Menu - Smart Ice Cream Ordering System

> A modern, bilingual (Arabic/English) ice cream menu and ordering system with smart nutrition tracking, energy-based filtering, and seamless checkout experience.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://mahmoudzahran20025-arch.github.io/soft-cream-menu/)
[![GitHub Pages](https://img.shields.io/badge/deployed-GitHub%20Pages-blue)](https://github.com/mahmoudzahran20025-arch/soft-cream-menu)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Build & Deployment](#-build--deployment)
- [API Integration](#-api-integration)
- [i18n System](#-i18n-system)
- [UI/UX Highlights](#-uiux-highlights)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Functionality
- 🌐 **Bilingual Support** - Full Arabic/English translation with RTL/LTR support
- 🍨 **Smart Product Catalog** - 15+ ice cream products with detailed nutrition info
- 🔍 **Advanced Filtering** - Filter by category, energy type, and calorie range
- 🛒 **Real-time Cart** - Instant cart updates with quantity management
- 📱 **Mobile-First Design** - Optimized for all screen sizes
- 🎨 **Dark/Light Mode** - Theme switching with persistent preferences

### Smart Nutrition & Energy System
- ⚡ **Energy-Based Filtering** - "Boost Brain", "Fuel Energy", "Calm & Relax"
- 🔥 **Calorie Tracking** - Visual calorie indicators and range filters
- 💧 **Hydration Levels** - Product hydration information
- 📊 **Nutrition Conscious Mode** - Detailed nutritional breakdown

### Checkout & Orders
- 🚚 **Dual Delivery Options** - Branch pickup or home delivery
- 📍 **Location Services** - GPS-based address detection
- 🎫 **Coupon System** - Discount code support
- 📦 **Order Tracking** - Real-time order status updates
- 🏪 **Multi-Branch Support** - Select from 3 branches

### UI/UX Excellence
- 🎠 **Swiper Carousels** - Featured products and marquee messages
- 🎯 **Lazy Loading** - Optimized image loading with placeholders
- 🎭 **Smooth Animations** - Tailwind + custom CSS transitions
- 🔔 **Toast Notifications** - User-friendly feedback system
- 🎨 **Modern Design** - Glassmorphism, gradients, and shadows

---

## 🛠 Tech Stack

### Frontend
- **React 18.3** - Modern React with Hooks
- **Vite 5.4** - Lightning-fast build tool
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **Vanilla JavaScript (ES6+)** - Core app logic
- **Swiper 11** - Touch-enabled carousels
- **Lucide React** - Beautiful icon library

### Backend & API
- **Cloudflare Workers** - Serverless API backend
- **Google Apps Script** - Order management (optional)
- **REST API** - Product catalog and order processing

### Build Tools
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **Custom Build Scripts** - Auto-injection of React builds

### Deployment
- **GitHub Pages** - Static site hosting
- **GitHub Actions** - CI/CD pipeline (optional)

---

## 📁 Project Structure

```
soft-cream-menu/
├── 📂 react-app/              # React Mini-App (Products & Cart)
│   ├── src/
│   │   ├── components/        # ProductCard, FilterBar, EnergyBadge
│   │   ├── context/           # ProductsContext (state management)
│   │   ├── App.jsx            # Main React component
│   │   └── main.jsx           # React entry point
│   ├── inject-build.js        # Auto-inject build files to index.html
│   ├── vite.config.js         # Vite configuration
│   └── package.json           # React dependencies
│
├── 📂 js/                     # Vanilla JS Modules
│   ├── global-functions.js    # 🔧 Main initialization file
│   ├── translations.js        # i18n manager
│   ├── translations-data.js   # Base translations (129 keys)
│   ├── translations-data-additions.js  # Extended translations (60+ keys)
│   ├── api.js                 # API service layer
│   ├── cart.js                # Cart management
│   ├── checkout.js            # Checkout orchestration
│   ├── checkout-core.js       # Checkout logic
│   ├── checkout-delivery.js   # Delivery/pickup logic
│   ├── checkout-ui.js         # Checkout modals
│   ├── checkout-validation.js # Form validation
│   ├── products.js            # Product manager
│   ├── storage.js             # LocalStorage + SessionStorage
│   ├── utils.js               # Utility functions (scroll, toast, etc.)
│   ├── sidebar.js             # Sidebar navigation
│   ├── swiper-featured.js     # Hero carousel
│   ├── swiper-marquee.js      # Marquee messages
│   └── orders-badge.js        # Order count badge
│
├── 📂 dist/                   # Build output
│   └── react-app/
│       └── assets/            # Compiled CSS & JS
│
├── 📂 styles/                 # Source CSS
│   └── components.css         # Tailwind components
│
├── 📂 assets/                 # Static assets
│   └── images/                # Product images
│
├── index.html                 # Main HTML file
├── tailwind.config.js         # Tailwind configuration
├── package.json               # Root dependencies
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 16+ and npm/yarn
- **Git** for version control
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mahmoudzahran20025-arch/soft-cream-menu.git
   cd soft-cream-menu
   ```

2. **Install root dependencies** (Tailwind CLI)
   ```bash
   npm install
   ```

3. **Install React app dependencies**
   ```bash
   cd react-app
   npm install
   cd ..
   ```

4. **Configure API endpoint** (optional)
   - Edit `js/api.js` and set your Cloudflare Worker URL:
   ```javascript
   const API_BASE_URL = 'https://your-worker.workers.dev';
   ```

---

## 💻 Development

### Start Development Server

**Option 1: Live Server (VS Code)**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"
- Visit `http://localhost:5500`

**Option 2: Python HTTP Server**
```bash
python -m http.server 8000
# Visit http://localhost:8000
```

### Watch Tailwind CSS
```bash
npm run watch:css
```

### Develop React App
```bash
cd react-app
npm run dev
# Visit http://localhost:5173
```

### Hot Reload
- Vanilla JS changes: Refresh browser
- React changes: Vite HMR (instant)
- CSS changes: Auto-reload with `watch:css`

---

## 🏗 Build & Deployment

### Build for Production

1. **Build Tailwind CSS**
   ```bash
   npm run build:css
   ```

2. **Build React App** (with auto-injection)
   ```bash
   cd react-app
   npm run build:inject
   ```
   This command:
   - Builds React app with Vite
   - Generates hashed filenames (e.g., `index-BXT1frkt.css`)
   - Auto-injects `<link>` and `<script>` tags into `index.html`

3. **Verify Build**
   - Check `dist/react-app/assets/` for compiled files
   - Confirm `index.html` references correct hashed filenames

### Deploy to GitHub Pages

**Automatic Deployment** (via GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci && npm run build:css
      - run: cd react-app && npm ci && npm run build:inject
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

**Manual Deployment**
```bash
# Build everything
npm run build:css
cd react-app && npm run build:inject && cd ..

# Push to gh-pages branch
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main

# Enable GitHub Pages in repo settings
# Source: main branch / root
```

---

## 🔌 API Integration

### Cloudflare Worker API

**Base URL**: `https://softcream-api.mahmoud-zahran20025.workers.dev`

**Endpoints**:
```javascript
GET  /products          // Fetch all products
GET  /branches          // Fetch branch locations
POST /orders            // Submit new order
GET  /orders/:id        // Track order status
POST /coupons/validate  // Validate coupon code
```

**Example Request**:
```javascript
// Fetch products
const response = await fetch(
  'https://softcream-api.mahmoud-zahran20025.workers.dev?path=/products'
);
const { data } = await response.json();
console.log(data); // Array of 15 products
```

**API Configuration** (`js/api.js`):
```javascript
const api = {
  baseURL: 'https://softcream-api.mahmoud-zahran20025.workers.dev',
  timeout: 30000,
  retries: 3
};
```

### Google Apps Script (Optional)

For order management via Google Sheets:
1. Deploy GAS Web App
2. Update `api.js` with your GAS URL
3. Configure CORS in GAS

---

## 🌐 i18n System

### Translation Architecture

**Files**:
- `js/translations.js` - i18n manager (247 keys)
- `js/translations-data.js` - Base translations (129 keys)
- `js/translations-data-additions.js` - Extended translations (60+ keys)

**Supported Languages**: Arabic (ar), English (en)

**Usage**:
```javascript
// Get translation
const text = window.i18n.t('addToCart'); // "أضف للسلة" or "Add to Cart"

// Change language
window.i18n.setLang('en');

// Listen for changes
window.i18n.on('change', (newLang) => {
  console.log('Language changed to:', newLang);
});
```

**HTML Usage**:
```html
<button data-i18n="addToCart">أضف للسلة</button>
<!-- Auto-updates on language change -->
```

### Adding New Translations

1. Edit `js/translations-data-additions.js`:
   ```javascript
   export const translationsAdditions = {
     "ar": {
       "newKey": "نص عربي"
     },
     "en": {
       "newKey": "English text"
     }
   };
   ```

2. Translations auto-merge on app init (247 total keys)

---

## 🎨 UI/UX Highlights

### Design System
- **Colors**: Soft pastels with vibrant accents
- **Typography**: System fonts with Arabic support
- **Spacing**: Consistent 8px grid
- **Shadows**: Layered depth with glassmorphism

### Animations
- Smooth page transitions (300ms)
- Hover effects on cards
- Skeleton loaders for images
- Toast notifications (slide + fade)

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast mode compatible
- Screen reader friendly

### Performance
- Lazy image loading (IntersectionObserver)
- Code splitting (React + Vanilla)
- Minified CSS/JS (< 500KB total)
- Passive scroll listeners
- RequestAnimationFrame for smooth scrolling

---

## 🗺 Roadmap

### Phase 1: Core Features ✅
- [x] Product catalog with filtering
- [x] Shopping cart functionality
- [x] Checkout flow (pickup/delivery)
- [x] i18n system (Arabic/English)
- [x] Dark/light mode
- [x] Mobile-responsive design

### Phase 2: Enhanced Features 🚧
- [ ] User authentication (Firebase/Auth0)
- [ ] Order history dashboard
- [ ] Loyalty points system
- [ ] Push notifications (PWA)
- [ ] Advanced analytics (GA4)
- [ ] A/B testing framework

### Phase 3: Business Features 📋
- [ ] Admin dashboard
- [ ] Inventory management
- [ ] Real-time order tracking (WebSockets)
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Multi-location support
- [ ] Delivery driver app

### Phase 4: AI & Personalization 🤖
- [ ] AI-powered product recommendations
- [ ] Chatbot support (Arabic/English)
- [ ] Voice ordering (Web Speech API)
- [ ] Personalized nutrition suggestions
- [ ] Predictive inventory

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style
- Use ES6+ features
- Follow existing naming conventions
- Add comments for complex logic
- Test on mobile devices
- Ensure RTL/LTR compatibility

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👤 Author

**Mahmoud Zahran**
- GitHub: [@mahmoudzahran20025-arch](https://github.com/mahmoudzahran20025-arch)
- Repository: [soft-cream-menu](https://github.com/mahmoudzahran20025-arch/soft-cream-menu)

---

## 🙏 Acknowledgments

- **Tailwind CSS** - Utility-first CSS framework
- **React Team** - Modern UI library
- **Swiper** - Touch-enabled carousels
- **Lucide** - Beautiful icon set
- **Cloudflare** - Serverless infrastructure

---

## 📞 Support

For issues, questions, or suggestions:
- Open an [Issue](https://github.com/mahmoudzahran20025-arch/soft-cream-menu/issues)
- Check existing [Documentation](https://github.com/mahmoudzahran20025-arch/soft-cream-menu/wiki)

---

<div align="center">

**Made with ❤️ and 🍦**

[Live Demo](https://mahmoudzahran20025-arch.github.io/soft-cream-menu/) • [Report Bug](https://github.com/mahmoudzahran20025-arch/soft-cream-menu/issues) • [Request Feature](https://github.com/mahmoudzahran20025-arch/soft-cream-menu/issues)

</div>
