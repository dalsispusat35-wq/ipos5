import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from './utils/api.js';
import { 
  LayoutDashboard, Package, Building2, Tag, Truck, Map, 
  CalendarClock, Calendar, ShieldCheck, Database, Settings, 
  Send, Search, Bell, ChevronDown, User, Clock, ClipboardList, Activity, Sun, Moon, Menu
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

function Header({ title }) {
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
        gap: 20,
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
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

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: '#04091a' }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: 232,
          minWidth: 232,
          height: '100vh',
          background: '#060d1f',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                IPOS5
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
                PT Pos Indonesia
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="section-header">Operations</div>
          <Link to="/" className={`nav-item ${isLinkActive('/') ? 'active' : ''}`}>
            <LayoutDashboard size={16} /> <span>Dashboard</span>
          </Link>
          <Link to="/checker" className={`nav-item ${isLinkActive('/checker') ? 'active' : ''}`}>
            <Package size={16} /> <span>Package Tracking</span>
          </Link>
          <Link to="/kantor" className={`nav-item ${isLinkActive('/kantor') ? 'active' : ''}`}>
            <Building2 size={16} /> <span>Post Offices</span>
          </Link>

          <div className="section-header" style={{ marginTop: 12 }}>Master Data</div>
          <Link to="/produk" className={`nav-item ${isLinkActive('/produk') ? 'active' : ''}`}>
            <Tag size={16} /> <span>Products & Services</span>
          </Link>
          <Link to="/kendaraan" className={`nav-item ${isLinkActive('/kendaraan') ? 'active' : ''}`}>
            <Truck size={16} /> <span>Fleet</span>
          </Link>
          <Link to="/route" className={`nav-item ${isLinkActive('/route') ? 'active' : ''}`}>
            <Map size={16} /> <span>Routes</span>
          </Link>

          <div className="section-header" style={{ marginTop: 12 }}>Logistics</div>
          <Link to="/template" className={`nav-item ${isLinkActive('/template') ? 'active' : ''}`}>
            <CalendarClock size={16} /> <span>Schedule Templates</span>
          </Link>
          <Link to="/jadwal" className={`nav-item ${isLinkActive('/jadwal') ? 'active' : ''}`}>
            <Calendar size={16} /> <span>Transport Schedule</span>
          </Link>
          <Link to="/route-journey" className={`nav-item ${isLinkActive('/route-journey') ? 'active' : ''}`}>
            <Activity size={16} /> <span>Milk Run Telemetry</span>
          </Link>
          <Link to="/transit-monitoring" className={`nav-item ${isLinkActive('/transit-monitoring') ? 'active' : ''}`}>
            <ShieldCheck size={16} /> <span>Gate Monitoring</span>
          </Link>

          <div className="section-header" style={{ marginTop: 12 }}>System</div>
          <Link to="/compass" className={`nav-item ${isLinkActive('/compass') ? 'active' : ''}`}>
            <Database size={16} /> <span>Database Viewer</span>
          </Link>
          <Link to="/settings" className={`nav-item ${isLinkActive('/settings') ? 'active' : ''}`}>
            <Settings size={16} /> <span>Settings</span>
          </Link>
          <Link to="/profile" className={`nav-item ${isLinkActive('/profile') ? 'active' : ''}`}>
            <User size={16} /> <span>Profile</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Sari Rahayu
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)' }}>
              Logistics Operator
            </div>
          </div>
        </Link>
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header title={getPageTitle()} />

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
