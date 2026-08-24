import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Database, RefreshCw, Search } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Compass({ activeConnection }) {
  const [selected, setSelected] = useState('transaksi');
  const [viewMode, setViewMode] = useState('json');
  const [filterQ, setFilterQ] = useState('');
  const [collections, setCollections] = useState([
    { name: 'transaksi', count: 922, fields: ['_id', 'connote_code', 'connote_sender_name', 'connote_receiver_name', 'connote_amount', 'connote_service', 'connote_state', 'created_at'] },
    { name: 'master_kantor', count: 13768, fields: ['_id', 'nopend', 'nama_nopend', 'jenis_kantor', 'kabupaten_kota', 'provinsi', 'status'] },
    { name: 'master_kendaraan', count: 5, fields: ['_id', 'nopol', 'nama_kendaraan', 'jenis_kendaraan', 'driver', 'max_capacity_kg', 'status'] },
    { name: 'master_route', count: 3, fields: ['_id', 'route_code', 'nama_route', 'asal', 'tujuan', 'origin_nopen_list', 'destination_prefix_filter'] },
    { name: 'master_produk', count: 6, fields: ['_id', 'kd_produk', 'nama_produk', 'kategori', 'sla', 'status'] },
    { name: 'users', count: 4, fields: ['_id', 'username', 'name', 'role', 'email', 'branch', 'nip'] },
  ]);

  const [data, setData] = useState([]);

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
    <div style={{ display: 'flex', height: '100%', minHeight: 600, overflow: 'hidden', gap: 16 }}>
      {/* Sidebar Collections Tree */}
      <div
        className="spatial-card"
        style={{
          width: 240,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          padding: 0
        }}
      >
        <div className="surface-soft" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800 }}>
            MongoDB Collections
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
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
                borderRadius: 8,
                background: selected === col.name ? 'var(--primary-navy)' : 'transparent',
                marginBottom: 4,
                transition: 'all 0.15s ease'
              }}
            >
              <Database size={14} color={selected === col.name ? '#ffffff' : 'var(--accent-cyan)'} />
              <span style={{ fontSize: 12, color: selected === col.name ? '#ffffff' : 'var(--text-primary)', flex: 1, fontWeight: selected === col.name ? 800 : 500, fontFamily: 'var(--font-mono)' }}>
                {col.name}
              </span>
              <span style={{ fontSize: 10, color: selected === col.name ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {col.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main JSON / Table Data Panel */}
      <div className="spatial-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 20, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, color: 'var(--primary-navy)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
            collection: {selected}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            ({data.length} dokumen dimuat)
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--bg-surface-soft)', borderRadius: 8, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              {['json', 'table'].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{
                    padding: '5px 12px',
                    fontSize: 11,
                    background: viewMode === m ? 'var(--primary-navy)' : 'transparent',
                    border: 'none',
                    color: viewMode === m ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: viewMode === m ? 800 : 500,
                    textTransform: 'uppercase'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            <button className="btn-ghost" onClick={() => fetchCollectionData(selected)} style={{ padding: '6px 10px' }} title="Refresh">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Output container */}
        <div className="surface-soft" style={{ flex: 1, borderRadius: 10, overflow: 'auto', padding: 16 }}>
          {viewMode === 'json' ? (
            <pre style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0, lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', textAlign: 'left' }}>
                  {data[0] && Object.keys(data[0]).map((k) => (
                    <th key={k} style={{ padding: '8px 10px', color: 'var(--text-primary)', fontWeight: 800, borderBottom: '1px solid var(--border-light)' }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {Object.keys(data[0] || {}).map((k) => (
                      <td key={k} style={{ padding: '8px 10px', color: 'var(--text-secondary)', verticalAlign: 'top' }}>
                        {typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k] ?? '')}
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
