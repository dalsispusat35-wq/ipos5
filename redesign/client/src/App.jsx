import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { api, getAuthToken, setAuthToken } from './utils/api.js';
import { 
  LayoutDashboard, Package, Building2, Tag, Truck, Map, 
  CalendarClock, Calendar, ShieldCheck, Database, Settings, 
  Search, Bell, ChevronDown, User, Activity, Menu, ChevronLeft, PanelLeftClose, PanelLeftOpen,
  TrendingUp, LogOut
} from 'lucide-react';
import logoImg from './assets/logo.png';

// Import Pages
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
import EstimasiMilkRun from './pages/estimasi/index.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login.jsx';

function Header({ title, sidebarCollapsed, onToggleSidebar, onToggleMobileMenu, currentUser, onLogout }) {
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/checker?code=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header
      style={{
        height: 60,
        background: 'rgba(6,13,31,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      <button
        className="mobile-only"
        onClick={onToggleMobileMenu}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          flexShrink: 0,
        }}
        title="Toggle Mobile Menu"
      >
        <Menu size={20} />
      </button>

      <button
        className="desktop-only"
        onClick={onToggleSidebar}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          width: 34,
          height: 34,
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.8)',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        title={sidebarCollapsed ? 'Expand Sidebar' : 'Hide Sidebar'}
      >
        {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
      </button>

      <div style={{ flex: '0 1 auto', minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </h1>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <Search size={14} color="rgba(255,255,255,0.35)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input-navy"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleSearchSubmit}
            placeholder="Cari connote resi (misal: P2607150025574)..."
            style={{ width: '100%', paddingLeft: 34, paddingRight: 12, height: 34, fontSize: 12.5 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#48cae4' }}>{currentUser.name}</span>
            <span style={{ fontSize: 10, background: 'rgba(72,202,228,0.15)', color: '#48cae4', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
              {currentUser.role}
            </span>
          </div>
        )}

        <button
          onClick={onLogout}
          title="Logout"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 8,
            padding: '6px 10px',
            color: '#fca5a5',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <LogOut size={14} /> <span className="desktop-only">Logout</span>
        </button>
      </div>
    </header>
  );
}

const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === 'true';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('ipos5_user');
    if (saved) return JSON.parse(saved);
    if (DISABLE_AUTH) return { username: 'sari', name: 'Sari Rahayu', role: 'SUPER_ADMIN' };
    return null;
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
        .catch(() => {
          setAuthToken('');
          sessionStorage.removeItem('ipos5_user');
          setCurrentUser(null);
        });
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
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

  const isLinkActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/') return 'Dashboard';
    if (p.startsWith('/checker')) return 'Package Tracking';
    if (p.startsWith('/kantor')) return 'Post Offices';
    if (p.startsWith('/produk')) return 'Products & Services';
    if (p.startsWith('/kendaraan')) return 'Fleet Management';
    if (p.startsWith('/route') && !p.startsWith('/route-journey')) return 'Routes';
    if (p.startsWith('/template')) return 'Schedule Templates';
    if (p.startsWith('/jadwal') && !p.startsWith('/jadwal-pickup')) return 'Transport Schedule';
    if (p.startsWith('/jadwal-pickup')) return 'Jadwal Pick Up SPP';
    if (p.startsWith('/route-journey')) return 'Milk Run Logistics Telemetry';
    if (p.startsWith('/estimasi')) return 'Estimasi Milk Run Logistik';
    if (p.startsWith('/transit-monitoring')) return 'Gate Monitoring';
    if (p.startsWith('/transaksi')) return 'Data Transaksi Paket';
    if (p.startsWith('/compass')) return 'Database Viewer';
    if (p.startsWith('/settings')) return 'Settings';
    if (p.startsWith('/profile')) return 'User Profile';
    return 'IPOS5';
  };

  const sidebarWidth = sidebarCollapsed ? 68 : 232;
  const isSuperAdmin = DISABLE_AUTH || currentUser?.role === 'SUPER_ADMIN';

  const renderNavLinks = (isMobile = false) => (
    <>
      {(!sidebarCollapsed || isMobile) && <div className="section-header">Operations</div>}
      <Link to="/" title="Dashboard" className={`nav-item ${isLinkActive('/') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <LayoutDashboard size={17} /> {(!sidebarCollapsed || isMobile) && <span>Dashboard</span>}
      </Link>
      <Link to="/checker" title="Package Tracking" className={`nav-item ${isLinkActive('/checker') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <Package size={17} /> {(!sidebarCollapsed || isMobile) && <span>Package Tracking</span>}
      </Link>
      <Link to="/kantor" title="Post Offices" className={`nav-item ${isLinkActive('/kantor') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <Building2 size={17} /> {(!sidebarCollapsed || isMobile) && <span>Post Offices</span>}
      </Link>

      {(!sidebarCollapsed || isMobile) && <div className="section-header" style={{ marginTop: 12 }}>Master Data</div>}
      <Link to="/produk" title="Products & Services" className={`nav-item ${isLinkActive('/produk') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <Tag size={17} /> {(!sidebarCollapsed || isMobile) && <span>Products & Services</span>}
      </Link>
      <Link to="/kendaraan" title="Fleet" className={`nav-item ${isLinkActive('/kendaraan') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <Truck size={17} /> {(!sidebarCollapsed || isMobile) && <span>Fleet</span>}
      </Link>
      <Link to="/route" title="Routes" className={`nav-item ${isLinkActive('/route') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <Map size={17} /> {(!sidebarCollapsed || isMobile) && <span>Routes</span>}
      </Link>

      {(!sidebarCollapsed || isMobile) && <div className="section-header" style={{ marginTop: 12 }}>Logistics</div>}
      <Link to="/template" title="Schedule Templates" className={`nav-item ${isLinkActive('/template') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <CalendarClock size={17} /> {(!sidebarCollapsed || isMobile) && <span>Schedule Templates</span>}
      </Link>
      <Link to="/jadwal" title="Transport Schedule" className={`nav-item ${isLinkActive('/jadwal') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <Calendar size={17} /> {(!sidebarCollapsed || isMobile) && <span>Transport Schedule</span>}
      </Link>
      <Link to="/route-journey" title="Milk Run Telemetry" className={`nav-item ${isLinkActive('/route-journey') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <Activity size={17} /> {(!sidebarCollapsed || isMobile) && <span>Milk Run Telemetry</span>}
      </Link>
      <Link to="/estimasi" title="Estimasi Milk Run" className={`nav-item ${isLinkActive('/estimasi') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <TrendingUp size={17} /> {(!sidebarCollapsed || isMobile) && <span>Estimasi Milk Run</span>}
      </Link>
      <Link to="/transit-monitoring" title="Gate Monitoring" className={`nav-item ${isLinkActive('/transit-monitoring') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <ShieldCheck size={17} /> {(!sidebarCollapsed || isMobile) && <span>Gate Monitoring</span>}
      </Link>

      {/* Restricted System Modules: Only visible to SUPER_ADMIN */}
      {isSuperAdmin && (
        <>
          {(!sidebarCollapsed || isMobile) && <div className="section-header" style={{ marginTop: 12 }}>System (Restricted)</div>}
          <Link to="/compass" title="Database Viewer" className={`nav-item ${isLinkActive('/compass') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
            <Database size={17} /> {(!sidebarCollapsed || isMobile) && <span>Database Viewer</span>}
          </Link>
          <Link to="/settings" title="Settings" className={`nav-item ${isLinkActive('/settings') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
            <Settings size={17} /> {(!sidebarCollapsed || isMobile) && <span>Settings</span>}
          </Link>
        </>
      )}

      {(!sidebarCollapsed || isMobile) && <div className="section-header" style={{ marginTop: 12 }}>Account</div>}
      <Link to="/profile" title="Profile" className={`nav-item ${isLinkActive('/profile') ? 'active' : ''}`} style={{ justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', padding: (sidebarCollapsed && !isMobile) ? '10px 0' : '9px 12px' }}>
        <User size={17} /> {(!sidebarCollapsed || isMobile) && <span>Profile</span>}
      </Link>
    </>
  );

  if (location.pathname === '/login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: '#04091a' }}>
      <div 
        className={`mobile-drawer-overlay ${mobileMenuOpen ? 'active' : ''}`} 
        onClick={() => setMobileMenuOpen(false)} 
      />

      <aside className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logoImg} alt="IPOS5 Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                IPOS5
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
                PT Pos Indonesia
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderNavLinks(true)}
        </nav>

        <Link 
          to="/profile"
          style={{
            padding: '14px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a4080, #0b1830)',
              border: '2px solid rgba(72,202,228,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.name || 'User Sesi'}
            </div>
            <div style={{ fontSize: 10.5, color: '#48cae4' }}>
              {currentUser?.role || 'Operator'}
            </div>
          </div>
        </Link>
      </aside>

      <aside
        className="desktop-only"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: '100vh',
          background: '#060d1f',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ padding: sidebarCollapsed ? '16px 12px' : '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <img src={logoImg} alt="IPOS5 Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                    IPOS5
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
                    PT Pos Indonesia
                  </div>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Collapse Sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderNavLinks(false)}
        </nav>

        <Link 
          to="/profile"
          title={`${currentUser?.name || 'User'} Profile`}
          style={{
            padding: sidebarCollapsed ? '14px 0' : '14px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a4080, #0b1830)',
              border: '2px solid rgba(72,202,228,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.name || 'User Sesi'}
              </div>
              <div style={{ fontSize: 10.5, color: '#48cae4' }}>
                {currentUser?.role || 'Operator'}
              </div>
            </div>
          )}
        </Link>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header 
          title={getPageTitle()} 
          sidebarCollapsed={sidebarCollapsed} 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main style={{ flex: 1, padding: 16, overflowY: 'auto', background: '#04091a' }}>
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
            <Route path="/compass" element={<RequireAuth currentUser={currentUser} requiredRole="SUPER_ADMIN"><Compass activeConnection={activeConnection} /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth currentUser={currentUser} requiredRole="SUPER_ADMIN"><SettingsPage activeConnection={activeConnection} onConnectionSwitch={handleConnectionSwitch} onDisconnect={handleDisconnect} /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth currentUser={currentUser}><Profile /></RequireAuth>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
