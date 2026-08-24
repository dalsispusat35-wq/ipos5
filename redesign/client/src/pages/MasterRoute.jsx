import { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp, MapPin, Filter, Building2, Tag } from 'lucide-react';
import { api } from '../utils/api.js';

export default function MasterRoute() {
  const [routes, setRoutes] = useState([
    {
      id: 1,
      routeId: 'RTE-6',
      name: 'SPP Bandung to SPP Jakarta Timur (Rute 6)',
      origin: 'SPP Bandung (40000)',
      destination: 'SPP Jakarta Timur (10000)',
      originNopenList: ['40000', '40500', '40253A', '40100', '40395C1'],
      destinationPrefixFilter: ['1', '2', '3', '7', '9'],
      totalDistance: '150 km',
      estDuration: '180 min',
      expanded: true,
      checkpoints: [
        { id: 1, code: '40000', name: 'SPP Bandung Hub Asal', order: 1 },
        { id: 2, code: '40500', name: 'KCU Cimahi Gateway', order: 2 },
        { id: 3, code: '40253A', name: 'KCP Bandung Cigereleng', order: 3 },
        { id: 4, code: '10000', name: 'SPP Jakarta Timur Hub Tujuan', order: 4 },
      ],
    },
    {
      id: 2,
      routeId: 'RTE-1',
      name: 'Cimahi → Bandung SC (Main Corridor)',
      origin: 'KPRK Cimahi (40511)',
      destination: 'Bandung Sorting Center (40000)',
      originNopenList: ['40511', '40514', '40512'],
      destinationPrefixFilter: ['4'],
      totalDistance: '22 km',
      estDuration: '45 min',
      expanded: false,
      checkpoints: [
        { id: 1, code: '40511', name: 'KPRK Cimahi Asal', order: 1 },
        { id: 2, code: '40514', name: 'KPC Cimahi Selatan', order: 2 },
        { id: 3, code: '40000', name: 'Bandung Sorting Center', order: 3 },
      ],
    },
    {
      id: 3,
      routeId: 'RT-MALAM-B9910-PCX',
      name: 'Pick Up Night AGP (Cicalengka - Cileunyi)',
      origin: 'SPP Bandung (40000)',
      destination: 'SPP Bandung Sorting Hub',
      originNopenList: ['40395C1', '40395U1', '40381U2', '40382U1', '40382B2', '40393U3', '40393S8'],
      destinationPrefixFilter: ['4'],
      totalDistance: '42 km',
      estDuration: '120 min',
      expanded: false,
      checkpoints: [
        { id: 1, code: '40395C1', name: 'AGP Arvinet', order: 1 },
        { id: 2, code: '40395U1', name: 'AGP Cicalengka', order: 2 },
        { id: 3, code: '40381U2', name: 'AGP Ciparay', order: 3 },
        { id: 4, code: '40382U1', name: 'AGP Majalaya', order: 4 },
        { id: 5, code: '40000', name: 'SPP Bandung (Final Hub)', order: 5 },
      ],
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    routeId: '',
    name: '',
    origin: '',
    destination: '',
    originNopenList: '40000, 40500, 40253A',
    destinationPrefixFilter: '1, 2, 3, 7, 9',
    totalDistance: '25 km',
    estDuration: '45 min'
  });

  const fetchRoutes = async () => {
    try {
      const res = await api.getRoute();
      if (res.success && res.data && res.data.length > 0) {
        setRoutes(res.data.map((r, idx) => ({
          id: r._id || idx + 1,
          routeId: r.route_code || r.kd_route || `RTE-${idx + 1}`,
          name: r.nama_route || r.route_name || 'Rute Logistik',
          origin: r.asal || r.origin || 'KPRK Cimahi (40511)',
          destination: r.tujuan || r.destination || 'Bandung Sorting Center (40000)',
          originNopenList: r.origin_nopen_list || r.daftar_nopend_asal || ['40000', '40500'],
          destinationPrefixFilter: r.destination_prefix_filter || ['1', '2', '3', '7', '9'],
          totalDistance: r.jarak || r.distance_km ? `${r.distance_km} km` : '25 km',
          estDuration: r.estimasi || r.est_time_min ? `${r.est_time_min} min` : '45 min',
          expanded: idx === 0,
          checkpoints: r.checkpoints || [
            { id: 1, code: '40511', name: 'KPRK Cimahi Asal', order: 1 },
            { id: 2, code: '40000', name: 'Bandung Sorting Center', order: 2 },
          ]
        })));
      }
    } catch (err) {
      console.error('Error fetching route data:', err);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const toggleExpand = (id) => {
    setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, expanded: !r.expanded } : r)));
  };

  const handleCreateRoute = async () => {
    if (!form.routeId || !form.name) return;
    const originList = form.originNopenList.split(',').map(s => s.trim()).filter(Boolean);
    const prefixList = form.destinationPrefixFilter.split(',').map(s => s.trim()).filter(Boolean);

    try {
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

      setRoutes((prev) => [
        ...prev,
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
            { id: 1, code: originList[0] || '40000', name: form.origin || 'Asal', order: 1 },
            { id: 2, code: '10000', name: form.destination || 'Tujuan', order: 2 }
          ]
        }
      ]);
      setForm({ routeId: '', name: '', origin: '', destination: '', originNopenList: '40000, 40500', destinationPrefixFilter: '1, 2, 3, 7, 9', totalDistance: '25 km', estDuration: '45 min' });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create route:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
          {routes.length} Master Rute Logistik Aktif (Filter Nopend Asal & Prefix Wilayah Tujuan Terintegrasi)
        </div>
        <button className="btn-primary" style={{ gap: 6 }} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Tambah Konfigurasi Rute
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 360px' : '1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {routes.map((route) => (
            <div key={route.id} className="spatial-card" style={{ overflow: 'hidden', padding: 0 }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 18px',
                  cursor: 'pointer',
                }}
                onClick={() => toggleExpand(route.id)}
              >
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#e0f2fe',
                    border: '1px solid #bae6fd',
                  }}
                >
                  <span style={{ fontSize: 11.5, color: '#0b2e8a', fontWeight: 800, fontFamily: 'monospace' }}>
                    {route.routeId}
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>
                    {route.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{route.origin}</span>
                    <span style={{ color: '#cbd5e1' }}>→</span>
                    <span>{route.destination}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{route.totalDistance}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Jarak</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{route.estDuration}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Est. Waktu</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0284c7' }}>
                      {route.checkpoints.length}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Stops</div>
                  </div>

                  {route.expanded ? (
                    <ChevronUp size={16} color="#64748b" />
                  ) : (
                    <ChevronDown size={16} color="#64748b" />
                  )}
                </div>
              </div>

              {/* Filter rules & checkpoints node list */}
              {route.expanded && (
                <div style={{ padding: '16px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 14, background: '#f8fafc' }}>
                  {/* Capacity Filter Configuration Bar */}
                  <div className="surface-soft" style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--accent-cyan-bg)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Filter size={13} /> Filter Kalkulasi Muatan Terkonfigurasi:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', marginRight: 6 }}>Nopend Asal (Origin List):</span>
                        {route.originNopenList && route.originNopenList.map(n => (
                          <span key={n} className="badge badge-navy" style={{ marginRight: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                            {n}
                          </span>
                        ))}
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', marginRight: 6 }}>Prefix Wilayah Tujuan:</span>
                        {route.destinationPrefixFilter && route.destinationPrefixFilter.map(p => (
                          <span key={p} className="badge badge-emerald" style={{ marginRight: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                            Digit `{p}`
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Waypoints */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {route.checkpoints.map((cp, i) => (
                      <div key={cp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? 'var(--primary-navy)' : i === route.checkpoints.length - 1 ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }} />
                        <span style={{ fontSize: 11, color: 'var(--primary-navy)', width: 50, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{cp.code}</span>
                        <span style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 600 }}>{cp.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add/Edit Route Form */}
        {showForm && (
          <div className="surface-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Konfigurasi Rute Baru</div>
              <button
                onClick={() => setShowForm(false)}
                className="capsule-btn-circle"
                style={{ width: 28, height: 28 }}
              >
                <X size={14} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Kode Rute (ID)</label>
              <input
                placeholder="misal: RTE-6 / RTE-7"
                value={form.routeId}
                onChange={(e) => setForm((prev) => ({ ...prev, routeId: e.target.value }))}
                style={{ width: '100%', height: 38 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Nama Rute</label>
              <input
                placeholder="misal: SPP Bandung ke SPP Jakarta"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                style={{ width: '100%', height: 38 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Nama Hub Asal</label>
              <input
                placeholder="misal: SPP Bandung (40000)"
                value={form.origin}
                onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
                style={{ width: '100%', height: 38 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Nama Hub Tujuan</label>
              <input
                placeholder="misal: SPP Jakarta Timur (10000)"
                value={form.destination}
                onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
                style={{ width: '100%', height: 38 }}
              />
            </div>

            <div className="surface-soft" style={{ background: 'var(--accent-cyan-bg)', padding: 12, borderRadius: 8, border: '1px solid rgba(2, 132, 199, 0.3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--accent-cyan)' }}>Filter Kalkulasi Kapasitas</div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Daftar Nopend Asal (Pisahkan koma)
                </label>
                <input
                  placeholder="misal: 40000, 40500, 40253A"
                  value={form.originNopenList}
                  onChange={(e) => setForm((prev) => ({ ...prev, originNopenList: e.target.value }))}
                  style={{ width: '100%', height: 36, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Prefix Digit Tujuan (Pisahkan koma)
                </label>
                <input
                  placeholder="misal: 1, 2, 3, 7, 9"
                  value={form.destinationPrefixFilter}
                  onChange={(e) => setForm((prev) => ({ ...prev, destinationPrefixFilter: e.target.value }))}
                  style={{ width: '100%', height: 36, fontSize: 12 }}
                />
              </div>
            </div>

            <button className="btn-primary" onClick={handleCreateRoute} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              Simpan Konfigurasi Rute
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
