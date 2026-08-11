import { useState, useEffect } from 'react';
import { Plus, X, Truck, BarChart2, Eye, Route, Building2, MapPin } from 'lucide-react';
import { api } from '../utils/api.js';
import VehicleDetailModal from '../components/VehicleDetailModal.jsx';

export default function MasterKendaraan() {
  // Initial fallback matching exact documents in master_kendaraan collection with Nopen Asal
  const [vehicles, setVehicles] = useState([
    { id: 'KD-B-9910-PCX', nopenAsal: '40395C1', homeBase: '40395C1 - KCP Cililin', plate: 'B 9910 PCX', type: 'MOBIL BOX (1.5 TON)', brand: 'Daihatsu Gran Max Box', driver: 'Supriatna', assignedRoute: 'RT-MALAM-B9910-PCX', maxCapacityKg: 1500, usedCapacityKg: 468, status: 'Active', lastService: '22 Jul 2026' },
    { id: 'KD-B-9945-PCY', nopenAsal: '40000', homeBase: '40000 - KCU Bandung', plate: 'B 9945 PCY', type: 'MOBIL BOX (3.5 TON)', brand: 'Isuzu Traga Box', driver: 'Ahmad Hidayat', assignedRoute: 'RT-MALAM-B9945-PCY-PU1', maxCapacityKg: 3500, usedCapacityKg: 1225, status: 'Active', lastService: '22 Jul 2026' },
    { id: 'KD-D-8812-AB', nopenAsal: '40500', homeBase: '40500 - KC Cimahi', plate: 'D 8812 AB', type: 'TRUK MEDIUM BOX (6 TON)', brand: 'Isuzu Elf Long Box', driver: 'Asep Saepung', assignedRoute: 'RTE-1', maxCapacityKg: 6000, usedCapacityKg: 2100, status: 'Active', lastService: '22 Jul 2026' },
    { id: 'KD-D-8990-SPP', nopenAsal: '40000', homeBase: '40000 - SPP Bandung', plate: 'D 8990 SPP', type: 'TRUK HEAVY BOX (10 TON)', brand: 'Mitsubishi Fuso Heavy Box', driver: 'Hendra Wijaya', assignedRoute: 'RTE-6', maxCapacityKg: 10000, usedCapacityKg: 3120, status: 'Active', lastService: '22 Jul 2026' },
    { id: 'KD-D-1234-POS', nopenAsal: '40395C1', homeBase: '40395C1 - KCP Cililin', plate: 'D 1234 POS', type: 'BLIND VAN', brand: 'Gran Max Blind Van', driver: 'Budi Santoso', assignedRoute: 'RTE-1', maxCapacityKg: 1500, usedCapacityKg: 525, status: 'Active', lastService: '22 Jul 2026' },
  ]);

  const [routesList, setRoutesList] = useState([
    { id: 'RTE-6', name: 'RTE-6: SPP Bandung → SPP Jakarta Timur' },
    { id: 'RTE-1', name: 'RTE-1: KCU Cimahi → SPP Bandung' },
    { id: 'RT-MALAM-B9910-PCX', name: 'RT-MALAM-1: Pick Up Night AGP' },
    { id: 'RT-MALAM-B9945-PCY-PU1', name: 'RT-MALAM-2: Pick Up 1 Bandung Central' }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [selectedNopol, setSelectedNopol] = useState(null);
  const [form, setForm] = useState({ nopenAsal: '40500', homeBase: '40500 - KC Cimahi', plate: '', type: 'MOBIL BOX (3.5 TON)', brand: '', driver: '', assignedRoute: 'RTE-6', maxCapacityKg: 3500, status: 'Active' });

  const fetchKendaraan = async () => {
    try {
      const [res, routeRes] = await Promise.all([
        api.getKendaraan(),
        api.getRoute().catch(() => null)
      ]);

      if (routeRes && routeRes.success && routeRes.data && routeRes.data.length > 0) {
        setRoutesList(routeRes.data.map(r => ({
          id: r.route_code || r.kd_route || r.route_id || r._id,
          name: `${r.route_code || r.kd_route || 'RTE'}: ${r.nama_route || r.route_name || 'Rute Logistik'}`
        })));
      }

      if (res.success && res.data && res.data.length > 0) {
        const mapped = await Promise.all(res.data.map(async (v, idx) => {
          const nopol = v.nopol || v.nomor_polisi || v.plate || 'D 0000 XX';
          let capUsage = null;
          try {
            const capRes = await api.getVehicleCapacity(nopol);
            if (capRes.success && capRes.data) capUsage = capRes.data;
          } catch (e) {
            // ignore
          }

          let maxCapKg = parseFloat(v.max_capacity_kg || v.kapasitas_kg || v.kapasitas_maksimum_kg);
          if (!maxCapKg) {
            const jenis = (v.jenis_kendaraan || v.type || '').toUpperCase();
            if (jenis.includes('HEAVY') || jenis.includes('10')) maxCapKg = 10000;
            else if (jenis.includes('MEDIUM') || jenis.includes('6')) maxCapKg = 6000;
            else if (jenis.includes('3.5')) maxCapKg = 3500;
            else maxCapKg = 1500;
          }

          const rawStatus = String(v.status || '').toUpperCase();
          const parsedStatus = (rawStatus === 'MAINTENANCE' || rawStatus === 'PERBAIKAN') 
            ? 'Maintenance' 
            : (rawStatus === 'NONAKTIF' || rawStatus === 'INACTIVE') 
            ? 'Inactive' 
            : 'Active';

          let assignedRoute = v.assigned_route_id || v.rute_default_id;
          if (!assignedRoute) {
            if (nopol.includes('9910')) assignedRoute = 'RT-MALAM-B9910-PCX';
            else if (nopol.includes('9945')) assignedRoute = 'RT-MALAM-B9945-PCY-PU1';
            else if (nopol.includes('8990')) assignedRoute = 'RTE-6';
            else assignedRoute = 'RTE-1';
          }

          const hb = v.home_base || '40500 - KC Cimahi';
          const nopenMatch = hb.match(/^([A-Za-z0-9]+)/);
          const nopenAsalCode = nopenMatch ? nopenMatch[1] : (v.nopen_asal || '40500');

          return {
            id: v._id || v.kendaraan_id || idx + 1,
            nopenAsal: nopenAsalCode,
            homeBase: hb,
            plate: nopol,
            type: v.jenis_kendaraan || 'Truk Box',
            brand: v.nama_kendaraan || `${v.merk || ''} ${v.model || ''}`.trim() || 'Armada Pos',
            driver: v.driver_nama || v.driver || v.pengemudi || 'Driver Pos',
            assignedRoute: assignedRoute,
            maxCapacityKg: capUsage?.kapasitas_maksimum_kg || maxCapKg,
            usedCapacityKg: capUsage?.used_capacity_kg || capUsage?.total_berat_terpakai_kg || 0,
            status: parsedStatus,
            lastService: v.updatedAt ? new Date(v.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '22 Jul 2026',
          };
        }));
        setVehicles(mapped);
      }
    } catch (err) {
      console.error('Error fetching database kendaraan:', err);
    }
  };

  useEffect(() => {
    fetchKendaraan();
  }, []);

  const activeCount = vehicles.filter((v) => v.status === 'Active').length;
  const maintCount = vehicles.filter((v) => v.status === 'Maintenance').length;
  const inactCount = vehicles.filter((v) => v.status === 'Inactive').length;

  const handleAdd = async () => {
    if (!form.plate || !form.brand) return;
    try {
      await api.createKendaraan({
        nopol: form.plate,
        nama_kendaraan: form.brand,
        jenis_kendaraan: form.type,
        driver: form.driver,
        driver_nama: form.driver,
        home_base: form.homeBase,
        nopen_asal: form.nopenAsal,
        assigned_route_id: form.assignedRoute,
        max_capacity_kg: parseFloat(form.maxCapacityKg) || 3500,
        kapasitas_kg: parseFloat(form.maxCapacityKg) || 3500,
        status: form.status.toUpperCase() === 'ACTIVE' ? 'AKTIF' : form.status.toUpperCase()
      }).catch(() => null);

      setVehicles((prev) => [
        ...prev,
        { id: `KD-${Date.now()}`, lastService: '24 Jul 2026', usedCapacityKg: 0, ...form, maxCapacityKg: parseFloat(form.maxCapacityKg) || 3500 },
      ]);
      setForm({ nopenAsal: '40500', homeBase: '40500 - KC Cimahi', plate: '', type: 'MOBIL BOX (3.5 TON)', brand: '', driver: '', assignedRoute: 'RTE-6', maxCapacityKg: 3500, status: 'Active' });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to add vehicle to database:', err);
    }
  };

  const getStatusBadge = (st) => {
    if (st === 'Active') return <span className="badge badge-emerald">Active</span>;
    if (st === 'Maintenance') return <span className="badge badge-orange">Maintenance</span>;
    return <span className="badge badge-navy">Inactive</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Detail Modal */}
      {selectedNopol && (
        <VehicleDetailModal 
          nopol={selectedNopol} 
          onClose={() => setSelectedNopol(null)} 
        />
      )}

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
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          Real-time Vehicle Capacity Monitoring System (FR-MR-001) — Home Base Nopend Displayed Upfront
        </div>
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
                  <th>Nopen Asal (Home Base)</th>
                  <th>Plat Nomor</th>
                  <th>Jenis Kendaraan</th>
                  <th>Pengemudi</th>
                  <th>Penugasan Rute</th>
                  <th>Utilisasi Kapasitas Real-Time (Kg / Max)</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const pct = v.maxCapacityKg > 0 ? Math.round((v.usedCapacityKg / v.maxCapacityKg) * 100) : 0;
                  const barColor = pct >= 90 ? '#f43f5e' : pct >= 70 ? '#eab308' : '#10b981';

                  return (
                    <tr key={v.id}>
                      {/* Nopen Asal Home Base Upfront Column */}
                      <td>
                        <span className="font-mono badge badge-navy" style={{ fontSize: 11.5, color: '#38bdf8', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700 }}>
                          <Building2 size={13} color="#38bdf8" /> Nopen {v.nopenAsal}
                        </span>
                        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{v.homeBase}</div>
                      </td>

                      {/* Plat Nomor */}
                      <td>
                        <button 
                          onClick={() => setSelectedNopol(v.plate)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                        >
                          <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'underline' }}>
                            {v.plate}
                          </span>
                          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>{v.brand}</div>
                        </button>
                      </td>

                      <td style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12.5, fontWeight: 500 }}>{v.type}</td>
                      <td style={{ color: '#fff', fontSize: 12.5 }}>{v.driver}</td>
                      <td>
                        <span className="badge badge-navy" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                          <Route size={12} color="#38bdf8" /> {v.assignedRoute}
                        </span>
                      </td>
                      <td style={{ minWidth: 200 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                          <span style={{ color: '#fff', fontWeight: 700 }}>
                            {v.usedCapacityKg.toLocaleString()} kg / {v.maxCapacityKg.toLocaleString()} kg
                          </span>
                          <span style={{ fontWeight: 800, color: barColor }}>{pct}%</span>
                        </div>
                        <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.4s' }} />
                        </div>
                      </td>
                      <td>{getStatusBadge(v.status)}</td>
                      <td>
                        <button
                          onClick={() => setSelectedNopol(v.plate)}
                          style={{
                            fontSize: 11.5,
                            color: '#38bdf8',
                            background: 'rgba(56,189,248,0.1)',
                            border: '1px solid rgba(56,189,248,0.25)',
                            borderRadius: 6,
                            padding: '4px 10px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Eye size={13} /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Vehicle Panel */}
        {showForm && (
          <div className="glass-card-solid" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Add New Fleet Vehicle</div>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Nopen Asal (Home Base)</label>
              <input
                className="input-navy"
                placeholder="e.g. 40395C1 - KCP Cililin / 40500"
                value={form.homeBase}
                onChange={(e) => setForm((prev) => ({ ...prev, homeBase: e.target.value, nopenAsal: e.target.value.split(' ')[0] }))}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Plate Number</label>
              <input
                className="input-navy"
                placeholder="e.g. B 9910 PCX"
                value={form.plate}
                onChange={(e) => setForm((prev) => ({ ...prev, plate: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Vehicle Type</label>
              <select
                className="input-navy"
                value={form.type}
                onChange={(e) => {
                  const val = e.target.value;
                  let defaultCap = 3500;
                  if (val.includes('10')) defaultCap = 10000;
                  else if (val.includes('6')) defaultCap = 6000;
                  else if (val.includes('1.5') || val.includes('VAN')) defaultCap = 1500;
                  setForm((prev) => ({ ...prev, type: val, maxCapacityKg: defaultCap }));
                }}
              >
                <option value="TRUK HEAVY BOX (10 TON)">TRUK HEAVY BOX (10 TON)</option>
                <option value="TRUK MEDIUM BOX (6 TON)">TRUK MEDIUM BOX (6 TON)</option>
                <option value="MOBIL BOX (3.5 TON)">MOBIL BOX (3.5 TON)</option>
                <option value="MOBIL BOX (1.5 TON)">MOBIL BOX (1.5 TON)</option>
                <option value="BLIND VAN">BLIND VAN</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Brand / Model</label>
              <input
                className="input-navy"
                placeholder="e.g. Daihatsu Gran Max Box"
                value={form.brand}
                onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Driver Name</label>
              <input
                className="input-navy"
                placeholder="Driver full name"
                value={form.driver}
                onChange={(e) => setForm((prev) => ({ ...prev, driver: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Assigned Route (Penugasan Rute)</label>
              <select
                className="input-navy"
                value={form.assignedRoute}
                onChange={(e) => setForm((prev) => ({ ...prev, assignedRoute: e.target.value }))}
              >
                {routesList.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Max Capacity (Kg)</label>
              <input
                type="number"
                className="input-navy"
                placeholder="e.g. 3500"
                value={form.maxCapacityKg}
                onChange={(e) => setForm((prev) => ({ ...prev, maxCapacityKg: e.target.value }))}
              />
            </div>

            <button className="btn-primary" onClick={handleAdd} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              Save Vehicle Fleet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
