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
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          {routes.length} Active Logistics Routes (Filter Nopend Asal & Prefix Wilayah Tujuan Enabled)
        </div>
        <button className="btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowForm(true)}>
          <Plus size={15} /> New Route Configuration
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 360px' : '1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {routes.map((route) => (
            <div key={route.id} className="glass-card-solid" style={{ overflow: 'hidden' }}>
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
                    background: 'rgba(232,67,31,0.12)',
                    border: '1px solid rgba(232,67,31,0.25)',
                  }}
                >
                  <span className="font-mono" style={{ fontSize: 11.5, color: '#e8431f', fontWeight: 800 }}>
                    {route.routeId}
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                    {route.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{route.origin}</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
                    <span>{route.destination}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{route.totalDistance}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Distance</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{route.estDuration}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Est. Time</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>
                      {route.checkpoints.length}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Stops</div>
                  </div>

                  {route.expanded ? (
                    <ChevronUp size={16} color="rgba(255,255,255,0.4)" />
                  ) : (
                    <ChevronDown size={16} color="rgba(255,255,255,0.4)" />
                  )}
                </div>
              </div>

              {/* Filter rules & checkpoints node list */}
              {route.expanded && (
                <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(6,13,31,0.5)' }}>
                  {/* Capacity Filter Configuration Bar */}
                  <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Filter size={13} /> Configured Filters for Load Capacity Calculation:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.45)', marginRight: 6 }}>Nopend Asal (Origin List):</span>
                        {route.originNopenList && route.originNopenList.map(n => (
                          <span key={n} className="font-mono" style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, marginRight: 4, fontSize: 11, color: '#fff' }}>
                            {n}
                          </span>
                        ))}
                      </div>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.45)', marginRight: 6 }}>Filter Prefix Wilayah Tujuan:</span>
                        {route.destinationPrefixFilter && route.destinationPrefixFilter.map(p => (
                          <span key={p} className="font-mono" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', padding: '2px 6px', borderRadius: 4, marginRight: 4, fontSize: 11, fontWeight: 700 }}>
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
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? '#e8431f' : i === route.checkpoints.length - 1 ? '#10b981' : '#38bdf8' }} />
                        <span className="font-mono" style={{ fontSize: 11, color: '#38bdf8', width: 50 }}>{cp.code}</span>
                        <span style={{ fontSize: 12.5, color: '#fff', fontWeight: 500 }}>{cp.name}</span>
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
          <div className="glass-card-solid" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>New Route Filter Config</div>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Route Code (ID)</label>
              <input
                className="input-navy"
                placeholder="e.g. RTE-6 / RTE-7"
                value={form.routeId}
                onChange={(e) => setForm((prev) => ({ ...prev, routeId: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Route Name</label>
              <input
                className="input-navy"
                placeholder="e.g. SPP Bandung to SPP Jakarta"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Origin Hub Name</label>
              <input
                className="input-navy"
                placeholder="e.g. SPP Bandung (40000)"
                value={form.origin}
                onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Destination Hub Name</label>
              <input
                className="input-navy"
                placeholder="e.g. SPP Jakarta Timur (10000)"
                value={form.destination}
                onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
              />
            </div>

            <div style={{ background: 'rgba(56,189,248,0.04)', padding: 12, borderRadius: 8, border: '1px solid rgba(56,189,248,0.15)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#38bdf8' }}>Capacity Calculation Filters (Editable)</div>

              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>
                  Daftar Nopend Asal (Comma-separated)
                </label>
                <input
                  className="input-navy"
                  placeholder="e.g. 40000, 40500, 40253A"
                  value={form.originNopenList}
                  onChange={(e) => setForm((prev) => ({ ...prev, originNopenList: e.target.value }))}
                  style={{ fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>
                  Prefix Digit Wilayah Tujuan (Comma-separated)
                </label>
                <input
                  className="input-navy"
                  placeholder="e.g. 1, 2, 3, 7, 9"
                  value={form.destinationPrefixFilter}
                  onChange={(e) => setForm((prev) => ({ ...prev, destinationPrefixFilter: e.target.value }))}
                  style={{ fontSize: 12 }}
                />
              </div>
            </div>

            <button className="btn-primary" onClick={handleCreateRoute} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              Save Route Configuration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
