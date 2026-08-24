import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, RefreshCw, Truck, Copy, Search, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { api } from '../utils/api.js';
import VehicleDetailModal from '../components/VehicleDetailModal.jsx';

// Helper to determine office type badge
const getOfficeType = (office) => {
  const name = (office.nama_nopend || '').toUpperCase();
  if (name.includes('KCU') || name.startsWith('KCU ')) return { label: 'KCU HUB', color: '#be123c', bg: '#ffe4e6' };
  if (name.includes('KCP') || name.startsWith('KCP ')) return { label: 'KCP', color: '#6d28d9', bg: '#f5f3ff' };
  if (name.includes('DC') || name.includes('SPP')) return { label: 'DC / SPP', color: '#c2410c', bg: '#ffedd5' };
  if (name.includes('AGEN') || name.startsWith('AGEN ')) return { label: 'AGEN', color: '#0369a1', bg: '#e0f2fe' };
  return { label: 'LAINNYA', color: '#475569', bg: '#f1f5f9' };
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
    <section className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Group */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a', fontWeight: 800 }}>{group.name}</h3>
          <span style={{ color: '#64748b', fontSize: 12 }}>
            {group.stops.length} Valid stops · {group.skipped?.length || 0} Skipped
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-navy" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px' }}>
            <Clock size={12} /> Berangkat: {group.startTime} → Tiba: {group.endTime}
          </span>
          <button 
            className="btn-ghost" 
            onClick={handleCopy} 
            style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            title="Salin rute ke clipboard"
          >
            {copied ? <CheckCircle size={12} color="#16a34a" /> : <Copy size={12} />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>

      {/* Search Input inside Group */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input 
          type="text" 
          placeholder="Cari titik rute..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '8px 12px 8px 32px', 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: 6, 
            color: '#0f172a',
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box'
          }} 
        />
      </div>

      {/* Timeline List of Valid Stops */}
      <div style={{ position: 'relative', display: 'grid', gap: 10, paddingLeft: 8 }}>
        {filteredStops.map((office, index) => {
          const type = getOfficeType(office);
          return (
            <div 
              key={office._id || office.nopend} 
              style={{ 
                display: 'flex', 
                gap: 14, 
                padding: '12px 14px', 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                position: 'relative',
                zIndex: 2,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
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
                background: '#ffffff', 
                border: `2px solid ${type.color}`, 
                color: type.color, 
                fontWeight: '800', 
                fontSize: 11,
                flexShrink: 0
              }}>
                {index + 1}
              </div>
              
              {/* Stop Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ color: '#0f172a', fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {office.nama_nopend}
                  </strong>
                  <span style={{ 
                    fontSize: 9.5, 
                    fontWeight: 700, 
                    padding: '2px 6px', 
                    borderRadius: 4, 
                    color: type.color, 
                    background: type.bg 
                  }}>
                    {type.label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#64748b', fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={11} color="#0284c7" /> {office.nopend}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#0b2e8a', fontWeight: 700, fontFamily: 'monospace' }}>
                    <Clock size={11} /> Tiba: {office.estimatedTime}
                  </span>
                  {office.nama_kcu_kc && (
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      Hub: {office.nama_kcu_kc.replace(/\bKCU\b|\bKC\b/gi, '').trim()}
                    </span>
                  )}
                </div>
              </div>
              
              <Info size={14} style={{ color: '#94a3b8', alignSelf: 'center' }} />
            </div>
          );
        })}

        {filteredStops.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13 }}>
            {search ? 'Tidak ada rute yang cocok.' : 'Semua kandidat di-skip.'}
          </div>
        )}
      </div>

      {/* Skipped Candidates Panel */}
      {group.skipped && group.skipped.length > 0 && (
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
          <button 
            onClick={() => setShowSkipped(!showSkipped)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#ef4444', 
              fontSize: 11.5, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              padding: 0,
              fontWeight: 700
            }}
          >
            <AlertTriangle size={13} />
            {showSkipped ? 'Sembunyikan' : 'Tampilkan'} {group.skipped.length} Kantor di-skip
          </button>
          
          {showSkipped && (
            <div style={{ display: 'grid', gap: 6, marginTop: 10, background: '#fef2f2', padding: 12, borderRadius: 6, border: '1px solid #fecaca' }}>
              {group.skipped.map((skip, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                  <span style={{ color: '#b91c1c', fontWeight: 600 }}>{skip.candidate}</span>
                  <span style={{ color: '#64748b' }}>{skip.reason}</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={22} color="#0284c7" />
            Jadwal Pickup SPP Bandung
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Rute malam tervalidasi terhadap database master_kantor</p>
        </div>
        <button className="btn-ghost" onClick={load} disabled={loading} style={{ gap: 6 }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Blueprint Info Banner */}
      <div style={{ padding: '12px 16px', borderRadius: 8, fontSize: 13, background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}>
        Rute didasarkan pada <strong>PPT Slide 2 (Blueprint Urutan)</strong>. 
        Kandidat yang tidak terdaftar di <strong>master_kantor</strong> disaring otomatis demi akurasi operasional.
      </div>

      {error && (
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="spatial-card" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom: 12, color: '#0284c7' }} />
          <div>Sinkronisasi data master kantor pos...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {routes.map(route => (
            <article key={route.vehicle} className="spatial-card" style={{ padding: '20px 24px', borderLeft: '4px solid #0284c7' }}>
              {/* Vehicle Title Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={18} color="#0284c7" />
                  <button 
                    onClick={() => setSelectedVehicle(route.vehicle)}
                    style={{ background: 'none', border: 'none', color: '#0b2e8a', fontWeight: 900, fontSize: '18px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    title="Klik untuk detail kendaraan"
                  >
                    {route.vehicle}
                  </button>
                </h2>
                <span className="badge badge-navy">{route.category}</span>
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
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 420, width: '95%', padding: 24, background: '#ffffff', color: '#0f172a', position: 'relative' }}>
            <button 
              onClick={() => setSelectedOffice(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={18} />
            </button>
            
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#0f172a', fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              Detail Kantor Pos
            </h3>
            
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Nama Kantor</label>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{selectedOffice.nama_nopend}</div>
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Nopend / Kode Pos</label>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0b2e8a', marginTop: 2, fontFamily: 'monospace' }}>{selectedOffice.nopend}</div>
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Kantor KCU Hub</label>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{selectedOffice.nama_kcu_kc || '-'}</div>
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Kantor Regional</label>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{selectedOffice.nama_regional || '-'}</div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Status Database</label>
                <div style={{ marginTop: 4 }}>
                  <span className="badge badge-emerald">
                    {selectedOffice.status || 'AKTIF'}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              className="btn-primary" 
              onClick={() => setSelectedOffice(null)}
              style={{ width: '100%', marginTop: 20, padding: '8px 0', justifyContent: 'center' }}
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
