import { useState, useEffect } from 'react';
import { Plus, Zap, Clock, Star, Package, Truck, Globe } from 'lucide-react';
import { api } from '../utils/api.js';

export default function MasterProduk() {
  const [products, setProducts] = useState([
    { id: 1, code: 'EKS', name: 'Pos Ekspres', description: 'Same-day or next-day guaranteed delivery for urgent domestic packages.', category: 'Express', sla: 'H+0 / H+1', maxWeight: '30 kg', active: true },
    { id: 2, code: 'REG', name: 'Pos Reguler', description: 'Standard delivery service across all Indonesian post offices. 2–7 business days.', category: 'Regular', sla: 'H+2 – H+7', maxWeight: '50 kg', active: true },
    { id: 3, code: 'KLK', name: 'Kilat Khusus', description: 'Priority domestic delivery with tracking and delivery confirmation.', category: 'Priority', sla: 'H+1 – H+3', maxWeight: '30 kg', active: true },
    { id: 4, code: 'EXP', name: 'Express Mail Service', description: 'International express mail service to 232 countries and territories worldwide.', category: 'International', sla: '5–7 days intl.', maxWeight: '20 kg', active: true },
    { id: 5, code: 'LOG', name: 'Pos Logistik', description: 'Heavy cargo and freight logistics solutions for bulk business shipments.', category: 'Logistics', sla: 'H+3 – H+10', maxWeight: '500 kg', active: true },
    { id: 6, code: 'SDH', name: 'Same Day (Cimahi–Bandung)', description: 'Intra-city same-day delivery limited to the Greater Bandung corridor.', category: 'Express', sla: 'H+0', maxWeight: '10 kg', active: false },
  ]);

  const categoryColor = {
    Express: '#e8431f',
    Regular: '#2460b0',
    Priority: '#f59e0b',
    International: '#10b981',
    Logistics: '#6ba3f0',
  };

  const getIcon = (code) => {
    switch (code) {
      case 'EKS': return <Zap size={22} />;
      case 'REG': return <Package size={22} />;
      case 'KLK': return <Star size={22} />;
      case 'EXP': return <Globe size={22} />;
      case 'LOG': return <Truck size={22} />;
      default: return <Clock size={22} />;
    }
  };

  const fetchProduk = async () => {
    try {
      const res = await api.getProduk();
      if (res.success && res.data && res.data.length > 0) {
        setProducts(res.data.map((p, idx) => ({
          id: p._id || idx + 1,
          code: p.kd_produk || p.code || 'PRD',
          name: p.nama_produk || p.name || 'Produk Pos',
          description: p.keterangan || p.description || 'Layanan pengiriman Pos Indonesia.',
          category: p.kategori || 'Regular',
          sla: p.sla || 'H+1',
          maxWeight: p.max_weight || '30 kg',
          active: p.status === 'NONAKTIF' ? false : true,
        })));
      }
    } catch (err) {
      console.error('Error fetching produk:', err);
    }
  };

  useEffect(() => {
    fetchProduk();
  }, []);

  const toggleActive = (id) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const activeCount = products.filter((p) => p.active).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {activeCount} active · {products.length - activeCount} inactive
          </div>
        </div>
        <button className="btn-primary" style={{ marginLeft: 'auto' }}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Product Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {products.map((p) => {
          const catColor = categoryColor[p.category] || '#e8431f';
          return (
            <div
              key={p.id}
              className="gradient-border-card"
              style={{
                padding: 22,
                opacity: p.active ? 1 : 0.6,
                transition: 'opacity 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      background: `${catColor}18`,
                      border: `1px solid ${catColor}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: catColor,
                    }}
                  >
                    {getIcon(p.code)}
                  </div>
                  <div>
                    <div className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: catColor, letterSpacing: '0.1em', marginBottom: 2 }}>
                      {p.code}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{p.name}</div>
                  </div>
                </div>

                <div
                  className="toggle-track"
                  onClick={() => toggleActive(p.id)}
                  style={{ background: p.active ? '#10b981' : 'rgba(255,255,255,0.1)' }}
                >
                  <div className="toggle-thumb" style={{ left: p.active ? 20 : 2 }} />
                </div>
              </div>

              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 16px' }}>
                {p.description}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>SLA · </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{p.sla}</span>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Max · </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{p.maxWeight}</span>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: 6, background: `${catColor}14`, border: `1px solid ${catColor}22` }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: catColor }}>{p.category}</span>
                </div>
              </div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.active ? '#10b981' : 'rgba(255,255,255,0.2)' }} />
                  <span style={{ fontSize: 11.5, color: p.active ? '#10b981' : 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                    {p.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
