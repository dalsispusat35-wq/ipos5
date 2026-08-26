import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { api, getAuthToken, setAuthToken } from './utils/api.js';
import { 
  LayoutDashboard, Package, Building2, Tag, Truck, Map, 
  CalendarClock, Calendar, ShieldCheck, Database, Settings, 
  Search, Bell, ChevronDown, User, Activity, Menu, ChevronLeft, ChevronRight,
  TrendingUp, LogOut, BarChart3, FileSpreadsheet, Home, Lock, RefreshCw,
  Mic, Copy, Plus, Compass as CompassIcon, Radio, Sparkles, MapPin,
  Maximize2, Minimize2, ClipboardList, Check, FileText, ExternalLink, X
} from 'lucide-react';
import logoImgDark from './assets/logo.png';
import logoImgLight from './assets/logo-light.png';

// Import Component & Pages
import NotificationDrawer from './components/NotificationDrawer.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import ThemeTransitionOverlay from './components/ThemeTransitionOverlay.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
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
  const { isDark } = useTheme();
  const currentLogo = isDark ? logoImgDark : logoImgLight;
  const [activeConnection, setActiveConnection] = useState(null);
  const [refreshStatsTrigger, setRefreshStatsTrigger] = useState(0);
  const [searchVal, setSearchVal] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
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
    setIsMobileDrawerOpen(false);
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

  const isSuperAdmin = DISABLE_AUTH || currentUser?.role === 'SUPER_ADMIN';

  const navMenuItems = [
    { to: '/', label: 'Overview & Analytics', icon: LayoutDashboard },
    { to: '/checker', label: 'Tracking & Connote', icon: Package },
    { to: '/transaksi', label: 'Invoices & Transaksi', icon: ClipboardList },
    { to: '/kendaraan', label: 'Armada & Fleet', icon: Truck },
    { to: '/estimasi', label: 'Routing Journey', icon: TrendingUp },
    { to: '/kantor', label: 'Master Kantor Pos', icon: Building2 },
    { to: '/route', label: 'Master Rute & Nopen', icon: MapPin },
    { to: '/transit-monitoring', label: 'Gate & Transit Inbound', icon: ShieldCheck },
    { to: '/jadwal-pickup', label: 'Jadwal Pickup Loket', icon: CalendarClock },
    { to: '/jadwal', label: 'Jadwal Transportasi', icon: Calendar },
    { to: '/template', label: 'Template Jadwal', icon: CalendarDaysIcon(Calendar) },
    { to: '/analytics', label: 'Laporan Analitik', icon: BarChart3 },
    { to: '/compass', label: 'MongoDB Compass', icon: Database, adminOnly: true },
    { to: '/settings', label: 'Pengaturan Sistem', icon: Settings }
  ].filter(item => !item.adminOnly || isSuperAdmin);

  function CalendarDaysIcon(FallbackIcon) {
    return FallbackIcon || Calendar;
  }

  if (location.pathname === '/login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="spatial-environment">
      
      {/* ── 1. MODERN PILL NAVIGATION BAR ── */}
      <header className="spatial-top-bar">
        
        {/* Left: IPOS5 Brand & Official Logo + Module Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }} ref={categoryMenuRef}>
          
          {/* Mobile Hamburger Toggle (< 900px) */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="capsule-btn-circle"
            style={{ display: 'none' }}
            id="mobile-nav-toggle"
            title="Buka Menu Navigasi"
          >
            <Menu size={16} />
          </button>

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
                width: 260,
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

              {navMenuItems.map((item) => {
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
                      color: active ? 'var(--primary-navy)' : 'var(--text-primary)',
                      background: active ? 'var(--accent-cyan-bg)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-surface-soft)'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <IconComponent size={15} color={active ? 'var(--primary-navy)' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Center: Floating Pill Navigation Bar (Desktop) */}
        <nav className="pill-nav-container hide-on-mobile">
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          
          {/* Theme Toggle (Light / Dark Mode) */}
          <ThemeToggle />

          {/* Refresh / Sync Button */}
          <button
            type="button"
            onClick={() => setRefreshStatsTrigger(prev => prev + 1)}
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
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'LB'
                )}
              </div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }} className="hide-on-mobile">
                <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.1, color: 'var(--text-primary)' }}>
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
                className="surface-card"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 210,
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
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{currentUser?.name || 'Liam Brooks'}</div>
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
                    justifyContent: 'flex-start',
                    width: '100%'
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
                    justifyContent: 'flex-start',
                    width: '100%'
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
                    color: 'var(--accent-pink)',
                    justifyContent: 'flex-start',
                    width: '100%'
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

      {/* ── MOBILE NAVIGATION DRAWER OVERLAY ── */}
      {isMobileDrawerOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 9999, justifyContent: 'flex-start', padding: 0, alignItems: 'stretch' }}
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div 
            className="surface-card" 
            style={{ 
              width: '85%', 
              maxWidth: 320, 
              height: '100vh', 
              borderRadius: 0, 
              padding: '16px 14px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 12,
              overflowY: 'auto',
              boxShadow: '4px 0 25px rgba(0, 0, 0, 0.4)' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(30, 64, 175, 0.06)',
                  border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(30, 64, 175, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <img src={currentLogo} alt="Logo" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 900, fontSize: 17, color: 'var(--primary-navy)', lineHeight: 1.1 }}>
                    IPOS<span style={{ color: 'var(--accent-orange)' }}>5</span>
                  </span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>LOGISTICS SUITE</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="capsule-btn-circle"
                style={{ width: 32, height: 32 }}
                title="Tutup Menu"
              >
                <X size={15} />
              </button>
            </div>

            {/* User Quick Info Card */}
            <div style={{
              background: 'var(--bg-surface-soft)',
              border: '1px solid var(--border-light)',
              borderRadius: 12,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
                color: '#ffffff',
                flexShrink: 0
              }}>
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'LB'
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser?.name || 'Liam Brooks'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{currentUser?.branch || 'Shop Owner'}</span>
                  <span className="badge-emerald" style={{ fontSize: 8.5, padding: '1px 5px', borderRadius: 4 }}>ONLINE</span>
                </div>
              </div>
            </div>

            {/* Menu Items List */}
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase', padding: '2px 6px 0' }}>
              Daftar Modul Sistem
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
              {navMenuItems.map((item) => {
                const IconComponent = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 10,
                      fontSize: 12.5,
                      fontWeight: active ? 700 : 500,
                      color: active ? 'var(--primary-navy)' : 'var(--text-primary)',
                      background: active ? 'var(--accent-cyan-bg)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <IconComponent size={16} color={active ? 'var(--primary-navy)' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Link
                to="/profile"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="btn-ghost"
                style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: 12, borderRadius: 8, width: '100%' }}
              >
                <User size={14} />
                <span>Profil Akun</span>
              </Link>
              <button
                type="button"
                onClick={() => { setIsMobileDrawerOpen(false); handleLogout(); }}
                className="btn-ghost"
                style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: 12, borderRadius: 8, color: 'var(--accent-pink)', width: '100%' }}
              >
                <LogOut size={14} />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. FLOATING MOBILE BOTTOM NAVIGATION BAR ── */}
      <nav className="mobile-bottom-bar" aria-label="Navigasi Bawah Mobile">
        <Link 
          to="/" 
          className={`mobile-tab-item ${location.pathname === '/' ? 'active' : ''}`}
          title="Dashboard Overview"
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
          {location.pathname === '/' && <span className="mobile-tab-dot" />}
        </Link>

        <Link 
          to="/checker" 
          className={`mobile-tab-item ${location.pathname.startsWith('/checker') ? 'active' : ''}`}
          title="Tracking Connote"
        >
          <Search size={18} />
          <span>Tracking</span>
          {location.pathname.startsWith('/checker') && <span className="mobile-tab-dot" />}
        </Link>

        <Link 
          to="/transaksi" 
          className={`mobile-tab-item ${location.pathname.startsWith('/transaksi') ? 'active' : ''}`}
          title="Invoices & Transaksi"
        >
          <FileText size={18} />
          <span>Invoices</span>
          {location.pathname.startsWith('/transaksi') && <span className="mobile-tab-dot" />}
        </Link>

        <Link 
          to="/kendaraan" 
          className={`mobile-tab-item ${location.pathname.startsWith('/kendaraan') ? 'active' : ''}`}
          title="Fleet Armada"
        >
          <Truck size={18} />
          <span>Armada</span>
          {location.pathname.startsWith('/kendaraan') && <span className="mobile-tab-dot" />}
        </Link>

        <button 
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="mobile-tab-item"
          title="Buka Menu Lainnya"
        >
          <Menu size={18} />
          <span>Menu</span>
        </button>
      </nav>

      {/* ── 3. MAIN WORKSPACE VIEWPORT ── */}
      <div className="spatial-viewport">

        {/* ── 4. MAIN WORKSPACE CANVAS ── */}
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
