import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Building2, Filter, Download } from 'lucide-react';
import { api } from '../utils/api.js';

export default function MasterKantor() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(13247);

  const PAGE_SIZE = 12;

  const fetchKantor = async () => {
    try {
      setLoading(true);
      const res = await api.getKantor({ search, page, limit: PAGE_SIZE });
      if (res.success && res.data) {
        setOffices(res.data);
        if (res.total) setTotalCount(res.total);
      }
    } catch (err) {
      console.error('Error fetching master kantor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKantor();
  }, [search, page]);

  const fallbackData = [
    { nopend: '40511', nama_nopend: 'KPRK Cimahi', tipe: 'KPRK', kota: 'Kota Cimahi', status: 'AKTIF' },
    { nopend: '40512', nama_nopend: 'KPC Cimahi Utara', tipe: 'KCP', kota: 'Kota Cimahi', status: 'AKTIF' },
    { nopend: '40513', nama_nopend: 'KPC Cimahi Tengah', tipe: 'KCP', kota: 'Kota Cimahi', status: 'AKTIF' },
    { nopend: '40514', nama_nopend: 'KPC Cimahi Selatan', tipe: 'KCP', kota: 'Kota Cimahi', status: 'AKTIF' },
    { nopend: '40000', nama_nopend: 'KCU Bandung Raya', tipe: 'KCU', kota: 'Kota Bandung', status: 'AKTIF' },
    { nopend: '40111', nama_nopend: 'KPRK Bandung', tipe: 'KPRK', kota: 'Kota Bandung', status: 'AKTIF' },
    { nopend: '40112', nama_nopend: 'KPC Antapani', tipe: 'KCP', kota: 'Kota Bandung', status: 'AKTIF' },
    { nopend: '40113', nama_nopend: 'KPC Cicadas', tipe: 'KCP', kota: 'Kota Bandung', status: 'AKTIF' },
    { nopend: '40114', nama_nopend: 'KPC Cibeunying', tipe: 'KCP', kota: 'Kota Bandung', status: 'AKTIF' },
    { nopend: '40121', nama_nopend: 'KCU Bandung Utara', tipe: 'KCU', kota: 'Kota Bandung', status: 'AKTIF' },
    { nopend: '40131', nama_nopend: 'KCU Bandung Selatan', tipe: 'KCU', kota: 'Kota Bandung', status: 'AKTIF' },
    { nopend: '40141', nama_nopend: 'KCU Bandung Barat', tipe: 'KCU', kota: 'Kab. Bandung Barat', status: 'AKTIF' },
  ];

  const dataToDisplay = offices.length > 0 ? offices : fallbackData;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const getTypeBadge = (name = '', nopend = '') => {
    if (name.includes('KPRK')) return <span className="badge badge-orange">KPRK</span>;
    if (name.includes('KCU')) return <span className="badge badge-blue">KCU</span>;
    return <span className="badge badge-navy">KCP</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      {/* Search & Actions Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 260, maxWidth: 380 }}>
          <Search
            size={14}
            color="rgba(255,255,255,0.35)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            className="input-navy"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by code, name, city, or type…"
            style={{ paddingLeft: 34, fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 12, gap: 6 }}>
            <Download size={14} /> Export
          </button>
          <button className="btn-ghost" style={{ fontSize: 12, gap: 6 }}>
            <Filter size={14} /> Filter
          </button>
        </div>

        <button className="btn-primary" style={{ marginLeft: 'auto' }}>
          <Plus size={15} /> Add Post Office
        </button>
      </div>

      {/* Top Summary Metrics Bar */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          padding: '12px 20px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap'
        }}
      >
        {[
          { label: 'Total Records', value: totalCount.toLocaleString() },
          { label: 'KPRK', value: '412' },
          { label: 'KCU', value: '1,834' },
          { label: 'KCP', value: '11,001' },
          { label: 'Active', value: '12,988', color: '#10b981' },
          { label: 'Inactive', value: '259', color: '#e8431f' },
        ].map((s) => (
          <div key={s.label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
              {s.label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: s.color || '#fff' }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="glass-card-solid" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Code</th>
                <th>Name</th>
                <th>Branch Type</th>
                <th>City / Regency</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dataToDisplay.map((o) => (
                <tr key={o.nopend || o.code}>
                  <td>
                    <span className="font-mono" style={{ fontSize: 12.5, color: '#fff', fontWeight: 600 }}>
                      {o.nopend || o.code}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{o.nama_nopend || o.name}</td>
                  <td>{getTypeBadge(o.nama_nopend || o.name, o.nopend)}</td>
                  <td style={{ color: 'rgba(255,255,255,0.7)' }}>{o.nama_kcu_kc || o.city || 'Kota Cimahi'}</td>
                  <td>
                    <span className={o.status === 'NONAKTIF' ? 'badge badge-navy' : 'badge badge-emerald'}>
                      {o.status || 'AKTIF'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.6)',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 5,
                          padding: '3px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          fontSize: 11,
                          color: 'rgba(232,67,31,0.8)',
                          background: 'rgba(232,67,31,0.08)',
                          border: '1px solid rgba(232,67,31,0.18)',
                          borderRadius: 5,
                          padding: '3px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()} records
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: page === 1 ? 'default' : 'pointer',
                opacity: page === 1 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={13} color="#fff" />
            </button>
            {[page - 1, page, page + 1]
              .filter((p) => p >= 1 && p <= totalPages)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: p === page ? '#e8431f' : 'rgba(255,255,255,0.05)',
                    border: p === page ? 'none' : '1px solid rgba(255,255,255,0.09)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: p === page ? 700 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: page === totalPages ? 'default' : 'pointer',
                opacity: page === totalPages ? 0.4 : 1,
              }}
            >
              <ChevronRight size={13} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
