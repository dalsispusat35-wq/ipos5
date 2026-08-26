import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, CheckCircle2, Circle, Clock, Package, Truck, Navigation, 
  Copy, Check, RefreshCw, ShieldCheck, Zap, X, Filter, Eye,
  Calendar, CalendarDays, ArrowRight, Layers, FileSpreadsheet,
  AlertCircle, AlertTriangle, ChevronDown, ChevronRight, ChevronLeft, User, Building2, Weight,
  Car, TrendingUp, Activity, BoxIcon, Timer, AlertOctagon, Info, ArrowUpRight,
  Printer, History, Sparkles, Pause, Play, SkipForward, SkipBack, RotateCcw,
  ListFilter, LayoutGrid, Table, Phone, Gauge, CheckSquare
} from 'lucide-react';
import { api } from '../utils/api.js';
import LiveGpsMapModal from '../components/LiveGpsMapModal.jsx';
import CsvImportModal from '../components/CsvImportModal.jsx';

// ─── Pure Helper Functions ──────────────────────────────────────────────────
const getTodayWibStr = () => {
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

const SAMPLE_RESIS = [
  { code: 'P260820010001', date: getTodayWibStr(), label: 'Cimahicisangkan → SPP Bandung (B 9910 PCX)', badge: 'Hari Ini (B 9910 PCX)', badgeClass: 'badge-emerald' },
  { code: 'P260820020001', date: getTodayWibStr(), label: 'Cimindi → SPP Bandung (D 8812 AB)', badge: 'Hari Ini (D 8812 AB)', badgeClass: 'badge-blue' },
  { code: 'P260820030001', date: getTodayWibStr(), label: 'KCU Asia Afrika → SPP Bandung (B 9945 PCY)', badge: 'Hari Ini (B 9945 PCY)', badgeClass: 'badge-purple' },
  { code: 'P260812000001', date: '2026-08-12', label: 'Resi 12 Aug (B 9910 PCX)', badge: '12 Aug (Historis)', badgeClass: 'badge-navy' }
];

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
  if (s.includes('TRANSIT') || s.includes('IN_TRANSIT')) return { label: 'IN TRANSIT', class: 'badge-blue' };
  if (s.includes('LOADED') || s.includes('MANIFEST')) return { label: 'LOADED', class: 'badge-blue' };
  return { label: s, class: 'badge-navy' };
};

