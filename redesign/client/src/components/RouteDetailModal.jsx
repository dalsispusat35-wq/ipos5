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
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ color: '#0f172a', fontWeight: 800, margin: 0, fontSize: '16px' }}>Visualisasi Rute Resi: {code}</h3>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>Layanan: <strong style={{ color: '#0b2e8a' }}>{service}</strong> | Berat: <strong style={{ color: '#0f172a' }}>{weight} kg</strong></span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#64748b', 
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
          {/* Route Flow */}
          <div className="spatial-card" style={{ padding: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: 0 }}>
            <h4 style={{ color: '#0b2e8a', margin: '0 0 12px', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="#0284c7" /> Visualisasi Alur Logistik Paket (FR-CH-002)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', alignItems: 'center', gap: '12px', padding: '14px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              {/* Origin */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Kantor Asal</span>
                <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '12.5px', marginTop: '2px' }}>{origin}</div>
              </div>

              <div style={{ color: '#0284c7', display: 'flex', justifyContent: 'center' }}>
                <ArrowRight size={18} />
              </div>

              {/* Transit */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#d97706', textTransform: 'uppercase', fontWeight: 700 }}>Hub Transit</span>
                <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '12.5px', marginTop: '2px' }}>{transit}</div>
              </div>

              <div style={{ color: '#0284c7', display: 'flex', justifyContent: 'center' }}>
                <ArrowRight size={18} />
              </div>

              {/* Destination */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#16a34a', textTransform: 'uppercase', fontWeight: 700 }}>Kantor Tujuan</span>
                <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '12.5px', marginTop: '2px' }}>{destination}</div>
              </div>
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="spatial-card" style={{ padding: '16px', marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ color: '#0f172a', margin: 0, fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} color="#0284c7" /> Riwayat Audit Trail Tracking
              </h4>
              <span className="badge badge-navy" style={{ fontSize: '10.5px' }}>{state}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '36px', color: '#64748b' }}>No.</th>
                    <th style={{ padding: '8px 10px', color: '#64748b' }}>Status Asal</th>
                    <th style={{ padding: '8px 10px', color: '#64748b' }}>Status Tujuan</th>
                    <th style={{ padding: '8px 10px', color: '#64748b' }}>Waktu Perubahan</th>
                    <th style={{ padding: '8px 10px', color: '#64748b' }}>ID Manifest</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingHistory.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>
                          {item.from_state || '- (Entry awal)'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span className="badge badge-emerald" style={{ fontSize: '10.5px', fontWeight: 800 }}>
                          {item.to_state}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#0f172a', fontSize: '11.5px', fontWeight: 600 }}>
                        {formatDate(item.changedAt)}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {item.manifest_id ? (
                          <span className="badge badge-navy" style={{ fontSize: '10.5px', fontFamily: 'monospace' }}>
                            {item.manifest_id}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
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
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
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
