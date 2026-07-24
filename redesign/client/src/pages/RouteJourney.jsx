import { useState } from 'react';
import { Truck, MapPin, ArrowRight, RotateCcw, ShieldCheck, PackageCheck, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

export default function RouteJourney() {
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

  // Calculate active load based on visited non-skipped stops
  const currentLoad = stops.slice(0, currentStopIndex + 1).reduce((acc, s) => acc + (s.isSkipped ? 0 : s.load), 0);
  const maxCapacity = 1500;
  const loadPercentage = Math.min(100, Math.round((currentLoad / maxCapacity) * 100));
  const remainingCapacity = maxCapacity - currentLoad;

  const currentStopObj = stops[currentStopIndex];
  const nextStopObj = stops.slice(currentStopIndex + 1).find(s => !s.isSkipped);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header Card */}
      <div 
        className="glass-card-solid gradient-border-card" 
        style={{ padding: '22px 26px', background: 'linear-gradient(135deg, rgba(13,27,56,0.95), rgba(6,13,31,0.95))' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div 
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 8, 
                  background: 'rgba(232,67,31,0.14)', 
                  border: '1px solid rgba(232,67,31,0.3)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <MapPin size={18} color="#e8431f" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                Visualisasi Rute Milk Run Logistics (Line Telemetry & Mobil Box B 9910 PCX)
              </h2>
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
              <span>Armada: <strong style={{ color: '#fff' }}>B 9910 PCX (Mobil Box 1.5 Ton)</strong></span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span>Shift: <strong style={{ color: '#fff' }}>MALAM (16.00 – 21.00 WIB)</strong></span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span>Tujuan Akhir: <strong style={{ color: '#6ba3f0' }}>SPP BANDUNG 40400</strong></span>
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

        {/* Horizontal Telemetry Node Graph with Uniform Clean Connecting Lines */}
        <div 
          style={{ 
            marginTop: 24, 
            padding: '24px 20px', 
            borderRadius: 14, 
            background: 'rgba(6,13,31,0.7)', 
            border: '1px solid rgba(255,255,255,0.06)',
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
                  {/* Clean Uniform Connecting Line Segment */}
                  {i < stops.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 14,
                        left: '50%',
                        width: '100%',
                        height: 3,
                        background: i < currentStopIndex 
                          ? '#10b981' 
                          : i === currentStopIndex 
                          ? 'linear-gradient(90deg, #e8431f 0%, rgba(255,255,255,0.15) 100%)' 
                          : 'rgba(255,255,255,0.15)',
                        boxShadow: i < currentStopIndex ? '0 0 8px rgba(16,185,129,0.5)' : (i === currentStopIndex ? '0 0 8px rgba(232,67,31,0.5)' : 'none'),
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
                        background: 'linear-gradient(135deg, #e8431f, #b83010)',
                        borderRadius: 8,
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 0 16px rgba(232,67,31,0.5)',
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
                      background: isCurrent ? '#e8431f' : isPassed ? '#10b981' : isSkipped ? 'rgba(255,255,255,0.08)' : '#0d1b38',
                      border: isCurrent ? '2px solid #fff' : isPassed ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: isCurrent ? '0 0 20px rgba(232,67,31,0.6)' : (isPassed ? '0 0 10px rgba(16,185,129,0.3)' : 'none'),
                      transition: 'all 0.3s ease',
                      zIndex: 3,
                    }}
                  >
                    {isSkipped ? 'X' : isPassed ? <CheckCircle2 size={14} /> : stop.id}
                  </div>

                  {/* Stop Label */}
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#fff' : isPassed ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)' }}>
                      {stop.name}
                    </div>
                    <div className="font-mono" style={{ fontSize: 9.5, color: isSkipped ? '#ef4444' : 'rgba(255,255,255,0.3)', marginTop: 2 }}>
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
        <div className="glass-card-solid" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} color="#10b981" /> Utilisasi Kapasitas Armada B 9910 PCX
            </h3>
            <span className="badge badge-emerald">AMAN (SAFE)</span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Muatan Aktif Saat Ini</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {currentLoad.toLocaleString()} kg / {maxCapacity.toLocaleString()} kg ({loadPercentage}%)
              </span>
            </div>

            {/* Gauge Bar */}
            <div style={{ width: '100%', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${loadPercentage}%`, 
                  background: loadPercentage > 85 ? '#e8431f' : 'linear-gradient(90deg, #10b981, #f59e0b)',
                  borderRadius: 5,
                  transition: 'width 0.3s ease'
                }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.45)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
            <span>Aktivitas Stop: <strong style={{ color: '#fff' }}>{currentStopObj?.name || 'Start'}</strong></span>
            <span>Sisa Daya Angkut: <strong style={{ color: '#10b981' }}>{remainingCapacity.toLocaleString()} kg</strong></span>
          </div>
        </div>

        {/* Manifest Cargo Card */}
        <div className="glass-card-solid" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PackageCheck size={16} color="#3b82f6" /> Manifest Cargo Aktif di Dalam Truk
            </h3>
            <span className="badge badge-blue">{currentLoad > 0 ? `${Math.round(currentLoad / 2.5)} PAKET RESI` : '0 PAKET RESI'}</span>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
            {currentLoad === 0 ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                Truk kosong (Belum ada muatan atau telah dibongkar di SPP Bandung).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>MNFST-240724-MILK01</span>
                  <span style={{ fontWeight: 700, color: '#fff' }}>{currentLoad} kg</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
