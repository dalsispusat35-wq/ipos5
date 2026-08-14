import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, CheckCircle2, Circle, Clock, Package, Truck, Navigation, 
  Copy, Check, RefreshCw, ShieldCheck, Zap, X, Filter, Eye,
  CalendarDays, ArrowRight, Layers, FileSpreadsheet,
  AlertCircle, AlertTriangle, ChevronDown, ChevronRight, User, Building2, Weight,
  Car, TrendingUp, Activity, BoxIcon, Timer, AlertOctagon, Info, ArrowUpRight,
  Printer, History, Sparkles, Pause, Play, SkipForward, SkipBack, RotateCcw
} from 'lucide-react';
import { api } from '../utils/api.js';
import LiveGpsMapModal from '../components/LiveGpsMapModal.jsx';
import CsvImportModal from '../components/CsvImportModal.jsx';

const SAMPLE_RESIS = [
  { code: 'P20260811000001', date: '2026-08-11', label: 'Resi 11 Aug (B 9910 PCX - 8 Paket)', badge: '11 Aug', badgeClass: 'badge-orange' },
  { code: 'P260812000001', date: '2026-08-12', label: 'Resi 12 Aug (B 9910 PCX - 35 Paket)', badge: '12 Aug', badgeClass: 'badge-blue' },
  { code: 'P20260813000001', date: '2026-08-13', label: 'Resi 13 Aug (B 9910 PCX - 3 Paket)', badge: '13 Aug', badgeClass: 'badge-blue' },
  { code: 'P20260724000001', date: '2026-07-24', label: 'Resi 24 Jul (Cimahi → SPP Bandung)', badge: '24 Jul', badgeClass: 'badge-emerald' },
  { code: 'B 9910 PCX', label: 'Armada Feeder GrandMax Box', badge: 'Fleet', badgeClass: 'badge-navy' }
];

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
    let termToUse = codeToSearch !== undefined ? codeToSearch : query;

    // If query is empty, default to sample resi/armada for target date so operational date data is always displayed
    if (!termToUse || !termToUse.trim()) {
      termToUse = targetDate === '2026-08-12' ? 'P260812000001' : (targetDate === '2026-07-24' ? 'P20260724000001' : 'B 9910 PCX');
    }

    const cleanTerm = termToUse.trim();
    setQuery(cleanTerm);
    lastParamCodeRef.current = cleanTerm;
    setSearchParams({ code: cleanTerm, date: targetDate });
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.getCheckerData(cleanTerm, targetDate);
      if (res.success && res.data) {
        const isFuture = res.isFutureDate || res.data?.isFutureDate || false;

        if (isFuture && (!res.data?.milk_run || !res.data.milk_run.routeStops || res.data.milk_run.routeStops.length === 0)) {
          const tx = res.data?.transaction || {};
          setResult({
            isFutureDate: true,
            targetDateStr: targetDate,
            connote: tx.connoteCode || cleanTerm,
            bookingCode: tx.bookingCode || '-',
            service: tx.service || 'Pos Reguler',
            weight: formatWeight(tx.actualWeight),
            stateStr: tx.state || 'ENTRY',
            badgeClass: mapStateToBadgeClass(tx.state),
            origin: tx.originName ? `${tx.originName} (${tx.originNopen})` : 'KCU Cimahi (40511)',
            destination: tx.receiverAddress ? `${tx.receiverAddress} (${tx.destinationNopen})` : 'SPP Bandung (40400)',
            senderName: tx.senderName || 'PT Pos Logistics',
            receiverName: tx.receiverName || 'Penerima Pos',
            createdAt: tx.createdAt ? formatDateDisplay(tx.createdAt) : '-',
            warningMessage: res.warningMessage || res.data?.warningMessage || `⚠️ [TANGGAL OPERASIONAL BELUM TIBA]: Tanggal ${targetDate} merupakan tanggal di masa depan yang belum tiba.`,
            timeline: [],
            milkRun: null
          });
          return;
        }

        const tx = res.data.transaction || {};
        const milk = res.data.milk_run || {};

        const isVehicle = res.isVehicleQuery || res.data?.isVehicleQuery || false;
        const isFutureFlag = res.isFutureDate || res.data?.isFutureDate || (targetDate > '2026-08-14');
        const hasData = res.hasData !== undefined ? res.hasData : (res.data?.hasData !== undefined ? res.data.hasData : true);
        const hasCargo = res.hasCargo !== undefined ? res.hasCargo : (res.data?.hasCargo !== undefined ? res.data.hasCargo : true);
        const warningMsg = res.warningMessage || res.data?.warningMessage || null;
        const vInfo = res.data?.vehicle || null;

        const formattedResult = (res.data && res.data.data) ? res.data : { ...res.data, data: res.data };
        setResult({
          ...formattedResult,
          isVehicleQuery: isVehicle,
          isFutureDate: isFutureFlag,
          hasData: hasData,
          hasCargo,
          warningMessage: warningMsg,
          vehicleInfo: vInfo,
          connote: tx.connoteCode || cleanTerm,
          bookingCode: tx.bookingCode || '-',
          service: tx.service || 'Pos Reguler',
          weight: formatWeight(tx.actualWeight),
          stateStr: tx.state || (isVehicle ? 'IN_TRANSIT' : 'ENTRY'),
          badgeClass: mapStateToBadgeClass(tx.state),
          origin: tx.originName ? `${tx.originName} (${tx.originNopen})` : 'KCU Cimahi (40511)',
          destination: tx.receiverAddress ? `${tx.receiverAddress} (${tx.destinationNopen})` : 'SPP Bandung (40400)',
          senderName: tx.senderName || 'PT Pos Logistics',
          receiverName: tx.receiverName || 'Penerima Pos',
          createdAt: tx.createdAt ? formatDateDisplay(tx.createdAt) : '24 Jul 2026',
          createdRaw: tx.createdAt || null,
          finalSwp: tx.finalSwp || '-',
          finalSwpDate: tx.finalSwpDate || '-',
          timeline: (() => {
            const rawList = (res.data.trackingHistory && res.data.trackingHistory.length > 0)
              ? res.data.trackingHistory
              : (res.data.data?.trackingHistory && res.data.data.trackingHistory.length > 0)
                ? res.data.data.trackingHistory
                : [];

            if (rawList.length > 0) {
              return rawList.map(h => ({
                stage: h.stage || h.to_state || 'EVENT',
                note: h.note || `Status paket: ${h.stage}`,
                time: formatDateDisplay(h.time),
                location: h.office_name || h.location || '-'
              }));
            }

            return [
              { stage: tx.state || 'ENTRY', note: `Pencarian armada/paket ${cleanTerm} tercatat di sistem IPOS5.`, time: formatDateDisplay(tx.createdAt), location: tx.originName || 'KCU Cimahi' }
            ];
          })(),
          milkRun: milk,
          hasRoute: res.data?.hasRoute !== undefined ? res.data.hasRoute : (milk.routeStops && milk.routeStops.length > 0),
          vehicleNopol: milk.vehicleNopol || vInfo?.nopol || cleanTerm,
          routeId: milk.routeId || vInfo?.assignedRouteId || null,
          currentStopSeq: milk.currentStopSeq || 1,
          maxCapacityKg: milk.maxCapacityKg || vInfo?.maxCapacityKg || (vInfo?.kapasitas_ton ? vInfo.kapasitas_ton * 1000 : 1500),
          currentLoadKg: milk.currentLoadKg || 0,
          availableCapacityKg: (milk.maxCapacityKg || 1500) - (milk.currentLoadKg || 0),
          utilizationPct: milk.utilizationPct || 0,
          capacityStatus: milk.capacityStatus || 'NORMAL',
          routeStops: milk.routeStops || [],
          cargoItems: milk.cargoList || milk.cargoItems || [],
          cargoGroupedByDestination: milk.cargoGroupedByDestination || []
        });

        if (res.isVehicleQuery || (res.data?.found && res.data?.vehicle) || res.data?.vehicle) {
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

    // Sync selectedDate state if date in URL param differs
    if (dateParam && dateParam !== selectedDate) {
      setSelectedDate(dateParam);
    }

    // Only run if the code in URL parameter has actually changed from external navigation
    if (codeParam !== lastParamCodeRef.current) {
      lastParamCodeRef.current = codeParam;
      if (codeParam && codeParam.trim()) {
        handleSearch(codeParam, dateParam);
      } else {
        // Initial load or date switch when ?code is empty -> load active fleet operation for date
        handleSearch('B 9910 PCX', dateParam);
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
              max="2026-08-14"
              value={selectedDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setSelectedDate(newDate);
                const termToSearch = (query && query.trim()) ? query.trim() : (newDate === '2026-08-12' ? 'P260812000001' : (newDate === '2026-07-24' ? 'P20260724000001' : 'B 9910 PCX'));
                handleSearch(termToSearch, newDate);
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

        {/* Operational Context Warning Banner (If date in past/completed) */}
        {result?.milkRun?.dateContextWarning && (
          <div style={{
            marginTop: 14,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 12.5,
            fontWeight: 600
          }}>
            <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 8, color: '#f59e0b' }}>
                [Konteks Tanggal Operasional ({formatDateDisplay(selectedDate)})]:
              </span>
              {result.milkRun.dateContextWarning}
            </div>
          </div>
        )}

        {/* Quick Test Samples */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Sampel Resi Uji Database:
          </span>
          {SAMPLE_RESIS.map((s) => (
            <button
              key={s.code}
              onClick={() => {
                if (s.date) setSelectedDate(s.date);
                handleSearch(s.code, s.date || selectedDate);
              }}
              className="btn-ghost"
              style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, gap: 6 }}
            >
              <span className="font-mono" style={{ color: '#6ba3f0', fontWeight: 700 }}>{s.code}</span>
              <span className={`badge ${s.badgeClass}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                {s.badge}
              </span>
            </button>
          ))}
        </div>
      </div>
    )}

      {/* MAIN VIEW CONTENT AREA */}
      {result ? (
        (selectedDate > '2026-08-14' || result.isFutureDate || result.hasData === false) ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 20,
          padding: '48px 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          minHeight: 320
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid rgba(245, 158, 11, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={32} color="#f59e0b" />
          </div>

          <div style={{ maxWidth: 640 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b', marginBottom: 8, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {selectedDate > '2026-08-14' || result.isFutureDate
                ? '⚠️ PERINGATAN: TANGGAL MASA DEPAN'
                : '⚠️ DATA TRANSAKSI / OPERASIONAL TIDAK TERSEDIA'}
            </h3>

            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              {result.warningMessage || (selectedDate > '2026-08-14'
                ? `Tanggal operasional yang Anda pilih (${formatDateDisplay(selectedDate)}) merupakan tanggal di masa depan. Belum ada transaksi yang muncul dikarenakan tanggal tersebut belum terjadi.`
                : `Tidak ada data transaksi atau rute perjalanan armada yang tercatat untuk pencarian "${query || 'resi'}" pada tanggal operasional ${formatDateDisplay(selectedDate)}.`
              )}
            </p>

            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 12,
              padding: '12px 18px',
              fontSize: 12,
              color: '#93c5fd',
              display: 'inline-block',
              marginBottom: 20
            }}>
              💡 <strong style={{ color: '#fff' }}>Petunjuk:</strong> Sistem secara otomatis membatasi prediksi transaksi tanggal di masa depan. Silakan pilih tanggal operasional hari ini (14 Agu 2026) atau tanggal terdaftar lainnya.
            </div>

            <div>
              <button
                className="btn-primary"
                onClick={() => {
                  const today = '2026-08-14';
                  setSelectedDate(today);
                  handleSearch(query || 'P20260724000001', today);
                }}
                style={{ padding: '10px 24px', fontWeight: 800, fontSize: 13, gap: 8, margin: '0 auto' }}
              >
                <CalendarDays size={16} />
                Kembali ke Tanggal Hari Ini (14 Agu 2026)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* FUTURE OPERATIONAL DATE WARNING CARD */}
          {(() => {
            const todayStr = new Date().toISOString().slice(0, 10);
            const isFutureDateSelected = result.isFutureDate || (selectedDate > todayStr && (!result.milkRun || !result.milkRun.routeStops || result.milkRun.routeStops.length === 0));
            
            if (isFutureDateSelected) {
              return (
                <div style={{
                  padding: '32px 28px',
                  borderRadius: 20,
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1.5px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                  marginTop: 10
                }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CalendarDays size={32} color="#f87171" />
                  </div>

                  <div style={{ maxWidth: 640 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#ef4444', margin: 0 }}>
                      Tanggal Operasional Belum Tiba ({formatDateDisplay(selectedDate)})
                    </h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
                      Tanggal <strong>{formatDateDisplay(selectedDate)}</strong> merupakan tanggal operasional di masa depan yang belum tiba dan belum memiliki riwayat perjalanan armada maupun transaksi paket di sistem IPOS5.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setSelectedDate('2026-08-12');
                        handleSearch(query, '2026-08-12');
                      }}
                      style={{ padding: '8px 16px', fontSize: 12, fontWeight: 800, borderRadius: 10 }}
                    >
                      📅 Pilih Tanggal Operasional Aktif (12 Ags 2026)
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setSelectedDate('2026-07-24');
                        handleSearch(query, '2026-07-24');
                      }}
                      style={{ padding: '8px 16px', fontSize: 12, fontWeight: 800, borderRadius: 10 }}
                    >
                      📅 Riwayat Operasional (24 Jul 2026)
                    </button>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* VEHICLE NO-CARGO WARNING BANNER (Only for past/current operational dates with empty load) */}
          {(() => {
            const todayStr = new Date().toISOString().slice(0, 10);
            const isFutureDateSelected = result.isFutureDate || (selectedDate > todayStr && (!result.milkRun || !result.milkRun.routeStops || result.milkRun.routeStops.length === 0));
            if (isFutureDateSelected) return null;

            return result.warningMessage ? (
              <div style={{
                padding: '16px 20px',
                borderRadius: 16,
                background: 'rgba(245, 158, 11, 0.14)',
                border: '1.5px solid rgba(245, 158, 11, 0.5)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.12)'
              }}>
                <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f59e0b' }}>
                    STATUS ARMADA TERKINI: KENDARAAN KOSONG / BELUM MEMILIKI MUATAN
                  </div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.9)', marginTop: 4, lineHeight: 1.5 }}>
                    {result.warningMessage}
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          {/* OPERATIONAL CARDS (Only rendered when selected date is past/current with valid operation data) */}
          {(() => {
            const todayStr = new Date().toISOString().slice(0, 10);
            const isFutureDateSelected = result.isFutureDate || (selectedDate > todayStr && (!result.milkRun || !result.milkRun.routeStops || result.milkRun.routeStops.length === 0));
            if (isFutureDateSelected) return null;

            return (
              <>
                {/* SUMMARY STATS CARDS — Fleet snapshot for this date */}
                {(() => {
                  const stops = result.routeStops || [];
                  const totalStops = stops.length;
                  const activeSeq = isSimulating || simStopSeq !== null ? (simStopSeq || 1) : (result.currentStopSeq || 1);
                  const activeStopObj = stops[activeSeq - 1] || {};
                  const totalCargo = (result.cargoItems || []).length;
                  const totalWeight = (result.cargoItems || []).reduce((s, i) => s + (i.weight_kg || 0), 0).toFixed(1);
                  const utilPct = activeStopObj.utilizationPctAtStop ?? result.utilizationPct ?? 0;
                  const capColor = utilPct >= 100 ? '#ef4444' : utilPct >= 85 ? '#f59e0b' : '#10b981';
                  const cards = [
                    { icon: Package, color: '#38bdf8', label: 'Total Paket di Kendaraan', value: `${totalCargo} pcs`, sub: `${totalWeight} kg total muatan` },
                    { icon: Truck, color: '#f59e0b', label: 'Kendaraan Beroperasi', value: result.vehicleNopol, sub: `Rute: ${result.routeId}` },
                    { icon: Activity, color: capColor, label: `Utilisasi Kap. Stop #${activeSeq}`, value: `${utilPct}%`, sub: `${activeStopObj.loadAtStopKg ?? result.currentLoadKg ?? 0} / ${result.maxCapacityKg} kg` },
                    { icon: MapPin, color: '#a78bfa', label: 'Progress Rute', value: `${activeSeq} / ${totalStops} Stop`, sub: activeStopObj.officeName ? `Sekarang: ${activeStopObj.officeName}` : 'In Progress' },
                  ];
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                      {cards.map((c, i) => {
                        const Icon = c.icon;
                        return (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.color}33`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c.color}18`, border: `1px solid ${c.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Icon size={18} color={c.color} />
                            </div>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{c.label}</div>
                              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: i === 1 ? 'monospace' : 'inherit' }}>{c.value}</div>
                              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{c.sub}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* CAPACITY ALERT BANNER — shown when vehicle is FULL or NEAR CAPACITY */}
                {(() => {
                  const activeSeq = isSimulating || simStopSeq !== null ? (simStopSeq || 1) : (result?.currentStopSeq || 1);
                  const activeStopObj = result.routeStops?.[activeSeq - 1] || {};
                  const capStatus = activeStopObj.capacityStatusAtStop || result.capacityStatus;
                  if (capStatus === 'NORMAL') return null;
                  const isOver = capStatus === 'OVER CAPACITY';
                  const isFull = capStatus === 'FULL';
                  return (
                    <div style={{
                      padding: '14px 18px',
                      borderRadius: 14,
                      background: isOver ? 'rgba(239,68,68,0.15)' : isFull ? 'rgba(249,115,22,0.12)' : 'rgba(245,158,11,0.10)',
                      border: `1.5px solid ${isOver ? 'rgba(239,68,68,0.6)' : isFull ? 'rgba(249,115,22,0.5)' : 'rgba(245,158,11,0.4)'}`,
                      display: 'flex', alignItems: 'center', gap: 14,
                      animation: isOver ? 'pulse 2s infinite' : 'none'
                    }}>
                      <div style={{ fontSize: 28 }}>{isOver ? '🚨' : isFull ? '⚠️' : '🔶'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: 13.5, color: isOver ? '#ef4444' : isFull ? '#f97316' : '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {isOver ? '🚨 PERINGATAN: OVER CAPACITY!' : isFull ? '⚠️ KAPASITAS PENUH (FULL)' : '🔶 Mendekati Batas Kapasitas'}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                          {isOver
                            ? `Muatan di Stop #${activeSeq} melebihi batas maksimum ${result.maxCapacityKg} kg! Perlu redistribusi.`
                            : isFull
                            ? `Kendaraan ${result.vehicleNopol} sudah mencapai kapasitas penuh di Stop #${activeSeq}.`
                            : `Muatan di Stop #${activeSeq} mendekati batas ${result.maxCapacityKg} kg. Perhatikan penambahan paket.`}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 900, color: isOver ? '#ef4444' : isFull ? '#f97316' : '#f59e0b' }}>
                        {activeStopObj.utilizationPctAtStop || result.utilizationPct}%
                      </div>
                    </div>
                  );
                })()}
              </>
            );
          })()}
          
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

              {/* Spec Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  { label: 'Layanan Pengiriman', value: result.service, color: '#38bdf8', icon: Package },
                  { label: 'Berat Paket', value: result.weight, color: '#fff', icon: Weight },
                  { label: 'Kantor Asal (Origin)', value: result.origin, color: '#10b981', icon: MapPin },
                  { label: 'Kantor Tujuan (Dest)', value: result.destination, color: '#ff7b59', icon: MapPin },
                  { label: 'Pengirim / Penerima', value: `${result.senderName} → ${result.receiverName}`, color: 'rgba(255,255,255,0.9)', icon: User },
                  { label: 'Tanggal Input Paket', value: result.createdAt, color: 'rgba(255,255,255,0.7)', icon: Calendar },
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconComp size={12} color={item.color} /> {item.label}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: item.color }}>
                        {item.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. SECTION: TRACKING EVENT TIMELINE STEPPER (DATABASE EVENT HISTORY) */}
          <div className="glass-card-solid" style={{ padding: 22, borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="#38bdf8" /> TRACKING TIMELINE (EVENT LOG DARI DATABASE)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  {(result.timeline || []).length} Event Tercatat
                </span>
                <button
                  onClick={() => window.print()}
                  className="btn-ghost"
                  style={{ padding: '4px 10px', fontSize: 11, borderRadius: 8, gap: 5, color: '#a78bfa', borderColor: 'rgba(167,139,250,0.4)' }}
                  title="Cetak / Export laporan tracking ini"
                >
                  <Printer size={13} /> Cetak Laporan
                </button>
              </div>
            </div>

            {/* Stepper Grid / List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(result.timeline || []).map((event, idx) => {
                const isLast = idx === (result.timeline || []).length - 1;
                const eventStageUp = String(event.stage || '').toUpperCase();
                const dotColor = isLast ? '#10b981'
                  : eventStageUp.includes('DELIVERED') ? '#10b981'
                  : eventStageUp.includes('TRANSIT') || eventStageUp.includes('IN_TRANSIT') ? '#f59e0b'
                  : eventStageUp.includes('LOADED') ? '#38bdf8'
                  : '#6b7280';
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: isLast ? `linear-gradient(135deg, ${dotColor}, #2460b0)` : 'rgba(255,255,255,0.06)',
                          border: `2px solid ${dotColor}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 800, fontSize: 11, flexShrink: 0,
                          boxShadow: isLast ? `0 0 12px ${dotColor}55` : 'none'
                        }}
                      >
                        {idx + 1}
                      </div>
                      {idx < (result.timeline || []).length - 1 && (
                        <div style={{ width: 2, height: 28, background: `${dotColor}33`, margin: '4px 0' }} />
                      )}
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
      ) : null}

      {/* ─── MODE C: VEHICLE SEARCH RESULT ────────────────────────────────────── */}
      {activeTab === 'VEHICLE' && result && (result.data || result.isVehicleQuery) && (() => {
        const vData = result.data || result;
        const vehicle = vData.vehicle || result.vehicleInfo || { nopol: result.vehicleNopol };
        const capacity = vData.capacity || {
          status: result.capacityStatus || 'NORMAL',
          utilization_pct: result.utilizationPct || 0,
          current_load_kg: result.currentLoadKg || 0,
          max_capacity_kg: result.maxCapacityKg || 1500
        };
        const cargoGrouped = vData.cargoGroupedByDestination || result.cargoGroupedByDestination || [];
        const totalCargoCount = vData.totalCargoCount || result.cargoItems?.length || 0;
        const capBadge = getCapacityBadge(capacity.status);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Vehicle Profile Card */}
            <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
                      {vehicle.nopol || result.vehicleNopol}
                    </h2>
                    <span className={capBadge.class || 'badge-navy'} style={{ fontSize: 11, padding: '4px 10px' }}>
                      {capacity.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    {vehicle.nama_kendaraan || `Armada ${vehicle.nopol || result.vehicleNopol}`}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)', flexWrap: 'wrap' }}>
                    <span>Driver: <strong style={{ color: '#fff' }}>{vehicle.driver || '-'}</strong></span>
                    <span>Jenis: <strong style={{ color: '#38bdf8' }}>{vehicle.jenis_kendaraan || 'Truk Box'}</strong></span>
                    <span>Home Base: <strong style={{ color: '#fff' }}>{vehicle.home_base || '-'}</strong></span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div style={{ minWidth: 240 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                    <span>UTILISASI BEBAN</span>
                    <span>{capacity.utilization_pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, capacity.utilization_pct || 0)}%`, background: capBadge.color, borderRadius: 5 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                    <span>Terpakai: {capacity.current_load_kg} kg</span>
                    <span>Batas: {capacity.max_capacity_kg} kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo Manifest Grouped by Destination Office */}
            <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={16} color="#38bdf8" />
                CARGO MANIFEST DIKELOMPOKKAN BERDASARKAN KANTOR TUJUAN ({totalCargoCount} PAKET)
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

              <button
                className="btn-primary"
                onClick={() => setIsMapModalOpen(true)}
                style={{ marginTop: 16, width: '100%', height: 38, fontSize: 12, borderRadius: 10, justifyContent: 'center', gap: 6 }}
              >
                <Navigation size={14} /> Lihat Telemetri Radar GPS 📡
              </button>
            </div>

            {/* VEHICLE CAPACITY GAUGE CARD */}
            {(() => {
              const activeSeq = isSimulating || simStopSeq !== null ? (simStopSeq || 1) : result.currentStopSeq;
              const activeStopObj = result.routeStops?.[activeSeq - 1] || {};
              const activeLoadKg = activeStopObj.loadAtStopKg !== undefined ? activeStopObj.loadAtStopKg : result.currentLoadKg;
              const activeUtilPct = activeStopObj.utilizationPctAtStop !== undefined ? activeStopObj.utilizationPctAtStop : result.utilizationPct;
              const activeCapStatus = activeStopObj.capacityStatusAtStop || result.capacityStatus;
              
              const capInfo = getCapacityStatusBadge(activeCapStatus);
              const availKg = Math.max(0, result.maxCapacityKg - activeLoadKg);

              return (
                <div className="glass-card-solid" style={{ padding: 22, borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Zap size={16} color={capInfo.color} /> VEHICLE CAPACITY GAUGE (STOP #{activeSeq})
                    </div>
                    <span 
                      style={{ 
                        fontSize: 10.5, 
                        fontWeight: 800, 
                        padding: '3px 10px', 
                        borderRadius: 6, 
                        color: capInfo.color, 
                        background: capInfo.bg, 
                        border: `1px solid ${capInfo.border}` 
                      }}
                    >
                      {capInfo.label}
                    </span>
                  </div>

                  <div style={{ background: 'rgba(6,13,31,0.6)', padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                        Penggunaan Muatan (Utilitas Stop #{activeSeq}):
                      </span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: capInfo.color }}>
                        {activeUtilPct}%
                      </span>
                    </div>

                    {/* Progress Bar Gauge */}
                    <div style={{ width: '100%', height: 10, borderRadius: 10, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{
                        width: `${Math.min(100, activeUtilPct)}%`,
                        height: '100%',
                        borderRadius: 10,
                        background: `linear-gradient(90deg, ${capInfo.color}, #6366f1)`,
                        transition: 'width 0.4s ease'
                      }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11.5 }}>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.45)' }}>Beban di Stop Ini:</span>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: 13 }}>{activeLoadKg} kg</div>
                      </div>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.45)' }}>Max Capacity:</span>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: 13 }}>{result.maxCapacityKg} kg</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Kapasitas Tersedia:</span>
                    <strong style={{ color: '#10b981', fontSize: 13 }}>{availKg} kg sisa</strong>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

          {/* 6. SECTION: ROUTE JOURNEY (MULTI-STOP WAYPOINTS & DEMO SIMULATION) */}
          {result.hasRoute !== false && (result.routeStops || []).length > 0 && (
          <div 
            className="glass-card-solid" 
            style={{ 
              padding: 24, 
              borderRadius: 20, 
              border: '1px solid rgba(56,189,248,0.25)',
              background: 'linear-gradient(135deg, rgba(13,27,56,0.95), rgba(6,13,31,0.98))',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top Bar with Title & Academic Advisor Simulation Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Navigation size={17} color="#38bdf8" /> MULTI-STOP ROUTE JOURNEY ({(result.routeStops || []).length} WAYPOINTS DATABASE)
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                  Lintasan armada {result.vehicleNopol} — Klik waypoint untuk memfilter muatan paket
                </div>
              </div>

              {/* SIMULATION TOOLBAR (DEMO PEMBIMBING) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(6,13,31,0.8)',
                padding: '6px 12px',
                borderRadius: 12,
                border: '1px solid rgba(56,189,248,0.3)'
              }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={13} color="#38bdf8" /> Mode Simulasi Rute:
                </span>

                {isSimulating ? (
                  <button
                    onClick={() => setIsSimulating(false)}
                    className="btn-ghost"
                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 800, borderRadius: 8, color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)', gap: 4 }}
                  >
                    <Pause size={13} /> Pause
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if ((simStopSeq || result.currentStopSeq) >= (result.routeStops || []).length) {
                        setSimStopSeq(1);
                      }
                      setIsSimulating(true);
                    }}
                    className="btn-primary"
                    style={{ padding: '4px 12px', fontSize: 11, fontWeight: 800, borderRadius: 8, gap: 5, background: 'linear-gradient(135deg, #38bdf8, #0284c7)' }}
                  >
                    <Play size={13} /> Simulasi Demo ▶
                  </button>
                )}

                <button
                  onClick={() => setSimStopSeq(prev => Math.min((result.routeStops || []).length, (prev ?? result.currentStopSeq ?? 1) + 1))}
                  className="btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11, borderRadius: 8, gap: 4 }}
                  title="Maju 1 Stop"
                >
                  <SkipForward size={13} /> Next
                </button>

                <button
                  onClick={() => setSimStopSeq(prev => Math.max(1, (prev ?? result.currentStopSeq ?? 2) - 1))}
                  className="btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11, borderRadius: 8, gap: 4 }}
                  title="Mundur 1 Stop"
                  disabled={!isSimulating && simStopSeq === null}
                >
                  <SkipBack size={13} /> Prev
                </button>

                <button
                  onClick={() => { setIsSimulating(false); setSimStopSeq(1); }}
                  className="btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11, borderRadius: 8, gap: 4, color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' }}
                  title="Reset ke Stop 1 (awal perjalanan)"
                >
                  <RotateCcw size={13} /> Reset
                </button>

                {/* Speed selector */}
                <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                  {[
                    { label: '1x', ms: 1800 },
                    { label: '2x', ms: 900 },
                    { label: '4x', ms: 450 }
                  ].map(s => (
                    <button
                      key={s.label}
                      onClick={() => setSimSpeed(s.ms)}
                      style={{
                        padding: '2px 6px',
                        fontSize: 9.5,
                        fontWeight: 800,
                        borderRadius: 4,
                        border: 'none',
                        background: simSpeed === s.ms ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                        color: simSpeed === s.ms ? '#000' : 'rgba(255,255,255,0.6)',
                        cursor: 'pointer'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Simulation Status Banner */}
            {(isSimulating || simStopSeq !== null) && (
              <div style={{
                marginBottom: 16,
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(56,189,248,0.1)',
                border: '1px solid rgba(56,189,248,0.3)',
                color: '#38bdf8',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={15} className={isSimulating ? 'pulse-slow' : ''} />
                  <span>
                    Simulasi Bergerak: Armada {result.vehicleNopol} berada di <strong>Waypoint #{simStopSeq || result.currentStopSeq} ({result.routeStops[(simStopSeq || result.currentStopSeq) - 1]?.officeName || 'Stop'})</strong>
                  </span>
                </div>
                <button
                  onClick={() => { setIsSimulating(false); setSimStopSeq(null); }}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 11 }}
                >
                  Kembali ke Data Live DB ✖
                </button>
              </div>
            )}

            {/* Visual Route Track with Animated Vehicle Pill */}
            {(() => {
              const activeSeq = isSimulating || simStopSeq !== null ? (simStopSeq || 1) : result.currentStopSeq;

              return (
                <div style={{ position: 'relative', width: '100%', paddingTop: 36, paddingBottom: 12 }}>
                  
                  {/* Floating Animated Vehicle Marker Above Current Stop */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: `${Math.min(94, Math.max(3, ((activeSeq - 0.5) / result.routeStops.length) * 100))}%`,
                    transform: 'translateX(-50%)',
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 10
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #e8431f, #f97316)',
                      padding: '4px 10px',
                      borderRadius: 20,
                      boxShadow: '0 0 20px rgba(232,67,31,0.8), 0 4px 12px rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#fff',
                      fontSize: 10.5,
                      fontWeight: 900,
                      whiteSpace: 'nowrap',
                      border: '1px solid rgba(255,255,255,0.4)'
                    }}>
                      <Truck size={13} color="#fff" className={isSimulating ? 'pulse-fast' : ''} />
                      <span>{result.vehicleNopol} (Stop #{activeSeq})</span>
                    </div>
                  </div>

                  {/* Connected Stepper Line & Waypoint Nodes */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${result.routeStops.length}, 1fr)`, gap: 4, width: '100%', position: 'relative' }}>
                    
                    {/* Underlying Track Progress Line */}
                    <div style={{
                      position: 'absolute',
                      top: 24,
                      left: `${100 / (result.routeStops.length * 2)}%`,
                      right: `${100 / (result.routeStops.length * 2)}%`,
                      height: 4,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      zIndex: 1
                    }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(0, ((activeSeq - 1) / (result.routeStops.length - 1)) * 100))}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981, #38bdf8, #e8431f)',
                        borderRadius: 2,
                        transition: 'width 0.6s ease'
                      }} />
                    </div>

                    {result.routeStops.map((stop, sIdx) => {
                      const isCurrent = stop.seq === activeSeq;
                      const isPassed = stop.seq < activeSeq;
                      const isSelected = selectedStopFilter === stop.nopen;

                      let nodeBg = 'rgba(15,23,42,0.9)';
                      let nodeBorder = 'rgba(255,255,255,0.15)';
                      let nodeColor = 'rgba(255,255,255,0.5)';
                      let nodeGlow = 'none';

                      if (isPassed) {
                        nodeBg = '#10b981';
                        nodeBorder = '#10b981';
                        nodeColor = '#fff';
                      } else if (isCurrent) {
                        nodeBg = '#e8431f';
                        nodeBorder = '#38bdf8';
                        nodeColor = '#fff';
                        nodeGlow = '0 0 20px rgba(232,67,31,0.9), 0 0 10px rgba(56,189,248,0.7)';
                      }

                      if (isSelected) {
                        nodeBorder = '#38bdf8';
                        nodeGlow = '0 0 20px rgba(56,189,248,0.9)';
                      }

                      return (
                        <div
                          key={stop.seq}
                          onClick={() => {
                            setSelectedStopFilter(isSelected ? null : stop.nopen);
                            setSimStopSeq(stop.seq);
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 8,
                            position: 'relative',
                            zIndex: 2,
                            cursor: 'pointer',
                            padding: '4px 2px'
                          }}
                        >
                          {/* Waypoint Circle Button */}
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              background: nodeBg,
                              border: `3px solid ${nodeBorder}`,
                              boxShadow: nodeGlow,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: nodeColor,
                              fontWeight: 900,
                              fontSize: 13,
                              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                              transform: isCurrent ? 'scale(1.15)' : 'scale(1)'
                            }}
                          >
                            {isPassed ? <CheckCircle2 size={18} color="#fff" /> : stop.seq}
                          </div>

                          {/* Waypoint Name & Distinct Sublabel */}
                          <div style={{ textAlign: 'center', width: '100%', padding: '0 2px' }}>
                            <div style={{
                              fontSize: 11,
                              fontWeight: isCurrent || isSelected ? 900 : 700,
                              color: isSelected ? '#38bdf8' : isCurrent ? '#ff7b59' : isPassed ? '#fff' : 'rgba(255,255,255,0.6)',
                              lineHeight: 1.25,
                              marginBottom: 2,
                              wordBreak: 'break-word'
                            }}>
                              {stop.officeName}
                            </div>
                            <div style={{ fontSize: 9.5, color: '#38bdf8', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                              <Clock size={10} /> {stop.etaTime || '10:00 WIB'}
                              {stop.jarakKm ? ` (${stop.jarakKm} km)` : ''}
                            </div>
                            
                            {/* Waypoint Capacity Load Badge */}
                            {stop.loadAtStopKg !== undefined && (
                              <div style={{
                                marginTop: 3,
                                fontSize: 9,
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: stop.utilizationPctAtStop > 100 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
                                border: `1px solid ${stop.utilizationPctAtStop > 100 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                color: stop.utilizationPctAtStop > 100 ? '#ef4444' : stop.utilizationPctAtStop >= 90 ? '#f97316' : '#10b981'
                              }}>
                                📦 {stop.loadAtStopKg} kg ({stop.utilizationPctAtStop}%)
                              </div>
                            )}

                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 2 }}>
                              {getWaypointSubLabel(stop, sIdx, result.routeStops.length)}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span 
                            className={`badge ${isPassed ? 'badge-emerald' : isCurrent ? 'badge-orange' : 'badge-navy'}`} 
                            style={{ fontSize: 8.5, padding: '1px 7px', fontWeight: 800, marginTop: 4 }}
                          >
                            {isPassed ? 'PASSED' : isCurrent ? 'CURRENT' : 'UPCOMING'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
          )}

          {/* 7. SECTION: PACKAGES INSIDE VEHICLE (GROUPED BY DESTINATION STOP) */}
          {result.hasRoute !== false && (result.routeStops || []).length > 0 && (
          <div className="glass-card-solid" style={{ padding: 22, borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={16} color="#38bdf8" /> PACKAGES INSIDE VEHICLE (GROUPED BY DESTINATION STOP)
                </div>
                <div style={{ fontSize: 11, color: '#10b981', marginTop: 2, fontWeight: 700 }}>
                  🚚 Real-time Cargo Milk Run: Muatan fisik di dalam armada {result.vehicleNopol} saat berada di Stop #{activeSeq} ({result.routeStops?.[activeSeq - 1]?.officeName || ''})
                </div>
              </div>

              {/* Filter Cargo Input & Mode Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.04)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => setShowOnlyNewlyLoaded(false)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: !showOnlyNewlyLoaded ? 'rgba(56,189,248,0.25)' : 'transparent',
                      color: !showOnlyNewlyLoaded ? '#38bdf8' : 'rgba(255,255,255,0.4)'
                    }}
                  >
                    🚚 Semua Muatan di Mobil (Akumulatif)
                  </button>
                  <button
                    onClick={() => setShowOnlyNewlyLoaded(true)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: showOnlyNewlyLoaded ? 'rgba(245,158,11,0.25)' : 'transparent',
                      color: showOnlyNewlyLoaded ? '#f59e0b' : 'rgba(255,255,255,0.4)'
                    }}
                  >
                    📦 Baru Dimuat di Stop #{activeSeq}
                  </button>
                </div>

                {selectedStopFilter && (
                  <button
                    onClick={() => setSelectedStopFilter(null)}
                    className="btn-ghost"
                    style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)', gap: 4 }}
                  >
                    Filter Stop: {selectedStopFilter} <X size={12} />
                  </button>
                )}
                <div style={{ position: 'relative', width: 220 }}>
                  <Search size={13} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    className="input-navy"
                    value={cargoSearchTerm}
                    onChange={(e) => setCargoSearchTerm(e.target.value)}
                    placeholder="Cari resi / stop..."
                    style={{ paddingLeft: 30, fontSize: 12, height: 32 }}
                  />
                </div>
              </div>
            </div>

            {/* Cargo Groups List — Accordion per Destination */}
            {filteredCargoGroups.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredCargoGroups.map((group, gIdx) => {
                  const stopObj = (result.routeStops || []).find(s => String(s.nopen) === String(group.destination_nopen));
                  const groupKey = group.destination_nopen || `group-${gIdx}`;
                  const isExpanded = expandedDestGroups[groupKey] !== false; // default open
                  const activeSeqNow = isSimulating || simStopSeq !== null ? (simStopSeq || 1) : (result?.currentStopSeq || 1);
                  // Highlight: packages that will be unloaded AT the current stop
                  const isDroppedAtCurrentStop = stopObj && stopObj.seq === activeSeqNow;
                  const borderColor = isDroppedAtCurrentStop ? '#f59e0b' : 'rgba(255,255,255,0.06)';
                  const headerBg = isDroppedAtCurrentStop ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)';

                  return (
                    <div key={gIdx} style={{ background: 'rgba(6,13,31,0.5)', borderRadius: 12, border: `1.5px solid ${borderColor}`, overflow: 'hidden', transition: 'border-color 0.3s' }}>
                      {/* Accordion Header — click to collapse/expand */}
                      <div
                        onClick={() => toggleDestGroup(groupKey)}
                        style={{ background: headerBg, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: isExpanded ? `1px solid ${borderColor}` : 'none', transition: 'all 0.2s' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Building2 size={15} color={isDroppedAtCurrentStop ? '#f59e0b' : '#38bdf8'} />
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: isDroppedAtCurrentStop ? '#f59e0b' : '#fff' }}>
                            {stopObj ? `Stop #${stopObj.seq}: ${stopObj.officeName} (${group.destination_nopen})` : `Nopen ${group.destination_nopen}`}
                          </span>
                          {isDroppedAtCurrentStop && (
                            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }}>
                              ⬇ Diturunkan di Stop Ini
                            </span>
                          )}
                          <span className="badge badge-blue" style={{ fontSize: 10 }}>
                            {group.count} Paket · {group.total_weight_kg} kg
                          </span>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                          <ChevronRight size={16} />
                        </div>
                      </div>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                          {group.packages.map((pkg, pIdx) => {
                            const isCurrentPkg = pkg.connote_code === result.connote;
                            return (
                              <div
                                key={pIdx}
                                onClick={() => handleSearch(pkg.connote_code)}
                                style={{
                                  background: isCurrentPkg ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.02)',
                                  border: `1px solid ${isCurrentPkg ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.05)'}`,
                                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                                  transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: 4
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = isCurrentPkg ? 'rgba(56,189,248,0.14)' : 'rgba(255,255,255,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = isCurrentPkg ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.02)'}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span className="font-mono" style={{ fontSize: 12, fontWeight: 800, color: isCurrentPkg ? '#38bdf8' : '#6ba3f0' }}>
                                    {pkg.connote_code}
                                    {isCurrentPkg && <span style={{ marginLeft: 6, fontSize: 9.5, color: '#38bdf8', fontWeight: 900 }}>← Anda</span>}
                                  </span>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{formatWeight(pkg.weight_kg)}</span>
                                </div>
                                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Dimuat di Stop #{pkg.loaded_at_seq || 1}</span>
                                  <span>Tujuan: {pkg.destination_nopen}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                Tidak ada paket aktif di dalam kendaraan untuk filter saat ini.
              </div>
            )}
          </div>
      )}

      {/* ─── EMPTY STATE ──────────────────────────────────────────────────────── */}
      {!result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 28, textAlign: 'center' }}>
          {/* Animated truck illustration */}
          <div style={{ position: 'relative', width: 160, height: 100 }}>
            <div style={{ fontSize: 72, animation: 'float 3s ease-in-out infinite', display: 'inline-block' }}>🚚</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.5), transparent)', borderRadius: 10, animation: 'shimmer 2s infinite' }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
              Lacak Paket Milk Run Kamu
            </div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', maxWidth: 460, lineHeight: 1.7 }}>
              Masukkan <strong style={{ color: '#38bdf8' }}>nomor resi / connote</strong> atau <strong style={{ color: '#f59e0b' }}>plat kendaraan</strong> untuk melihat posisi real-time armada, muatan Milk Run, dan estimasi waktu tiba ke setiap kantor cabang.
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
