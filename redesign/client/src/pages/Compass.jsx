import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Database, RefreshCw, Search } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Compass({ activeConnection }) {
  const [selected, setSelected] = useState('post_offices');
  const [viewMode, setViewMode] = useState('json');
  const [filterQ, setFilterQ] = useState('');
  const [collections, setCollections] = useState([
    { name: 'post_offices', count: 13247, fields: ['_id', 'code', 'name', 'branch_type', 'city', 'province', 'address', 'status', 'created_at'] },
    { name: 'packages', count: 94821, fields: ['_id', 'connote', 'origin_code', 'dest_code', 'service_code', 'weight', 'status', 'manifest_id'] },
    { name: 'manifests', count: 4102, fields: ['_id', 'manifest_id', 'route_id', 'vehicle_id', 'operator_id', 'package_count', 'total_weight', 'status'] },
    { name: 'vehicles', count: 48, fields: ['_id', 'plate_number', 'vehicle_type', 'brand', 'driver_id', 'capacity_kg', 'status'] },
    { name: 'routes', count: 24, fields: ['_id', 'route_id', 'name', 'origin_code', 'dest_code', 'checkpoints', 'distance_km'] },
    { name: 'users', count: 18, fields: ['_id', 'username', 'full_name', 'role', 'branch_code', 'last_login', 'active'] },
  ]);

  const [data, setData] = useState([
    { _id: 'po_40511', code: '40511', name: 'KPRK Cimahi', branch_type: 'KPRK', city: 'Kota Cimahi', province: 'Jawa Barat', address: 'Jl. Amir Mahmud No.553, Cimahi', status: 'active', created_at: '2018-03-14T07:00:00Z' },
    { _id: 'po_40512', code: '40512', name: 'KPC Cimahi Utara', branch_type: 'KCP', city: 'Kota Cimahi', province: 'Jawa Barat', address: 'Jl. Kolonel Masturi No.71, Cimahi', status: 'active', created_at: '2018-03-14T07:00:00Z' },
  ]);

  const fetchCollections = async () => {
    try {
      const res = await api.getCollections();
      if (res.success && res.data) {
        setCollections(res.data.map(c => ({
          name: c.name || c,
          count: c.count || 100,
          fields: ['_id', 'code', 'name', 'status']
        })));
      }
    } catch (e) {
      console.error('Error fetching compass collections:', e);
    }
  };

  const fetchCollectionData = async (colName) => {
    try {
      const res = await api.getCollectionData(colName, { limit: 20 });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Error fetching collection data:', e);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    fetchCollectionData(selected);
  }, [selected]);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', gap: 16 }}>
      {/* Sidebar Collections Tree */}
      <div
        className="glass-card-solid"
        style={{
          width: 220,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Collections
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px' }}>
          {collections.map((col) => (
            <div
              key={col.name}
              onClick={() => setSelected(col.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                cursor: 'pointer',
                borderRadius: 6,
                background: selected === col.name ? 'rgba(232,67,31,0.14)' : 'transparent',
                marginBottom: 2,
              }}
            >
              <Database size={13} color={selected === col.name ? '#e8431f' : 'rgba(255,255,255,0.35)'} />
              <span className="font-mono" style={{ fontSize: 12, color: selected === col.name ? '#e8431f' : 'rgba(255,255,255,0.7)', flex: 1, fontWeight: selected === col.name ? 600 : 400 }}>
                {col.name}
              </span>
              <span className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                {col.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main JSON / Table Data Panel */}
      <div className="glass-card-solid" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 20, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="font-mono" style={{ fontSize: 14, color: '#e8431f', fontWeight: 700 }}>
            {selected}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            ({data.length} documents loaded)
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="input-navy font-mono"
                value={filterQ}
                onChange={(e) => setFilterQ(e.target.value)}
                placeholder="{ filter... }"
                style={{ paddingLeft: 28, fontSize: 12, width: 180 }}
              />
            </div>

            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {['json', 'table'].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className="font-mono"
                  style={{
                    padding: '5px 12px',
                    fontSize: 11,
                    background: viewMode === m ? 'rgba(232,67,31,0.2)' : 'transparent',
                    border: 'none',
                    color: viewMode === m ? '#e8431f' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontWeight: viewMode === m ? 700 : 400,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            <button className="btn-ghost" onClick={() => fetchCollectionData(selected)} style={{ padding: '6px 10px' }}>
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* Output container */}
        <div style={{ flex: 1, background: '#04091a', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', overflow: 'auto', padding: 16 }}>
          {viewMode === 'json' ? (
            <pre className="font-mono" style={{ fontSize: 12, color: '#48cae4', margin: 0, lineHeight: 1.6 }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <table className="data-table font-mono">
              <thead>
                <tr>
                  {data[0] && Object.keys(data[0]).map((k) => <th key={k}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((doc, di) => (
                  <tr key={di}>
                    {Object.values(doc).map((val, vi) => (
                      <td key={vi} style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
