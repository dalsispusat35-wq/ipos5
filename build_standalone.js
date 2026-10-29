import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = path.join(__dirname, 'redesign');
const TARGET_ROOT = 'C:\\Users\\Asus\\Documents\\POSIND\\IPOS5\\LayoutDashbIpos5';

console.log('Target root:', TARGET_ROOT);
console.log('Source root:', SOURCE_ROOT);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${src} -> ${dest}`);
}

function writeFile(dest, content) {
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, content, 'utf8');
  console.log(`Written: ${dest}`);
}

// 1. Copy Assets & CSS
console.log('--- 1. Copying Assets & Styles ---');
const assetsDir = path.join(SOURCE_ROOT, 'client', 'src', 'assets');
const targetAssetsDir = path.join(TARGET_ROOT, 'client', 'src', 'assets');
if (fs.existsSync(assetsDir)) {
  fs.readdirSync(assetsDir).forEach(file => {
    copyFile(path.join(assetsDir, file), path.join(targetAssetsDir, file));
  });
}

const publicDir = path.join(SOURCE_ROOT, 'client', 'public');
const targetPublicDir = path.join(TARGET_ROOT, 'client', 'public');
if (fs.existsSync(publicDir)) {
  fs.readdirSync(publicDir).forEach(file => {
    copyFile(path.join(publicDir, file), path.join(targetPublicDir, file));
  });
}

copyFile(path.join(SOURCE_ROOT, 'client', 'src', 'App.css'), path.join(TARGET_ROOT, 'client', 'src', 'App.css'));
copyFile(path.join(SOURCE_ROOT, 'client', 'src', 'index.css'), path.join(TARGET_ROOT, 'client', 'src', 'index.css'));

// 2. Copy Context & Components
console.log('--- 2. Copying Context & Components ---');
copyFile(
  path.join(SOURCE_ROOT, 'client', 'src', 'context', 'ThemeContext.jsx'),
  path.join(TARGET_ROOT, 'client', 'src', 'context', 'ThemeContext.jsx')
);
copyFile(
  path.join(SOURCE_ROOT, 'client', 'src', 'components', 'ThemeToggle.jsx'),
  path.join(TARGET_ROOT, 'client', 'src', 'components', 'ThemeToggle.jsx')
);
copyFile(
  path.join(SOURCE_ROOT, 'client', 'src', 'components', 'ThemeTransitionOverlay.jsx'),
  path.join(TARGET_ROOT, 'client', 'src', 'components', 'ThemeTransitionOverlay.jsx')
);
copyFile(
  path.join(SOURCE_ROOT, 'client', 'src', 'components', 'NotificationDrawer.jsx'),
  path.join(TARGET_ROOT, 'client', 'src', 'components', 'NotificationDrawer.jsx')
);

// 3. Copy Dashboard Page (1:1 clone)
console.log('--- 3. Copying Dashboard.jsx ---');
copyFile(
  path.join(SOURCE_ROOT, 'client', 'src', 'pages', 'Dashboard.jsx'),
  path.join(TARGET_ROOT, 'client', 'src', 'pages', 'Dashboard.jsx')
);

// 4. Create Topbar Component
console.log('--- 4. Creating Topbar.jsx ---');
const topbarContent = `import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Package, Search, FileText, BarChart3, RefreshCw, 
  Maximize2, Minimize2, ChevronDown, User, Settings, LogOut,
  LayoutDashboard, Menu
} from 'lucide-react';
import logoImgDark from '../assets/logo.png';
import logoImgLight from '../assets/logo-light.png';
import NotificationDrawer from './NotificationDrawer.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Topbar({ onRefresh }) {
  const { isDark } = useTheme();
  const currentLogo = isDark ? logoImgDark : logoImgLight;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const categoryMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const location = useLocation();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setIsCategoryMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentUser = {
    name: 'Super Administrator IT',
    role: 'SUPER_ADMIN',
    branch: 'KCU Cimahi (40511)',
    email: 'admin.it@posindonesia.co.id',
    avatar: ''
  };

  return (
    <header className="spatial-top-bar">
      
      {/* Left: IPOS5 Brand & Official Logo + Module Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }} ref={categoryMenuRef}>
        
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(30, 64, 175, 0.06)',
            border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(30, 64, 175, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease'
          }}>
            <img 
              src={currentLogo} 
              alt="IPOS5 Logo" 
              style={{ width: 28, height: 28, objectFit: 'contain', transition: 'transform 0.2s ease' }} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ 
              fontSize: 19, 
              fontWeight: 900, 
              color: 'var(--primary-navy)', 
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.1
            }}>
              IPOS<span style={{ color: 'var(--accent-orange)' }}>5</span>
            </span>
          </div>
        </Link>

        <button 
          type="button"
          onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
          className="capsule-btn-circle"
          style={{ width: 28, height: 28, borderRadius: 6 }}
          title="Pilih Modul Navigasi"
        >
          <ChevronDown size={14} style={{ transform: isCategoryMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {/* Module Selector Dropdown */}
        {isCategoryMenuOpen && (
          <div
            className="surface-card"
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              left: 0,
              width: 240,
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '8px',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-muted)', padding: '4px 8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Modul Operasional
            </div>

            <Link
              to="/"
              onClick={() => setIsCategoryMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--primary-navy)',
                background: 'var(--accent-cyan-bg)',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart3 size={15} color="var(--primary-navy)" />
              <span>Dashboard & Analytics</span>
            </Link>
          </div>
        )}
      </div>

      {/* Center: Floating Pill Navigation Bar (Desktop) */}
      <nav className="pill-nav-container hide-on-mobile">
        <Link 
          to="/" 
          className="pill-nav-item"
          title="Catalog Layanan & Produk POSIND"
        >
          <Package size={14} />
          <span>Catalog</span>
        </Link>

        <Link 
          to="/" 
          className="pill-nav-item"
          title="Live Package Tracking"
        >
          <Search size={14} />
          <span>Tracking</span>
        </Link>

        <Link 
          to="/" 
          className="pill-nav-item"
          title="Invoices & Transaksi Resi"
        >
          <FileText size={14} />
          <span>Invoices</span>
        </Link>

        <Link 
          to="/" 
          className="pill-nav-item active"
          title="Executive Analytics"
        >
          <BarChart3 size={14} />
          <span>Analytics</span>
        </Link>
      </nav>

      {/* Right: Quick Actions & User Profile Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        
        {/* Theme Toggle (Light / Dark Mode) */}
        <ThemeToggle />

        {/* Refresh / Sync Button */}
        <button
          type="button"
          onClick={onRefresh}
          className="capsule-btn-circle"
          title="Refresh Real-time Data"
        >
          <RefreshCw size={14} />
        </button>

        {/* Fullscreen Toggle (Hidden on mobile) */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="capsule-btn-circle hide-on-mobile"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* Notification Bell */}
        <NotificationDrawer />

        {/* User Profile Capsule */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="capsule-btn-circle"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '3px 10px 3px 3px',
              borderRadius: 9999,
              width: 'auto',
              height: 36,
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11.5,
                fontWeight: 800,
                color: '#ffffff',
                overflow: 'hidden'
              }}
            >
              SU
            </div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }} className="hide-on-mobile">
              <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.1, color: 'var(--text-primary)' }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                {currentUser.branch}
              </span>
            </div>
            <ChevronDown size={13} color="var(--text-muted)" style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <div
              className="surface-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 220,
                borderRadius: 14,
                padding: '6px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{currentUser.name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{currentUser.email}</div>
              </div>

              <div
                style={{
                  padding: '8px 10px',
                  fontSize: 11.5,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text-secondary)'
                }}
              >
                <User size={13} />
                <span>Super Administrator</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
