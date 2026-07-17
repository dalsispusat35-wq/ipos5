import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { api } from './utils/api.js';
import { 
  Building, Box, Truck, Map, Calendar, Settings, 
  Database, Activity, Route as RouteIcon, LayoutDashboard, Menu, ShieldCheck, ShieldAlert,
  ChevronLeft, ChevronRight, Sun, Moon, Clock, ClipboardList
} from 'lucide-react';
import './App.css';
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

function AppContent() {
  const location = useLocation();
  const [activeConnection, setActiveConnection] = useState(null);
  const [refreshStatsTrigger, setRefreshStatsTrigger] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const fetchActiveConnection = async () => {
    try {
      const res = await api.getActiveConnection();
      if (res.success && res.data && res.connected) {
        setActiveConnection(res.data);
      } else {
        setActiveConnection(null);
      }
    } catch (e) {
      console.error('Error fetching active connection:', e);
      setActiveConnection(null);
    }
  };

  useEffect(() => {
    fetchActiveConnection();
  }, []);

  const handleConnectionSwitch = (newConn) => {
    setActiveConnection(newConn);
    setRefreshStatsTrigger(prev => prev + 1);
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnectDb();
      setActiveConnection(null);
    } catch (e) {
      console.error('Error disconnecting:', e);
      setActiveConnection(null);
    }
  };

  // Helper to check active route
  const isLinkActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-container">
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${mobileMenuOpen ? 'visible' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      ></div>

      {/* Sidebar Layout */}
      <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header" style={{ justifyContent: isCollapsed ? 'center' : 'space-between', padding: isCollapsed ? '20px 0' : '20px 20px 16px' }}>
          {!isCollapsed ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="logo-icon-wrap" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
                  <img src={logoImg} alt="IPOS5 Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <div className="logo-text">IPOS5 ROUTING</div>
                  <div className="logo-sub">Pos Indonesia</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button 
                  onClick={toggleSidebar}
                  className="sidebar-toggle-btn"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: 'var(--radius-sm)' }}
                  className="show-mobile"
                  title="Close Sidebar"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            </>
          ) : (
            <button 
              onClick={toggleSidebar}
              className="sidebar-toggle-btn"
              title="Expand Sidebar"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Database Status Indicator inside sidebar */}
        <div className="connection-pill">
          <span 
            className="connection-dot" 
            style={{ 
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: activeConnection ? activeConnection.color || 'var(--accent-green)' : 'var(--accent-red)',
              boxShadow: activeConnection ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
            }}
          ></span>
          <span className="connection-name" style={{ fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeConnection ? activeConnection.name : 'DB Disconnected'}
          </span>
        </div>

        <nav className="sidebar-menu">
          <Link to="/" className={`menu-item ${isLinkActive('/') ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          
          <Link to="/checker" className={`menu-item ${isLinkActive('/checker') ? 'active' : ''}`}>
            <RouteIcon size={18} />
            <span>Routing Checker</span>
          </Link>

          <div className="menu-section-label" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', padding: '12px 16px 6px 16px' }}>Master Data</div>

          <Link to="/kantor" className={`menu-item ${isLinkActive('/kantor') ? 'active' : ''}`}>
            <Building size={18} />
            <span>Master Kantor</span>
          </Link>

          <Link to="/produk" className={`menu-item ${isLinkActive('/produk') ? 'active' : ''}`}>
            <Box size={18} />
            <span>Master Produk</span>
          </Link>

          <Link to="/kendaraan" className={`menu-item ${isLinkActive('/kendaraan') ? 'active' : ''}`}>
            <Truck size={18} />
            <span>Master Kendaraan</span>
          </Link>

          <Link to="/route" className={`menu-item ${isLinkActive('/route') ? 'active' : ''}`}>
            <Map size={18} />
            <span>Master Route</span>
          </Link>

          <div className="menu-section-label" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', padding: '12px 16px 6px 16px' }}>Penjadwalan</div>

          <Link to="/template" className={`menu-item ${isLinkActive('/template') ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Template Jadwal</span>
          </Link>

          <Link to="/jadwal" className={`menu-item ${isLinkActive('/jadwal') ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Jadwal Transportasi</span>
          </Link>

          <Link to="/jadwal-pickup" className={`menu-item ${isLinkActive('/jadwal-pickup') ? 'active' : ''}`}>
            <Clock size={18} />
            <span>Jadwal Pick Up SPP</span>
          </Link>

          <div className="menu-section-label" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', padding: '12px 16px 6px 16px' }}>Operasional</div>

          <Link to="/transit-monitoring" className={`menu-item ${isLinkActive('/transit-monitoring') ? 'active' : ''}`}>
            <Activity size={18} />
            <span>Transit & Gate</span>
          </Link>

          <Link to="/transaksi" className={`menu-item ${isLinkActive('/transaksi') ? 'active' : ''}`}>
            <ClipboardList size={18} />
            <span>Data Transaksi</span>
          </Link>

          <div className="menu-section-label" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', padding: '12px 16px 6px 16px' }}>Database</div>

          <Link to="/compass" className={`menu-item ${isLinkActive('/compass') ? 'active' : ''}`}>
            <Database size={18} />
            <span>MongoDB Compass</span>
          </Link>

          <Link to="/settings" className={`menu-item ${isLinkActive('/settings') ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Pengaturan</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div>IPOS5 Routing v2.0</div>
          <div style={{ marginTop: '2px' }}>Redesigned React UI</div>
        </div>
      </aside>

      {/* Main Work Area */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(true)}
              style={{ background: 'var(--light-navy)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={20} />
            </button>
            <div className="topbar-title">
              <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {location.pathname === '/' && 'Dashboard'}
                {location.pathname.startsWith('/checker') && 'Routing Checker'}
                {location.pathname.startsWith('/kantor') && 'Master Kantor'}
                {location.pathname.startsWith('/produk') && 'Master Produk'}
                {location.pathname.startsWith('/kendaraan') && 'Master Kendaraan'}
                {location.pathname.startsWith('/route') && 'Master Route'}
                {location.pathname.startsWith('/template') && 'Template Jadwal'}
                {location.pathname.startsWith('/jadwal') && !location.pathname.startsWith('/jadwal-pickup') && 'Jadwal Transportasi'}
                {location.pathname.startsWith('/jadwal-pickup') && 'Jadwal Pick Up SPP Bandung'}
                {location.pathname.startsWith('/transit-monitoring') && 'Transit & Gate Monitoring'}
                {location.pathname.startsWith('/transaksi') && 'Data Transaksi Paket'}
                {location.pathname.startsWith('/compass') && 'MongoDB Compass Manager'}
                {location.pathname.startsWith('/settings') && 'Pengaturan Koneksi'}
              </h1>
            </div>
          </div>
          <div className="topbar-right">
            <button 
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="theme-toggle-btn"
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition-fast)'
              }}
            >
              {theme === 'dark' ? <Sun size={18} style={{ color: 'var(--accent-yellow)' }} /> : <Moon size={18} style={{ color: 'var(--accent-teal)' }} />}
            </button>
          </div>
        </header>

        <div className="content-body">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  activeConnection={activeConnection} 
                  refreshStatsTrigger={refreshStatsTrigger} 
                />
              } 
            />
            <Route 
              path="/checker" 
              element={<Checker activeConnection={activeConnection} />} 
            />
            <Route path="/kantor" element={<MasterKantor />} />
            <Route path="/produk" element={<MasterProduk />} />
            <Route path="/kendaraan" element={<MasterKendaraan />} />
            <Route path="/route" element={<MasterRoute />} />
            <Route path="/template" element={<TemplateJadwal />} />
            <Route path="/jadwal" element={<JadwalTransportasi />} />
            <Route path="/jadwal-pickup" element={<JadwalPickup />} />
            <Route path="/transit-monitoring" element={<GateMonitoring />} />
            <Route path="/transaksi" element={<Transaksi />} />
            <Route 
              path="/compass" 
              element={<Compass activeConnection={activeConnection} />} 
            />
            <Route 
              path="/settings" 
              element={
                <SettingsPage 
                  activeConnection={activeConnection} 
                  onConnectionSwitch={handleConnectionSwitch}
                  onDisconnect={handleDisconnect}
                />
              } 
            />

          </Routes>
        </div>
      </main>
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
