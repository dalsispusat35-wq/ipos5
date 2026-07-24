import { useState } from 'react';
import { Plus, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../utils/api.js';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function JadwalTransportasi() {
  const [trips] = useState([
    { id: 1, day: 0, startHour: 6, duration: 2, vehicle: 'D 9021 AB', route: 'Cimahi → Bandung SC', color: '#e8431f' },
    { id: 2, day: 0, startHour: 10, duration: 2, vehicle: 'D 8832 CD', route: 'Cimahi → Bandung SC', color: '#2460b0' },
    { id: 3, day: 0, startHour: 14, duration: 2, vehicle: 'D 7741 EF', route: 'Cimahi → Soreang Loop', color: '#f59e0b' },
    { id: 4, day: 1, startHour: 6, duration: 2, vehicle: 'D 9021 AB', route: 'Cimahi → Bandung SC', color: '#e8431f' },
    { id: 5, day: 1, startHour: 10, duration: 2, vehicle: 'D 6600 GH', route: 'Cimahi → Bandung SC (Via Padalarang)', color: '#2460b0' },
    { id: 6, day: 2, startHour: 7, duration: 2, vehicle: 'D 5512 IJ', route: 'Cimahi → Bandung SC', color: '#e8431f' },
    { id: 7, day: 2, startHour: 13, duration: 3, vehicle: 'D 4423 KL', route: 'Cimahi → Soreang Loop', color: '#f59e0b' },
    { id: 8, day: 3, startHour: 6, duration: 2, vehicle: 'D 9021 AB', route: 'Cimahi → Bandung SC', color: '#e8431f' },
    { id: 9, day: 3, startHour: 9, duration: 2, vehicle: 'D 8832 CD', route: 'Cimahi → Bandung SC', color: '#2460b0' },
    { id: 10, day: 3, startHour: 14, duration: 2, vehicle: 'D 2205 OP', route: 'Cimahi → Bandung SC', color: '#e8431f' },
    { id: 11, day: 4, startHour: 6, duration: 2, vehicle: 'D 9021 AB', route: 'Cimahi → Bandung SC', color: '#e8431f' },
    { id: 12, day: 4, startHour: 11, duration: 2, vehicle: 'D 7741 EF', route: 'Cimahi → Soreang Loop', color: '#f59e0b' },
    { id: 13, day: 5, startHour: 8, duration: 2, vehicle: 'D 8832 CD', route: 'Cimahi → Bandung SC', color: '#2460b0' },
    { id: 14, day: 6, startHour: 8, duration: 2, vehicle: 'D 5512 IJ', route: 'Cimahi → Bandung SC', color: '#e8431f' },
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
  const CELL_H = 50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', minWidth: 160, textAlign: 'center' }}>
            20 Jul – 26 Jul 2026
          </span>
          <button className="btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {generating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 140, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #e8431f, #f59e0b)', borderRadius: 3, transition: 'width 0.2s' }} />
              </div>
              <span style={{ fontSize: 12, color: '#e8431f', fontWeight: 600 }}>{progress}%</span>
            </div>
          )}
          <button className="btn-ghost"><Plus size={14} /> Add Trip</button>
          <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
            <Play size={14} /> {generating ? 'Generating…' : 'Generate Monthly Schedule'}
          </button>
        </div>
      </div>

      {/* Transport Calendar Grid */}
      <div className="glass-card-solid" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ padding: '10px', borderRight: '1px solid rgba(255,255,255,0.05)' }} />
          {days.map((d, i) => (
            <div key={d} style={{ padding: '10px 0', textAlign: 'center', borderRight: i < 6 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: i === 3 ? '#e8431f' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{d}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: i === 3 ? '#fff' : 'rgba(255,255,255,0.6)', marginTop: 2 }}>{20 + i}</div>
            </div>
          ))}
        </div>

        <div style={{ overflowY: 'auto', maxHeight: 420, display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          <div>
            {hours.map((h) => (
              <div key={h} style={{ height: CELL_H, borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '4px 8px' }}>
                <span className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{h.toString().padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {days.map((_, dayIdx) => (
            <div key={dayIdx} style={{ borderRight: dayIdx < 6 ? '1px solid rgba(255,255,255,0.05)' : 'none', position: 'relative' }}>
              {hours.map((h) => <div key={h} style={{ height: CELL_H, borderBottom: '1px solid rgba(255,255,255,0.04)' }} />)}
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
                      borderRadius: 7,
                      background: `${trip.color}22`,
                      border: `1px solid ${trip.color}50`,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: trip.color }}>{trip.startHour.toString().padStart(2, '0')}:00</div>
                    <div style={{ fontSize: 10.5, color: '#fff', lineHeight: 1.2 }}>{trip.route}</div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{trip.vehicle}</div>
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
