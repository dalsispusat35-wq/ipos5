import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, RefreshCw, Truck, Copy, Search, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { api } from '../utils/api.js';
import VehicleDetailModal from '../components/VehicleDetailModal.jsx';

// Helper to determine office type badge
const getOfficeType = (office) => {
  const name = office.nama_nopend.toUpperCase();
  if (name.includes('KCU') || name.startsWith('KCU ')) return { label: 'KCU HUB', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.05)' };
  if (name.includes('KCP') || name.startsWith('KCP ')) return { label: 'KCP', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.05)' };
  if (name.includes('DC') || name.includes('SPP')) return { label: 'DC / SPP', color: '#f97316', bg: 'rgba(249, 115, 22, 0.05)' };
  if (name.includes('AGEN') || name.startsWith('AGEN ')) return { label: 'AGEN', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.05)' };
  return { label: 'LAINNYA', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.05)' };
};

function Group({ group, onShowDetails }) {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);

  // Time parsing and ETA estimation
  const parseTime = (timeStr) => {
    const clean = timeStr.replace('.', ':');
    const [h, m] = clean.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60) % 24;
    const m = Math.floor(minutes % 60);
    return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
  };

  const startMin = parseTime(group.startTime);
  const endMin = parseTime(group.endTime === '24.00' ? '24:00' : group.endTime);
  const totalDuration = endMin - startMin;
  const step = group.stops.length > 1 ? totalDuration / (group.stops.length - 1) : 0;

  // Calculate ETA for each stop based on its original index
  const stopsWithTimes = group.stops.map((stop, index) => {
    const stopMin = startMin + index * step;
    return {
      ...stop,
      estimatedTime: formatTime(stopMin)
    };
  });

  // Filter stops based on search query
  const filteredStops = stopsWithTimes.filter(stop => 
    stop.nama_nopend.toLowerCase().includes(search.toLowerCase()) || 
    stop.nopend.toLowerCase().includes(search.toLowerCase())
  );

  // Copy route details to clipboard
  const handleCopy = () => {
    const stopsText = group.stops
      .map((stop, i) => `${i + 1}. ${stop.nama_nopend} (${stop.nopend})`)
      .join('\n');
    const fullText = `RUTE: ${group.name} (Berangkat: ${group.startTime} - Tiba: ${group.endTime})\n\n${stopsText}`;
    
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Group */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: 'white' }}>{group.name}</h3>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {group.stops.length} Valid stops · {group.skipped?.length || 0} Skipped
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px' }}>
            <Clock size={12} /> Berangkat: {group.startTime} → Tiba: {group.endTime}
          </span>
          <button 
            className="btn btn-secondary" 
            onClick={handleCopy} 
            style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            title="Salin rute ke clipboard"
          >
            {copied ? <CheckCircle size={12} color="#34d399" /> : <Copy size={12} />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>

      {/* Search Input inside Group */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Cari titik rute..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '8px 12px 8px 32px', 
            background: 'var(--bg-dark)', 
            border: '1px solid var(--border-light)', 
            borderRadius: 6, 
            color: 'white',
            fontSize: 13
          }} 
        />
      </div>

      {/* Timeline List of Valid Stops */}
      <div style={{ position: 'relative', display: 'grid', gap: 12, paddingLeft: 12 }}>
        {/* Vertical Timeline Indicator Line */}
        {filteredStops.length > 1 && (
          <div style={{
            position: 'absolute',
            left: 20,
            top: 20,
            bottom: 20,
            width: 2,
            background: 'linear-gradient(180deg, var(--accent-cyan) 0%, var(--primary-blue) 100%)',
            opacity: 0.25,
            zIndex: 1
          }} />
        )}

        {filteredStops.map((office, index) => {
          const type = getOfficeType(office);
          return (
            <div 
              key={office._id || office.nopend} 
              className="timeline-item"
              style={{ 
                display: 'flex', 
                gap: 16, 
                padding: '14px 16px', 
                background: 'var(--bg-card-hover)', 
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                transition: 'var(--transition-smooth)',
                position: 'relative',
                zIndex: 2,
                cursor: 'pointer'
              }}
              onClick={() => onShowDetails(office)}
            >
              {/* Number Circle */}
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'var(--bg-dark)', 
                border: `2px solid ${type.color}`, 
                color: type.color, 
                fontWeight: '800', 
                fontSize: 12,
                flexShrink: 0
              }}>
                {index + 1}
              </div>
              
              {/* Stop Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ color: 'white', fontSize: 13.5, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {office.nama_nopend}
                  </strong>
                  <span style={{ 
                    fontSize: 9.5, 
                    fontWeight: 700, 
                    padding: '2px 6px', 
                    borderRadius: 4, 
                    border: `1px solid ${type.color}30`, 
                    color: type.color, 
                    background: type.bg 
                  }}>
                    {type.label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-muted)', fontSize: 11.5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={10} /> {office.nopend}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    <Clock size={10} /> Tiba: {office.estimatedTime}
                  </span>
                  {office.nama_kcu_kc && (
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      Hub: {office.nama_kcu_kc.replace(/\bKCU\b|\bKC\b/gi, '').trim()}
                    </span>
                  )}
                </div>
              </div>
              
              <Info size={14} style={{ color: 'var(--text-muted)', alignSelf: 'center', opacity: 0.6 }} />
            </div>
          );
        })}

        {filteredStops.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {search ? 'Tidak ada rute yang cocok.' : 'Semua kandidat di-skip.'}
          </div>
        )}
      </div>

      {/* Skipped Candidates Panel */}
      {group.skipped && group.skipped.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
          <button 
            onClick={() => setShowSkipped(!showSkipped)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--danger)', 
              fontSize: 11.5, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              padding: 0,
              fontWeight: 600
            }}
          >
            <AlertTriangle size={12} />
            {showSkipped ? 'Sembunyikan' : 'Tampilkan'} {group.skipped.length} Kantor di-skip (Dari PPT)
          </button>
          
          {showSkipped && (
            <div style={{ display: 'grid', gap: 6, marginTop: 10, background: 'rgba(239, 68, 68, 0.05)', padding: 12, borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.15)' }}>
              {group.skipped.map((skip, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{skip.candidate}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{skip.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function JadwalPickup() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const load = async () => {
    try {
      setLoading(true); 
      setError('');
      const result = await api.getSlide2NightPickup();
      setRoutes(result.data.routes);
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Truck size={22} style={{ color: 'var(--accent-cyan)' }} />
            Jadwal Pickup SPP Bandung
          </h1>
          <p className="page-subtitle">Rute malam tervalidasi terhadap database master_kantor</p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} /> Refresh
        </button>
      </div>

      {/* Blueprint Info Banner */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 18, fontSize: 13, background: 'rgba(56, 189, 248, 0.03)' }}>
        Rute didasarkan pada <strong>PPT Slide 2 (Blueprint Urutan)</strong>. 
        Kandidat yang tidak terdaftar di <strong>master_kantor</strong> disaring otomatis demi akurasi operasional.
      </div>

      {error && (
        <div className="glass-card" style={{ padding: 16, color: 'var(--danger)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RefreshCw size={24} className="spin-anim" style={{ marginBottom: 12 }} />
          <div>Sinkronisasi data master kantor pos...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {routes.map(route => (
            <article key={route.vehicle} className="glass-card" style={{ padding: '20px 24px', borderLeft: '3px solid var(--accent-cyan)' }}>
              {/* Vehicle Title Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <button 
                    onClick={() => setSelectedVehicle(route.vehicle)}
                    style={{ background: 'none', border: 'none', color: 'white', fontWeight: 800, fontSize: '18px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    title="Klik untuk detail kendaraan"
                  >
                    {route.vehicle}
                  </button>
                </h2>
                <span className="badge badge-purple">{route.category}</span>
              </div>
              
              {/* Groups (Pick Up Lists) */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: route.groups.length > 1 ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', 
                gap: 20 
              }}>
                {route.groups.map(group => (
                  <Group key={group.id} group={group} onShowDetails={setSelectedOffice} />
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Office Details Modal Dialog */}
      {selectedOffice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 8, 16, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 16
        }}>
          <div className="glass-card" style={{ 
            maxWidth: 420, 
            width: '100%', 
            padding: 24, 
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-strong)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedOffice(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={18} />
            </button>
            
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: 'white', borderBottom: '1px solid var(--border-light)', paddingBottom: 10 }}>
              Detail Kantor Pos
            </h3>
            
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Nama Kantor</label>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginTop: 2 }}>{selectedOffice.nama_nopend}</div>
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Nopend / Kode Pos</label>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)', marginTop: 2 }}>{selectedOffice.nopend}</div>
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Kantor KCU Hub</label>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginTop: 2 }}>{selectedOffice.nama_kcu_kc || '-'}</div>
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Kantor Regional</label>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginTop: 2 }}>{selectedOffice.nama_regional || '-'}</div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status Database</label>
                <div style={{ marginTop: 4 }}>
                  <span style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    padding: '2px 8px', 
                    borderRadius: 4, 
                    color: '#34d399', 
                    background: 'rgba(52, 211, 153, 0.1)',
                    border: '1px solid rgba(52, 211, 153, 0.2)'
                  }}>
                    {selectedOffice.status || 'AKTIF'}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              className="btn btn-secondary" 
              onClick={() => setSelectedOffice(null)}
              style={{ width: '100%', marginTop: 20, padding: '8px 0' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <VehicleDetailModal 
          nopol={selectedVehicle} 
          onClose={() => setSelectedVehicle(null)} 
          onViewTransaction={(code) => navigate(`/transaksi?search=${code}`)}
        />
      )}
    </div>
  );
}
