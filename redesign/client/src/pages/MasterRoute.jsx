import { useState, useEffect } from 'react';
import { Plus, GripVertical, X, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { api } from '../utils/api.js';

export default function MasterRoute() {
  const [routes, setRoutes] = useState([
    {
      id: 1,
      routeId: 'RTE-CMH-BDG-001',
      name: 'Cimahi → Bandung SC (Main)',
      origin: 'KPRK Cimahi (40511)',
      destination: 'Bandung Sorting Center (40000)',
      totalDistance: '22 km',
      estDuration: '45 min',
      expanded: true,
      checkpoints: [
        { id: 1, code: '40511', name: 'KPRK Cimahi', order: 1 },
        { id: 2, code: '40514', name: 'KPC Cimahi Selatan', order: 2 },
        { id: 3, code: '40512', name: 'KPC Cimahi Utara', order: 3 },
        { id: 4, code: '40141', name: 'KCU Bandung Barat', order: 4 },
        { id: 5, code: '40000', name: 'Bandung Sorting Center', order: 5 },
      ],
    },
    {
      id: 2,
      routeId: 'RTE-CMH-BDG-002',
      name: 'Cimahi → Bandung SC (Via Padalarang)',
      origin: 'KPRK Cimahi (40511)',
      destination: 'Bandung Sorting Center (40000)',
      totalDistance: '28 km',
      estDuration: '55 min',
      expanded: false,
      checkpoints: [
        { id: 1, code: '40511', name: 'KPRK Cimahi', order: 1 },
        { id: 2, code: '40161', name: 'KPC Padalarang', order: 2 },
        { id: 3, code: '40171', name: 'KPC Ngamprah', order: 3 },
        { id: 4, code: '40000', name: 'Bandung Sorting Center', order: 4 },
      ],
    },
    {
      id: 3,
      routeId: 'RTE-CMH-SRG-001',
      name: 'Cimahi → Soreang Loop',
      origin: 'KPRK Cimahi (40511)',
      destination: 'KPRK Soreang (40211)',
      totalDistance: '34 km',
      estDuration: '70 min',
      expanded: false,
      checkpoints: [
        { id: 1, code: '40511', name: 'KPRK Cimahi', order: 1 },
        { id: 2, code: '40131', name: 'KCU Bandung Selatan', order: 2 },
        { id: 3, code: '40221', name: 'KPC Baleendah', order: 3 },
        { id: 4, code: '40211', name: 'KPRK Soreang', order: 4 },
      ],
    },
  ]);

  const fetchRoutes = async () => {
    try {
      const res = await api.getRoute();
      if (res.success && res.data && res.data.length > 0) {
        setRoutes(res.data.map((r, idx) => ({
          id: r._id || idx + 1,
          routeId: r.kd_route || `RTE-${idx + 1}`,
          name: r.nama_route || 'Rute Logistik',
          origin: r.asal || 'KPRK Cimahi (40511)',
          destination: r.tujuan || 'Bandung Sorting Center (40000)',
          totalDistance: r.jarak || '25 km',
          estDuration: r.estimasi || '45 min',
          expanded: idx === 0,
          checkpoints: r.checkpoints || [
            { id: 1, code: '40511', name: 'KPRK Cimahi', order: 1 },
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          {routes.length} defined routes
        </div>
        <button className="btn-primary" style={{ marginLeft: 'auto' }}>
          <Plus size={15} /> New Route
        </button>
      </div>

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
                background: 'rgba(232,67,31,0.1)',
                border: '1px solid rgba(232,67,31,0.2)',
              }}
            >
              <span className="font-mono" style={{ fontSize: 11, color: '#e8431f', fontWeight: 600 }}>
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
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{route.totalDistance}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Distance</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{route.estDuration}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Est. Time</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#6ba3f0' }}>
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

          {/* Checkpoints node list */}
          {route.expanded && (
            <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {route.checkpoints.map((cp, i) => (
                  <div key={cp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? '#e8431f' : i === route.checkpoints.length - 1 ? '#10b981' : '#2460b0' }} />
                    <span className="font-mono" style={{ fontSize: 11, color: '#6ba3f0', width: 44 }}>{cp.code}</span>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{cp.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
