import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, CheckCircle2, Circle, Clock, Package, Truck, Navigation, 
  Copy, Check, RefreshCw, History, ShieldCheck, Zap, Sparkles, X, Filter, Eye,
  CalendarDays, Play, Pause, RotateCcw, SkipForward, SkipBack, ArrowRight, Layers, FileSpreadsheet,
  AlertCircle, AlertTriangle, ChevronDown, ChevronRight, User, Building2, Weight, Calendar,
  Printer, Car, TrendingUp, Activity, BoxIcon, Timer
} from 'lucide-react';
import { api } from '../utils/api.js';
import LiveGpsMapModal from '../components/LiveGpsMapModal.jsx';
import CsvImportModal from '../components/CsvImportModal.jsx';

const SAMPLE_RESIS = [
  { code: 'P20260724000001', label: 'Resi In-Transit (Cimahi → SPP Bandung)', badge: 'In Transit', badgeClass: 'badge-orange' },
  { code: 'P20260724000003', label: 'Resi Loaded (Cimahi Selatan)', badge: 'Loaded', badgeClass: 'badge-blue' },
  { code: 'P20260724000005', label: 'Resi Selesai (SPP Bandung)', badge: 'Delivered', badgeClass: 'badge-emerald' },
];

export default function Checker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('code') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Track previous URL param code to prevent useEffect re-firing while user is typing in input
  const lastParamCodeRef = useRef(undefined);

  // ─── Daily Operation Date Context State ────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(() => {
    return searchParams.get('date') || '2026-07-24';
  });

  // ─── Filter & Selection States ─────────────────────────────────────────────
  const [selectedStopFilter, setSelectedStopFilter] = useState(null);
  const [cargoSearchTerm, setCargoSearchTerm] = useState('');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // ─── Simulation Mode States (For Demo / Academic Advisor) ───────────────────
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStopSeq, setSimStopSeq] = useState(null);
  const [simSpeed, setSimSpeed] = useState(1500);
  const [nowTime, setNowTime] = useState(new Date());
  const [expandedDestGroups, setExpandedDestGroups] = useState({});
  const [searchByVehicle, setSearchByVehicle] = useState(false);

  // Clock tick for ETA countdown
  useEffect(() => {
    const clockTick = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(clockTick);
  }, []);

  useEffect(() => {
    let timer = null;
    if (isSimulating && result?.routeStops?.length) {
      timer = setInterval(() => {
        setSimStopSeq((prevSeq) => {
          const current = prevSeq ?? result.currentStopSeq ?? 1;
          if (current >= result.routeStops.length) {
            setIsSimulating(false);
            return current;
          }
          return current + 1;
        });
      }, simSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulating, simSpeed, result]);

  // Gating check for CSV import tool button
  const isDevOrAdminMode = process.env.NODE_ENV !== 'production' || searchParams.get('dev') === 'true' || searchParams.get('dev') === '1';

  // Format helpers
  const formatDateDisplay = (dateStr) => {
    if (!dateStr || dateStr === '-') return '24 Jul 2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getWaypointSubLabel = (stop, index, total) => {
    if (index === 0) return 'Origin Counter (Awal)';
    if (index === total - 1) return 'Terminal Akhir (SPP)';
    const name = stop.officeName || '';
    if (name.includes('SPP')) {
      if (index === 5) return 'Gerbang Kedatangan SPP';
      if (index === 6) return 'Sorting Terminal Hub';
      if (index === 7) return 'Bongkar Kantong Final';
    }
    return `Transit Waypoint #${stop.seq}`;
  };

  const formatWeight = (w) => {
    if (w === null || w === undefined || w === '-' || w === 'undefined') return '1.0 kg';
    const num = parseFloat(w);
    return isNaN(num) ? `${w} kg` : `${num.toFixed(1)} kg`;
  };

  const mapStateToBadgeClass = (state) => {
    if (!state) return 'badge-navy';
    const s = String(state).toUpperCase();
    if (s.includes('DELIVERED') || s.includes('SELESAI')) return 'badge-emerald';
    if (s.includes('ARRIVED') || s.includes('TIBA')) return 'badge-amber';
    if (s.includes('TRANSIT') || s.includes('IN_TRANSIT')) return 'badge-orange';
    if (s.includes('LOADED') || s.includes('MANIFEST')) return 'badge-blue';
    return 'badge-navy';
  };

  // ETA countdown helper: parse "HH:MM WIB" into today's Date, compute minutes remaining
  const getEtaCountdown = (etaTimeStr) => {
    if (!etaTimeStr || !etaTimeStr.includes(':')) return null;
    const [hh, mmRaw] = etaTimeStr.replace(' WIB', '').split(':');
    const etaDate = new Date(nowTime);
    etaDate.setHours(parseInt(hh, 10), parseInt(mmRaw, 10), 0, 0);
    const diffMs = etaDate - nowTime;
    if (diffMs < 0) return 'Sudah lewat';
    const diffMin = Math.floor(diffMs / 60000);
    const diffSec = Math.floor((diffMs % 60000) / 1000);
    if (diffMin === 0) return `${diffSec}d lagi`;
    return `${diffMin}m ${diffSec}s lagi`;
  };

  // Toggle accordion destination group in cargo list
  const toggleDestGroup = (key) => {
    setExpandedDestGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Search Connote Tracker Handler (Does NOT depend on query state in useCallback)
  const handleSearch = useCallback(async (codeToSearch, dateToSearch) => {
    const targetDate = dateToSearch || selectedDate;
    const termToUse = codeToSearch !== undefined ? codeToSearch : '';

    if (!termToUse || !termToUse.trim()) {
      setQuery('');
      setResult(null);
      setErrorMsg('');
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
      if (res.success && res.data) {
        const tx = res.data.transaction || {};
        const milk = res.data.milk_run || {};

        const isVehicle = res.isVehicleQuery || res.data?.isVehicleQuery || false;
        const hasCargo = res.hasCargo !== undefined ? res.hasCargo : (res.data?.hasCargo !== undefined ? res.data.hasCargo : true);
        const warningMsg = res.warningMessage || res.data?.warningMessage || null;
        const vInfo = res.data?.vehicle || null;

        setResult({
          isVehicleQuery: isVehicle,
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
          
          // Tracking Event Timeline
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

          // Real-Time Vehicle Journey & Capacity
          milkRun: milk,
          vehicleNopol: milk.vehicleNopol || vInfo?.nopol || cleanTerm,
          routeId: milk.routeId || vInfo?.assignedRouteId || 'RT-MALAM-B9910-PCX',
          currentStopSeq: milk.currentStopSeq || 1,
          maxCapacityKg: milk.maxCapacityKg || vInfo?.maxCapacityKg || 1500,
          currentLoadKg: milk.currentLoadKg || 0,
          availableCapacityKg: milk.availableCapacityKg || 1500,
          utilizationPct: milk.utilizationPct || 0,
          capacityStatus: milk.capacityStatus || 'NORMAL',
          routeStops: milk.routeStops || [],
          cargoItems: milk.cargoList || milk.cargoItems || [],
          cargoGroupedByDestination: milk.cargoGroupedByDestination || []
        });
      } else {
        setErrorMsg(res.message || `Kode resi "${cleanTerm}" tidak ditemukan.`);
        setResult(null);
      }
    } catch (e) {
      console.error('Package tracking search error:', e);
      setErrorMsg(e.message || `Resi "${cleanTerm}" tidak ditemukan atau server error.`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, setSearchParams]);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    const dateParam = searchParams.get('date') || selectedDate;

    // Only run if the code in URL parameter has actually changed from external navigation
    if (codeParam !== lastParamCodeRef.current) {
      lastParamCodeRef.current = codeParam;
      if (codeParam && codeParam.trim()) {
        handleSearch(codeParam, dateParam);
      } else if (codeParam === null) {
        // Initial load when URL has no ?code parameter -> load default demo resi
        handleSearch('P20260724000001', dateParam);
      } else {
        setQuery('');
        setResult(null);
        setErrorMsg('');
      }
    }
  }, [searchParams, selectedDate, handleSearch]);

  const handleCopyCode = () => {
    if (result?.connote) {
      navigator.clipboard.writeText(result.connote);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Capacity Gauge Badge Config
  const getCapacityStatusBadge = (status) => {
    switch (status) {
      case 'OVER CAPACITY':
        return { label: 'OVER CAPACITY', class: 'badge-orange', color: '#ef4444', bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.5)' };
      case 'FULL':
        return { label: 'FULL CAPACITY', class: 'badge-orange', color: '#f97316', bg: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.4)' };
      case 'NEAR CAPACITY':
        return { label: 'NEAR CAPACITY', class: 'badge-amber', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)' };
      default:
        return { label: 'NORMAL CAPACITY', class: 'badge-emerald', color: '#10b981', bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.4)' };
    }
  };

  // Filter cargo inside vehicle dynamically based on activeSeq (Milk Run active cargo at active stop)
  const activeSeq = isSimulating || simStopSeq !== null ? (simStopSeq || 1) : (result?.currentStopSeq || 1);
  const nopenToSeq = new Map((result?.routeStops || []).map(s => [String(s.nopen), s.seq]));

  const activeCargoItems = (result?.cargoItems || []).filter(item => {
    const loadSeq = item.loaded_at_seq || 1;
    const destSeq = nopenToSeq.get(String(item.destination_nopen)) || (result?.routeStops?.length || 6);

    // Item is inside vehicle at activeSeq IF loaded_at_seq <= activeSeq AND destSeq >= activeSeq
    return loadSeq <= activeSeq && destSeq >= activeSeq;
  });

  // Group active cargo items by destination
  const activeDestinationMap = new Map();
  for (const item of activeCargoItems) {
    const destKey = item.destination_nopen || '40400';
    if (!activeDestinationMap.has(destKey)) {
      activeDestinationMap.set(destKey, {
        destination_nopen: destKey,
        count: 0,
        total_weight_kg: 0,
        packages: []
      });
    }
    const group = activeDestinationMap.get(destKey);
    group.count++;
    group.total_weight_kg = Number((group.total_weight_kg + (item.weight_kg || 0)).toFixed(2));
    group.packages.push(item);
  }

  const dynamicCargoGroups = Array.from(activeDestinationMap.values());

  const filteredCargoGroups = dynamicCargoGroups.map(group => {
    const matchingPackages = (group.packages || []).filter(pkg => {
      const matchSearch = !cargoSearchTerm || 
        pkg.connote_code.toLowerCase().includes(cargoSearchTerm.toLowerCase()) ||
        (pkg.destination_nopen && pkg.destination_nopen.includes(cargoSearchTerm));
      const matchStop = !selectedStopFilter || group.destination_nopen === selectedStopFilter;
      return matchSearch && matchStop;
    });

    return {
      ...group,
      packages: matchingPackages
    };
  }).filter(group => group.packages.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', padding: '0 4px' }}>
      
      {/* 1. TOP HEADER: SEARCH BAR, SAMPLE CHIPS & DEV TESTING TOOL BUTTON */}
      <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Vehicle plate / connote toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <button
              onClick={() => setSearchByVehicle(false)}
              style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, transition: 'all 0.2s',
                background: !searchByVehicle ? 'rgba(56,189,248,0.25)' : 'transparent',
                color: !searchByVehicle ? '#38bdf8' : 'rgba(255,255,255,0.4)' }}
            ><Package size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />No. Resi</button>
            <button
              onClick={() => setSearchByVehicle(true)}
              style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, transition: 'all 0.2s',
                background: searchByVehicle ? 'rgba(56,189,248,0.25)' : 'transparent',
                color: searchByVehicle ? '#38bdf8' : 'rgba(255,255,255,0.4)' }}
            ><Car size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Plat Kendaraan</button>
          </div>

          {/* Main Search Input */}
          <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
            {searchByVehicle ? <Car size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              : <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />}
            <input
              className="input-navy font-mono"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query, selectedDate)}
              placeholder={searchByVehicle ? 'Cari berdasarkan plat (contoh: B 9910 PCX)...' : 'Lacak nomor resi / connote (contoh: P20260724000001)...'}
              style={{ paddingLeft: 38, paddingRight: 36, height: 42, fontSize: 13.5 }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResult(null);
                  setErrorMsg('');
                  lastParamCodeRef.current = '';
                  setSearchParams({ code: '', date: selectedDate });
                }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                title="Hapus / Reset Pencarian"
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
            {loading ? 'Mencari...' : 'Lacak Paket'}
          </button>

          {/* Daily Operation Date Picker Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
            <CalendarDays size={15} color="#38bdf8" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Tanggal Operasional:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setSelectedDate(newDate);
                handleSearch(query, newDate);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontWeight: 800,
                fontSize: 12,
                fontFamily: 'monospace',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* QA / Dev CSV Import Button (Gated) */}
          {isDevOrAdminMode && (
            <button
              className="btn-ghost"
              onClick={() => setIsCsvModalOpen(true)}
              style={{
                height: 42,
                padding: '0 14px',
                fontSize: 11.5,
                fontWeight: 800,
                borderRadius: 10,
                borderColor: 'rgba(56,189,248,0.4)',
                color: '#38bdf8',
                gap: 6,
                background: 'rgba(56,189,248,0.08)'
              }}
              title="Tooling testing import data CSV operasional harian"
            >
              <FileSpreadsheet size={15} /> Tool Testing: Import CSV 📥
            </button>
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
              onClick={() => handleSearch(s.code, selectedDate)}
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

        {errorMsg && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}
      </div>

      {/* MAIN VIEW CONTENT AREA */}
      {result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* VEHICLE NO-CARGO WARNING BANNER */}
          {result.warningMessage && (
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
          )}

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
          
          {/* 2. SECTION: PACKAGE OVERVIEW & DAILY OPERATION CONTEXT */}
          <div 
            className="glass-card-solid gradient-border-card" 
            style={{ 
              padding: 24, 
              borderRadius: 18, 
              background: 'linear-gradient(135deg, rgba(13,27,56,0.92), rgba(6,13,31,0.96))',
              border: '1px solid rgba(56,189,248,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    PACKAGE TRACKING OVERVIEW
                  </span>
                  <span className="badge badge-navy" style={{ fontSize: 10 }}>
                    Konteks Tanggal: {formatDateDisplay(selectedDate)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div className="font-mono" style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '0.04em' }}>
                    {result.connote}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="btn-ghost"
                    style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 8, borderColor: 'rgba(56,189,248,0.3)', color: '#38bdf8' }}
                  >
                    {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    {copied ? 'Tercopy' : 'Copy Resi'}
                  </button>
                  <span className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 6 }}>
                    Booking: {result.bookingCode}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge ${result.badgeClass}`} style={{ fontSize: 13, padding: '8px 20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {result.stateStr}
                </span>
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

          {/* 3. SECTION: TRACKING EVENT TIMELINE STEPPER (DATABASE EVENT HISTORY) */}
          <div className="glass-card-solid" style={{ padding: 22, borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="#38bdf8" /> TRACKING TIMELINE (EVENT LOG DARI DATABASE)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  {result.timeline.length} Event Tercatat
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
              {result.timeline.map((event, idx) => {
                const isLast = idx === result.timeline.length - 1;
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
                      {idx < result.timeline.length - 1 && (
                        <div style={{ width: 2, height: 28, background: `${dotColor}33`, margin: '4px 0' }} />
                      )}
                    </div>

                    <div style={{ flex: 1, background: isLast ? `${dotColor}0d` : 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 10, border: `1px solid ${isLast ? dotColor + '33' : 'rgba(255,255,255,0.05)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: isLast ? dotColor : '#fff' }}>
                            {event.stage}
                          </span>
                          <span className="badge badge-navy" style={{ fontSize: 9.5 }}>
                            {event.location}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                          {event.note}
                        </div>
                      </div>

                      <div className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                        {event.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 & 5. SECTIONS: CURRENT JOURNEY & VEHICLE CAPACITY GAUGE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            
            {/* CURRENT JOURNEY CARD */}
            <div className="glass-card-solid" style={{ padding: 22, borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={16} color="#38bdf8" /> CURRENT VEHICLE JOURNEY
                </div>
                <span className="badge badge-orange" style={{ fontSize: 10, padding: '3px 8px' }}>
                  IN_PROGRESS
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(232,67,31,0.25), rgba(245,158,11,0.15))',
                  border: '1.5px solid rgba(232,67,31,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Truck size={24} color="#ff7b59" />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>
                    {result.vehicleNopol}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6ba3f0', marginTop: 2 }} className="font-mono">
                    Rute: {result.routeId}
                  </div>
                </div>
              </div>

              {(() => {
                const activeSeq = isSimulating || simStopSeq !== null ? (simStopSeq || 1) : result.currentStopSeq;
                const activeStopObj = result.routeStops?.[activeSeq - 1] || {};
                const nextStopObj = result.routeStops?.[activeSeq] || null;
                const etaCountdown = getEtaCountdown(activeStopObj.etaTime);

                return (
                  <div style={{ background: 'rgba(6,13,31,0.5)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Stop Sequence Aktif:</span>
                      <strong style={{ color: '#fff' }}>Stop #{activeSeq} dari {(result.routeStops || []).length || 6}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Stop Saat Ini:</span>
                      <strong style={{ color: '#10b981' }}>{activeStopObj.officeName || 'KCU Cimahi'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Estimasi Tiba (ETA):</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ color: '#38bdf8' }}>{activeStopObj.etaTime || '10:00 WIB'}</strong>
                        {etaCountdown && (
                          <span style={{ fontSize: 10, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '2px 7px', borderRadius: 6, fontWeight: 700, fontFamily: 'monospace', border: '1px solid rgba(56,189,248,0.3)' }}>
                            ⏱ {etaCountdown}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Stop Berikutnya:</span>
                      <strong style={{ color: nextStopObj ? '#f59e0b' : '#10b981' }}>
                        {nextStopObj ? nextStopObj.officeName : 'SPP Bandung (Terminal Akhir)'}
                      </strong>
                    </div>
                    {nextStopObj && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>ETA Stop Berikutnya:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ color: '#f59e0b' }}>{nextStopObj.etaTime || '-'}</strong>
                          {getEtaCountdown(nextStopObj.etaTime) && (
                            <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 7px', borderRadius: 6, fontWeight: 700, fontFamily: 'monospace', border: '1px solid rgba(245,158,11,0.3)' }}>
                              ⏱ {getEtaCountdown(nextStopObj.etaTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

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

          {/* 6. SECTION: ROUTE JOURNEY (MULTI-STOP WAYPOINTS & DEMO SIMULATION) */}
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
                  <Navigation size={17} color="#38bdf8" /> MULTI-STOP ROUTE JOURNEY ({result.routeStops.length} WAYPOINTS DATABASE)
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
                      if ((simStopSeq || result.currentStopSeq) >= result.routeStops.length) {
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
                  onClick={() => setSimStopSeq(prev => Math.min(result.routeStops.length, (prev ?? result.currentStopSeq ?? 1) + 1))}
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

          {/* 7. SECTION: PACKAGES INSIDE VEHICLE (GROUPED BY DESTINATION STOP) */}
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

              {/* Filter Cargo Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

        </div>
      ) : !loading && (
        /* EMPTY STATE — shown before first search or when result is cleared */
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
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {SAMPLE_RESIS.map(s => (
              <button
                key={s.code}
                onClick={() => handleSearch(s.code, selectedDate)}
                style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.08)'}
              >
                <span className="font-mono" style={{ fontSize: 12, color: '#6ba3f0', fontWeight: 700 }}>{s.code}</span>
                <span className={`badge ${s.badgeClass}`} style={{ fontSize: 9.5 }}>{s.badge}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, maxWidth: 580, width: '100%' }}>
            {[
              { emoji: '📦', title: 'Real-time Load', desc: 'Muatan di tiap stop berubah sesuai DB' },
              { emoji: '🗺️', title: 'Multi-Stop Route', desc: 'Visualisasi 6-stop Milk Run interaktif' },
              { emoji: '⏱️', title: 'ETA Countdown', desc: 'Countdown live ke stop berikutnya' },
              { emoji: '🎬', title: 'Simulasi Demo', desc: 'Play/Pause pergerakan armada untuk presentasi' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', textAlign: 'left' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{f.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#fff', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TESTING IMPORT CSV */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={(dateStr) => {
          setSelectedDate(dateStr);
          handleSearch();
        }}
      />

      {/* MODAL GPS TELEMETRY MAP */}
      <LiveGpsMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        connoteCode={result?.connote || 'P2607150025574'}
        vehicleNopol={result?.vehicleNopol || 'B 9910 PCX'}
        routeId={result?.routeId || 'RT-MALAM-B9910-PCX'}
        stops={result?.routeStops || []}
        loadKg={result?.currentLoadKg || 750}
        maxCapKg={result?.maxCapacityKg || 1500}
      />
    </div>
  );
}
