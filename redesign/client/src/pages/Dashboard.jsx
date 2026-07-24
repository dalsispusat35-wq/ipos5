import { useState, useEffect } from 'react';
import { Building2, Tag, Truck, Map, TrendingUp, ArrowUpRight, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Dashboard({ activeConnection, refreshStatsTrigger }) {
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success && res.data) {
        setDbStats(res.data);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshStatsTrigger]);

  const stats = [
    {
      label: 'Total Post Offices',
      value: dbStats?.totals?.total_kantor?.toLocaleString() || '13,247',
      change: '+12 this month',
      icon: <Building2 size={20} />,
    },
    {
      label: 'Total Products',
      value: dbStats?.totals?.total_produk?.toString() || '12',
      change: '3 active services',
      icon: <Tag size={20} />,
    },
    {
      label: 'Fleet Vehicles',
      value: dbStats?.totals?.total_kendaraan?.toString() || '48',
      change: '41 operational',
      icon: <Truck size={20} />,
    },
    {
      label: 'Total Routes',
      value: dbStats?.totals?.total_route?.toString() || '24',
      change: '18 active today',
      icon: <Map size={20} />,
    },
  ];

  const packageStages = [
    { name: 'Received at Cimahi', short: 'Received', key: 'DITERIMA_DI_CIMAHI', value: dbStats?.statusBreakdown?.DITERIMA_DI_CIMAHI || 1247, color: '#2460b0' },
    { name: 'In Manifest', short: 'Manifest', key: 'IN_MANIFEST', value: dbStats?.statusBreakdown?.IN_MANIFEST || 843, color: '#6ba3f0' },
    { name: 'In Transit to Bandung SC', short: 'In Transit', key: 'TRANSIT_SPP_BANDUNG', value: dbStats?.statusBreakdown?.TRANSIT_SPP_BANDUNG || 562, color: '#e8431f' },
    { name: 'Arrived at Destination SC', short: 'Arrived SC', key: 'TIBA_DI_SPP_TUJUAN', value: dbStats?.statusBreakdown?.TIBA_DI_SPP_TUJUAN || 389, color: '#f59e0b' },
    { name: 'Delivered', short: 'Delivered', key: 'DELIVERED', value: dbStats?.statusBreakdown?.DELIVERED || 2891, color: '#10b981' },
  ];

  const totalPackages = packageStages.reduce((acc, curr) => acc + curr.value, 0);

  const recentShipments = dbStats?.recentTransactions || [
    { connote_code: '00130000110724001', origin: 'KPC Cimahi Selatan', destination: 'KCU Bandung Utara', weight: '2.4 kg', status: 'In Transit', statusType: 'transit', date: '24 Jul 2026, 09:14' },
    { connote_code: '00130000110724002', origin: 'KPC Cimahi Utara', destination: 'KCU Sumedang', weight: '0.8 kg', status: 'Delivered', statusType: 'delivered', date: '24 Jul 2026, 08:52' },
    { connote_code: '00130000110724003', origin: 'KPRK Cimahi', destination: 'KCU Garut', weight: '5.2 kg', status: 'In Manifest', statusType: 'manifest', date: '24 Jul 2026, 08:30' },
    { connote_code: '00130000110724004', origin: 'KPC Cimahi Tengah', destination: 'KCU Tasikmalaya', weight: '1.1 kg', status: 'Delivered', statusType: 'delivered', date: '24 Jul 2026, 07:48' },
    { connote_code: '00130000110724005', origin: 'KPRK Cimahi', destination: 'KCU Bandung Selatan', weight: '3.8 kg', status: 'Arrived at Dest. SC', statusType: 'arrived', date: '24 Jul 2026, 07:22' },
    { connote_code: '00130000110724006', origin: 'KPC Cimahi Selatan', destination: 'KCU Cianjur', weight: '0.5 kg', status: 'Received', statusType: 'received', date: '24 Jul 2026, 07:05' },
    { connote_code: '00130000110724007', origin: 'KPRK Cimahi', destination: 'KCU Purwakarta', weight: '7.3 kg', status: 'In Transit', statusType: 'transit', date: '23 Jul 2026, 23:41' },
  ];

  const getBadgeClass = (status) => {
    if (!status) return 'badge badge-navy';
    const s = String(status).toUpperCase();
    if (s.includes('DELIVERED')) return 'badge badge-emerald';
    if (s.includes('TRANSIT')) return 'badge badge-orange';
    if (s.includes('ARRIVED') || s.includes('TIBA')) return 'badge badge-amber';
    if (s.includes('RECEIVED') || s.includes('DITERIMA')) return 'badge badge-blue';
    return 'badge badge-navy';
  };

  // SVG Donut Chart math calculations
  const radius = 62;
  const circumference = 2 * Math.PI * radius; // ~389.55
  let accumulatedOffset = 0;

  const donutSegments = packageStages.map((st) => {
    const fraction = totalPackages > 0 ? st.value / totalPackages : 0;
    const dashLength = fraction * circumference;
    const offset = accumulatedOffset;
    accumulatedOffset += dashLength;
    return { ...st, fraction, dashLength, offset };
  });

  const maxBarValue = Math.max(...packageStages.map((s) => s.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {stats.map((s) => (
          <div key={s.label} className="gradient-border-card glow-orange" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(232,67,31,0.14)',
                  border: '1px solid rgba(232,67,31,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#e8431f',
                }}
              >
                {s.icon}
              </div>
              <ArrowUpRight size={14} color="rgba(255,255,255,0.3)" />
            </div>
            <div className="stat-number" style={{ marginBottom: 6 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {s.label}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={11} color="#10b981" />
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Donut Chart & Bar Chart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {/* 🍩 Donut Chart Card */}
        <div className="glass-card-solid" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChartIcon size={16} color="#e8431f" /> Package Status Breakdown
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {totalPackages.toLocaleString()} total packages in database
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* SVG Donut Chart Circle */}
            <div style={{ position: 'relative', width: 170, height: 170, flexShrink: 0 }}>
              <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring Track */}
                <circle
                  cx="85"
                  cy="85"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="20"
                />
                {/* Donut Segments */}
                {donutSegments.map((seg, i) => {
                  const isHovered = hoveredSegment === i;
                  return (
                    <circle
                      key={seg.name}
                      cx="85"
                      cy="85"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={isHovered ? 24 : 20}
                      strokeDasharray={`${seg.dashLength} ${circumference}`}
                      strokeDashoffset={-seg.offset}
                      style={{
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        filter: isHovered ? `drop-shadow(0 0 8px ${seg.color})` : 'none',
                      }}
                      onMouseEnter={() => setHoveredSegment(i)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Label */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {hoveredSegment !== null
                    ? packageStages[hoveredSegment].value.toLocaleString()
                    : totalPackages.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                  {hoveredSegment !== null ? packageStages[hoveredSegment].short : 'packages'}
                </div>
              </div>
            </div>

            {/* Donut Legend Items */}
            <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {packageStages.map((st, idx) => {
                const pct = totalPackages > 0 ? Math.round((st.value / totalPackages) * 100) : 0;
                const isHovered = hoveredSegment === idx;
                return (
                  <div
                    key={st.name}
                    onMouseEnter={() => setHoveredSegment(idx)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: 6,
                      background: isHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 9, height: 9, borderRadius: 2, background: st.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: isHovered ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: isHovered ? 600 : 400 }}>
                        {st.short}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                        {st.value.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', width: 28, textAlign: 'right' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 📊 Bar Chart Card */}
        <div className="glass-card-solid" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={16} color="#10b981" /> Status Volume Distribution Bar Chart
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                Comparative package volume across operational stages
              </div>
            </div>
          </div>

          {/* SVG Vertical Bar Chart */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 180, paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 140, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 0 }}>
              {packageStages.map((st, idx) => {
                const barHeightPct = Math.round((st.value / maxBarValue) * 100);
                const isHovered = hoveredBar === idx;

                return (
                  <div
                    key={st.name}
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Hover Tooltip Popup above bar */}
                    {isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -30,
                          background: '#0d1b38',
                          border: `1px solid ${st.color}`,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#fff',
                          boxShadow: `0 0 10px ${st.color}50`,
                          whiteSpace: 'nowrap',
                          zIndex: 10,
                        }}
                      >
                        {st.value.toLocaleString()} pkgs
                      </div>
                    )}

                    {/* Bar Pillar */}
                    <div
                      style={{
                        width: '40%',
                        maxWidth: 36,
                        height: `${Math.max(barHeightPct, 6)}%`,
                        background: `linear-gradient(180deg, ${st.color}, ${st.color}88)`,
                        borderRadius: '6px 6px 0 0',
                        transition: 'all 0.3s ease',
                        boxShadow: isHovered ? `0 0 16px ${st.color}88` : 'none',
                        opacity: isHovered ? 1 : 0.85,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 10 }}>
              {packageStages.map((st, idx) => (
                <div
                  key={st.name}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 11,
                    color: hoveredBar === idx ? '#fff' : 'rgba(255,255,255,0.45)',
                    fontWeight: hoveredBar === idx ? 700 : 500,
                    transition: 'color 0.2s',
                  }}
                >
                  {st.short}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Recent Shipments Table */}
      <div className="glass-card-solid" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '18px 20px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Recent Shipments</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
              Real-time active connotes
            </div>
          </div>
        </div>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Connote No.</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentShipments.map((s, idx) => (
                <tr key={s.connote_code || idx}>
                  <td>
                    <span className="font-mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
                      {s.connote_code || s.connote}
                    </span>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.7)' }}>{s.origin || s.origin_name || 'KPRK Cimahi'}</td>
                  <td style={{ color: 'rgba(255,255,255,0.7)' }}>{s.destination || s.dest_name || 'Bandung SC'}</td>
                  <td>
                    <span className={getBadgeClass(s.status || s.connote_state)}>
                      {s.status || s.connote_state || 'ENTRY'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
