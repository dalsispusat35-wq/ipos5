import React from 'react';
import { Scale, AlertTriangle, CheckCircle, AlertOctagon, Info, MapPin, ArrowRight } from 'lucide-react';

export default function CapacityEstimatorGauge({ kapasitasData, simulasiData, tambahanPaketKg, nopenAsalInfo, nopenTujuanInfo, totalPaketCount, periode }) {
  // Determine effective values (use simulation data if extra package weight is added)
  const isSimulated = tambahanPaketKg > 0 && simulasiData?.kapasitas_proyeksi;
  const activeCap = isSimulated ? simulasiData.kapasitas_proyeksi : (kapasitasData || {});

  const maxKg = activeCap.max_capacity_kg || 4000;
  const usedKg = activeCap.used_capacity_kg || 0;
  const sisaKg = activeCap.sisa_capacity_kg !== undefined ? activeCap.sisa_capacity_kg : Math.max(0, maxKg - usedKg);
  const percent = activeCap.persentase_terpakai || parseFloat(((usedKg / maxKg) * 100).toFixed(1));
  const status = activeCap.status || (percent >= 90 ? 'OVERLOAD' : percent >= 70 ? 'WARNING' : 'NORMAL');

  // Status Color Palettes
  let statusColor = '#10b981'; // Green
  let statusBg = 'rgba(16,185,129,0.12)';
  let statusBorder = 'rgba(16,185,129,0.3)';
  let statusIcon = <CheckCircle size={16} color="#10b981" />;

  if (status === 'WARNING') {
    statusColor = '#f59e0b'; // Yellow
    statusBg = 'rgba(245,158,11,0.12)';
    statusBorder = 'rgba(245,158,11,0.3)';
    statusIcon = <AlertTriangle size={16} color="#f59e0b" />;
  } else if (status === 'OVERLOAD') {
    statusColor = '#ef4444'; // Red
    statusBg = 'rgba(239,68,68,0.15)';
    statusBorder = 'rgba(239,68,68,0.4)';
    statusIcon = <AlertOctagon size={16} color="#ef4444" />;
  }

  const periodeLabel = periode === 'minggu_lalu' ? 'Minggu Lalu' : periode === 'bulan_lalu' ? 'Bulan Lalu' : 'Hari Ini';

  return (
    <div
      style={{
        background: 'rgba(13, 27, 56, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${statusBorder}`,
        borderRadius: 14,
        padding: '20px 22px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={18} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Kapasitas Muatan Kendaraan</h3>
            <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
              Integrated Fleet Meter ({maxKg.toLocaleString()} kg Max) | Filter: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{periodeLabel}</span>
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: statusBg,
            border: `1px solid ${statusBorder}`,
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            color: statusColor,
            letterSpacing: '0.04em'
          }}
        >
          {statusIcon}
          {status}
        </div>
      </div>

      {/* Origin -> Destination Nopen Route Banner */}
      <div style={{ background: '#060d1f', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={16} color="#10b981" />
          <div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Nopen Asal (Origin)</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{nopenAsalInfo || '40000 - SPP Bandung'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: 13, fontWeight: 800 }}>
          <ArrowRight size={18} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={16} color="#ef4444" />
          <div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Nopen Tujuan (Destination)</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{nopenTujuanInfo || '10000 - MPC Jakarta Gateway'}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', padding: '4px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>
          Estimasi: ~{totalPaketCount || 245} Resi
        </div>
      </div>

      {/* Main Metric Visual Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textTransform: 'uppercase' }}>
        <div style={{ background: '#060d1f', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Muatan Terpakai</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: statusColor, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            {usedKg.toLocaleString()} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>kg</span>
          </div>
        </div>

        <div style={{ background: '#060d1f', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Sisa Kapasitas</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            {sisaKg.toLocaleString()} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>kg</span>
          </div>
        </div>

        <div style={{ background: '#060d1f', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Persentase Terpakai</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: statusColor, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            {percent}%
          </div>
        </div>
      </div>

      {/* Visual Capacity Meter Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
          <span>Utilisasi Kapasitas Truk ({periodeLabel})</span>
          <span style={{ fontWeight: 700, color: statusColor, fontFamily: "'JetBrains Mono', monospace" }}>{usedKg} / {maxKg} kg</span>
        </div>

        <div
          style={{
            width: '100%',
            height: 14,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 7,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          <div
            style={{
              width: `${Math.min(100, percent)}%`,
              height: '100%',
              background: statusColor,
              borderRadius: 7,
              transition: 'width 0.4s ease, background-color 0.3s ease',
              boxShadow: `0 0 12px ${statusColor}`
            }}
          />
        </div>

        {/* Meter Threshold markers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
          <span>0% (Kosong)</span>
          <span>70% (Batas Normal)</span>
          <span>90% (Batas Warning)</span>
          <span>100% (Overload)</span>
        </div>
      </div>

      {/* Simulation Banner Notice */}
      {isSimulated && (
        <div
          style={{
            background: statusBg,
            border: `1px solid ${statusBorder}`,
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12,
            color: '#fff'
          }}
        >
          <Info size={16} color={statusColor} style={{ flexShrink: 0 }} />
          <div>
            <strong>Simulasi Terpasang:</strong> Penambahan muatan +{tambahanPaketKg} kg ({periodeLabel}). 
            {status === 'OVERLOAD' && <span style={{ color: '#ef4444', fontWeight: 700 }}> Peringatan: Kapasitas melebihi batas maksimum (OVERLOAD)!</span>}
            {status === 'WARNING' && <span style={{ color: '#f59e0b', fontWeight: 700 }}> Perhatian: Kapasitas mendekati maksimum (70-90%).</span>}
            {status === 'NORMAL' && <span> Kapasitas armada masih dalam batas normal aman.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
