import React, { useState } from 'react';
import { api } from '../utils/api.js';
import { Search, Map, Calendar, AlertTriangle, Building, Box, Star, ArrowRight, Truck, Info, Clock, Route, Check } from 'lucide-react';

const getRouteNodesAndLinks = (segments) => {
  if (!segments || segments.length === 0) return { nodes: [], links: [] };
  
  const sorted = [...segments].sort((a, b) => a.seq - b.seq);
  const nodes = [];
  const links = [];
  
  nodes.push({
    nopen: sorted[0].asal_nopen,
    nama: sorted[0].asal_nama,
    role: sorted[0].role_asal || 'ORIGIN'
  });
  
  for (let i = 0; i < sorted.length; i++) {
    const seg = sorted[i];
    links.push({
      moda: seg.nama_moda || (seg.moda === 'D' ? 'DARAT' : seg.moda === 'U' ? 'UDARA' : 'LAINNYA'),
      estimasi: seg.estimasi_jam
    });
    nodes.push({
      nopen: seg.tujuan_nopen,
      nama: seg.tujuan_nama,
      role: seg.role_tujuan || 'TRANSIT'
    });
  }
  
  return { nodes, links };
};

const getRoleClass = (role) => {
  const r = (role || '').toUpperCase().trim();
  if (r === 'ORIGIN') return 'origin';
  if (r === 'DESTINATION' || r === 'DEST') return 'dest';
  return 'transit';
};

const getNodeStyle = (role) => {
  const r = (role || '').toUpperCase().trim();
  let background = '';
  
  if (r === 'ORIGIN') {
    background = 'linear-gradient(145deg, #234870, #162f4c)';
  } else if (r === 'DESTINATION' || r === 'DEST') {
    background = 'linear-gradient(145deg, #1c4538, #132f27)';
  } else {
    background = 'linear-gradient(145deg, #3a2e26, #1d1916)';
  }
  
  return {
    background,
    position: 'relative',
    zIndex: 2
  };
};

