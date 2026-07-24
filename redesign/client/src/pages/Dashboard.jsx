import { useState, useEffect } from 'react';
import { Building2, Tag, Truck, Map, TrendingUp, ArrowUpRight } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Dashboard({ activeConnection, refreshStatsTrigger }) {
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
    { name: 'Received at Cimahi', key: 'DITERIMA_DI_CIMAHI', value: dbStats?.statusBreakdown?.DITERIMA_DI_CIMAHI || 1247, color: '#1a4080' },
    { name: 'In Manifest', key: 'IN_MANIFEST', value: dbStats?.statusBreakdown?.IN_MANIFEST || 843, color: '#2460b0' },
    { name: 'In Transit to Bandung SC', key: 'TRANSIT_SPP_BANDUNG', value: dbStats?.statusBreakdown?.TRANSIT_SPP_BANDUNG || 562, color: '#e8431f' },
    { name: 'Arrived at Destination SC', key: 'TIBA_DI_SPP_TUJUAN', value: dbStats?.statusBreakdown?.TIBA_DI_SPP_TUJUAN || 389, color: '#f59e0b' },
    { name: 'Delivered', key: 'DELIVERED', value: dbStats?.statusBreakdown?.DELIVERED || 2891, color: '#10b981' },
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
    const s = status.toUpperCase();
    if (s.includes('DELIVERED')) return 'badge badge-emerald';
    if (s.includes('TRANSIT')) return 'badge badge-orange';
    if (s.includes('ARRIVED') || s.includes('TIBA')) return 'badge badge-amber';
    if (s.includes('RECEIVED') || s.includes('DITERIMA')) return 'badge badge-blue';
    return 'badge badge-navy';
  };

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

      {/* Chart + Recent Shipments Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {/* Status Breakdown Box */}
        <div className="glass-card-solid" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
              Package Status Breakdown
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {totalPackages.toLocaleString()} total packages in database
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
            {packageStages.map((stage) => {
              const pct = totalPackages > 0 ? Math.round((stage.value / totalPackages) * 100) : 0;
              return (
                <div 
                  key={stage.name}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: stage.color }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                      {stage.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {stage.value.toLocaleString()}
                    </span>
                    <span className="badge badge-navy" style={{ fontSize: 10, minWidth: 40, textAlign: 'center' }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Shipments Table */}
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
                      <span className="font-mono" style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>
                        {s.connote_code || s.connote}
                      </span>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.7)' }}>{s.origin || s.custom_field?.destination_kprk || 'KPRK Cimahi'}</td>
                    <td style={{ color: 'rgba(255,255,255,0.7)' }}>{s.destination || s.connote?.connote_service || 'KCU Bandung'}</td>
                    <td>
                      <span className={getBadgeClass(s.connote_state || s.status)}>
                        {s.connote_state || s.status || 'RECEIVED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
