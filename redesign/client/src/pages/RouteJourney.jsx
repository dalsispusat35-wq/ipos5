import { useState, useEffect } from 'react';
import { Truck, MapPin, ArrowRight, RotateCcw, ShieldCheck, PackageCheck, AlertCircle, CheckCircle2, ChevronRight, Info, X } from 'lucide-react';
import { api } from '../utils/api.js';

export default function RouteJourney() {
  const [capacityData, setCapacityData] = useState(null);

  const stops = [
    { id: 1, name: 'AGP ONG', code: '40395C0', status: 'SKIPPED', isSkipped: true, load: 0 },
    { id: 2, name: 'AGEN ARVINET', code: '40395C1', status: 'WAITING', isSkipped: false, load: 240 },
    { id: 3, name: 'CICALENGKA', code: '40395U1', status: 'WAITING', isSkipped: false, load: 350 },
    { id: 4, name: 'CIPARAY', code: '40381U2', status: 'WAITING', isSkipped: false, load: 180 },
    { id: 5, name: 'MAJALAYA', code: '40382U1', status: 'WAITING', isSkipped: false, load: 220 },
    { id: 6, name: 'KCP MAJALAYA', code: '40382B2', status: 'WAITING', isSkipped: false, load: 160 },
    { id: 7, name: 'AGP Omega', code: '40393C0', status: 'SKIPPED', isSkipped: true, load: 0 },
    { id: 8, name: 'CILEUNYI', code: '40393U3', status: 'WAITING', isSkipped: false, load: 110 },
    { id: 9, name: 'CINUNUK', code: '40393S8', status: 'WAITING', isSkipped: false, load: 90 },
    { id: 10, name: 'SPP BANDUNG 40400', code: '40400', status: 'DESTINATION', isSkipped: false, load: 0 },
  ];

  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  useEffect(() => {
    api.getVehicleCapacity('B 9910 PCX')
      .then(res => {
        if (res.success) setCapacityData(res.data);
      })
      .catch(err => console.error('Failed to load capacity:', err));
  }, []);

  const nextStop = () => {
    let nextIdx = currentStopIndex + 1;
    while (nextIdx < stops.length && stops[nextIdx].isSkipped) {
      nextIdx++;
    }
    if (nextIdx < stops.length) {
      setCurrentStopIndex(nextIdx);
    }
  };

  const resetRoute = () => {
    setCurrentStopIndex(0);
  };

  const maxCapacity = capacityData?.kapasitas_maksimum_kg || 1500;
  const currentLoad = capacityData?.total_berat_terpakai_kg || stops.slice(0, currentStopIndex + 1).reduce((acc, s) => acc + (s.isSkipped ? 0 : s.load), 0);
  const loadPercentage = capacityData?.persentase_terpakai || Math.min(100, Math.round((currentLoad / maxCapacity) * 100));
  const remainingCapacity = Math.max(0, maxCapacity - currentLoad);

  const currentStopObj = stops[currentStopIndex];
  const nextStopObj = stops.slice(currentStopIndex + 1).find(s => !s.isSkipped);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header Card */}
      <div className="spatial-card" style={{ padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div 
                style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 10, 
                  background: '#e0f2fe', 
                  border: '1px solid #bae6fd',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <MapPin size={18} color="#0284c7" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                Visualisasi Rute Milk Run Logistics (Telemetri Armada B 9910 PCX)
              </h2>
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
              <span>Armada: <strong style={{ color: '#0f172a' }}>B 9910 PCX (Mobil Box 1.5 Ton)</strong></span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span>Shift: <strong style={{ color: '#0f172a' }}>MALAM (16.00 – 21.00 WIB)</strong></span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span>Tujuan Akhir: <strong style={{ color: '#0b2e8a' }}>SPP BANDUNG 40400</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {nextStopObj ? (
              <button className="btn-primary" onClick={nextStop} style={{ gap: 8, padding: '9px 18px' }}>
                Lanjut ke {nextStopObj.name} <ArrowRight size={15} />
              </button>
            ) : (
              <span className="badge badge-emerald" style={{ padding: '8px 16px', fontSize: 12 }}>
                Tiba di SPP Bandung (Selesai)
              </span>
            )}
            <button className="btn-ghost" onClick={resetRoute} style={{ gap: 6, fontSize: 12 }}>
              <RotateCcw size={14} /> Reset Rute
            </button>
          </div>
        </div>

        {/* Horizontal Telemetry Node Graph */}
        <div 
          style={{ 
            marginTop: 20, 
            padding: '24px 20px', 
            borderRadius: 14, 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0',
            overflowX: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 960, position: 'relative', padding: '20px 0' }}>
            {stops.map((stop, i) => {
              const isCurrent = i === currentStopIndex;
              const isPassed = i < currentStopIndex;
              const isSkipped = stop.isSkipped;

              return (
                <div key={stop.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {/* Connecting Line Segment */}
                  {i < stops.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 14,
                        left: '50%',
                        width: '100%',
                        height: 3,
                        background: i < currentStopIndex 
                          ? '#16a34a' 
                          : i === currentStopIndex 
                          ? '#0284c7' 
                          : '#e2e8f0',
                        zIndex: 1,
                        transition: 'all 0.3s ease'
                      }}
                    />
                  )}

                  {/* Active Vehicle Badge above Node */}
                  {isCurrent && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: -38,
                        background: '#0b2e8a',
                        borderRadius: 8,
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 12px rgba(11, 46, 138, 0.25)',
                        zIndex: 5
                      }}
                    >
                      <Truck size={14} color="#fff" />
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{currentLoad} kg</span>
                    </div>
                  )}

                  {/* Stop Node Circle */}
                  <div
                    onClick={() => setCurrentStopIndex(i)}
                    style={{
                      width: isCurrent ? 34 : 28,
                      height: isCurrent ? 34 : 28,
                      borderRadius: '50%',
                      background: isCurrent ? '#0b2e8a' : isPassed ? '#16a34a' : isSkipped ? '#f1f5f9' : '#ffffff',
                      border: isCurrent ? '2px solid #0284c7' : isPassed ? '2px solid #16a34a' : '2px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: (isCurrent || isPassed) ? '#fff' : isSkipped ? '#ef4444' : '#64748b',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(2, 132, 199, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s ease',
                      zIndex: 3,
                    }}
                  >
                    {isSkipped ? <X size={14} /> : isPassed ? <CheckCircle2 size={14} /> : stop.id}
                  </div>

                  {/* Stop Label */}
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#0b2e8a' : isPassed ? '#0f172a' : '#64748b' }}>
                      {stop.name}
                    </div>
                    <div style={{ fontSize: 10, color: isSkipped ? '#ef4444' : '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>
                      {isSkipped ? 'SKIPPED' : `(${stop.code})`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lower Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {/* Capacity Utilization Card */}
        <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} color={capacityData?.status_kapasitas?.includes('OVERLOAD') ? '#ef4444' : '#16a34a'} /> Utilisasi Kapasitas Armada B 9910 PCX (Trip 1)
            </h3>
            <span className={`badge ${capacityData?.status_kapasitas?.includes('OVERLOAD') ? 'badge-pink' : 'badge-emerald'}`}>
              {capacityData?.status_kapasitas || 'NORMAL'}
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Muatan Aktif Trip 1</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                {currentLoad.toLocaleString()} kg / {maxCapacity.toLocaleString()} kg ({loadPercentage}%)
              </span>
            </div>

            {/* Gauge Bar */}
            <div style={{ width: '100%', height: 10, borderRadius: 5, background: '#e2e8f0', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${loadPercentage}%`, 
                  background: '#10b981',
                  borderRadius: 5,
                  transition: 'width 0.5s ease'
                }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
            <span>Aktivitas Stop: <strong style={{ color: '#0f172a' }}>{currentStopObj?.name || 'Start'}</strong></span>
            <span>Sisa Daya Angkut: <strong style={{ color: '#16a34a' }}>{remainingCapacity.toLocaleString()} kg</strong></span>
          </div>

          {capacityData?.has_overflow && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '9px 12px', fontSize: 11.5, color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={14} color="#0284c7" /> Antrean Melimpah (Trip 2 / Armada Tambahan):
              </span>
              <strong style={{ fontFamily: 'monospace', fontWeight: 700 }}>{capacityData.overflow_queue_kg?.toLocaleString()} kg</strong>
            </div>
          )}
        </div>

        {/* Manifest Cargo Card */}
        <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PackageCheck size={16} color="#0284c7" /> Manifest Cargo Aktif di Dalam Truk
            </h3>
            <span className="badge badge-navy">{currentLoad > 0 ? `${Math.round(currentLoad / 2.5)} PAKET RESI` : '0 PAKET RESI'}</span>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
            {currentLoad === 0 ? (
              <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
                Truk kosong (Belum ada muatan atau telah dibongkar di SPP Bandung).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>MNFST-240724-MILK01</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{currentLoad} kg</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
