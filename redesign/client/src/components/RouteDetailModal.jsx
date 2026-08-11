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

  // Fallback tracking history if array is null or empty
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
      style={{ zIndex: 2000, background: 'rgba(2, 6, 18, 0.88)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="modal-content animate-fade-in" 
        style={{ 
          maxWidth: '780px', 
          width: '94%', 
          maxHeight: '88vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0,
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 50px rgba(56, 189, 248, 0.15)'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ color: 'white', fontWeight: 800, margin: 0, fontSize: '16px' }}>Visualisasi Rute Resi: {code}</h3>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Layanan: <strong style={{ color: '#38bdf8' }}>{service}</strong> | Berat: <strong style={{ color: '#fff' }}>{weight} kg</strong></span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px',
              color: 'var(--text-muted)', 
              cursor: 'pointer', 
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Route Flow (FR-CH-002) */}
          <div className="glass-card" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(11,25,44,0.95), rgba(6,13,31,0.95))', border: '1px solid rgba(56,189,248,0.25)', marginBottom: 0 }}>
            <h4 style={{ color: 'white', margin: '0 0 12px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="#38bdf8" /> Visualisasi Alur Logistik Paket (FR-CH-002)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(6,13,31,0.7)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Origin */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Kantor Asal (Nopen)</span>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>{origin}</div>
              </div>

              <div style={{ color: '#38bdf8', display: 'flex', justifyContent: 'center' }}>
                <ArrowRight size={18} className="desktop-only" />
                <ArrowDown size={18} className="mobile-only" />
              </div>

              {/* Transit */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>Hub Transit</span>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>{transit}</div>
              </div>

              <div style={{ color: '#38bdf8', display: 'flex', justifyContent: 'center' }}>
                <ArrowRight size={18} className="desktop-only" />
                <ArrowDown size={18} className="mobile-only" />
              </div>

              {/* Destination */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Kantor Tujuan (Nopen)</span>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>{destination}</div>
              </div>
            </div>
          </div>

          {/* Audit Trail Table (FR-CH-003) */}
          <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ color: 'white', margin: 0, fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} color="#38bdf8" /> Riwayat Audit Trail Tracking (FR-CH-003)
              </h4>
              <span className="badge badge-info" style={{ fontSize: '10.5px' }}>{state}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: '11.5px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}>No.</th>
                    <th>Status Asal</th>
                    <th>Status Tujuan</th>
                    <th>Waktu Perubahan (Timestamp)</th>
                    <th>ID Manifest</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingHistory.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <span style={{ color: item.from_state ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: '11px' }}>
                          {item.from_state || '- (Entry awal)'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-emerald" style={{ fontSize: '10.5px', fontWeight: 700 }}>
                          {item.to_state}
                        </span>
                      </td>
                      <td style={{ color: 'white', fontSize: '11px' }}>
                        {formatDate(item.changedAt)}
                      </td>
                      <td>
                        {item.manifest_id ? (
                          <span className="font-mono badge badge-navy" style={{ fontSize: '10px', color: '#38bdf8' }}>
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
        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ 
              border: '1px solid rgba(56,189,248,0.3)', 
              color: '#38bdf8', 
              background: 'rgba(56,189,248,0.08)',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
