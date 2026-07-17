import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import VehicleDetailModal from '../components/VehicleDetailModal.jsx';
import { 
  ClipboardList, Search, RefreshCw, AlertTriangle, Eye, 
  ChevronLeft, ChevronRight, Truck, Calendar, ArrowRight, X, Clock, HelpCircle, Package, User, MapPin
} from 'lucide-react';

export default function Transaksi() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Stats summary state
  const [stats, setStats] = useState(null);

  // Pagination & Filtering states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [kprkFilter, setKprkFilter] = useState('');
  const [regFilter, setRegFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination response states
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Details Modal States
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedConnote, setSelectedConnote] = useState(null);
  const [connoteDetailData, setConnoteDetailData] = useState(null);
  const [connoteDetailLoading, setConnoteDetailLoading] = useState(false);
  const [connoteDetailError, setConnoteDetailError] = useState('');

  // Refs for AbortController & Debounce
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // 1. Handle Debounced Search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [search]);

  // 2. Fetch Transactions Function
  const fetchTransactions = async (autoRefresh = false) => {
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (!autoRefresh) setLoading(true);
      setError('');

      const queryParams = new URLSearchParams({
        page,
        limit,
        sortBy,
        sortOrder
      });

      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (stateFilter) queryParams.append('state', stateFilter);
      if (serviceFilter) queryParams.append('service', serviceFilter);
      if (kprkFilter) queryParams.append('destination_kprk', kprkFilter);
      if (regFilter) queryParams.append('destination_reg', regFilter);
      if (vehicleFilter) queryParams.append('vehicle_nopol', vehicleFilter);
      if (dateFrom) queryParams.append('date_from', dateFrom);
      if (dateTo) queryParams.append('date_to', dateTo);

      // Call API
      const res = await api.getTransactions(queryParams.toString());
      if (res.success) {
        setData(res.data);
        setTotalRows(res.pagination.totalRows);
        setTotalPages(res.pagination.totalPages);
        setHasNext(res.pagination.hasNext);
        setHasPrevious(res.pagination.hasPrevious);
        if (res.summary) {
          setStats(res.summary);
        }
        setLastUpdated(new Date());
      } else {
        setError(res.message || 'Gagal memuat data transaksi.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Koneksi ke server gagal.');
      }
    } finally {
      if (!autoRefresh) setLoading(false);
    }
  };

  // 3. Fetch Stats
  const fetchStats = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (stateFilter) queryParams.append('state', stateFilter);
      if (serviceFilter) queryParams.append('service', serviceFilter);
      if (kprkFilter) queryParams.append('destination_kprk', kprkFilter);
      if (regFilter) queryParams.append('destination_reg', regFilter);
      if (vehicleFilter) queryParams.append('vehicle_nopol', vehicleFilter);
      if (dateFrom) queryParams.append('date_from', dateFrom);
      if (dateTo) queryParams.append('date_to', dateTo);

      const res = await api.getTransactionStats(queryParams.toString());
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load transaction stats:', err);
    }
  };

  // Trigger fetch when parameters change
  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [page, limit, debouncedSearch, stateFilter, serviceFilter, kprkFilter, regFilter, vehicleFilter, dateFrom, dateTo, sortBy, sortOrder]);

  // Reset page to 1 when filters change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  // 4. Auto-refresh logic (30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // Don't refresh if the browser tab is hidden/inactive
      if (document.hidden) return;
      fetchTransactions(true);
      fetchStats();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [page, limit, debouncedSearch, stateFilter, serviceFilter, kprkFilter, regFilter, vehicleFilter, dateFrom, dateTo, sortBy, sortOrder]);

  // 5. Fetch Connote Detail
  const fetchConnoteDetail = async (code) => {
    try {
      setConnoteDetailLoading(true);
      setConnoteDetailError('');
      setConnoteDetailData(null);
      const res = await api.getTransactionByCode(code);
      if (res.success) {
        setConnoteDetailData(res.data);
      } else {
        setConnoteDetailError(res.message || 'Gagal memuat detail resi.');
      }
    } catch (err) {
      setConnoteDetailError(err.message || 'Gagal menghubungi server.');
    } finally {
      setConnoteDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedConnote) {
      fetchConnoteDetail(selectedConnote);
    }
  }, [selectedConnote]);

  // Format Helpers
  const formatIDR = (val) => {
    if (val === undefined || val === null || val === '-') return '-';
    const num = parseFloat(val);
    if (isNaN(num)) return '-';
    const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    return formatted.replace(/\u00a0/g, '').replace(/\s/g, '');
  };

  const formatWeight = (val) => {
    if (val === undefined || val === null || val === '-') return '-';
    const num = parseFloat(val);
    if (isNaN(num)) return '-';
    return `${num.toFixed(1)} kg`;
  };

  const formatWIB = (val) => {
    if (val === undefined || val === null || val === '-') return '-';
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return String(val); // Fallback to raw string
      // Format to WIB
      return date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';
    } catch (e) {
      return String(val);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const resetAllFilters = () => {
    setSearch('');
    setStateFilter('');
    setServiceFilter('');
    setKprkFilter('');
    setRegFilter('');
    setVehicleFilter('');
    setDateFrom('');
    setDateTo('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  // Quick date range helper
  const [activeDatePreset, setActiveDatePreset] = useState('');
  const setQuickDateRange = (preset) => {
    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    setActiveDatePreset(preset);
    if (preset === 'today') {
      handleFilterChange(setDateFrom, fmt(today));
      handleFilterChange(setDateTo, fmt(today));
    } else if (preset === 'yesterday') {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      handleFilterChange(setDateFrom, fmt(y));
      handleFilterChange(setDateTo, fmt(y));
    } else if (preset === '7d') {
      const s = new Date(today); s.setDate(s.getDate() - 6);
      handleFilterChange(setDateFrom, fmt(s));
      handleFilterChange(setDateTo, fmt(today));
    } else if (preset === '30d') {
      const s = new Date(today); s.setDate(s.getDate() - 29);
      handleFilterChange(setDateFrom, fmt(s));
      handleFilterChange(setDateTo, fmt(today));
    }
  };

  const isFilterActive = !!(debouncedSearch || stateFilter || serviceFilter || kprkFilter || regFilter || vehicleFilter || dateFrom || dateTo);

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">
            <ClipboardList size={22} style={{ color: 'var(--accent-cyan)' }} />
            Data Transaksi Paket (Connotes)
          </h1>
          <p className="page-subtitle">Daftar lengkap transaksi kiriman, status pelacakan, dan pemetaan rute kendaraan malam</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Terakhir diperbarui: {lastUpdated.toLocaleTimeString()} (Auto-refresh 30s)
            </span>
          )}
          <button className="btn btn-secondary" onClick={() => { fetchTransactions(); fetchStats(); }} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Dashboard Summary */}
      {stats && (
        <div className="grid-6 mb-4" style={{ gap: '15px', marginBottom: '24px' }}>
          {/* Card 1: TOTAL TRANSAKSI */}
          <div className="stat-card" style={{ 
            background: 'rgba(56, 189, 248, 0.02)', 
            border: '1px solid var(--border-light)', 
            minHeight: '85px', 
            padding: '12px 14px', 
            marginBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>TOTAL TRANSAKSI</span>
              <h3 style={{ fontSize: '18px', color: 'white', fontWeight: 800, marginTop: '4px', margin: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {new Intl.NumberFormat('id-ID').format(stats.total_transaksi)}
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Resi</span>
              </h3>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px', opacity: 0.8 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.15, color: 'var(--accent-cyan)' }}>
              <ClipboardList size={20} />
            </div>
          </div>

          {/* Card 2: TOTAL TONASE */}
          <div className="stat-card" style={{ 
            background: 'rgba(0, 210, 196, 0.02)', 
            border: '1px solid var(--border-light)', 
            minHeight: '85px', 
            padding: '12px 14px', 
            marginBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>TOTAL TONASE</span>
              <h3 style={{ fontSize: '18px', color: 'var(--accent-cyan)', fontWeight: 800, marginTop: '4px', margin: 0, whiteSpace: 'nowrap' }}>
                {formatWeight(stats.total_berat)}
              </h3>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px', opacity: 0.8 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.15, color: 'var(--accent-cyan)' }}>
              <Truck size={20} />
            </div>
          </div>

          {/* Card 3: NILAI AMUNISI */}
          <div className="stat-card" style={{ 
            background: 'rgba(234, 179, 8, 0.02)', 
            border: '1px solid var(--border-light)', 
            minHeight: '85px', 
            padding: '12px 14px', 
            marginBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>NILAI AMUNISI</span>
              <h3 style={{ fontSize: '18px', color: 'var(--accent-yellow)', fontWeight: 800, marginTop: '4px', margin: 0, whiteSpace: 'nowrap' }}>
                {formatIDR(stats.total_nilai_kiriman)}
              </h3>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px', opacity: 0.8 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.15, color: 'var(--accent-yellow)' }}>
              <Package size={20} />
            </div>
          </div>

          {/* Card 4: STATUS DELIVERED */}
          <div className="stat-card" style={{ 
            background: 'rgba(52, 211, 153, 0.02)', 
            border: '1px solid var(--border-light)', 
            minHeight: '85px', 
            padding: '12px 14px', 
            marginBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>STATUS DELIVERED</span>
              <h3 style={{ fontSize: '18px', color: '#10b981', fontWeight: 800, marginTop: '4px', margin: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {new Intl.NumberFormat('id-ID').format(stats.jumlah_by_state?.DELIVERED || 0)}
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Pkt</span>
              </h3>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px', opacity: 0.8 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.15, color: '#10b981' }}>
              <Package size={20} />
            </div>
          </div>

          {/* Card 5: MAPPED TO ROUTE */}
          <div className="stat-card" style={{ 
            background: 'rgba(167, 139, 250, 0.02)', 
            border: '1px solid var(--border-light)', 
            minHeight: '85px', 
            padding: '12px 14px', 
            marginBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>MAPPED TO ROUTE</span>
              <h3 style={{ fontSize: '18px', color: '#a78bfa', fontWeight: 800, marginTop: '4px', margin: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {new Intl.NumberFormat('id-ID').format(stats.jumlah_mapped)}
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Pkt</span>
              </h3>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px', opacity: 0.8 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.15, color: '#a78bfa' }}>
              <MapPin size={20} />
            </div>
          </div>

          {/* Card 6: UNMAPPED */}
          <div className="stat-card" style={{ 
            background: 'rgba(239, 68, 68, 0.02)', 
            border: '1px solid var(--border-light)', 
            minHeight: '85px', 
            padding: '12px 14px', 
            marginBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>UNMAPPED</span>
              <h3 style={{ fontSize: '18px', color: 'var(--accent-red)', fontWeight: 800, marginTop: '4px', margin: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {new Intl.NumberFormat('id-ID').format(stats.jumlah_unmapped)}
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Pkt</span>
              </h3>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px', opacity: 0.8 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.15, color: 'var(--accent-red)' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter Form Panel */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Search size={16} style={{ color: 'var(--accent-cyan)' }} />
          Pencarian & Penyaringan Lanjutan
        </h3>
        
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchTransactions(); fetchStats(); }} style={{ display: 'grid', gap: '15px' }}>
          {/* Row 1: Search input */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Cari berdasarkan resi, booking code, nama/alamat pengirim/penerima, nopend..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '45px', height: '42px', borderRadius: '6px', fontSize: '13px' }}
            />
          </div>

          {/* Row 2: Select Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <select value={stateFilter} onChange={(e) => handleFilterChange(setStateFilter, e.target.value)} style={{ padding: '8px 12px', fontSize: '13px' }}>
                <option value="">-- Status (State) --</option>
                <option value="INLOCATION">INLOCATION (In Location)</option>
                <option value="INVEHICLE">INVEHICLE (In Vehicle)</option>
                <option value="DELIVERYRUNSHEET">DELIVERYRUNSHEET (Delivery Run Sheet)</option>
                <option value="DELIVERED">DELIVERED (Delivered)</option>
                <option value="FAILEDTODELIVERED">FAILEDTODELIVERED (Failed to Deliver)</option>
                <option value="inBag">inBag (In Bag / Kantong)</option>
                <option value="unBag">unBag (Unbag / Buka Kantong)</option>
                <option value="PAID">PAID (Paid / Lunas)</option>
                <option value="CANCEL">CANCEL (Canceled)</option>
                <option value="Irregularity">Irregularity</option>
              </select>
            </div>
            
            <div style={{ flex: 1, minWidth: '150px' }}>
              <select value={serviceFilter} onChange={(e) => handleFilterChange(setServiceFilter, e.target.value)} style={{ padding: '8px 12px', fontSize: '13px' }}>
                <option value="">-- Layanan --</option>
                <option value="PKH">PKH (Kilat Khusus)</option>
                <option value="PE">PE</option>
                <option value="3PE">3PE</option>
                <option value="EC3">EC3</option>
                <option value="Q9">Q9</option>
                <option value="PJB">PJB</option>
                <option value="PJM">PJM</option>
                <option value="PPB_SRT">PPB_SRT</option>
                <option value="312">312</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '150px' }}>
              <input 
                type="text" 
                placeholder="Tujuan KPRK (misal: 40000)" 
                value={kprkFilter}
                onChange={(e) => handleFilterChange(setKprkFilter, e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13px', height: '38px', borderRadius: '4px' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '120px' }}>
              <input 
                type="text" 
                placeholder="Regional" 
                value={regFilter}
                onChange={(e) => handleFilterChange(setRegFilter, e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13px', height: '38px', borderRadius: '4px' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '150px' }}>
              <select value={vehicleFilter} onChange={(e) => handleFilterChange(setVehicleFilter, e.target.value)} style={{ padding: '8px 12px', fontSize: '13px' }}>
                <option value="">-- Kendaraan --</option>
                <option value="B 9910 PCX">B 9910 PCX (MALAM)</option>
                <option value="B 9945 PCY">B 9945 PCY (MALAM)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Quick Date Presets + Date Filters & Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Quick date preset buttons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginRight: '4px' }}><Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />PERIODE CEPAT:</span>
              {[{ key: 'today', label: 'Hari Ini' }, { key: 'yesterday', label: 'Kemarin' }, { key: '7d', label: '7 Hari' }, { key: '30d', label: '30 Hari' }].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setQuickDateRange(p.key)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '20px',
                    border: activeDatePreset === p.key ? '1px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                    background: activeDatePreset === p.key ? 'rgba(0,210,196,0.12)' : 'rgba(255,255,255,0.04)',
                    color: activeDatePreset === p.key ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {p.label}
                </button>
              ))}
              {activeDatePreset && (
                <button
                  type="button"
                  onClick={() => { setActiveDatePreset(''); setDateFrom(''); setDateTo(''); setPage(1); }}
                  style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: 'var(--accent-red)', cursor: 'pointer' }}
                >
                  <X size={10} style={{ marginRight: '3px', verticalAlign: 'middle' }} />Clear
                </button>
              )}
            </div>

            {/* Manual date range + action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mulai:</span>
                  <input 
                    type="date" 
                    value={dateFrom} 
                    onChange={(e) => { setActiveDatePreset(''); handleFilterChange(setDateFrom, e.target.value); }} 
                    style={{ padding: '6px 10px', fontSize: '12px', height: '32px', width: '130px' }} 
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Akhir:</span>
                  <input 
                    type="date" 
                    value={dateTo} 
                    onChange={(e) => { setActiveDatePreset(''); handleFilterChange(setDateTo, e.target.value); }} 
                    style={{ padding: '6px 10px', fontSize: '12px', height: '32px', width: '130px' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { resetAllFilters(); setActiveDatePreset(''); }} style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Reset Filter
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '13px' }}>
                  Cari Data
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Main Table Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
          <RefreshCw size={32} className="spin-anim text-accent" style={{ color: 'var(--accent-cyan)', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-secondary)' }}>Memuat data transaksi dari server MongoDB...</div>
        </div>
      ) : error ? (
        <div className="info-alert" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)' }}>
          <AlertTriangle size={20} />
          <div>{error}</div>
        </div>
      ) : data.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: '12px' }}>
          <ClipboardList size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h4 style={{ color: 'white', margin: 0 }}>Tidak Ada Data Kiriman</h4>
          <p style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-muted)' }}>Sesuaikan pencarian atau filter untuk menemukan data kiriman.</p>
        </div>
      ) : (
        <div>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('connote_code')}>
                    Nomor Resi {sortBy === 'connote_code' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('connote_booking_code')}>
                    Kode Booking {sortBy === 'connote_booking_code' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('connote_sender_name')}>
                    Pengirim {sortBy === 'connote_sender_name' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th>Penerima / Alamat Tujuan</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('connote_service')}>
                    Layanan {sortBy === 'connote_service' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('actual_weight')}>
                    Berat {sortBy === 'actual_weight' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('connote_amount')}>
                    Bea Kirim {sortBy === 'connote_amount' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('connote_state')}>
                    Status {sortBy === 'connote_state' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                    Tanggal Transaksi {sortBy === 'created_at' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th>Dest Nopen</th>
                  <th>Dest KPRK</th>
                  <th>Reg</th>
                  <th>Posisi Terkini</th>
                  <th>Final SWP</th>
                  <th>Kendaraan / Nopol</th>
                  <th>Rute</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const no = (page - 1) * limit + index + 1;
                  return (
                    <tr key={item._id || item.connote_code}>
                      <td style={{ color: 'var(--text-secondary)' }}>{no}</td>
                      <td>
                        <button 
                          onClick={() => setSelectedConnote(item.connote_code)}
                          style={{ background: 'none', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          {item.connote_code}
                        </button>
                      </td>
                      <td>{item.connote_booking_code}</td>
                      <td style={{ fontWeight: 600, color: 'white' }}>{item.connote_sender_name}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.connote_receiver_address}>
                        {item.connote_receiver_address}
                      </td>
                      <td>
                        <span className="badge badge-info">{item.connote_service}</span>
                      </td>
                      <td>{formatWeight(item.actual_weight)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-yellow)' }}>{formatIDR(item.connote_amount)}</td>
                      <td>
                        <span className="badge badge-warning">{item.connote_state?.replace(/_/g, ' ') || 'UNKNOWN'}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatWIB(item.created_at)}</td>
                      <td style={{ fontWeight: 700, color: 'white' }}>{item.destination_nopen}</td>
                      <td>{item.destination_kprk}</td>
                      <td>{item.destination_reg}</td>
                      <td style={{ fontWeight: 600 }}>{item.current_location_name}</td>
                      <td>{item.final_swp}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {item.vehicle_nopol !== '-' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button 
                              onClick={() => setSelectedVehicle(item.vehicle_nopol)}
                              className="btn-text" 
                              style={{ color: 'var(--accent-cyan)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              title="Klik untuk detail kendaraan"
                            >
                              <Truck size={13} style={{ marginRight: '3px' }} />
                              {item.vehicle_nopol}
                            </button>
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{ fontSize: '11px', fontWeight: 600 }}>
                        {item.route_id !== '-' ? (
                          <span style={{ color: 'var(--text-secondary)' }}>{item.route_id}</span>
                        ) : '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => setSelectedConnote(item.connote_code)}
                            className="btn btn-secondary" 
                            style={{ padding: '6px', borderRadius: '4px' }} 
                            title="Detail Transaksi"
                          >
                            <Eye size={13} style={{ color: 'var(--accent-cyan)' }} />
                          </button>
                          {item.vehicle_nopol !== '-' && (
                            <button 
                              onClick={() => setSelectedVehicle(item.vehicle_nopol)}
                              className="btn btn-secondary" 
                              style={{ padding: '6px', borderRadius: '4px' }} 
                              title="Detail Kendaraan"
                            >
                              <Truck size={13} style={{ color: 'var(--accent-yellow)' }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="pagination-bar" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Menampilkan Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> ({totalRows} data)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tampilkan:</span>
                <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }} style={{ padding: '4px 8px', fontSize: '12px', width: '70px', height: '26px' }}>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={!hasPrevious}
                className="btn btn-secondary" 
                style={{ padding: '6px 12px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={!hasNext}
                className="btn btn-secondary" 
                style={{ padding: '6px 12px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Transaksi (Connote) */}
      {selectedConnote && (
        <div className="modal-overlay" style={{ zIndex: 1001 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '750px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ color: 'white', fontWeight: 700 }}>Detail Kiriman Paket</h3>
              <button onClick={() => setSelectedConnote(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {connoteDetailLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <RefreshCw size={24} className="spin-anim" style={{ color: 'var(--accent-cyan)' }} />
                  <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Memuat detail data...</p>
                </div>
              ) : connoteDetailError ? (
                <div className="info-alert" style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'var(--accent-red)' }}>
                  <AlertTriangle size={16} />
                  <div>{connoteDetailError}</div>
                </div>
              ) : connoteDetailData ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  
                  {/* General Info */}
                  <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NOMOR RESI / CONNOTE</span>
                        <div style={{ color: 'white', fontWeight: 800, fontSize: '15px', marginTop: '3px' }}>{connoteDetailData.transaction.connote_code}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>KODE BOOKING</span>
                        <div style={{ color: 'white', fontWeight: 600, fontSize: '14px', marginTop: '3px' }}>{connoteDetailData.transaction.connote_booking_code}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TANGGAL TRANSAKSI</span>
                        <div style={{ color: 'white', fontWeight: 600, fontSize: '13px', marginTop: '3px' }}>{formatWIB(connoteDetailData.transaction.created_at)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Sender & Receiver Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                    <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px', marginBottom: '10px' }}>
                        <User size={14} style={{ color: 'var(--accent-cyan)' }} />
                        <h4 style={{ color: 'white', margin: 0, fontSize: '13px' }}>PENGIRIM</h4>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{connoteDetailData.transaction.connote_sender_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Email: {connoteDetailData.transaction.connote_sender_email}</div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>{connoteDetailData.transaction.connote_sender_address}</p>
                    </div>

                    <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px', marginBottom: '10px' }}>
                        <MapPin size={14} style={{ color: 'var(--accent-cyan)' }} />
                        <h4 style={{ color: 'white', margin: 0, fontSize: '13px' }}>PENERIMA</h4>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Alamat Detail: {connoteDetailData.transaction.connote_receiver_address_detail}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', marginTop: '4px' }}>Kode Pos: {connoteDetailData.transaction.connote_receiver_zipcode}</div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>{connoteDetailData.transaction.connote_receiver_address}</p>
                    </div>
                  </div>

                  {/* Pricing and Weight Details */}
                  <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>LAYANAN</span>
                        <div style={{ marginTop: '4px' }}><span className="badge badge-info">{connoteDetailData.transaction.connote_service}</span></div>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BERAT PAKET</span>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '13px', marginTop: '4px' }}>{formatWeight(connoteDetailData.transaction.actual_weight)}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BEA KIRIM</span>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '13px', marginTop: '4px' }}>{formatIDR(connoteDetailData.transaction.connote_service_price)}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TOTAL BIAYA</span>
                        <div style={{ color: 'var(--accent-yellow)', fontWeight: 700, fontSize: '13px', marginTop: '4px' }}>{formatIDR(connoteDetailData.transaction.connote_amount)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Route Mapping Info */}
                  <div className="glass-card" style={{ padding: '16px', marginBottom: 0, borderLeft: '3px solid var(--accent-cyan)' }}>
                    <h4 style={{ color: 'white', margin: '0 0 10px', fontSize: '13px', fontWeight: 700 }}>Informasi Pemetaan Rute Logistik</h4>
                    
                    <table className="table-borderless" style={{ width: '100%', fontSize: '12.5px' }}>
                      <tbody>
                        <tr>
                          <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Status Mapped</td>
                          <td>
                            <span className={`badge ${connoteDetailData.route_mapping.route_id !== '-' ? 'badge-success' : 'badge-danger'}`}>
                              {connoteDetailData.route_mapping.route_id !== '-' ? 'TERPETAKAN' : 'BELUM TERPETAKAN'}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Route ID</td>
                          <td style={{ color: 'white', fontWeight: 600 }}>{connoteDetailData.route_mapping.route_id}</td>
                        </tr>
                        <tr>
                          <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Kendaraan / Nopol</td>
                          <td style={{ color: 'white', fontWeight: 600 }}>
                            {connoteDetailData.route_mapping.vehicle_nopol !== '-' ? (
                              <button 
                                onClick={() => {
                                  setSelectedConnote(null);
                                  setSelectedVehicle(connoteDetailData.route_mapping.vehicle_nopol);
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                              >
                                {connoteDetailData.route_mapping.vehicle_nopol}
                              </button>
                            ) : '-'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Mapping Level</td>
                          <td>
                            {connoteDetailData.route_mapping.mapping_level !== 'UNMAPPED' ? (
                              <span className="badge badge-purple">{connoteDetailData.route_mapping.mapping_level}</span>
                            ) : '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Route Timeline stops */}
                  {connoteDetailData.route_stops && connoteDetailData.route_stops.length > 0 && (
                    <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
                      <h4 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700 }}>Alur Checkpoint Rute Kendaraan</h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {connoteDetailData.route_stops.map((stop, sIdx) => (
                          <div key={sIdx} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg-dark)', border: '1.5px solid var(--accent-cyan)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '10px' }}>
                              {sIdx + 1}
                            </div>
                            <span style={{ color: 'white', fontWeight: 600 }}>{stop.nama_nopend}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({stop.nopend})</span>
                            <span className="badge" style={{ background: 'rgba(56,189,248,0.05)', color: 'var(--text-secondary)', fontSize: '9px', marginLeft: 'auto' }}>{stop.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audit Trail History */}
                  {connoteDetailData.transaction.tracking_history && connoteDetailData.transaction.tracking_history.length > 0 && (
                    <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
                      <h4 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} style={{ color: 'var(--accent-cyan)' }} />
                        Riwayat Pelacakan Paket (Audit Trail)
                      </h4>
                      <div style={{ display: 'grid', gap: '6px' }}>
                        {connoteDetailData.transaction.tracking_history.map((h, hIdx) => (
                          <div key={hIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-navy)', borderRadius: '6px', fontSize: '12px' }}>
                            <div>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{h.from ? h.from.replace(/_/g, ' ') : '-'}</span>
                              <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>→</span>
                              <span className="badge badge-info" style={{ fontSize: '10px' }}>{h.to.replace(/_/g, ' ')}</span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'white', fontWeight: 600 }}>{formatWIB(h.changedAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            
            <div className="modal-footer">
              <button onClick={() => setSelectedConnote(null)} className="btn btn-secondary">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Kendaraan */}
      {selectedVehicle && (
        <VehicleDetailModal 
          nopol={selectedVehicle} 
          onClose={() => setSelectedVehicle(null)} 
          onViewTransaction={(code) => {
            setSelectedVehicle(null);
            setSelectedConnote(code);
          }}
        />
      )}
    </div>
  );
}