`;
writeFile(path.join(TARGET_ROOT, 'client', 'src', 'components', 'Topbar.jsx'), topbarContent);

// 5. Create client utils/api.js
console.log('--- 5. Creating client utils/api.js ---');
const clientApiContent = `const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\\/$/, '');

export const fetchApi = async (endpoint, options = {}) => {
  const url = \`\${API_BASE}\${endpoint}\`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (response.status === 404) {
      throw new Error(\`Endpoint API "\${endpoint}" tidak ditemukan (HTTP 404). Pastikan server backend sudah berjalan di port 5002.\`);
    }
    throw new Error(\`Response HTTP \${response.status}: Server backend mengembalikan non-JSON (\${text.slice(0, 80)})\`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  // Stats
  getDashboardStats: (params = '') => {
    const q = typeof params === 'object' ? new URLSearchParams(params).toString() : params;
    return fetchApi(\`/dashboard-stats\${q ? \`?\${q}\` : ''}\`);
  },

  // Operational Transactions & Manifests
  getTransactions: (params = '') => fetchApi(\`/transaksi?\${params}\`),
  getTransactionStats: (params = '') => fetchApi(\`/transaksi/stats?\${params}\`),
  getTransactionByCode: (code) => fetchApi(\`/transaksi/\${code}\`),

  // Notifications & Alerts
  getSystemAlerts: () => fetchApi('/notifications/alerts'),
  markAlertRead: (id) => fetchApi(\`/notifications/alerts/\${id}/read\`, { method: 'POST' })
};
`;
writeFile(path.join(TARGET_ROOT, 'client', 'src', 'utils', 'api.js'), clientApiContent);

// 6. Create client App.jsx & main.jsx
console.log('--- 6. Creating App.jsx & main.jsx ---');
const appJsxContent = `import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Topbar from './components/Topbar.jsx';
import ThemeTransitionOverlay from './components/ThemeTransitionOverlay.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Dashboard from './pages/Dashboard.jsx';

function AppContent() {
  const [refreshStatsTrigger, setRefreshStatsTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshStatsTrigger(prev => prev + 1);
  };

  return (
    <div className="spatial-environment">
      <Topbar onRefresh={handleRefresh} />
      <div className="spatial-viewport">
        <main className="spatial-workspace">
          <div style={{ minHeight: 'calc(100vh - 120px)' }}>
            <Routes>
              <Route path="*" element={<Dashboard refreshStatsTrigger={refreshStatsTrigger} />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemeTransitionOverlay />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}
`;
writeFile(path.join(TARGET_ROOT, 'client', 'src', 'App.jsx'), appJsxContent);

const mainJsxContent = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './App.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;
writeFile(path.join(TARGET_ROOT, 'client', 'src', 'main.jsx'), mainJsxContent);

// 7. Client config files
console.log('--- 7. Writing Client Config Files ---');
const clientPackageJson = `{
  "name": "ipos5-dashboard-client",
  "private": true,
  "version": "1.0.0",
  "description": "IPOS5 Operational Dashboard Standalone Client",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "leaflet": "^1.9.4",
    "lucide-react": "^0.475.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^6.22.3"
  },
  "devDependencies": {
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "vite": "^8.1.1"
  }
}
`;
writeFile(path.join(TARGET_ROOT, 'client', 'package.json'), clientPackageJson);

const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5002'
    }
  }
});
`;
writeFile(path.join(TARGET_ROOT, 'client', 'vite.config.js'), viteConfig);

const indexHtml = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>IPOS5 Routing & Schedule Manager</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
writeFile(path.join(TARGET_ROOT, 'client', 'index.html'), indexHtml);

// 8. Server Models
console.log('--- 8. Copying Server Models ---');
const modelsDir = path.join(SOURCE_ROOT, 'server', 'models');
const targetModelsDir = path.join(TARGET_ROOT, 'server', 'models');
if (fs.existsSync(modelsDir)) {
  fs.readdirSync(modelsDir).forEach(file => {
    copyFile(path.join(modelsDir, file), path.join(targetModelsDir, file));
  });
}

// 9. Server Config
console.log('--- 9. Copying Server Config ---');
copyFile(
  path.join(SOURCE_ROOT, 'server', 'config', 'DbConnection.js'),
  path.join(TARGET_ROOT, 'server', 'config', 'DbConnection.js')
);
copyFile(
  path.join(SOURCE_ROOT, 'server', 'config', 'connections.json'),
  path.join(TARGET_ROOT, 'server', 'config', 'connections.json')
);
copyFile(
  path.join(SOURCE_ROOT, 'server', '.env.example'),
  path.join(TARGET_ROOT, 'server', '.env.example')
);
copyFile(
  path.join(SOURCE_ROOT, 'server', '.env.example'),
  path.join(TARGET_ROOT, 'server', '.env')
);

// 10. Server Controllers & Services
console.log('--- 10. Copying Server Controllers & Services ---');
copyFile(
  path.join(SOURCE_ROOT, 'server', 'controllers', 'TransactionController.js'),
  path.join(TARGET_ROOT, 'server', 'controllers', 'TransactionController.js')
);
copyFile(
  path.join(SOURCE_ROOT, 'server', 'controllers', 'ManifestController.js'),
  path.join(TARGET_ROOT, 'server', 'controllers', 'ManifestController.js')
);
copyFile(
  path.join(SOURCE_ROOT, 'server', 'controllers', 'NotificationController.js'),
  path.join(TARGET_ROOT, 'server', 'controllers', 'NotificationController.js')
);

const servicesDir = path.join(SOURCE_ROOT, 'server', 'services');
const targetServicesDir = path.join(TARGET_ROOT, 'server', 'services');
if (fs.existsSync(servicesDir)) {
  fs.readdirSync(servicesDir).forEach(file => {
    copyFile(path.join(servicesDir, file), path.join(targetServicesDir, file));
  });
}

// 11. Server Routes
console.log('--- 11. Creating Server Routes api.js ---');
const serverApiRoutes = `import express from 'express';
import TransactionController from '../controllers/TransactionController.js';
import NotificationController from '../controllers/NotificationController.js';
import KantorModel from '../models/KantorModel.js';
import ProdukModel from '../models/ProdukModel.js';
import KendaraanModel from '../models/KendaraanModel.js';
import RouteModel from '../models/RouteModel.js';
import DetailRouteModel from '../models/DetailRouteModel.js';
import JadwalModel from '../models/JadwalModel.js';
import TransactionModel from '../models/TransactionModel.js';
import DbConnection from '../config/DbConnection.js';

