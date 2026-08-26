import { useState, useEffect } from 'react';
import { 
  X, Truck, Package, Clock, RefreshCw, BarChart2, ShieldAlert, 
  MapPin, CheckCircle2, ChevronRight, ChevronLeft, ArrowRight, Route,
  Copy, Check, FileText, ClipboardList
} from 'lucide-react';
import { api } from '../utils/api.js';
import RouteDetailModal from './RouteDetailModal.jsx';

export default function VehicleDetailModal({ nopol, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'route' | 'shipments'
  
  // Tab shipments state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [stateFilter, setStateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [copiedResi, setCopiedResi] = useState(null);

  // Sub-modal for route visualization
  const [inspectRouteTx, setInspectRouteTx] = useState(null);

  const loadVehicleDetail = async () => {
    if (!nopol) return;
    try {
      setLoading(true);
      setError('');
      const params = `page=${page}&limit=${limit}${stateFilter ? `&state=${stateFilter}` : ''}${serviceFilter ? `&service=${serviceFilter}` : ''}`;
      const res = await api.getVehicleDetail(nopol, params);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Gagal memuat rincian armada');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicleDetail();
  }, [nopol, page, limit, stateFilter, serviceFilter]);

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedResi(code);
    setTimeout(() => setCopiedResi(null), 1500);
  };

  // Helper capacity calculation
  const capacityData = data?.vehicleCapacity;

  const formatWeight = (kg) => {
    if (!kg && kg !== 0) return '0 kg';
    return Number(kg).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' kg';
  };

  const formatIDR = (val) => {
    if (!val && val !== 0) return 'Rp 0';
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  };

  const getBadgeClass = (status) => {
    if (!status) return 'badge badge-navy';
    const s = String(status).toUpperCase();
    if (s.includes('DELIVERED') || s.includes('SELESAI') || s.includes('SUKSES')) return 'badge badge-emerald';
    if (s.includes('TRANSIT') || s.includes('INVEHICLE') || s.includes('LOADED') || s.includes('IN_TRANSIT')) return 'badge badge-orange';
    if (s.includes('ARRIVED') || s.includes('TIBA') || s.includes('LOCATION')) return 'badge badge-orange';
    if (s.includes('RECEIVED') || s.includes('DITERIMA') || s.includes('ENTRY') || s.includes('SCANNED') || s.includes('PAID')) return 'badge badge-navy';
    return 'badge badge-navy';
  };

  return (
    <div 
      className="modal-overlay" 
      style={{ zIndex: 1000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !inspectRouteTx) onClose();
      }}
    >
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '1050px', 
          width: '96%', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0,
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          overflow: 'hidden'
        }}
      >
        {/* ── MODAL HEADER ── */}
        <div 
          className="modal-header"
          style={{ 
            padding: '16px 22px', 
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface-soft)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-cyan-bg)', border: '1px solid rgba(2, 132, 199, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <Truck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: 900, margin: 0, fontSize: 17, fontFamily: 'var(--font-mono)' }}>
                  {nopol}
                </h3>
                {data?.vehicle?.nama_kendaraan && (
                  <span className="badge badge-navy">
                    {data.vehicle.nama_kendaraan}
                  </span>
                )}
                {data?.vehicle?.status && (
                  <span className="badge badge-emerald">
                    {data.vehicle.status}
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 11.5, margin: '2px 0 0' }}>
                Driver: <strong style={{ color: 'var(--text-primary)' }}>{data?.vehicle?.driver || 'Driver Pos'}</strong> • Home Base: <strong style={{ color: 'var(--text-primary)' }}>{data?.vehicle?.home_base || 'KC Bandung'}</strong>
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={onClose} 
            className="capsule-btn-circle"
            style={{ width: 32, height: 32 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── COCKPIT TAB SELECTOR ── */}
        <div className="scrollable-chips" style={{ background: 'var(--bg-surface-soft)', borderBottom: '1px solid var(--border-light)', padding: '0 20px', gap: 6 }}>
          {[
            { id: 'summary', label: 'Ringkasan Armada', icon: BarChart2 },
            { id: 'route', label: 'Rute & Stop Points', icon: Route },
            { id: 'shipments', label: `Manifest Kiriman (${data?.summary?.totalCount || 0} Paket)`, icon: Package }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  padding: '12px 16px', 
                  background: 'none', 
                  border: 'none', 
                  borderBottom: isActive ? '3px solid var(--primary-navy)' : '3px solid transparent', 
                  color: isActive ? 'var(--primary-navy)' : 'var(--text-secondary)', 
                  fontWeight: isActive ? 800 : 600, 
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={14} color={isActive ? 'var(--primary-navy)' : 'var(--text-muted)'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── BODY CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading && !data ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: 'var(--primary-blue)' }} />
              <div style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>Memuat detail data armada {nopol}...</div>
            </div>
          ) : error ? (
            <div style={{ padding: 16, background: 'var(--accent-pink-bg)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 12, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={18} />
              <div style={{ fontSize: 12.5 }}>{error}</div>
            </div>
          ) : data ? (
            <>
              {/* ── TAB 1: SUMMARY ── */}
              {activeTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Load Capacity Gauge */}
                  {capacityData && (
                    <div 
                      className="surface-card"
                      style={{ 
                        padding: '16px 18px', 
                        background: 'var(--accent-cyan-bg)', 
                        border: '1px solid rgba(2, 132, 199, 0.25)', 
                        borderRadius: 14 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ padding: 8, borderRadius: 8, background: 'var(--bg-card)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BarChart2 size={16} />
                          </div>
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 13.5, fontWeight: 800 }}>Kapasitas Muatan Kendaraan (Load Gauge)</h4>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              Rute Penugasan: <strong style={{ color: 'var(--primary-navy)' }}>{capacityData.rute?.nama_rute || 'Rute Logistik Feeder'}</strong>
                            </span>
                          </div>
                        </div>
                        <span 
                          className={capacityData.status_kapasitas === 'OVERLOAD' ? 'badge badge-pink' : capacityData.status_kapasitas === 'WARNING' ? 'badge badge-orange' : 'badge badge-emerald'}
                          style={{ fontSize: 10.5, padding: '3px 10px' }}
                        >
                          STATUS: {capacityData.status_kapasitas}
                        </span>
                      </div>

                      {/* Progress Bar Gauge */}
                      <div style={{ background: 'var(--border-light)', height: 10, borderRadius: 5, overflow: 'hidden', margin: '10px 0 8px' }}>
                        <div 
                          style={{
                            width: `${Math.min(100, capacityData.persentase_terpakai)}%`,
                            height: '100%',
                            background: capacityData.persentase_terpakai >= 100 
                              ? '#ef4444' 
                              : capacityData.persentase_terpakai >= 80 
                              ? '#f59e0b' 
                              : '#0284c7',
                            borderRadius: 5,
                            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          Total muatan <strong style={{ color: 'var(--text-primary)' }}>{formatWeight(capacityData.total_berat_terpakai_kg)}</strong> dari maks <strong style={{ color: 'var(--primary-navy)' }}>{formatWeight(capacityData.kapasitas_maksimum_kg)}</strong> ({capacityData.total_paket} Paket)
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--primary-navy)', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                          {capacityData.persentase_terpakai}%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4 Summary Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    <div className="stat-card" style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>TOTAL MUATAN</span>
                      <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 900, margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>
                        {data.summary.totalCount} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Paket</span>
                      </h3>
                    </div>

                    <div className="stat-card" style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>TOTAL BERAT</span>
                      <h3 style={{ fontSize: 18, color: 'var(--accent-emerald)', fontWeight: 900, margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>
                        {formatWeight(data.summary.totalWeight)}
                      </h3>
                    </div>

                    <div className="stat-card" style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>NILAI KIRIMAN</span>
                      <h3 style={{ fontSize: 16, color: 'var(--primary-navy)', fontWeight: 900, margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>
                        {formatIDR(data.summary.totalAmount)}
                      </h3>
                    </div>

                    <div className="stat-card" style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>DESTINASI UTAMA</span>
                      <h3 style={{ fontSize: 15, color: 'var(--accent-cyan)', fontWeight: 900, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                        {data.summary.mostCommonKprk || 'SPP Bandung'}
                      </h3>
                    </div>
                  </div>

                  {/* Vehicle Spec Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    <div className="surface-soft" style={{ padding: 14 }}>
                      <h4 style={{ color: 'var(--text-primary)', margin: '0 0 10px', fontSize: 12.5, fontWeight: 800, borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                        Profil Armada Kendaraan
                      </h4>
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: 'var(--text-secondary)', padding: '5px 0' }}>Nama Kendaraan</td>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right' }}>{data.vehicle.nama_kendaraan}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-secondary)', padding: '5px 0' }}>Jenis / Tipe</td>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right' }}>{data.vehicle.jenis_kendaraan}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-secondary)', padding: '5px 0' }}>Nomor Polisi</td>
                            <td style={{ color: 'var(--primary-navy)', fontWeight: 800, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{data.vehicle.nopol}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="surface-soft" style={{ padding: 14 }}>
                      <h4 style={{ color: 'var(--text-primary)', margin: '0 0 10px', fontSize: 12.5, fontWeight: 800, borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                        Pengemudi & Operasional
                      </h4>
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: 'var(--text-secondary)', padding: '5px 0' }}>Nama Pengemudi</td>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right' }}>{data.vehicle.driver}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-secondary)', padding: '5px 0' }}>No. Telepon / Radio</td>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{data.vehicle.driver_phone || '0812-9988-1122'}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-secondary)', padding: '5px 0' }}>Shift Operasional</td>
                            <td style={{ color: 'var(--accent-amber)', fontWeight: 800, textAlign: 'right' }}>SHIFT MALAM (20:00 - 05:00)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ── TAB 2: ROUTE PICKUP ── */}
              {activeTab === 'route' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {data.routes.map((route, rIdx) => (
                    <div 
                      key={rIdx} 
                      className="surface-soft"
                      style={{ 
                        padding: 16, 
                        borderLeft: '4px solid var(--primary-blue)', 
                        borderRadius: 12 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                        <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 13.5, fontWeight: 800 }}>
                          {route.pickup_group.replace(/_/g, ' ')}
                        </h4>
                        <span className="badge badge-navy" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {route.start_time} - {route.end_time}
                        </span>
                      </div>

                      {/* Stops Timeline */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {route.stops.map((stop, sIdx) => (
                          <div key={sIdx} className="surface-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-cyan-bg)', border: '1px solid rgba(2, 132, 199, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, color: 'var(--accent-cyan)' }}>
                              {stop.stop_order}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>{stop.office_name}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Nopen: {stop.office_nopen} • {stop.office_type}</div>
                            </div>
                            <span style={{ fontSize: 10.5, color: 'var(--accent-emerald)', fontWeight: 700 }}>
                              ETA {stop.eta}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TAB 3: SHIPMENTS ── */}
              {activeTab === 'shipments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  
                  {/* Filters Bar inside Modal */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select 
                      value={stateFilter} 
                      onChange={(e) => setStateFilter(e.target.value)} 
                      style={{
                        padding: '6px 10px',
                        fontSize: 11.5,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Semua Status --</option>
                      {Object.keys(data.summary.byState || {}).map(st => (
                        <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                      ))}
                    </select>

                    <select 
                      value={serviceFilter} 
                      onChange={(e) => setServiceFilter(e.target.value)} 
                      style={{
                        padding: '6px 10px',
                        fontSize: 11.5,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Semua Layanan --</option>
                      {Object.keys(data.summary.byService || {}).map(srv => (
                        <option key={srv} value={srv}>{srv}</option>
                      ))}
                    </select>

                    <button 
                      type="button"
                      onClick={loadVehicleDetail} 
                      className="btn-ghost"
                      style={{ padding: '6px 10px', fontSize: 11.5, gap: 4 }}
                    >
                      <RefreshCw size={12} className={loading ? 'spin' : ''} />
                      <span>Reload</span>
                    </button>
                  </div>

                  {/* Shipments Table */}
                  {data.transactions.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface-soft)', borderRadius: 12, border: '1px dashed var(--border-light)' }}>
                      <ClipboardList size={32} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
                      <p style={{ margin: 0, fontSize: 12.5 }}>Tidak ada data kiriman yang cocok untuk kendaraan ini.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="table-responsive-container" style={{ maxHeight: 380, overflowY: 'auto' }}>
                        <table className="data-table" style={{ width: '100%', fontSize: 11 }}>
                          <thead>
                            <tr>
                              <th>NO. CONNOTE</th>
                              <th>PENGIRIM / PENERIMA</th>
                              <th>TUJUAN</th>
                              <th>LAYANAN</th>
                              <th style={{ textAlign: 'right' }}>BERAT</th>
                              <th style={{ textAlign: 'right' }}>BEA KIRIM</th>
                              <th>STATUS</th>
                              <th>TITIK TRANSIT</th>
                              <th style={{ textAlign: 'center' }}>AKSI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.transactions.map((tx, idx) => (
                              <tr key={tx._id || tx.connote_code || idx}>
                                {/* Connote */}
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ color: 'var(--primary-navy)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                      {tx.connote_code}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(tx.connote_code)}
                                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: copiedResi === tx.connote_code ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
                                      title="Salin Resi"
                                    >
                                      {copiedResi === tx.connote_code ? <Check size={10} /> : <Copy size={10} />}
                                    </button>
                                  </div>
                                </td>

                                {/* Shipper / Receiver */}
                                <td style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{tx.connote_sender_name}</div>
                                  <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <ArrowRight size={9} /> {tx.connote_receiver_address}
                                  </div>
                                </td>

                                {/* Destination */}
                                <td>
                                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{tx.destination_nopen}</div>
                                  <div style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>{tx.destination_kprk || '-'}</div>
                                </td>

                                {/* Service */}
                                <td>
                                  <span className="badge badge-navy" style={{ fontSize: 9.5 }}>
                                    {tx.connote_service}
                                  </span>
                                </td>

                                {/* Weight */}
                                <td style={{ textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                  {formatWeight(tx.actual_weight)}
                                </td>

                                {/* Amount */}
                                <td style={{ textAlign: 'right', color: 'var(--primary-navy)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                  {formatIDR(tx.connote_amount)}
                                </td>

                                {/* Status */}
                                <td>
                                  <span className={getBadgeClass(tx.connote_state)} style={{ fontSize: 9.5 }}>
                                    {(tx.connote_state || 'TRANSIT').replace(/_/g, ' ')}
                                  </span>
                                </td>

                                {/* Route Stop */}
                                <td style={{ maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{tx.route_stop_name || 'SPP Hub'}</span>
                                </td>

                                {/* Action */}
                                <td style={{ textAlign: 'center' }}>
                                  <button 
                                    type="button"
                                    onClick={() => setInspectRouteTx(tx)}
                                    className="btn-ghost"
                                    style={{ padding: '2px 7px', fontSize: 9.5, gap: 3 }}
                                  >
                                    <Route size={10} />
                                    <span>Rute</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination inside Modal */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          Halaman <strong style={{ color: 'var(--text-primary)' }}>{data.transactionPagination.page}</strong> dari <strong style={{ color: 'var(--text-primary)' }}>{data.transactionPagination.totalPages}</strong> ({data.transactionPagination.totalRows} data)
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            type="button"
                            disabled={!data.transactionPagination.hasPrevious} 
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            className="btn-ghost"
                            style={{ padding: '3px 8px', fontSize: 11, opacity: !data.transactionPagination.hasPrevious ? 0.4 : 1 }}
                          >
                            <ChevronLeft size={12} />
                          </button>
                          <button 
                            type="button"
                            disabled={!data.transactionPagination.hasNext} 
                            onClick={() => setPage(p => Math.min(data.transactionPagination.totalPages, p + 1))} 
                            className="btn-ghost"
                            style={{ padding: '3px 8px', fontSize: 11, opacity: !data.transactionPagination.hasNext ? 0.4 : 1 }}
                          >
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Route Detail Sub-Modal */}
        {inspectRouteTx && (
          <RouteDetailModal 
            connoteCode={inspectRouteTx.connote_code}
            txData={inspectRouteTx}
            onClose={() => setInspectRouteTx(null)}
          />
        )}

        {/* ── MODAL FOOTER ── */}
        <div 
          className="modal-footer"
          style={{ 
            padding: '12px 22px', 
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--bg-surface-soft)'
          }}
        >
          <button 
            type="button"
            onClick={onClose} 
            className="btn-primary"
            style={{ fontSize: 12 }}
          >
            Tutup Dialog
          </button>
        </div>

      </div>
    </div>
  );
}
