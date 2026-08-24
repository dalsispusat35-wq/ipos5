import { useState, useEffect } from 'react';
import { Plus, CalendarClock, Trash2, Edit2 } from 'lucide-react';
import { api } from '../utils/api.js';

export default function TemplateJadwal() {
  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
          {templates.filter((t) => t.active).length} template aktif · {templates.length} total pola
        </div>
        <button className="btn-primary" style={{ gap: 6 }}>
          <Plus size={15} /> Tambah Template Baru
        </button>
      </div>

      {/* Template Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {templates.map((t) => (
          <div
            key={t.id}
            className="spatial-card"
            style={{ padding: 22, opacity: t.active ? 1 : 0.65, transition: 'opacity 0.2s' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: t.active ? 'var(--accent-cyan-bg)' : 'var(--bg-surface-soft)',
                  border: `1px solid ${t.active ? 'rgba(2, 132, 199, 0.3)' : 'var(--border-light)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: t.active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  flexShrink: 0,
                }}
              >
                <CalendarClock size={20} />
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{t.name}</div>
                  <span className={t.active ? 'badge badge-emerald' : 'badge badge-navy'} style={{ fontSize: 10 }}>
                    {t.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
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
                        fontWeight: 800,
                        background: t.days.includes(i) ? 'var(--primary-navy)' : 'var(--bg-surface-soft)',
                        border: t.days.includes(i) ? '1px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                        color: t.days.includes(i) ? '#ffffff' : 'var(--text-muted)',
                      }}
                    >
                      {d}
                    </div>
                  ))}

                  <div style={{ width: 1, background: 'var(--border-light)', margin: '0 6px' }} />

                  {/* Times */}
                  {t.times.map((time) => (
                    <div
                      key={time}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'var(--accent-cyan-bg)',
                        border: '1px solid rgba(2, 132, 199, 0.3)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--accent-cyan)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {time}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Armada: </span>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'monospace' }}>{t.vehicle}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rute: </span>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{t.route}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Trip/minggu: </span>
                    <span style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 800 }}>
                      {t.days.length * t.times.length} Trip
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => toggle(t.id)}
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  {t.active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="btn-ghost"
                  style={{ color: '#ef4444', padding: '6px 8px' }}
                  title="Hapus template"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
