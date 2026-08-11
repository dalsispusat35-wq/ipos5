import React from 'react';
import { Truck, Clock, Gauge, PackagePlus, RotateCcw, Sliders, Calendar, CalendarDays, CalendarRange, MapPin, ArrowRight } from 'lucide-react';

const VEHICLES_LIST = [
  { nopol: 'B 9945 PCY', label: 'B 9945 PCY (Rute Express Gateway MPC Jakarta 10000)' },
  { nopol: 'B 9910 PCX', label: 'B 9910 PCX (Rute Intercity Direct DC Jakarta Selatan)' },
  { nopol: 'D 8812 AB', label: 'D 8812 AB (Rute Feeder SPP Bandung - KCU Cimahi)' },
  { nopol: 'D 8990 SPP', label: 'D 8990 SPP (Rute Heavy Wingbox SPP Bandung - Soreang)' },
  { nopol: 'D 1234 POS', label: 'D 1234 POS (Rute City Feeder SPP Bandung - AGP Gatsu)' },
];

const PERIODE_OPTIONS = [
  { id: 'hari_ini', label: 'Hari Ini', icon: Calendar, badge: 'Real-Time' },
  { id: 'minggu_lalu', label: 'Minggu Lalu', icon: CalendarDays, badge: 'Histori 7-Hari' },
  { id: 'bulan_lalu', label: 'Bulan Lalu', icon: CalendarRange, badge: 'Histori 30-Hari' },
];

export default function EstimasiSimulatorCard({
  selectedNopol,
  setSelectedNopol,
  jamBerangkat,
  setJamBerangkat,
  kecepatanKmh,
  setKecepatanKmh,
  waktuMuatMenit,
  setWaktuMuatMenit,
  tambahanPaketKg,
  setTambahanPaketKg,
  periode,
  setPeriode,
  nopenAsal,
  nopenTujuan,
  onReset
}) {
  return (
    <div
      style={{
        background: 'rgba(13, 27, 56, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        padding: '20px 22px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sliders size={18} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Simulator Parameter Rute</h3>
            <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>Sesuaikan kecepatan, waktu berangkat, periode pengiriman, dan tambahan muatan</p>
          </div>
        </div>

        <button
          onClick={onReset}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '6px 12px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s'
          }}
          title="Reset ke parameter standar"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Periode Filter Buttons Row */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#38bdf8', marginBottom: 8 }}>
          <Calendar size={14} /> Periode Filter Pengiriman
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PERIODE_OPTIONS.map((item) => {
            const IconComp = item.icon;
            const isActive = periode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPeriode(item.id)}
                style={{
                  flex: 1,
                  minWidth: 140,
                  background: isActive ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? '#38bdf8' : 'rgba(255,255,255,0.09)'}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: isActive ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 14px rgba(56,189,248,0.25)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconComp size={16} color={isActive ? '#38bdf8' : 'rgba(255,255,255,0.5)'} />
                  <span>{item.label}</span>
                </div>
                <span style={{ fontSize: 10, background: isActive ? '#38bdf8' : 'rgba(255,255,255,0.08)', color: isActive ? '#04091a' : 'rgba(255,255,255,0.5)', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        
        {/* 1. Vehicle Selector */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#38bdf8', marginBottom: 6 }}>
            <Truck size={14} /> Armada Kendaraan
          </label>
          <select
            value={selectedNopol}
            onChange={(e) => setSelectedNopol(e.target.value)}
            style={{
              width: '100%',
              background: '#060d1f',
              border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: 8,
              padding: '9px 12px',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            {VEHICLES_LIST.map((v) => (
              <option key={v.nopol} value={v.nopol} style={{ background: '#060d1f', color: '#fff' }}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Departure Time Picker */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#38bdf8', marginBottom: 6 }}>
            <Clock size={14} /> Jam Berangkat (Asal)
          </label>
          <input
            type="time"
            value={jamBerangkat}
            onChange={(e) => setJamBerangkat(e.target.value)}
            style={{
              width: '100%',
              background: '#060d1f',
              border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          />
        </div>

        {/* 3. Dwell / Load Time */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#38bdf8', marginBottom: 6 }}>
            <Clock size={14} /> Waktu Muat / Stop (Menit)
          </label>
          <input
            type="number"
            min="0"
            max="120"
            value={waktuMuatMenit}
            onChange={(e) => setWaktuMuatMenit(Math.max(0, parseInt(e.target.value, 10) || 0))}
            style={{
              width: '100%',
              background: '#060d1f',
              border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          />
        </div>

        {/* 4. Extra Load Simulation Input */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#38bdf8', marginBottom: 6 }}>
            <PackagePlus size={14} /> Simulasi Tambahan Paket (kg)
          </label>
          <input
            type="number"
            min="0"
            step="10"
            value={tambahanPaketKg}
            onChange={(e) => setTambahanPaketKg(Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="0 kg"
            style={{
              width: '100%',
              background: '#060d1f',
              border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          />
        </div>

      </div>

      {/* Speed Slider Section */}
      <div style={{ background: '#060d1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#38bdf8' }}>
            <Gauge size={15} /> Kecepatan Rata-Rata Armada:
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '2px 10px', borderRadius: 12, border: '1px solid rgba(56,189,248,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
            {kecepatanKmh} km/jam
          </span>
        </div>
        <input
          type="range"
          min="20"
          max="80"
          step="5"
          value={kecepatanKmh}
          onChange={(e) => setKecepatanKmh(parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            accentColor: '#38bdf8',
            cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          <span>20 km/j (Lambat / Macet)</span>
          <span>40 km/j (Standar Logistik)</span>
          <span>80 km/j (Tol / Jalur Cepat)</span>
        </div>
      </div>

    </div>
  );
}
