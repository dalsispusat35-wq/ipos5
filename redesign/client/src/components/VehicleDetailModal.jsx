import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { 
  X, Truck, ShieldAlert, Clock, MapPin, ClipboardList, Info, 
  ChevronLeft, ChevronRight, RefreshCw, BarChart2, Package 
} from 'lucide-react';

export default function VehicleDetailModal({ nopol, onClose, onViewTransaction }) {
  const [activeTab, setActiveTab] = useState('summary'); // summary, route, shipments
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Shipments filters/pagination states
  const [page, setPage] = useState(1);
  const [stateFilter, setStateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const loadVehicleDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page,
        limit: 10,
        transaction_state: stateFilter,
        service: serviceFilter
      }).toString();
      
      const res = await api.getVehicleDetail(nopol, params);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Gagal memuat detail kendaraan.');
      }
    } catch (err) {
      setError(err.message || 'Koneksi ke server gagal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (nopol) {
      loadVehicleDetail();
    }
  }, [nopol, page, stateFilter, serviceFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [stateFilter, serviceFilter]);

  if (!nopol) return null;

  const formatIDR = (val) => {
    if (val === undefined || val === null || val === '-') return '-';
    const num = parseFloat(val);
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatWeight = (val) => {
    if (val === undefined || val === null || val === '-') return '-';
    const num = parseFloat(val);
    if (isNaN(num)) return '-';
    return `${num.toFixed(1)} kg`;
  };

  // Determine office type badge
  const getOfficeType = (name = '') => {
    const upper = name.toUpperCase();
    if (upper.includes('KCU') || upper.startsWith('KCU ')) return { label: 'KCU HUB', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.05)' };
    if (upper.includes('KCP') || upper.startsWith('KCP ')) return { label: 'KCP', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.05)' };
    if (upper.includes('DC') || upper.includes('SPP')) return { label: 'DC / SPP', color: '#f97316', bg: 'rgba(249, 115, 22, 0.05)' };
    if (upper.includes('AGEN') || upper.startsWith('AGEN ')) return { label: 'AGEN', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.05)' };
    return { label: 'LAINNYA', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.05)' };
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 210, 196, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={22} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <h3 style={{ color: 'white', fontWeight: 800, margin: 0, fontSize: '18px' }}>Detail Kendaraan: {nopol}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Informasi operasional, rute pickup, dan manifest kiriman</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', background: 'rgba(11, 25, 44, 0.5)', borderBottom: '1px solid var(--border-light)', padding: '0 24px' }}>
          <button 
            className={`menu-item ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
            style={{ padding: '16px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'summary' ? '2px solid var(--accent-cyan)' : '2px solid transparent', color: activeTab === 'summary' ? 'white' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', borderRadius: 0 }}
          >
            Ringkasan
          </button>
          <button 
            className={`menu-item ${activeTab === 'route' ? 'active' : ''}`}
            onClick={() => setActiveTab('route')}
            style={{ padding: '16px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'route' ? '2px solid var(--accent-cyan)' : '2px solid transparent', color: activeTab === 'route' ? 'white' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', borderRadius: 0 }}
          >
            Rute Pickup
          </button>
          <button 
            className={`menu-item ${activeTab === 'shipments' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipments')}
            style={{ padding: '16px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'shipments' ? '2px solid var(--accent-cyan)' : '2px solid transparent', color: activeTab === 'shipments' ? 'white' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', borderRadius: 0 }}
          >
            Daftar Kiriman
          </button>
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading && !data ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <RefreshCw size={28} className="spin-anim" style={{ color: 'var(--accent-cyan)', margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-secondary)' }}>Memuat detail data kendaraan...</div>
            </div>
          ) : error ? (
            <div className="info-alert" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)' }}>
              <ShieldAlert size={18} />
              <div>{error}</div>
            </div>
          ) : data ? (
            <>
              {/* TAB 1: SUMMARY */}
              {activeTab === 'summary' && (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {/* Vehicle Spec Grid */}
                  <div className="grid-2" style={{ gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '18px', marginBottom: 0 }}>
                      <h4 style={{ color: 'white', margin: '0 0 14px', fontSize: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Profil Armada</h4>
                      <table className="table-borderless" style={{ width: '100%', fontSize: '13px' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '6px 0' }}>Nama Kendaraan</td>
                            <td style={{ color: 'white', fontWeight: 600, textAlign: 'right' }}>{data.vehicle.nama_kendaraan}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '6px 0' }}>Jenis / Tipe</td>
                            <td style={{ color: 'white', fontWeight: 600, textAlign: 'right' }}>{data.vehicle.jenis_kendaraan}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '6px 0' }}>Nomor Polisi</td>
                            <td style={{ color: 'var(--accent-cyan)', fontWeight: 700, textAlign: 'right' }}>{data.vehicle.nopol}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '6px 0' }}>Status Operasional</td>
                            <td style={{ textAlign: 'right' }}>
                              <span className="badge badge-success">{data.vehicle.status}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="glass-card" style={{ padding: '18px', marginBottom: 0 }}>
                      <h4 style={{ color: 'white', margin: '0 0 14px', fontSize: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Detail Pengemudi & Shift</h4>
                      <table className="table-borderless" style={{ width: '100%', fontSize: '13px' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '6px 0' }}>Nama Driver</td>
                            <td style={{ color: 'white', fontWeight: 600, textAlign: 'right' }}>{data.vehicle.driver}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '6px 0' }}>Nomor HP</td>
                            <td style={{ color: 'white', fontWeight: 600, textAlign: 'right' }}>{data.vehicle.driver_phone}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '6px 0' }}>Shift Operasional</td>
                            <td style={{ color: 'white', fontWeight: 600, textAlign: 'right' }}>MALAM</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '6px 0' }}>Jumlah Titik Pickup</td>
                            <td style={{ color: 'var(--accent-yellow)', fontWeight: 700, textAlign: 'right' }}>{data.summary.stopsCount} Titik</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid-4" style={{ gap: '15px' }}>
                    <div className="glass-card" style={{ padding: '16px', marginBottom: 0, background: 'rgba(56, 189, 248, 0.02)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL MUATAN</span>
                      <h3 style={{ fontSize: '24px', color: 'white', fontWeight: 800, marginTop: '6px' }}>{data.summary.totalCount} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paket</span></h3>
                    </div>
                    <div className="glass-card" style={{ padding: '16px', marginBottom: 0, background: 'rgba(0, 210, 196, 0.02)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL BERAT</span>
                      <h3 style={{ fontSize: '24px', color: 'var(--accent-cyan)', fontWeight: 800, marginTop: '6px' }}>{formatWeight(data.summary.totalWeight)}</h3>
                    </div>
                    <div className="glass-card" style={{ padding: '16px', marginBottom: 0, background: 'rgba(234, 179, 8, 0.02)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>NILAI KIRIMAN</span>
                      <h3 style={{ fontSize: '22px', color: 'var(--accent-yellow)', fontWeight: 800, marginTop: '6px' }}>{formatIDR(data.summary.totalAmount)}</h3>
                    </div>
                    <div className="glass-card" style={{ padding: '16px', marginBottom: 0, background: 'rgba(167, 139, 250, 0.02)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>KPRK TUJUAN TERBANYAK</span>
                      <h3 style={{ fontSize: '20px', color: 'white', fontWeight: 800, marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.summary.mostCommonKprk}</h3>
                    </div>
                  </div>

                  {/* Status & Service Charts breakdown */}
                  <div className="grid-2" style={{ gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '18px', marginBottom: 0 }}>
                      <h4 style={{ color: 'white', margin: '0 0 14px', fontSize: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Jumlah Paket Per Status</h4>
                      {Object.keys(data.summary.byState).length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data status paket</div>
                      ) : (
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {Object.entries(data.summary.byState).map(([state, count]) => (
                            <div key={state} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-navy)', borderRadius: '6px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{state.replace(/_/g, ' ')}</span>
                              <span style={{ fontSize: '12px', color: 'white', fontWeight: 700 }}>{count} Paket</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="glass-card" style={{ padding: '18px', marginBottom: 0 }}>
                      <h4 style={{ color: 'white', margin: '0 0 14px', fontSize: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Jumlah Paket Per Layanan</h4>
                      {Object.keys(data.summary.byService).length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data layanan paket</div>
                      ) : (
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {Object.entries(data.summary.byService).map(([srv, count]) => (
                            <div key={srv} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-navy)', borderRadius: '6px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{srv}</span>
                              <span style={{ fontSize: '12px', color: 'white', fontWeight: 700 }}>{count} Paket</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                    Data terakhir diperbarui: {new Date(data.summary.updatedAt).toLocaleString('id-ID')}
                  </div>
                </div>
              )}

              {/* TAB 2: ROUTE PICKUP */}
              {activeTab === 'route' && (
                <div style={{ display: 'grid', gap: '24px' }}>
                  {data.routes.map((route, rIdx) => (
                    <div key={rIdx} className="glass-card" style={{ padding: '20px', borderLeft: '3px solid var(--accent-cyan)', marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '16px' }}>
                        <h4 style={{ color: 'white', margin: 0, fontSize: '15px', fontWeight: 700 }}>
                          {route.pickup_group.replace(/_/g, ' ')}
                        </h4>
                        <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> {route.start_time} - {route.end_time}
                        </span>
                      </div>

                      {/* Stops Timeline */}
                      <div style={{ display: 'grid', gap: '12px', position: 'relative', paddingLeft: '12px' }}>
                        {/* Timeline Connector line */}
                        {route.stops.length > 1 && (
                          <div style={{
                            position: 'absolute',
                            left: '20px',
                            top: '20px',
                            bottom: '20px',
                            width: '2px',
                            background: 'var(--accent-cyan)',
                            opacity: 0.2,
                            zIndex: 1
                          }} />
                        )}

                        {route.stops.map((stop, sIdx) => {
                          const type = getOfficeType(stop.nama_nopend);
                          return (
                            <div key={sIdx} style={{ display: 'flex', gap: '16px', padding: '12px 16px', background: 'var(--bg-navy)', border: '1px solid var(--border-light)', borderRadius: '8px', position: 'relative', zIndex: 2 }}>
                              <div style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                background: 'var(--bg-dark)', 
                                border: `2px solid ${type.color}`, 
                                color: type.color, 
                                fontWeight: '800', 
                                fontSize: '11px',
                                flexShrink: 0
                              }}>
                                {stop.sequence + 1}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <strong style={{ color: 'white', fontSize: '13px' }}>{stop.nama_nopend}</strong>
                                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${type.color}30`, color: type.color, background: type.bg }}>
                                    {type.label}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={10} /> {stop.nopend}</span>
                                  {stop.estimasi_time && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                                      <Clock size={10} /> {stop.estimasi_time}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className="badge badge-info" style={{ fontSize: '10px', fontWeight: 800 }}>
                                  {stop.txCount} Pkt / {formatWeight(stop.txWeight)}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Skipped Stops */}
                        {route.skipped && route.skipped.length > 0 && (
                          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '10px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--accent-red)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldAlert size={12} /> TITIK PPT DI-SKIP (TIDAK DITEMUKAN DI MASTER_KANTOR)
                            </div>
                            <div style={{ display: 'grid', gap: '4px' }}>
                              {route.skipped.map((skip, skIdx) => (
                                <div key={skIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '6px', fontSize: '11px' }}>
                                  <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>{skip.candidate}</span>
                                  <span style={{ color: 'var(--text-muted)' }}>{skip.reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: SHIPMENTS LIST */}
              {activeTab === 'shipments' && (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {/* Filters inside Modal */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <div style={{ width: '130px' }}>
                      <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={{ padding: '6px 10px', fontSize: '12px' }}>
                        <option value="">-- Status --</option>
                        {Object.keys(data.summary.byState).map(state => (
                          <option key={state} value={state}>{state.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ width: '130px' }}>
                      <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} style={{ padding: '6px 10px', fontSize: '12px' }}>
                        <option value="">-- Layanan --</option>
                        {Object.keys(data.summary.byService).map(srv => (
                          <option key={srv} value={srv}>{srv}</option>
                        ))}
                      </select>
                    </div>
                    <button className="btn btn-secondary" onClick={loadVehicleDetail} style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RefreshCw size={12} />
                      Reload
                    </button>
                  </div>

                  {data.transactions.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-navy)', borderRadius: '8px', border: '1px dashed var(--border-light)' }}>
                      <ClipboardList size={32} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
                      <p style={{ margin: 0, fontSize: '13px' }}>Tidak ada data kiriman yang cocok untuk kendaraan ini.</p>
                    </div>
                  ) : (
                    <>
                      <div className="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>Resi / Booking</th>
                              <th>Pengirim / Penerima</th>
                              <th>Tujuan / KPRK</th>
                              <th>Layanan</th>
                              <th>Berat</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Rute Stop</th>
                              <th>Mapping</th>
                              <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.transactions.map((tx, idx) => (
                              <tr key={tx._id || tx.connote_code}>
                                <td style={{ verticalAlign: 'middle' }}>
                                  <div style={{ fontWeight: 700, color: 'white' }}>{tx.connote_code}</div>
                                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Book: {tx.connote_booking_code}</div>
                                </td>
                                <td style={{ verticalAlign: 'middle' }}>
                                  <div style={{ fontWeight: 600, color: 'white', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.connote_sender_name}>{tx.connote_sender_name}</div>
                                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.connote_receiver_address}>To: {tx.connote_receiver_address}</div>
                                </td>
                                <td style={{ verticalAlign: 'middle' }}>
                                  <div style={{ fontWeight: 600, color: 'white' }}>Nopen: {tx.destination_nopen}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>KPRK: {tx.destination_kprk}</div>
                                </td>
                                <td style={{ verticalAlign: 'middle' }}>
                                  <span className="badge badge-info">{tx.connote_service}</span>
                                </td>
                                <td style={{ verticalAlign: 'middle' }}>{formatWeight(tx.actual_weight)}</td>
                                <td style={{ verticalAlign: 'middle' }}>{formatIDR(tx.connote_amount)}</td>
                                <td style={{ verticalAlign: 'middle' }}>
                                  <span className="badge badge-warning">{tx.connote_state.replace(/_/g, ' ')}</span>
                                </td>
                                <td style={{ verticalAlign: 'middle', fontWeight: 600 }}>{tx.route_stop_name}</td>
                                <td style={{ verticalAlign: 'middle' }}>
                                  <span className={`badge ${tx.mapping_level === 'NOPEN' ? 'badge-success' : 'badge-purple'}`} style={{ fontSize: '9.5px', padding: '2px 6px' }}>
                                    {tx.mapping_level}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                                  <button 
                                    className="btn btn-secondary" 
                                    onClick={() => {
                                      onClose();
                                      onViewTransaction(tx.connote_code);
                                    }}
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                  >
                                    Cek Rute
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination inside Modal */}
                      <div className="pagination-bar" style={{ marginTop: '10px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Halaman <strong>{data.transactionPagination.page}</strong> dari <strong>{data.transactionPagination.totalPages}</strong> ({data.transactionPagination.totalRows} data)
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            disabled={!data.transactionPagination.hasPrevious} 
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px' }}
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button 
                            disabled={!data.transactionPagination.hasNext} 
                            onClick={() => setPage(p => Math.min(data.transactionPagination.totalPages, p + 1))} 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px' }}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
