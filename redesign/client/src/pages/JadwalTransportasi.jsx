import { useState } from 'react';
import { Plus, Play, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { api } from '../utils/api.js';

const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function JadwalTransportasi() {
  const [trips] = useState([
    { id: 1, day: 0, startHour: 6, duration: 2, vehicle: 'B 9910 PCX', route: 'Cimahi → SPP Bandung', color: '#0284c7' },
    { id: 2, day: 0, startHour: 10, duration: 2, vehicle: 'B 9945 PCY', route: 'Cimahi → SPP Bandung', color: '#0b2e8a' },
    { id: 3, day: 0, startHour: 14, duration: 2, vehicle: 'D 8812 AB', route: 'Cimahi → Soreang Loop', color: '#d97706' },
    { id: 4, day: 1, startHour: 6, duration: 2, vehicle: 'B 9910 PCX', route: 'Cimahi → SPP Bandung', color: '#0284c7' },
    { id: 5, day: 1, startHour: 10, duration: 2, vehicle: 'D 8990 SPP', route: 'SPP Bandung → Jakarta (RTE-6)', color: '#0b2e8a' },
    { id: 6, day: 2, startHour: 7, duration: 2, vehicle: 'B 9910 PCX', route: 'Cimahi → SPP Bandung', color: '#0284c7' },
    { id: 7, day: 2, startHour: 13, duration: 3, vehicle: 'D 8812 AB', route: 'Cimahi → Soreang Loop', color: '#d97706' },
    { id: 8, day: 3, startHour: 6, duration: 2, vehicle: 'B 9910 PCX', route: 'Cimahi → SPP Bandung', color: '#0284c7' },
    { id: 9, day: 3, startHour: 9, duration: 2, vehicle: 'B 9945 PCY', route: 'Cimahi → SPP Bandung', color: '#0b2e8a' },
    { id: 10, day: 3, startHour: 14, duration: 2, vehicle: 'D 8990 SPP', route: 'SPP Bandung → Jakarta (RTE-6)', color: '#0284c7' },
    { id: 11, day: 4, startHour: 6, duration: 2, vehicle: 'B 9910 PCX', route: 'Cimahi → SPP Bandung', color: '#0284c7' },
    { id: 12, day: 4, startHour: 11, duration: 2, vehicle: 'D 8812 AB', route: 'Cimahi → Soreang Loop', color: '#d97706' },
    { id: 13, day: 5, startHour: 8, duration: 2, vehicle: 'B 9945 PCY', route: 'Cimahi → SPP Bandung', color: '#0b2e8a' },
    { id: 14, day: 6, startHour: 8, duration: 2, vehicle: 'B 9910 PCX', route: 'Cimahi → SPP Bandung', color: '#0284c7' },
  ]);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setGenerating(false);
          return 100;
        }
        return p + 10;
      });
    }, 150);

    try {
      await api.generateJadwalBulk();
    } catch (e) {
      console.error('Error generating bulk schedule:', e);
    }
  };

  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const CELL_H = 52;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', minWidth: 170, textAlign: 'center' }}>
            17 Agt – 23 Agt 2026
          </span>
          <button className="btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {generating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 140, height: 6, borderRadius: 3, background: 'var(--bg-surface-soft)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary-blue)', borderRadius: 3, transition: 'width 0.2s' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--primary-blue)', fontWeight: 800 }}>{progress}%</span>
            </div>
          )}
          <button className="btn-ghost"><Plus size={14} /> Tambah Jadwal Trip</button>
          <button className="btn-primary" onClick={handleGenerate} disabled={generating} style={{ gap: 6 }}>
            <Play size={14} /> {generating ? 'Membuat Jadwal…' : 'Generate Jadwal Bulanan'}
          </button>
        </div>
      </div>

      {/* Transport Calendar Grid */}
      <div className="spatial-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface-soft)' }}>
          <div style={{ padding: '10px', borderRight: '1px solid var(--border-light)' }} />
          {days.map((d, i) => (
            <div key={d} style={{ padding: '10px 0', textAlign: 'center', borderRight: i < 6 ? '1px solid var(--border-light)' : 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: i === 3 ? 'var(--accent-cyan)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>{d}</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: i === 3 ? 'var(--primary-blue)' : 'var(--text-primary)', marginTop: 2 }}>{17 + i}</div>
            </div>
          ))}
        </div>

        <div style={{ overflowY: 'auto', maxHeight: 440, display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div style={{ background: 'var(--bg-surface-soft)' }}>
            {hours.map((h) => (
              <div key={h} style={{ height: CELL_H, borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '6px 8px' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{h.toString().padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {days.map((_, dayIdx) => (
            <div key={dayIdx} style={{ borderRight: dayIdx < 6 ? '1px solid var(--border-light)' : 'none', position: 'relative' }}>
              {hours.map((h) => <div key={h} style={{ height: CELL_H, borderBottom: '1px solid var(--border-light)' }} />)}
              {trips.filter((t) => t.day === dayIdx).map((trip) => {
                const top = (trip.startHour - 6) * CELL_H;
                const height = trip.duration * CELL_H - 4;
                return (
                  <div
                    key={trip.id}
                    style={{
                      position: 'absolute',
                      top: top + 2,
                      left: 4,
                      right: 4,
                      height,
                      borderRadius: 8,
                      background: 'var(--accent-cyan-bg)',
                      border: '1px solid var(--border-light)',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-blue)', fontFamily: 'monospace' }}>{trip.startHour.toString().padStart(2, '0')}:00</div>
                    <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.2 }}>{trip.route}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>{trip.vehicle}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
