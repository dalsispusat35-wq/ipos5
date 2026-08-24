import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { 
  X, Truck, ShieldAlert, Clock, MapPin, ClipboardList, Info, 
  ChevronLeft, ChevronRight, RefreshCw, BarChart2, Package, Route,
  Copy, Check, Eye, User, Phone, CheckCircle2, ArrowRight, ShieldCheck,
  Activity, ExternalLink
} from 'lucide-react';
import RouteDetailModal from './RouteDetailModal.jsx';

export default function VehicleDetailModal({ nopol, onClose, onViewTransaction }) {
  const [activeTab, setActiveTab] = useState('summary'); // summary, route, shipments
  const [data, setData] = useState(null);
  const [capacityData, setCapacityData] = useState(null);
  const [inspectRouteTx, setInspectRouteTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedResi, setCopiedResi] = useState(null);
  
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
      
      const [res, capRes] = await Promise.all([
        api.getVehicleDetail(nopol, params),
        api.getVehicleCapacity(nopol).catch(() => null)
      ]);

      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Gagal memuat detail kendaraan.');
      }
      if (capRes && capRes.success) {
        setCapacityData(capRes.data);
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

  useEffect(() => {
    setPage(1);
  }, [stateFilter, serviceFilter]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !inspectRouteTx) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, inspectRouteTx]);

  if (!nopol) return null;

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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatWeight = (val) => {
    if (val === undefined || val === null || val === '-') return '-';
    const num = parseFloat(val);
    if (isNaN(num)) return '-';
    return `${num.toFixed(1)} kg`;
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
          background: '#ffffff',
          color: '#0f172a',
          overflow: 'hidden'
        }}
      >
        {/* ── MODAL HEADER ── */}
        <div 
          style={{ 
            padding: '16px 22px', 
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e0f2fe', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Truck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ color: '#0f172a', fontWeight: 900, margin: 0, fontSize: 17, fontFamily: 'monospace' }}>
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
              <p style={{ color: '#64748b', fontSize: 11.5, margin: '2px 0 0' }}>
                Driver: <strong style={{ color: '#0f172a' }}>{data?.vehicle?.driver || 'Driver Pos'}</strong> • Home Base: <strong style={{ color: '#0f172a' }}>{data?.vehicle?.home_base || 'KC Bandung'}</strong>
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#64748b', 
              cursor: 'pointer', 
              width: 32, 
              height: 32, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── COCKPIT TAB SELECTOR ── */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '0 20px', gap: 6 }}>
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
                  borderBottom: isActive ? '3px solid #0b2e8a' : '3px solid transparent', 
                  color: isActive ? '#0b2e8a' : '#64748b', 
                  fontWeight: isActive ? 800 : 600, 
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icon size={14} color={isActive ? '#0b2e8a' : '#64748b'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── BODY CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading && !data ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: '#0284c7' }} />
              <div style={{ color: '#64748b', fontSize: 12.5 }}>Memuat detail data armada {nopol}...</div>
            </div>
          ) : error ? (
            <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 10 }}>
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
                      style={{ 
                        padding: '16px 18px', 
                        background: '#f0f9ff', 
                        border: '1px solid #bae6fd', 
                        borderRadius: 14 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ padding: 8, borderRadius: 8, background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BarChart2 size={16} />
                          </div>
                          <div>
                            <h4 style={{ color: '#0f172a', margin: 0, fontSize: 13.5, fontWeight: 800 }}>Kapasitas Muatan Kendaraan (Load Gauge)</h4>
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              Rute Penugasan: <strong style={{ color: '#0b2e8a' }}>{capacityData.rute?.nama_rute || 'Rute Logistik Feeder'}</strong>
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
                      <div style={{ background: '#e2e8f0', height: 10, borderRadius: 5, overflow: 'hidden', margin: '10px 0 8px' }}>
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
                        <div style={{ color: '#64748b' }}>
                          Total muatan <strong style={{ color: '#0f172a' }}>{formatWeight(capacityData.total_berat_terpakai_kg)}</strong> dari maks <strong style={{ color: '#0b2e8a' }}>{formatWeight(capacityData.kapasitas_maksimum_kg)}</strong> ({capacityData.total_paket} Paket)
                        </div>
                        <div style={{ fontSize: 14, color: '#0b2e8a', fontWeight: 900, fontFamily: 'monospace' }}>
                          {capacityData.persentase_terpakai}%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4 Summary Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>TOTAL MUATAN</span>
                      <h3 style={{ fontSize: 18, color: '#0f172a', fontWeight: 900, margin: '2px 0 0', fontFamily: 'monospace' }}>
                        {data.summary.totalCount} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Paket</span>
                      </h3>
                    </div>

                    <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>TOTAL BERAT</span>
                      <h3 style={{ fontSize: 18, color: '#16a34a', fontWeight: 900, margin: '2px 0 0', fontFamily: 'monospace' }}>
                        {formatWeight(data.summary.totalWeight)}
                      </h3>
                    </div>

                    <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>NILAI KIRIMAN</span>
                      <h3 style={{ fontSize: 16, color: '#0b2e8a', fontWeight: 900, margin: '2px 0 0', fontFamily: 'monospace' }}>
                        {formatIDR(data.summary.totalAmount)}
                      </h3>
                    </div>

                    <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>DESTINASI UTAMA</span>
                      <h3 style={{ fontSize: 15, color: '#0284c7', fontWeight: 900, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        {data.summary.mostCommonKprk || 'SPP Bandung'}
                      </h3>
                    </div>
                  </div>

                  {/* Vehicle Spec Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    <div style={{ padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                      <h4 style={{ color: '#0f172a', margin: '0 0 10px', fontSize: 12.5, fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>
                        Profil Armada Kendaraan
                      </h4>
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: '#64748b', padding: '5px 0' }}>Nama Kendaraan</td>
                            <td style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>{data.vehicle.nama_kendaraan}</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#64748b', padding: '5px 0' }}>Jenis / Tipe</td>
                            <td style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>{data.vehicle.jenis_kendaraan}</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#64748b', padding: '5px 0' }}>Nomor Polisi</td>
                            <td style={{ color: '#0b2e8a', fontWeight: 800, textAlign: 'right', fontFamily: 'monospace' }}>{data.vehicle.nopol}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div style={{ padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                      <h4 style={{ color: '#0f172a', margin: '0 0 10px', fontSize: 12.5, fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>
                        Pengemudi & Operasional
                      </h4>
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: '#64748b', padding: '5px 0' }}>Nama Pengemudi</td>
                            <td style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>{data.vehicle.driver}</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#64748b', padding: '5px 0' }}>No. Telepon / Radio</td>
                            <td style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}>{data.vehicle.driver_phone || '0812-9988-1122'}</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#64748b', padding: '5px 0' }}>Shift Operasional</td>
                            <td style={{ color: '#d97706', fontWeight: 800, textAlign: 'right' }}>SHIFT MALAM (20:00 - 05:00)</td>
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
                      style={{ 
                        padding: 16, 
                        background: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderLeft: '4px solid #0284c7', 
                        borderRadius: 12 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 12 }}>
                        <h4 style={{ color: '#0f172a', margin: 0, fontSize: 13.5, fontWeight: 800 }}>
                          {route.pickup_group.replace(/_/g, ' ')}
                        </h4>
                        <span className="badge badge-navy" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {route.start_time} - {route.end_time}
                        </span>
                      </div>

                      {/* Stops Timeline */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {route.stops.map((stop, sIdx) => (
                          <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#e0f2fe', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, color: '#0284c7' }}>
                              {stop.stop_order}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: '#0f172a', fontSize: 12, fontWeight: 700 }}>{stop.office_name}</div>
                              <div style={{ fontSize: 10, color: '#64748b' }}>Nopen: {stop.office_nopen} • {stop.office_type}</div>
                            </div>
                            <span style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 700 }}>
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
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '6px 10px',
                        color: stateFilter ? '#0b2e8a' : '#475569',
                        fontSize: 11.5,
                        outline: 'none',
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
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '6px 10px',
                        color: serviceFilter ? '#0b2e8a' : '#475569',
                        fontSize: 11.5,
                        outline: 'none',
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
                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                      <ClipboardList size={32} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                      <p style={{ margin: 0, fontSize: 12.5 }}>Tidak ada data kiriman yang cocok untuk kendaraan ini.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
                            <tr style={{ textAlign: 'left', color: '#64748b', fontSize: 10 }}>
                              <th style={{ padding: '8px 10px' }}>NO. CONNOTE</th>
                              <th style={{ padding: '8px 10px' }}>PENGIRIM / PENERIMA</th>
                              <th style={{ padding: '8px 10px' }}>TUJUAN</th>
                              <th style={{ padding: '8px 10px' }}>LAYANAN</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>BERAT</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>BEA KIRIM</th>
                              <th style={{ padding: '8px 10px' }}>STATUS</th>
                              <th style={{ padding: '8px 10px' }}>TITIK TRANSIT</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center' }}>AKSI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.transactions.map((tx, idx) => (
                              <tr 
                                key={tx._id || tx.connote_code || idx}
                                style={{ borderBottom: '1px solid #f1f5f9' }}
                              >
                                {/* Connote */}
                                <td style={{ padding: '8px 10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ color: '#0b2e8a', fontWeight: 800, fontFamily: 'monospace' }}>
                                      {tx.connote_code}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(tx.connote_code)}
                                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: copiedResi === tx.connote_code ? '#16a34a' : '#94a3b8' }}
                                      title="Salin Resi"
                                    >
                                      {copiedResi === tx.connote_code ? <Check size={10} /> : <Copy size={10} />}
                                    </button>
                                  </div>
                                </td>

                                {/* Shipper / Receiver */}
                                <td style={{ padding: '8px 10px', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <div style={{ color: '#0f172a', fontWeight: 700 }}>{tx.connote_sender_name}</div>
                                  <div style={{ fontSize: 9.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <ArrowRight size={9} /> {tx.connote_receiver_address}
                                  </div>
                                </td>

                                {/* Destination */}
                                <td style={{ padding: '8px 10px' }}>
                                  <div style={{ color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>{tx.destination_nopen}</div>
                                  <div style={{ fontSize: 9.5, color: '#64748b' }}>{tx.destination_kprk || '-'}</div>
                                </td>

                                {/* Service */}
                                <td style={{ padding: '8px 10px' }}>
                                  <span className="badge badge-navy" style={{ fontSize: 9.5 }}>
                                    {tx.connote_service}
                                  </span>
                                </td>

                                {/* Weight */}
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>
                                  {formatWeight(tx.actual_weight)}
                                </td>

                                {/* Amount */}
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0b2e8a', fontWeight: 800, fontFamily: 'monospace' }}>
                                  {formatIDR(tx.connote_amount)}
                                </td>

                                {/* Status */}
                                <td style={{ padding: '8px 10px' }}>
                                  <span className={getBadgeClass(tx.connote_state)} style={{ fontSize: 9.5 }}>
                                    {(tx.connote_state || 'TRANSIT').replace(/_/g, ' ')}
                                  </span>
                                </td>

                                {/* Route Stop */}
                                <td style={{ padding: '8px 10px', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <span style={{ color: '#475569', fontWeight: 600 }}>{tx.route_stop_name || 'SPP Hub'}</span>
                                </td>

                                {/* Action */}
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          Halaman <strong style={{ color: '#0f172a' }}>{data.transactionPagination.page}</strong> dari <strong style={{ color: '#0f172a' }}>{data.transactionPagination.totalPages}</strong> ({data.transactionPagination.totalRows} data)
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
          style={{ 
            padding: '12px 22px', 
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#f8fafc'
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
