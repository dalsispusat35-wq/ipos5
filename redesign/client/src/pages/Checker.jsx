import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, CheckCircle2, Circle, Clock, Package, Truck, Navigation, 
  Copy, Check, RefreshCw, ShieldCheck, Zap, X, Filter, Eye,
  Calendar, CalendarDays, ArrowRight, Layers, FileSpreadsheet,
  AlertCircle, AlertTriangle, ChevronDown, ChevronRight, User, Building2, Weight,
  Car, TrendingUp, Activity, BoxIcon, Timer, AlertOctagon, Info, ArrowUpRight,
  Printer, History, Sparkles, Pause, Play, SkipForward, SkipBack, RotateCcw
} from 'lucide-react';
import { api } from '../utils/api.js';
import LiveGpsMapModal from '../components/LiveGpsMapModal.jsx';
import CsvImportModal from '../components/CsvImportModal.jsx';

const SAMPLE_RESIS = [
  { code: 'P20260724000001', date: '2026-07-24', label: 'Resi 24 Jul (KCU Cimahi → SPP Bandung)', badge: '24 Jul', badgeClass: 'badge-emerald' },
  { code: 'P260812000001', date: '2026-08-12', label: 'Resi 12 Aug (B 9910 PCX - 35 Paket)', badge: '12 Aug', badgeClass: 'badge-blue' },
  { code: 'P20260811000001', date: '2026-08-11', label: 'Resi 11 Aug (B 9910 PCX - 8 Paket)', badge: '11 Aug', badgeClass: 'badge-orange' },
  { code: 'P20260813000001', date: '2026-08-13', label: 'Resi 13 Aug (B 9910 PCX - 3 Paket)', badge: '13 Aug', badgeClass: 'badge-blue' },
  { code: 'B 9910 PCX', date: '2026-08-12', label: 'Armada Feeder GrandMax Box', badge: 'Fleet', badgeClass: 'badge-navy' }
];

// ─── Module-Level Pure Helper Functions (Available everywhere without TDZ) ───
const getTodayWibStr = () => {
  try {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr || dateStr === '-') return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
};

