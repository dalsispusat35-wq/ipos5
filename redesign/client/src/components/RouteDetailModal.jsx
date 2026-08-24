import { useState, useEffect } from 'react';
import { X, MapPin, ArrowRight, ArrowDown, History, Package } from 'lucide-react';
import { api } from '../utils/api.js';

export default function RouteDetailModal({ connoteCode, txData, onClose }) {
  const [data, setData] = useState(txData || null);

  useEffect(() => {
    if (!txData && connoteCode) {
      api.getCheckerData(connoteCode)
        .then(res => {
          if (res.success && res.data) {
            setData(res.data);
          }
        })
        .catch(err => console.error('Failed to load checker data:', err));
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connoteCode, txData, onClose]);

  if (!connoteCode && !txData) return null;

  const code = connoteCode || data?.connote_code || 'P2607150025574';
  const origin = data?.connote_sender_address || data?.location_data_created?.location_name || data?.origin || 'KPRK Cimahi (40511)';
  const transit = 'SPP Bandung Hub (40400)';
  const destination = data?.destination_kprk || data?.custom_field?.destination_nopen || data?.destination || 'SPP Jakarta Timur (10000)';
  const service = data?.connote_service || data?.connote?.connote_service || 'PKH';
  const state = data?.connote_state || data?.connote?.connote_state || 'TRANSIT_SPP_BANDUNG';
  const weight = data?.actual_weight || data?.connote?.actual_weight || 1.2;

  let trackingHistory = data?.tracking_history || [];
  if (!Array.isArray(trackingHistory) || trackingHistory.length === 0) {
    trackingHistory = [
      { from_state: null, to_state: 'DITERIMA_DI_CIMAHI', changedAt: '2026-07-22T08:15:00+0700', manifest_id: null },
      { from_state: 'DITERIMA_DI_CIMAHI', to_state: 'IN_MANIFEST', changedAt: '2026-07-22T10:30:00+0700', manifest_id: 'MNF000123' },
      { from_state: 'IN_MANIFEST', to_state: 'TRANSIT_SPP_BANDUNG', changedAt: '2026-07-22T13:45:00+0700', manifest_id: 'MNF000123' }
    ];
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return dateStr;
      return dt.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div 
      className="modal-overlay" 
      style={{ zIndex: 2000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '780px', 
          width: '94%', 
          maxHeight: '88vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0,
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: 'var(--spatial-shadow)',
          border: '1px solid var(--border-light)'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--accent-cyan-bg)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, margin: 0, fontSize: '16px' }}>Visualisasi Rute Resi: {code}</h3>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Layanan: <strong style={{ color: 'var(--primary-navy)' }}>{service}</strong> | Berat: <strong style={{ color: 'var(--text-primary)' }}>{weight} kg</strong></span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="capsule-btn-circle"
            style={{ width: 32, height: 32 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Route Flow */}
          <div className="surface-card" style={{ padding: '16px', background: 'var(--accent-cyan-bg)', border: '1px solid rgba(2, 132, 199, 0.25)', marginBottom: 0 }}>
            <h4 style={{ color: 'var(--primary-navy)', margin: '0 0 12px', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="var(--primary-blue)" /> Visualisasi Alur Logistik Paket (FR-CH-002)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', alignItems: 'center', gap: '12px', padding: '14px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              {/* Origin */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Kantor Asal</span>
                <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '12.5px', marginTop: '2px' }}>{origin}</div>
              </div>

              <div style={{ color: 'var(--accent-cyan)', display: 'flex', justifyContent: 'center' }}>
                <ArrowRight size={18} />
              </div>

              {/* Transit */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: 'var(--accent-amber)', textTransform: 'uppercase', fontWeight: 700 }}>Hub Transit</span>
                <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '12.5px', marginTop: '2px' }}>{transit}</div>
              </div>

              <div style={{ color: 'var(--accent-cyan)', display: 'flex', justifyContent: 'center' }}>
                <ArrowRight size={18} />
              </div>

              {/* Destination */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: 'var(--accent-emerald)', textTransform: 'uppercase', fontWeight: 700 }}>Kantor Tujuan</span>
                <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '12.5px', marginTop: '2px' }}>{destination}</div>
              </div>
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="surface-card" style={{ padding: '16px', marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} color="var(--primary-blue)" /> Riwayat Audit Trail Tracking
              </h4>
              <span className="badge badge-navy" style={{ fontSize: '10.5px' }}>{state}</span>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}>No.</th>
                    <th>Status Asal</th>
                    <th>Status Tujuan</th>
                    <th>Waktu Perubahan</th>
                    <th>ID Manifest</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingHistory.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                          {item.from_state || '- (Entry awal)'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-emerald" style={{ fontSize: '10.5px', fontWeight: 800 }}>
                          {item.to_state}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-primary)', fontSize: '11.5px', fontWeight: 600 }}>
                        {formatDate(item.changedAt)}
                      </td>
                      <td>
                        {item.manifest_id ? (
                          <span className="badge badge-navy" style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>
                            {item.manifest_id}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-surface-soft)' }}>
          <button 
            onClick={onClose} 
            className="btn-primary" 
            style={{ fontSize: '12px' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
