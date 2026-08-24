import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { api, getAuthToken, setAuthToken } from './utils/api.js';
import { 
  LayoutDashboard, Package, Building2, Tag, Truck, Map, 
  CalendarClock, Calendar, ShieldCheck, Database, Settings, 
  Search, Bell, ChevronDown, User, Activity, Menu, ChevronLeft, ChevronRight,
  TrendingUp, LogOut, BarChart3, FileSpreadsheet, Home, Lock, RefreshCw,
  Mic, Copy, Plus, Compass as CompassIcon, Radio, Sparkles, MapPin,
  Maximize2, Minimize2, ClipboardList, Check, FileText, ExternalLink
} from 'lucide-react';
import logoImg from './assets/logo.png';

// Import Component & Pages
import NotificationDrawer from './components/NotificationDrawer.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import ThemeTransitionOverlay from './components/ThemeTransitionOverlay.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Checker from './pages/Checker.jsx';
import MasterKantor from './pages/MasterKantor.jsx';
import MasterProduk from './pages/MasterProduk.jsx';
import MasterKendaraan from './pages/MasterKendaraan.jsx';
import MasterRoute from './pages/MasterRoute.jsx';
import TemplateJadwal from './pages/TemplateJadwal.jsx';
import JadwalTransportasi from './pages/JadwalTransportasi.jsx';
import Compass from './pages/Compass.jsx';
import SettingsPage from './pages/Settings.jsx';
import GateMonitoring from './pages/GateMonitoring.jsx';
import JadwalPickup from './pages/JadwalPickup.jsx';
import Transaksi from './pages/Transaksi.jsx';
import RouteJourney from './pages/RouteJourney.jsx';
import EstimasiMilkRun from './pages/EstimasiMilkRun.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login.jsx';
import AnalyticsReport from './pages/AnalyticsReport.jsx';

const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH !== 'false';

