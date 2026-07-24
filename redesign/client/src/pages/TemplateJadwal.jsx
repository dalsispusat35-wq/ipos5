import { useState, useEffect } from 'react';
import { Plus, CalendarClock, Trash2, Edit2 } from 'lucide-react';
import { api } from '../utils/api.js';

export default function TemplateJadwal() {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const [templates, setTemplates] = useState([
    { id: 1, name: 'Standard Weekday Morning', description: 'Daily morning run for weekday package delivery to Bandung SC.', days: [0, 1, 2, 3, 4], times: ['06:00', '10:00'], vehicle: 'D 9021 AB', route: 'Cimahi → Bandung SC (Main)', active: true },
    { id: 2, name: 'Afternoon Loop', description: 'Afternoon trips covering Soreang area on select days.', days: [0, 2, 4], times: ['14:00'], vehicle: 'D 7741 EF', route: 'Cimahi → Soreang Loop', active: true },
    { id: 3, name: 'Weekend Minimal', description: 'Single Saturday and Sunday run for urgent weekend deliveries.', days: [5, 6], times: ['08:00'], vehicle: 'D 5512 IJ', route: 'Cimahi → Bandung SC (Main)', active: true },
    { id: 4, name: 'Express Peak (Seasonal)', description: 'High-frequency 5-trip/day schedule for peak seasons (Lebaran, year-end).', days: [0, 1, 2, 3, 4, 5, 6], times: ['04:00', '07:00', '10:00', '13:00', '17:00'], vehicle: 'ALL', route: 'Cimahi → Bandung SC (Main)', active: false },
    { id: 5, name: 'Via Padalarang (Mid-week)', description: 'Mid-week alternative route via Padalarang to reduce congestion.', days: [1, 3], times: ['09:00'], vehicle: 'D 6600 GH', route: 'Cimahi → Bandung SC (Via Padalarang)', active: true },
  ]);

  const fetchTemplates = async () => {
    try {
      const res = await api.getTemplate();
      if (res.success && res.data && res.data.length > 0) {
        setTemplates(res.data.map((t, idx) => ({
          id: t._id || idx + 1,
          name: t.nama_template || t.name || 'Template Jadwal',
          description: t.keterangan || t.description || 'Pola perjalanan logistik rutin.',
          days: t.days || [0, 1, 2, 3, 4],
          times: t.times || ['06:00', '10:00'],
          vehicle: t.nopol || t.vehicle || 'D 9021 AB',
          route: t.nama_route || t.route || 'Cimahi → Bandung SC',
          active: t.status === 'NONAKTIF' ? false : true,
        })));
      }
    } catch (err) {
      console.error('Error fetching template jadwal:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const toggle = (id) =>
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t)));

  const remove = (id) => setTemplates((prev) => prev.filter((t) => t.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          {templates.filter((t) => t.active).length} active templates · {templates.length} total
        </div>
        <button className="btn-primary" style={{ marginLeft: 'auto' }}>
          <Plus size={15} /> New Template
        </button>
      </div>

      {/* Template Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {templates.map((t) => (
          <div
            key={t.id}
            className="glass-card-solid"
            style={{ padding: 22, opacity: t.active ? 1 : 0.6, transition: 'opacity 0.2s' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: t.active ? 'rgba(232,67,31,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${t.active ? 'rgba(232,67,31,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: t.active ? '#e8431f' : 'rgba(255,255,255,0.3)',
                  flexShrink: 0,
                }}
              >
                <CalendarClock size={18} />
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                  <span className={t.active ? 'badge badge-emerald' : 'badge badge-navy'} style={{ fontSize: 10 }}>
                    {t.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 14, lineHeight: 1.5 }}>
                  {t.description}
                </div>

                {/* Days Grid */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {dayNames.map((d, i) => (
                    <div
                      key={d}
                      style={{
                        width: 36,
                        height: 28,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        background: t.days.includes(i) ? 'rgba(232,67,31,0.15)' : 'rgba(255,255,255,0.04)',
                        border: t.days.includes(i) ? '1px solid rgba(232,67,31,0.25)' : '1px solid rgba(255,255,255,0.06)',
                        color: t.days.includes(i) ? '#e8431f' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {d}
                    </div>
                  ))}

                  <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />

                  {/* Times */}
                  {t.times.map((time) => (
                    <div
                      key={time}
                      className="font-mono"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(36,96,176,0.15)',
                        border: '1px solid rgba(36,96,176,0.25)',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#6ba3f0',
                      }}
                    >
                      {time}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Vehicle: </span>
                    <span className="font-mono" style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{t.vehicle}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Route: </span>
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{t.route}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Trips/week: </span>
                    <span style={{ fontSize: 12, color: '#6ba3f0', fontWeight: 700 }}>
                      {t.days.length * t.times.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div
                  className="toggle-track"
                  onClick={() => toggle(t.id)}
                  style={{ background: t.active ? '#10b981' : 'rgba(255,255,255,0.1)' }}
                >
                  <div className="toggle-thumb" style={{ left: t.active ? 20 : 2 }} />
                </div>
                <button
                  onClick={() => remove(t.id)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    background: 'rgba(232,67,31,0.06)',
                    border: '1px solid rgba(232,67,31,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'rgba(232,67,31,0.7)',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