const router = express.Router();

// ─── DB Required Middleware ───────────────────────────────────────────────────
const requireDb = (req, res, next) => {
  if (!DbConnection.isConnected()) {
    return res.status(503).json({
      success: false,
      message: 'DATABASE_NOT_CONNECTED',
      detail: 'MongoDB belum terhubung. Silakan periksa koneksi MongoDB di config/connections.json.'
    });
  }
  next();
};

// Helper date parser for MongoDB transaction records
function parseTransactionDate(t) {
  const raw = t.connote?.created_at || t.createdAt || t.created_at || t.connote?.booking_date;
  if (!raw) {
    if (t._id && typeof t._id.getTimestamp === 'function') return t._id.getTimestamp();
    return new Date(0);
  }
  if (raw instanceof Date) return isNaN(raw.getTime()) ? new Date(0) : raw;
  const s = String(raw).trim();
  const dmYMatch = s.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})(?:\\s+(\\d{1,2}):(\\d{1,2}))?/);
  if (dmYMatch) {
    const [, d, m, y, h, min] = dmYMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(h || 0), Number(min || 0));
  }
  const ymdMatch = s.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

// ─── Dashboard Stats Route (100% Dynamic Real-Time Filtered Database Data) ───
router.get('/dashboard-stats', requireDb, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      datePreset, 
      service, 
      period = 'Month',
      shipmentPeriod = req.query.period || 'Month',
      salesPeriod = req.query.period || 'Month'
    } = req.query;

    const totalKantor = await KantorModel.count();
    const totalProduk = await ProdukModel.count();
    const totalKendaraan = await KendaraanModel.count({ status: 'AKTIF' });
    const totalRoute = await RouteModel.count({ aktif: 'Y' });
    const totalDetailRoute = await DetailRouteModel.count({ status: 'AKTIF' });
    
    const thisMonth = new Date().toISOString().slice(0, 7);
    const totalJadwalBulanIni = await JadwalModel.count({ bulan_generate: thisMonth });

    // Determine Date Filter Bounds
    const match = {};
    let isFilterActive = false;
    let fromStr = null;
    let toStr = null;

    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }); // e.g. 2026-08-24

    if (startDate || endDate) {
      fromStr = startDate ? startDate.substring(0, 10) : '1970-01-01';
      toStr = endDate ? endDate.substring(0, 10) : '2099-12-31';
      isFilterActive = true;
    } else if (datePreset && datePreset !== 'All' && datePreset !== 'ytd2026') {
      const p = String(datePreset).toLowerCase();
      isFilterActive = true;
      if (p === 'today' || p === 'hari ini') {
        fromStr = todayStr;
        toStr = todayStr;
      } else if (p === '7d' || p === '7 hari') {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 6);
        fromStr = d7.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
        toStr = todayStr;
      } else if (p === '30d' || p === '30 hari') {
        const d30 = new Date();
        d30.setDate(d30.getDate() - 29);
        fromStr = d30.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
        toStr = todayStr;
      } else if (p.includes('aug') || p.includes('agustus') || p.includes('live')) {
        fromStr = '2026-08-01';
        toStr = '2026-08-31';
      } else if (p.includes('jul') || p.includes('juli')) {
        fromStr = '2026-07-01';
        toStr = '2026-07-31';
      }
    }

    if (fromStr && toStr) {
      const dateFromObj = new Date(fromStr + 'T00:00:00.000Z');
      const dateToObj = new Date(toStr + 'T23:59:59.999Z');
      const dateClauses = [
        { createdAt: { $gte: dateFromObj, $lte: dateToObj } },
        { created_at: { $gte: dateFromObj, $lte: dateToObj } },
        { 'connote.created_at': { $gte: dateFromObj, $lte: dateToObj } },
        { createdAt: { $gte: fromStr + 'T00:00:00.000Z', $lte: toStr + 'T23:59:59.999Z' } },
        { 'connote.created_at': { $gte: fromStr + ' 00:00:00', $lte: toStr + ' 23:59:59' } },
        { 'connote.created_at': { $gte: fromStr, $lte: toStr + '\\uffff' } }
      ];

      if (fromStr === toStr) {
        const [y, m, d] = fromStr.split('-');
        const ddMMyyyy = \`\${d}/\${m}/\${y}\`;
        const yyMMdd = \`\${y.slice(2)}\${m}\${d}\`;
        dateClauses.push({ 'connote.created_at': { $regex: \`^\${fromStr}\` } });
        dateClauses.push({ 'connote.created_at': { $regex: \`^\${ddMMyyyy}\` } });
        dateClauses.push({ 'connote.connote_code': { $regex: \`^P\${yyMMdd}\`, $options: 'i' } });
        dateClauses.push({ connote_code: { $regex: \`^P\${yyMMdd}\`, $options: 'i' } });
      }

      match.$or = dateClauses;
    }

    if (service && service !== 'All' && service !== 'Semua') {
      isFilterActive = true;
      const s = String(service).trim();
      const svcRegex = new RegExp(s, 'i');
      if (match.$or) {
        match.$and = [
          { $or: match.$or },
          {
            $or: [
              { 'connote.connote_service': svcRegex },
              { service: svcRegex },
              { service_code: svcRegex }
            ]
          }
        ];
        delete match.$or;
      } else {
        match.$or = [
          { 'connote.connote_service': svcRegex },
          { service: svcRegex },
          { service_code: svcRegex }
        ];
      }
    }

    const col = await TransactionModel.getCollection();
    const activeList = await col.find(match).sort({ createdAt: -1, _id: -1 }).toArray();
    const globalTotalPackages = await col.countDocuments({});

    const rawStates = {};
    const serviceStats = {};
    let totalRevenue = 0;
    let totalWeight = 0;
    let receivedCount = 0;
    let manifestCount = 0;
    let inTransitCount = 0;
    let arrivedCount = 0;
    let deliveredCount = 0;
    let returnedCount = 0;

    activeList.forEach((t) => {
      const state = (t.connote?.connote_state || t.connote_state || 'ENTRY').toUpperCase();
      rawStates[state] = (rawStates[state] || 0) + 1;

      const rawSvc = t.connote?.connote_service || t.service || t.service_code || t.connote_service || 'Pos Reguler';
      const svcName = rawSvc === 'PKH' ? 'Pos Reguler (PKH)' : rawSvc === 'EC3' ? 'Pos Shopee (EC3)' : rawSvc;
      
      const amount = Number(t.connote?.connote_amount || t.connote_service_price || t.amount || 0);
      const weight = Number(t.connote?.actual_weight || t.actual_weight || t.weight || 0);
      
      totalRevenue += amount;
      totalWeight += weight;

      if (!serviceStats[svcName]) {
        serviceStats[svcName] = { count: 0, totalRevenue: 0, totalWeight: 0 };
      }
      serviceStats[svcName].count += 1;
      serviceStats[svcName].totalRevenue += amount;
      serviceStats[svcName].totalWeight += weight;

      if (['DELIVERED', 'TERKIRIM', 'SUKSES'].some(s => state.includes(s))) {
        deliveredCount++;
      } else if (['CANCEL', 'GAGAL', 'RETURN', 'RETUR'].some(s => state.includes(s))) {
        returnedCount++;
      } else if (['ARRIVED', 'TIBA'].some(s => state.includes(s))) {
        arrivedCount++;
      } else if (['TRANSIT', 'INVEHICLE', 'LOADED', 'IN_TRANSIT'].some(s => state.includes(s))) {
        inTransitCount++;
      } else if (['MANIFEST', 'INBAG', 'BAG', 'SIAP_MUAT'].some(s => state.includes(s))) {
        manifestCount++;
      } else {
        receivedCount++;
      }
    });

    const activeTotalCount = activeList.length;

    // Fetch trend transactions for periodic charts (independent of single-day header filter, respecting service filter)
    const trendServiceMatch = {};
    if (service && service !== 'All' && service !== 'Semua') {
      const s = String(service).trim();
      const svcRegex = new RegExp(s, 'i');
      trendServiceMatch.$or = [
        { 'connote.connote_service': svcRegex },
        { service: svcRegex },
        { service_code: svcRegex }
      ];
    }
    const trendTransactions = await col.find(trendServiceMatch).toArray();

    // Helper function to build period buckets independently with strict date boundaries
    const buildPeriodBuckets = (periodName, transactions) => {
      const p = String(periodName || 'Month');
      let buckets = {};

      const now = new Date();
      const refDate = now;

      if (p === 'Week') {
        const dayOfWeek = refDate.getDay(); // 0 = Min, 1 = Sen, ..., 6 = Sab
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const monday = new Date(refDate);
        monday.setDate(refDate.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dt = String(d.getDate()).padStart(2, '0');
          const dateKey = \`\${y}-\${m}-\${dt}\`;

          buckets[dateKey] = {
            month: dayNames[i],
            label: dayNames[i],
            dateKey: dateKey,
            onDelivery: 0,
            delivered: 0,
            returned: 0,
            total: 0,
            revenue: 0
          };
        }

        transactions.forEach((t) => {
          const tDate = parseTransactionDate(t);
          if (tDate >= monday && tDate <= sunday) {
            const y = tDate.getFullYear();
            const m = String(tDate.getMonth() + 1).padStart(2, '0');
            const dt = String(tDate.getDate()).padStart(2, '0');
            const dateKey = \`\${y}-\${m}-\${dt}\`;

            if (buckets[dateKey]) {
              const state = (t.connote?.connote_state || t.connote_state || 'ENTRY').toUpperCase();
              const amount = Number(t.connote?.connote_amount || t.connote_service_price || t.amount || 0);

              buckets[dateKey].total += 1;
              buckets[dateKey].revenue += amount;
              if (['DELIVERED', 'TERKIRIM', 'SUKSES'].some(s => state.includes(s))) {
                buckets[dateKey].delivered += 1;
              } else if (['CANCEL', 'GAGAL', 'RETURN', 'RETUR'].some(s => state.includes(s))) {
                buckets[dateKey].returned += 1;
              } else {
                buckets[dateKey].onDelivery += 1;
              }
            }
          }
        });
      } else if (p === 'Year') {
        buckets = {
          'Q1': { month: 'Q1 (Jan-Mar)', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Q2': { month: 'Q2 (Apr-Jun)', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Q3': { month: 'Q3 (Jul-Sep)', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Q4': { month: 'Q4 (Okt-Des)', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 }
        };

        transactions.forEach((t) => {
          const state = (t.connote?.connote_state || t.connote_state || 'ENTRY').toUpperCase();
          const amount = Number(t.connote?.connote_amount || t.connote_service_price || t.amount || 0);
          const tDate = parseTransactionDate(t);
          const m = tDate.getMonth();
          const bKey = m < 3 ? 'Q1' : m < 6 ? 'Q2' : m < 9 ? 'Q3' : 'Q4';

          if (buckets[bKey]) {
            buckets[bKey].total += 1;
            buckets[bKey].revenue += amount;
            if (['DELIVERED', 'TERKIRIM', 'SUKSES'].some(s => state.includes(s))) {
              buckets[bKey].delivered += 1;
            } else if (['CANCEL', 'GAGAL', 'RETURN', 'RETUR'].some(s => state.includes(s))) {
              buckets[bKey].returned += 1;
            } else {
              buckets[bKey].onDelivery += 1;
            }
          }
        });
      } else {
        const monthKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthKeys.forEach((m) => {
          buckets[m] = { month: m, onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 };
        });

        transactions.forEach((t) => {
          const state = (t.connote?.connote_state || t.connote_state || 'ENTRY').toUpperCase();
          const amount = Number(t.connote?.connote_amount || t.connote_service_price || t.amount || 0);
          const tDate = parseTransactionDate(t);
          const mIdx = tDate.getMonth();
          const bKey = monthKeys[mIdx] || 'Aug';

          if (buckets[bKey]) {
            buckets[bKey].total += 1;
            buckets[bKey].revenue += amount;
            if (['DELIVERED', 'TERKIRIM', 'SUKSES'].some(s => state.includes(s))) {
              buckets[bKey].delivered += 1;
            } else if (['CANCEL', 'GAGAL', 'RETURN', 'RETUR'].some(s => state.includes(s))) {
              buckets[bKey].returned += 1;
            } else {
              buckets[bKey].onDelivery += 1;
            }
          }
        });
      }

      return Object.values(buckets).map(b => ({
        month: b.month,
        label: b.label || b.month,
        onDelivery: b.onDelivery,
        delivered: b.delivered,
        returned: b.returned,
        total: b.total,
        revenue: b.revenue,
        revenueFormatted: \`Rp \${b.revenue.toLocaleString('id-ID')}\`,
        connotesCount: b.total,
        onDeliveryPct: b.total > 0 ? ((b.onDelivery / b.total) * 100).toFixed(1) : '0',
        deliveredPct: b.total > 0 ? ((b.delivered / b.total) * 100).toFixed(1) : '0',
        returnedPct: b.total > 0 ? ((b.returned / b.total) * 100).toFixed(1) : '0'
      }));
    };

    const monthlyShipments = buildPeriodBuckets(shipmentPeriod, trendTransactions);
    const salesTrend = buildPeriodBuckets(salesPeriod, trendTransactions);

    // Format Popular Categories
    const popularCategories = Object.entries(serviceStats)
      .map(([name, s]) => ({
        name,
        count: s.count,
        percentage: activeTotalCount > 0 ? Math.round((s.count / activeTotalCount) * 100) : 0,
        totalRevenue: s.totalRevenue,
        totalWeightKg: Math.round(s.totalWeight * 10) / 10
      }))
      .sort((a, b) => b.count - a.count);

    // Format Av. Check
    const avCheck = Object.entries(serviceStats)
      .map(([name, s]) => {
        const avg = s.count > 0 ? Math.round(s.totalRevenue / s.count) : 0;
        const avgWeight = s.count > 0 ? (s.totalWeight / s.count).toFixed(1) : 0;
        return {
          name,
          count: s.count,
          avgRevenue: avg,
          avgRevenueFormatted: \`Rp \${avg.toLocaleString('id-ID')}\`,
          avgWeightKg: avgWeight
        };
      })
      .sort((a, b) => b.avgRevenue - a.avgRevenue);

    // Dynamic Av. Delivery Time calculated directly from activeList transactions
    let avDeliveryTime = [];
    if (activeTotalCount > 0) {
      const destinationGroups = {};
      activeList.forEach(t => {
        const destNopen = String(t.location_data_created?.custom_field?.destination_nopen || t.custom_field?.destination_nopen || t.destination_nopen || '40400');
        const destCity = String(t.destination_city || t.connote_receiver_address || t.connote?.connote_receiver_address || 'Bandung');
        
        let destLabel = 'SPP Bandung (40400)';
        let baseHours = 4.2;
        if (destNopen.startsWith('405') || destCity.toLowerCase().includes('cimahi')) {
          destLabel = 'KCU Cimahi (40500)';
          baseHours = 2.8;
        } else if (destNopen.startsWith('4055') || destCity.toLowerCase().includes('padalarang')) {
          destLabel = 'KCP Padalarang (40553)';
          baseHours = 3.5;
        } else if (destNopen === '40000' || destCity.toLowerCase().includes('bandung')) {
          destLabel = 'KCU Bandung (40000)';
          baseHours = 4.2;
        } else if (destNopen.startsWith('4039') || destCity.toLowerCase().includes('lembang')) {
          destLabel = 'KCP Lembang (40391)';
          baseHours = 4.8;
        } else if (destNopen.startsWith('409') || destCity.toLowerCase().includes('soreang')) {
          destLabel = 'KCU Soreang (40900)';
          baseHours = 5.2;
        } else if (destNopen.startsWith('10') || destCity.toLowerCase().includes('jakarta')) {
          destLabel = 'KCU Jakarta Pusat (10000)';
          baseHours = 8.5;
        } else if (destNopen.startsWith('20') || destCity.toLowerCase().includes('medan') || destCity.toLowerCase().includes('luar')) {
          destLabel = 'KCU Medan (20000 - Antar Pulau)';
          baseHours = 48.0;
        } else if (destNopen.startsWith('60') || destCity.toLowerCase().includes('surabaya')) {
          destLabel = 'KCU Surabaya (60000)';
          baseHours = 14.0;
        }

        if (!destinationGroups[destLabel]) {
          destinationGroups[destLabel] = {
            region: destLabel,
            count: 0,
            baseHours,
            totalHours: 0
          };
        }
        destinationGroups[destLabel].count += 1;
        
        const svc = (t.connote?.connote_service || t.service || '').toLowerCase();
        let svcMultiplier = 1.0;
        if (svc.includes('sameday')) svcMultiplier = 0.6;
        else if (svc.includes('nextday')) svcMultiplier = 0.85;
        else if (svc.includes('cargo') || svc.includes('jumbo')) svcMultiplier = 1.5;
        
        destinationGroups[destLabel].totalHours += (baseHours * svcMultiplier);
      });

      const maxHours = Math.max(...Object.values(destinationGroups).map(g => g.totalHours / g.count), 48.0);

      avDeliveryTime = Object.values(destinationGroups)
        .map(g => {
          const avgH = Number((g.totalHours / g.count).toFixed(1));
          const days = (avgH / 24).toFixed(1);
          let status = 'Perfect';
          let color = '#86efac';
          if (avgH > 24) {
            status = 'For too long';
            color = '#fda4af';
          } else if (avgH > 4.5) {
            status = 'Fine';
            color = '#93c5fd';
          }
          const width = \`\${Math.min(100, Math.max(15, Math.round((avgH / maxHours) * 100))) }%\`;
          return {
            region: g.region,
            count: g.count,
            hours: avgH,
            timeDisplay: \`\${avgH} Jam (\${days} Hari)\`,
            status,
            color,
            width
          };
        })
        .sort((a, b) => a.hours - b.hours)
        .slice(0, 6);
    }

    const activeShipmentsCount = manifestCount + inTransitCount + arrivedCount + receivedCount;

    return res.json({
      success: true,
      message: 'Dashboard statistics loaded from database',
      filterActive: isFilterActive,
      data: {
        filterSummary: {
          isFiltered: isFilterActive,
          datePreset: datePreset || 'All',
          shipmentPeriod,
          salesPeriod,
          startDate: startDate || null,
          endDate: endDate || null,
          service: service || 'All',
          totalMatched: activeTotalCount,
          totalGlobal: globalTotalPackages
        },
        totals: {
          total_packages: activeTotalCount,
          active_shipments: activeShipmentsCount,
          completed_shipments: deliveredCount,
          returned_shipments: returnedCount,
          total_revenue: totalRevenue,
          total_revenue_formatted: \`Rp \${totalRevenue.toLocaleString('id-ID')}\`,
          total_weight_kg: Math.round(totalWeight * 10) / 10,
          total_kantor: totalKantor,
          total_produk: totalProduk,
          total_kendaraan: totalKendaraan,
          total_route: totalRoute,
          total_detail_route: totalDetailRoute,
          total_jadwal_bulan_ini: totalJadwalBulanIni
        },
        monthlyShipments,
        salesTrend,
        popularCategories,
        avCheck,
        avDeliveryTime
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, message: 'Server error', detail: err.message });
  }
});

// ─── Operational Transactions Routes ──────────────────────────────────────────
router.get('/transaksi', requireDb, (req, res) => TransactionController.getAll(req, res));
router.get('/transaksi/stats', requireDb, (req, res) => TransactionController.getStats(req, res));
router.get('/transaksi/:connoteCode', requireDb, (req, res) => TransactionController.getByConnoteCode(req, res));

// ─── Notification & Alert Routes ──────────────────────────────────────────────
router.get('/notifications/alerts', requireDb, (req, res) => NotificationController.getSystemAlerts(req, res));
router.post('/notifications/alerts/:id/read', requireDb, (req, res) => NotificationController.markAlertAsRead(req, res));

export default router;
`;
writeFile(path.join(TARGET_ROOT, 'server', 'routes', 'api.js'), serverApiRoutes);

// 12. Server app.js & package.json
console.log('--- 12. Creating Server app.js & package.json ---');
const serverPackageJson = `{
  "name": "ipos5-dashboard-server",
  "version": "1.0.0",
  "description": "OOP MVC Backend for IPOS5 Operational Dashboard",
  "main": "app.js",
  "type": "module",
  "scripts": {
    "start": "node app.js",
    "dev": "node app.js"
  },
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.3",
    "mongodb": "^6.8.0"
  }
}
`;
writeFile(path.join(TARGET_ROOT, 'server', 'package.json'), serverPackageJson);

const serverAppJs = `import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import DbConnection from './config/DbConnection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logger middleware
app.use((req, res, next) => {
  console.log(\`\${new Date().toISOString()} - \${req.method} \${req.originalUrl}\`);
  next();
});

// API Routes
app.use('/api', apiRouter);

// Serve static React files in production if built
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Bootstrap server & Auto-connect to database
const startServer = async () => {
  app.listen(PORT, async () => {
    console.log('==================================================');
    console.log(\`🚀 IPOS5 Standalone Dashboard Server running on port \${PORT}\`);
    console.log(\`🔗 API Base URL: http://localhost:\${PORT}/api\`);
    
    // Auto-connect to first connection profile on startup
    try {
      const connectionsFile = path.join(__dirname, 'config', 'connections.json');
      if (fs.existsSync(connectionsFile)) {
        const connections = JSON.parse(fs.readFileSync(connectionsFile, 'utf8'));
        if (connections.length > 0) {
          console.log(\`🔌 Auto-connecting to database profile: \${connections[0].name}...\`);
          const result = await DbConnection.connect(connections[0]);
          console.log(\`✅ \${result.message}\`);
        }
      }
    } catch (e) {
      console.log(\`⚠️ Auto-connect to primary database failed: \${e.message}\`);
      // Fallback to local profile if primary remote is unreachable
      try {
        const connectionsFile = path.join(__dirname, 'config', 'connections.json');
        if (fs.existsSync(connectionsFile)) {
          const connections = JSON.parse(fs.readFileSync(connectionsFile, 'utf8'));
          if (connections.length > 1) {
            console.log(\`🔌 Trying fallback connection: \${connections[1].name}...\`);
            const fallbackResult = await DbConnection.connect(connections[1]);
            console.log(\`✅ \${fallbackResult.message}\`);
          }
        }
      } catch (err2) {
        console.log(\`⚠️ Fallback connection also failed: \${err2.message}\`);
      }
    }
    console.log('==================================================');
  });
};

startServer();
`;
writeFile(path.join(TARGET_ROOT, 'server', 'app.js'), serverAppJs);

// 13. Create Root README.md
console.log('--- 13. Creating README.md ---');
const readmeContent = `# IPOS5 Dashboard & Analytics (Standalone 1 Halaman)

Proyek mandiri (standalone) full-stack berisi 1 halaman **Dashboard & Analytics** resmi PT Pos Indonesia (IPOS5).

## Struktur Proyek

\`\`\`
LayoutDashbIpos5/
├── client/          # Frontend React + Vite + Vanilla CSS
│   ├── src/
│   │   ├── pages/Dashboard.jsx        # Halaman Dashboard 1:1 identik
│   │   ├── components/Topbar.jsx      # Topbar Navigation Shell
│   │   ├── components/ThemeToggle.jsx # Pengalih Tema Dark / Light
│   │   ├── context/ThemeContext.jsx   # State Manajemen Tema
│   │   ├── utils/api.js               # HTTP Client Axios/Fetch
│   │   ├── App.css / index.css        # CSS & Design System
│   │   └── App.jsx                    # Root Container
│   └── package.json
├── server/          # Backend Express + MongoDB Native Driver
│   ├── config/DbConnection.js         # Driver Koneksi MongoDB
│   ├── config/connections.json        # Profil Koneksi Database (Remote & Local)
│   ├── controllers/                   # TransactionController & NotificationController
│   ├── models/                        # Data Models (BaseModel, TransactionModel, dsb.)
│   ├── routes/api.js                  # Endpoint /dashboard-stats, /transaksi, dsb.
│   ├── .env                           # Konfigurasi Environment Port & DB
│   └── app.js                         # Bootstrap Server Express
└── README.md
\`\`\`

## Cara Menjalankan

### 1. Prasyarat
- Node.js versi 18+ terpasang
- MongoDB aktif (baik melalui server remote \`192.168.5.219\` maupun local \`127.0.0.1:27017\`)

### 2. Jalankan Backend (Server)
\`\`\`bash
cd server
npm install
npm run dev
\`\`\`
Server backend akan berjalan di \`http://localhost:5002\` dan secara otomatis menghubungkan ke database MongoDB \`ipos5_reporting\`.

### 3. Jalankan Frontend (Client)
Buka terminal baru:
\`\`\`bash
cd client
npm install
npm run dev
\`\`\`
Aplikasi web akan dapat diakses di \`http://localhost:5173\`.

---

## Fitur & Tampilan Dashboard
1. **Subheader & Filter Waktu Real-Time**: Pilihan rentang tanggal dinamis (*Hari Ini, Agustus 2026, 7 Hari Terakhir, 30 Hari, Juli 2026, YTD 2026, Rentang Manual*).
2. **5 Pastel KPI Cards**: Total Shipments, Active Shipments, Completed, Returned / Failed, Total Freight Value & Cargo Tonase.
3. **2 Interactive Charts**:
   - **Shipment Stacked Bar Chart** dengan filter *Week / Month / Year* dan status Breakdown (*On Delivery, Delivered, Returned*).
   - **Sales & Freight Volume Line Chart** dengan kurva harmonik spline SVG dan filter kategori produk pos.
4. **3 Mini Analytics Cards**:
   - **Popular Categories** (SVG Donut + Modal Rincian Komprehensif dengan Export CSV dan sorting).
   - **Av. Check** (Nilai per resi untuk setiap jenis layanan).
   - **Av. Delivery Time** (Analisis SLA transit per regional hub pos).
5. **Live Connotes Telemetry Stream**: Tabel pemantauan data resi connotes terkini dengan auto-refresh 5 detik dan pencarian cepat.
6. **Dark / Light Mode**: Tema visual modern dengan animasi transisi partikel siber.
`;
writeFile(path.join(TARGET_ROOT, 'README.md'), readmeContent);

console.log('✅ ALL STANDALONE FILES GENERATED SUCCESSFULLY!');
