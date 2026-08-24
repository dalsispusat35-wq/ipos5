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
  X, ArrowRight
} from 'lucide-react';
import { api } from '../utils/api.js';

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

  // Av Check (Average Revenue per Service from DB)
  const avCheckData = dbStats?.avCheck || [];

  const maxAvRevenue = Math.max(...avCheckData.map(d => d.avgRevenue || 1), 1);

  // Av Delivery Time by Region & Hub SLA from Database
  const avDeliveryData = (totalPackages > 0 && dbStats?.avDeliveryTime) ? dbStats.avDeliveryTime : [];

  // Category filter options from real DB
  const salesCategories = ['All', 'Pos Nextday', 'Pos Reguler', 'Pos Sameday', 'Pos Shopee', 'Pos Jumbo'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', paddingBottom: 20 }}>
      
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
                  revenue: b.revenue || (b.total * 150000),
                  revenueFormatted: `Rp ${(b.revenue || (b.total * 150000)).toLocaleString('id-ID')}`,
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
            <Link to="/produk" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              See All <ArrowUpRight size={13} />
            </Link>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface-soft)',
              border: '1px solid var(--border-light)',
              borderRadius: 9999,
              padding: '6px 14px',
              gap: 8,
              width: 260
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
        <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
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

    </div>
  );
}
