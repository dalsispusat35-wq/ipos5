import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api.js';
import { 
  Building, Box, Truck, Map, Calendar, Settings, 
  Database, Activity, ArrowRight, Layers, PlayCircle,
  BarChart2, PieChart, GitCommit, Grid, Search, Filter, X
} from 'lucide-react';

function Dashboard({ activeConnection, refreshStatsTrigger }) {
  const [stats, setStats] = useState({
    totalKantor: 0,
    totalProduk: 0,
    totalKendaraan: 0,
    totalRoute: 0,
    totalDetailRoute: 0,
    totalJadwalBulanIni: 0,
    transactionStats: {
      DITERIMA_DI_CILILIN: 0,
      DITERIMA_DI_CIMAHI: 0,
      TRANSIT_SPP_BANDUNG: 0,
      TIBA_DI_SPP_TUJUAN: 0,
      DELIVERED: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Interactive View Controls & Filters
  const [viewMode, setViewMode] = useState('bar'); // 'bar' | 'donut' | 'flow' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [sortBy, setSortBy] = useState('volume'); // 'volume' | 'name'
  const [maxScaleOption, setMaxScaleOption] = useState('auto'); // 'auto' | '2000' | '500' | '100'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.getDashboardStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [activeConnection, refreshStatsTrigger]);

  const transactionData = stats.transactionStats || {};
  const totalPackages = Object.values(transactionData).reduce((a, b) => a + b, 0);

  // Helper: Format raw DB state keys into clean human-readable titles while maintaining exact DB keys
  const formatStatusDisplay = (rawState) => {
    if (!rawState) return '';
    const cleaned = rawState.replace(/_/g, ' ');
    if (cleaned.startsWith('DITERIMA DI ')) {
      return 'Diterima di ' + cleaned.substring(12);
    }
    if (cleaned.startsWith('TIBA DI ')) {
      return 'Tiba di ' + cleaned.substring(8);
    }
    if (cleaned.startsWith('TRANSIT ')) {
      return 'Transit ' + cleaned.substring(8);
    }
    if (cleaned === 'INVEHICLE' || cleaned === 'IN VEHICLE') return 'Dalam Kendaraan';
    if (cleaned === 'INBAG' || cleaned === 'IN BAG') return 'Dalam Kantong';
    if (cleaned === 'CANCEL') return 'Dibatalkan';
    if (cleaned === 'DELIVERED') return 'Selesai Terkirim';
    return cleaned;
  };

  // Generate chart items dynamically based on exact keys present in database
  const rawChartItems = useMemo(() => {
    const palette = [
      '#00D2C4', '#f97316', '#a855f7', '#3b82f6', 
      '#10b981', '#ec4899', '#D4AF37', '#14b8a6', 
      '#8b5cf6', '#eab308', '#06b6d4', '#f43f5e'
    ];

    return Object.keys(transactionData).map((key, index) => {
      const val = transactionData[key] || 0;
      const upper = key.toUpperCase();
      let color = palette[index % palette.length];
      let icon = '📦';
      let stage = 'PROCESSING'; // INTAKE | TRANSPORT | PROCESSING | DELIVERED | ISSUE

      if (upper.includes('CANCEL') || upper.includes('REJECT') || upper.includes('FAIL')) {
        color = '#ef4444';
        icon = '❌';
        stage = 'ISSUE';
      } else if (upper.includes('DELIVERED') || upper.includes('SELESAI')) {
        color = '#10b981';
        icon = '🏁';
        stage = 'DELIVERED';
      } else if (upper.includes('VEHICLE') || upper.includes('KENDARAAN') || upper.includes('TRANSIT')) {
        color = '#f97316';
        icon = '🚚';
        stage = 'TRANSPORT';
      } else if (upper.includes('BAG') || upper.includes('SIAP_MUAT') || upper.includes('ACCEPT')) {
        color = '#3b82f6';
        icon = '💼';
        stage = 'INTAKE';
      } else if (upper.includes('DITERIMA') || upper.includes('TIBA') || upper.includes('SPP')) {
        color = '#00D2C4';
        icon = '🏢';
        stage = 'PROCESSING';
      }

      return {
        key, // EXACT database key
        formattedName: formatStatusDisplay(key),
        val,
        color,
        icon,
        stage
      };
    });
  }, [transactionData]);

  const chartItems = rawChartItems;
  const autoMaxVal = Math.max(...rawChartItems.map(item => item.val), 5);

  // Dynamic max scale for bar height scaling (Auto vs Fixed 2000/500/100)
  const currentMaxScale = useMemo(() => {
    if (maxScaleOption === '2000') return 2000;
    if (maxScaleOption === '500') return 500;
    if (maxScaleOption === '100') return 100;
    return autoMaxVal;
  }, [maxScaleOption, autoMaxVal, rawChartItems]);

  // Filtered & Sorted items for view renderings
  const filteredItems = useMemo(() => {
    let items = [...rawChartItems];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.key.toLowerCase().includes(q) || 
        item.formattedName.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'volume') {
      items.sort((a, b) => b.val - a.val);
    } else {
      items.sort((a, b) => a.key.localeCompare(b.key));
    }
    return items;
  }, [rawChartItems, searchQuery, sortBy]);

  // Logistics Flow Stage Groups for Pipeline view mode
  const flowStages = useMemo(() => {
    const stages = [
      { id: 'INTAKE', title: 'Intake & Kantong', icon: '📥', color: '#3b82f6', items: [] },
      { id: 'TRANSPORT', title: 'Pengangkutan / Transit', icon: '🚚', color: '#f97316', items: [] },
      { id: 'PROCESSING', title: 'Hub & Kantor Pos', icon: '🏢', color: '#00D2C4', items: [] },
      { id: 'DELIVERED', title: 'Delivered / Selesai', icon: '🏁', color: '#10b981', items: [] },
      { id: 'ISSUE', title: 'Cancel / Kendala', icon: '⚠️', color: '#ef4444', items: [] }
    ];

    rawChartItems.forEach(item => {
      const targetStage = stages.find(s => s.id === item.stage) || stages[2];
      targetStage.items.push(item);
    });

    return stages;
  }, [rawChartItems]);

  // SVG Donut Slices Data Calculation
  const donutData = useMemo(() => {
    const r = 68;
    const circumference = 2 * Math.PI * r;
    let accumulatedAngle = 0;
    const total = totalPackages || 1;

    const slices = rawChartItems.map(item => {
      const ratio = item.val / total;
      const strokeDasharray = `${ratio * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedAngle * circumference;
      accumulatedAngle += ratio;
      const pct = Math.round(ratio * 100);

      return {
        ...item,
        pct,
        strokeDasharray,
        strokeDashoffset
      };
    });

    return { r, circumference, slices };
  }, [rawChartItems, totalPackages]);

  return (
    <div className="animate-fade-in">
      {/* Welcome Card */}
      <div className="glass-card" style={{ padding: '30px', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-hover) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '16px' }}>
            <Map size={48} className="text-accent" style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Selamat Datang di Dashboard IPOS5 Routing
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
              Sistem manajemen routing, otomasi jadwal transportasi, dan pemantauan data kiriman Pos Indonesia.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
          <Activity className="animate-spin text-accent" size={36} style={{ color: 'var(--accent-cyan)' }} />
        </div>
      ) : error ? (
        <div className="info-alert" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)' }}>
          <div>⚠️ Gagal memuat data statistik: {error}. Pastikan koneksi database Anda aktif di menu Pengaturan.</div>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid-6 mb-4" style={{ marginBottom: '24px' }}>
            <div className="stat-card stat-kantor">
              <div className="stat-icon-wrapper"><Building size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalKantor}</span>
                <span className="stat-label">Total Kantor</span>
              </div>
            </div>
            <div className="stat-card stat-produk">
              <div className="stat-icon-wrapper"><Box size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalProduk}</span>
                <span className="stat-label">Total Produk</span>
              </div>
            </div>
            <div className="stat-card stat-kendaraan">
              <div className="stat-icon-wrapper"><Truck size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalKendaraan}</span>
                <span className="stat-label">Kendaraan Aktif</span>
              </div>
            </div>
            <div className="stat-card stat-route">
              <div className="stat-icon-wrapper"><Map size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalRoute}</span>
                <span className="stat-label">Rute Aktif</span>
              </div>
            </div>
            <div className="stat-card stat-detail">
              <div className="stat-icon-wrapper"><Layers size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalDetailRoute}</span>
                <span className="stat-label">Segmen Rute</span>
              </div>
            </div>
            <div className="stat-card stat-jadwal">
              <div className="stat-icon-wrapper"><Calendar size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalJadwalBulanIni}</span>
                <span className="stat-label">Jadwal Bulan Ini</span>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Real-time Logistics Volume Chart Card */}
            <div className="glass-card" style={{ padding: '24px', overflow: 'hidden' }}>
              {/* Header with Title, Active Badge & Controls */}
              <div style={{ 
                display: 'flex', 
                justify: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px', 
                flexWrap: 'wrap', 
                gap: '14px',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    padding: '10px', 
                    background: 'rgba(0, 210, 196, 0.1)', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(0, 210, 196, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center'
                  }}>
                    <Activity size={22} style={{ color: 'var(--accent-cyan)' }} /> 
                  </div>
                  <div>
                    <h3 className="card-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Analisis Volume & Alur Kiriman Paket 
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        fontSize: '10px', 
                        color: 'var(--accent-green)', 
                        background: 'rgba(16, 185, 129, 0.12)', 
                        padding: '2px 8px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse 1.5s infinite' }}></span>
                        Real-Time
                      </span>
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Visualisasi distribusi & status transaksi paket aktif di seluruh rute operasional.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="badge badge-info" style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 800, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    📦 {totalPackages} TOTAL PAKET AKTIF
                  </span>
                </div>
              </div>

              {/* Toolbar Controls: View Switcher Tabs & Search Filter */}
              <div style={{ 
                display: 'flex', 
                justify: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px', 
                gap: '12px', 
                flexWrap: 'wrap',
                background: 'var(--bg-card-hover)',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-light)'
              }}>
                {/* View Mode Tabs */}
                <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-navy)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <button 
                    type="button"
                    className={`btn ${viewMode === 'bar' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setViewMode('bar')}
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px', 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      borderRadius: '6px',
                      background: viewMode === 'bar' ? 'var(--accent-cyan)' : 'transparent',
                      color: viewMode === 'bar' ? 'var(--bg-dark)' : 'var(--text-secondary)'
                    }}
                  >
                    <BarChart2 size={15} /> Bar Chart
                  </button>
                  <button 
                    type="button"
                    className={`btn ${viewMode === 'donut' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setViewMode('donut')}
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px', 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      borderRadius: '6px',
                      background: viewMode === 'donut' ? 'var(--accent-cyan)' : 'transparent',
                      color: viewMode === 'donut' ? 'var(--bg-dark)' : 'var(--text-secondary)'
                    }}
                  >
                    <PieChart size={15} /> Donut
                  </button>
                  <button 
                    type="button"
                    className={`btn ${viewMode === 'flow' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setViewMode('flow')}
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px', 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      borderRadius: '6px',
                      background: viewMode === 'flow' ? 'var(--accent-cyan)' : 'transparent',
                      color: viewMode === 'flow' ? 'var(--bg-dark)' : 'var(--text-secondary)'
                    }}
                  >
                    <GitCommit size={15} /> Alur Kiriman
                  </button>
                  <button 
                    type="button"
                    className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setViewMode('grid')}
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px', 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      borderRadius: '6px',
                      background: viewMode === 'grid' ? 'var(--accent-cyan)' : 'transparent',
                      color: viewMode === 'grid' ? 'var(--bg-dark)' : 'var(--text-secondary)'
                    }}
                  >
                    <Grid size={15} /> Grid Cards
                  </button>
                </div>

                {/* Search & Sort Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: isMobile ? '1 1 100%' : 'auto', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: isMobile ? '100%' : '170px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Cari status paket..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '6px 10px 6px 30px', 
                        fontSize: '12px', 
                        background: 'var(--bg-navy)', 
                        border: '1px solid var(--border-light)', 
                        borderRadius: '6px', 
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                    {searchQuery && (
                      <X 
                        size={14} 
                        onClick={() => setSearchQuery('')}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }} 
                      />
                    )}
                  </div>

                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ 
                      padding: '6px 10px', 
                      fontSize: '12px', 
                      background: 'var(--bg-navy)', 
                      border: '1px solid var(--border-light)', 
                      borderRadius: '6px', 
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="volume">Urut Volume (Tertinggi)</option>
                    <option value="name">Urut Nama Status</option>
                  </select>

                  <select 
                    value={maxScaleOption}
                    onChange={(e) => setMaxScaleOption(e.target.value)}
                    style={{ 
                      padding: '6px 10px', 
                      fontSize: '12px', 
                      background: 'var(--bg-navy)', 
                      border: '1px solid var(--border-light)', 
                      borderRadius: '6px', 
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="auto">Skala Auto (Max: {autoMaxVal})</option>
                    <option value="2000">Skala Max: 2.000 Paket</option>
                    <option value="500">Skala Max: 500 Paket</option>
                    <option value="100">Skala Max: 100 Paket</option>
                  </select>
                </div>
              </div>
              
              {chartItems.length === 0 ? (
                <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-navy)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
                  <Activity size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px', display: 'inline-block' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>Belum Ada Data Transaksi Aktif</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>Tidak ada paket yang sedang diproses di database saat ini.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 0.7fr', gap: '24px', alignItems: 'start' }}>
                  
                  {/* Left Column: Visual Viewport Container */}
                  <div style={{ 
                    background: 'var(--bg-navy)', 
                    borderRadius: '12px', 
                    padding: '20px', 
                    border: '1px solid var(--border-light)', 
                    minHeight: '340px',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'center'
                  }}>

                    {/* VIEW 1: BAR CHART */}
                    {viewMode === 'bar' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Scrollable Bars Canvas */}
                        <div style={{ 
                          overflowX: 'auto', 
                          paddingBottom: '12px',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          {/* Bars Canvas with Fixed Height */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'flex-end', 
                            height: '240px', 
                            gap: '16px', 
                            minWidth: filteredItems.length > 6 ? `${filteredItems.length * 64}px` : '100%',
                            padding: '30px 10px 10px 10px',
                            borderBottom: '1px solid var(--border-light)',
                            position: 'relative'
                          }}>
                            {filteredItems.map((item) => {
                              const val = item.val;
                              const canvasHeight = 170; // Max bar height in pixels inside 240px container
                              const barPxHeight = Math.max(Math.round((val / currentMaxScale) * canvasHeight), 6);
                              const totalPct = totalPackages > 0 ? Math.round((val / totalPackages) * 100) : 0;
                              const isHovered = hoveredBar === item.key || selectedStatus === item.key;
                              
                              return (
                                <div 
                                  key={item.key} 
                                  style={{ 
                                    flex: 1, 
                                    minWidth: '48px',
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end', 
                                    alignItems: 'center', 
                                    height: '200px', 
                                    position: 'relative', 
                                    cursor: 'pointer' 
                                  }}
                                  onMouseEnter={() => setHoveredBar(item.key)}
                                  onMouseLeave={() => setHoveredBar(null)}
                                  onClick={() => setSelectedStatus(selectedStatus === item.key ? null : item.key)}
                                >
                                  {/* Interactive Tooltip on Hover */}
                                  {isHovered && (
                                    <div style={{ 
                                      position: 'absolute', 
                                      bottom: `${barPxHeight + 28}px`, 
                                      background: 'var(--bg-card)', 
                                      backdropFilter: 'blur(8px)',
                                      border: `1.5px solid ${item.color}`, 
                                      borderRadius: '8px', 
                                      padding: '8px 12px', 
                                      fontSize: '12px', 
                                      zIndex: 20, 
                                      color: 'var(--text-primary)', 
                                      display: 'flex', 
                                      flexDirection: 'column', 
                                      alignItems: 'center', 
                                      boxShadow: `0 8px 32px rgba(0, 0, 0, 0.25), 0 0 15px ${item.color}44`, 
                                      minWidth: '130px',
                                      pointerEvents: 'none',
                                      animation: 'fadeInScale 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                                    }}>
                                      <span style={{ fontWeight: 800, color: item.color, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {item.icon} {val} Paket
                                      </span>
                                      <span style={{ fontSize: '10px', color: 'var(--text-primary)', marginTop: '4px', fontWeight: 700, textAlign: 'center' }}>
                                        {item.formattedName}
                                      </span>
                                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                                        {totalPct}% dari total aktif
                                      </span>
                                      <div style={{
                                        position: 'absolute',
                                        bottom: '-6px',
                                        left: '50%',
                                        transform: 'translateX(-50%) rotate(45deg)',
                                        width: '10px',
                                        height: '10px',
                                        background: 'var(--bg-card)',
                                        borderBottom: `1.5px solid ${item.color}`,
                                        borderRight: `1.5px solid ${item.color}`,
                                        zIndex: -1
                                      }}></div>
                                    </div>
                                  )}
                                  
                                  {/* Value on top of bar */}
                                  <span style={{ 
                                    fontSize: '11px', 
                                    fontWeight: 800, 
                                    color: isHovered ? item.color : 'var(--text-secondary)', 
                                    marginBottom: '6px',
                                    transition: 'color 0.2s'
                                  }}>
                                    {val}
                                  </span>

                                  {/* Animated Vertical Bar */}
                                  <div 
                                    style={{ 
                                      width: '100%',
                                      maxWidth: '38px', 
                                      height: `${barPxHeight}px`, 
                                      background: `linear-gradient(180deg, ${item.color}, ${item.color}33)`, 
                                      border: `1.5px solid ${item.color}`,
                                      borderRadius: '6px 6px 0 0',
                                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                      boxShadow: isHovered ? `0 0 20px ${item.color}aa, inset 0 0 10px ${item.color}55` : 'none',
                                      transform: isHovered ? 'scale(1.08) translateY(-2px)' : 'none',
                                      transformOrigin: 'bottom'
                                    }}
                                  ></div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Labels Row below chart */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '16px', 
                            minWidth: filteredItems.length > 6 ? `${filteredItems.length * 64}px` : '100%',
                            paddingTop: '10px'
                          }}>
                            {filteredItems.map((item) => {
                              const isHovered = hoveredBar === item.key || selectedStatus === item.key;
                              return (
                                <div 
                                  key={item.key} 
                                  style={{ 
                                    flex: 1, 
                                    minWidth: '48px',
                                    textAlign: 'center', 
                                    fontSize: '10px', 
                                    fontWeight: isHovered ? 800 : 600, 
                                    color: isHovered ? item.color : 'var(--text-muted)', 
                                    transition: 'color 0.2s',
                                    wordBreak: 'break-word',
                                    lineHeight: 1.2,
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={() => setHoveredBar(item.key)}
                                  onMouseLeave={() => setHoveredBar(null)}
                                  onClick={() => setSelectedStatus(selectedStatus === item.key ? null : item.key)}
                                >
                                  {item.formattedName}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VIEW 2: SVG DONUT CHART */}
                    {viewMode === 'donut' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', padding: '10px' }}>
                        <div style={{ position: 'relative', width: '200px', height: '200px', flexShrink: 0 }}>
                          <svg viewBox="0 0 200 200" width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="100" cy="100" r="68" fill="none" stroke="var(--border-light)" strokeWidth="24" />
                            {donutData.slices.map((slice) => {
                              const isHovered = hoveredBar === slice.key || selectedStatus === slice.key;
                              return (
                                <circle
                                  key={slice.key}
                                  cx="100"
                                  cy="100"
                                  r="68"
                                  fill="none"
                                  stroke={slice.color}
                                  strokeWidth={isHovered ? 30 : 24}
                                  strokeDasharray={slice.strokeDasharray}
                                  strokeDashoffset={slice.strokeDashoffset}
                                  style={{
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    opacity: (hoveredBar || selectedStatus) && !isHovered ? 0.4 : 1
                                  }}
                                  onMouseEnter={() => setHoveredBar(slice.key)}
                                  onMouseLeave={() => setHoveredBar(null)}
                                  onClick={() => setSelectedStatus(selectedStatus === slice.key ? null : slice.key)}
                                />
                              );
                            })}
                          </svg>

                          {/* Center Summary Text inside Donut */}
                          <div style={{ 
                            position: 'absolute', 
                            inset: 0, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            textAlign: 'center',
                            padding: '10px'
                          }}>
                            {hoveredBar || selectedStatus ? (() => {
                              const activeKey = hoveredBar || selectedStatus;
                              const activeItem = rawChartItems.find(i => i.key === activeKey);
                              if (!activeItem) return null;
                              const pct = totalPackages > 0 ? Math.round((activeItem.val / totalPackages) * 100) : 0;
                              return (
                                <>
                                  <span style={{ fontSize: '20px', fontWeight: 900, color: activeItem.color }}>
                                    {activeItem.val}
                                  </span>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.1 }}>
                                    {activeItem.formattedName}
                                  </span>
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {pct}% dari total
                                  </span>
                                </>
                              );
                            })() : (
                              <>
                                <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                                  {totalPackages}
                                </span>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Total Paket
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right side list of donut items */}
                        <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                          {filteredItems.map(item => {
                            const pct = totalPackages > 0 ? Math.round((item.val / totalPackages) * 100) : 0;
                            const isHovered = hoveredBar === item.key || selectedStatus === item.key;
                            return (
                              <div 
                                key={item.key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justify: 'space-between',
                                  padding: '6px 10px',
                                  background: isHovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                                  borderLeft: `3px solid ${item.color}`,
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={() => setHoveredBar(item.key)}
                                onMouseLeave={() => setHoveredBar(null)}
                                onClick={() => setSelectedStatus(selectedStatus === item.key ? null : item.key)}
                              >
                                <span style={{ fontSize: '11px', fontWeight: 600, color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                  {item.icon} {item.formattedName}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 800, color: item.color }}>{item.val}</span>
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>({pct}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* VIEW 3: FLOW PIPELINE */}
                    {viewMode === 'flow' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '6px 0' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <GitCommit size={16} style={{ color: 'var(--accent-cyan)' }} />
                          Pemetaan Alur Operasional Logistik Pos (Sequential Pipeline):
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', position: 'relative' }}>
                          {flowStages.map((stage) => {
                            const stageTotal = stage.items.reduce((acc, i) => acc + i.val, 0);
                            const hasItems = stage.items.length > 0;
                            return (
                              <div 
                                key={stage.id} 
                                style={{ 
                                  background: 'var(--bg-card)', 
                                  border: `1px solid ${hasItems ? stage.color + '44' : 'var(--border-light)'}`, 
                                  borderRadius: '10px', 
                                  padding: '14px 12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  position: 'relative'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 800, color: stage.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {stage.icon} {stage.title}
                                  </span>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                  <span style={{ fontSize: '22px', fontWeight: 900, color: stageTotal > 0 ? stage.color : 'var(--text-muted)' }}>
                                    {stageTotal}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>paket</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {stage.items.map(item => (
                                    <div 
                                      key={item.key} 
                                      style={{ 
                                        fontSize: '10px', 
                                        padding: '4px 6px', 
                                        background: 'var(--bg-navy)', 
                                        borderRadius: '4px',
                                        display: 'flex',
                                        justify: 'space-between',
                                        color: 'var(--text-secondary)',
                                        border: `1px solid ${hoveredBar === item.key ? item.color : 'transparent'}`,
                                        cursor: 'pointer'
                                      }}
                                      onMouseEnter={() => setHoveredBar(item.key)}
                                      onMouseLeave={() => setHoveredBar(null)}
                                      onClick={() => setSelectedStatus(selectedStatus === item.key ? null : item.key)}
                                    >
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.formattedName}</span>
                                      <span style={{ fontWeight: 800, color: item.color, marginLeft: '4px' }}>{item.val}</span>
                                    </div>
                                  ))}
                                  {!hasItems && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', italic: 'true' }}>Tidak ada paket</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* VIEW 4: GRID CARDS */}
                    {viewMode === 'grid' && (
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                        {filteredItems.map(item => {
                          const pct = totalPackages > 0 ? Math.round((item.val / totalPackages) * 100) : 0;
                          const isHovered = hoveredBar === item.key || selectedStatus === item.key;
                          return (
                            <div 
                              key={item.key} 
                              style={{ 
                                background: isHovered ? 'var(--bg-card-hover)' : 'var(--bg-card)', 
                                border: `1.5px solid ${isHovered ? item.color : 'var(--border-light)'}`, 
                                borderRadius: '10px', 
                                padding: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: isHovered ? 'translateY(-2px)' : 'none',
                                boxShadow: isHovered ? `0 6px 16px ${item.color}22` : 'none'
                              }}
                              onMouseEnter={() => setHoveredBar(item.key)}
                              onMouseLeave={() => setHoveredBar(null)}
                              onClick={() => setSelectedStatus(selectedStatus === item.key ? null : item.key)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                                <span className="badge" style={{ background: `${item.color}18`, color: item.color, borderColor: `${item.color}33`, fontSize: '10px', fontWeight: 800 }}>
                                  {pct}%
                                </span>
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                {item.val} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>pkt</span>
                              </div>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.formattedName}
                              </div>
                              
                              {/* Progress Line */}
                              <div style={{ width: '100%', height: '4px', background: 'var(--border-light)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '2px' }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Interactive Details & Status Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Filter size={14} style={{ color: 'var(--accent-cyan)' }} /> 
                        Rincian Status Paket ({filteredItems.length})
                      </span>
                      {selectedStatus && (
                        <button 
                          onClick={() => setSelectedStatus(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                      {filteredItems.map((item) => {
                        const val = item.val;
                        const totalPct = totalPackages > 0 ? Math.round((val / totalPackages) * 100) : 0;
                        const isHovered = hoveredBar === item.key || selectedStatus === item.key;
                        
                        return (
                          <div 
                            key={item.key} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: '10px 14px', 
                              background: isHovered ? 'var(--bg-card-hover)' : 'var(--bg-card)', 
                              border: isHovered ? `1.5px solid ${item.color}` : '1px solid var(--border-light)', 
                              borderRadius: '8px', 
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              transform: isHovered ? 'translateX(4px)' : 'none'
                            }}
                            onMouseEnter={() => setHoveredBar(item.key)}
                            onMouseLeave={() => setHoveredBar(null)}
                            onClick={() => setSelectedStatus(selectedStatus === item.key ? null : item.key)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                <span style={{ 
                                  fontSize: '12px', 
                                  fontWeight: 700, 
                                  color: isHovered ? 'var(--text-primary)' : 'var(--text-primary)', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  transition: 'color 0.2s' 
                                }}>
                                  {item.formattedName}
                                </span>
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                  {item.key}
                                </span>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                              <span className="badge" style={{ background: `${item.color}18`, color: item.color, borderColor: `${item.color}33`, fontWeight: 800, fontSize: '11px' }}>
                                {val} Paket
                              </span>
                              <span style={{ fontSize: '11px', color: isHovered ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 700, width: '32px', textAlign: 'right', transition: 'color 0.2s' }}>
                                {totalPct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & DB Info */}
          <div className="grid-2">
            {/* Quick Actions */}
            <div className="glass-card" style={{ marginBottom: 0 }}>
              <h3 className="card-title"><PlayCircle size={18} style={{ color: 'var(--accent-orange)' }} />Aksi Cepat</h3>
              <div className="grid-2" style={{ gap: '15px' }}>
                <Link to="/kendaraan" className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', height: '110px', justifyContent: 'center', textAlign: 'center' }}>
                  <Truck size={32} style={{ color: 'var(--accent-green)', marginBottom: '8px' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Tambah Kendaraan</span>
                </Link>
                <Link to="/route" className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', height: '110px', justifyContent: 'center', textAlign: 'center' }}>
                  <Layers size={32} style={{ color: 'var(--accent-purple)', marginBottom: '8px' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Tambah Route</span>
                </Link>
                <Link to="/jadwal" className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', height: '110px', justifyContent: 'center', textAlign: 'center' }}>
                  <Calendar size={32} style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Generate Jadwal</span>
                </Link>
                <Link to="/compass" className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', height: '110px', justifyContent: 'center', textAlign: 'center' }}>
                  <Database size={32} style={{ color: 'var(--accent-orange)', marginBottom: '8px' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Buka DB Compass</span>
                </Link>
              </div>
            </div>

            {/* Database Info */}
            <div className="glass-card" style={{ marginBottom: 0 }}>
              <h3 className="card-title"><Database size={18} style={{ color: 'var(--accent-cyan)' }} />Informasi Database</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <table className="table-borderless" style={{ width: '100%', fontSize: '14px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px 0', border: 'none', fontWeight: 600, width: '150px' }}>Koneksi Aktif</td>
                      <td style={{ padding: '8px 0', border: 'none', color: 'white' }}>
                        {activeConnection ? (
                          <span className="badge badge-success" style={{ gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeConnection.color || 'var(--accent-green)' }}></span>
                            {activeConnection.name}
                          </span>
                        ) : (
                          <span className="badge badge-danger">Tidak Terhubung</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', border: 'none', fontWeight: 600 }}>Database</td>
                      <td style={{ padding: '8px 0', border: 'none', color: 'white', fontFamily: 'monospace' }}>
                        {activeConnection?.database || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', border: 'none', fontWeight: 600 }}>Host / URI</td>
                      <td style={{ padding: '8px 0', border: 'none', color: 'white', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                        {activeConnection ? activeConnection.uri.split('@')[1] || activeConnection.uri : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', border: 'none', fontWeight: 600 }}>Status Layanan</td>
                      <td style={{ padding: '8px 0', border: 'none' }}>
                        <span className="badge badge-success">SINKRONISASI OK</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  💡 Anda dapat mengubah koneksi database atau menambahkan profil server baru di menu <strong>Pengaturan</strong> di sidebar.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