function Checker({ activeConnection }) {
  const [connote, setConnote] = useState(() => {
    return localStorage.getItem('last_searched_connote') || '';
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem('last_searched_result');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!connote.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const res = await api.checkRouting(connote.trim());
      if (res.success) {
        setResult(res);
        localStorage.setItem('last_searched_connote', connote.trim());
        localStorage.setItem('last_searched_result', JSON.stringify(res));
      } else {
        setError(res.message || 'Gagal mencari data resi.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Resi tidak ditemukan atau server mengalami error.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get nested values safely
  const getNestedValue = (obj, path, defaultValue = '-') => {
    if (!obj) return defaultValue;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[part];
    }
    return current !== undefined && current !== null && current !== '' ? current : defaultValue;
  };

  return (
    <div className="animate-fade-in">
      <style>{`
        @keyframes dynamicTruckFlow {
          0% {
            left: -40px;
            transform: scaleX(-1) translateY(-50%);
          }
          45% {
            left: calc(100% + 10px);
            transform: scaleX(-1) translateY(-50%);
          }
          50% {
            left: calc(100% + 10px);
            transform: scaleX(1) translateY(-50%);
          }
          95% {
            left: -40px;
            transform: scaleX(1) translateY(-50%);
          }
          to {
            left: -40px;
            transform: scaleX(-1) translateY(-50%);
          }
        }
      `}</style>
      <div className="glass-card">
        <h2 className="card-title" style={{ fontSize: '20px' }}>
          <Search size={22} className="text-accent" style={{ color: 'var(--accent-cyan)' }} /> 
          Routing Checker IPOS5
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
          Cek rute pengiriman dan jadwal transportasi secara visual berdasarkan Connote Code / Nomor Resi.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Masukkan Connote Code / Nomor Resi (Contoh: CC000188820ID atau 202410150001)"
              value={connote}
              onChange={(e) => setConnote(e.target.value)}
              style={{ paddingLeft: '45px', height: '45px', borderRadius: '8px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '45px', px: '25px' }}>
            {loading ? 'Mencari...' : 'Cari Rute'}
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '60px 0' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px' }}>
            <Truck size={48} className="animate-spin" style={{ color: 'var(--accent-cyan)', position: 'absolute', left: '16px', top: '16px' }} />
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '16px' }}>Mencari data kiriman...</span>
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <AlertTriangle size={32} style={{ color: 'var(--accent-red)' }} />
            <div>
              <h4 style={{ color: 'white', fontWeight: 700 }}>Pencarian Gagal</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="animate-fade-in">
          {/* Main Info Badges */}
          <div className="grid-4" style={{ marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CONNOTE CODE</span>
              <h4 style={{ fontSize: '18px', color: 'white', fontWeight: 800, marginTop: '4px' }}>
                {result.data?.transaction?.connoteCode || result.connote}
              </h4>
            </div>
            
            <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>LAYANAN / SERVICE</span>
              <div style={{ marginTop: '6px' }}>
                <span className="badge badge-info">
                  {result.data?.transaction?.service || result.service}
                </span>
              </div>
            </div>
            
            <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS KIRIMAN</span>
              <div style={{ marginTop: '6px' }}>
                <span className="badge badge-purple">
                  {result.data?.transaction?.state || result.status}
                </span>
              </div>
            </div>
            
            {(() => {
              const status = result.data?.route?.status || 'ROUTE_NOT_FOUND';
              let badgeClass = 'badge-danger';
              let label = 'RUTE TIDAK DITEMUKAN';
              
              if (status === 'ROUTE_MAPPED') {
                badgeClass = 'badge-success';
                label = 'RUTE TERPETAKAN';
              } else if (status === 'ROUTE_PARTIAL') {
                badgeClass = 'badge-warning';
                label = 'RUTE SEBAGIAN';
              } else if (status === 'TRANSACTION_INCOMPLETE') {
                badgeClass = 'badge-secondary';
                label = 'DATA TIDAK LENGKAP';
              }

              return (
                <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }} data-tooltip={`Method: ${result.data?.route?.mappingMethod || 'NONE'}`}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS PEMETAAN DATABASE</span>
                  <div style={{ marginTop: '6px' }}>
                    <span className={`badge ${badgeClass}`}>{label}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Style tag for animations */}
          <style>{`
            .timeline-wrapper {
              display: flex;
              justify-content: space-between;
              align-items: center;
              position: relative;
              margin: 40px 0;
              padding: 0 20px;
            }
            .timeline-progress-line {
              position: absolute;
              top: 24px;
              left: 20px;
              right: 20px;
              height: 4px;
              background: var(--bg-dark);
              z-index: 1;
              border-radius: 2px;
            }
            .timeline-progress-fill {
              height: 100%;
              background: var(--accent-cyan);
              box-shadow: 0 0 12px var(--accent-cyan);
              transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
              border-radius: 2px;
              width: 0%;
            }
            .timeline-step {
              display: flex;
              flex-direction: column;
              align-items: center;
              position: relative;
              z-index: 2;
              width: 120px;
              opacity: 0;
              animation: fadeInUp 0.6s ease forwards;
            }
            .timeline-dot {
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: var(--bg-card);
              border: 3px solid var(--text-muted);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              transition: all 0.5s ease;
              box-shadow: var(--shadow-sm);
              color: var(--text-muted);
            }
            .timeline-step.active .timeline-dot {
              background: var(--bg-dark);
              border-color: var(--accent-cyan);
              color: var(--accent-cyan);
              box-shadow: 0 0 16px var(--accent-cyan);
              transform: scale(1.1);
            }
            .timeline-step.completed .timeline-dot {
              background: var(--accent-cyan);
              border-color: var(--accent-cyan);
              color: var(--bg-dark);
              box-shadow: 0 0 12px var(--accent-cyan);
            }
            .timeline-label {
              margin-top: 12px;
              font-family: var(--font-title);
              font-size: 12px;
              font-weight: 700;
              color: var(--text-muted);
              text-align: center;
              transition: color 0.3s ease;
            }
            .timeline-step.active .timeline-label,
            .timeline-step.completed .timeline-label {
              color: var(--text-primary);
            }
            .timeline-sublabel {
              font-size: 10px;
              color: var(--text-secondary);
              margin-top: 2px;
              text-align: center;
            }
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>

          {/* Section A: Status Perjalanan Kiriman (Linear State Machine) */}
          <div className="journey-flow-container" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '14px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: 'var(--accent-purple)' }} /> STATUS KIRIMAN SAAT INI (LINEAR PIPELINE STATE)
            </h3>

            {(() => {
              const VALID_STATES = [
                'DITERIMA_DI_CILILIN',
                'DITERIMA_DI_CIMAHI',
                'TRANSIT_SPP_BANDUNG',
                'TIBA_DI_SPP_TUJUAN',
                'DELIVERED'
              ];
              
              const tx = result.data?.transaction || {};
              const currentStatus = (tx.state || '').toUpperCase().trim();
              
              // Map states to index
              let activeIndex = -1;
              if (currentStatus === 'INLOCATION' || currentStatus === 'DITERIMA_DI_CILILIN') activeIndex = 0;
              else if (currentStatus === 'DITERIMA_DI_CIMAHI') activeIndex = 1;
              else if (currentStatus === 'TRANSIT_SPP_BANDUNG' || currentStatus === 'INBAG' || currentStatus === 'UNBAG') activeIndex = 2;
              else if (currentStatus === 'TIBA_DI_SPP_TUJUAN' || currentStatus === 'INVEHICLE') activeIndex = 3;
              else if (currentStatus === 'DELIVERED') activeIndex = 4;

              const originName = tx.originName || 'Asal';

              const steps = [
                { state: 'DITERIMA_DI_CILILIN', label: originName, sub: `Origin (${tx.originNopen || '-'})`, icon: '🏢' },
                { state: 'DITERIMA_DI_CIMAHI', label: 'KC Cimahi', sub: 'Origin Gateway (40500)', icon: '🏬' },
                { state: 'TRANSIT_SPP_BANDUNG', label: 'SPP Bandung', sub: 'Single Gate Sorting (40400)', icon: '🔄' },
                { state: 'TIBA_DI_SPP_TUJUAN', label: `SPP Tujuan`, sub: `Destination KPRK (${tx.destinationKprk || '-'})`, icon: '🎯' },
                { state: 'DELIVERED', label: 'Delivered', sub: 'Penerima', icon: '🏁' }
              ];

              const progressPercentage = activeIndex === -1 ? 0 : (activeIndex / (steps.length - 1)) * 100;

              return (
                <div style={{ position: 'relative' }}>
                  <div className="timeline-wrapper">
                    <div className="timeline-progress-line">
                      <div 
                        className="timeline-progress-fill" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>

                    {steps.map((step, idx) => {
                      const isCompleted = idx < activeIndex;
                      const isActive = idx === activeIndex;
                      const stepClass = isCompleted ? 'completed' : isActive ? 'active' : '';
                      const delay = idx * 0.15;

                      return (
                        <div 
                          key={step.state} 
                          className={`timeline-step ${stepClass}`}
                          style={{ animationDelay: `${delay}s` }}
                        >
                          <div className="timeline-dot">
                            {isCompleted ? <Check size={20} style={{ strokeWidth: 3 }} /> : step.icon}
                          </div>
                          <div className="timeline-label truncate" style={{ maxWidth: '120px' }}>{step.label}</div>
                          <div className="timeline-sublabel">{step.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section B: Rute Perjalanan Fisik Berdasarkan Database */}
          <div className="journey-flow-container" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '14px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Route size={16} style={{ color: 'var(--accent-cyan)' }} /> RUTE PERJALANAN FISIK BERDASARKAN DATABASE
            </h3>

            {(() => {
              const routeData = result.data?.route || {};
              const stopsList = routeData.stops || [];

              if (stopsList.length === 0) {
                return (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <span>Tidak ada detail rute perjalanan fisik yang tersedia.</span>
                  </div>
                );
              }

              const getStopNodeStyle = (status) => {
                const s = String(status || '').toUpperCase();
                if (s === 'DELIVERED') {
                  return {
                    background: 'linear-gradient(145deg, #10b98114, var(--bg-card))',
                    borderColor: '#10b9814d',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
                  };
                }
                if (s === 'CURRENT' || s === 'CURRENT_LOCATION') {
                  return {
                    background: 'linear-gradient(145deg, rgba(0, 210, 196, 0.15), var(--bg-card))',
                    borderColor: 'var(--accent-cyan)',
                    boxShadow: '0 0 16px var(--accent-cyan)',
                    borderWidth: '2px'
                  };
                }
                if (s === 'PASSED' || s === 'ORIGIN') {
                  return {
                    background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.08), var(--bg-card))',
                    borderColor: 'rgba(59, 130, 246, 0.4)'
                  };
                }
                return {
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-light)',
                  opacity: 0.7
                };
              };

              const getRoleLabel = (stop) => {
                if (stop.isOrigin) return 'ORIGIN';
                if (stop.isDestination) return 'DESTINATION';
                if (stop.isCurrentLocation) return 'CURRENT LOC';
                return 'TRANSIT';
              };

              const getRoleClassSuffix = (stop) => {
                if (stop.isOrigin) return 'origin';
                if (stop.isDestination) return 'dest';
                return 'transit';
              };

              return (
                <div>
                  <div className="journey-flow">
                    {stopsList.map((stop, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && (
                          <div className="journey-arrow" style={{ zIndex: 1 }}>
                            <div className="journey-arrow-line"></div>
                            <span 
                              className="journey-arrow-truck"
                              style={{ animation: 'dynamicTruckFlow 4s ease-in-out infinite', zIndex: 1 }}
                              title="Transportasi Pengiriman"
                            >🚚</span>
                          </div>
                        )}
                        <div 
                          className={`journey-node journey-node-${getRoleClassSuffix(stop)}`}
                          style={getStopNodeStyle(stop.status)}
                        >
                          <div className="journey-node-label">{getRoleLabel(stop)}</div>
                          <div className="journey-node-kprk">{stop.nopend}</div>
                          <div className="journey-node-name truncate" style={{ maxWidth: '150px' }} title={stop.officeName}>
                            {stop.officeName}
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Route Status Messages */}
                  {routeData.status === 'ROUTE_MAPPED' ? (
                    <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
                      <Check size={16} />
                      <span>Rute berhasil dipetakan dari database.</span>
                    </div>
                  ) : routeData.status === 'ROUTE_PARTIAL' ? (
                    <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(234, 179, 8, 0.08)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)', color: 'var(--accent-yellow)', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
                      <Info size={16} />
                      <span>Sebagian rute berhasil ditemukan. Beberapa titik belum terhubung dalam master route.</span>
                    </div>
                  ) : (
                    <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', fontWeight: 600 }}>
                        <AlertTriangle size={18} />
                        <span>Data transaksi ditemukan, tetapi relasi rute dari {routeData.origin?.nopend || '-'} ke {routeData.destination?.nopend || '-'} belum ditemukan pada master_route_nopen maupun detail_route.</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <a href="/route" className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }}>
                          Buka Master Route
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Section C: Detail Panel Informasi Transaksi */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 className="card-title" style={{ fontSize: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} style={{ color: 'var(--accent-cyan)' }} /> Ringkasan Informasi Transaksi & Rute
            </h3>
            {(() => {
              const tx = result.data?.transaction || {};
              const routeData = result.data?.route || {};
              const sched = result.data?.schedule || {};

              return (
                <div className="journey-details-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  <div className="detail-item-info">
                    <span>KANTOR ASAL</span>
                    <span>{tx.originName || '-'}</span>
                  </div>
                  <div className="detail-item-info">
                    <span>NOPEN ASAL</span>
                    <span style={{ fontFamily: 'monospace' }}>{tx.originNopen || '-'}</span>
                  </div>
                  <div className="detail-item-info">
                    <span>LOKASI SAAT INI</span>
                    <span>{tx.currentLocationName || '-'}</span>
                  </div>
                  <div className="detail-item-info">
                    <span>DESTINATION NOPEN</span>
                    <span style={{ fontFamily: 'monospace' }}>{tx.destinationNopen || '-'}</span>
                  </div>
                  <div className="detail-item-info">
                    <span>DESTINATION KPRK</span>
                    <span style={{ fontFamily: 'monospace' }}>{tx.destinationKprk || '-'}</span>
                  </div>
                  <div className="detail-item-info">
                    <span>REGIONAL</span>
                    <span>{tx.destinationRegional || '-'}</span>
                  </div>
                  <div className="detail-item-info">
                    <span>FINAL SWP</span>
                    <span>{tx.finalSwp || '-'}</span>
                  </div>
                  <div className="detail-item-info">
                    <span>TANGGAL SWP</span>
                    <span style={{ fontSize: '12px' }}>
                      {tx.finalSwpDate && tx.finalSwpDate !== '-' ? new Date(tx.finalSwpDate).toLocaleString('id-ID') : '-'}
                    </span>
                  </div>
                  <div className="detail-item-info">
                    <span>RUTE ID</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{routeData.routeId || '-'}</span>
                  </div>
                  <div className="detail-item-info">
                    <span>METODE PEMETAAN</span>
                    <span className="badge badge-info">{routeData.mappingMethod || 'NONE'}</span>
                  </div>
                  <div className="detail-item-info">
                    <span>KENDARAAN</span>
                    <span style={{ color: 'var(--accent-yellow)', fontWeight: 700 }}>{sched.vehicleNopol || '-'}</span>
                  </div>
                  <div className="detail-item-info">
                    <span>JADWAL BERANGKAT</span>
                    <span>
                      {sched.departureTime && sched.departureTime !== '-' ? `${sched.departureTime} (${sched.source || 'TIDAK TERSEDIA'})` : '-'}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section D: Diagnostics logs */}
          {result.data?.diagnostics && (
            <div className="glass-card" style={{ padding: '16px', background: 'rgba(6, 13, 26, 0.4)', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
                LOG DIAGNOSTIK RESOLVER RUTE
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <div>• Status Transaksi: <span style={{ color: result.data.diagnostics.transactionFound ? '#34d399' : 'var(--accent-red)' }}>{result.data.diagnostics.transactionFound ? 'Ditemukan' : 'Tidak Ditemukan'}</span></div>
                <div>• Kantor Asal di Master: <span style={{ color: result.data.diagnostics.originOfficeFound ? '#34d399' : 'var(--accent-red)' }}>{result.data.diagnostics.originOfficeFound ? 'Tersedia' : 'Tidak Tersedia'}</span></div>
                <div>• Kantor Tujuan di Master: <span style={{ color: result.data.diagnostics.destinationOfficeFound ? '#34d399' : 'var(--accent-red)' }}>{result.data.diagnostics.destinationOfficeFound ? 'Tersedia' : 'Tidak Tersedia'}</span></div>
                <div>• Header Rute di Master: <span style={{ color: result.data.diagnostics.routeHeaderFound ? '#34d399' : 'var(--accent-red)' }}>{result.data.diagnostics.routeHeaderFound ? 'Tersedia' : 'Tidak Tersedia'}</span></div>
                <div>• Detail Rute di Master: <span style={{ color: result.data.diagnostics.detailRouteFound ? '#34d399' : 'var(--accent-red)' }}>{result.data.diagnostics.detailRouteFound ? 'Tersedia' : 'Tidak Tersedia'}</span></div>
                <div>• Jadwal Terintegrasi: <span style={{ color: result.data.diagnostics.scheduleFound ? '#34d399' : 'var(--accent-red)' }}>{result.data.diagnostics.scheduleFound ? 'Tersedia' : 'Tidak Tersedia'}</span></div>
                
                {result.data.diagnostics.lookupStages && result.data.diagnostics.lookupStages.length > 0 && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>Langkah Penelusuran Rute:</div>
                    {result.data.diagnostics.lookupStages.map((stage, sIdx) => (
                      <div key={sIdx} style={{ color: 'var(--text-secondary)', paddingLeft: '8px' }}>- {stage}</div>
                    ))}
                  </div>
                )}
                <div style={{ color: 'var(--accent-yellow)', marginTop: '4px' }}>Log Message: {result.data.diagnostics.message}</div>
              </div>
            </div>
          )}

          {/* Tracking History (Audit Trail) */}
          <div className="glass-card" style={{ marginTop: '24px', marginBottom: '24px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
              <Clock size={18} style={{ color: 'var(--accent-cyan)' }} /> Riwayat Pelacakan Paket (Audit Trail)
            </h3>
            {result.data?.trackingHistory && result.data.trackingHistory.length > 0 ? (
              <div className="table-container" style={{ marginTop: '15px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Waktu Perubahan</th>
                      <th>Status Asal</th>
                      <th>Status Baru</th>
                      <th>Nomor Manifest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.trackingHistory.map((history, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'white', fontWeight: 600 }}>
                          {new Date(history.changedAt).toLocaleString('id-ID')}
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {history.from ? history.from.replace(/_/g, ' ') : '-'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '11px' }}>
                            {history.to ? history.to.replace(/_/g, ' ') : '-'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-yellow)' }}>
                          {history.manifest_id || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: '8px', marginTop: '15px' }}>
                <span>Belum terdapat tracking_history pada dokumen transaksi.</span>
              </div>
            )}
          </div>

          {/* Alternative Routes & Timeline Schedules */}
          <div className="grid-2">
            {/* Alternative Routes list */}
            <div className="glass-card" style={{ height: 'fit-content' }}>
              <h3 className="card-title"><Route size={18} style={{ color: 'var(--accent-purple)' }} />Rute Alternatif</h3>
              {result.allRoutes && result.allRoutes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.allRoutes.map((r, idx) => (
                    <div 
                      key={r.route_id} 
                      style={{ 
                        padding: '12px 16px', 
                        background: r.route_id === result.activeRoute?.route_id ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-navy)', 
                        border: '1px solid',
                        borderColor: r.route_id === result.activeRoute?.route_id ? 'var(--primary-blue)' : 'var(--border-light)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.route_id} {r.aktif === 'Y' ? '' : '(Non-aktif)'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Prioritas: {r.prioritas} | Kode Mile: {r.kodeMile}
                        </div>
                      </div>
                      <span className={`badge ${r.aktif === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                        {r.aktif === 'Y' ? 'AKTIF' : 'NON-AKTIF'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Tidak ada rute alternatif.</span>
              )}
            </div>

            {/* Schedules Timeline */}
            <div className="glass-card">
              <h3 className="card-title"><Calendar size={18} style={{ color: 'var(--accent-cyan)' }} />Jadwal Transportasi</h3>
              {result.schedules && result.schedules.length > 0 ? (
                <div className="timeline-container">
                  {result.schedules.slice(0, 5).map((sched) => (
                    <div key={sched.jadwal_id} className="timeline-row">
                      <div className="timeline-time-info">
                        <div className="time">{sched.jam_berangkat}</div>
                        <div className="date">{sched.tanggal_berangkat || sched.tanggal}</div>
                      </div>
                      <div className="timeline-route-info">
                        <div className="route-desc-col">
                          <span className="route-endpoints">{sched.asal_nopen} → {sched.tujuan_nopen}</span>
                          <span className="route-subtext">{sched.asal_nama} → {sched.tujuan_nama} | {sched.nama_kendaraan}</span>
                        </div>
                        <div>
                          <span className={`badge ${(sched.moda === 'U' || sched.nama_moda === 'UDARA') ? 'badge-info' : 'badge-success'}`}>
                            {sched.nama_moda || (sched.moda === 'D' ? 'DARAT' : sched.moda)}
                          </span>
                        </div>
                        <div className="timeline-status-col">
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Tiba: {sched.jam_tiba} ({sched.hari_tiba || ''})</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Est: {sched.estimasi_jam} jam | Cut-off: {sched.cut_off}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {result.schedules.length > 5 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '10px' }}>
                      + {result.schedules.length - 5} jadwal lainnya tersedia
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: '8px' }}>
                  <Clock size={36} style={{ margin: '0 auto 8px auto', color: 'var(--text-muted)' }} />
                  <span>Tidak ada jadwal aktif untuk rute ini pada database.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checker;
