import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Activity, RefreshCw, AlertCircle, ShieldCheck, Compass, ArrowRight, PackageCheck, Calendar } from 'lucide-react';
import { estimasiApi } from '../../utils/estimasiApi.js';
import EstimasiSimulatorCard from './EstimasiSimulatorCard.jsx';
import CapacityEstimatorGauge from './CapacityEstimatorGauge.jsx';
import RouteTimelineEstimator from './RouteTimelineEstimator.jsx';

const FLEET_QUICK_LIST = [
  { nopol: 'B 9945 PCY', name: 'Express MPC Jakarta 10000', nopen_asal: '40000', nopen_tujuan: '10000' },
  { nopol: 'B 9910 PCX', name: 'Direct DC Jakarta 12000', nopen_asal: '40000', nopen_tujuan: '12000' },
  { nopol: 'D 8812 AB', name: 'Feeder KCU Cimahi 40500', nopen_asal: '40000', nopen_tujuan: '40500' },
  { nopol: 'D 8990 SPP', name: 'Heavy Wingbox Hub Soreang', nopen_asal: '40000', nopen_tujuan: '40300' },
  { nopol: 'D 1234 POS', name: 'Feeder AGP Gatsu', nopen_asal: '40000', nopen_tujuan: '40263C2' },
];

export default function EstimasiMilkRunPage() {
  const [selectedNopol, setSelectedNopol] = useState('B 9945 PCY');
  const [jamBerangkat, setJamBerangkat] = useState('16:00');
  const [kecepatanKmh, setKecepatanKmh] = useState(40);
  const [waktuMuatMenit, setWaktuMuatMenit] = useState(15);
  const [tambahanPaketKg, setTambahanPaketKg] = useState(0);
  const [periode, setPeriode] = useState('hari_ini'); // hari_ini | minggu_lalu | bulan_lalu

  const [kalkulasiData, setKalkulasiData] = useState(null);
  const [simulasiData, setSimulasiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch estimation calculation data from backend
  const fetchKalkulasi = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await estimasiApi.getKalkulasi({
        nopol: selectedNopol,
        jam_berangkat: jamBerangkat,
        kecepatan_kmh: kecepatanKmh,
        waktu_muat_menit: waktuMuatMenit,
        periode: periode
      });

      if (res.success && res.data) {
        setKalkulasiData(res.data);
      } else {
        setError(res.message || 'Gagal memuat data estimasi');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch extra package simulation data when tambahanPaketKg > 0
  const fetchSimulasi = async () => {
    if (tambahanPaketKg <= 0) {
      setSimulasiData(null);
      return;
    }
    try {
      const res = await estimasiApi.simulasiBeban({
        nopol: selectedNopol,
        tambahan_paket_kg: tambahanPaketKg,
        periode: periode
      });
      if (res.success && res.data) {
        setSimulasiData(res.data);
      }
    } catch (err) {
      console.warn('Simulation API notice:', err.message);
    }
  };

  useEffect(() => {
    fetchKalkulasi();
  }, [selectedNopol, jamBerangkat, kecepatanKmh, waktuMuatMenit, periode]);

  useEffect(() => {
    fetchSimulasi();
  }, [selectedNopol, tambahanPaketKg, periode]);

  const handleReset = () => {
    setSelectedNopol('B 9945 PCY');
    setJamBerangkat('16:00');
    setKecepatanKmh(40);
    setWaktuMuatMenit(15);
    setTambahanPaketKg(0);
    setPeriode('hari_ini');
  };

  const vehicleInfo = kalkulasiData || {};
  const kapasitasData = vehicleInfo.kapasitas || {};
  const stops = vehicleInfo.estimasi_jadwal_stop || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto', color: '#fff' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0d1b38, #060d1f)', border: '1px solid rgba(56,189,248,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={22} color="#38bdf8" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Estimasi Milk Run Logistik
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>
                Rute Terstruktur Origin SPP Bandung (40000) • Filter Periode Pengiriman • Nopen Asal & Tujuan Clear
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={fetchKalkulasi}
            style={{
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: 8,
              padding: '8px 14px',
              color: '#38bdf8',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RefreshCw size={14} className={loading ? 'spinning-wheel' : ''} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Fleet Quick Selector Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: '#060d1f', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginRight: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Truck size={14} color="#38bdf8" /> Select Fleet Route:
        </span>
        {FLEET_QUICK_LIST.map((item) => {
          const isSelected = selectedNopol === item.nopol;
          return (
            <button
              key={item.nopol}
              onClick={() => setSelectedNopol(item.nopol)}
              style={{
                background: isSelected ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isSelected ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 12px rgba(56,189,248,0.25)' : 'none'
              }}
            >
              {item.nopol} ({item.name})
            </button>
          );
        })}
      </div>

      {/* Error Alert if any */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '12px 16px', color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Structured Route Banner Card */}
      <div style={{ background: '#060d1f', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 14, padding: '18px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Nama Kendaraan</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 4 }}>
            {vehicleInfo.nama_kendaraan || selectedNopol}
          </div>
        </div>
        
        <div>
          <div style={{ fontSize: 10.5, color: 'rgba(16,185,129,0.9)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={13} /> Nopen Asal (Origin)
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {vehicleInfo.nama_nopen_asal || '40000 - SPP Bandung'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, color: 'rgba(239,68,68,0.9)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={13} /> Nopen Tujuan (Destination)
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
            {vehicleInfo.nama_nopen_tujuan || '10000 - MPC Jakarta Gateway'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Periode & Volume Paket</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
            ~{vehicleInfo.total_paket_count || 245} Resi ({periode === 'minggu_lalu' ? 'Minggu Lalu' : periode === 'bulan_lalu' ? 'Bulan Lalu' : 'Hari Ini'})
          </div>
        </div>
      </div>

      {/* Main Controls & Visualizer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        
        {/* Simulator Parameters Card */}
        <EstimasiSimulatorCard
          selectedNopol={selectedNopol}
          setSelectedNopol={setSelectedNopol}
          jamBerangkat={jamBerangkat}
          setJamBerangkat={setJamBerangkat}
          kecepatanKmh={kecepatanKmh}
          setKecepatanKmh={setKecepatanKmh}
          waktuMuatMenit={waktuMuatMenit}
          setWaktuMuatMenit={setWaktuMuatMenit}
          tambahanPaketKg={tambahanPaketKg}
          setTambahanPaketKg={setTambahanPaketKg}
          periode={periode}
          setPeriode={setPeriode}
          nopenAsal={vehicleInfo.nama_nopen_asal}
          nopenTujuan={vehicleInfo.nama_nopen_tujuan}
          onReset={handleReset}
        />

        {/* Capacity Meter Gauge */}
        <CapacityEstimatorGauge
          kapasitasData={kapasitasData}
          simulasiData={simulasiData}
          tambahanPaketKg={tambahanPaketKg}
          nopenAsalInfo={vehicleInfo.nama_nopen_asal}
          nopenTujuanInfo={vehicleInfo.nama_nopen_tujuan}
          totalPaketCount={vehicleInfo.total_paket_count}
          periode={periode}
        />

        {/* Route Timeline Estimator */}
        <RouteTimelineEstimator
          stops={stops}
          kecepatanKmh={kecepatanKmh}
          jamBerangkat={jamBerangkat}
        />

      </div>

    </div>
  );
}
