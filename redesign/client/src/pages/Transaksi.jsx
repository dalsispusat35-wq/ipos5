import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api.js';
import VehicleDetailModal from '../components/VehicleDetailModal.jsx';
import { 
  ClipboardList, Search, RefreshCw, AlertTriangle, Eye, 
  ChevronLeft, ChevronRight, Truck, Calendar, ArrowRight, X, Clock, 
  HelpCircle, Package, User, MapPin, Copy, Check, Filter, SlidersHorizontal,
  ArrowUpRight, Radio, ExternalLink, ShieldCheck, Box, Activity, CheckCircle2
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
  const [copiedResi, setCopiedResi] = useState(null);
  
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
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

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [page, limit, debouncedSearch, stateFilter, serviceFilter, kprkFilter, regFilter, vehicleFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedResi(code);
    setTimeout(() => setCopiedResi(null), 1800);
  };

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
      if (isNaN(date.getTime())) return String(val);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
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
    setActiveDatePreset('');
  };

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

  const getBadgeClass = (status) => {
    if (!status) return 'badge badge-navy';
    const s = String(status).toUpperCase();
    if (s.includes('DELIVERED') || s.includes('SELESAI') || s.includes('SUKSES')) return 'badge badge-emerald';
    if (s.includes('TRANSIT') || s.includes('INVEHICLE') || s.includes('LOADED') || s.includes('IN_TRANSIT')) return 'badge badge-orange';
    if (s.includes('ARRIVED') || s.includes('TIBA') || s.includes('LOCATION')) return 'badge badge-amber';
    if (s.includes('RECEIVED') || s.includes('DITERIMA') || s.includes('ENTRY') || s.includes('SCANNED') || s.includes('PAID')) return 'badge badge-blue';
    return 'badge badge-navy';
  };

  const isFilterActive = !!(debouncedSearch || stateFilter || serviceFilter || kprkFilter || regFilter || vehicleFilter || dateFrom || dateTo);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      
      {/* Detail Modal */}
      {selectedVehicle && (
        <VehicleDetailModal 
          nopol={selectedVehicle} 
          onClose={() => setSelectedVehicle(null)} 
        />
      )}

      {/* ── TOP HEADER CAPSULE ── */}
      <div 
        className="spatial-card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ 
            width: 42, 
            height: 42, 
            borderRadius: 12, 
            background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#fff', 
            boxShadow: '0 2px 10px rgba(37, 99, 235, 0.25)' 
          }}>
            <ClipboardList size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Data Transaksi Resi
              </h1>
              <span className="badge badge-blue" style={{ fontSize: 10.5, padding: '3px 8px' }}>
                Live Registry
              </span>
              <span className="badge badge-navy" style={{ fontSize: 10.5, padding: '3px 8px' }}>
                {new Intl.NumberFormat('id-ID').format(totalRows)} Resi Database
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
              Pencarian manifest transaksi paket, histori status pelacakan, dan audit rute armada feeder POSIND
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              Sync: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button 
            type="button"
            className="btn-primary" 
            onClick={() => { fetchTransactions(); fetchStats(); }} 
            disabled={loading}
            style={{ padding: '7px 16px', fontSize: 12, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> 
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ── 6 MODERN SPATIAL STAT CARDS (RESPONSIVE GRID DECK) ── */}
      {stats && (
        <div 
          className="grid-6" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
            gap: 12,
            marginBottom: 2 
          }}
        >
          {/* Card 1: TOTAL TRANSAKSI */}
          <div 
            className="stat-card" 
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-light)', 
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', color: 'var(--primary-navy)', fontWeight: 800, letterSpacing: '0.5px', display: 'block' }}>TOTAL TRANSAKSI</span>
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', fontWeight: 900, marginTop: '3px', margin: 0, fontFamily: 'var(--font-mono)' }}>
                {new Intl.NumberFormat('id-ID').format(stats.total_transaksi)}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginLeft: 4 }}>Resi</span>
              </h3>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '3px', fontWeight: 600 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-cyan-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-navy)', flexShrink: 0 }}>
              <ClipboardList size={18} />
            </div>
          </div>

          {/* Card 2: TOTAL TONASE */}
          <div 
            className="stat-card" 
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-light)', 
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 800, letterSpacing: '0.5px', display: 'block' }}>TOTAL TONASE</span>
              <h3 style={{ fontSize: '20px', color: '#10b981', fontWeight: 900, marginTop: '3px', margin: 0, fontFamily: 'var(--font-mono)' }}>
                {formatWeight(stats.total_berat)}
              </h3>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '3px', fontWeight: 600 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
              <Truck size={18} />
            </div>
          </div>

          {/* Card 3: NILAI KIRIMAN */}
          <div 
            className="stat-card" 
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-light)', 
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', color: '#f59e0b', fontWeight: 800, letterSpacing: '0.5px', display: 'block' }}>NILAI KIRIMAN</span>
              <h3 style={{ fontSize: '16.5px', color: '#f59e0b', fontWeight: 900, marginTop: '3px', margin: 0, fontFamily: 'var(--font-mono)' }}>
                {formatIDR(stats.total_nilai_kiriman)}
              </h3>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '3px', fontWeight: 600 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
              <Package size={18} />
            </div>
          </div>

          {/* Card 4: STATUS DELIVERED */}
          <div 
            className="stat-card" 
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-light)', 
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 800, letterSpacing: '0.5px', display: 'block' }}>DELIVERED</span>
              <h3 style={{ fontSize: '20px', color: '#10b981', fontWeight: 900, marginTop: '3px', margin: 0, fontFamily: 'var(--font-mono)' }}>
                {new Intl.NumberFormat('id-ID').format(stats.jumlah_by_state?.DELIVERED || 0)}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginLeft: 4 }}>Pkt</span>
              </h3>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '3px', fontWeight: 600 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
              <CheckCircle2 size={18} />
            </div>
          </div>

          {/* Card 5: MAPPED ROUTE */}
          <div 
            className="stat-card" 
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-light)', 
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', color: '#a855f7', fontWeight: 800, letterSpacing: '0.5px', display: 'block' }}>MAPPED ROUTE</span>
              <h3 style={{ fontSize: '20px', color: '#a855f7', fontWeight: 900, marginTop: '3px', margin: 0, fontFamily: 'var(--font-mono)' }}>
                {new Intl.NumberFormat('id-ID').format(stats.jumlah_mapped)}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginLeft: 4 }}>Pkt</span>
              </h3>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '3px', fontWeight: 600 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', flexShrink: 0 }}>
              <MapPin size={18} />
            </div>
          </div>

          {/* Card 6: UNMAPPED */}
          <div 
            className="stat-card" 
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-light)', 
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', color: '#f43f5e', fontWeight: 800, letterSpacing: '0.5px', display: 'block' }}>UNMAPPED</span>
              <h3 style={{ fontSize: '20px', color: '#f43f5e', fontWeight: 900, marginTop: '3px', margin: 0, fontFamily: 'var(--font-mono)' }}>
                {new Intl.NumberFormat('id-ID').format(stats.jumlah_unmapped)}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginLeft: 4 }}>Pkt</span>
              </h3>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '3px', fontWeight: 600 }}>
                {isFilterActive ? 'Filter Aktif' : 'Semua Data'}
              </span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', flexShrink: 0 }}>
              <AlertTriangle size={18} />
            </div>
          </div>
        </div>
      )}

      {/* ── 4. MODERN SEARCH & MULTI-FILTER PANEL ── */}
      <div className="spatial-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={15} color="var(--primary-blue)" />
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Filter & Pencarian Lanjutan</span>
          </div>
          {isFilterActive && (
            <button 
              type="button"
              onClick={resetAllFilters}
              className="btn-ghost"
              style={{ fontSize: 11, padding: '4px 10px', color: '#ef4444' }}
              title="Reset Semua Filter"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchTransactions(); fetchStats(); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Row 1: Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 12 }} />
            <input 
              type="text" 
              placeholder="Cari berdasarkan resi (P260...), booking code, nama/alamat pengirim, penerima, nopend..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                background: 'var(--bg-workspace)',
                border: '1px solid var(--border-light)',
                borderRadius: 12,
                padding: '0 40px 0 42px',
                color: 'var(--text-primary)',
                fontSize: 12.5,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                title="Hapus pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Row 2: Select Dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {/* Status Filter */}
            <select 
              value={stateFilter} 
              onChange={(e) => handleFilterChange(setStateFilter, e.target.value)}
              style={{
                background: 'var(--bg-workspace)',
                border: '1px solid var(--border-light)',
                borderRadius: 10,
                padding: '8px 12px',
                color: stateFilter ? 'var(--primary-blue)' : 'var(--text-secondary)',
                fontWeight: stateFilter ? 700 : 500,
                fontSize: 12,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Semua Status (State) --</option>
              <option value="INLOCATION">INLOCATION (In Location)</option>
              <option value="INVEHICLE">INVEHICLE (In Vehicle)</option>
              <option value="DELIVERYRUNSHEET">DELIVERYRUNSHEET</option>
              <option value="DELIVERED">DELIVERED (Delivered)</option>
              <option value="FAILEDTODELIVERED">FAILEDTODELIVERED</option>
              <option value="inBag">inBag (In Bag)</option>
              <option value="unBag">unBag (Unbag)</option>
              <option value="PAID">PAID (Paid / Lunas)</option>
              <option value="CANCEL">CANCEL (Canceled)</option>
            </select>

            {/* Service Filter */}
            <select 
              value={serviceFilter} 
              onChange={(e) => handleFilterChange(setServiceFilter, e.target.value)}
              style={{
                background: 'var(--bg-workspace)',
                border: '1px solid var(--border-light)',
                borderRadius: 10,
                padding: '8px 12px',
                color: serviceFilter ? 'var(--primary-blue)' : 'var(--text-secondary)',
                fontWeight: serviceFilter ? 700 : 500,
                fontSize: 12,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Semua Layanan --</option>
              <option value="Pos Reguler">Pos Reguler</option>
              <option value="Pos Nextday">Pos Nextday</option>
              <option value="Pos Jumbo Cargo">Pos Jumbo Cargo</option>
              <option value="PKH">PKH (Kilat Khusus)</option>
              <option value="PE">PE (Pos Express)</option>
            </select>

            {/* KPRK Filter */}
            <input 
              type="text" 
              placeholder="Tujuan KPRK (misal: 40000)" 
              value={kprkFilter}
              onChange={(e) => handleFilterChange(setKprkFilter, e.target.value)}
              style={{
                background: 'var(--bg-workspace)',
                border: '1px solid var(--border-light)',
                borderRadius: 10,
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: 12,
                outline: 'none'
              }}
            />

            {/* Regional Filter */}
            <input 
              type="text" 
              placeholder="Regional (misal: REG 5)" 
              value={regFilter}
              onChange={(e) => handleFilterChange(setRegFilter, e.target.value)}
              style={{
                background: 'var(--bg-workspace)',
                border: '1px solid var(--border-light)',
                borderRadius: 10,
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: 12,
                outline: 'none'
              }}
            />

            {/* Vehicle Filter */}
            <select 
              value={vehicleFilter} 
              onChange={(e) => handleFilterChange(setVehicleFilter, e.target.value)}
              style={{
                background: 'var(--bg-workspace)',
                border: '1px solid var(--border-light)',
                borderRadius: 10,
                padding: '8px 12px',
                color: vehicleFilter ? 'var(--primary-blue)' : 'var(--text-secondary)',
                fontWeight: vehicleFilter ? 700 : 500,
                fontSize: 12,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Semua Kendaraan --</option>
              <option value="B 9910 PCX">B 9910 PCX (Feeder Cimahi Raya)</option>
              <option value="B 9945 PCY">B 9945 PCY (Feeder Timur & Pusat)</option>
              <option value="D 8812 AB">D 8812 AB (Feeder Barat & Utara)</option>
            </select>
          </div>

          {/* Row 3: Quick Period & Manual Date Picker */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
            {/* Quick Period Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                PERIODE:
              </span>
              {[
                { key: 'today', label: 'Hari Ini' }, 
                { key: 'yesterday', label: 'Kemarin' }, 
                { key: '7d', label: '7 Hari' }, 
                { key: '30d', label: '30 Hari' }
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setQuickDateRange(p.key)}
                  style={{
                    padding: '4px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 20,
                    border: activeDatePreset === p.key ? '1px solid var(--primary-blue)' : '1px solid var(--border-light)',
                    background: activeDatePreset === p.key ? 'var(--primary-blue)' : 'var(--bg-workspace)',
                    color: activeDatePreset === p.key ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Manual Date Input & Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                <span>Mulai:</span>
                <input 
                  type="date" 
                  value={dateFrom} 
                  onChange={(e) => { setActiveDatePreset(''); handleFilterChange(setDateFrom, e.target.value); }} 
                  style={{
                    background: 'var(--bg-workspace)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 8,
                    padding: '4px 8px',
                    color: 'var(--text-primary)',
                    fontSize: 11.5,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                <span>Akhir:</span>
                <input 
                  type="date" 
                  value={dateTo} 
                  onChange={(e) => { setActiveDatePreset(''); handleFilterChange(setDateTo, e.target.value); }} 
                  style={{
                    background: 'var(--bg-workspace)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 8,
                    padding: '4px 8px',
                    color: 'var(--text-primary)',
                    fontSize: 11.5,
                    outline: 'none'
                  }}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary"
                style={{ fontSize: 11.5, padding: '5px 16px' }}
              >
                Cari Data
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── MAIN DATA TABLE ── */}
      {loading ? (
        <div className="spatial-card" style={{ padding: '50px 0', textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ color: 'var(--primary-blue)', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Memuat data transaksi dari server MongoDB...</div>
        </div>
      ) : error ? (
        <div className="spatial-card" style={{ padding: 18, border: '1px solid #fecaca', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={20} />
          <div>{error}</div>
        </div>
      ) : data.length === 0 ? (
        <div className="spatial-card" style={{ padding: '50px 0', textAlign: 'center' }}>
          <ClipboardList size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
          <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 15, fontWeight: 800 }}>Tidak Ada Data Kiriman</h4>
          <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-secondary)' }}>Sesuaikan kata kunci pencarian atau filter untuk menemukan data kiriman.</p>
        </div>
      ) : (
        <div className="spatial-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>
                  <th style={{ padding: '10px 10px', width: 35 }}>#</th>
                  <th style={{ padding: '10px 10px', cursor: 'pointer' }} onClick={() => handleSort('connote_code')}>
                    NO. CONNOTE {sortBy === 'connote_code' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '10px 10px' }}>PENGIRIM / PENERIMA</th>
                  <th style={{ padding: '10px 10px', cursor: 'pointer' }} onClick={() => handleSort('connote_service')}>
                    LAYANAN {sortBy === 'connote_service' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '10px 10px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('actual_weight')}>
                    BERAT {sortBy === 'actual_weight' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '10px 10px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('connote_amount')}>
                    BEA KIRIM {sortBy === 'connote_amount' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '10px 10px' }}>ARMADA / RUTE</th>
                  <th style={{ padding: '10px 10px', cursor: 'pointer' }} onClick={() => handleSort('connote_state')}>
                    STATUS {sortBy === 'connote_state' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '10px 10px', cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                    WAKTU {sortBy === 'created_at' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '10px 10px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const no = (page - 1) * limit + index + 1;
                  const rawConnote = item.raw?.connote || {};
                  const nopol = item.vehicle_nopol || item.raw?.assigned_vehicle || item.raw?.vehicle_nopol || '-';
                  const service = item.connote_service || rawConnote.connote_service || 'Pos Reguler';
                  const sender = item.connote_sender_name || rawConnote.connote_sender_name || 'Pengirim';
                  const receiver = item.connote_receiver_name || rawConnote.connote_receiver_name || 'Penerima';
                  const destCity = rawConnote.connote_receiver_city || item.destination_nopen || 'Tujuan';
                  const status = item.connote_state || rawConnote.connote_state || 'IN_TRANSIT';

                  return (
                    <tr 
                      key={item._id || item.connote_code || index}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-workspace)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Index */}
                      <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {no}
                      </td>

                      {/* Connote Code + Booking Code */}
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Link 
                            to={`/checker?code=${item.connote_code}`}
                            style={{ textDecoration: 'none', color: 'var(--primary-blue)', fontWeight: 800, fontFamily: 'monospace' }}
                            title="Lacak connote di checker"
                          >
                            {item.connote_code}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.connote_code)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: copiedResi === item.connote_code ? '#10b981' : 'var(--text-muted)' }}
                            title="Salin No. Resi"
                          >
                            {copiedResi === item.connote_code ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          </button>
                        </div>
                        {item.connote_booking_code && item.connote_booking_code !== '-' && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {item.connote_booking_code}
                          </div>
                        )}
                      </td>

                      {/* Shipper / Receiver */}
                      <td style={{ padding: '10px 10px', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{sender}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ArrowRight size={11} /> {receiver} ({destCity})
                        </div>
                      </td>

                      {/* Service */}
                      <td style={{ padding: '10px 10px' }}>
                        <span className="badge badge-navy" style={{ fontSize: 10, padding: '2px 8px' }}>
                          {service}
                        </span>
                      </td>

                      {/* Weight */}
                      <td style={{ padding: '10px 10px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 800, fontFamily: 'monospace' }}>
                        {formatWeight(item.actual_weight)}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '10px 10px', textAlign: 'right', color: 'var(--primary-blue)', fontWeight: 800, fontFamily: 'monospace' }}>
                        {formatIDR(item.connote_amount)}
                      </td>

                      {/* Vehicle / Route */}
                      <td style={{ padding: '10px 10px' }}>
                        {nopol !== '-' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Truck size={12} color="var(--primary-blue)" />
                            <button 
                              type="button"
                              onClick={() => setSelectedVehicle(nopol)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11.5, fontWeight: 700, color: 'var(--primary-blue)', fontFamily: 'monospace' }}
                              title="Detail Kendaraan"
                            >
                              {nopol}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 10px' }}>
                        <span className={getBadgeClass(status)} style={{ fontSize: 10 }}>
                          {status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Time */}
                      <td style={{ padding: '10px 10px', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {formatWIB(item.created_at)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <Link 
                          to={`/checker?code=${item.connote_code}`}
                          className="btn-ghost"
                          style={{ padding: '3px 8px', fontSize: 11, gap: 4 }}
                          title="Lacak Connote"
                        >
                          <Eye size={12} />
                          <span>Track</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION BAR ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>
                Halaman <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> dari <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong> ({totalRows.toLocaleString()} baris data)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11 }}>Limit:</span>
                <select 
                  value={limit} 
                  onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }} 
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: 6,
                    padding: '2px 6px',
                    color: 'var(--input-text)',
                    fontSize: 11,
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button 
                type="button"
                onClick={() => setPage(prev => Math.max(1, prev - 1))} 
                disabled={!hasPrevious || loading}
                className="btn-ghost"
                style={{ padding: '4px 12px', fontSize: 11.5, fontWeight: 700, cursor: !hasPrevious ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={13} /> Prev
              </button>

              <button 
                type="button"
                onClick={() => setPage(prev => (hasNext ? prev + 1 : prev))} 
                disabled={!hasNext || loading}
                className="btn-ghost"
                style={{ padding: '4px 12px', fontSize: 11.5, fontWeight: 700, cursor: !hasNext ? 'not-allowed' : 'pointer' }}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