function RequireAuth({ children, currentUser, requiredRole }) {
  if (DISABLE_AUTH) {
    return children;
  }

  const token = getAuthToken();
  if (!token || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const [activeConnection, setActiveConnection] = useState(null);
  const [refreshStatsTrigger, setRefreshStatsTrigger] = useState(0);
  const [searchVal, setSearchVal] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const categoryMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

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

  useEffect(() => {
    setIsCategoryMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ipos5_user') || localStorage.getItem('ipos5_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const defaultUser = { username: 'liam', name: 'Liam Brooks', role: 'SUPER_ADMIN', nip: '994051101', branch: 'Shop Owner' };
    try {
      sessionStorage.setItem('ipos5_user', JSON.stringify(defaultUser));
      if (!getAuthToken()) setAuthToken('default_ipos5_session_token');
    } catch (e) {}
    return defaultUser;
  });

  useEffect(() => {
    const token = getAuthToken();
    if (token && !currentUser) {
      api.getMe()
        .then(res => {
          if (res.success && res.data?.user) {
            setCurrentUser(res.data.user);
            sessionStorage.setItem('ipos5_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {});
    }

    const handleUserUpdate = () => {
      const saved = sessionStorage.getItem('ipos5_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    };
    window.addEventListener('ipos5_user_updated', handleUserUpdate);
    return () => window.removeEventListener('ipos5_user_updated', handleUserUpdate);
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    setAuthToken('');
    sessionStorage.removeItem('ipos5_user');
    localStorage.removeItem('ipos5_user');
    sessionStorage.removeItem('ipos5_jwt_token');
    localStorage.removeItem('ipos5_jwt_token');
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (getAuthToken()) {
      api.getActiveConnection()
        .then((res) => {
          if (res.success) {
            setActiveConnection(res.data);
          }
        })
        .catch(() => {});
    }
  }, [location.pathname]);

  const handleConnectionSwitch = async () => {
    try {
      const res = await api.getActiveConnection();
      if (res.success) {
        setActiveConnection(res.data);
      }
      setRefreshStatsTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to refresh active connection state:', error);
    }
  };

  const handleDisconnect = () => {
    setActiveConnection(null);
    setRefreshStatsTrigger((prev) => prev + 1);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/checker?code=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const isLinkActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getPageCategory = () => {
    const p = location.pathname;
    if (p === '/') return 'Analytics';
    if (p.startsWith('/checker')) return 'Tracking';
    if (p.startsWith('/estimasi') || p.startsWith('/route-journey')) return 'Routing';
    if (p.startsWith('/kendaraan')) return 'Fleet';
    if (p.startsWith('/kantor')) return 'Offices';
    if (p.startsWith('/route')) return 'Routes';
    if (p.startsWith('/transit-monitoring')) return 'Monitoring';
    if (p.startsWith('/analytics')) return 'Analytics';
    if (p.startsWith('/compass')) return 'Database';
    if (p.startsWith('/settings')) return 'Settings';
    return 'Analytics';
  };

  const isSuperAdmin = DISABLE_AUTH || currentUser?.role === 'SUPER_ADMIN';

  if (location.pathname === '/login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="spatial-environment">
      
      {/* ── 1. MODERN PILL NAVIGATION BAR (MATCHING REFERENCE IMAGE) ── */}
      <header className="spatial-top-bar" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)' }}>
        
        {/* Left: IPOS5 Brand & Official Logo + Module Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }} ref={categoryMenuRef}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <img 
                src={logoImg} 
                alt="IPOS5 Logo" 
                style={{ width: 22, height: 22, objectFit: 'contain' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ 
                fontSize: 18, 
                fontWeight: 900, 
                color: '#0b2e8a', 
                letterSpacing: '-0.02em',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                lineHeight: 1.1
              }}>
                IPOS<span style={{ color: '#ea580c' }}>5</span>
              </span>
            </div>
          </Link>
          <button 
            type="button"
            onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
            style={{ 
              background: isCategoryMenuOpen ? '#f1f5f9' : 'transparent', 
              border: 'none', 
              borderRadius: 6,
              cursor: 'pointer', 
              padding: '4px 6px', 
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Pilih Modul Navigasi"
          >
            <ChevronDown size={14} style={{ transform: isCategoryMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Module Selector Dropdown */}
          {isCategoryMenuOpen && (
            <div
              className="spatial-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                left: 0,
                width: 260,
                borderRadius: 14,
                padding: '8px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-muted)', padding: '4px 8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Modul Operasional
              </div>

              {[
                { to: '/', label: 'Overview & Analytics', icon: LayoutDashboard },
                { to: '/checker', label: 'Tracking & Connote', icon: Package },
                { to: '/transaksi', label: 'Invoices & Transaksi', icon: ClipboardList },
                { to: '/kendaraan', label: 'Armada & Fleet', icon: Truck },
                { to: '/estimasi', label: 'Routing Journey', icon: TrendingUp },
                { to: '/kantor', label: 'Master Kantor Pos', icon: Building2 },
                { to: '/route', label: 'Master Rute & Nopen', icon: MapPin },
                { to: '/transit-monitoring', label: 'Gate & Transit Inbound', icon: ShieldCheck },
                { to: '/jadwal-pickup', label: 'Jadwal Pickup Loket', icon: CalendarClock },
                { to: '/compass', label: 'MongoDB Compass', icon: Database, adminOnly: true },
                { to: '/settings', label: 'Pengaturan Sistem', icon: Settings }
              ].filter(item => !item.adminOnly || isSuperAdmin).map((item) => {
                const IconComponent = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsCategoryMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: active ? 700 : 600,
                      color: active ? 'var(--primary-blue)' : 'var(--text-primary)',
                      background: active ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <IconComponent size={15} color={active ? 'var(--primary-blue)' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Center: Clean Floating Pill Navigation Bar */}
        <nav className="pill-nav-container">
          <Link 
            to="/produk" 
            className={`pill-nav-item ${location.pathname.startsWith('/produk') ? 'active' : ''}`}
            title="Catalog Layanan & Produk POSIND"
          >
            <Package size={14} />
            <span>Catalog</span>
          </Link>

          <Link 
            to="/checker" 
            className={`pill-nav-item ${location.pathname.startsWith('/checker') ? 'active' : ''}`}
            title="Live Package Tracking"
          >
            <Search size={14} />
            <span>Tracking</span>
          </Link>

          <Link 
            to="/transaksi" 
            className={`pill-nav-item ${location.pathname.startsWith('/transaksi') ? 'active' : ''}`}
            title="Invoices & Transaksi Resi"
          >
            <FileText size={14} />
            <span>Invoices</span>
          </Link>

          <Link 
            to="/" 
            className={`pill-nav-item ${location.pathname === '/' || location.pathname.startsWith('/analytics') ? 'active' : ''}`}
            title="Executive Analytics"
          >
            <BarChart3 size={14} />
            <span>Analytics</span>
          </Link>
        </nav>

        {/* Right: Quick Actions & User Profile Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          
          {/* Theme Toggle (Light / Dark Mode with Wave & Particles) */}
          <ThemeToggle />

          {/* Refresh / Sync Button */}
          <button
            type="button"
            onClick={() => setRefreshStatsTrigger(prev => prev + 1)}
            className="capsule-btn-circle"
            title="Refresh Real-time Data"
            style={{ width: 34, height: 34 }}
          >
            <RefreshCw size={14} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="capsule-btn-circle"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            style={{ width: 34, height: 34 }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Notification Bell */}
          <NotificationDrawer />

          {/* User Profile Capsule (Liam Brooks / Shop Owner Reference) */}
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
                  background: 'linear-gradient(135deg, #0b2e8a, #0284c7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#fff',
                  overflow: 'hidden'
                }}
              >
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'LB'
                )}
              </div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.1 }}>
                  {currentUser?.name || 'Liam Brooks'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {currentUser?.branch || 'Shop Owner'}
                </span>
              </div>
              <ChevronDown size={13} color="var(--text-muted)" style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                className="spatial-card"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 200,
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
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{currentUser?.name || 'Liam Brooks'}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{currentUser?.email || 'liam.brooks@posindonesia.co.id'}</div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="btn-ghost"
                  style={{
                    padding: '8px 10px',
                    fontSize: 11.5,
                    border: 'none',
                    borderRadius: 8,
                    justifyContent: 'flex-start'
                  }}
                >
                  <User size={13} />
                  <span>Profil Akun</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="btn-ghost"
                  style={{
                    padding: '8px 10px',
                    fontSize: 11.5,
                    border: 'none',
                    borderRadius: 8,
                    justifyContent: 'flex-start'
                  }}
                >
                  <Settings size={13} />
                  <span>Pengaturan</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-ghost"
                  style={{
                    padding: '8px 10px',
                    fontSize: 11.5,
                    border: 'none',
                    borderRadius: 8,
                    color: '#f43f5e',
                    justifyContent: 'flex-start'
                  }}
                >
                  <LogOut size={13} />
                  <span>Keluar Akun</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── 2. MAIN WORKSPACE VIEWPORT ── */}
      <div className="spatial-viewport">

        {/* ── 3. MAIN WORKSPACE CANVAS ── */}
        <main className="spatial-workspace">

          {/* Routes Viewport */}
          <div style={{ minHeight: 'calc(100vh - 180px)' }}>
            <Routes>
              <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
              <Route path="/" element={<RequireAuth currentUser={currentUser}><Dashboard activeConnection={activeConnection} refreshStatsTrigger={refreshStatsTrigger} /></RequireAuth>} />
              <Route path="/checker" element={<RequireAuth currentUser={currentUser}><Checker activeConnection={activeConnection} /></RequireAuth>} />
              <Route path="/kantor" element={<RequireAuth currentUser={currentUser}><MasterKantor /></RequireAuth>} />
              <Route path="/produk" element={<RequireAuth currentUser={currentUser}><MasterProduk /></RequireAuth>} />
              <Route path="/kendaraan" element={<RequireAuth currentUser={currentUser}><MasterKendaraan /></RequireAuth>} />
              <Route path="/route" element={<RequireAuth currentUser={currentUser}><MasterRoute /></RequireAuth>} />
              <Route path="/template" element={<RequireAuth currentUser={currentUser}><TemplateJadwal /></RequireAuth>} />
              <Route path="/jadwal" element={<RequireAuth currentUser={currentUser}><JadwalTransportasi /></RequireAuth>} />
              <Route path="/jadwal-pickup" element={<RequireAuth currentUser={currentUser}><JadwalPickup /></RequireAuth>} />
              <Route path="/route-journey" element={<RequireAuth currentUser={currentUser}><RouteJourney /></RequireAuth>} />
              <Route path="/estimasi" element={<RequireAuth currentUser={currentUser}><EstimasiMilkRun /></RequireAuth>} />
              <Route path="/transit-monitoring" element={<RequireAuth currentUser={currentUser}><GateMonitoring /></RequireAuth>} />
              <Route path="/transaksi" element={<RequireAuth currentUser={currentUser}><Transaksi /></RequireAuth>} />
              <Route path="/analytics" element={<RequireAuth currentUser={currentUser}><AnalyticsReport /></RequireAuth>} />
              <Route path="/compass" element={<RequireAuth currentUser={currentUser} requiredRole="SUPER_ADMIN"><Compass activeConnection={activeConnection} /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth currentUser={currentUser} requiredRole="SUPER_ADMIN"><SettingsPage activeConnection={activeConnection} onConnectionSwitch={handleConnectionSwitch} onDisconnect={handleDisconnect} /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth currentUser={currentUser}><Profile /></RequireAuth>} />
            </Routes>
          </div>
        </main>

      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ThemeTransitionOverlay />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
