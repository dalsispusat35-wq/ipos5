import { useState, useEffect } from 'react';
import { 
  Plus, X, ChevronDown, ChevronUp, MapPin, Filter, Building2, Tag, 
  Clock, Navigation, Truck, Copy, CheckCircle, Search, Sparkles,
  ArrowRight, ShieldCheck, RefreshCw, Layers, Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';

const DEFAULT_ROUTES = [
  {
    id: 1,
    routeId: 'RTE-1',
    name: 'Rute Feeder Terpadu Cimahi Raya (Cisangkan – Cipageran – Melong) → SPP Bandung',
    origin: 'KPRK Cimahi (40511)',
    destination: 'Bandung Sorting Center (40000)',
    originNopenList: ['40511', '40500', '40512', '40514'],
    destinationPrefixFilter: ['1', '2', '3', '7', '9'],
    totalDistance: '25 km',
    estDuration: '45 min',
    expanded: true,
    checkpoints: [
      { id: 1, code: '40511', name: 'KPRK Cimahi (Hub Asal)', type: 'KCU HUB', order: 1, estTime: '08:00 WIB', distance: '0 km' },
      { id: 2, code: '40512', name: 'KCP Cisangkan Cimahi', type: 'KCP', order: 2, estTime: '08:15 WIB', distance: '6.2 km' },
      { id: 3, code: '40514', name: 'KCP Melong Asih', type: 'KCP', order: 3, estTime: '08:30 WIB', distance: '14.5 km' },
      { id: 4, code: '40000', name: 'SPP Bandung (Sorting Hub Tujuan)', type: 'DC / SPP', order: 4, estTime: '08:45 WIB', distance: '25 km' },
    ],
  },
  {
    id: 2,
    routeId: 'RTE-2',
    name: 'Rute Express Feeder Bandung Pusat – Cibeunying – Ujungberung → SPP Bandung',
    origin: 'KPRK Cimahi (40511)',
    destination: 'Bandung Sorting Center (40000)',
    originNopenList: ['40511', '40100', '40123'],
    destinationPrefixFilter: ['4', '5'],
    totalDistance: '28 km',
    estDuration: '50 min',
    expanded: false,
    checkpoints: [
      { id: 1, code: '40511', name: 'KPRK Cimahi Asal', type: 'KCU HUB', order: 1, estTime: '09:00 WIB', distance: '0 km' },
      { id: 2, code: '40100', name: 'KCU Bandung Pusat', type: 'KCU HUB', order: 2, estTime: '09:20 WIB', distance: '12 km' },
      { id: 3, code: '40123', name: 'KCP Cibeunying', type: 'KCP', order: 3, estTime: '09:35 WIB', distance: '19 km' },
      { id: 4, code: '40000', name: 'SPP Bandung Hub', type: 'DC / SPP', order: 4, estTime: '09:50 WIB', distance: '28 km' },
    ],
  },
  {
    id: 3,
    routeId: 'RTE-3',
    name: 'Rute Feeder Terpadu Cimindi – Margaasih – Cicendo – Dago → SPP Bandung',
    origin: 'KPRK Cimahi (40511)',
    destination: 'Bandung Sorting Center (40000)',
    originNopenList: ['40511', '40535', '40135'],
    destinationPrefixFilter: ['1', '2', '3', '6', '7', '8', '9'],
    totalDistance: '32 km',
    estDuration: '55 min',
    expanded: false,
    checkpoints: [
      { id: 1, code: '40511', name: 'KPRK Cimahi', type: 'KCU HUB', order: 1, estTime: '13:00 WIB', distance: '0 km' },
      { id: 2, code: '40535', name: 'KCP Cimindi Margaasih', type: 'KCP', order: 2, estTime: '13:15 WIB', distance: '7 km' },
      { id: 3, code: '40135', name: 'KCP Dago Atas', type: 'KCP', order: 3, estTime: '13:35 WIB', distance: '21 km' },
      { id: 4, code: '40000', name: 'SPP Bandung (Final Hub)', type: 'DC / SPP', order: 4, estTime: '13:55 WIB', distance: '32 km' },
    ],
  },
];

const PREFIX_EXPLANATIONS = {
  '1': 'Jabodetabek & Banten',
  '2': 'Sumatera Raya',
  '3': 'Jateng & D.I. Yogyakarta',
  '4': 'Jawa Barat Non-Jabodetabek',
  '5': 'Jawa Timur Bagian Barat',
  '6': 'Jawa Timur Bagian Timur',
  '7': 'Kalimantan Raya',
  '8': 'Bali & Nusa Tenggara',
  '9': 'Sulawesi, Maluku, Papua',
};

export default function MasterRoute() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState(DEFAULT_ROUTES);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    routeId: '',
    name: '',
    origin: 'KPRK Cimahi (40511)',
    destination: 'Bandung Sorting Center (40000)',
    originNopenList: '40511, 40500, 40512',
    destinationPrefixFilter: '1, 2, 3, 7, 9',
    totalDistance: '25 km',
    estDuration: '45 min'
  });

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await api.getRoute();
      if (res.success && res.data && res.data.length > 0) {
        setRoutes(res.data.map((r, idx) => {
          const originList = r.origin_nopen_list || r.daftar_nopend_asal || ['40511', '40500'];
          const prefixList = r.destination_prefix_filter || ['1', '2', '3', '7', '9'];
          
          let cps = r.checkpoints;
          if (!cps || cps.length === 0) {
            cps = [
              { id: 1, code: originList[0] || '40511', name: r.asal || r.origin || 'KPRK Cimahi (Hub Asal)', type: 'KCU HUB', order: 1, estTime: '08:00 WIB', distance: '0 km' },
              { id: 2, code: originList[1] || '40500', name: 'KCU Cimahi Gateway Hub', type: 'KCU HUB', order: 2, estTime: '08:20 WIB', distance: '8.5 km' },
              { id: 3, code: '40000', name: r.tujuan || r.destination || 'Bandung Sorting Center (40000)', type: 'DC / SPP', order: 3, estTime: '08:45 WIB', distance: r.jarak || '25 km' },
            ];
          }

          return {
            id: r._id || idx + 1,
            routeId: r.route_code || r.kd_route || `RTE-${idx + 1}`,
            name: r.nama_route || r.route_name || 'Rute Feeder Logistik',
            origin: r.asal || r.origin || 'KPRK Cimahi (40511)',
            destination: r.tujuan || r.destination || 'Bandung Sorting Center (40000)',
            originNopenList: originList,
            destinationPrefixFilter: prefixList,
            totalDistance: r.jarak || r.distance_km ? `${r.distance_km} km` : '25 km',
            estDuration: r.estimasi || r.est_time_min ? `${r.est_time_min} min` : '45 min',
            expanded: idx === 0,
            checkpoints: cps
          };
        }));
      }
    } catch (err) {
      console.error('Error fetching route data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const toggleExpand = (id) => {
    setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, expanded: !r.expanded } : r)));
  };

  const handleCopyConfig = (route) => {
    const text = `MASTER RUTE: ${route.routeId} - ${route.name}\nAsal: ${route.origin} → Tujuan: ${route.destination}\nJarak: ${route.totalDistance} | Est: ${route.estDuration}\nNopend Asal: ${route.originNopenList.join(', ')}\nPrefix Tujuan: ${route.destinationPrefixFilter.join(', ')}\n\nCheckpoints:\n${route.checkpoints.map(c => `${c.order}. [${c.code}] ${c.name} (${c.type})`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(route.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateRoute = async () => {
    if (!form.routeId || !form.name) return;
    const originList = form.originNopenList.split(',').map(s => s.trim()).filter(Boolean);
    const prefixList = form.destinationPrefixFilter.split(',').map(s => s.trim()).filter(Boolean);

    try {
      if (api.createRoute) {
        await api.createRoute({
          kd_route: form.routeId,
          route_code: form.routeId,
          nama_route: form.name,
          route_name: form.name,
          asal: form.origin,
          origin: form.origin,
          tujuan: form.destination,
          destination: form.destination,
          origin_nopen_list: originList,
          destination_prefix_filter: prefixList,
          jarak: form.totalDistance,
          estimasi: form.estDuration,
          aktif: 'Y'
        }).catch(() => null);
      }

      setRoutes((prev) => [
        {
          id: Date.now(),
          routeId: form.routeId,
          name: form.name,
          origin: form.origin,
          destination: form.destination,
          originNopenList: originList,
          destinationPrefixFilter: prefixList,
          totalDistance: form.totalDistance,
          estDuration: form.estDuration,
          expanded: true,
          checkpoints: [
            { id: 1, code: originList[0] || '40511', name: form.origin || 'KPRK Cimahi', type: 'KCU HUB', order: 1, estTime: '08:00 WIB', distance: '0 km' },
            { id: 2, code: '40000', name: form.destination || 'SPP Bandung Hub', type: 'DC / SPP', order: 2, estTime: '08:45 WIB', distance: form.totalDistance }
          ]
        },
        ...prev,
      ]);
      setForm({ routeId: '', name: '', origin: 'KPRK Cimahi (40511)', destination: 'Bandung Sorting Center (40000)', originNopenList: '40511, 40500', destinationPrefixFilter: '1, 2, 3, 7, 9', totalDistance: '25 km', estDuration: '45 min' });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create route:', err);
    }
  };

  const filteredRoutes = routes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.routeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.originNopenList?.some(n => n.includes(searchTerm))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Top Banner Header */}
      <div className="spatial-card" style={{ padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ background: 'var(--accent-cyan-bg)', border: '1px solid var(--border-light)', padding: 8, borderRadius: 10, display: 'flex' }}>
              <Navigation size={22} color="var(--primary-blue)" />
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
              Master Konfigurasi Rute Logistik
            </h1>
            <span className="badge badge-emerald" style={{ fontSize: 11, padding: '3px 8px' }}>
              ● {routes.length} Master Rute Aktif
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Matriks filter Nopend Asal (Origin List) dan Prefix Wilayah Tujuan untuk kalkulasi muatan &amp; optimasi kapasitas armada (Milk Run).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={fetchRoutes} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn-primary" style={{ gap: 6, fontSize: 13 }} onClick={() => setShowForm(true)}>
            <Plus size={16} /> Tambah Konfigurasi Rute
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 450 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Cari kode rute (RTE-1), nama rute, atau nopend..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 34, height: 38, fontSize: 12.5, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Main Container */}
      <div className={showForm ? 'responsive-split' : ''} style={{ display: showForm ? undefined : 'block', gap: 20 }}>
        {/* Route Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredRoutes.map((route) => (
            <div 
              key={route.id} 
              className="spatial-card" 
              style={{ 
                overflow: 'hidden', 
                padding: 0,
                border: route.expanded ? '1px solid rgba(2, 132, 199, 0.35)' : '1px solid var(--border-light)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Card Header (Clickable for Expand/Collapse) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 22px',
                  cursor: 'pointer',
                  background: route.expanded ? 'var(--bg-surface-soft)' : 'transparent',
                  transition: 'background 0.2s'
                }}
                onClick={() => toggleExpand(route.id)}
              >
                {/* Route Code Badge */}
                <div
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'var(--accent-cyan-bg)',
                    border: '1px solid rgba(2, 132, 199, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--primary-blue)', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    {route.routeId}
                  </span>
                </div>

                {/* Route Titles & Corridor */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {route.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{route.origin}</span>
                    <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{route.destination}</span>
                  </div>
                </div>

                {/* Metric Summary Badges */}
                <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--text-primary)' }}>{route.totalDistance}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Jarak</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--text-primary)' }}>{route.estDuration}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Est. Waktu</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 50 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--accent-cyan)' }}>
                      {route.checkpoints?.length || 2}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Stops</div>
                  </div>

                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {route.expanded ? (
                      <ChevronUp size={16} color="var(--primary-blue)" />
                    ) : (
                      <ChevronDown size={16} color="var(--text-muted)" />
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Expanded Body */}
              {route.expanded && (
                <div style={{ padding: '20px 22px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--bg-card)' }}>
                  
                  {/* Capacity Calculation Filter Matrix */}
                  <div 
                    className="surface-soft" 
                    style={{ 
                      padding: '14px 16px', 
                      borderRadius: 10, 
                      background: 'var(--accent-cyan-bg)', 
                      border: '1px solid rgba(2, 132, 199, 0.25)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 10 
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Filter size={14} /> Filter Kalkulasi Muatan Terkonfigurasi:
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, fontSize: 12 }}>
                      {/* Origin List */}
                      <div>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, fontSize: 11 }}>
                          Nopend Asal (Origin List Terintegrasi):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {route.originNopenList && route.originNopenList.map(n => (
                            <span 
                              key={n} 
                              className="badge badge-navy" 
                              style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', padding: '3px 8px', fontWeight: 800 }}
                            >
                              <Building2 size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} /> {n}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Prefix Digits */}
                      <div>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, fontSize: 11 }}>
                          Prefix Wilayah Tujuan (Target Routing):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {route.destinationPrefixFilter && route.destinationPrefixFilter.map(p => (
                            <span 
                              key={p} 
                              className="badge badge-emerald" 
                              style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', padding: '3px 8px', fontWeight: 800 }}
                              title={PREFIX_EXPLANATIONS[p] || 'Prefix Wilayah'}
                            >
                              <Tag size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} /> DIGIT `{p}` {PREFIX_EXPLANATIONS[p] ? `(${PREFIX_EXPLANATIONS[p]})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connected Waypoint Timeline Stepper */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Compass size={14} color="var(--primary-blue)" />
                      Urutan Titik Singgah &amp; Milestone Perjalanan ({route.checkpoints?.length || 0} Titik):
                    </div>

                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 12 }}>
                      {/* Vertical connecting background line */}
                      <div 
                        style={{
                          position: 'absolute',
                          left: 23,
                          top: 14,
                          bottom: 14,
                          width: 2,
                          background: 'linear-gradient(to bottom, var(--primary-blue), var(--accent-cyan), var(--accent-emerald))',
                          zIndex: 1
                        }}
                      />

                      {route.checkpoints.map((cp, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === route.checkpoints.length - 1;
                        const nodeBg = isFirst ? 'var(--primary-blue)' : isLast ? 'var(--accent-emerald)' : 'var(--accent-cyan)';

                        return (
                          <div 
                            key={cp.id || idx} 
                            className="surface-soft"
                            style={{ 
                              position: 'relative', 
                              zIndex: 2, 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 14, 
                              padding: '10px 14px', 
                              borderRadius: 8,
                              border: isFirst || isLast ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid var(--border-light)'
                            }}
                          >
                            {/* Sequence Circle Node */}
                            <div 
                              style={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                background: nodeBg, 
                                color: '#ffffff', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: 11, 
                                fontWeight: 900,
                                flexShrink: 0,
                                boxShadow: '0 0 8px rgba(0,0,0,0.2)'
                              }}
                            >
                              {cp.order || idx + 1}
                            </div>

                            {/* Station Details */}
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: 'var(--primary-blue)', fontFamily: 'var(--font-mono)', fontWeight: 800, background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-light)' }}>
                                {cp.code}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', minWidth: 160 }}>
                                {cp.name}
                              </span>
                              {cp.type && (
                                <span className="badge badge-navy" style={{ fontSize: 10, padding: '2px 6px' }}>
                                  {cp.type}
                                </span>
                              )}
                            </div>

                            {/* Distance & ETA */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                              {cp.distance && (
                                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                  {cp.distance}
                                </span>
                              )}
                              {cp.estTime && (
                                <span style={{ fontSize: 11.5, color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Clock size={11} /> {cp.estTime}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Route Action Toolbar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
                    <button
                      onClick={() => handleCopyConfig(route)}
                      className="btn-ghost"
                      style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px' }}
                      title="Salin rincian konfigurasi rute"
                    >
                      {copiedId === route.id ? <CheckCircle size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                      {copiedId === route.id ? 'Tersalin' : 'Salin Konfigurasi'}
                    </button>
                    <button
                      onClick={() => navigate(`/checker?code=B+9910+PCX`)}
                      className="btn-primary"
                      style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px' }}
                    >
                      <Truck size={13} /> Buka di Simulator / Checker
                    </button>
                  </div>

                </div>
              )}
            </div>
          ))}

          {filteredRoutes.length === 0 && (
            <div className="spatial-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada rute yang cocok dengan pencarian &quot;{searchTerm}&quot;.
            </div>
          )}
        </div>

        {/* Add/Edit Route Form Drawer/Panel */}
        {showForm && (
          <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, height: 'fit-content', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} color="var(--primary-blue)" /> Konfigurasi Rute Baru
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="capsule-btn-circle"
                style={{ width: 28, height: 28 }}
              >
                <X size={14} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Kode Rute (ID)</label>
              <input
                placeholder="misal: RTE-4 / RT-FEEDER-04"
                value={form.routeId}
                onChange={(e) => setForm((prev) => ({ ...prev, routeId: e.target.value }))}
                style={{ width: '100%', height: 38, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Nama Rute Lengkap</label>
              <input
                placeholder="misal: Rute Feeder Padalarang - Batujajar -> SPP Bandung"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                style={{ width: '100%', height: 38, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Jarak Total</label>
                <input
                  placeholder="25 km"
                  value={form.totalDistance}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalDistance: e.target.value }))}
                  style={{ width: '100%', height: 38, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Estimasi Waktu</label>
                <input
                  placeholder="45 min"
                  value={form.estDuration}
                  onChange={(e) => setForm((prev) => ({ ...prev, estDuration: e.target.value }))}
                  style={{ width: '100%', height: 38, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div className="surface-soft" style={{ background: 'var(--accent-cyan-bg)', padding: 14, borderRadius: 8, border: '1px solid rgba(2, 132, 199, 0.3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary-blue)' }}>Filter Kalkulasi Kapasitas</div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Daftar Nopend Asal (Pisahkan koma)
                </label>
                <input
                  placeholder="misal: 40511, 40500, 40512"
                  value={form.originNopenList}
                  onChange={(e) => setForm((prev) => ({ ...prev, originNopenList: e.target.value }))}
                  style={{ width: '100%', height: 36, fontSize: 12, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Prefix Digit Tujuan (Pisahkan koma)
                </label>
                <input
                  placeholder="misal: 1, 2, 3, 7, 9"
                  value={form.destinationPrefixFilter}
                  onChange={(e) => setForm((prev) => ({ ...prev, destinationPrefixFilter: e.target.value }))}
                  style={{ width: '100%', height: 36, fontSize: 12, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button className="btn-primary" onClick={handleCreateRoute} style={{ width: '100%', justifyContent: 'center', marginTop: 6, height: 40 }}>
              Simpan Konfigurasi Rute
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