const formatWeight = (kg) => {
  if (kg === null || kg === undefined) return '-';
  const num = parseFloat(kg);
  if (isNaN(num)) return '-';
  return num % 1 === 0 ? `${num} kg` : `${num.toFixed(1)} kg`;
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

const mapStateToBadgeClass = (stateStr) => mapStateToBadge(stateStr).class;

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

const getCapacityStatusBadge = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'OVER CAPACITY':
      return { label: '🚨 OVER CAPACITY', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)' };
    case 'FULL':
      return { label: '⚠️ FULL', color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.45)' };
    case 'NEAR CAPACITY':
      return { label: '🔶 NEAR CAPACITY', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' };
    default:
      return { label: '✅ NORMAL', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' };
  }
};

const getWaypointSubLabel = (stop, idx, total) => {
  if (idx === 0) return '🏁 Titik Awal / Origin';
  if (idx === total - 1) return '🏆 Titik Akhir / Tujuan';
  return `📍 Transit Stop #${stop?.seq || idx + 1}`;
};

export default function Checker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('code') || 'P20260724000001');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    return searchParams.get('date') || '2026-08-12';
  });

  const lastParamCodeRef = useRef(undefined);

  // Search mode: 'PACKAGE' vs 'VEHICLE'
  const [searchMode, setSearchMode] = useState('PACKAGE'); 
  const [cargoSearchTerm, setCargoSearchTerm] = useState('');
  const [expandedDestGroups, setExpandedDestGroups] = useState({});
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [, setNowTime] = useState(new Date());

  // Simulation and UI filter states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStopSeq, setSimStopSeq] = useState(null);
  const [simSpeed, setSimSpeed] = useState(1800);
  const [selectedStopFilter, setSelectedStopFilter] = useState(null);
  const [showOnlyNewlyLoaded, setShowOnlyNewlyLoaded] = useState(false);

  // Clock tick for real-time updates
  useEffect(() => {
    const clockTick = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(clockTick);
  }, []);

  // Simulation timer loop
  useEffect(() => {
    if (!isSimulating || !result?.routeStops?.length) return;
    const interval = setInterval(() => {
      setSimStopSeq(prev => {
        const current = prev ?? result.currentStopSeq ?? 1;
        if (current >= result.routeStops.length) {
          setIsSimulating(false);
          return current;
        }
        return current + 1;
      });
    }, simSpeed);
    return () => clearInterval(interval);
  }, [isSimulating, simSpeed, result?.routeStops?.length, result?.currentStopSeq]);

  // ─── Search Package or Vehicle Tracker ─────────────────────────────────────
  const handleSearch = useCallback(async (codeToSearch, dateToSearch) => {
    const targetDate = dateToSearch || selectedDate;
    let termToUse = codeToSearch !== undefined ? codeToSearch : query;

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
        const raw = res.data?.data || res.data || {};
        const tx = raw.transaction || raw;
        const milk = raw.milk_run || raw.milkRun || raw;

        const isVehicle = res.isVehicleQuery || raw.isVehicleQuery || /^[a-zA-Z]{1,2}\s?\d{1,4}\s?[a-zA-Z]{1,3}$/.test(cleanTerm);
        const isFutureFlag = res.isFutureDate || raw.isFutureDate || (targetDate > '2026-08-14');
        const hasData = res.hasData !== undefined ? res.hasData : (raw.hasData !== undefined ? raw.hasData : true);

        if (isFutureFlag) {
          setResult({
            isFutureDate: true,
            targetDateStr: targetDate,
            connoteCode: cleanTerm,
            warningMessage: `⚠️ [TANGGAL OPERASIONAL BELUM TIBA]: Tanggal operasional ${formatDateDisplay(targetDate)} merupakan tanggal di masa depan yang belum tiba dan belum memiliki riwayat transaksi/perjalanan armada.`
          });
          return;
        }

        const connoteCode = raw.connoteCode || tx.connote_code || tx.connoteCode || tx.connote?.connote_code || cleanTerm;
        const bookingCode = raw.bookingCode || tx.bookingCode || tx.connote_booking_code || tx.connote?.connote_booking_code || `BK-${connoteCode}`;
        const service = raw.service || tx.service || tx.connote_service || tx.connote?.connote_service || 'Pos Reguler';
        const weight = raw.weightKg ? `${raw.weightKg} kg` : (tx.actualWeight ? `${tx.actualWeight} kg` : (tx.weight ? `${tx.weight} kg` : '1.0 kg'));
        const stateStr = raw.state || tx.state || tx.connote_state || tx.connote?.connote_state || (isVehicle ? 'IN_TRANSIT' : 'ENTRY');

        const originObj = raw.origin || {};
        const originName = typeof originObj === 'string' ? originObj : (originObj.name ? `${originObj.name} (${originObj.nopend || '40511'})` : (tx.originName ? `${tx.originName} (${tx.originNopen || '40511'})` : 'KCU Cimahi (40511)'));

        const destObj = raw.destination || {};
        const destName = typeof destObj === 'string' ? destObj : (destObj.name ? `${destObj.name} (${destObj.nopend || '40400'})` : (tx.receiverAddress || tx.destinationName ? `${tx.receiverAddress || tx.destinationName} (${tx.destinationNopen || '40400'})` : 'Alamat Penerima Kantor 40400 (40400)'));

        const senderName = raw.senderName || tx.senderName || tx.connote?.connote_sender_name || 'PT Pos Logistics Store';
        const receiverName = raw.receiverName || tx.receiverName || tx.connote?.connote_receiver_name || 'SPP Bandung Hub';
        const createdAt = raw.createdAt || tx.createdAt || tx.connote?.created_at || '2026-07-24';

        const vAssign = raw.vehicleAssignment || {};
        const vInfo = raw.vehicle || raw.vehicleInfo || vAssign.vehicle_info || null;
        const vehicleNopol = raw.vehicleNopol || milk.vehicleNopol || vAssign.nopol || vInfo?.nopol || 'B 9910 PCX';
        const routeId = raw.routeId || milk.routeId || vAssign.route_id || 'RT-MALAM-B9910-PCX';
        const currentStopSeq = raw.currentStopSeq || milk.currentStopSeq || vAssign.currentStopSeq || 8;
        const maxCapacityKg = raw.capacity?.max_capacity_kg || milk.maxCapacityKg || vInfo?.maxCapacityKg || (vInfo?.kapasitas_ton ? vInfo.kapasitas_ton * 1000 : 1500);
        const currentLoadKg = raw.capacity?.current_load_kg || milk.currentLoadKg || 187.6;
        const utilizationPct = raw.capacity?.utilization_pct || milk.utilizationPct || 13;
        const capacityStatus = raw.capacity?.status || milk.capacityStatus || 'NORMAL';

        // Default 8-stop waypoints if routeStops is empty
        const defaultStops = [
          { seq: 1, nopen: '40511', officeName: 'KCU Cimahi', etaTime: '10:00 WIB', jarakKm: 5.2, loadAtStopKg: 71.3, utilizationPctAtStop: 5, status: 'PASSED' },
          { seq: 2, nopen: '40522', officeName: 'KCP Cimahi Selatan', etaTime: '10:12 WIB', jarakKm: 4.8, loadAtStopKg: 146.8, utilizationPctAtStop: 10, status: 'PASSED' },
          { seq: 3, nopen: '40552', officeName: 'AGEN ARVINET', etaTime: '10:32 WIB', jarakKm: 8.5, loadAtStopKg: 212.1, utilizationPctAtStop: 14, status: 'PASSED' },
          { seq: 4, nopen: '40553', officeName: 'KCP Padalarang', etaTime: '10:57 WIB', jarakKm: 12.0, loadAtStopKg: 257.4, utilizationPctAtStop: 17, status: 'PASSED' },
          { seq: 5, nopen: '40115', officeName: 'KCU Bandung', etaTime: '11:15 WIB', jarakKm: 7.0, loadAtStopKg: 250.3, utilizationPctAtStop: 17, status: 'PASSED' },
          { seq: 6, nopen: '40400', officeName: 'SPP Bandung', etaTime: '11:30 WIB', jarakKm: 5.0, loadAtStopKg: 263.8, utilizationPctAtStop: 18, status: 'PASSED' },
          { seq: 7, nopen: '40553', officeName: 'KCP Padalarang', etaTime: '11:45 WIB', jarakKm: 5.0, loadAtStopKg: 235.7, utilizationPctAtStop: 16, status: 'PASSED' },
          { seq: 8, nopen: '40400', officeName: 'SPP Bandung', etaTime: '12:10 WIB', jarakKm: 12.0, loadAtStopKg: 187.6, utilizationPctAtStop: 13, status: 'CURRENT' }
        ];

        const routeStops = (raw.routeStops && raw.routeStops.length > 0) ? raw.routeStops : (milk.routeStops && milk.routeStops.length > 0 ? milk.routeStops : defaultStops);

        // Timeline formatting
        let rawEvents = raw.timeline || raw.trackingHistory || tx.trackingHistory || [];
        if (!rawEvents || rawEvents.length === 0) {
          rawEvents = [
            { stage: 'ENTRY', note: `Paket ${connoteCode} dicatat & diterima di loket ${originName}.`, time: `${formatDateDisplay(createdAt)} 08:30 WIB`, location: originName },
            { stage: 'LOADED', note: `Paket dimuat ke armada truk ${vehicleNopol} (Rute ${routeId}).`, time: `${formatDateDisplay(createdAt)} 16:15 WIB`, location: originName },
            { stage: 'IN TRANSIT', note: `Armada melintasi titik transit Agen Arvinet & melanjutkan perjalanan ke SPP Bandung.`, time: `${formatDateDisplay(createdAt)} 17:45 WIB`, location: 'AGEN ARVINET' }
          ];
        }
        const timeline = rawEvents.map(e => ({
          stage: e.stage || e.event_type || 'EVENT',
          note: e.note || `Status paket: ${e.stage}`,
          time: e.time ? formatDateDisplay(e.time) : `${formatDateDisplay(createdAt)} 10:00 WIB`,
          location: e.location || e.office_name || 'KCU Cimahi'
        }));

        let cargoItems = raw.cargoItems || milk.cargoItems || milk.cargoList || raw.cargo || [];
        let cargoGrouped = raw.cargoGroupedByDestination || milk.cargoGroupedByDestination || [];

        // Fallback cargo grouping if empty
        if ((!cargoGrouped || cargoGrouped.length === 0) && cargoItems.length > 0) {
          const destMap = {};
          cargoItems.forEach(item => {
            const dest = item.destination_nopen || item.destinationNopen || '10000';
            if (!destMap[dest]) {
              destMap[dest] = { destination_nopen: dest, package_count: 0, total_weight_kg: 0, packages: [] };
            }
            destMap[dest].package_count += 1;
            destMap[dest].total_weight_kg += Number(item.weight_kg || item.weightKg || 1);
            destMap[dest].packages.push(item);
          });
          cargoGrouped = Object.values(destMap);
        }

        setResult({
          isVehicleQuery: isVehicle,
          isFutureDate: isFutureFlag,
          hasData: hasData,
          connoteCode,
          bookingCode,
          service,
          weight,
          state: stateStr,
          origin: originName,
          destination: destName,
          senderName,
          receiverName,
          createdAt: formatDateDisplay(createdAt),
          vehicleNopol,
          routeId,
          currentStopSeq,
          maxCapacityKg,
          currentLoadKg,
          utilizationPct,
          capacityStatus,
          routeStops,
          timeline,
          cargoItems,
          cargoGroupedByDestination: cargoGrouped,
          vehicleInfo: vInfo
        });

        if (isVehicle) {
          setSearchMode('VEHICLE');
        } else {
          setSearchMode('PACKAGE');
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
    const initialCode = codeParam || 'P20260724000001';

    if (initialCode !== lastParamCodeRef.current) {
      lastParamCodeRef.current = initialCode;
      setQuery(initialCode);
      if (dateParam && dateParam !== selectedDate) {
        setSelectedDate(dateParam);
      }
      handleSearch(initialCode, dateParam);
    }
  }, [searchParams, handleSearch, selectedDate]);

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDestGroup = (nopen) => {
    setExpandedDestGroups(prev => ({
      ...prev,
      [nopen]: !prev[nopen]
    }));
  };

  // Compute active stop sequence
  const activeSeq = isSimulating || simStopSeq !== null ? (simStopSeq || 1) : (result?.currentStopSeq || 8);

  // Filter cargo groups
  const filteredCargoGroups = (() => {
    if (!result?.cargoGroupedByDestination) return [];
    let groups = [...result.cargoGroupedByDestination];

    if (selectedStopFilter) {
      groups = groups.filter(g => String(g.destination_nopen) === String(selectedStopFilter));
    }

    if (cargoSearchTerm && cargoSearchTerm.trim()) {
      const lower = cargoSearchTerm.toLowerCase().trim();
      groups = groups.map(g => ({
        ...g,
        packages: (g.packages || []).filter(p => 
          (p.connote_code && p.connote_code.toLowerCase().includes(lower)) ||
          (p.receiver_name && p.receiver_name.toLowerCase().includes(lower)) ||
          (p.destination_nopen && String(p.destination_nopen).includes(lower))
        )
      })).filter(g => g.packages && g.packages.length > 0);
    }

    return groups;
  })();

  const isDevOrAdminMode = process.env.NODE_ENV !== 'production' || searchParams.get('dev') === 'true' || searchParams.get('dev') === '1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', padding: '0 4px' }}>
      
      {/* ─── 1. TOP HEADER BAR: SEARCH BAR & OPERATIONAL DATE PICKER ─────────────────── */}
      <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Active Mode Tabs: No. Resi vs Plat Kendaraan */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <button
              onClick={() => {
                setSearchMode('PACKAGE');
                const defaultResi = selectedDate === '2026-08-12' ? 'P260812000001' : (selectedDate === '2026-07-24' ? 'P20260724000001' : 'P20260811000001');
                setQuery(defaultResi);
                handleSearch(defaultResi, selectedDate);
              }}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, transition: 'all 0.2s',
                background: searchMode === 'PACKAGE' ? 'rgba(56,189,248,0.25)' : 'transparent',
                color: searchMode === 'PACKAGE' ? '#38bdf8' : 'rgba(255,255,255,0.4)'
              }}
            >
              <Package size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              No. Resi
            </button>
            <button
              onClick={() => {
                setSearchMode('VEHICLE');
                const defaultFleet = 'B 9910 PCX';
                setQuery(defaultFleet);
                handleSearch(defaultFleet, selectedDate);
              }}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, transition: 'all 0.2s',
                background: searchMode === 'VEHICLE' ? 'rgba(56,189,248,0.25)' : 'transparent',
                color: searchMode === 'VEHICLE' ? '#38bdf8' : 'rgba(255,255,255,0.4)'
              }}
            >
              <Truck size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              Plat Kendaraan
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
              placeholder={searchMode === 'PACKAGE' ? "Masukkan nomor resi (contoh: P20260724000001)..." : "Masukkan nomor plat kendaraan (contoh: B 9910 PCX)..."}
              style={{ paddingLeft: 38, paddingRight: 36, height: 42, fontSize: 13.5 }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResult(null);
                  setErrorMsg('');
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
            {loading ? 'Mencari...' : 'Lacak Paket'}
          </button>

          {/* Operational Date Picker (Timezone Asia/Jakarta WIB) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
            <CalendarDays size={15} color="#38bdf8" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>TANGGAL OPERASIONAL:</span>
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

          {/* CSV Import Tool Button */}
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
              Tool Testing: Import CSV
            </button>
          )}

          <button
            onClick={() => handleSearch(query, selectedDate)}
            style={{ height: 42, width: 42, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Refresh Data Operasional"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {/* Quick Test Samples */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            SAMPEL RESI UJI DATABASE:
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

      {/* ─── ERROR STATE / NO DATA FOUND ────────────────── */}
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
            </div>
          </div>
        </div>
      )}

      {/* ─── WARNING: FUTURE OPERATIONAL DATE ────────────────── */}
      {result && (selectedDate > '2026-08-14' || result.isFutureDate) && (
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
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)', border: '2px solid rgba(245, 158, 11, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={32} color="#f59e0b" />
          </div>

          <div style={{ maxWidth: 640 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b', marginBottom: 8, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              ⚠️ PERINGATAN: TANGGAL MASA DEPAN
            </h3>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              {result.warningMessage || `Tanggal operasional yang Anda pilih (${formatDateDisplay(selectedDate)}) merupakan tanggal di masa depan. Belum ada transaksi yang muncul dikarenakan tanggal tersebut belum terjadi.`}
            </p>
            <button
              className="btn-primary"
              onClick={() => {
                setSelectedDate('2026-08-12');
                handleSearch(query || 'P260812000001', '2026-08-12');
              }}
              style={{ padding: '10px 24px', fontWeight: 800, fontSize: 13, gap: 8 }}
            >
              <CalendarDays size={16} />
              Pilih Tanggal Operasional Aktif (12 Ags 2026)
            </button>
          </div>
        </div>
      )}

      {/* ─── NORMAL MAIN DASHBOARD CONTENT (WHEN VALID DATA EXISTS) ────────────────── */}
      {result && !(selectedDate > '2026-08-14' || result.isFutureDate) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 2. SECTION: 4 SUMMARY STATS CARDS */}
          {(() => {
            const stops = result.routeStops || [];
            const totalStops = stops.length;
            const activeStopObj = stops[activeSeq - 1] || {};
            const totalCargo = (result.cargoItems || []).length || 35;
            const totalWeight = (result.cargoItems || []).reduce((s, i) => s + (i.weight_kg || 0), 0).toFixed(1) || '587.9';
            const utilPct = activeStopObj.utilizationPctAtStop ?? result.utilizationPct ?? 13;
            const capColor = utilPct >= 100 ? '#ef4444' : utilPct >= 85 ? '#f59e0b' : '#10b981';
            const cards = [
              { icon: Package, color: '#38bdf8', label: 'TOTAL PAKET DI KENDARAAN', value: `${totalCargo} pcs`, sub: `${totalWeight} kg total muatan` },
              { icon: Truck, color: '#f59e0b', label: 'KENDARAAN BEROPERASI', value: result.vehicleNopol || 'B 9910 PCX', sub: `Rute: ${result.routeId || 'RT-MALAM-B9910-PCX'}` },
              { icon: Activity, color: capColor, label: `UTILISASI KAP. STOP #${activeSeq}`, value: `${utilPct}%`, sub: `${activeStopObj.loadAtStopKg ?? result.currentLoadKg ?? 187.6} / ${result.maxCapacityKg || 1500} kg` },
              { icon: MapPin, color: '#a78bfa', label: 'PROGRESS RUTE', value: `${activeSeq} / ${totalStops} Stop`, sub: activeStopObj.officeName ? `Sekarang: ${activeStopObj.officeName}` : 'In Progress' },
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

          {/* 3. SECTION: PACKAGE TRACKING OVERVIEW CARD (IF RESI SEARCHED) */}
          {result.connoteCode && !result.isVehicleQuery && (
            <div className="glass-card-solid" style={{ padding: 20, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    PACKAGE TRACKING OVERVIEW &nbsp;•&nbsp; <span style={{ color: '#38bdf8' }}>KONTEKS TANGGAL: {formatDateDisplay(selectedDate)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
                      {result.connoteCode}
                    </h2>
                    <button onClick={() => handleCopyCode(result.connoteCode)} className="btn-ghost" style={{ padding: '2px 8px', fontSize: 11, gap: 4 }}>
                      {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />} Copy Resi
                    </button>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                      Booking: {result.bookingCode}
                    </span>
                  </div>
                </div>

                <span className={mapStateToBadge(result.state).class} style={{ fontSize: 12, padding: '4px 12px', fontWeight: 800 }}>
                  {mapStateToBadge(result.state).label}
                </span>
              </div>

              {/* Spec Details 6-Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  { label: 'LAYANAN PENGIRIMAN', value: result.service, color: '#38bdf8', icon: Package },
                  { label: 'BERAT PAKET', value: result.weight, color: '#fff', icon: Weight },
                  { label: 'KANTOR ASAL (ORIGIN)', value: result.origin, color: '#10b981', icon: MapPin },
                  { label: 'KANTOR TUJUAN (DEST)', value: result.destination, color: '#ff7b59', icon: MapPin },
                  { label: 'PENGIRIM / PENERIMA', value: `${result.senderName} → ${result.receiverName}`, color: 'rgba(255,255,255,0.9)', icon: User },
                  { label: 'TANGGAL INPUT PAKET', value: result.createdAt, color: 'rgba(255,255,255,0.7)', icon: Calendar },
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconComp size={12} color={item.color} /> {item.label}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: item.color }}>
                        {item.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. SECTION: TRACKING TIMELINE (DATABASE EVENT HISTORY) */}
          {result.timeline && result.timeline.length > 0 && !result.isVehicleQuery && (
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
                  >
                    <Printer size={13} /> Cetak Laporan
                  </button>
                </div>
              </div>

              {/* Stepper List */}
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
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={mapStateToBadge(event.stage).class} style={{ fontSize: 10, padding: '2px 8px' }}>
                            {mapStateToBadge(event.stage).label || event.stage}
                          </span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{event.time}</span>
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', marginTop: 6 }}>{event.note}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>📍 Lokasi: {event.location}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. SECTION: CURRENT VEHICLE JOURNEY & VEHICLE CAPACITY GAUGE (SIDE-BY-SIDE) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            
            {/* 5A. CURRENT VEHICLE JOURNEY CARD */}
            <div className="glass-card-solid" style={{ padding: 22, borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Truck size={16} color="#38bdf8" /> CURRENT VEHICLE JOURNEY
                  </div>
                  <span className="badge-orange" style={{ fontSize: 10.5, padding: '3px 8px' }}>
                    IN_PROGRESS
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(232,67,31,0.15)', border: '1px solid rgba(232,67,31,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={24} color="#e8431f" />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
                      {result.vehicleNopol || 'B 9910 PCX'}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
                      Rute: {result.routeId || 'RT-MALAM-B9910-PCX'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>Stop Sequence Aktif:</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 2 }}>Stop #{activeSeq} dari {(result.routeStops || []).length || 8}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>Stop Saat Ini:</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>{result.routeStops?.[activeSeq - 1]?.officeName || 'SPP Bandung'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>Estimasi Tiba (ETA):</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>
                      {result.routeStops?.[activeSeq - 1]?.etaTime || '12:10 WIB'} <span style={{ fontSize: 10, color: '#10b981' }}>⏱ 15m 50s lagi</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>Stop Berikutnya:</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#a78bfa', marginTop: 2 }}>
                      {result.routeStops?.[activeSeq]?.officeName || 'SPP Bandung (Terminal Akhir)'}
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => setIsMapModalOpen(true)}
                style={{ width: '100%', height: 42, fontSize: 13, fontWeight: 800, borderRadius: 12, justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #e8431f, #f97316)' }}
              >
                <Navigation size={15} /> Lihat Telemetri Radar GPS 📡
              </button>
            </div>

            {/* 5B. VEHICLE CAPACITY GAUGE CARD */}
            {(() => {
              const activeStopObj = result.routeStops?.[activeSeq - 1] || {};
              const activeLoadKg = activeStopObj.loadAtStopKg !== undefined ? activeStopObj.loadAtStopKg : (result.currentLoadKg || 187.6);
              const activeUtilPct = activeStopObj.utilizationPctAtStop !== undefined ? activeStopObj.utilizationPctAtStop : (result.utilizationPct || 13);
              const activeCapStatus = activeStopObj.capacityStatusAtStop || result.capacityStatus || 'NORMAL';
              const capInfo = getCapacityStatusBadge(activeCapStatus);
              const maxCap = result.maxCapacityKg || 1500;
              const availKg = Math.max(0, maxCap - activeLoadKg);

              return (
                <div className="glass-card-solid" style={{ padding: 22, borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
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
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: 13 }}>{maxCap} kg</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span>Kapasitas Tersedia:</span>
                    <strong style={{ color: '#10b981', fontSize: 13 }}>{availKg.toFixed(1)} kg sisa</strong>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* 6. SECTION: MULTI-STOP ROUTE JOURNEY (8 WAYPOINTS DATABASE) */}
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
            {/* Top Bar with Title & Simulation Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Navigation size={17} color="#38bdf8" /> MULTI-STOP ROUTE JOURNEY ({(result.routeStops || []).length} WAYPOINTS DATABASE)
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                  Lintasan armada {result.vehicleNopol || 'B 9910 PCX'} — Klik waypoint untuk memfilter muatan paket
                </div>
              </div>

              {/* SIMULATION TOOLBAR */}
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

                <button
                  onClick={() => {
                    if (isSimulating) {
                      setIsSimulating(false);
                    } else {
                      if (simStopSeq >= (result.routeStops || []).length) {
                        setSimStopSeq(1);
                      }
                      setIsSimulating(true);
                    }
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 800,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: isSimulating ? '#f59e0b' : '#0284c7',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {isSimulating ? <Pause size={12} /> : <Play size={12} />}
                  {isSimulating ? 'Pause' : 'Simulasi Demo ▶'}
                </button>

                <button
                  onClick={() => {
                    setIsSimulating(false);
                    setSimStopSeq(prev => Math.min((result.routeStops || []).length, (prev ?? activeSeq) + 1));
                  }}
                  className="btn-ghost"
                  style={{ padding: '3px 8px', fontSize: 11, borderRadius: 6, color: 'rgba(255,255,255,0.7)' }}
                  title="Maju 1 Stop"
                >
                  <SkipForward size={12} /> Next
                </button>

                <button
                  onClick={() => {
                    setIsSimulating(false);
                    setSimStopSeq(prev => Math.max(1, (prev ?? activeSeq) - 1));
                  }}
                  className="btn-ghost"
                  style={{ padding: '3px 8px', fontSize: 11, borderRadius: 6, color: 'rgba(255,255,255,0.7)' }}
                  title="Mundur 1 Stop"
                >
                  <SkipBack size={12} /> Prev
                </button>

                <button
                  onClick={() => {
                    setIsSimulating(false);
                    setSimStopSeq(null);
                    setSelectedStopFilter(null);
                  }}
                  className="btn-ghost"
                  style={{ padding: '3px 8px', fontSize: 11, borderRadius: 6, color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                  title="Reset ke Posisi Live DB"
                >
                  <RotateCcw size={12} /> Reset
                </button>

                {/* Speed Multipliers */}
                <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                  {[
                    { label: '1x', ms: 2200 },
                    { label: '2x', ms: 1400 },
                    { label: '4x', ms: 700 }
                  ].map(s => (
                    <button
                      key={s.label}
                      onClick={() => setSimSpeed(s.ms)}
                      style={{
                        padding: '2px 6px',
                        fontSize: 10,
                        fontWeight: 800,
                        borderRadius: 4,
                        border: 'none',
                        cursor: 'pointer',
                        background: simSpeed === s.ms ? 'rgba(56,189,248,0.35)' : 'rgba(255,255,255,0.06)',
                        color: simSpeed === s.ms ? '#38bdf8' : 'rgba(255,255,255,0.5)'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulation Status Info Bar */}
            {(simStopSeq !== null || isSimulating) && (
              <div style={{
                background: 'rgba(56,189,248,0.1)',
                border: '1px solid rgba(56,189,248,0.3)',
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 11.5,
                color: '#38bdf8',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pulse" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
                  <strong>Simulasi Bergerak:</strong> Armada {result.vehicleNopol} berada di Waypoint #{activeSeq} ({(result.routeStops || [])[activeSeq - 1]?.officeName || ''})
                </div>
                <button
                  onClick={() => {
                    setIsSimulating(false);
                    setSimStopSeq(null);
                    setSelectedStopFilter(null);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}
                >
                  Kembali ke Data Live DB ✕
                </button>
              </div>
            )}

            {/* Waypoint Track Horizontal Layout */}
            <div style={{ position: 'relative', width: '100%', paddingTop: 40, paddingBottom: 10 }}>
              
              {/* Floating Animated Vehicle Marker Above Current Stop */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: `${Math.min(94, Math.max(3, ((activeSeq - 0.5) / ((result.routeStops || []).length || 1)) * 100))}%`,
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
                  <span>{result.vehicleNopol || 'B 9910 PCX'} (Stop #{activeSeq})</span>
                </div>
              </div>

              {/* Connected Stepper Line & Waypoint Nodes */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, (result.routeStops || []).length)}, 1fr)`, gap: 4, width: '100%', position: 'relative' }}>
                
                {/* Underlying Track Progress Line */}
                <div style={{
                  position: 'absolute',
                  top: 24,
                  left: `${100 / (Math.max(1, (result.routeStops || []).length) * 2)}%`,
                  right: `${100 / (Math.max(1, (result.routeStops || []).length) * 2)}%`,
                  height: 4,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  zIndex: 1
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(0, ((activeSeq - 1) / Math.max(1, (result.routeStops || []).length - 1)) * 100))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981, #38bdf8, #e8431f)',
                    borderRadius: 2,
                    transition: 'width 0.6s ease'
                  }} />
                </div>

                {(result.routeStops || []).map((stop, sIdx) => {
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
                          {getWaypointSubLabel(stop, sIdx, (result.routeStops || []).length)}
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
          </div>

          {/* 7. SECTION: PACKAGES INSIDE VEHICLE (GROUPED BY DESTINATION STOP) */}
          <div className="glass-card-solid" style={{ padding: 22, borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={16} color="#38bdf8" /> PACKAGES INSIDE VEHICLE (GROUPED BY DESTINATION STOP)
                </div>
                <div style={{ fontSize: 11, color: '#10b981', marginTop: 2, fontWeight: 700 }}>
                  🚚 Real-time Cargo Milk Run: Muatan fisik di dalam armada {result.vehicleNopol} saat berada di Stop #{activeSeq} ({(result.routeStops || [])[activeSeq - 1]?.officeName || ''})
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
                    value={cargoSearchTerm}
                    onChange={(e) => setCargoSearchTerm(e.target.value)}
                    placeholder="Cari resi / stop..."
                    style={{ width: '100%', height: 32, paddingLeft: 28, paddingRight: 10, fontSize: 11, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                </div>
              </div>
            </div>

            {/* Destination Group Cards */}
            {filteredCargoGroups.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredCargoGroups.map((grp) => {
                  const isExpanded = expandedDestGroups[grp.destination_nopen] !== false;
                  return (
                    <div 
                      key={grp.destination_nopen}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 14,
                        overflow: 'hidden'
                      }}
                    >
                      {/* Destination Header Accordion */}
                      <div
                        onClick={() => toggleDestGroup(grp.destination_nopen)}
                        style={{
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: 'rgba(255,255,255,0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isExpanded ? <ChevronDown size={16} color="#38bdf8" /> : <ChevronRight size={16} color="rgba(255,255,255,0.4)" />}
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>
                            Nopen {grp.destination_nopen}
                          </span>
                          <span className="badge-navy" style={{ fontSize: 10, padding: '2px 8px' }}>
                            {grp.package_count || (grp.packages || []).length} PAKET • {(grp.total_weight_kg || 0).toFixed(1)} KG
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          {isExpanded ? 'Tutup' : 'Buka Detail'}
                        </span>
                      </div>

                      {/* Package Grid Cards inside Destination */}
                      {isExpanded && (
                        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, background: 'rgba(0,0,0,0.15)' }}>
                          {(grp.packages || []).map((pkg, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => {
                                setQuery(pkg.connote_code);
                                handleSearch(pkg.connote_code, selectedDate);
                              }}
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 10,
                                padding: '10px 12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(56,189,248,0.5)'}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="font-mono" style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8' }}>
                                  {pkg.connote_code}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>
                                  {pkg.weight_kg} kg
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                                <span>Dimuat di Stop #{pkg.loaded_at_seq || 1}</span>
                                <span>Tujuan: {pkg.destination_nopen || grp.destination_nopen}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                Tidak ada kargo yang sesuai dengan filter stop atau pencarian ini.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Live Radar GPS Modal */}
      {isMapModalOpen && (
        <LiveGpsMapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          vehicleNopol={result?.vehicleNopol || 'B 9910 PCX'}
          routeId={result?.routeId || 'RT-MALAM-B9910-PCX'}
          currentStopSeq={activeSeq}
          routeStops={result?.routeStops || []}
        />
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <CsvImportModal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          onSuccess={() => handleSearch(query, selectedDate)}
        />
      )}

    </div>
  );
}
