import { useState } from 'react';
import { Zap, Send, Sparkles, CheckCircle, Truck, Building2, Weight, Box, Check, Flame, ArrowRight, FileText, Package, Shuffle, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound.js';

export default function BulkInjector({
  options,
  selectedDate,
  onInjectBulk,
  selectedNopol,
  setSelectedNopol
}) {
  const [count, setCount] = useState(10);
  const [originNopen, setOriginNopen] = useState('RANDOM');
  const [weightRange, setWeightRange] = useState('MEDIUM');
  const [service, setService] = useState('RANDOM');
  const [injecting, setInjecting] = useState(false);
  const [recentBatch, setRecentBatch] = useState(null);

  const offices = options?.offices || [];
  const vehicles = options?.vehicles || [];

  const handleInject = async (e) => {
    e.preventDefault();
    setInjecting(true);
    try {
      const payload = {
        count: parseInt(count, 10) || 5,
        target_date: selectedDate,
        target_nopol: (!selectedNopol || selectedNopol === 'ALL') ? undefined : selectedNopol,
        origin_nopen: originNopen === 'RANDOM' ? undefined : originNopen,
        weight_range: weightRange,
        service
      };

      const res = await onInjectBulk(payload);
      sounds.playBulkSuccess();

      // Trigger Confetti Celebration effect!
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 }
        });
      } catch (err) {}

      if (res && res.data) {
        setRecentBatch(res.data);
      }
    } catch (err) {
      sounds.playError();
      console.error('Error injecting bulk:', err);
    } finally {
      setInjecting(false);
    }
  };

  const PRESETS = [5, 10, 25, 50, 100, 140];

  const WEIGHT_OPTIONS = [
    { id: 'LIGHT', label: 'Ringan (Dokumen)', desc: '0.5 kg - 3.0 kg', icon: FileText },
    { id: 'MEDIUM', label: 'Reguler (Paket)', desc: '2.0 kg - 10.0 kg', icon: Package },
    { id: 'HEAVY', label: 'Cargo (Dus Besar)', desc: '12.0 kg - 35.0 kg', icon: Box }
  ];

  const SERVICE_OPTIONS = [
    { id: 'RANDOM', label: 'Acak Secara Merata', desc: 'Bagi rata Nextday, Reguler, Sameday & Jumbo' },
    { id: 'Pos Nextday', label: 'Pos Nextday', desc: '1 Hari Sampai' },
    { id: 'Pos Reguler', label: 'Pos Reguler', desc: '2-3 Hari Kerja' },
    { id: 'Pos Sameday', label: 'Pos Sameday', desc: 'Hari yang Sama' },
    { id: 'Pos Jumbo Cargo', label: 'Pos Jumbo Cargo', desc: 'Muatan Besar' }
  ];

  return (
    <div className="tool-card-container">
      {/* Header */}
      <div className="tool-card-header">
        <div className="flex-align gap-12">
          <div className="tool-icon-badge tool-icon-orange">
            <Zap size={22} />
          </div>
          <div>
            <h3 className="tool-card-title">Suntik Resi Massal (Bulk Parcel Generator)</h3>
            <p className="tool-card-subtitle">
              Hasilkan puluhan resi otomatis ke 18 kantor pos riil & armada kendaraan dalam 1 kali klik
            </p>
          </div>
        </div>
      </div>

      <div className="tool-card-body">
        <form onSubmit={handleInject} className="tool-form-stack">
          
          {/* 1. QUANTITY SELECTOR (Vibrant Counter + Slider) */}
          <div className="form-section-box">
            <div className="flex-between mb-8">
              <label className="section-label flex-align gap-6">
                <Flame size={14} className="text-orange" /> JUMLAH RESI YANG INGIN DISUNTIKKAN:
              </label>
              <div className="quantity-counter-badge font-mono">
                <span className="text-cyan text-bold" style={{ fontSize: 18 }}>{count}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>PAKET</span>
              </div>
            </div>

            <div className="flex-align gap-8 mb-12 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCount(p)}
                  className={`btn-qty-pill ${count === p ? 'active' : ''}`}
                >
                  +{p} Resi
                </button>
              ))}
            </div>

            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="150"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value, 10))}
                className="custom-range-slider"
              />
              <div className="flex-between text-dim font-mono" style={{ fontSize: 10, marginTop: 4 }}>
                <span>1 Paket</span>
                <span>50 Paket</span>
                <span>100 Paket</span>
                <span>150 Paket</span>
              </div>
            </div>
          </div>

          {/* 2. TARGET VEHICLE SELECTOR (Visual Cards) */}
          <div className="form-section-box">
            <label className="section-label flex-align gap-6 mb-8">
              <Truck size={14} className="text-cyan" /> TARGET ARMADA KENDARAAN:
            </label>

            <div className="vehicle-selector-grid">
              {/* All Vehicles Card */}
              <div
                className={`vehicle-select-card ${(!selectedNopol || selectedNopol === 'ALL') ? 'active' : ''}`}
                onClick={() => setSelectedNopol('ALL')}
              >
                <div className="flex-between mb-4">
                  <span className="font-mono text-bold text-cyan" style={{ fontSize: 12.5 }}>
                    SEMUA ARMADA
                  </span>
                  {(!selectedNopol || selectedNopol === 'ALL') && <Check size={14} className="text-cyan" />}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Bagi rata secara proporsional ke 3 armada
                </div>
              </div>

              {/* 3 Specific Vehicle Cards */}
              {vehicles.map((v) => {
                const isSelected = selectedNopol === v.nopol;
                return (
                  <div
                    key={v.nopol}
                    className={`vehicle-select-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedNopol(v.nopol)}
                  >
                    <div className="flex-between mb-4">
                      <span className="font-mono text-bold flex-align gap-4" style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>
                        <Truck size={14} color="var(--primary-blue)" /> {v.nopol}
                      </span>
                      {isSelected && <Check size={14} className="text-cyan" />}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.nama}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      Kapasitas: {v.max_capacity_kg} kg
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. ORIGIN OFFICE SELECTOR */}
          <div className="form-section-box">
            <div className="flex-between mb-8">
              <label className="section-label flex-align gap-6">
                <Building2 size={14} className="text-emerald" /> KANTOR POS / AGEN ASAL PENGIRIMAN:
              </label>
              <button
                type="button"
                className="btn-quick-link flex-align gap-4"
                onClick={() => setOriginNopen('RANDOM')}
              >
                <Shuffle size={12} /> Acak dari 18 Kantor
              </button>
            </div>

            <select
              className="custom-dark-select"
              value={originNopen}
              onChange={(e) => setOriginNopen(e.target.value)}
            >
              <option value="RANDOM">Acak Otomatis dari 18 Kantor Pos Riil (Bandung & Cimahi)</option>
              
              <optgroup label="── KORIDOR CIMAHI RAYA (Rute B 9910 PCX) ──">
                {offices.filter(o => ['40511A', '40511CB', '40511U3', '40511CA', '40511U1', '40511U4'].includes(o.nopend)).map((o) => (
                  <option key={o.nopend} value={o.nopend}>
                    [{o.nopend}] {o.nama} — {o.alamat}
                  </option>
                ))}
              </optgroup>

              <optgroup label="── KORIDOR BARAT & UTARA (Rute D 8812 AB) ──">
                {offices.filter(o => ['40184U5', '40215C6', '40351U2', '40116A', '40115B', '40114A'].includes(o.nopend)).map((o) => (
                  <option key={o.nopend} value={o.nopend}>
                    [{o.nopend}] {o.nama} — {o.alamat}
                  </option>
                ))}
              </optgroup>

              <optgroup label="── KORIDOR PUSAT & TIMUR (Rute B 9945 PCY) ──">
                {offices.filter(o => ['40000', '40115A', '40122B', '40122D1', '40123A', '40100'].includes(o.nopend)).map((o) => (
                  <option key={o.nopend} value={o.nopend}>
                    [{o.nopend}] {o.nama} — {o.alamat}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 4. WEIGHT CATEGORY & SERVICE (Visual Selectable Cards) */}
          <div className="grid-2-col gap-12">
            {/* Weight Cards */}
            <div className="form-section-box">
              <label className="section-label flex-align gap-6 mb-8">
                <Weight size={14} className="text-orange" /> KATEGORI BOBOT PAKET:
              </label>

              <div className="weight-options-stack">
                {WEIGHT_OPTIONS.map((w) => {
                  const WeightIcon = w.icon;
                  return (
                    <div
                      key={w.id}
                      className={`weight-option-card ${weightRange === w.id ? 'active' : ''}`}
                      onClick={() => setWeightRange(w.id)}
                    >
                      <div className="flex-align gap-10">
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--kpi-cyan-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <WeightIcon size={16} color="var(--primary-blue)" />
                        </div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>{w.label}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{w.desc}</div>
                        </div>
                      </div>
                      {weightRange === w.id && <Check size={16} className="text-orange" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Service Pills */}
            <div className="form-section-box">
              <label className="section-label flex-align gap-6 mb-8">
                <Box size={14} className="text-purple" /> JENIS LAYANAN POS:
              </label>

              <div className="service-options-stack">
                {SERVICE_OPTIONS.map((s) => (
                  <div
                    key={s.id}
                    className={`service-option-card ${service === s.id ? 'active' : ''}`}
                    onClick={() => setService(s.id)}
                  >
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>{s.label}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{s.desc}</div>
                    </div>
                    {service === s.id && <Check size={16} className="text-purple" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. EXECUTION BUTTON */}
          <button
            type="submit"
            className="btn-super-action"
            disabled={injecting}
          >
            {injecting ? (
              <span className="flex-align gap-10 justify-center">
                <Sparkles size={20} className="spin text-cyan" />
                <span>Menyuntikkan {count} Resi ke Database MongoDB...</span>
              </span>
            ) : (
              <span className="flex-align gap-10 justify-center">
                <Send size={19} />
                <span>EKSEKUSI SUNTIK {count} RESI KE DATABASE</span>
              </span>
            )}
          </button>
        </form>

        {/* 6. INJECTION SUCCESS REPORT */}
        {recentBatch && recentBatch.connotes && (
          <div className="injected-report-card" style={{ marginTop: 20 }}>
            <div className="flex-between mb-10">
              <div className="flex-align gap-8">
                <div className="icon-badge-round-emerald">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: '#15803d' }}>
                    SUNTIK DATABASE 100% SUKSES!
                  </div>
                  <div style={{ fontSize: 11, color: '#16a34a' }}>
                    {recentBatch.injected_count} Nomor Resi telah tersimpan ke koleksi transaksi & muatan armada.
                  </div>
                </div>
              </div>

              <span className="badge badge-emerald font-mono">
                {selectedDate}
              </span>
            </div>

            <div className="injected-table-wrapper">
              <table className="custom-cyber-table">
                <thead>
                  <tr>
                    <th>Nomor Resi</th>
                    <th>Pengirim & Asal</th>
                    <th>Penerima & Kota Tujuan</th>
                    <th>Armada Terpilih</th>
                    <th>Berat</th>
                    <th>Layanan</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBatch.connotes.slice(0, 8).map((c, idx) => (
                    <tr key={idx}>
                      <td className="font-mono text-cyan text-bold">{c.connote_code}</td>
                      <td>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{c.sender || 'Pengirim Toko UMKM'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.origin}</div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--primary-navy)', fontWeight: 700 }}>{c.receiver || 'Pelanggan Individu'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} color="var(--primary-blue)" /> {c.destination_city || 'Kota Tujuan di Indonesia'}
                        </div>
                      </td>
                      <td>
                        <span className="badge-nopol-table">{c.vehicle}</span>
                      </td>
                      <td className="font-mono text-emerald">{c.weight_kg} kg</td>
                      <td>
                        <span className="badge-service-table">{c.service}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {recentBatch.connotes.length > 8 && (
              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                ... dan {recentBatch.connotes.length - 8} paket lainnya berhasil tersimpan ke database.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
