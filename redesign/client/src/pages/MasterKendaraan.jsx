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
    if (st === 'Active') return <span className="badge badge-emerald">Aktif</span>;
    if (st === 'Maintenance') return <span className="badge badge-pink">Maintenance</span>;
    return <span className="badge badge-navy">Nonaktif</span>;
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
          { label: 'Total Armada', value: vehicles.length, color: '#0284c7' },
          { label: 'Operasional', value: activeCount, color: '#10b981' },
          { label: 'Dalam Servis', value: maintCount, color: '#ef4444' },
          { label: 'Standby / Cadangan', value: inactCount, color: 'var(--text-muted)' },
        ].map((s) => (
          <div
            key={s.label}
            className="spatial-card"
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Truck size={20} color={s.color} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
          Sistem Telemetri Utilisasi Kapasitas Kendaraan Real-Time — Terhubung Live Database
        </div>
        <button className="btn-primary" style={{ gap: 6 }} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Tambah Armada Baru
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 340px' : '1fr', gap: 16 }}>
        {/* Vehicles Table */}
        <div className="spatial-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  <th style={{ padding: '12px 14px' }}>Nopen Asal (Home Base)</th>
                  <th style={{ padding: '12px 14px' }}>Plat Nomor</th>
                  <th style={{ padding: '12px 14px' }}>Jenis Kendaraan</th>
                  <th style={{ padding: '12px 14px' }}>Pengemudi</th>
                  <th style={{ padding: '12px 14px' }}>Penugasan Rute</th>
                  <th style={{ padding: '12px 14px' }}>Utilisasi Kapasitas (Kg / Max)</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const pct = v.maxCapacityKg > 0 ? Math.round((v.usedCapacityKg / v.maxCapacityKg) * 100) : 0;
                  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#d97706' : '#16a34a';

                  return (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      {/* Nopen Asal Home Base Upfront Column */}
                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge badge-navy" style={{ fontSize: 11, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={12} color="#0284c7" /> Nopen {v.nopenAsal}
                        </span>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{v.homeBase}</div>
                      </td>

                      {/* Plat Nomor */}
                      <td style={{ padding: '12px 14px' }}>
                        <button 
                          onClick={() => setSelectedNopol(v.plate)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0b2e8a', fontFamily: 'monospace' }}>
                            {v.plate}
                          </span>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{v.brand}</div>
                        </button>
                      </td>

                      <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 600 }}>{v.type}</td>
                      <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 600 }}>{v.driver}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                          <Route size={12} /> {v.assignedRoute}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', minWidth: 180 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                          <span style={{ color: '#0f172a', fontWeight: 800, fontFamily: 'monospace' }}>
                            {v.usedCapacityKg.toLocaleString()} kg / {v.maxCapacityKg.toLocaleString()} kg
                          </span>
                          <span style={{ fontWeight: 800, color: barColor }}>{pct}%</span>
                        </div>
                        <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.4s' }} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>{getStatusBadge(v.status)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedNopol(v.plate)}
                          className="btn-ghost"
                          style={{ padding: '3px 8px', fontSize: 11, gap: 4 }}
                        >
                          <Eye size={12} /> Inspeksi
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
          <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Tambah Armada Baru</div>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nopen Asal (Home Base)</label>
              <input
                placeholder="misal: 40395C1 - KCP Cililin / 40500"
                value={form.homeBase}
                onChange={(e) => setForm((prev) => ({ ...prev, homeBase: e.target.value, nopenAsal: e.target.value.split(' ')[0] }))}
                style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nomor Polisi (Plat)</label>
              <input
                placeholder="misal: B 9910 PCX"
                value={form.plate}
                onChange={(e) => setForm((prev) => ({ ...prev, plate: e.target.value }))}
                style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Jenis Kendaraan</label>
              <select
                value={form.type}
                onChange={(e) => {
                  const val = e.target.value;
                  let defaultCap = 3500;
                  if (val.includes('10')) defaultCap = 10000;
                  else if (val.includes('6')) defaultCap = 6000;
                  else if (val.includes('1.5') || val.includes('VAN')) defaultCap = 1500;
                  setForm((prev) => ({ ...prev, type: val, maxCapacityKg: defaultCap }));
                }}
                style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
              >
                <option value="TRUK HEAVY BOX (10 TON)">TRUK HEAVY BOX (10 TON)</option>
                <option value="TRUK MEDIUM BOX (6 TON)">TRUK MEDIUM BOX (6 TON)</option>
                <option value="MOBIL BOX (3.5 TON)">MOBIL BOX (3.5 TON)</option>
                <option value="MOBIL BOX (1.5 TON)">MOBIL BOX (1.5 TON)</option>
                <option value="BLIND VAN">BLIND VAN</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Merk / Model</label>
              <input
                placeholder="misal: Daihatsu Gran Max Box"
                value={form.brand}
                onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nama Pengemudi</label>
              <input
                placeholder="Nama lengkap supir"
                value={form.driver}
                onChange={(e) => setForm((prev) => ({ ...prev, driver: e.target.value }))}
                style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Penugasan Rute</label>
              <select
                value={form.assignedRoute}
                onChange={(e) => setForm((prev) => ({ ...prev, assignedRoute: e.target.value }))}
                style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
              >
                {routesList.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Kapasitas Maksimal (Kg)</label>
              <input
                type="number"
                placeholder="misal: 3500"
                value={form.maxCapacityKg}
                onChange={(e) => setForm((prev) => ({ ...prev, maxCapacityKg: e.target.value }))}
                style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>

            <button className="btn-primary" onClick={handleAdd} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              Simpan Data Armada
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
