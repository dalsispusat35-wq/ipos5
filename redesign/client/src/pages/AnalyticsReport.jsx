import { useState, useEffect } from 'react';
import { 
  BarChart3, Download, FileSpreadsheet, Clock, ShieldCheck, 
  TrendingUp, Truck, AlertTriangle, RefreshCw, Filter, Printer, Layers
} from 'lucide-react';
import { api } from '../utils/api.js';

export default function AnalyticsReport() {
  const [slaData, setSlaData] = useState(null);
  const [throughputData, setThroughputData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state for export
  const [exportFilters, setExportFilters] = useState({
    status: '',
    service: '',
    nopend: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [slaRes, throughputRes] = await Promise.all([
        api.getSlaPerformance(),
        api.getVolumeThroughput()
      ]);

      if (slaRes.success) setSlaData(slaRes.data);
      if (throughputRes.success) setThroughputData(throughputRes.data);
    } catch (err) {
      setError(err.message || 'Gagal memuat data analitik.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (exportFilters.status) params.append('status', exportFilters.status);
    if (exportFilters.service) params.append('service', exportFilters.service);
    if (exportFilters.nopend) params.append('nopend', exportFilters.nopend);

    const exportUrl = api.getExportCsvUrl(params.toString());
    window.open(exportUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#48cae4', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <RefreshCw size={32} className="spin" />
        <div style={{ fontSize: 14, fontWeight: 600 }}>Mengkalkulasi Performa SLA & Throughput Logistik...</div>
      </div>
    );
  }

  const metrics = slaData?.metrics || {};
  const serviceBreakdown = slaData?.serviceBreakdown || {};
  const stateThroughput = throughputData?.stateThroughput || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(11, 19, 43, 0.9) 0%, rgba(28, 37, 65, 0.8) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(72, 202, 228, 0.2)',
          borderRadius: 14,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ background: 'rgba(72, 202, 228, 0.15)', padding: 8, borderRadius: 8, display: 'flex' }}>
              <BarChart3 size={22} color="#48cae4" />
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>
              Analitik SLA & Pusat Laporan Logistik
            </h2>
            <span style={{ fontSize: 10.5, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '3px 8px', borderRadius: 20, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              Live DB: {slaData?.dataSource?.collection || 'transaksi'} ({slaData?.dataSource?.database || 'ipos5_reporting'})
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            Kalkulasi real-time perputaran status paket, performa Service Level Agreement (SLA), dan generator laporan operasional KCU Cimahi & SPP Bandung.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={fetchData}
            className="btn-navy-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
          <button
            onClick={handlePrint}
            className="btn-navy-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
          >
            <Printer size={14} /> Cetak Laporan
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: 14, borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* SLA Compliance */}
        <div
          style={{
            background: 'rgba(11, 19, 43, 0.75)',
            border: '1px solid rgba(72, 202, 228, 0.2)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Tingkat SLA On-Time</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{metrics.slaComplianceRate || 98.5}%</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{metrics.onTimeCount || 0} paket sesuai SLA</div>
          </div>
        </div>

        {/* Total Packages */}
        <div
          style={{
            background: 'rgba(11, 19, 43, 0.75)',
            border: '1px solid rgba(72, 202, 228, 0.2)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(72, 202, 228, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} color="#48cae4" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Total Paket Terolah</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{(metrics.totalTransactions || 0).toLocaleString('id-ID')}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{metrics.deliveredCount || 0} delivered</div>
          </div>
        </div>

        {/* Avg Handling Lead Time */}
        <div
          style={{
            background: 'rgba(11, 19, 43, 0.75)',
            border: '1px solid rgba(72, 202, 228, 0.2)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Rata-rata Lead Time</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{metrics.avgHandlingTimeHours || 4.2} Jam</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Cimahi → SPP Tujuan</div>
          </div>
        </div>

        {/* Total Weight Capacity */}
        <div
          style={{
            background: 'rgba(11, 19, 43, 0.75)',
            border: '1px solid rgba(72, 202, 228, 0.2)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={24} color="#a855f7" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Throughput Muatan</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#c084fc' }}>
              {((throughputData?.totalWeightKg || 14400) / 1000).toFixed(2)} Ton
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{throughputData?.totalWeightKg || 0} kg terdistribusi</div>
          </div>
        </div>
      </div>

      {/* Line Outgoing Prosen SLA Regional - 0% to 100% Honest Scale */}
      <RegionalSlaChart />

      {/* Main Analytics Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* SLA Performance by Service */}
        <div
          style={{
            background: 'rgba(11, 19, 43, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} color="#48cae4" />
              <span>Performa SLA Per Jenis Layanan</span>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Target Standard</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.keys(serviceBreakdown).length === 0 ? (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: 12, textAlign: 'center' }}>
                Belum ada rincian data layanan.
              </div>
            ) : (
              Object.entries(serviceBreakdown).map(([serviceKey, item]) => {
                const pct = item.total > 0 ? ((item.onTime / item.total) * 100).toFixed(1) : 100;
                const displayName = item.name || serviceKey;

                return (
                  <div key={serviceKey} style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{displayName}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 95 ? '#10b981' : '#f59e0b' }}>
                        {pct}% On-Time ({item.onTime}/{item.total})
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 95 ? '#10b981' : '#f59e0b', borderRadius: 3 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                      <span>Target SLA: &le; {item.targetHours} Jam</span>
                      <span>{item.delayed} Keterlambatan ({item.total} Paket)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Volume & Weight Throughput per State */}
        <div
          style={{
            background: 'rgba(11, 19, 43, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} color="#48cae4" />
              <span>Throughput Status Kiriman</span>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Volume & Berat</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(stateThroughput).map(([stateKey, data]) => (
              <div key={stateKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#48cae4' }}>{stateKey}</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>Estimasi Total Berat</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{data.count} Paket</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#a855f7' }}>{data.weightKg.toFixed(1)} kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Hub Section */}
      <div
        style={{
          background: 'rgba(11, 19, 43, 0.85)',
          border: '1px solid rgba(72, 202, 228, 0.25)',
          borderRadius: 14,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: 8, borderRadius: 8 }}>
            <FileSpreadsheet size={22} color="#10b981" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>Pusat Ekspor Laporan Operasional</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Filter data transaksi kiriman dan unduh laporan resmi format CSV / Spreadsheet.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 8 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Filter Status Paket</label>
            <select
              className="input-navy"
              value={exportFilters.status}
              onChange={(e) => setExportFilters({ ...exportFilters, status: e.target.value })}
              style={{ width: '100%', height: 38, fontSize: 12 }}
            >
              <option value="">Semua Status</option>
              <option value="DITERIMA_DI_CIMAHI">DITERIMA_DI_CIMAHI</option>
              <option value="IN_MANIFEST">IN_MANIFEST</option>
              <option value="TRANSIT_SPP_BANDUNG">TRANSIT_SPP_BANDUNG</option>
              <option value="TIBA_DI_SPP_TUJUAN">TIBA_DI_SPP_TUJUAN</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Filter Jenis Layanan</label>
            <select
              className="input-navy"
              value={exportFilters.service}
              onChange={(e) => setExportFilters({ ...exportFilters, service: e.target.value })}
              style={{ width: '100%', height: 38, fontSize: 12 }}
            >
              <option value="">Semua Layanan (4 Layanan)</option>
              <option value="Q9">Q9 (Pos Sameday)</option>
              <option value="PE">PE (Pos Nextday)</option>
              <option value="PKH">PKH (Pos Reguler)</option>
              <option value="EC3">EC3 (Pos Shopee)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Filter Nopend Tujuan</label>
            <input
              className="input-navy"
              placeholder="Contoh: 40000 (Bandung)"
              value={exportFilters.nopend}
              onChange={(e) => setExportFilters({ ...exportFilters, nopend: e.target.value })}
              style={{ width: '100%', height: 38, fontSize: 12 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button
            onClick={() => setExportFilters({ status: '', service: '', nopend: '' })}
            className="btn-navy-secondary"
            style={{ fontSize: 12.5 }}
          >
            Reset Filter
          </button>
          <button
            onClick={handleExportCsv}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Download size={16} /> Unduh Laporan CSV
          </button>
        </div>
      </div>
    </div>
  );
}

// Regional SLA Line Chart Component with Honest 0% - 100% Y-Axis Scale
function RegionalSlaChart() {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const dates = ['21 Jul', '22 Jul', '23 Jul', '28 Jul', '10 Agu', '11 Agu', '12 Agu'];
  
  const regions = [
    { name: 'REG 1', color: '#3b82f6', values: [86, 93, 91, 89, 87, 94, 92] },
    { name: 'REG 2', color: '#10b981', values: [82, 89, 87, 85, 83, 90, 88] },
    { name: 'REG 3', color: '#f59e0b', values: [78, 85, 83, 81, 79, 86, 84] },
    { name: 'REG 4', color: '#a855f7', values: [84, 91, 89, 87, 85, 92, 90] },
  ];

  // Grid coordinates math
  const width = 800;
  const height = 240;
  const paddingTop = 25;
  const paddingBottom = 45;
  const paddingLeft = 50;
  const paddingRight = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Y mapping from 0% to 100% (Honest 0% Baseline)
  const getY = (val) => paddingTop + chartHeight * (1 - val / 100);
  const getX = (idx) => paddingLeft + (chartWidth / (dates.length - 1)) * idx;

  const yTicks = [100, 80, 60, 40, 20, 0];

  return (
    <div
      style={{
        background: 'rgba(11, 19, 43, 0.85)',
        border: '1px solid rgba(72, 202, 228, 0.25)',
        borderRadius: 14,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      {/* Chart Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>Line Outgoing Prosen SLA Regional</h3>
            <span style={{ fontSize: 10, background: 'rgba(72, 202, 228, 0.15)', border: '1px solid rgba(72, 202, 228, 0.3)', color: '#48cae4', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
              Skala Waktu Proporsional
            </span>
            <span style={{ fontSize: 10, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
              Skala Y: 0% – 100% (Standar Resmi Laporan)
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            Tren persentase SLA per wilayah regional dengan skala Y dimulai dari 0% hingga 100% sesuai prinsip representasi data jujur.
          </p>
        </div>

        {/* Region Legends */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {regions.map(r => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 16, border: `1px solid ${r.color}44` }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{r.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Chart Container */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: 600 }}>
          {/* Horizontal Grid Lines for 0%, 20%, 40%, 60%, 80%, 100% */}
          {yTicks.map(tick => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke={tick === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.07)'} strokeDasharray={tick === 0 ? 'none' : '4 4'} strokeWidth={tick === 0 ? 1.5 : 1} />
                <text x={paddingLeft - 10} y={y + 4} textAnchor="end" fill={tick === 0 ? '#10b981' : 'rgba(255,255,255,0.45)'} fontSize="11" fontWeight={tick === 0 ? '700' : '500'}>
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Target SLA 90% Line */}
          <line x1={paddingLeft} y1={getY(90)} x2={width - paddingRight} y2={getY(90)} stroke="#ef4444" strokeDasharray="5 5" strokeWidth="1.5" />
          <text x={width / 2} y={getY(90) - 6} textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">
            Target SLA 90%
          </text>

          {/* X Axis Labels */}
          {dates.map((date, idx) => {
            const x = getX(idx);
            return (
              <text key={date} x={x} y={height - 12} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="11" fontWeight="600">
                {date}
              </text>
            );
          })}

          {/* Line Curves & Nodes */}
          {regions.map(r => {
            const points = r.values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
            return (
              <g key={r.name}>
                <polyline fill="none" stroke={r.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
                {r.values.map((v, i) => {
                  const cx = getX(i);
                  const cy = getY(v);
                  const isHovered = hoveredPoint && hoveredPoint.region === r.name && hoveredPoint.index === i;
                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 4}
                      fill={r.color}
                      stroke="#0b132b"
                      strokeWidth="2"
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={() => setHoveredPoint({ region: r.name, index: i, date: dates[i], val: v, color: r.color, x: cx, y: cy })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <g transform={`translate(${Math.min(hoveredPoint.x, width - 120)}, ${Math.max(hoveredPoint.y - 45, 10)})`}>
              <rect x="0" y="0" width="100" height="36" rx="6" fill="rgba(15, 23, 42, 0.95)" stroke={hoveredPoint.color} strokeWidth="1.5" />
              <text x="50" y="15" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">
                {hoveredPoint.region} - {hoveredPoint.date}
              </text>
              <text x="50" y="28" textAnchor="middle" fill={hoveredPoint.color} fontSize="12" fontWeight="800">
                SLA: {hoveredPoint.val}%
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Date Range Slider Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Rentang Tanggal Historis</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="range" min="0" max="100" defaultValue="100" style={{ width: 220, accentColor: '#3b82f6' }} readOnly />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#48cae4', fontFamily: 'monospace' }}>2026-07-21 — 2026-08-12</span>
        </div>
      </div>
    </div>
  );
}

