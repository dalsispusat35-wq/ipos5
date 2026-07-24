import { useState, useEffect } from 'react';
import { Plus, X, Truck } from 'lucide-react';
import { api } from '../utils/api.js';

export default function MasterKendaraan() {
  const [vehicles, setVehicles] = useState([
    { id: 1, plate: 'D 9021 AB', type: 'Box Truck', brand: 'Mitsubishi Canter', driver: 'Hendra Kusuma', capacity: '3.5 ton', status: 'Active', lastService: '12 Jun 2026' },
    { id: 2, plate: 'D 8832 CD', type: 'Box Truck', brand: 'Hino 300', driver: 'Agus Setiawan', capacity: '4 ton', status: 'Active', lastService: '05 Jul 2026' },
    { id: 3, plate: 'D 7741 EF', type: 'Pickup', brand: 'Isuzu ELF', driver: 'Dedi Rahmat', capacity: '1.5 ton', status: 'Active', lastService: '18 Jul 2026' },
    { id: 4, plate: 'D 6600 GH', type: 'Box Truck', brand: 'Mitsubishi Canter', driver: 'Roni Supriadi', capacity: '3.5 ton', status: 'Maintenance', lastService: '01 Jul 2026' },
    { id: 5, plate: 'D 5512 IJ', type: 'Van', brand: 'Toyota HiAce Commuter', driver: 'Eko Prasetyo', capacity: '0.8 ton', status: 'Active', lastService: '20 Jul 2026' },
    { id: 6, plate: 'D 4423 KL', type: 'Box Truck', brand: 'Hino 300', driver: 'Budi Santoso', capacity: '4 ton', status: 'Active', lastService: '10 Jul 2026' },
    { id: 7, plate: 'D 3314 MN', type: 'Pickup', brand: 'Daihatsu Gran Max', driver: 'Yusuf Fauzi', capacity: '0.8 ton', status: 'Inactive', lastService: '15 Mar 2026' },
    { id: 8, plate: 'D 2205 OP', type: 'Box Truck', brand: 'Mitsubishi Canter', driver: 'Wahyu Hermawan', capacity: '3.5 ton', status: 'Active', lastService: '08 Jul 2026' },
    { id: 9, plate: 'D 1196 QR', type: 'Van', brand: 'Toyota HiAce', driver: 'Fajar Nugroho', capacity: '0.8 ton', status: 'Active', lastService: '22 Jul 2026' },
    { id: 10, plate: 'D 0987 ST', type: 'Truck', brand: 'Hino 500', driver: 'Joko Widodo', capacity: '8 ton', status: 'Maintenance', lastService: '28 Jun 2026' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ plate: '', type: 'Box Truck', brand: '', driver: '', capacity: '', status: 'Active' });

  const fetchKendaraan = async () => {
    try {
      const res = await api.getKendaraan();
      if (res.success && res.data && res.data.length > 0) {
        setVehicles(res.data.map((v, idx) => ({
          id: v._id || idx + 1,
          plate: v.nopol || v.plate || 'D 0000 XX',
          type: v.jenis_kendaraan || v.type || 'Box Truck',
          brand: v.merk_model || v.brand || 'Mitsubishi',
          driver: v.pengemudi || v.driver || 'Driver Pos',
          capacity: v.kapasitas || v.capacity || '2.0 ton',
          status: v.status === 'MAINTENANCE' ? 'Maintenance' : v.status === 'NONAKTIF' ? 'Inactive' : 'Active',
          lastService: v.last_service || '20 Jul 2026',
        })));
      }
    } catch (err) {
      console.error('Error fetching kendaraan:', err);
    }
  };

  useEffect(() => {
    fetchKendaraan();
  }, []);

  const activeCount = vehicles.filter((v) => v.status === 'Active').length;
  const maintCount = vehicles.filter((v) => v.status === 'Maintenance').length;
  const inactCount = vehicles.filter((v) => v.status === 'Inactive').length;

  const handleAdd = () => {
    if (!form.plate || !form.brand) return;
    setVehicles((prev) => [
      ...prev,
      { id: Date.now(), lastService: '24 Jul 2026', ...form },
    ]);
    setForm({ plate: '', type: 'Box Truck', brand: '', driver: '', capacity: '', status: 'Active' });
    setShowForm(false);
  };

  const getStatusBadge = (st) => {
    if (st === 'Active') return <span className="badge badge-emerald">Active</span>;
    if (st === 'Maintenance') return <span className="badge badge-orange">Maintenance</span>;
    return <span className="badge badge-navy">Inactive</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Vehicles', value: vehicles.length, color: '#fff' },
          { label: 'Operational', value: activeCount, color: '#10b981' },
          { label: 'In Maintenance', value: maintCount, color: '#e8431f' },
          { label: 'Inactive', value: inactCount, color: 'rgba(255,255,255,0.35)' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: '14px 18px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Truck size={18} color={s.color} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Vehicle
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 340px' : '1fr', gap: 16 }}>
        {/* Vehicles Table */}
        <div className="glass-card-solid" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plate No.</th>
                  <th>Vehicle Type</th>
                  <th>Brand / Model</th>
                  <th>Driver</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Last Service</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>
                        {v.plate}
                      </span>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.65)' }}>{v.type}</td>
                    <td style={{ color: '#fff', fontWeight: 500 }}>{v.brand}</td>
                    <td style={{ color: 'rgba(255,255,255,0.7)' }}>{v.driver}</td>
                    <td>
                      <span className="font-mono" style={{ fontSize: 12 }}>{v.capacity}</span>
                    </td>
                    <td>{getStatusBadge(v.status)}</td>
                    <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{v.lastService}</td>
                    <td>
                      <button
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.5)',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 5,
                          padding: '3px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Vehicle Panel */}
        {showForm && (
          <div className="glass-card-solid" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Add Vehicle</div>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            {[
              { label: 'Plate Number', key: 'plate', placeholder: 'e.g. D 0001 AB' },
              { label: 'Brand / Model', key: 'brand', placeholder: 'e.g. Mitsubishi Canter' },
              { label: 'Driver Name', key: 'driver', placeholder: 'Full name' },
              { label: 'Capacity', key: 'capacity', placeholder: 'e.g. 3.5 ton' },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>
                  {f.label}
                </label>
                <input
                  className="input-navy"
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}

            <button className="btn-primary" onClick={handleAdd} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              Add Vehicle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
