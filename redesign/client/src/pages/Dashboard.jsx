import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api.js';
import { 
  Building, Box, Truck, Map, Calendar, Settings, 
  Database, Activity, ArrowRight, Layers, PlayCircle 
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

  // Generate chart items dynamically based on the keys present in the database
  const chartItems = Object.keys(transactionData).map((state, index) => {
    const colors = ['#00D2C4', '#f97316', '#a855f7', '#D4AF37', '#10b981', '#ec4899', '#3b82f6', '#14b8a6'];
    const color = colors[index % colors.length];
    
    // Match icons dynamically based on keywords to keep user interface clean and responsive
    let icon = '📦';
    const upper = state.toUpperCase();
    if (upper.includes('DELIVERED') || upper.includes('DITERIMA')) {
      if (upper.includes('CILILIN') || upper.includes('KCP')) icon = '🏢';
      else if (upper.includes('CIMAHI') || upper.includes('KC')) icon = '🏬';
      else icon = '🏁';
    } else if (upper.includes('TRANSIT') || upper.includes('SPP_BANDUNG')) {
      icon = '🔄';
    } else if (upper.includes('TUJUAN') || upper.includes('DEST')) {
      icon = '🎯';
    } else if (upper.includes('VEHICLE')) {
      icon = '🚚';
    } else if (upper.includes('BAG')) {
      icon = '💼';
    } else if (upper.includes('PAID')) {
      icon = '💳';
    } else if (upper.includes('CANCEL')) {
      icon = '❌';
    }

    return {
      key: state,
      label: state, // EXACT key from the database! (A in DB -> A on Web!)
      short: state, // EXACT key from the database! (A in DB -> A on Web!)
      color,
      icon
    };
  });

  const maxVal = Math.max(...chartItems.map(item => transactionData[item.key] || 0), 5);

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
              <div className="stat-icon-wrapper"><Layers size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalRoute}</span>
                <span className="stat-label">Rute Aktif</span>
              </div>
            </div>
            <div className="stat-card stat-detail-route">
              <div className="stat-icon-wrapper"><Map size={24} /></div>
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
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 className="card-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  <Activity size={18} style={{ color: 'var(--accent-cyan)', marginRight: '8px' }} /> 
                  Analisis Volume & Alur Kiriman Paket (Real-Time)
                </h3>
                <span className="badge badge-info" style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700 }}>
                  {totalPackages} TOTAL PAKET AKTIF
                </span>
              </div>
              
              {chartItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
                  <Activity size={24} style={{ color: 'var(--text-muted)', marginBottom: '10px', display: 'inline-block' }} />
                  <div>Belum ada data status transaksi paket yang aktif saat ini di database.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: '30px' }}>
                  {/* Visual Chart */}
                  <div style={{ background: 'var(--bg-dark)', borderRadius: '12px', padding: '24px 20px 16px 20px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                    {/* Visual Bars Container */}
                    <div style={{ display: 'flex', flex: 1, minHeight: '220px', alignItems: 'flex-end', gap: isMobile ? '8px' : '20px', padding: '10px 0', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
                      {chartItems.map((item, idx) => {
                        const val = transactionData[item.key] || 0;
                        const pct = (val / maxVal) * 100;
                        const totalPct = totalPackages > 0 ? Math.round((val / totalPackages) * 100) : 0;
                        const isHovered = hoveredBar === item.key;
                        
                        return (
                          <div 
                            key={idx} 
                            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '100%', position: 'relative', cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredBar(item.key)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {/* Interactive Tooltip on Hover */}
                            {isHovered && (
                              <div style={{ 
                                position: 'absolute', 
                                bottom: `calc(${pct}% + 12px)`, 
                                background: 'rgba(11, 25, 44, 0.95)', 
                                backdropFilter: 'blur(8px)',
                                border: `1.5px solid ${item.color}`, 
                                borderRadius: '8px', 
                                padding: '8px 12px', 
                                fontSize: '12px', 
                                zIndex: 10, 
                                color: 'var(--text-primary)', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px ${item.color}33`, 
                                minWidth: '120px',
                                pointerEvents: 'none',
                                animation: 'fadeInScale 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                              }}>
                                <span style={{ fontWeight: 800, color: item.color, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {item.icon} {val} Paket
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600, textAlign: 'center' }}>
                                  {item.label}
                                </span>
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                                  {totalPct}% dari total
                                </span>
                                {/* Tooltip Arrow */}
                                <div style={{
                                  position: 'absolute',
                                  bottom: '-6px',
                                  left: '50%',
                                  transform: 'translateX(-50%) rotate(45deg)',
                                  width: '10px',
                                  height: '10px',
                                  background: 'rgba(11, 25, 44, 0.95)',
                                  borderBottom: `1.5px solid ${item.color}`,
                                  borderRight: `1.5px solid ${item.color}`,
                                  zIndex: -1
                                }}></div>
                              </div>
                            )}
                            
                            {/* Animated Opaque Bar */}
                            <div 
                              style={{ 
                                width: '100%',
                                maxWidth: isMobile ? '24px' : '45px', 
                                height: `${pct}%`, 
                                background: `linear-gradient(180deg, ${item.color}cc, ${item.color}22)`, 
                                border: `1.5px solid ${item.color}`,
                                borderRadius: '6px 6px 0 0',
                                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                boxShadow: isHovered ? `0 0 20px ${item.color}88, inset 0 0 10px ${item.color}33` : 'none',
                                transform: isHovered ? 'scale(1.05) translateY(-2px)' : 'none',
                                transformOrigin: 'bottom'
                              }}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Numbers Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: isMobile ? '8px' : '20px', marginTop: 0 }}>
                      {chartItems.map((item, idx) => {
                        const val = transactionData[item.key] || 0;
                        const isHovered = hoveredBar === item.key;
                        return (
                          <div 
                            key={idx} 
                            style={{ 
                              flex: 1, 
                              textAlign: 'center', 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)', 
                              transition: 'color 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={() => setHoveredBar(item.key)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {val}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend Labels Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: isMobile ? '8px' : '20px', marginTop: 0 }}>
                      {chartItems.map((item, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            flex: 1, 
                            textAlign: 'center', 
                            fontSize: '9px', 
                            fontWeight: 700, 
                            color: hoveredBar === item.key ? 'var(--text-primary)' : 'var(--text-muted)', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.5px', 
                            transition: 'color 0.2s',
                            wordBreak: 'break-all',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={() => setHoveredBar(item.key)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          {item.short}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Details Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
                    {chartItems.map((item, idx) => {
                      const val = transactionData[item.key] || 0;
                      const totalPct = totalPackages > 0 ? Math.round((val / totalPackages) * 100) : 0;
                      const isHovered = hoveredBar === item.key;
                      return (
                        <div 
                          key={idx} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '12px 16px', 
                            background: isHovered ? 'var(--bg-card-hover)' : 'var(--bg-navy)', 
                            border: isHovered ? `1px solid ${item.color}` : '1px solid var(--border-light)', 
                            borderRadius: '8px', 
                            transition: 'all 0.2s ease',
                            transform: isHovered ? 'translateX(4px)' : 'none'
                          }}
                          onMouseEnter={() => setHoveredBar(item.key)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>{item.label}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className="badge" style={{ background: `${item.color}15`, color: item.color, borderColor: `${item.color}33`, fontWeight: 800 }}>
                              {val} Paket
                            </span>
                            <span style={{ fontSize: '11px', color: isHovered ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: 700, width: '32px', textAlign: 'right', transition: 'color 0.2s' }}>
                              {totalPct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
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
