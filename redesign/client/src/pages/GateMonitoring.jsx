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

  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Session Metadata Header */}
      <div className="glass-card-solid" style={{ padding: '16px 22px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Session', value: 'TRP-240724-008', mono: true },
          { label: 'Date', value: '24 Jul 2026' },
          { label: 'Vehicle', value: 'D 9021 AB — Mitsubishi Canter' },
          { label: 'Driver', value: 'Hendra Kusuma' },
          { label: 'Route', value: 'Cimahi → Bandung SC (Main)' },
          { label: 'Departed', value: '08:30 WIB' },
        ].map((f) => (
          <div key={f.label} style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
              {f.label}
            </div>
            <div className={f.mono ? 'font-mono' : ''} style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {/* 3 Kanban Checkpoint Stages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Stage 1: Manifest Creation */}
        <div
          className="gradient-border-card"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            opacity: manifested ? 0.6 : 1,
            transition: 'opacity 0.4s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: manifested ? 'rgba(255,255,255,0.06)' : 'rgba(232,67,31,0.15)',
                border: `2px solid ${manifested ? 'rgba(255,255,255,0.1)' : 'rgba(232,67,31,0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: manifested ? 'rgba(255,255,255,0.4)' : '#e8431f',
              }}
            >
              1
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Manifest Creation</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Bagging & Consolidation</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s1Items.length}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>pkgs</div>
            </div>
          </div>

          {!manifested && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(232,67,31,0.08)', border: '1px solid rgba(232,67,31,0.15)', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <FileText size={13} color="#e8431f" />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#e8431f' }}>Manifest ID</div>
                <div className="font-mono" style={{ fontSize: 12, color: '#fff' }}>MNFST-240724-015</div>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflow: 'auto', marginBottom: 14 }}>
            {s1Items.map((item) => (
              <div key={item.connote} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Package size={12} color="rgba(255,255,255,0.3)" />
                <span className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{item.connote.slice(-6)}</span>
                <span style={{ fontSize: 12, color: '#fff', flex: 1 }}>{item.dest}</span>
                <span className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.weight}</span>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={handleManifest} disabled={manifested || s1Items.length === 0} style={{ width: '100%', justifyContent: 'center' }}>
            <FileText size={14} /> {manifested ? 'Manifested' : 'Create Manifest & Bag'}
          </button>
        </div>

        {/* Stage 2: Inbound Transit */}
        <div
          className="gradient-border-card"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            opacity: !manifested ? 0.5 : 1,
            transition: 'opacity 0.4s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: inTransit ? 'rgba(255,255,255,0.06)' : 'rgba(36,96,176,0.2)',
                border: `2px solid ${inTransit ? 'rgba(255,255,255,0.1)' : 'rgba(36,96,176,0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: inTransit ? 'rgba(255,255,255,0.4)' : '#6ba3f0',
              }}
            >
              2
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Inbound Transit</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Bandung Sorting Center</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s2Items.length}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>pkgs</div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', marginBottom: 14 }}>
            {s2Items.map((item) => (
              <div key={item.connote} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Package size={12} color="rgba(255,255,255,0.3)" />
                <span className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{item.connote.slice(-6)}</span>
                <span style={{ fontSize: 12, color: '#fff', flex: 1 }}>{item.dest}</span>
                <span className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.weight}</span>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={handleTransit} disabled={!manifested || inTransit || s2Items.length === 0} style={{ width: '100%', justifyContent: 'center' }}>
            <Send size={14} /> {inTransit ? 'In Transit' : 'Mark as In Transit'}
          </button>
        </div>

        {/* Stage 3: Final Arrival */}
        <div
          className="glass-card-solid"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            opacity: !inTransit ? 0.5 : 1,
            border: arrived ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: arrived ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.08)',
                border: `2px solid ${arrived ? '#10b981' : 'rgba(16,185,129,0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: arrived ? '#10b981' : 'rgba(16,185,129,0.5)',
              }}
            >
              3
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: arrived ? '#10b981' : '#fff' }}>Final Arrival</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Delivered to Destination</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: arrived ? '#10b981' : '#fff', lineHeight: 1 }}>{arrived ? 0 : s3Items.length}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>remaining</div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', marginBottom: 14 }}>
            {arrived ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#10b981', fontSize: 12 }}>
                All packages confirmed delivered
              </div>
            ) : (
              s3Items.map((item) => (
                <div key={item.connote} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <Package size={12} color="rgba(255,255,255,0.3)" />
                  <span className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{item.connote.slice(-6)}</span>
                  <span style={{ fontSize: 12, color: '#fff', flex: 1 }}>{item.dest}</span>
                  <span className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.weight}</span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleArrive}
            disabled={!inTransit || arrived || s3Items.length === 0}
            style={{
              background: arrived ? 'rgba(16,185,129,0.15)' : (!inTransit ? 'rgba(255,255,255,0.04)' : '#10b981'),
              color: arrived ? '#10b981' : (!inTransit ? 'rgba(255,255,255,0.3)' : '#fff'),
              fontWeight: 600,
              fontSize: 13,
              padding: '9px 0',
              borderRadius: 8,
              border: arrived ? '1px solid rgba(16,185,129,0.25)' : 'none',
              cursor: !inTransit || arrived ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
            }}
          >
            <CheckCircle size={14} /> {arrived ? 'Arrival Confirmed' : 'Confirm Arrival'}
          </button>
        </div>
      </div>
    </div>
  );
}
