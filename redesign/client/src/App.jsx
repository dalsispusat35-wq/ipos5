import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from './utils/api.js';
import { 
  LayoutDashboard, Package, Building2, Tag, Truck, Map, 
  CalendarClock, Calendar, ShieldCheck, Database, Settings, 
  Search, Bell, ChevronDown, User, Activity, Menu, ChevronLeft, PanelLeftClose, PanelLeftOpen
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
import Profile from './pages/Profile.jsx';

function Header({ title, sidebarCollapsed, onToggleSidebar }) {
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
        padding: '0 24px',
        gap: 16,
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggleSidebar}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          width: 34,
          height: 34,
          display: 'flex',
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

      <div style={{ flex: '0 0 auto' }}>
        <h1 style={{ fontWeight: 800, fontSize: 16, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
          {title}
        </h1>
      </div>

      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
        Cimahi Main Branch · KPC 40511
      </div>

      {/* Global Quick Search */}
      <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
        <Search
          size={14}
          color="rgba(255,255,255,0.35)"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          className="input-navy"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={handleSearchSubmit}
          placeholder="Quick search connote, post office..."
          style={{ paddingLeft: 34, fontSize: 13 }}
        />
      </div>

      {/* Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
          Thu, 24 Jul 2026
        </div>

        <button
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
          }}
          title="System Notifications"
        >
          <Bell size={15} color="rgba(255,255,255,0.6)" />
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#e8431f',
              border: '1px solid #060d1f',
            }}
          />
        </button>

        {/* User Profile Badge */}
        <Link
          to="/profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 10px 5px 5px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a4080, #0b1830)',
              border: '1.5px solid rgba(232,67,31,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            SR
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Sari R.</span>
          <ChevronDown size={12} color="rgba(255,255,255,0.4)" />
        </Link>
      </div>
    </header>
  );
}

function AppContent() {
  const location = useLocation();
  const [activeConnection, setActiveConnection] = useState(null);
  const [refreshStatsTrigger, setRefreshStatsTrigger] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    if (p.startsWith('/transit-monitoring')) return 'Gate Monitoring';
    if (p.startsWith('/transaksi')) return 'Data Transaksi Paket';
    if (p.startsWith('/compass')) return 'Database Viewer';
    if (p.startsWith('/settings')) return 'Settings';
    if (p.startsWith('/profile')) return 'User Profile';
    return 'IPOS5';
  };

  const sidebarWidth = sidebarCollapsed ? 68 : 232;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: '#04091a' }}>
      {/* Sidebar Navigation */}
      <aside
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
        {/* Sidebar Logo */}
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

        {/* Navigation Sections */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!sidebarCollapsed && <div className="section-header">Operations</div>}
          <Link to="/" title="Dashboard" className={`nav-item ${isLinkActive('/') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <LayoutDashboard size={17} /> {!sidebarCollapsed && <span>Dashboard</span>}
          </Link>
          <Link to="/checker" title="Package Tracking" className={`nav-item ${isLinkActive('/checker') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <Package size={17} /> {!sidebarCollapsed && <span>Package Tracking</span>}
          </Link>
          <Link to="/kantor" title="Post Offices" className={`nav-item ${isLinkActive('/kantor') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <Building2 size={17} /> {!sidebarCollapsed && <span>Post Offices</span>}
          </Link>

          {!sidebarCollapsed && <div className="section-header" style={{ marginTop: 12 }}>Master Data</div>}
          <Link to="/produk" title="Products & Services" className={`nav-item ${isLinkActive('/produk') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <Tag size={17} /> {!sidebarCollapsed && <span>Products & Services</span>}
          </Link>
          <Link to="/kendaraan" title="Fleet" className={`nav-item ${isLinkActive('/kendaraan') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <Truck size={17} /> {!sidebarCollapsed && <span>Fleet</span>}
          </Link>
          <Link to="/route" title="Routes" className={`nav-item ${isLinkActive('/route') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <Map size={17} /> {!sidebarCollapsed && <span>Routes</span>}
          </Link>

          {!sidebarCollapsed && <div className="section-header" style={{ marginTop: 12 }}>Logistics</div>}
          <Link to="/template" title="Schedule Templates" className={`nav-item ${isLinkActive('/template') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <CalendarClock size={17} /> {!sidebarCollapsed && <span>Schedule Templates</span>}
          </Link>
          <Link to="/jadwal" title="Transport Schedule" className={`nav-item ${isLinkActive('/jadwal') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <Calendar size={17} /> {!sidebarCollapsed && <span>Transport Schedule</span>}
          </Link>
          <Link to="/route-journey" title="Milk Run Telemetry" className={`nav-item ${isLinkActive('/route-journey') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <Activity size={17} /> {!sidebarCollapsed && <span>Milk Run Telemetry</span>}
          </Link>
          <Link to="/transit-monitoring" title="Gate Monitoring" className={`nav-item ${isLinkActive('/transit-monitoring') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <ShieldCheck size={17} /> {!sidebarCollapsed && <span>Gate Monitoring</span>}
          </Link>

          {!sidebarCollapsed && <div className="section-header" style={{ marginTop: 12 }}>System</div>}
          <Link to="/compass" title="Database Viewer" className={`nav-item ${isLinkActive('/compass') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <Database size={17} /> {!sidebarCollapsed && <span>Database Viewer</span>}
          </Link>
          <Link to="/settings" title="Settings" className={`nav-item ${isLinkActive('/settings') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <Settings size={17} /> {!sidebarCollapsed && <span>Settings</span>}
          </Link>
          <Link to="/profile" title="Profile" className={`nav-item ${isLinkActive('/profile') ? 'active' : ''}`} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '10px 0' : '9px 12px' }}>
            <User size={17} /> {!sidebarCollapsed && <span>Profile</span>}
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <Link 
          to="/profile"
          title="Sari Rahayu Profile"
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
              border: '2px solid rgba(232,67,31,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            SR
          </div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Sari Rahayu
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)' }}>
                Logistics Operator
              </div>
            </div>
          )}
        </Link>
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header 
          title={getPageTitle()} 
          sidebarCollapsed={sidebarCollapsed} 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

        <main style={{ flex: 1, padding: 24, overflowY: 'auto', background: '#04091a' }}>
          <Routes>
            <Route path="/" element={<Dashboard activeConnection={activeConnection} refreshStatsTrigger={refreshStatsTrigger} />} />
            <Route path="/checker" element={<Checker activeConnection={activeConnection} />} />
            <Route path="/kantor" element={<MasterKantor />} />
            <Route path="/produk" element={<MasterProduk />} />
            <Route path="/kendaraan" element={<MasterKendaraan />} />
            <Route path="/route" element={<MasterRoute />} />
            <Route path="/template" element={<TemplateJadwal />} />
            <Route path="/jadwal" element={<JadwalTransportasi />} />
            <Route path="/jadwal-pickup" element={<JadwalPickup />} />
            <Route path="/route-journey" element={<RouteJourney />} />
            <Route path="/transit-monitoring" element={<GateMonitoring />} />
            <Route path="/transaksi" element={<Transaksi />} />
            <Route path="/compass" element={<Compass activeConnection={activeConnection} />} />
            <Route path="/settings" element={<SettingsPage activeConnection={activeConnection} onConnectionSwitch={handleConnectionSwitch} onDisconnect={handleDisconnect} />} />
            <Route path="/profile" element={<Profile />} />
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