const getCapacityStatusBadge = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'OVER CAPACITY':
      return { label: 'OVER CAPACITY', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' };
    case 'FULL':
      return { label: 'FULL', color: '#f97316', bg: '#fff7ed', border: '#fdba74' };
    case 'NEAR CAPACITY':
      return { label: 'NEAR CAPACITY', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    default:
      return { label: 'NORMAL', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  }
};

const getWaypointSubLabel = (stop, idx, total) => {
  if (idx === 0) return 'Titik Awal / Origin';
  if (idx === total - 1) return 'Titik Akhir / Tujuan';
  return `Transit Stop #${stop?.seq || idx + 1}`;
};

// ─── Paginated Destination Group Accordion Component ────────────────────────
function PaginatedGroupCard({
  grp,
  isExpanded,
  onToggle,
  formatWeight,
  mapStateToBadge
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const packages = grp.packages || [];
  const totalPackages = packages.length;
  const totalPages = Math.max(1, Math.ceil(totalPackages / pageSize));
  
  // Safe bounded page number
  const safePage = Math.min(currentPage, totalPages);

  // Sync current page if totalPackages shrink
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPackages, totalPages, currentPage]);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalPackages);
  const currentPackages = packages.slice(startIndex, endIndex);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div 
      className="surface-card"
      style={{
        padding: 0,
        overflow: 'hidden'
      }}
    >
      {/* Accordion Group Header */}
      <div
        onClick={onToggle}
        style={{
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: 'var(--bg-surface-soft)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isExpanded ? <ChevronDown size={16} color="var(--primary-blue)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={14} color="var(--primary-blue)" /> {grp.destination_office_name || `Kantor Tujuan ${grp.destination_nopen}`}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            (Nopen: {grp.destination_nopen})
          </span>
          <span className="badge badge-navy" style={{ fontSize: 10, padding: '2px 8px' }}>
            {totalPackages} PAKET • {(grp.total_weight_kg || 0).toFixed(1)} KG
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          {isExpanded ? <>Tutup <ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} /></> : <>Buka Rincian <ChevronDown size={12} /></>}
        </span>
      </div>

      {/* Accordion Content Body (Paginated Table) */}
      {isExpanded && (
        <div style={{ padding: '8px 16px 16px' }}>
          <div className="table-responsive-container" style={{ border: 'none', background: 'transparent' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px 6px', width: 36 }}>#</th>
                  <th style={{ padding: '8px 6px' }}>NO RESI</th>
                  <th style={{ padding: '8px 6px' }}>LAYANAN</th>
                  <th style={{ padding: '8px 6px' }}>BERAT</th>
                  <th style={{ padding: '8px 6px' }}>PENGIRIM / PENERIMA</th>
                  <th style={{ padding: '8px 6px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {currentPackages.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Tidak ada paket pada tujuan ini
                    </td>
                  </tr>
                ) : (
                  currentPackages.map((pkg, idx) => (
                    <tr key={pkg.connote_code || idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '8px 6px', color: 'var(--text-muted)', fontSize: 10.5, fontFamily: 'monospace' }}>
                        {startIndex + idx + 1}
                      </td>
                      <td style={{ padding: '8px 6px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary-blue)' }}>
                        {pkg.connote_code}
                      </td>
                      <td style={{ padding: '8px 6px', color: 'var(--text-secondary)' }}>
                        {pkg.service}
                      </td>
                      <td style={{ padding: '8px 6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatWeight(pkg.weight_kg)}
                      </td>
                      <td style={{ padding: '8px 6px', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{pkg.sender_name || 'Pengirim'}</span> <ArrowRight size={11} style={{ display: 'inline', margin: '0 3px', color: 'var(--text-muted)' }} /> <strong style={{ color: 'var(--text-primary)' }}>{pkg.receiver_name || 'Penerima'}</strong>
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        <span className={mapStateToBadge(pkg.state).class} style={{ fontSize: 9.5, padding: '2px 7px' }}>
                          {mapStateToBadge(pkg.state).label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Group Pagination Controls */}
          {totalPackages > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              paddingTop: 12,
              marginTop: 8,
              borderTop: '1px solid var(--border-light)',
              fontSize: 11.5
            }}>
              {/* Summary text & Page size selector (20, 50, 100) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--text-secondary)' }}>
                <span>
                  Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{startIndex + 1}</strong> - <strong style={{ color: 'var(--text-primary)' }}>{endIndex}</strong> dari <strong style={{ color: 'var(--text-primary)' }}>{totalPackages}</strong> paket
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tampilkan:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    style={{
                      background: 'var(--bg-workspace)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      color: 'var(--text-primary)',
                      fontSize: 11,
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value={20}>20 / hal</option>
                    <option value={50}>50 / hal</option>
                    <option value={100}>100 / hal</option>
                  </select>
                </div>
              </div>

              {/* Prev / Page Pills / Next Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="btn-ghost"
                  style={{
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: safePage <= 1 ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <ChevronLeft size={13} /> Prev
                </button>

                {/* Page Number Pill Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pNum => {
                      if (totalPages <= 7) return true;
                      if (pNum === 1 || pNum === totalPages) return true;
                      if (Math.abs(pNum - safePage) <= 1) return true;
                      return false;
                    })
                    .reduce((acc, pNum, idx, arr) => {
                      if (idx > 0 && pNum - arr[idx - 1] > 1) {
                        acc.push({ type: 'ellipsis', key: `el-grp-${grp.destination_nopen}-${pNum}` });
                      }
                      acc.push({ type: 'page', value: pNum, key: `p-grp-${grp.destination_nopen}-${pNum}` });
                      return acc;
                    }, [])
                    .map(item => {
                      if (item.type === 'ellipsis') {
                        return <span key={item.key} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
                      }
                      const isAct = item.value === safePage;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setCurrentPage(item.value)}
                          style={{
                            minWidth: 26,
                            height: 26,
                            padding: '0 6px',
                            borderRadius: 6,
                            border: isAct ? '1px solid var(--primary-blue)' : '1px solid transparent',
                            background: isAct ? 'var(--primary-navy)' : 'transparent',
                            color: isAct ? '#ffffff' : 'var(--text-secondary)',
                            fontWeight: isAct ? 800 : 600,
                            fontSize: 11,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {item.value}
                        </button>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="btn-ghost"
                  style={{
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: safePage >= totalPages ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Checker() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'FLEET' vs 'PACKAGE'
  const [searchMode, setSearchMode] = useState(() => {
    const code = searchParams.get('code') || '';
    return code.startsWith('P2') ? 'PACKAGE' : 'FLEET';
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return searchParams.get('date') || getTodayWibStr();
  });

  const [query, setQuery] = useState(() => searchParams.get('code') || 'B 9910 PCX');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Fleet list from database
  const [fleetList, setFleetList] = useState([]);
  const [fleetLoading, setFleetLoading] = useState(false);

  // Bottom cargo display states
  const [cargoSearchTerm, setCargoSearchTerm] = useState('');
  const [expandedDestGroups, setExpandedDestGroups] = useState({});
  const [cargoViewMode, setCargoViewMode] = useState('GROUPED'); // 'GROUPED' vs 'TABLE'
  const [showOnlyNewlyLoaded, setShowOnlyNewlyLoaded] = useState(false);
  const [selectedDestFilter, setSelectedDestFilter] = useState('ALL');
  const [flatTablePage, setFlatTablePage] = useState(1);
  const [flatTablePageSize, setFlatTablePageSize] = useState(20);

  // Auto-Refresh States
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(3000);
  const [lastSyncTime, setLastSyncTime] = useState('');

  // Modals
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Simulation and waypoint states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStopSeq, setSimStopSeq] = useState(null);
  const [simSpeed, setSimSpeed] = useState(1800);
  const [selectedStopFilter, setSelectedStopFilter] = useState(null);

  const lastParamCodeRef = useRef(undefined);

  // Reset flatTablePage when search/filter/view mode changes
  useEffect(() => {
    setFlatTablePage(1);
  }, [cargoSearchTerm, showOnlyNewlyLoaded, selectedDestFilter, selectedStopFilter, cargoViewMode]);

  // Fetch fleet list from database
  const loadFleetList = useCallback(async (targetDate, showSpinner = true) => {
    if (showSpinner) setFleetLoading(true);
    try {
      const res = await api.getFleetList(targetDate);
      if (res && res.success && res.data?.fleet) {
        setFleetList(res.data.fleet);
      } else {
        setFleetList([]);
      }
    } catch (e) {
      console.error('Error fetching fleet list:', e);
      setFleetList([]);
    } finally {
      if (showSpinner) setFleetLoading(false);
    }
  }, []);

  // Main Search / Fetch Package or Vehicle Data from Database
  const handleSearch = useCallback(async (codeToSearch, dateToSearch) => {
    const targetDate = dateToSearch || selectedDate;
    let termToUse = codeToSearch !== undefined ? codeToSearch : query;

    if (!termToUse || !termToUse.trim()) {
      termToUse = searchMode === 'PACKAGE' ? 'P260812000001' : 'B 9910 PCX';
    }

    const cleanTerm = termToUse.trim();
    setQuery(cleanTerm);
    lastParamCodeRef.current = cleanTerm;
    setSearchParams({ code: cleanTerm, date: targetDate });
    setLoading(true);
    setErrorMsg('');
    setSimStopSeq(null);
    setSelectedStopFilter(null);

    try {
      const res = await api.getCheckerData(cleanTerm, targetDate);
      if (res.success && res.data) {
        const raw = res.data?.data || res.data || {};
        const isVehicle = res.isVehicleQuery || raw.isVehicleQuery || /^[a-zA-Z]{1,2}\s?\d{1,4}\s?[a-zA-Z]{1,3}$/.test(cleanTerm);

        const connoteCode = raw.connoteCode || cleanTerm;
        const bookingCode = raw.bookingCode || `BK-${connoteCode}`;
        const service = raw.service || 'Pos Nextday';
        const weight = raw.weightKg !== undefined ? `${raw.weightKg} kg` : (raw.weight ? `${raw.weight} kg` : '1.0 kg');
        const stateStr = raw.state || (isVehicle ? 'IN_TRANSIT' : 'ENTRY');

        const originObj = raw.origin || {};
        const originName = typeof originObj === 'string' ? originObj : (originObj.name ? `${originObj.name} (${originObj.nopend || '40511'})` : 'KCU Cimahi (40511)');

        const destObj = raw.destination || {};
        const destName = typeof destObj === 'string' ? destObj : (destObj.name ? `${destObj.name} (${destObj.nopend || '40400'})` : 'SPP Bandung (40400)');

        const senderName = raw.senderName || 'PT Pos Logistics Store';
        const receiverName = raw.receiverName || 'SPP Bandung Hub';
        const createdAt = raw.createdAt || '2026-08-12';

        const vDoc = raw.vehicle || raw.vehicleInfo || {};
        const vehicleNopol = raw.vehicleNopol || vDoc.nopol || (isVehicle ? cleanTerm : 'B 9910 PCX');
        const routeId = raw.routeId || raw.journey?.route_id || 'RT-MALAM-B9910-PCX';
        const currentStopSeq = raw.currentStopSeq || raw.journey?.current_stop_seq || 1;
        const maxCapacityKg = raw.capacity?.max_capacity_kg || vDoc.max_capacity_kg || 1500;
        const currentLoadKg = raw.capacity?.current_load_kg !== undefined ? raw.capacity.current_load_kg : (raw.totalCargoWeightKg || 0);
        const utilizationPct = raw.capacity?.utilization_pct !== undefined ? raw.capacity.utilization_pct : 0;
        const capacityStatus = raw.capacity?.status || 'NORMAL';

        const routeStops = raw.routeStops || [];
        const timeline = raw.timeline || [];
        const cargoItems = raw.cargoItems || [];
        const cargoGrouped = raw.cargoGroupedByDestination || [];

        setResult({
          isVehicleQuery: isVehicle,
          connoteCode,
          bookingCode,
          service,
          weight,
          state: stateStr,
          origin: originName,
          destination: destName,
          senderName,
          receiverName,
          createdAt,
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
          totalCargoCount: raw.totalCargoCount || cargoItems.length
        });
      } else {
        setErrorMsg(res.message || 'Data tidak ditemukan di database.');
        setResult(null);
      }
    } catch (err) {
      console.error('Error fetching checker data:', err);
      setErrorMsg(err.message || 'Gagal terhubung ke server backend.');
      setResult(null);
    } finally {
      setLoading(false);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [selectedDate, query, searchMode, setSearchParams]);

  // Initial Load
  useEffect(() => {
    loadFleetList(selectedDate);
    handleSearch(query, selectedDate);
  }, []);

  // Background Auto-Refresh Polling Hook
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(async () => {
      try {
        const targetDate = selectedDate;
        loadFleetList(targetDate, false);
        const term = query || (searchMode === 'FLEET' ? 'B 9910 PCX' : 'P260812000001');
        const resData = await api.getCheckerData(term, targetDate);
        if (resData && resData.success && resData.data) {
          const raw = resData.data?.data || resData.data || {};
          setResult(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              currentLoadKg: raw.currentLoadKg ?? raw.capacity?.current_load_kg ?? 0,
              maxCapacityKg: raw.maxCapacityKg ?? raw.capacity?.max_capacity_kg ?? 1500,
              utilizationPct: raw.utilizationPct ?? raw.capacity?.utilization_pct ?? 0,
              totalCargoCount: raw.totalCargoCount ?? (raw.cargoItems || []).length,
              cargoItems: raw.cargoItems || [],
              cargoGroupedByDestination: raw.cargoGroupedByDestination || [],
              routeStops: raw.routeStops || prev.routeStops || []
            };
          });
        }
        setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (e) {
        // silent polling error
      }
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, autoRefreshInterval, selectedDate, query, searchMode, loadFleetList]);

  // Simulation interval timer
  useEffect(() => {
    if (!isSimulating || !result?.routeStops?.length) return;
    const total = result.routeStops.length;
    const timer = setInterval(() => {
      setSimStopSeq(prev => {
        const current = prev ?? (result?.currentStopSeq || 1);
        if (current >= total) {
          setIsSimulating(false);
          return total;
        }
        return current + 1;
      });
    }, simSpeed);
    return () => clearInterval(timer);
  }, [isSimulating, result, simSpeed]);

  const activeSeq = simStopSeq !== null ? simStopSeq : (result?.currentStopSeq || 1);
  const activeStopObj = (result?.routeStops || [])[activeSeq - 1] || {};

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDestGroup = (destNopen) => {
    setExpandedDestGroups(prev => ({
      ...prev,
      [destNopen]: prev[destNopen] === false ? true : false
    }));
  };

  // Filtered Cargo Items
  const filteredCargoItems = useMemo(() => {
    if (!result?.cargoItems) return [];
    let items = result.cargoItems;

    if (showOnlyNewlyLoaded) {
      items = items.filter(i => i.loaded_at_seq === activeSeq);
    }
    if (selectedDestFilter && selectedDestFilter !== 'ALL') {
      items = items.filter(i => String(i.destination_nopen) === String(selectedDestFilter));
    }
    if (selectedStopFilter) {
      items = items.filter(i => String(i.destination_nopen) === String(selectedStopFilter) || String(i.origin_nopen) === String(selectedStopFilter));
    }
    if (cargoSearchTerm.trim()) {
      const q = cargoSearchTerm.toLowerCase();
      items = items.filter(i => 
        (i.connote_code || '').toLowerCase().includes(q) ||
        (i.receiver_name || '').toLowerCase().includes(q) ||
        (i.sender_name || '').toLowerCase().includes(q) ||
        (i.destination_office_name || '').toLowerCase().includes(q) ||
        (i.service || '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [result?.cargoItems, showOnlyNewlyLoaded, selectedDestFilter, selectedStopFilter, cargoSearchTerm, activeSeq]);

  // Grouped Cargo
  const filteredCargoGroups = useMemo(() => {
    if (!result?.cargoGroupedByDestination) return [];
    let groups = result.cargoGroupedByDestination;
    if (selectedDestFilter && selectedDestFilter !== 'ALL') {
      groups = groups.filter(g => String(g.destination_nopen) === String(selectedDestFilter));
    }
    if (selectedStopFilter) {
      groups = groups.filter(g => String(g.destination_nopen) === String(selectedStopFilter));
    }

    if (cargoSearchTerm.trim() || showOnlyNewlyLoaded) {
      const q = cargoSearchTerm.toLowerCase().trim();
      groups = groups.map(g => {
        let pkgs = g.packages || [];
        if (showOnlyNewlyLoaded) {
          pkgs = pkgs.filter(p => p.loaded_at_seq === activeSeq);
        }
        if (q) {
          pkgs = pkgs.filter(p =>
            (p.connote_code || '').toLowerCase().includes(q) ||
            (p.receiver_name || '').toLowerCase().includes(q) ||
            (p.sender_name || '').toLowerCase().includes(q) ||
            (p.service || '').toLowerCase().includes(q)
          );
        }
        return {
          ...g,
          packages: pkgs,
          package_count: pkgs.length,
          total_weight_kg: pkgs.reduce((sum, p) => sum + (p.weight_kg || 0), 0)
        };
      }).filter(g => g.packages.length > 0);
    }

    return groups;
  }, [result?.cargoGroupedByDestination, selectedDestFilter, selectedStopFilter, cargoSearchTerm, showOnlyNewlyLoaded, activeSeq]);

  // Dynamically compute tracking timeline based on activeSeq and routeStops
  const displayTimeline = useMemo(() => {
    if (!result) return [];
    const stops = result.routeStops || [];
    
    if (stops.length > 0) {
      const events = [];
      const stop1 = stops[0] || {};
      
      // Stop #1 Event: Package received / entered at origin
      events.push({
        stage: 'ENTRY',
        time: stop1.etaTime || '10:08 WIB',
        note: `Paket diterima & di-input di Lokasi Asal (${stop1.officeName || result.origin || 'Sangkuriang (Agenpos)'})`,
        location: stop1.officeName || result.origin || 'KCU Cimahi 40500'
      });

      // Manifested event
      events.push({
        stage: 'IN_MANIFEST',
        time: stop1.etaTime ? `${stop1.etaTime}` : '10:10 WIB',
        note: `Dimuat ke manifest armada ${result.vehicleNopol || 'B 9910 PCX'} (Rute: ${result.routeId || 'RT-B9910-CIMAHI'})`,
        location: stop1.officeName || result.origin || 'KCU Cimahi 40500'
      });

      // Events for every visited stop up to activeSeq
      for (let s = 1; s < activeSeq && s < stops.length; s++) {
        const curStop = stops[s];
        const isFinal = s === stops.length - 1;
        
        if (isFinal) {
          events.push({
            stage: 'TIBA_DI_SPP',
            time: curStop.etaTime || '11:15 WIB',
            note: `Armada tiba di Sentral Pengolahan Pos (${curStop.officeName}). Proses bongkar muatan (unloading) & gate sorting scanning.`,
            location: curStop.officeName
          });
        } else {
          events.push({
            stage: 'IN_TRANSIT',
            time: curStop.etaTime || `10:${14 + (s - 1) * 10} WIB`,
            note: `Armada tiba di Stop #${curStop.seq} (${curStop.officeName}). Muatan aktif: ${curStop.loadAtStopKg !== undefined ? curStop.loadAtStopKg : (result.currentLoadKg || 35)} kg (${curStop.utilizationPctAtStop !== undefined ? curStop.utilizationPctAtStop : 2.3}% kapasitas).`,
            location: curStop.officeName
          });
        }
      }

      return events;
    }

    return result.timeline || [];
  }, [result, activeSeq]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', paddingBottom: 24 }}>
      
      {/* ─── 1. TOP CONTROL BAR & SEARCH PANEL ────────────────── */}
      <div className="spatial-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Top Switcher Row: Search Modes & Operational Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          
          {/* Mode Tabs */}
          <div className="surface-soft" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 4, borderRadius: 12 }}>
            <button
              onClick={() => {
                setSearchMode('FLEET');
                setQuery('B 9910 PCX');
                handleSearch('B 9910 PCX', selectedDate);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 800,
                background: searchMode === 'FLEET' ? 'var(--primary-navy)' : 'transparent',
                color: searchMode === 'FLEET' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: searchMode === 'FLEET' ? 'var(--btn-primary-shadow)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Truck size={14} /> Pilih Armada Feeder (3 Mobil)
            </button>

            <button
              onClick={() => {
                setSearchMode('PACKAGE');
                setQuery('P260812000001');
                handleSearch('P260812000001', selectedDate);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 800,
                background: searchMode === 'PACKAGE' ? 'var(--primary-navy)' : 'transparent',
                color: searchMode === 'PACKAGE' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: searchMode === 'PACKAGE' ? 'var(--btn-primary-shadow)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Package size={14} /> Lacak Resi Connote (Paket)
            </button>
          </div>

          {/* Operational Date Picker & Auto-Sync Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            
            {/* Date Picker Capsule */}
            <div className="surface-soft" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10 }}>
              <CalendarDays size={15} color="var(--accent-cyan)" />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  if (!newDate) return;
                  setSelectedDate(newDate);
                  const termToSearch = (query && query.trim()) ? query.trim() : (searchMode === 'FLEET' ? 'B 9910 PCX' : 'P260812000001');
                  loadFleetList(newDate);
                  handleSearch(termToSearch, newDate);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              />
              {selectedDate === getTodayWibStr() && (
                <span className="badge badge-emerald" style={{ fontSize: 10, padding: '2px 6px' }}>
                  Hari Ini
                </span>
              )}
            </div>

            {selectedDate !== getTodayWibStr() && (
              <button
                onClick={() => {
                  const today = getTodayWibStr();
                  setSelectedDate(today);
                  const termToSearch = (query && query.trim()) ? query.trim() : (searchMode === 'FLEET' ? 'B 9910 PCX' : 'P260812000001');
                  loadFleetList(today);
                  handleSearch(termToSearch, today);
                }}
                className="btn-ghost"
                style={{ height: 36, padding: '0 12px', fontSize: 11.5, fontWeight: 700, gap: 6 }}
                title="Kembali ke Tanggal Hari Ini"
              >
                <Calendar size={13} />
                Hari Ini
              </button>
            )}

            {/* CSV Import Button */}
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="btn-ghost"
              style={{ height: 36, padding: '0 12px', fontSize: 11.5, fontWeight: 700, gap: 6 }}
            >
              <FileSpreadsheet size={14} />
              Import CSV
            </button>

            {/* Auto-Refresh Control */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: autoRefresh ? 'var(--accent-emerald-bg)' : 'var(--bg-surface-soft)',
              padding: '4px 10px',
              borderRadius: 10,
              border: `1px solid ${autoRefresh ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-light)'}`,
              height: 36
            }}>
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: autoRefresh ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 0
                }}
                title={autoRefresh ? 'Klik untuk jeda Auto-Refresh' : 'Klik untuk aktifkan Auto-Refresh'}
              >
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: autoRefresh ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
                <span>Auto-Sync {autoRefresh ? 'ON' : 'OFF'}</span>
              </button>

              {autoRefresh && (
                <select
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--accent-emerald)',
                    fontSize: 11,
                    fontWeight: 800,
                    borderRadius: 6,
                    padding: '2px 4px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value={2000}>2s</option>
                  <option value={3000}>3s</option>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                </select>
              )}

              {lastSyncTime && autoRefresh && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>
                  {lastSyncTime.slice(3)}
                </span>
              )}
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={() => {
                loadFleetList(selectedDate);
                handleSearch(query, selectedDate);
              }}
              className="btn-ghost"
              style={{ height: 36, width: 36, padding: 0, justifyContent: 'center' }}
              title="Refresh Manual Sekarang"
            >
              <RefreshCw size={14} className={loading || fleetLoading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── FLEET SELECTOR LIST (SHOWN IN FLEET MODE) ── */}
        {searchMode === 'FLEET' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary-navy)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ListFilter size={15} color="var(--accent-cyan)" /> DAFTAR ARMADA KENDARAAN AKTIF DI DATABASE ({fleetList.length} ARMADA):
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Klik armada untuk memuat data tracking rute, kapasitas, dan muatan connote
              </span>
            </div>

            {/* Visual Vehicle Card List */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12
            }}>
              {fleetList.map((v) => {
                const isSelected = result?.vehicleNopol === v.nopol;
                const hasCargo = (v.total_cargo_count || 0) > 0;
                return (
                  <div
                    key={v.nopol}
                    onClick={() => {
                      setQuery(v.nopol);
                      handleSearch(v.nopol, selectedDate);
                    }}
                    style={{
                      background: isSelected ? 'var(--accent-cyan-bg)' : 'var(--bg-card)',
                      border: isSelected ? '1.5px solid var(--primary-blue)' : '1px solid var(--border-light)',
                      borderRadius: 14,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 10px rgba(37, 99, 235, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--primary-blue)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-light)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'var(--bg-surface-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Truck size={16} color={isSelected ? 'var(--primary-blue)' : 'var(--text-secondary)'} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 900, color: isSelected ? 'var(--primary-blue)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {v.nopol}
                        </span>
                      </div>
                      <span className={v.journey_status === 'IN_PROGRESS' ? 'badge badge-amber' : 'badge badge-emerald'} style={{ fontSize: 10, padding: '2px 8px' }}>
                        {v.journey_status || 'READY'}
                      </span>
                    </div>

                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.3 }}>
                      {v.nama_kendaraan}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-light)', fontSize: 11 }}>
                      <span style={{ color: hasCargo ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Package size={13} /> {v.total_cargo_count || 0} Paket ({v.current_load_kg || 0} kg)
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Kapasitas: {v.max_capacity_kg || 1500} kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RESI SEARCH (SHOWN IN PACKAGE MODE) ── */}
        {searchMode === 'PACKAGE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(query, selectedDate)}
                  placeholder="Masukkan nomor resi connote (contoh: P260812000001)..."
                  style={{
                    width: '100%',
                    height: 42,
                    paddingLeft: 40,
                    paddingRight: 36,
                    fontSize: 13.5,
                    borderRadius: 10,
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-workspace)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      setResult(null);
                      setErrorMsg('');
                      setSearchParams({ code: '', date: selectedDate });
                    }}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
                {loading ? 'Mencari...' : 'Lacak Resi Paket'}
              </button>
            </div>

            {/* Quick Test Samples (Swipeable Chips Strip) */}
            <div className="scrollable-chips" style={{ alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                SAMPEL RESI DATABASE:
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
                  <span style={{ color: 'var(--primary-blue)', fontWeight: 700, fontFamily: 'monospace' }}>{s.code}</span>
                  <span className={`badge ${s.badgeClass}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                    {s.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ─── ERROR STATE ────────────────── */}
      {errorMsg && (
        <div className="spatial-card" style={{ padding: 20, borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#ef4444' }}>
                DATA TIDAK DITEMUKAN
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {errorMsg}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN DASHBOARD CONTENT (WHEN VALID DATA EXISTS) ────────────────── */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 2. SECTION: 4 SUMMARY STATS CARDS */}
          {(() => {
            const stops = result.routeStops || [];
            const totalStopsCount = stops.length || 5;
            const activeStop = stops[activeSeq - 1] || {};
            const totalCargo = (result.cargoItems || []).length || result.totalCargoCount || 0;
            const totalWeight = (result.cargoItems || []).reduce((s, i) => s + (i.weight_kg || 0), 0).toFixed(1);
            
            const stopLoad = activeStop.loadAtStopKg !== undefined ? activeStop.loadAtStopKg : result.currentLoadKg;
            const utilPct = activeStop.utilizationPctAtStop !== undefined ? activeStop.utilizationPctAtStop : result.utilizationPct;
            const capColor = utilPct >= 100 ? '#ef4444' : utilPct >= 85 ? '#f59e0b' : '#10b981';

            const cards = [
              { icon: Package, color: '#0284c7', label: 'TOTAL PAKET DI KENDARAAN', value: `${totalCargo} pcs`, sub: `${totalWeight} kg total muatan` },
              { icon: Truck, color: '#f59e0b', label: 'KENDARAAN BEROPERASI', value: result.vehicleNopol || 'B 9910 PCX', sub: `Rute: ${result.routeId || 'RT-MALAM-B9910-PCX'}` },
              { icon: Activity, color: capColor, label: `UTILISASI KAPASITAS STOP #${activeSeq}`, value: `${utilPct}%`, sub: `${stopLoad} / ${result.maxCapacityKg || 1500} kg` },
              { icon: MapPin, color: '#a855f7', label: 'PROGRESS RUTE SAAT INI', value: `Stop #${activeSeq} dari ${totalStopsCount}`, sub: activeStop.officeName ? activeStop.officeName : 'In Progress' },
            ];

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {cards.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div
                      key={i}
                      className="spatial-card"
                      style={{
                        padding: '16px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        borderRadius: 16
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'var(--bg-workspace)',
                        border: '1px solid var(--border-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={20} color={c.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                          {c.label}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', fontFamily: i === 1 ? 'monospace' : 'inherit' }}>
                          {c.value}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {c.sub}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 3. SECTION: PACKAGE TRACKING OVERVIEW CARD (IF RESI SEARCHED) */}
          {result.connoteCode && !result.isVehicleQuery && (
            <div className="spatial-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    PACKAGE TRACKING OVERVIEW &nbsp;•&nbsp; <span style={{ color: 'var(--primary-blue)' }}>KONTEKS TANGGAL: {formatDateDisplay(selectedDate)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {result.connoteCode}
                    </h2>
                    <button onClick={() => handleCopyCode(result.connoteCode)} className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11, gap: 4 }}>
                      {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />} Copy Resi
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      Booking: {result.bookingCode}
                    </span>
                  </div>
                </div>

                <span className={mapStateToBadge(result.state).class} style={{ fontSize: 12, padding: '5px 14px', fontWeight: 800 }}>
                  {mapStateToBadge(result.state).label}
                </span>
              </div>

              {/* Spec Details 6-Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                {[
                  { label: 'LAYANAN PENGIRIMAN', value: result.service || 'Pos Nextday', color: '#0284c7', icon: Package },
                  { label: 'BERAT PAKET', value: result.weight || '1.0 kg', color: 'var(--text-primary)', icon: Weight },
                  { label: 'KANTOR ASAL (ORIGIN)', value: result.origin || 'KCU Cimahi 40500', color: '#10b981', icon: MapPin },
                  { label: 'KANTOR TUJUAN (DEST)', value: result.destination || 'SPP Bandung 40400', color: '#f97316', icon: MapPin },
                  { label: 'PENGIRIM / PENERIMA', value: `${result.senderName || 'Pengirim'} ➔ ${result.receiverName || 'Penerima'}`, color: 'var(--text-primary)', icon: User },
                  { label: 'TANGGAL INPUT PAKET', value: result.createdAt ? (typeof result.createdAt === 'string' ? result.createdAt : new Date(result.createdAt).toLocaleString('id-ID')) : '-', color: 'var(--text-muted)', icon: Calendar },
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div key={item.label} style={{ background: 'var(--bg-workspace)', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
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
          {displayTimeline && displayTimeline.length > 0 && (
            <div className="spatial-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} color="var(--primary-blue)" /> TRACKING TIMELINE (EVENT LOG DARI DATABASE)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: '#10b981', fontWeight: 800 }}>
                    ● {displayTimeline.length} Event Tercatat (Stop #{activeSeq} Aktif)
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="btn-ghost"
                    style={{ padding: '4px 10px', fontSize: 11, gap: 5 }}
                  >
                    <Printer size={13} /> Cetak Laporan
                  </button>
                </div>
              </div>

              {/* Stepper List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {displayTimeline.map((event, idx) => {
                  const isLast = idx === displayTimeline.length - 1;
                  const eventStageUp = String(event.stage || '').toUpperCase();
                  const dotColor = isLast ? '#10b981'
                    : eventStageUp.includes('DELIVERED') ? '#10b981'
                    : eventStageUp.includes('TRANSIT') ? '#0284c7'
                    : eventStageUp.includes('LOADED') ? '#0284c7'
                    : '#94a3b8';
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: isLast ? dotColor : 'var(--bg-workspace)',
                            border: `2px solid ${dotColor}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isLast ? '#ffffff' : dotColor,
                            fontWeight: 800, fontSize: 11, flexShrink: 0
                          }}
                        >
                          {idx + 1}
                        </div>
                        {idx < displayTimeline.length - 1 && (
                          <div style={{ width: 2, height: 28, background: 'var(--border-light)', margin: '4px 0' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, background: isLast ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-workspace)', padding: 12, borderRadius: 10, border: isLast ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={mapStateToBadge(event.stage).class} style={{ fontSize: 10, padding: '2px 8px' }}>
                            {mapStateToBadge(event.stage).label || event.stage}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{event.time}</span>
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}>{event.note}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="#64748b" /> Lokasi: {event.location}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. SECTION: CURRENT VEHICLE JOURNEY & VEHICLE CAPACITY GAUGE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            
            {/* 5A. CURRENT VEHICLE JOURNEY CARD */}
            <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary-navy)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Truck size={16} color="var(--accent-cyan)" /> CURRENT VEHICLE JOURNEY
                  </div>
                  <span className="badge badge-amber" style={{ fontSize: 10.5, padding: '3px 8px' }}>
                    IN_PROGRESS
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-cyan-bg)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={24} color="var(--accent-cyan)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {result.vehicleNopol || 'B 9910 PCX'}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      Rute: {result.routeId || 'RT-MALAM-B9910-PCX'} &nbsp;•&nbsp; Driver: {result.vehicleInfo?.driver || 'Ahmad Supriadi'}
                    </div>
                  </div>
                </div>

                <div className="surface-soft" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 14, borderRadius: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Stop Sequence:</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>Stop #{activeSeq} dari {(result.routeStops || []).length || 5}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Stop Saat Ini:</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 2 }}>{activeStopObj.officeName || 'SPP Bandung'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Estimasi Tiba (ETA):</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--accent-amber)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {activeStopObj.etaTime || '10:00 WIB'} <span style={{ fontSize: 10, color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: 2 }}><Clock size={10} /> On Schedule</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Stop Berikutnya:</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--accent-purple)', marginTop: 2 }}>
                      {result.routeStops?.[activeSeq]?.officeName || (result.routeStops?.[result.routeStops.length - 1]?.officeName ? `${result.routeStops[result.routeStops.length - 1].officeName} (Terminal Akhir)` : 'SPP Bandung (Terminal Akhir)')}
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => setIsMapModalOpen(true)}
                style={{ width: '100%', height: 42, fontSize: 13, fontWeight: 800, borderRadius: 12, justifyContent: 'center', gap: 8 }}
              >
                <Navigation size={15} /> Lihat Telemetri Radar GPS
              </button>
            </div>

            {/* 5B. VEHICLE CAPACITY GAUGE CARD */}
            {(() => {
              const activeLoadKg = activeStopObj.loadAtStopKg !== undefined ? activeStopObj.loadAtStopKg : result.currentLoadKg;
              const activeUtilPct = activeStopObj.utilizationPctAtStop !== undefined ? activeStopObj.utilizationPctAtStop : result.utilizationPct;
              const activeCapStatus = activeStopObj.capacityStatusAtStop || result.capacityStatus || 'NORMAL';
              const capInfo = getCapacityStatusBadge(activeCapStatus);
              const maxCap = result.maxCapacityKg || 1500;
              const availKg = Math.max(0, maxCap - activeLoadKg);

              return (
                <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary-navy)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
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

                    <div className="surface-soft" style={{ padding: 16, borderRadius: 14, marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>
                          Penggunaan Muatan (Utilitas Stop #{activeSeq}):
                        </span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: capInfo.color }}>
                          {activeUtilPct}%
                        </span>
                      </div>

                      {/* Progress Bar Gauge */}
                      <div style={{ width: '100%', height: 10, borderRadius: 10, background: 'var(--border-light)', overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{
                          width: `${Math.min(100, activeUtilPct)}%`,
                          height: '100%',
                          borderRadius: 10,
                          background: capInfo.color,
                          transition: 'width 0.4s ease'
                        }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11.5 }}>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Beban di Stop Ini:</span>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>{activeLoadKg} kg</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Kapasitas Maksimal:</span>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>{maxCap} kg</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                    <span>Kapasitas Tersedia:</span>
                    <strong style={{ color: 'var(--accent-emerald)', fontSize: 13 }}>{availKg.toFixed(1)} kg sisa</strong>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* 6. SECTION: MULTI-STOP ROUTE JOURNEY (DYNAMIC WAYPOINTS FROM DATABASE) */}
          <div className="spatial-card" style={{ padding: 24, position: 'relative' }}>
            {/* Top Bar with Title & Simulation Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--primary-navy)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Navigation size={17} color="var(--accent-cyan)" /> MULTI-STOP ROUTE JOURNEY ({(result.routeStops || []).length} WAYPOINTS DATABASE)
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                  Lintasan armada {result.vehicleNopol || 'B 9910 PCX'} — Klik waypoint untuk memfilter muatan resi di bawah
                </div>
              </div>

              {/* SIMULATION TOOLBAR */}
              <div className="surface-soft" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 12
              }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={13} color="var(--accent-cyan)" /> Mode Simulasi:
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
                  className="btn-primary"
                  style={{ padding: '4px 10px', fontSize: 11, gap: 4 }}
                >
                  {isSimulating ? <Pause size={12} /> : <Play size={12} />}
                  {isSimulating ? 'Pause' : 'Simulasi ▶'}
                </button>

                <button
                  onClick={() => {
                    setIsSimulating(false);
                    setSimStopSeq(prev => Math.min((result.routeStops || []).length, (prev ?? activeSeq) + 1));
                  }}
                  className="btn-ghost"
                  style={{ padding: '3px 8px', fontSize: 11 }}
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
                  style={{ padding: '3px 8px', fontSize: 11 }}
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
                  style={{ padding: '3px 8px', fontSize: 11, color: '#ef4444' }}
                  title="Reset ke Posisi Live DB"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>

            {/* Waypoint Track Horizontal Layout */}
            <div style={{ position: 'relative', width: '100%', paddingTop: 30, paddingBottom: 10 }}>
              
              {/* Connected Stepper Line & Waypoint Nodes */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, (result.routeStops || []).length)}, 1fr)`, gap: 4, width: '100%', position: 'relative' }}>
                
                {/* Underlying Track Progress Line */}
                <div style={{
                  position: 'absolute',
                  top: 22,
                  left: `${100 / (Math.max(1, (result.routeStops || []).length) * 2)}%`,
                  right: `${100 / (Math.max(1, (result.routeStops || []).length) * 2)}%`,
                  height: 4,
                  background: '#e2e8f0',
                  borderRadius: 2,
                  zIndex: 1
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(0, ((activeSeq - 1) / Math.max(1, (result.routeStops || []).length - 1)) * 100))}%`,
                    height: '100%',
                    background: '#0284c7',
                    borderRadius: 2,
                    transition: 'width 0.5s ease'
                  }} />
                </div>

                {(result.routeStops || []).map((stop, sIdx) => {
                  const isCurrent = stop.seq === activeSeq;
                  const isPassed = stop.seq < activeSeq;
                  const isSelected = selectedStopFilter === stop.nopen;

                  let nodeBg = '#ffffff';
                  let nodeBorder = '#cbd5e1';
                  let nodeColor = '#64748b';

                  if (isPassed) {
                    nodeBg = '#16a34a';
                    nodeBorder = '#16a34a';
                    nodeColor = '#ffffff';
                  } else if (isCurrent) {
                    nodeBg = '#0b2e8a';
                    nodeBorder = '#0284c7';
                    nodeColor = '#ffffff';
                  }

                  if (isSelected) {
                    nodeBorder = '#0284c7';
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
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          background: nodeBg,
                          border: `3px solid ${nodeBorder}`,
                          boxShadow: isCurrent ? '0 0 0 4px rgba(2, 132, 199, 0.2)' : '0 2px 6px rgba(15, 23, 42, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: nodeColor,
                          fontWeight: 900,
                          fontSize: 13,
                          transition: 'all 0.2s ease',
                          transform: isCurrent ? 'scale(1.1)' : 'scale(1)'
                        }}
                      >
                        {isPassed ? <CheckCircle2 size={18} color="#fff" /> : stop.seq}
                      </div>

                      {/* Waypoint Name & Sublabel */}
                      <div style={{ textAlign: 'center', width: '100%', padding: '0 2px' }}>
                        <div style={{
                          fontSize: 11,
                          fontWeight: isCurrent || isSelected ? 900 : 700,
                          color: isSelected ? 'var(--primary-blue)' : isCurrent ? 'var(--primary-blue)' : 'var(--text-primary)',
                          lineHeight: 1.25,
                          marginBottom: 2,
                          wordBreak: 'break-word'
                        }}>
                          {stop.officeName}
                        </div>
                        <div style={{ fontSize: 9.5, color: '#0284c7', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
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
                            background: stop.utilizationPctAtStop > 100 ? 'var(--accent-pink-bg)' : 'var(--bg-surface-soft)',
                            border: `1px solid ${stop.utilizationPctAtStop > 100 ? 'rgba(244,63,94,0.3)' : 'var(--border-light)'}`,
                            color: stop.utilizationPctAtStop > 100 ? 'var(--accent-pink)' : stop.utilizationPctAtStop >= 90 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}>
                            <Package size={10} /> {stop.loadAtStopKg} kg ({stop.utilizationPctAtStop}%)
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <span 
                        className={`badge ${isPassed ? 'badge-emerald' : isCurrent ? 'badge-amber' : 'badge-navy'}`} 
                        style={{ fontSize: 8.5, padding: '1px 7px', fontWeight: 800, marginTop: 2 }}
                      >
                        {isPassed ? 'PASSED' : isCurrent ? 'CURRENT' : 'UPCOMING'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 7. SECTION: PACKAGES INSIDE VEHICLE (CARGO MANIFEST TABLE) */}
          <div className="spatial-card" style={{ padding: 22 }}>
            
            {/* Header & Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--primary-navy)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={17} color="var(--accent-cyan)" /> DAFTAR RESI YANG DIAMBIL MOBIL {result.vehicleNopol} ({filteredCargoItems.length} PAKET TERDAFTAR)
                </div>
                <div style={{ fontSize: 11, color: 'var(--accent-emerald)', marginTop: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Truck size={13} color="var(--accent-emerald)" /> Real-time Cargo Milk Run: Muatan fisik di dalam armada {result.vehicleNopol} pada Stop #{activeSeq} ({(result.routeStops || [])[activeSeq - 1]?.officeName || ''})
                </div>
              </div>

              {/* View Switchers & Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                
                {/* Mode Filter: Semua vs Dimuat di Stop Ini */}
                <div className="surface-soft" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 3, borderRadius: 8 }}>
                  <button
                    onClick={() => setShowOnlyNewlyLoaded(false)}
                    style={{
                      padding: '5px 12px',
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: !showOnlyNewlyLoaded ? 'var(--primary-navy)' : 'transparent',
                      color: !showOnlyNewlyLoaded ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    Semua Resi ({(result.cargoItems || []).length})
                  </button>
                  <button
                    onClick={() => setShowOnlyNewlyLoaded(true)}
                    style={{
                      padding: '5px 12px',
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: showOnlyNewlyLoaded ? 'var(--primary-navy)' : 'transparent',
                      color: showOnlyNewlyLoaded ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    Stop #{activeSeq}
                  </button>
                </div>

                {/* View Mode Switcher: Accordion vs Detailed Table */}
                <div className="surface-soft" style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 8 }}>
                  <button
                    onClick={() => setCargoViewMode('GROUPED')}
                    style={{
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: cargoViewMode === 'GROUPED' ? 'var(--primary-navy)' : 'transparent',
                      color: cargoViewMode === 'GROUPED' ? '#ffffff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <LayoutGrid size={13} /> Kategori Tujuan
                  </button>
                  <button
                    onClick={() => setCargoViewMode('TABLE')}
                    style={{
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: cargoViewMode === 'TABLE' ? 'var(--primary-navy)' : 'transparent',
                      color: cargoViewMode === 'TABLE' ? '#ffffff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Table size={13} /> Tabel Lengkap
                  </button>
                </div>

                {/* Search in cargo list */}
                <div style={{ position: 'relative', width: 180 }}>
                  <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={cargoSearchTerm}
                    onChange={(e) => setCargoSearchTerm(e.target.value)}
                    placeholder="Cari resi / nama..."
                    style={{ width: '100%', height: 32, paddingLeft: 28, paddingRight: 10, fontSize: 11, borderRadius: 8, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)', boxSizing: 'border-box' }}
                  />
                </div>

              </div>
            </div>

            {/* ── VIEW MODE 1: GROUPED ACCORDION VIEW ── */}
            {cargoViewMode === 'GROUPED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredCargoGroups.length === 0 ? (
                  <div className="surface-card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Package size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Tidak ada data muatan paket</div>
                    <div style={{ fontSize: 11.5, marginTop: 4 }}>Sesuaikan kata kunci pencarian atau filter waypoint untuk melihat paket.</div>
                  </div>
                ) : (
                  filteredCargoGroups.map((grp) => (
                    <PaginatedGroupCard
                      key={grp.destination_nopen}
                      grp={grp}
                      isExpanded={expandedDestGroups[grp.destination_nopen] !== false}
                      onToggle={() => toggleDestGroup(grp.destination_nopen)}
                      formatWeight={formatWeight}
                      mapStateToBadge={mapStateToBadge}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── VIEW MODE 2: FLAT TABLE VIEW ── */}
            {cargoViewMode === 'TABLE' && (() => {
              const totalFlatItems = filteredCargoItems.length;
              const totalFlatPages = Math.max(1, Math.ceil(totalFlatItems / flatTablePageSize));
              const safeFlatPage = Math.min(flatTablePage, totalFlatPages);
              const flatStartIndex = (safeFlatPage - 1) * flatTablePageSize;
              const flatEndIndex = Math.min(flatStartIndex + flatTablePageSize, totalFlatItems);
              const currentFlatItems = filteredCargoItems.slice(flatStartIndex, flatEndIndex);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-surface-soft)', borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '10px 10px', width: 36 }}>#</th>
                          <th style={{ padding: '10px 12px' }}>NO RESI CONNOTE</th>
                          <th style={{ padding: '10px 12px' }}>LAYANAN</th>
                          <th style={{ padding: '10px 12px' }}>BERAT</th>
                          <th style={{ padding: '10px 12px' }}>ASAL (ORIGIN)</th>
                          <th style={{ padding: '10px 12px' }}>TUJUAN (DEST)</th>
                          <th style={{ padding: '10px 12px' }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentFlatItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                              <Package size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Tidak ada data muatan paket yang sesuai</div>
                            </td>
                          </tr>
                        ) : (
                          currentFlatItems.map((item, idx) => (
                            <tr key={item.connote_code || idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontSize: 11, fontFamily: 'monospace' }}>
                                {flatStartIndex + idx + 1}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary-blue)' }}>
                                {item.connote_code}
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                                {item.service}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {formatWeight(item.weight_kg)}
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>
                                {item.origin_office_name || `Nopen ${item.origin_nopen}`}
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>
                                {item.destination_office_name || `Nopen ${item.destination_nopen}`}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <span className={mapStateToBadge(item.state).class} style={{ fontSize: 9.5, padding: '2px 8px' }}>
                                  {mapStateToBadge(item.state).label}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar for Flat Table */}
                  {totalFlatItems > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border-light)',
                      fontSize: 12
                    }}>
                      {/* Left: Summary & Selector (20, 50, 100) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--text-secondary)' }}>
                        <span>
                          Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{flatStartIndex + 1}</strong> - <strong style={{ color: 'var(--text-primary)' }}>{flatEndIndex}</strong> dari <strong style={{ color: 'var(--text-primary)' }}>{totalFlatItems}</strong> paket
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tampilkan:</span>
                          <select
                            value={flatTablePageSize}
                            onChange={(e) => {
                              setFlatTablePageSize(Number(e.target.value));
                              setFlatTablePage(1);
                            }}
                            style={{
                              background: 'var(--bg-workspace)',
                              border: '1px solid var(--border-light)',
                              borderRadius: 6,
                              padding: '3px 8px',
                              color: 'var(--text-primary)',
                              fontSize: 11.5,
                              fontWeight: 700,
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value={20}>20 / hal</option>
                            <option value={50}>50 / hal</option>
                            <option value={100}>100 / hal</option>
                          </select>
                        </div>
                      </div>

                      {/* Right: Page Navigation & Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setFlatTablePage(p => Math.max(1, p - 1))}
                          disabled={safeFlatPage <= 1}
                          className="btn-ghost"
                          style={{
                            padding: '4px 12px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: safeFlatPage <= 1 ? 'not-allowed' : 'pointer',
                            opacity: safeFlatPage <= 1 ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <ChevronLeft size={13} /> Prev
                        </button>

                        {/* Page Numbers */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          {Array.from({ length: totalFlatPages }, (_, i) => i + 1)
                            .filter(pNum => {
                              if (totalFlatPages <= 7) return true;
                              if (pNum === 1 || pNum === totalFlatPages) return true;
                              if (Math.abs(pNum - safeFlatPage) <= 1) return true;
                              return false;
                            })
                            .reduce((acc, pNum, idx, arr) => {
                              if (idx > 0 && pNum - arr[idx - 1] > 1) {
                                acc.push({ type: 'ellipsis', key: `el-flat-${pNum}` });
                              }
                              acc.push({ type: 'page', value: pNum, key: `p-flat-${pNum}` });
                              return acc;
                            }, [])
                            .map(item => {
                              if (item.type === 'ellipsis') {
                                return <span key={item.key} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
                              }
                              const isAct = item.value === safeFlatPage;
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => setFlatTablePage(item.value)}
                                  style={{
                                    minWidth: 28,
                                    height: 28,
                                    padding: '0 6px',
                                    borderRadius: 6,
                                    border: isAct ? '1px solid var(--primary-blue)' : '1px solid transparent',
                                    background: isAct ? 'var(--primary-navy)' : 'transparent',
                                    color: isAct ? '#ffffff' : 'var(--text-secondary)',
                                    fontWeight: isAct ? 800 : 600,
                                    fontSize: 11.5,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {item.value}
                                </button>
                              );
                            })}
                        </div>

                        <button
                          type="button"
                          onClick={() => setFlatTablePage(p => Math.min(totalFlatPages, p + 1))}
                          disabled={safeFlatPage >= totalFlatPages}
                          className="btn-ghost"
                          style={{
                            padding: '4px 12px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: safeFlatPage >= totalFlatPages ? 'not-allowed' : 'pointer',
                            opacity: safeFlatPage >= totalFlatPages ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          Next <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>

        </div>
      )}

      {/* Modals */}
      {isMapModalOpen && (
        <LiveGpsMapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          vehicleNopol={result?.vehicleNopol || 'B 9910 PCX'}
          routeStops={result?.routeStops || []}
          currentStopSeq={activeSeq}
        />
      )}

      {isCsvModalOpen && (
        <CsvImportModal
          isOpen={isCsvModalOpen}
          onClose={() => {
            setIsCsvModalOpen(false);
            loadFleetList(selectedDate);
            handleSearch(query, selectedDate);
          }}
        />
      )}

    </div>
  );
}
