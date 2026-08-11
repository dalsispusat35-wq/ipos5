import React from 'react';
import { MapPin, Clock, CheckCircle2, Navigation, CalendarClock, ArrowRight, Flag, Compass } from 'lucide-react';

export default function RouteTimelineEstimator({ stops = [], kecepatanKmh, jamBerangkat }) {
  if (!stops || stops.length === 0) {
    return (
      <div style={{ background: '#060d1f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
        Tidak ada data titik stop rute armada.
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#060d1f',
        border: '1px solid rgba(56,189,248,0.2)',
        borderRadius: 14,
        padding: '20px 22px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarClock size={18} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>Timeline Estimasi Kedatangan (ETA)</h3>
            <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
              Kecepatan: {kecepatanKmh} km/jam | Jam Berangkat Origin: {jamBerangkat} WIB
            </p>
          </div>
        </div>

        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '4px 12px', borderRadius: 14, border: '1px solid rgba(56,189,248,0.25)' }}>
          {stops.length} Checkpoints Stop
        </div>
      </div>

      {/* Timeline Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
        {stops.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === stops.length - 1;

          // Status Badge Styling
          let statusBg = 'rgba(56,189,248,0.1)';
          let statusColor = '#38bdf8';
          let statusBorder = 'rgba(56,189,248,0.3)';
          let statusIcon = <Navigation size={12} color="#38bdf8" />;

          if (stop.status === 'COMPLETED') {
            statusBg = 'rgba(16,185,129,0.15)';
            statusColor = '#10b981';
            statusBorder = 'rgba(16,185,129,0.3)';
            statusIcon = <CheckCircle2 size={12} color="#10b981" />;
          } else if (stop.status === 'SCHEDULED') {
            statusBg = 'rgba(255,255,255,0.05)';
            statusColor = 'rgba(255,255,255,0.5)';
            statusBorder = 'rgba(255,255,255,0.1)';
            statusIcon = <Clock size={12} color="rgba(255,255,255,0.5)" />;
          }

          // Role Badge Styling
          const roleLabel = isFirst ? 'ASAL / ORIGIN' : isLast ? 'TUJUAN FINAL' : stop.role || 'CHECKPOINT';
          const roleBg = isFirst ? 'rgba(16,185,129,0.15)' : isLast ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.1)';
          const roleColor = isFirst ? '#10b981' : isLast ? '#ef4444' : '#38bdf8';

          return (
            <div
              key={stop.stop_order || index}
              style={{
                display: 'flex',
                gap: 16,
                paddingBottom: isLast ? 0 : 20,
                position: 'relative'
              }}
            >
              {/* Left Timeline Node Line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: stop.status === 'COMPLETED' ? '#10b981' : stop.status === 'IN_TRANSIT' ? '#38bdf8' : '#0d1b38',
                    border: `2px solid ${stop.status === 'COMPLETED' ? '#10b981' : stop.status === 'IN_TRANSIT' ? '#38bdf8' : 'rgba(255,255,255,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stop.status === 'SCHEDULED' ? 'rgba(255,255,255,0.6)' : '#04091a',
                    fontWeight: 800,
                    fontSize: 12,
                    boxShadow: stop.status === 'IN_TRANSIT' ? '0 0 12px rgba(56,189,248,0.8)' : 'none',
                    zIndex: 2
                  }}
                >
                  {stop.stop_order}
                </div>

                {!isLast && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      background: stop.status === 'COMPLETED' ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)',
                      marginTop: 4,
                      marginBottom: -4
                    }}
                  />
                )}
              </div>

              {/* Stop Content Card */}
              <div
                style={{
                  flex: 1,
                  background: '#0d1b38',
                  border: isLast ? '1px solid rgba(239,68,68,0.3)' : isFirst ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{stop.nama_lokasi}</span>
                    <span style={{ fontSize: 10, color: roleColor, background: roleBg, padding: '2px 8px', borderRadius: 6, fontWeight: 800, textTransform: 'uppercase' }}>
                      {roleLabel}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>
                      Nopen: {stop.nopen}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
                    <span>Jarak Leg: {stop.distance_km || 0} km</span>
                    <span>•</span>
                    <span>Waktu Muat: {stop.waktu_muat || '0 min'}</span>
                  </div>
                </div>

                {/* Right Side ETA & Status */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.01em' }}>
                    {stop.eta}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: statusBg,
                      border: `1px solid ${statusBorder}`,
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: statusColor
                    }}
                  >
                    {statusIcon}
                    {stop.status}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
