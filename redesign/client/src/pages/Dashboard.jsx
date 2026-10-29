import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Tag, Truck, Map, TrendingUp, ArrowUpRight, BarChart3, 
  PieChart as PieChartIcon, RefreshCw, Layers, ShieldCheck, Box, Activity,
  ChevronRight, ExternalLink, ChevronLeft, Calendar, User, ArrowDownRight,
  Sparkles, CheckCircle2, AlertCircle, Clock, Zap, MapPin, Gauge, Radio,
  Cpu, Copy, Check, SlidersHorizontal, ArrowDown, ArrowUp, Compass,
  RadioTower, Wifi, Sun, Play, Navigation, AlertTriangle, Package,
  Search, Plane, Filter, Terminal, Globe, Crosshair, HelpCircle, ChevronDown,
  X, ArrowRight, ArrowUpDown, Trophy, Scale, Download, Coins
} from 'lucide-react';
import { api } from '../utils/api.js';
import NewsFeed from '../components/NewsFeed.jsx';

export default function Dashboard({ activeConnection, refreshStatsTrigger }) {
  const [dbStats, setDbStats] = useState(null);
  const [topConnotes, setTopConnotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedResi, setCopiedResi] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Interactive Filter States
  const [shipmentPeriod, setShipmentPeriod] = useState('Month'); // 'Week' | 'Month' | 'Year'
  const [salesPeriod, setSalesPeriod] = useState('Month'); // 'Week' | 'Month' | 'Year'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [hoveredSalesIndex, setHoveredSalesIndex] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('Hari Ini');
  const [datePreset, setDatePreset] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Popular Categories Detail Modal States
  const [isPopularCategoriesModalOpen, setIsPopularCategoriesModalOpen] = useState(false);
  const [categoryDetailSearch, setCategoryDetailSearch] = useState('');
  const [categorySortKey, setCategorySortKey] = useState('count'); // 'count' | 'percentage' | 'totalRevenue' | 'totalWeightKg' | 'name'
  const [categorySortOrder, setCategorySortOrder] = useState('desc'); // 'desc' | 'asc'

  const datePresetsList = [
    { label: 'Hari Ini', preset: 'today', sub: 'Real-Time Hari Ini' },
    { label: 'Agustus 2026 (Live Database)', preset: 'aug2026', sub: 'Bulan Ini' },
    { label: '7 Hari Terakhir', preset: '7d', sub: 'Minggu Ini' },
    { label: '30 Hari Terakhir', preset: '30d', sub: 'Data 1 Bulan Terakhir' },
    { label: 'Juli 2026 (Historis)', preset: 'jul2026', sub: 'Bulan Sebelumnya' },
    { label: 'Semua Data (YTD 2026)', preset: 'ytd2026', sub: 'Seluruh Database' }
  ];

  const fetchStatsAndTop20 = async (overrideParams = {}) => {
    try {
      const activePreset = overrideParams.datePreset !== undefined ? overrideParams.datePreset : datePreset;
      const activeShipmentPeriod = overrideParams.shipmentPeriod !== undefined ? overrideParams.shipmentPeriod : shipmentPeriod;
      const activeSalesPeriod = overrideParams.salesPeriod !== undefined ? overrideParams.salesPeriod : salesPeriod;
      const activeService = overrideParams.service !== undefined ? overrideParams.service : (activeCategoryFilter !== 'All' ? activeCategoryFilter : '');
      const activeStart = overrideParams.startDate !== undefined ? overrideParams.startDate : customStart;
      const activeEnd = overrideParams.endDate !== undefined ? overrideParams.endDate : customEnd;

      const qParams = {
        shipmentPeriod: activeShipmentPeriod,
        salesPeriod: activeSalesPeriod
      };
      if (activePreset && activePreset !== 'All') qParams.datePreset = activePreset;
      if (activeService) qParams.service = activeService;
      if (activeStart) qParams.startDate = activeStart;
      if (activeEnd) qParams.endDate = activeEnd;

      const [statsRes, transRes] = await Promise.allSettled([
        api.getDashboardStats(qParams),
        api.getTransactions('limit=20' + (activeStart ? `&startDate=${activeStart}` : '') + (activeEnd ? `&endDate=${activeEnd}` : ''))
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success && statsRes.value?.data) {
        setDbStats(statsRes.value.data);
      }

      if (transRes.status === 'fulfilled' && transRes.value?.success) {
        const transData = transRes.value.data || transRes.value.transaksi || [];
        setTopConnotes(transData);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndTop20();
    const interval = setInterval(() => fetchStatsAndTop20(), 5000);
    return () => clearInterval(interval);
  }, [refreshStatsTrigger, datePreset, customStart, customEnd, shipmentPeriod, salesPeriod, activeCategoryFilter]);

  const handleSelectPreset = (p) => {
    setDatePreset(p.preset);
    setSelectedDateRange(p.label);
    setCustomStart('');
    setCustomEnd('');
    setIsDatePickerOpen(false);
    fetchStatsAndTop20({ datePreset: p.preset, startDate: '', endDate: '' });
  };

  const handleApplyCustomDate = (e) => {
    e.preventDefault();
    if (!customStart && !customEnd) return;
    setDatePreset('custom');
    setSelectedDateRange(`${customStart || 'Awal'} s/d ${customEnd || 'Sekarang'}`);
    setIsDatePickerOpen(false);
    fetchStatsAndTop20({ datePreset: 'custom', startDate: customStart, endDate: customEnd });
  };

  const handleResetFilter = () => {
    setDatePreset('All');
    setSelectedDateRange('Semua Data (YTD 2026)');
    setCustomStart('');
    setCustomEnd('');
    setActiveCategoryFilter('All');
    fetchStatsAndTop20({ datePreset: 'All', startDate: '', endDate: '', service: '' });
  };

  const isFiltered = (datePreset && datePreset !== 'All') || customStart || customEnd || activeCategoryFilter !== 'All';

  const totals = dbStats?.totals || {};
  const totalPackages = totals.total_packages !== undefined ? totals.total_packages : 0;
  const activeCount = totals.active_shipments !== undefined ? totals.active_shipments : 0;
  const completedCount = totals.completed_shipments !== undefined ? totals.completed_shipments : 0;
  const returnedCount = totals.returned_shipments !== undefined ? totals.returned_shipments : 0;
  
  const activePct = totalPackages > 0 && activeCount > 0 ? Math.round((activeCount / totalPackages) * 100) : 0;
  const completedPct = totalPackages > 0 && completedCount > 0 ? Math.round((completedCount / totalPackages) * 100) : 0;
  const returnedPct = totalPackages > 0 && returnedCount > 0 ? Math.round((returnedCount / totalPackages) * 100) : 0;
  const revenueFormatted = totals.total_revenue_formatted || (totals.total_revenue !== undefined ? `Rp ${Number(totals.total_revenue).toLocaleString('id-ID')}` : 'Rp 0');

  const totalWeightTonDisplay = totals.total_weight_kg !== undefined
    ? (totals.total_weight_kg >= 1000 ? (totals.total_weight_kg / 1000).toFixed(1) + ' Ton' : totals.total_weight_kg + ' kg')
    : '0 kg';

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedResi(code);
    setTimeout(() => setCopiedResi(null), 1800);
  };

  const getBadgeClass = (status) => {
    if (!status) return 'badge badge-navy';
    const s = String(status).toUpperCase();
    if (s.includes('DELIVERED') || s.includes('SELESAI') || s.includes('SUKSES')) return 'badge badge-emerald';
    if (s.includes('TRANSIT') || s.includes('INVEHICLE') || s.includes('LOADED') || s.includes('IN_TRANSIT')) return 'badge badge-blue';
    if (s.includes('ARRIVED') || s.includes('TIBA') || s.includes('HUB')) return 'badge badge-amber';
    if (s.includes('RETURN') || s.includes('GAGAL') || s.includes('CANCEL')) return 'badge badge-pink';
    return 'badge badge-navy';
  };

  const filteredConnotes = topConnotes.filter(item => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      (item.connote_code || '').toLowerCase().includes(q) ||
      (item.location_name || '').toLowerCase().includes(q) ||
      (item.connote_service || '').toLowerCase().includes(q) ||
      (item.connote_sender_name || '').toLowerCase().includes(q) ||
      (item.connote_receiver_name || '').toLowerCase().includes(q) ||
      (item.raw?.assigned_vehicle || item.raw?.vehicle_nopol || '').toLowerCase().includes(q)
    );
  });

  // Real Monthly Stacked Bar Data from MongoDB
  const shipmentBarData = dbStats?.monthlyShipments || [];

  // Popular Categories from Real MongoDB Database
  const popularCategoriesList = dbStats?.popularCategories || [];
  const totalCatShipments = popularCategoriesList.reduce((acc, c) => acc + (c.count || 0), 0);
  const totalCatRevenue = popularCategoriesList.reduce((acc, c) => acc + (c.totalRevenue || 0), 0);
  const totalCatWeightKg = popularCategoriesList.reduce((acc, c) => acc + (c.totalWeightKg || 0), 0);
  const topCategoryItem = popularCategoriesList.length > 0 ? popularCategoriesList[0] : null;

  // Filtered & Sorted Categories for Detail Modal
  const modalCategoriesFiltered = popularCategoriesList
    .filter(cat => (cat.name || '').toLowerCase().includes(categoryDetailSearch.toLowerCase()))
    .sort((a, b) => {
      let valA = a[categorySortKey];
      let valB = b[categorySortKey];
      if (categorySortKey === 'name') {
        return categorySortOrder === 'asc'
          ? (valA || '').localeCompare(valB || '')
          : (valB || '').localeCompare(valA || '');
      }
      return categorySortOrder === 'asc'
        ? (Number(valA) || 0) - (Number(valB) || 0)
        : (Number(valB) || 0) - (Number(valA) || 0);
    });

  // Av Check (Average Revenue per Service from DB)
  const avCheckData = dbStats?.avCheck || [];

  const maxAvRevenue = Math.max(...avCheckData.map(d => d.avgRevenue || 1), 1);

  // Av Delivery Time by Region & Hub SLA from Database
  const avDeliveryData = (totalPackages > 0 && dbStats?.avDeliveryTime) ? dbStats.avDeliveryTime : [];

  // Category filter options from real DB
  const salesCategories = ['All', 'Pos Nextday', 'Pos Reguler', 'Pos Sameday', 'Pos Shopee', 'Pos Jumbo'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', paddingBottom: 20 }}>
      
      {/* ── 0. KILAS BERITA PT POS INDONESIA (LIVE RSS FEED CAROUSEL) ── */}
      <NewsFeed />

      {/* ── 1. SUBHEADER: PAGE TITLE & ACTIVE DATE FILTER DROPDOWN ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>
            Analytics
          </h1>
          {isFiltered && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="badge badge-navy" style={{ fontSize: 11, padding: '4px 10px' }}>
                Filter Aktif: {dbStats?.filterMeta?.filteredCount || totalPackages} Data
              </span>
              <button
                type="button"
                onClick={handleResetFilter}
                className="btn-ghost"
                style={{ fontSize: 11, padding: '2px 8px', color: '#ef4444' }}
                title="Reset Semua Filter"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Interactive Date Range Dropdown Pill */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 9999,
              padding: '7px 16px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Calendar size={14} color={isFiltered ? 'var(--primary-blue)' : 'var(--text-muted)'} />
            <span>{selectedDateRange}</span>
            <ChevronDown size={14} color={isFiltered ? 'var(--primary-blue)' : 'var(--text-muted)'} />
          </button>

          {isDatePickerOpen && (
            <div
              className="surface-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 290,
                maxWidth: 'calc(100vw - 32px)',
                borderRadius: 16,
                padding: '12px',
                boxShadow: 'var(--spatial-shadow)',
                zIndex: 999,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 4px' }}>
                PILIH PERIODE DATA MONGODB
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {datePresetsList.map((p) => (
                  <button
                    key={p.preset}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: datePreset === p.preset ? 'var(--accent-cyan-bg)' : 'transparent',
                      color: datePreset === p.preset ? 'var(--primary-navy)' : 'var(--text-primary)',
                      fontWeight: datePreset === p.preset ? 800 : 500,
                      border: 'none',
                      borderRadius: 8,
                      padding: '7px 10px',
                      fontSize: 12,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { if (datePreset !== p.preset) e.currentTarget.style.background = 'var(--bg-surface-soft)'; }}
                    onMouseLeave={(e) => { if (datePreset !== p.preset) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span>{p.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{p.sub}</span>
                  </button>
                ))}
              </div>

              {/* Custom Date Inputs Form */}
              <form onSubmit={handleApplyCustomDate} style={{ borderTop: '1px solid var(--border-light)', paddingTop: 10, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Atur Rentang Tanggal Manual:</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Mulai:</span>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      style={{ width: '100%', fontSize: 11, padding: '4px 6px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Selesai:</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      style={{ width: '100%', fontSize: 11, padding: '4px 6px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1, fontSize: 11, padding: '6px 0', justifyContent: 'center' }}
                  >
                    Terapkan Filter
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="btn-ghost"
                    style={{ fontSize: 11, padding: '6px 10px' }}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. ROW 1: 5 PASTEL KPI SUMMARY CARDS (REAL DATABASE DATA) ── */}
      <div className="grid-5" style={{ gap: 14 }}>
        
        {/* 1. Dark Blue Total Shipments Card */}
        <div className="kpi-card-blue" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 96, padding: '16px 18px', borderRadius: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.9 }}>
            Total Shipments
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginTop: 8 }}>
            {totalPackages.toLocaleString('id-ID')}
          </div>
        </div>

        {/* 2. Soft Cyan Active Shipments Card */}
        <div className="kpi-card-cyan" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 96, padding: '16px 18px', borderRadius: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Active Shipments
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>
              {activeCount.toLocaleString('id-ID')}
            </span>
            <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 800 }}>
              {activePct}% of total
            </span>
          </div>
        </div>

        {/* 3. Soft Green Completed Card */}
        <div className="kpi-card-green" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 96, padding: '16px 18px', borderRadius: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Completed
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>
              {completedCount.toLocaleString('id-ID')}
            </span>
            <span style={{ fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 800 }}>
              {completedPct}% of total
            </span>
          </div>
        </div>

        {/* 4. Soft Pink Returned Card */}
        <div className="kpi-card-pink" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 96, padding: '16px 18px', borderRadius: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Returned / Failed
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>
              {returnedCount.toLocaleString('id-ID')}
            </span>
            <span style={{ fontSize: 11, color: 'var(--accent-pink)', fontWeight: 800 }}>
              {returnedPct}% of total
            </span>
          </div>
        </div>

        {/* 5. Soft Purple Real Revenue / Cargo Tonase Card */}
        <div className="kpi-card-purple" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 96, padding: '16px 18px', borderRadius: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Total Freight Value
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {revenueFormatted}
            </span>
            <span style={{ fontSize: 11, color: '#a855f7', fontWeight: 800 }}>
              {totalWeightTonDisplay}
            </span>
          </div>
        </div>

      </div>

      {/* ── 3. ROW 2: TWO MAIN INTERACTIVE CHARTS (SHIPMENT & SALES) ── */}
      <div className="grid-2" style={{ gap: 16 }}>
        
        {/* ── CHART 1: SHIPMENT STACKED BAR CHART ── */}
        <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', minHeight: 340 }}>
          
          {/* Card Header with Period Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
              Shipment
            </h2>

            <div className="filter-pill-group">
              {['Week', 'Month', 'Year'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setShipmentPeriod(p);
                    fetchStatsAndTop20({ shipmentPeriod: p });
                  }}
                  className={`filter-pill-btn ${shipmentPeriod === p ? 'active' : ''}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Stacked Bar Chart Area */}
          <div style={{ flex: 1, position: 'relative', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 26 }}>
            
            {/* Dynamic Horizontal Dashed Guidelines & Y-Axis Labels */}
            {(() => {
              const maxVal = Math.max(...shipmentBarData.map(d => d.total || 0), 10);
              const step3 = Math.round(maxVal);
              const step2 = Math.round(maxVal * 0.75);
              const step1 = Math.round(maxVal * 0.5);
              const step05 = Math.round(maxVal * 0.25);

              return (
                <>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 32, textAlign: 'right', fontFamily: 'monospace' }}>{step3}</span>
                    <div style={{ flex: 1, borderTop: '1px dashed var(--border-light)' }} />
                  </div>
                  <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 32, textAlign: 'right', fontFamily: 'monospace' }}>{step2}</span>
                    <div style={{ flex: 1, borderTop: '1px dashed var(--border-light)' }} />
                  </div>
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 32, textAlign: 'right', fontFamily: 'monospace' }}>{step1}</span>
                    <div style={{ flex: 1, borderTop: '1px dashed var(--border-light)' }} />
                  </div>
                  <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 32, textAlign: 'right', fontFamily: 'monospace' }}>{step05}</span>
                    <div style={{ flex: 1, borderTop: '1px dashed var(--border-light)' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: 26, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 32, textAlign: 'right', fontFamily: 'monospace' }}>0</span>
                    <div style={{ flex: 1, borderTop: '1px solid var(--border-light)' }} />
                  </div>
                </>
              );
            })()}

            {/* Bars Container */}
            <div 
              onMouseLeave={() => setHoveredBarIndex(null)}
              style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', paddingLeft: 42, zIndex: 5 }}
            >
              {shipmentBarData.map((item, idx) => {
                const isHovered = hoveredBarIndex === idx;
                const maxVal = Math.max(...shipmentBarData.map(d => d.total || 0), 10);
                const totalH = item.total > 0 ? Math.min(150, Math.max(14, (item.total / maxVal) * 150)) : 0;
                const retH = item.total > 0 ? Math.max(item.returned > 0 ? 4 : 0, (item.returned / item.total) * totalH) : 0;
                const delH = item.total > 0 ? Math.max(item.delivered > 0 ? 6 : 0, (item.delivered / item.total) * totalH) : 0;
                const onDelH = item.total > 0 ? Math.max(item.onDelivery > 0 ? 6 : 0, totalH - retH - delH) : 0;

                return (
                  <div
                    key={item.month + idx}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      width: 44
                    }}
                  >
                    {/* Dynamic Tooltip on Hover */}
                    {isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -82,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#0b2e8a',
                          color: '#ffffff',
                          borderRadius: 12,
                          padding: '8px 12px',
                          fontSize: 10.5,
                          boxShadow: '0 8px 24px rgba(11, 46, 138, 0.3)',
                          zIndex: 30,
                          minWidth: 130,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                          pointerEvents: 'none'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 11, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 3, marginBottom: 2 }}>
                          {item.month} ({item.total} Total)
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ color: '#bae6fd', fontWeight: 600 }}>On Delivery</span>
                          <span style={{ fontWeight: 800 }}>{item.onDelivery} <span style={{ fontSize: 9.5, opacity: 0.75 }}>({item.onDeliveryPct}%)</span></span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ color: '#bbf7d0', fontWeight: 600 }}>Delivered</span>
                          <span style={{ fontWeight: 800 }}>{item.delivered} <span style={{ fontSize: 9.5, opacity: 0.75 }}>({item.deliveredPct}%)</span></span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ color: '#fecdd3', fontWeight: 600 }}>Returned</span>
                          <span style={{ fontWeight: 800 }}>{item.returned} <span style={{ fontSize: 9.5, opacity: 0.75 }}>({item.returnedPct}%)</span></span>
                        </div>
                      </div>
                    )}

                    {/* Stacked Bar Pillar with Thick Rounded Style */}
                    <div
                      style={{
                        width: 26,
                        height: item.total > 0 ? Math.max(8, totalH) : 4,
                        display: 'flex',
                        flexDirection: 'column-reverse',
                        borderRadius: item.total > 0 ? 12 : 2,
                        overflow: 'hidden',
                        boxShadow: isHovered ? '0 6px 16px rgba(2, 132, 199, 0.3)' : (item.total > 0 ? '0 2px 6px rgba(15, 23, 42, 0.05)' : 'none'),
                        transition: 'all 0.15s ease',
                        transform: isHovered ? 'scaleY(1.04) scaleX(1.05)' : 'none',
                        background: item.total > 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)'
                      }}
                    >
                      {/* Bottom Segment: Returned (Pink/Rose) */}
                      {retH > 0 && <div style={{ height: retH, background: '#f43f5e' }} />}
                      {/* Middle Segment: Delivered (Mint/Emerald) */}
                      {delH > 0 && <div style={{ height: delH, background: '#10b981' }} />}
                      {/* Top Segment: On Delivery (Cyan Blue) */}
                      {onDelH > 0 && <div style={{ height: onDelH, background: '#0284c7' }} />}
                    </div>

                    {/* Month Label */}
                    <span style={{ fontSize: 11.5, fontWeight: isHovered ? 800 : 600, color: isHovered ? 'var(--primary-blue)' : 'var(--text-secondary)', marginTop: 8 }}>
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Bottom Legend Pill Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap', paddingLeft: 42 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--primary-blue)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-blue)' }} />
              All
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
              On Delivery
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              Delivered
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} />
              Returned
            </span>
          </div>

        </div>

        {/* ── CHART 2: SALES / FREIGHT VOLUME AREA & LINE CHART (DYNAMIC FROM DATABASE) ── */}
        <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', minHeight: 340 }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
              Sales & Freight Volume
            </h2>

            <div className="filter-pill-group">
              {['Week', 'Month', 'Year'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setSalesPeriod(p);
                    fetchStatsAndTop20({ salesPeriod: p });
                  }}
                  className={`filter-pill-btn ${salesPeriod === p ? 'active' : ''}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Line & Area Chart Canvas */}
          {(() => {
            const rawPoints = (dbStats?.salesTrend && dbStats.salesTrend.length > 0)
              ? dbStats.salesTrend
              : shipmentBarData.map(b => ({
                  label: b.month,
                  revenue: b.revenue ?? (b.total * 150000),
                  revenueFormatted: `Rp ${(b.revenue ?? (b.total * 150000)).toLocaleString('id-ID')}`,
                  connotesCount: b.total,
                  onDelivery: b.onDelivery,
                  delivered: b.delivered
                }));

            const maxRev = Math.max(...rawPoints.map(p => p.revenue || 0), 1000000);
            const activeIdx = hoveredSalesIndex;

            // Generate SVG Coordinates (450x150 viewBox)
            const coords = rawPoints.map((pt, i) => {
              const x = rawPoints.length > 1 ? (i / (rawPoints.length - 1)) * 430 + 10 : 225;
              const y = 135 - ((pt.revenue || 0) / maxRev) * 110;
              return { x, y, pt, i };
            });

            // Construct smooth spline path
            let lineD = '';
            if (coords.length > 0) {
              lineD = `M ${coords[0].x},${coords[0].y}`;
              for (let i = 0; i < coords.length - 1; i++) {
                const c = coords[i];
                const n = coords[i + 1];
                const cpX = (c.x + n.x) / 2;
                lineD += ` C ${cpX},${c.y} ${cpX},${n.y} ${n.x},${n.y}`;
              }
            }

            const areaD = coords.length > 0
              ? `${lineD} L ${coords[coords.length - 1].x},150 L ${coords[0].x},150 Z`
              : '';

            const currentPoint = activeIdx !== null && coords[activeIdx] ? coords[activeIdx] : null;
            const revMaxMillions = (maxRev / 1000000).toFixed(0);

            return (
              <div 
                onMouseLeave={() => setHoveredSalesIndex(null)}
                style={{ flex: 1, position: 'relative', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 26 }}
              >
                
                {/* Guidelines & Y-Axis */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 44, textAlign: 'right', fontFamily: 'monospace' }}>Rp {revMaxMillions}M</span>
                  <div style={{ flex: 1, borderTop: '1px dashed var(--border-light)' }} />
                </div>
                <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 44, textAlign: 'right', fontFamily: 'monospace' }}>Rp {Math.round(revMaxMillions * 0.75)}M</span>
                  <div style={{ flex: 1, borderTop: '1px dashed var(--border-light)' }} />
                </div>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 44, textAlign: 'right', fontFamily: 'monospace' }}>Rp {Math.round(revMaxMillions * 0.5)}M</span>
                  <div style={{ flex: 1, borderTop: '1px dashed var(--border-light)' }} />
                </div>
                <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 44, textAlign: 'right', fontFamily: 'monospace' }}>Rp {Math.round(revMaxMillions * 0.25)}M</span>
                  <div style={{ flex: 1, borderTop: '1px dashed var(--border-light)' }} />
                </div>
                <div style={{ position: 'absolute', bottom: 26, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 44, textAlign: 'right', fontFamily: 'monospace' }}>Rp 0</span>
                  <div style={{ flex: 1, borderTop: '1px solid var(--border-light)' }} />
                </div>

                {/* Shaded Area Highlight Box for Active Selected Point */}
                {hoveredSalesIndex !== null && currentPoint && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 26,
                      left: `calc(44px + ${(currentPoint.x / 450) * 100}% - 30px)`,
                      width: 60,
                      background: 'rgba(224, 242, 254, 0.45)',
                      borderLeft: '1px dashed rgba(2, 132, 199, 0.35)',
                      borderRight: '1px dashed rgba(2, 132, 199, 0.35)',
                      borderRadius: 4,
                      zIndex: 2,
                      pointerEvents: 'none',
                      transition: 'left 0.2s ease'
                    }}
                  />
                )}

                {/* Smooth Harmonic Bezier SVG Trendline */}
                <svg
                  viewBox="0 0 450 150"
                  style={{ width: 'calc(100% - 44px)', height: '100%', marginLeft: 44, overflow: 'visible', zIndex: 4 }}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="salesGradientDynamic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0b2e8a" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#0b2e8a" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Smooth Area Gradient Fill */}
                  {areaD && (
                    <path
                      d={areaD}
                      fill="url(#salesGradientDynamic)"
                    />
                  )}

                  {/* Smooth Main Line */}
                  {lineD && (
                    <path
                      d={lineD}
                      fill="none"
                      stroke="#0b2e8a"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Clickable & Hoverable Marker Nodes */}
                  {coords.map((c, i) => (
                    <g 
                      key={i} 
                      onMouseEnter={() => setHoveredSalesIndex(i)}
                      onClick={() => setHoveredSalesIndex(i)} 
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={i === activeIdx ? 6 : 4}
                        fill={i === activeIdx ? '#0b2e8a' : '#ffffff'}
                        stroke="#0b2e8a"
                        strokeWidth={i === activeIdx ? 3 : 2}
                        style={{ transition: 'all 0.2s ease' }}
                      />
                    </g>
                  ))}
                </svg>

                {/* Floating Interactive Tooltip Box */}
                {hoveredSalesIndex !== null && currentPoint && currentPoint.pt && (
                  <div
                    style={{
                      position: 'absolute',
                      top: Math.max(10, currentPoint.y - 65),
                      left: `calc(44px + ${(currentPoint.x / 450) * 100}% - 70px)`,
                      background: '#0b2e8a',
                      color: '#ffffff',
                      borderRadius: 12,
                      padding: '8px 14px',
                      fontSize: 10.5,
                      boxShadow: '0 10px 25px rgba(11, 46, 138, 0.35)',
                      zIndex: 30,
                      minWidth: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      pointerEvents: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: 9.5, color: '#93c5fd', fontWeight: 600 }}>Periode: {currentPoint.pt.label}</div>
                    <div style={{ fontSize: 9.5, color: '#93c5fd', fontWeight: 600, marginTop: 2 }}>Total Nilai Kiriman</div>
                    <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: '-0.02em' }}>
                      {currentPoint.pt.revenueFormatted || `Rp ${(currentPoint.pt.revenue || 0).toLocaleString('id-ID')}`}
                    </div>
                    <div style={{ fontSize: 9.5, color: '#93c5fd', fontWeight: 600, marginTop: 2 }}>Volume Connotes</div>
                    <div style={{ fontWeight: 800 }}>{currentPoint.pt.connotesCount || 0} Resi</div>
                  </div>
                )}

                {/* X-Axis Dynamic Labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 44, marginTop: 8, fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {rawPoints.map((pt, i) => (
                    <span
                      key={pt.label + i}
                      onMouseEnter={() => setHoveredSalesIndex(i)}
                      onClick={() => setHoveredSalesIndex(i)}
                      style={{
                        cursor: 'pointer',
                        fontWeight: i === activeIdx ? 900 : 600,
                        color: i === activeIdx ? 'var(--primary-blue)' : 'var(--text-secondary)'
                      }}
                    >
                      {pt.label}
                    </span>
                  ))}
                </div>

              </div>
            );
          })()}

          {/* Bottom Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {salesCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategoryFilter(cat);
                  fetchStatsAndTop20({ service: cat !== 'All' ? cat : '' });
                }}
                className={`category-filter-pill ${activeCategoryFilter === cat ? 'active' : ''}`}
                style={{ whiteSpace: 'nowrap' }}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* ── 4. ROW 3: THREE BOTTOM ANALYTICS CARDS (100% REAL DATABASE DATA) ── */}
      <div className="grid-3" style={{ gap: 16 }}>
        
        {/* ── CARD 1: POPULAR CATEGORIES (DONUT CHART WITH REAL DB DATA) ── */}
        <div className="spatial-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>
              Popular Categories
            </h3>
            <button
              type="button"
              onClick={() => {
                setCategoryDetailSearch('');
                setCategorySortKey('count');
                setCategorySortOrder('desc');
                setIsPopularCategoriesModalOpen(true);
              }}
              className="btn-ghost"
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: 'var(--primary-blue)',
                padding: '3px 8px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                cursor: 'pointer',
                border: '1px solid rgba(2, 132, 199, 0.2)',
                background: 'rgba(2, 132, 199, 0.05)',
                transition: 'all 0.2s ease'
              }}
              title="Buka rincian lengkap Popular Categories"
            >
              See All <ArrowUpRight size={13} />
            </button>
          </div>

          {popularCategoriesList.length === 0 ? (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Belum ada data kategori kiriman pada periode ini.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 14, alignItems: 'center' }}>
              
              {/* Multi-Color Donut Chart with Center Text (100% Dynamic Matching Legend) */}
              <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
                {(() => {
                  const DONUT_COLORS = ['#0284c7', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#6366f1', '#64748b'];
                  const r = 38;
                  const circumference = 2 * Math.PI * r;
                  let accumulatedOffset = 0;

                  const topList = popularCategoriesList.slice(0, 5);
                  const totalPct = topList.reduce((acc, c) => acc + (c.percentage || 0), 0) || 100;

                  return (
                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                      <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="11" />
                      {topList.map((cat, idx) => {
                        const normalizedPct = cat.percentage > 0 ? (cat.percentage / totalPct) * 100 : 0;
                        const strokeLength = (normalizedPct / 100) * circumference;
                        const strokeDasharray = `${strokeLength} ${circumference}`;
                        const strokeDashoffset = -accumulatedOffset;
                        accumulatedOffset += strokeLength;
                        const color = DONUT_COLORS[idx % DONUT_COLORS.length];

                        return (
                          <circle
                            key={cat.name + idx}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke={color}
                            strokeWidth="11"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'all 0.4s ease' }}
                          />
                        );
                      })}
                    </svg>
                  );
                })()}
                
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.1,
                  padding: 10
                }}>
                  All Products
                </div>
              </div>

              {/* Categories Legend List from Database with Exact Matching Colors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                {popularCategoriesList.slice(0, 5).map((cat, idx) => {
                  const DONUT_COLORS = ['#0284c7', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#6366f1', '#64748b'];
                  const color = DONUT_COLORS[idx % DONUT_COLORS.length];
                  return (
                    <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                        {cat.name}
                      </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{cat.percentage}%</strong>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* ── CARD 2: AV. CHECK (REAL AVERAGE REVENUE RANKED BARS) ── */}
        <div className="spatial-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>
              Av. Check (Nilai per Resi)
            </h3>
            <Link to="/transaksi" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              See All <ArrowUpRight size={13} />
            </Link>
          </div>

          {avCheckData.length === 0 ? (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Belum ada data nilai per resi pada periode ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {avCheckData.slice(0, 5).map((item) => {
                const barWidth = `${Math.min(100, Math.max(15, Math.round((item.avgRevenue / maxAvRevenue) * 100)))}%`;
                return (
                  <div key={item.name} style={{ display: 'grid', gridTemplateColumns: '105px 1fr 75px', alignItems: 'center', gap: 8, fontSize: 11 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-blue)' }} />
                      {item.name}
                    </span>

                    <div style={{ width: '100%', height: 10, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: barWidth, height: '100%', background: 'var(--primary-blue)', borderRadius: 6 }} />
                    </div>

                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right', fontSize: 10.5 }}>
                      {item.avgRevenueFormatted}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CARD 3: AV. DELIVERY TIME (REGIONAL HUB TRANSIT SLA BARS) ── */}
        <div className="spatial-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>
                Av. Delivery Time
              </h3>
              <HelpCircle size={13} color="var(--text-muted)" />
            </div>
            <Link to="/kantor" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              See All <ArrowUpRight size={13} />
            </Link>
          </div>

          {avDeliveryData.length === 0 ? (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Belum ada data waktu transit kiriman pada periode ini.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {avDeliveryData.map((d) => (
                  <div key={d.region} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 65px', alignItems: 'center', gap: 8, fontSize: 11 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.region}
                    </span>
                    
                    <div style={{ width: '100%', height: 11, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: d.width || '45%', height: '100%', background: d.color, borderRadius: 6 }} />
                    </div>

                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right', fontSize: 10 }}>
                      {d.timeDisplay.split(' ')[0]} {d.timeDisplay.split(' ')[1]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Status Pill Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <span className="badge badge-emerald" style={{ padding: '3px 10px', fontSize: 10 }}>
                  Perfect
                </span>
                <span className="badge badge-blue" style={{ padding: '3px 10px', fontSize: 10 }}>
                  Fine
                </span>
                <span className="badge badge-pink" style={{ padding: '3px 10px', fontSize: 10 }}>
                  For too long
                </span>
              </div>
            </>
          )}

        </div>

      </div>

      {/* ── 5. ROW 4: FULL VIEW LIVE MONITORING (REAL-TIME TELEMETRY TABLE & FLEET DECK) ── */}
      <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Table Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
              <Package size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Live Connotes Telemetry Stream
                </h3>
                <span className="badge badge-emerald">
                  <span className="pulse" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)' }} />
                  REAL-TIME SYNC
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Manifest data pengiriman terkini dari basis data MongoDB IPOS5 ({totalPackages.toLocaleString('id-ID')} Resi)
              </p>
            </div>
          </div>

          {/* Table Search & Link */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface-soft)',
              border: '1px solid var(--border-light)',
              borderRadius: 9999,
              padding: '6px 14px',
              gap: 8,
              width: 260,
              maxWidth: '100%'
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Cari resi, pengirim, kota..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 12.5,
                  width: '100%'
                }}
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  title="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <Link
              to="/transaksi"
              className="btn-ghost"
              style={{ textDecoration: 'none', fontSize: 11.5, padding: '7px 14px' }}
            >
              Lihat Semua Manifest
            </Link>
          </div>
        </div>

        {/* Live Manifest Table */}
        <div className="table-responsive-container" style={{ maxHeight: 380, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>NO. CONNOTE / RESI</th>
                <th>LAYANAN</th>
                <th>RUTE ASAL / TUJUAN</th>
                <th>PENGIRIM / PENERIMA</th>
                <th style={{ textAlign: 'right' }}>BERAT</th>
                <th>ARMADA FEEDER</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredConnotes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                    {searchFilter ? 'Tidak ada connote yang sesuai dengan filter pencarian.' : (isFiltered ? 'Tidak ada connote yang tercatat pada filter tanggal ini.' : 'Tidak ada data connotes di database.')}
                  </td>
                </tr>
              ) : (
                filteredConnotes.slice(0, 20).map((c, idx) => {
                  const rawConnote = c.raw?.connote || {};
                  const nopol = c.raw?.assigned_vehicle || c.raw?.vehicle_nopol || c.vehicle_nopol || '-';
                  const service = c.connote_service || rawConnote.connote_service || 'Pos Reguler';
                  const weight = c.actual_weight || rawConnote.actual_weight || 1.0;
                  const origin = c.location_name || 'KCU Cimahi 40511';
                  const dest = rawConnote.connote_receiver_city || c.destination_nopen || 'SPP Bandung 40400';
                  const sender = c.connote_sender_name || rawConnote.connote_sender_name || 'Pengirim';
                  const receiver = c.connote_receiver_name || rawConnote.connote_receiver_name || 'Penerima';
                  const status = c.connote_state || rawConnote.connote_state || 'IN_TRANSIT';

                  const getServiceBadge = (srv) => {
                    if (srv.includes('Nextday')) return 'badge-cyan';
                    if (srv.includes('Cargo') || srv.includes('Jumbo')) return 'badge-purple';
                    if (srv.includes('Sameday')) return 'badge-amber';
                    return 'badge-blue';
                  };

                  return (
                    <tr key={c.connote_code || c._id || idx}>
                      <td className="font-mono" style={{ color: 'var(--text-muted)' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Link 
                            to={`/checker?code=${c.connote_code}`} 
                            className="font-mono"
                            style={{ textDecoration: 'none', color: 'var(--primary-blue)', fontWeight: 800 }}
                          >
                            {c.connote_code}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleCopy(c.connote_code)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: copiedResi === c.connote_code ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
                            title="Salin Resi"
                          >
                            {copiedResi === c.connote_code ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getServiceBadge(service)}`} style={{ fontSize: 10.5, padding: '2px 8px' }}>
                          {service}
                        </span>
                      </td>
                      <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{origin.split(' ')[0]}</span>
                        <ArrowRight size={11} style={{ display: 'inline', margin: '0 4px', color: 'var(--accent-cyan)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{dest}</span>
                      </td>
                      <td style={{ maxWidth: 190, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{sender.split(' ')[0]}</span>
                        <ArrowRight size={11} style={{ display: 'inline', margin: '0 4px', color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{receiver.split(' ')[0]}</span>
                      </td>
                      <td className="font-mono" style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {Number(weight).toFixed(1)} kg
                      </td>
                      <td>
                        {nopol && nopol !== '-' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Truck size={12} color="var(--accent-cyan)" />
                            <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)' }}>{nopol}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Belum Dialokasi</span>
                        )}
                      </td>
                      <td>
                        <span className={getBadgeClass(status)} style={{ fontSize: 9.5 }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link
                          to={`/checker?code=${c.connote_code}`}
                          className="btn-ghost"
                          style={{
                            padding: '3px 8px',
                            fontSize: 10.5,
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            color: 'var(--accent-cyan)'
                          }}
                        >
                          <span>Track</span>
                          <ChevronRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
          <div>
            Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{Math.min(20, filteredConnotes.length)}</strong> connote resi teratas dari total <strong style={{ color: 'var(--primary-navy)' }}>{totalPackages.toLocaleString('id-ID')}</strong> resi aktif.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="pulse" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)' }} />
            <span>Database Status: Connected & Live Synced (MongoDB ipos5_reporting)</span>
          </div>
        </div>

      </div>

      {/* ── MODAL: DETAIL POPULAR CATEGORIES (BREAKDOWN LENGKAP DISTRIBUSI LAYANAN) ── */}
      {isPopularCategoriesModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsPopularCategoriesModalOpen(false)}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            background: 'rgba(3, 7, 18, 0.72)',
            zIndex: 1050
          }}
        >
          <div
            className="modal-content"
            style={{ 
              maxWidth: 1060, 
              width: '94%', 
              maxHeight: '92vh',
              borderRadius: 20,
              border: '1px solid rgba(2, 132, 199, 0.28)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(2, 132, 199, 0.12)',
              background: 'var(--bg-surface)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Gradient Accent */}
            <div 
              className="modal-header" 
              style={{ 
                padding: '18px 24px', 
                borderBottom: '1px solid var(--border-light)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: 'linear-gradient(180deg, var(--bg-surface-soft) 0%, var(--bg-surface) 100%)',
                position: 'relative'
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #0284c7, #38bdf8, #a855f7, #10b981)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 12, 
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(56, 189, 248, 0.1) 100%)', 
                  border: '1.5px solid rgba(2, 132, 199, 0.35)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--primary-blue)',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
                }}>
                  <PieChartIcon size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                      Detail Popular Categories
                    </h2>
                    <span className="badge badge-navy" style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 800, background: 'rgba(2, 132, 199, 0.15)', color: 'var(--primary-blue)', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
                      {popularCategoriesList.length} Layanan Terdaftar
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                      Live Data
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Rincian pangsa pasar, volume transaksi, kontribusi omzet revenue, dan total tonase kiriman per produk pos
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* CSV Download Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    if (!popularCategoriesList.length) return;
                    const headers = ['No', 'Kategori Layanan', 'Pangsa Pasar (%)', 'Jumlah Resi', 'Total Revenue (IDR)', 'Rata-rata per Resi (IDR)', 'Total Bobot (kg)'];
                    const rows = popularCategoriesList.map((c, i) => [
                      i + 1,
                      `"${c.name}"`,
                      `${c.percentage}%`,
                      c.count,
                      c.totalRevenue,
                      c.count > 0 ? Math.round(c.totalRevenue / c.count) : 0,
                      c.totalWeightKg
                    ]);
                    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `popular_categories_${datePreset}_${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="btn-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-surface-soft)'
                  }}
                  title="Export Data Kategori ke File CSV"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setIsPopularCategoriesModalOpen(false)}
                  style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: 10, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: 0, 
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-surface-soft)',
                    cursor: 'pointer'
                  }}
                  title="Tutup Modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '22px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* 1. Summary KPI Mini Cards with Vibrant Gradient Top Borders */}
              <div className="grid-4" style={{ gap: 14 }}>
                
                {/* KPI 1: Total Volume */}
                <div 
                  className="stat-card" 
                  style={{ 
                    padding: '14px 16px', 
                    background: 'var(--bg-surface-soft)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: 12,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#0284c7' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Total Kiriman
                    </span>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={15} />
                    </div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginTop: 6, letterSpacing: '-0.02em' }}>
                    {totalCatShipments.toLocaleString('id-ID')} <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Resi</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--primary-blue)', marginTop: 4, fontWeight: 600 }}>
                    100% total transaksi periode ini
                  </div>
                </div>

                {/* KPI 2: Total Revenue */}
                <div 
                  className="stat-card" 
                  style={{ 
                    padding: '14px 16px', 
                    background: 'var(--bg-surface-soft)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: 12,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#10b981' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Total Revenue
                    </span>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Coins size={15} />
                    </div>
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 900, color: 'var(--accent-emerald)', marginTop: 6, letterSpacing: '-0.02em' }}>
                    Rp {totalCatRevenue.toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    Rata-rata <strong style={{ color: 'var(--text-primary)' }}>Rp {totalCatShipments > 0 ? Math.round(totalCatRevenue / totalCatShipments).toLocaleString('id-ID') : 0}</strong> / resi
                  </div>
                </div>

                {/* KPI 3: Total Weight Tonase */}
                <div 
                  className="stat-card" 
                  style={{ 
                    padding: '14px 16px', 
                    background: 'var(--bg-surface-soft)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: 12,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#38bdf8' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Total Bobot Kargo
                    </span>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Scale size={15} />
                    </div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary-blue)', marginTop: 6, letterSpacing: '-0.02em' }}>
                    {totalCatWeightKg >= 1000 ? `${(totalCatWeightKg / 1000).toFixed(2)} Ton` : `${totalCatWeightKg.toLocaleString('id-ID')} kg`}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    &plusmn; <strong style={{ color: 'var(--text-primary)' }}>{totalCatShipments > 0 ? (totalCatWeightKg / totalCatShipments).toFixed(2) : 0} kg</strong> rata-rata per paket
                  </div>
                </div>

                {/* KPI 4: Market Leader */}
                <div 
                  className="stat-card" 
                  style={{ 
                    padding: '14px 16px', 
                    background: 'var(--bg-surface-soft)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: 12,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#f59e0b' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Kategori Teratas (#1)
                    </span>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trophy size={15} />
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent-amber)', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {topCategoryItem ? `${topCategoryItem.name}` : '-'}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    Pangsa Pasar: <strong style={{ color: 'var(--accent-amber)' }}>{topCategoryItem ? `${topCategoryItem.percentage}%` : '0%'}</strong> ({topCategoryItem?.count || 0} resi)
                  </div>
                </div>

              </div>

              {/* 2. Visual Donut Breakdown Card (Interactive Split Layout) */}
              {popularCategoriesList.length > 0 && (
                <div 
                  style={{ 
                    padding: '20px 22px', 
                    background: 'var(--bg-surface-soft)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: 16, 
                    display: 'grid', 
                    gridTemplateColumns: '220px 1fr', 
                    gap: 24, 
                    alignItems: 'center',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* SVG Donut with Cyber Center Glow */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: 160, height: 160 }}>
                      {(() => {
                        const DONUT_COLORS = ['#0284c7', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16', '#06b6d4', '#64748b'];
                        const r = 38;
                        const circumference = 2 * Math.PI * r;
                        let accumulatedOffset = 0;
                        const totalPct = popularCategoriesList.reduce((acc, c) => acc + (c.percentage || 0), 0) || 100;

                        return (
                          <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' }}>
                            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                            {popularCategoriesList.map((cat, idx) => {
                              const normalizedPct = cat.percentage > 0 ? (cat.percentage / totalPct) * 100 : 0;
                              const strokeLength = (normalizedPct / 100) * circumference;
                              const strokeDasharray = `${strokeLength} ${circumference}`;
                              const strokeDashoffset = -accumulatedOffset;
                              accumulatedOffset += strokeLength;
                              const color = DONUT_COLORS[idx % DONUT_COLORS.length];

                              return (
                                <circle
                                  key={cat.name + idx}
                                  cx="50"
                                  cy="50"
                                  r="38"
                                  fill="none"
                                  stroke={color}
                                  strokeWidth="12"
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={strokeDashoffset}
                                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                                />
                              );
                            })}
                          </svg>
                        );
                      })()}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        lineHeight: 1.2
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dominasi</span>
                        <strong style={{ fontSize: 15, fontWeight: 900, color: 'var(--primary-blue)', marginTop: 2 }}>{popularCategoriesList.length} Layanan</strong>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{totalCatShipments} Paket</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Comparison List with Double Tier Bars & Ranks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={15} color="var(--primary-blue)" /> Komparasi Pangsa Pasar (Volume vs Revenue)
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Data Riil MongoDB IPOS5
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                      {popularCategoriesList.map((cat, idx) => {
                        const DONUT_COLORS = ['#0284c7', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16', '#06b6d4', '#64748b'];
                        const color = DONUT_COLORS[idx % DONUT_COLORS.length];
                        const revenueSharePct = totalCatRevenue > 0 ? Math.round((cat.totalRevenue / totalCatRevenue) * 100) : 0;
                        
                        return (
                          <div 
                            key={cat.name} 
                            style={{ 
                              background: 'var(--bg-surface)', 
                              border: '1px solid var(--border-light)', 
                              borderRadius: 10, 
                              padding: '10px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ 
                                  fontSize: 10.5, 
                                  fontWeight: 900, 
                                  fontFamily: 'monospace', 
                                  padding: '1px 6px', 
                                  borderRadius: 4, 
                                  background: idx === 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.06)',
                                  color: idx === 0 ? '#f59e0b' : 'var(--text-secondary)',
                                  border: `1px solid ${idx === 0 ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-light)'}`
                                }}>
                                  #{idx + 1}
                                </span>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                                <strong style={{ color: 'var(--text-primary)', fontSize: 12.5 }}>{cat.name}</strong>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                  <strong style={{ color: color, fontSize: 12 }}>{cat.percentage}%</strong> ({cat.count.toLocaleString('id-ID')} resi)
                                </span>
                                <span style={{ 
                                  fontSize: 10.5, 
                                  fontWeight: 700, 
                                  padding: '2px 7px', 
                                  borderRadius: 4, 
                                  background: 'rgba(16, 185, 129, 0.1)', 
                                  color: 'var(--accent-emerald)', 
                                  border: '1px solid rgba(16, 185, 129, 0.2)' 
                                }}>
                                  Rev {revenueSharePct}% • Rp {cat.totalRevenue.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>

                            {/* Dual Gradient Progress Bar */}
                            <div style={{ width: '100%', height: 7, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 6, overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  width: `${Math.min(100, Math.max(3, cat.percentage))}%`, 
                                  height: '100%', 
                                  background: `linear-gradient(90deg, ${color}, #38bdf8)`, 
                                  borderRadius: 6, 
                                  transition: 'width 0.4s ease',
                                  boxShadow: `0 0 8px ${color}66`
                                }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Search, Quick Filters & Sorting Controls Bar */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: 12,
                  background: 'var(--bg-surface-soft)',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--border-light)'
                }}
              >
                {/* Search Box */}
                <div style={{ position: 'relative', width: 280 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Cari kategori produk layanan..."
                    value={categoryDetailSearch}
                    onChange={(e) => setCategoryDetailSearch(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: 34, fontSize: 12, height: 36, borderRadius: 8 }}
                  />
                  {categoryDetailSearch && (
                    <button
                      type="button"
                      onClick={() => setCategoryDetailSearch('')}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Quick Service Filter Chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => setCategoryDetailSearch('')}
                    className={`category-filter-pill ${categoryDetailSearch === '' ? 'active' : ''}`}
                    style={{ fontSize: 11, padding: '4px 10px', height: 32, borderRadius: 6 }}
                  >
                    Semua ({popularCategoriesList.length})
                  </button>
                  {popularCategoriesList.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setCategoryDetailSearch(c.name)}
                      className={`category-filter-pill ${categoryDetailSearch === c.name ? 'active' : ''}`}
                      style={{ fontSize: 11, padding: '4px 10px', height: 32, borderRadius: 6, whiteSpace: 'nowrap' }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                {/* Sorting Select & Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Urutkan:</span>
                  <select
                    className="form-control"
                    value={categorySortKey}
                    onChange={(e) => setCategorySortKey(e.target.value)}
                    style={{ fontSize: 11.5, height: 36, padding: '4px 12px', width: 175, borderRadius: 8 }}
                  >
                    <option value="count">Jumlah Resi (Volume)</option>
                    <option value="percentage">Pangsa Pasar (%)</option>
                    <option value="totalRevenue">Total Revenue (Rp)</option>
                    <option value="totalWeightKg">Total Bobot (kg)</option>
                    <option value="name">Nama Kategori (A-Z)</option>
                  </select>
                  
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setCategorySortOrder(categorySortOrder === 'desc' ? 'asc' : 'desc')}
                    style={{ 
                      height: 36, 
                      padding: '0 12px', 
                      fontSize: 11.5, 
                      fontWeight: 800, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6,
                      borderRadius: 8,
                      border: '1px solid var(--border-light)'
                    }}
                    title={categorySortOrder === 'desc' ? 'Urutan Menurun (Tinggi ke Rendah)' : 'Urutan Menaik (Rendah ke Tinggi)'}
                  >
                    <ArrowUpDown size={13} />
                    <span>{categorySortOrder.toUpperCase()}</span>
                  </button>
                </div>
              </div>

              {/* Active Search & Filter Banner */}
              {categoryDetailSearch && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '8px 14px', 
                  background: 'rgba(2, 132, 199, 0.1)', 
                  borderRadius: 10, 
                  border: '1px solid rgba(2, 132, 199, 0.25)', 
                  fontSize: 12 
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Menampilkan hasil filter: <strong style={{ color: 'var(--primary-blue)' }}>"{categoryDetailSearch}"</strong> ({modalCategoriesFiltered.length} dari {popularCategoriesList.length} layanan ditemukan)
                  </span>
                  <button
                    type="button"
                    onClick={() => setCategoryDetailSearch('')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#ef4444', 
                      fontWeight: 800, 
                      cursor: 'pointer', 
                      fontSize: 11.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <X size={13} />
                    <span>Reset Filter / Tampilkan Semua ({popularCategoriesList.length})</span>
                  </button>
                </div>
              )}

              {/* 4. Full Width Roomy Breakdown Table */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <table className="data-table" style={{ width: '100%', fontSize: 12, margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-soft)' }}>
                      <th style={{ width: 50, textAlign: 'center' }}>#</th>
                      <th style={{ minWidth: 170 }}>KATEGORI LAYANAN</th>
                      <th style={{ textAlign: 'center', width: 130 }}>PANGSA PASAR</th>
                      <th style={{ textAlign: 'right', width: 110 }}>JUMLAH RESI</th>
                      <th style={{ textAlign: 'right', width: 130 }}>TOTAL REVENUE</th>
                      <th style={{ textAlign: 'right', width: 120 }}>RATA-RATA / RESI</th>
                      <th style={{ textAlign: 'right', width: 120 }}>TOTAL TONASE</th>
                      <th style={{ textAlign: 'center', width: 150 }}>AKSI DASHBOARD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalCategoriesFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                          <AlertCircle size={24} style={{ marginBottom: 6, opacity: 0.5 }} />
                          <div>Tidak ada kategori yang cocok dengan kata kunci "{categoryDetailSearch}".</div>
                        </td>
                      </tr>
                    ) : (
                      modalCategoriesFiltered.map((cat, idx) => {
                        const DONUT_COLORS = ['#0284c7', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16', '#06b6d4', '#64748b'];
                        const originalIdx = popularCategoriesList.findIndex(c => c.name === cat.name);
                        const color = DONUT_COLORS[(originalIdx >= 0 ? originalIdx : idx) % DONUT_COLORS.length];
                        const avgPerConnote = cat.count > 0 ? Math.round(cat.totalRevenue / cat.count) : 0;
                        const avgWeight = cat.count > 0 ? (cat.totalWeightKg / cat.count).toFixed(2) : 0;

                        return (
                          <tr key={cat.name} style={{ transition: 'background 0.15s ease' }}>
                            {/* Rank Badge */}
                            <td style={{ textAlign: 'center' }}>
                              <span 
                                style={{ 
                                  display: 'inline-block',
                                  fontSize: 10.5,
                                  fontWeight: 900,
                                  fontFamily: 'monospace',
                                  padding: '2px 6px',
                                  borderRadius: 5,
                                  background: idx === 0 ? 'rgba(245, 158, 11, 0.15)' : idx === 1 ? 'rgba(148, 163, 184, 0.15)' : idx === 2 ? 'rgba(217, 119, 6, 0.15)' : 'rgba(255,255,255,0.05)',
                                  color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#d97706' : 'var(--text-muted)',
                                  border: `1px solid ${idx === 0 ? 'rgba(245, 158, 11, 0.3)' : idx === 1 ? 'rgba(148, 163, 184, 0.3)' : 'var(--border-light)'}`
                                }}
                              >
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                            </td>

                            {/* Service Category Info */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}88` }} />
                                <div>
                                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>{cat.name}</div>
                                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Layanan Resmi PT Pos Indonesia</div>
                                </div>
                              </div>
                            </td>

                            {/* Market Share Progress Bar */}
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 11, padding: '0 4px' }}>
                                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Share</span>
                                  <strong style={{ color: color, fontSize: 11.5 }}>{cat.percentage}%</strong>
                                </div>
                                <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(100, cat.percentage)}%`, height: '100%', background: color, borderRadius: 4 }} />
                                </div>
                              </div>
                            </td>

                            {/* Volume Count */}
                            <td className="font-mono" style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)', fontSize: 12.5 }}>
                              {cat.count.toLocaleString('id-ID')} <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>resi</span>
                            </td>

                            {/* Total Revenue */}
                            <td className="font-mono" style={{ textAlign: 'right', fontWeight: 900, color: 'var(--accent-emerald)', fontSize: 12.5 }}>
                              Rp {cat.totalRevenue.toLocaleString('id-ID')}
                            </td>

                            {/* Average Ticket Size */}
                            <td className="font-mono" style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 11.5 }}>
                              Rp {avgPerConnote.toLocaleString('id-ID')}
                            </td>

                            {/* Total Weight & Avg */}
                            <td className="font-mono" style={{ textAlign: 'right', color: 'var(--text-primary)', fontSize: 11.5 }}>
                              <strong>{cat.totalWeightKg >= 1000 ? `${(cat.totalWeightKg / 1000).toFixed(2)} Ton` : `${cat.totalWeightKg.toLocaleString('id-ID')} kg`}</strong>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>&plusmn; {avgWeight} kg/resi</div>
                            </td>

                            {/* Action Button: Filter Dashboard */}
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCategoryFilter(cat.name);
                                  fetchStatsAndTop20({ service: cat.name });
                                  setIsPopularCategoriesModalOpen(false);
                                }}
                                className="btn-ghost"
                                style={{
                                  padding: '5px 12px',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: 'var(--primary-blue)',
                                  background: 'rgba(2, 132, 199, 0.08)',
                                  border: '1px solid rgba(2, 132, 199, 0.25)',
                                  borderRadius: 8,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title={`Terapkan filter dashboard untuk layanan ${cat.name}`}
                              >
                                <Filter size={12} />
                                <span>Filter Dashboard</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer with Live Status */}
            <div 
              style={{ 
                padding: '14px 24px', 
                borderTop: '1px solid var(--border-light)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-surface-soft) 100%)' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span className="pulse" style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                <span>Filter Aktif: <strong style={{ color: 'var(--text-primary)' }}>{selectedDateRange}</strong> &bull; Database: <span className="font-mono text-cyan" style={{ fontSize: 11 }}>MongoDB (ipos5_reporting)</span></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-navy"
                  onClick={() => setIsPopularCategoriesModalOpen(false)}
                  style={{ 
                    padding: '8px 22px', 
                    fontSize: 12.5, 
                    fontWeight: 800, 
                    borderRadius: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  Tutup Modal
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
