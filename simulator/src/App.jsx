import { useState, useEffect, useCallback } from 'react';
import { 
  Zap, Radio, Scan, Database, Truck, RefreshCw, ExternalLink, Sparkles, 
  Layers, Package, CheckCircle2, ArrowUpRight, Globe, Info, Activity,
  Sliders, ShieldCheck, Box, Gauge
} from 'lucide-react';
import posLogo from './assets/logo.png';
import { api } from './utils/api.js';
import DatabaseStatusCard from './components/DatabaseStatusCard.jsx';
import BulkInjector from './components/BulkInjector.jsx';
import LiveStreamInjector from './components/LiveStreamInjector.jsx';
import BarcodeScanner from './components/BarcodeScanner.jsx';

const getTodayWib = () => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch (e) {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('BULK'); // 'BULK' | 'STREAM' | 'SCANNER'
  const [selectedDate, setSelectedDate] = useState(getTodayWib());
  const [selectedNopol, setSelectedNopol] = useState('ALL');
  const [stats, setStats] = useState(null);
  const [options, setOptions] = useState({ offices: [], vehicles: [] });
  const [loading, setLoading] = useState(false);
  const [alertBanner, setAlertBanner] = useState('');

  // Fetch live stats from MongoDB
  const fetchStats = useCallback(async (dateToUse) => {
    setLoading(true);
    try {
      const res = await api.getStats(dateToUse || selectedDate);
      if (res && res.success) {
        setStats(res.data);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch offices and vehicles options
  const fetchOptions = useCallback(async () => {
    try {
      const res = await api.getOptions();
      if (res && res.success) {
        setOptions(res.data);
      }
    } catch (e) {
      console.error('Error fetching options:', e);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    fetchStats(selectedDate);
  }, [selectedDate, fetchStats]);

  // Background Auto-Refresh Polling for Simulator (3.5s interval)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.getStats(selectedDate);
        if (res && res.success && res.data) {
          setStats(res.data);
        }
      } catch (e) {
        // silent polling
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Handle Inject Bulk
  const handleInjectBulk = async (payload) => {
    const res = await api.injectBulk(payload);
    await fetchStats(selectedDate);
    setAlertBanner(`Berhasil menyuntikkan ${payload.count} paket baru ke database MongoDB!`);
    setTimeout(() => setAlertBanner(''), 4500);
    return res;
  };

  // Handle Inject Single
  const handleInjectSingle = async (payload) => {
    const res = await api.injectSingle(payload);
    await fetchStats(selectedDate);
    return res;
  };

  // Handle Reset Date
  const handleResetDate = async (dateToReset) => {
    const res = await api.clearDate(dateToReset);
    await fetchStats(dateToReset);
    setAlertBanner(`Seluruh data paket untuk tanggal ${dateToReset} berhasil direset kembali ke 0!`);
    setTimeout(() => setAlertBanner(''), 4500);
    return res;
  };

  return (
    <div className="sim-layout">
      {/* ─── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header className="sim-header">
        <div className="sim-container flex-between flex-wrap gap-14">
          <div className="sim-logo-container">
            <img src={posLogo} alt="Pos Indonesia" className="sim-logo-img" />
            <div className="sim-title-group">
              <div className="flex-align gap-8 flex-wrap">
                <h1 className="sim-title">
                  IPOS5 <span style={{ color: 'var(--primary-blue)', fontSize: 13, fontWeight: 700 }}>LOGISTICS SIMULATOR</span>
                </h1>
                <span className="badge-startup-edition font-mono">v1.0 STARTUP EDITION</span>
              </div>
              <p className="sim-subtitle">
                Aplikasi Simulator Suntik Resi, Live Stream & Barcode Scanner terintegrasi langsung ke MongoDB
              </p>
            </div>
          </div>

          <div className="flex-align gap-10">
            <a
              href="http://localhost:5173/checker"
              target="_blank"
              rel="noreferrer"
              className="btn-launch-mainapp flex-align gap-8"
              title="Buka Aplikasi Utama IPOS5 Package Tracking"
            >
              <ExternalLink size={15} />
              <span>Buka Main App (Port 5173)</span>
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main className="sim-container" style={{ paddingBottom: 60, paddingTop: 20 }}>
        
        {/* Success Alert Banner */}
        {alertBanner && (
          <div className="sim-alert-banner flex-between">
            <div className="flex-align gap-10">
              <CheckCircle2 size={19} className="text-emerald" />
              <span>{alertBanner}</span>
            </div>
            <button className="btn-close-alert" onClick={() => setAlertBanner('')}>×</button>
          </div>
        )}

        {/* 1. Database & Fleet Live Status Card */}
        <DatabaseStatusCard
          stats={stats}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          loading={loading}
          onRefresh={() => fetchStats(selectedDate)}
          onResetDate={handleResetDate}
          selectedNopol={selectedNopol}
          onSelectVehicle={(nopol) => setSelectedNopol(nopol)}
        />

        {/* 2. Interactive Mode Navigation Tabs */}
        <div className="sim-tabs-bar" style={{ marginTop: 24 }}>
          <button
            type="button"
            className={`sim-tab-btn ${activeTab === 'BULK' ? 'active' : ''}`}
            onClick={() => setActiveTab('BULK')}
          >
            <Zap size={17} className={activeTab === 'BULK' ? 'text-orange' : ''} />
            <span>Suntik Resi Massal (Bulk Generator)</span>
          </button>

          <button
            type="button"
            className={`sim-tab-btn ${activeTab === 'STREAM' ? 'active' : ''}`}
            onClick={() => setActiveTab('STREAM')}
          >
            <Radio size={17} className={activeTab === 'STREAM' ? 'text-emerald' : ''} />
            <span>Live Stream Injector (Tiap Detik)</span>
          </button>

          <button
            type="button"
            className={`sim-tab-btn ${activeTab === 'SCANNER' ? 'active' : ''}`}
            onClick={() => setActiveTab('SCANNER')}
          >
            <Scan size={17} className={activeTab === 'SCANNER' ? 'text-purple' : ''} />
            <span>Barcode & QR Scanner</span>
          </button>
        </div>

        {/* 3. Active Tool Component Container */}
        <div style={{ marginTop: 16 }}>
          {activeTab === 'BULK' && (
            <BulkInjector
              options={options}
              selectedDate={selectedDate}
              onInjectBulk={handleInjectBulk}
              selectedNopol={selectedNopol}
              setSelectedNopol={setSelectedNopol}
            />
          )}

          {activeTab === 'STREAM' && (
            <LiveStreamInjector
              selectedDate={selectedDate}
              options={options}
              onInjectSingle={handleInjectSingle}
            />
          )}

          {activeTab === 'SCANNER' && (
            <BarcodeScanner
              options={options}
              selectedDate={selectedDate}
              onInjectSingle={handleInjectSingle}
              selectedNopol={selectedNopol}
            />
          )}
        </div>

        {/* 4. Recent Transactions In MongoDB Live Feed */}
        {stats && stats.recent_injected && stats.recent_injected.length > 0 && (
          <div className="tool-card-container" style={{ marginTop: 24 }}>
            <div className="tool-card-header">
              <div className="flex-between flex-wrap gap-10">
                <div className="flex-align gap-10">
                  <Activity size={19} color="var(--primary-blue)" />
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    10 RESI TERAKHIR YANG TERSIMPAN DI MONGODB ({selectedDate})
                  </h4>
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  Koleksi: <span className="font-mono text-cyan text-bold">transaksi</span> & <span className="font-mono text-cyan text-bold">tracking_events</span>
                </span>
              </div>
            </div>

            <div className="tool-card-body" style={{ padding: 0 }}>
              <div className="injected-table-wrapper">
                <table className="custom-cyber-table">
                  <thead>
                    <tr>
                      <th>Waktu Input</th>
                      <th>Nomor Resi</th>
                      <th>Kantor Pos Asal</th>
                      <th>Armada Truk</th>
                      <th>Berat</th>
                      <th>Layanan</th>
                      <th>Status Tracking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_injected.map((t, idx) => (
                      <tr key={idx}>
                        <td className="font-mono text-dim" style={{ fontSize: 11 }}>
                          {t.created_at ? new Date(t.created_at).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-'}
                        </td>
                        <td className="font-mono text-cyan text-bold">{t.connote_code}</td>
                        <td>{t.origin_name}</td>
                        <td>
                          <span className="badge-nopol-table">{t.vehicle_nopol}</span>
                        </td>
                        <td className="font-mono">{t.weight_kg} kg</td>
                        <td>
                          <span className="badge-service-table">{t.service}</span>
                        </td>
                        <td>
                          <span className="badge badge-orange">{t.state}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="sim-footer">
        <div className="sim-container flex-between flex-wrap gap-12" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
          <div className="flex-align gap-8">
            <span className="footer-dot" />
            <span>IPOS5 Logistics Simulator • Startup Testing Suite</span>
          </div>
          <span className="font-mono" style={{ fontSize: 11 }}>
            Connected to Database: <strong style={{ color: '#38bdf8' }}>ipos5_reporting</strong> (Primary MongoDB)
          </span>
        </div>
      </footer>
    </div>
  );
}
