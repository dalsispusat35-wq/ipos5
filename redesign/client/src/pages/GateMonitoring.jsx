import { useState } from 'react';
import { ArrowRight, FileText, Send, CheckCircle, Package, Clock } from 'lucide-react';
import { api } from '../utils/api.js';

export default function GateMonitoring() {
  const [manifested, setManifested] = useState(false);
  const [inTransit, setInTransit] = useState(false);
  const [arrived, setArrived] = useState(false);

  const [s1Items, setS1Items] = useState([
    { connote: '00130000110724041', dest: 'KCU Garut', weight: '2.1 kg' },
    { connote: '00130000110724042', dest: 'KPRK Tasikmalaya', weight: '0.5 kg' },
    { connote: '00130000110724043', dest: 'KCU Bandung Utara', weight: '4.8 kg' },
    { connote: '00130000110724044', dest: 'KCU Sumedang', weight: '1.2 kg' },
    { connote: '00130000110724045', dest: 'KPRK Purwakarta', weight: '3.3 kg' },
  ]);

  const [s2Items, setS2Items] = useState([
    { connote: '00130000110724021', dest: 'KCU Garut', weight: '1.8 kg' },
    { connote: '00130000110724022', dest: 'KCU Bandung Barat', weight: '0.9 kg' },
    { connote: '00130000110724023', dest: 'KPRK Cianjur', weight: '2.6 kg' },
  ]);

  const [s3Items, setS3Items] = useState([
    { connote: '00130000110724001', dest: 'KCU Bandung Utara', weight: '2.4 kg' },
    { connote: '00130000110724002', dest: 'KCU Sumedang', weight: '0.8 kg' },
  ]);

  const handleManifest = async () => {
    try {
      const connoteCodes = s1Items.map(item => item.connote);
      await api.createManifest(connoteCodes);
    } catch (e) {
      console.error('Error creating manifest:', e);
    }
    setManifested(true);
    setS2Items((prev) => [...s1Items, ...prev]);
    setS1Items([]);
  };

  const handleTransit = async () => {
    try {
      await api.markTransit('MNFST-240724-015');
    } catch (e) {
      console.error('Error marking transit:', e);
    }
    setInTransit(true);
    setS3Items((prev) => [...s2Items, ...prev]);
    setS2Items([]);
  };

  const handleArrive = async () => {
    try {
      await api.arriveManifest('MNFST-240724-015');
    } catch (e) {
      console.error('Error confirming arrival:', e);
    }
    setArrived(true);
    setS3Items([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Session Metadata Header */}
      <div className="spatial-card" style={{ padding: '18px 24px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Sesi Dispatch', value: 'TRP-240724-008', mono: true },
          { label: 'Tanggal', value: '24 Jul 2026' },
          { label: 'Armada Truk', value: 'D 9021 AB — Mitsubishi Canter' },
          { label: 'Driver', value: 'Hendra Kusuma' },
          { label: 'Penugasan Rute', value: 'Cimahi → Bandung SC (Main)' },
          { label: 'Jam Keberangkatan', value: '08:30 WIB' },
        ].map((f) => (
          <div key={f.label} style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>
              {f.label}
            </div>
            <div className={f.mono ? 'font-mono' : ''} style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {/* 3 Kanban Checkpoint Stages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Stage 1: Manifest Creation */}
        <div
          className="spatial-card"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            opacity: manifested ? 0.65 : 1,
            transition: 'opacity 0.4s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: manifested ? '#f1f5f9' : '#e0f2fe',
                border: `2px solid ${manifested ? '#cbd5e1' : '#bae6fd'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
                color: manifested ? '#94a3b8' : '#0284c7',
              }}
            >
              1
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>Manifest Creation</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Bagging & Consolidation</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{s1Items.length}</div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', textAlign: 'right' }}>paket</div>
            </div>
          </div>

          {!manifested && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <FileText size={14} color="#0284c7" />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7' }}>Manifest ID</div>
                <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 800, fontFamily: 'monospace' }}>MNFST-240724-015</div>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflow: 'auto', marginBottom: 14 }}>
            {s1Items.map((item) => (
              <div key={item.connote} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <Package size={13} color="#94a3b8" />
                <span style={{ fontSize: 11.5, color: '#0b2e8a', fontWeight: 700, fontFamily: 'monospace', flex: 1 }}>{item.connote.slice(-6)}</span>
                <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, flex: 1 }}>{item.dest}</span>
                <span style={{ fontSize: 11.5, color: '#64748b', fontFamily: 'monospace' }}>{item.weight}</span>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={handleManifest} disabled={manifested || s1Items.length === 0} style={{ width: '100%', justifyContent: 'center' }}>
            <FileText size={14} /> {manifested ? 'Manifest Selesai' : 'Buat Manifest & Bagging'}
          </button>
        </div>

        {/* Stage 2: Inbound Transit */}
        <div
          className="spatial-card"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            opacity: !manifested ? 0.5 : 1,
            transition: 'opacity 0.4s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: inTransit ? '#f1f5f9' : '#e0f2fe',
                border: `2px solid ${inTransit ? '#cbd5e1' : '#bae6fd'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
                color: inTransit ? '#94a3b8' : '#0284c7',
              }}
            >
              2
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>Inbound Transit</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Bandung Sorting Center</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{s2Items.length}</div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', textAlign: 'right' }}>paket</div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', marginBottom: 14 }}>
            {s2Items.map((item) => (
              <div key={item.connote} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <Package size={13} color="#94a3b8" />
                <span style={{ fontSize: 11.5, color: '#0b2e8a', fontWeight: 700, fontFamily: 'monospace', flex: 1 }}>{item.connote.slice(-6)}</span>
                <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, flex: 1 }}>{item.dest}</span>
                <span style={{ fontSize: 11.5, color: '#64748b', fontFamily: 'monospace' }}>{item.weight}</span>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={handleTransit} disabled={!manifested || inTransit || s2Items.length === 0} style={{ width: '100%', justifyContent: 'center' }}>
            <Send size={14} /> {inTransit ? 'Dalam Transit' : 'Tandai Dalam Transit'}
          </button>
        </div>

        {/* Stage 3: Final Arrival */}
        <div
          className="spatial-card"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            opacity: !inTransit ? 0.5 : 1,
            border: arrived ? '1px solid #16a34a' : '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: arrived ? '#dcfce7' : '#f0fdf4',
                border: `2px solid ${arrived ? '#16a34a' : '#bbf7d0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
                color: arrived ? '#16a34a' : '#22c55e',
              }}
            >
              3
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: arrived ? '#16a34a' : '#0f172a' }}>Final Arrival</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Tiba di Kantor Tujuan</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: arrived ? '#16a34a' : '#0f172a', lineHeight: 1 }}>{arrived ? 0 : s3Items.length}</div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', textAlign: 'right' }}>tersisa</div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', marginBottom: 14 }}>
            {arrived ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#16a34a', fontSize: 12, fontWeight: 700 }}>
                Semua paket telah terkonfirmasi tiba
              </div>
            ) : (
              s3Items.map((item) => (
                <div key={item.connote} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <Package size={13} color="#94a3b8" />
                  <span style={{ fontSize: 11.5, color: '#0b2e8a', fontWeight: 700, fontFamily: 'monospace', flex: 1 }}>{item.connote.slice(-6)}</span>
                  <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, flex: 1 }}>{item.dest}</span>
                  <span style={{ fontSize: 11.5, color: '#64748b', fontFamily: 'monospace' }}>{item.weight}</span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleArrive}
            disabled={!inTransit || arrived || s3Items.length === 0}
            className={arrived ? "btn-ghost" : "btn-primary"}
            style={{
              width: '100%',
              justifyContent: 'center',
              background: arrived ? 'var(--accent-emerald-bg)' : (!inTransit ? 'var(--bg-surface-soft)' : 'var(--accent-emerald)'),
              color: arrived ? 'var(--accent-emerald)' : (!inTransit ? 'var(--text-muted)' : '#ffffff'),
              border: arrived ? '1px solid rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            <CheckCircle size={14} /> {arrived ? 'Kedatangan Terkonfirmasi' : 'Konfirmasi Kedatangan'}
          </button>
        </div>
      </div>
    </div>
  );
}
