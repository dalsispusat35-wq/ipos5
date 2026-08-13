import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, CheckCircle2, Circle, Clock, Package, Truck, Navigation, 
  Copy, Check, RefreshCw, ShieldCheck, Zap, X, Filter, Eye,
  CalendarDays, ArrowRight, Layers, FileSpreadsheet,
  AlertCircle, AlertTriangle, ChevronDown, ChevronRight, User, Building2, Weight,
  Car, TrendingUp, Activity, BoxIcon, Timer, AlertOctagon, Info, ArrowUpRight
} from 'lucide-react';
import { api } from '../utils/api.js';
import LiveGpsMapModal from '../components/LiveGpsMapModal.jsx';
import CsvImportModal from '../components/CsvImportModal.jsx';

export default function Checker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('code') || '');
  const [result, setResult] = useState(null);
  const [controlTower, setControlTower] = useState(null);
  const [loading, setLoading] = useState(false);
  const [controlTowerLoading, setControlTowerLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Dynamic Operational Date in Asia/Jakarta Timezone (WIB)
  const getTodayWibStr = () => {
    try {
      return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    return searchParams.get('date') || getTodayWibStr();
  });

  const lastParamCodeRef = useRef(undefined);

  // UI state
  const [searchMode, setSearchMode] = useState('AUTO'); // 'AUTO', 'PACKAGE', 'VEHICLE'
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW', 'PACKAGE', 'VEHICLE'
  const [cargoSearchTerm, setCargoSearchTerm] = useState('');
  const [expandedDestGroups, setExpandedDestGroups] = useState({});
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [nowTime, setNowTime] = useState(new Date());

  // Clock tick for real-time ETA updates
  useEffect(() => {
    const clockTick = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(clockTick);
  }, []);

  // ─── Mode A: Load Daily Control Tower Overview ─────────────────────────────
  const loadControlTower = useCallback(async (dateToUse) => {
    const targetDate = dateToUse || selectedDate;
    setControlTowerLoading(true);
    try {
      const res = await api.getControlTowerData(targetDate);
      if (res?.success && res?.data) {
        setControlTower(res.data);
      } else {
        setControlTower(null);
      }
    } catch (err) {
      console.error('Failed to load Control Tower data:', err);
      setControlTower(null);
    } finally {
      setControlTowerLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadControlTower(selectedDate);
  }, [selectedDate, loadControlTower]);

  // ─── Search Package or Vehicle Tracker ─────────────────────────────────────
  const handleSearch = useCallback(async (codeToSearch, dateToSearch) => {
    const targetDate = dateToSearch || selectedDate;
    const termToUse = codeToSearch !== undefined ? codeToSearch : query;

    if (!termToUse || !termToUse.trim()) {
      setQuery('');
      setResult(null);
      setErrorMsg('');
      setActiveTab('OVERVIEW');
      lastParamCodeRef.current = '';
      setSearchParams({ code: '', date: targetDate });
      return;
    }

    const cleanTerm = termToUse.trim();
    setQuery(cleanTerm);
    lastParamCodeRef.current = cleanTerm;
    setSearchParams({ code: cleanTerm, date: targetDate });
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.getCheckerData(cleanTerm, targetDate);

      if (res && res.success && res.data) {
        setResult(res.data);
        if (res.isVehicleQuery || res.data.found && res.data.vehicle) {
          setActiveTab('VEHICLE');
        } else {
          setActiveTab('PACKAGE');
        }
      } else {
        setResult(null);
        setErrorMsg(res?.error?.message || `Data tidak ditemukan untuk "${cleanTerm}".`);
      }
    } catch (e) {
      console.error('Checker search error:', e);
      setResult(null);
      setErrorMsg(e.message || `Tidak ditemukan data untuk "${cleanTerm}". Silakan periksa kembali query atau tanggal operasional.`);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, query, setSearchParams]);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    const dateParam = searchParams.get('date') || selectedDate;

    if (codeParam !== lastParamCodeRef.current) {
      lastParamCodeRef.current = codeParam;
      if (codeParam && codeParam.trim()) {
        handleSearch(codeParam, dateParam);
      } else {
        setQuery('');
        setResult(null);
        setErrorMsg('');
        setActiveTab('OVERVIEW');
      }
    }
  }, [searchParams, selectedDate, handleSearch]);

  const handleCopyCode = (codeText) => {
    if (codeText) {
      navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleDestGroup = (destNopen) => {
    setExpandedDestGroups(prev => ({ ...prev, [destNopen]: !prev[destNopen] }));
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
  };

  const mapStateToBadge = (stateStr) => {
    if (!stateStr) return { label: 'ENTRY', class: 'badge-navy' };
    const s = String(stateStr).toUpperCase();
    if (s.includes('DELIVERED') || s.includes('SELESAI')) return { label: 'DELIVERED', class: 'badge-emerald' };
    if (s.includes('ARRIVED') || s.includes('TIBA')) return { label: 'ARRIVED', class: 'badge-amber' };
    if (s.includes('TRANSIT') || s.includes('IN_TRANSIT')) return { label: 'IN TRANSIT', class: 'badge-orange' };
    if (s.includes('LOADED') || s.includes('MANIFEST')) return { label: 'LOADED', class: 'badge-blue' };
    return { label: s, class: 'badge-navy' };
  };

  const getCapacityBadge = (status) => {
    switch (status) {
      case 'OVER CAPACITY':
        return { label: 'OVER CAPACITY', color: '#ef4444', bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.5)' };
      case 'FULL':
        return { label: 'FULL CAPACITY', color: '#f97316', bg: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.4)' };
      case 'NEAR CAPACITY':
        return { label: 'NEAR CAPACITY', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)' };
      default:
        return { label: 'NORMAL CAPACITY', color: '#10b981', bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.4)' };
    }
  };

  // Gating check for CSV import tool button
  const isDevOrAdminMode = process.env.NODE_ENV !== 'production' || searchParams.get('dev') === 'true' || searchParams.get('dev') === '1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', padding: '0 4px' }}>
      
      {/* ─── 1. TOP HEADER BAR: CONTROL TOWER DATE PICKER & SEARCH BAR ─────────────────── */}
      <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Active Mode Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <button
              onClick={() => {
                setActiveTab('OVERVIEW');
                setQuery('');
                setResult(null);
                setErrorMsg('');
                setSearchParams({ code: '', date: selectedDate });
              }}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, transition: 'all 0.2s',
                background: activeTab === 'OVERVIEW' ? 'rgba(56,189,248,0.25)' : 'transparent',
                color: activeTab === 'OVERVIEW' ? '#38bdf8' : 'rgba(255,255,255,0.4)'
              }}
            >
              <Activity size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              Control Tower Overview
            </button>
            <button
              onClick={() => setSearchMode('AUTO')}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, transition: 'all 0.2s',
                background: activeTab !== 'OVERVIEW' ? 'rgba(56,189,248,0.25)' : 'transparent',
                color: activeTab !== 'OVERVIEW' ? '#38bdf8' : 'rgba(255,255,255,0.4)'
              }}
            >
              <Search size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              Pencarian Lacak (Resi / Nopol)
            </button>
          </div>

          {/* Main Search Input */}
          <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
            <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="input-navy font-mono"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query, selectedDate)}
              placeholder="Masukkan nomor resi (contoh: P20260724000001) atau plat armada (contoh: B 9910 PCX)..."
              style={{ paddingLeft: 38, paddingRight: 36, height: 42, fontSize: 13.5 }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResult(null);
                  setErrorMsg('');
                  setActiveTab('OVERVIEW');
                  lastParamCodeRef.current = '';
                  setSearchParams({ code: '', date: selectedDate });
                }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                title="Reset Pencarian"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button 
            className="btn-primary" 
            onClick={() => handleSearch(query, selectedDate)} 
            disabled={loading}
            style={{ height: 42, padding: '0 20px', fontWeight: 800, gap: 8 }}
          >
            {loading ? <RefreshCw size={15} className="spin" /> : <Search size={15} />}
            {loading ? 'Mencari...' : 'Lacak Data'}
          </button>

          {/* Dynamic Operational Date Picker Context (Timezone Asia/Jakarta WIB) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
            <CalendarDays size={15} color="#38bdf8" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Tanggal Operasional (WIB):</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setSelectedDate(newDate);
                if (query) handleSearch(query, newDate);
                else loadControlTower(newDate);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontWeight: 800,
                fontSize: 12.5,
                colorScheme: 'dark',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* CSV Import Dev Testing Tool Button */}
          {isDevOrAdminMode && (
            <button
              onClick={() => setIsCsvModalOpen(true)}
              style={{
                height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid rgba(56,189,248,0.3)',
                background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <FileSpreadsheet size={15} />
              Import CSV
            </button>
          )}

          <button
            onClick={() => query ? handleSearch(query, selectedDate) : loadControlTower(selectedDate)}
            style={{ height: 42, width: 42, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Refresh Data Operasional"
          >
            <RefreshCw size={15} className={loading || controlTowerLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* ─── ERROR STATE: HONEST EMPTY STATE (NO MOCK FALLBACK) ────────────────── */}
      {errorMsg && (
        <div className="glass-card-solid" style={{ padding: 24, borderRadius: 16, borderLeft: '4px solid #ef4444', background: 'rgba(239,68,68,0.08)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fca5a5' }}>
                DATA TIDAK DITEMUKAN
              </h4>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                {errorMsg}
              </p>
              <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setQuery('');
                    setErrorMsg('');
                    setResult(null);
                    setActiveTab('OVERVIEW');
                    setSearchParams({ code: '', date: selectedDate });
                  }}
                  style={{ fontSize: 12, padding: '6px 14px' }}
                >
                  Kembali ke Control Tower
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODE A: DAILY CONTROL TOWER OVERVIEW ───────────────────────────────── */}
      {activeTab === 'OVERVIEW' && !errorMsg && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={20} color="#38bdf8" />
                Operational Control Tower
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                Monitoring Perjalanan Paket & Utilisasi Kapasitas Armada Tanggal {selectedDate} (Timezone Asia/Jakarta WIB)
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge-navy" style={{ fontSize: 11, padding: '4px 10px' }}>
                <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Real-Time Database Sync
              </span>
            </div>
          </div>

          {/* 4 Stat Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="glass-card-solid" style={{ padding: 18, borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>TOTAL PACKAGES</span>
                <Package size={18} color="#38bdf8" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginTop: 10 }}>
                {controlTower?.summary?.totalPackages ?? 0} <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>resi</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                Total Berat: {controlTower?.summary?.totalWeightKg ?? 0} kg
              </div>
            </div>

            <div className="glass-card-solid" style={{ padding: 18, borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>IN TRANSIT / LOADED</span>
                <Truck size={18} color="#f97316" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#f97316', marginTop: 10 }}>
                {(controlTower?.summary?.inTransitCount ?? 0) + (controlTower?.summary?.loadedCount ?? 0)} <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>resi</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                In Transit: {controlTower?.summary?.inTransitCount ?? 0} | Loaded: {controlTower?.summary?.loadedCount ?? 0}
              </div>
            </div>

            <div className="glass-card-solid" style={{ padding: 18, borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>DELIVERED / ARRIVED</span>
                <CheckCircle2 size={18} color="#10b981" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981', marginTop: 10 }}>
                {(controlTower?.summary?.deliveredCount ?? 0) + (controlTower?.summary?.arrivedCount ?? 0)} <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>resi</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                Selesai Diterima: {controlTower?.summary?.deliveredCount ?? 0}
              </div>
            </div>

            <div className="glass-card-solid" style={{ padding: 18, borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>ACTIVE FLEET UTILIZATION</span>
                <Car size={18} color="#38bdf8" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginTop: 10 }}>
                {controlTower?.summary?.overallSystemUtilPct ?? 0}%
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                Armada Aktif: {controlTower?.summary?.activeVehiclesCount ?? 0} Mobil
              </div>
            </div>
          </div>

          {/* Operational Exceptions & Alerts Panel */}
          {controlTower?.exceptions && controlTower.exceptions.length > 0 && (
            <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16, borderLeft: '4px solid #f59e0b' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} />
                OPERATIONAL EXCEPTIONS & ALERTS ({controlTower.exceptions.length})
              </h3>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {controlTower.exceptions.map((ex, idx) => (
                  <div key={idx} style={{ background: 'rgba(245,158,11,0.08)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 12.5, color: '#fef08a' }}>{ex.title}</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{ex.message}</div>
                    </div>
                    {ex.vehicle_nopol && (
                      <button
                        className="btn-secondary"
                        onClick={() => handleSearch(ex.vehicle_nopol, selectedDate)}
                        style={{ fontSize: 11, padding: '4px 10px', height: 28 }}
                      >
                        Inspeksi Armada <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Fleet Operational List */}
          <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Car size={16} color="#38bdf8" />
              STATUS ARMADA AKTIF & UTILISASI KAPASITAS HARI INI
            </h3>

            {controlTower?.activeVehicles && controlTower.activeVehicles.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginTop: 16 }}>
                {controlTower.activeVehicles.map((v, i) => {
                  const badge = getCapacityBadge(v.capacity_status);
                  return (
                    <div key={i} className="glass-card-solid" style={{ padding: 16, borderRadius: 12, border: `1px solid ${badge.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>{v.vehicle_nopol}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{v.nama_kendaraan}</div>
                        </div>
                        <span className={badge.class || 'badge-navy'} style={{ fontSize: 10, padding: '3px 8px' }}>
                          {badge.label}
                        </span>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                          <span>Muatan Kargo: {v.current_load_kg} kg</span>
                          <span>Batas: {v.max_capacity_kg} kg ({v.utilization_pct}%)</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, v.utilization_pct)}%`, background: badge.color, borderRadius: 3 }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11 }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Driver: {v.driver}</span>
                        <button
                          onClick={() => handleSearch(v.vehicle_nopol, selectedDate)}
                          style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          Lihat Kargo <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30, 0', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                Tidak ada armada aktif tercatat di database untuk tanggal {selectedDate}.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ─── MODE B: SEARCH PACKAGE RESULT ─────────────────────────────────────── */}
      {activeTab === 'PACKAGE' && result && !result.isVehicleQuery && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Header Resi Card */}
          <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
                    {result.connoteCode}
                  </h2>
                  <button onClick={() => handleCopyCode(result.connoteCode)} style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer' }}>
                    {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  </button>
                  <span className={mapStateToBadge(result.state).class} style={{ fontSize: 11, padding: '4px 10px' }}>
                    {mapStateToBadge(result.state).label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
                  <span>Booking Code: <strong style={{ color: '#fff' }}>{result.bookingCode}</strong></span>
                  <span>Layanan: <strong style={{ color: '#38bdf8' }}>{result.service}</strong></span>
                  <span>Berat Paket: <strong style={{ color: '#fff' }}>{result.weightKg} kg</strong></span>
                  <span>Tgl Dibuat: <strong style={{ color: '#fff' }}>{formatDateDisplay(result.createdAt)}</strong></span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>ESTIMASI SISA WAKTU (ETA):</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#38bdf8', marginTop: 2 }}>
                  {result.routeInfo?.etaRemainingStr || '-'}
                </div>
              </div>
            </div>

            {/* Origin & Destination Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>📍 ASAL (ORIGIN OFFICE)</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 4 }}>{result.origin?.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Pengirim: {result.senderName}</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>🏁 TUJUAN (DESTINATION OFFICE)</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 4 }}>{result.destination?.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Penerima: {result.receiverName} ({result.receiverAddress})</div>
              </div>
            </div>
          </div>

          {/* Package -> Vehicle -> Route -> Journey Mapping Card */}
          <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck size={16} color="#38bdf8" />
              PEMETAAN KENDARAAN & RUTE PERJALANAN AKTIF
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 14 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Armada Mobil</span>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginTop: 2, fontFamily: 'monospace' }}>
                  {result.vehicleAssignment?.nopol || 'UNASSIGNED'}
                </div>
                <div style={{ fontSize: 10.5, color: '#38bdf8', marginTop: 2 }}>Source: {result.vehicleAssignment?.source}</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Rute Trayek</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 2 }}>
                  {result.routeInfo?.nama_route}
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Category: {result.routeInfo?.kodeMile}</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>ID Journey</span>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginTop: 2, fontFamily: 'monospace' }}>
                  {result.vehicleAssignment?.journey_id || '-'}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Pengemudi / Driver</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 2 }}>
                  {result.vehicleAssignment?.vehicle_info?.driver || 'Driver Shift'}
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Timeline Rute Waypoints (From DB detail_route) */}
          <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Navigation size={16} color="#38bdf8" />
              STEPPER TIMELINE WAYPOINT RUTE OPERASIONAL ({result.routeStops?.length || 0} STOPS)
            </h3>

            <div style={{ marginTop: 18, display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10 }}>
              {result.routeStops?.map((stop, i) => {
                const isCurrent = stop.status === 'CURRENT';
                const isCompleted = stop.status === 'COMPLETED';

                return (
                  <div key={i} style={{ flexShrink: 0, width: 170, background: isCurrent ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, border: isCurrent ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: isCurrent ? '#38bdf8' : isCompleted ? '#10b981' : 'rgba(255,255,255,0.4)' }}>
                        STOP #{stop.seq}
                      </span>
                      {isCompleted ? <CheckCircle2 size={14} color="#10b981" /> : isCurrent ? <Truck size={14} color="#38bdf8" /> : <Circle size={14} color="rgba(255,255,255,0.2)" />}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stop.officeName}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                      ⏱️ {stop.estimasi_menit}m | 📏 {stop.jarak_km}km
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracking Event Timeline (From DB tracking_events sorted ASC) */}
          <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={16} color="#38bdf8" />
              RIWAYAT TRACKING LOG EVENT (CHRONOLOGICAL EVENT LOG)
            </h3>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {result.timeline?.map((evt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={mapStateToBadge(evt.stage).class} style={{ fontSize: 10, padding: '2px 8px' }}>
                        {evt.stage}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{evt.time}</span>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', marginTop: 6 }}>{evt.note}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>📍 Lokasi: {evt.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ─── MODE C: VEHICLE SEARCH RESULT ────────────────────────────────────── */}
      {activeTab === 'VEHICLE' && result && result.data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Vehicle Profile Card */}
          <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
                    {result.data.vehicle?.nopol}
                  </h2>
                  <span className={getCapacityBadge(result.data.capacity?.status).class || 'badge-navy'} style={{ fontSize: 11, padding: '4px 10px' }}>
                    {result.data.capacity?.status}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                  {result.data.vehicle?.nama_kendaraan}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)', flexWrap: 'wrap' }}>
                  <span>Driver: <strong style={{ color: '#fff' }}>{result.data.vehicle?.driver}</strong></span>
                  <span>Jenis: <strong style={{ color: '#38bdf8' }}>{result.data.vehicle?.jenis_kendaraan}</strong></span>
                  <span>Home Base: <strong style={{ color: '#fff' }}>{result.data.vehicle?.home_base}</strong></span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div style={{ minWidth: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                  <span>UTILISASI BEBAN</span>
                  <span>{result.data.capacity?.utilization_pct}%</span>
                </div>
                <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, result.data.capacity?.utilization_pct || 0)}%`, background: getCapacityBadge(result.data.capacity?.status).color, borderRadius: 5 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                  <span>Terpakai: {result.data.capacity?.current_load_kg} kg</span>
                  <span>Batas: {result.data.capacity?.max_capacity_kg} kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo Manifest Grouped by Destination Office */}
          <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={16} color="#38bdf8" />
              CARGO MANIFEST DIKELOMPOKKAN BERDASARKAN KANTOR TUJUAN ({result.data.totalCargoCount || 0} PAKET)
            </h3>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.data.cargoGroupedByDestination?.map((grp, i) => {
                const isExpanded = !!expandedDestGroups[grp.destination_nopen];

                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div 
                      onClick={() => toggleDestGroup(grp.destination_nopen)}
                      style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isExpanded ? <ChevronDown size={16} color="#38bdf8" /> : <ChevronRight size={16} color="rgba(255,255,255,0.4)" />}
                        <span style={{ fontWeight: 800, fontSize: 13.5, color: '#fff' }}>{grp.destination_office_name} ({grp.destination_nopen})</span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                        <span className="badge-navy">{grp.package_count} Paket</span>
                        <span style={{ color: '#38bdf8', fontWeight: 800 }}>{grp.total_weight_kg} kg</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                          <thead>
                            <tr style={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                              <th style={{ padding: 8 }}>No. Resi</th>
                              <th style={{ padding: 8 }}>Berat</th>
                              <th style={{ padding: 8 }}>Pengirim</th>
                              <th style={{ padding: 8 }}>Penerima</th>
                              <th style={{ padding: 8 }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grp.packages?.map((pkg, pIdx) => (
                              <tr key={pIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: 8, fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>{pkg.connote_code}</td>
                                <td style={{ padding: 8, color: '#fff' }}>{pkg.weight_kg} kg</td>
                                <td style={{ padding: 8, color: 'rgba(255,255,255,0.7)' }}>{pkg.sender_name || '-'}</td>
                                <td style={{ padding: 8, color: 'rgba(255,255,255,0.7)' }}>{pkg.receiver_name || '-'}</td>
                                <td style={{ padding: 8 }}>
                                  <button
                                    onClick={() => handleSearch(pkg.connote_code, selectedDate)}
                                    style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}
                                  >
                                    Lacak Paket <ArrowUpRight size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ─── MODALS ───────────────────────────────────────────────────────────── */}
      {isCsvModalOpen && (
        <CsvImportModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} />
      )}
    </div>
  );
}
