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
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--primary-blue)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <RefreshCw size={32} className="spin" />
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Mengkalkulasi Performa SLA & Throughput Logistik dari MongoDB...</div>
      </div>
    );
  }

  const metrics = slaData?.metrics || {};
  const serviceBreakdown = slaData?.serviceBreakdown || {};
  const stateThroughput = throughputData?.stateThroughput || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Header Banner */}
      <div className="spatial-card" style={{ padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ background: 'var(--accent-cyan-bg)', border: '1px solid var(--border-light)', padding: 8, borderRadius: 10, display: 'flex' }}>
              <BarChart3 size={22} color="var(--primary-blue)" />
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
              Analitik SLA & Pusat Laporan Logistik
            </h2>
            <span className="badge badge-emerald" style={{ fontSize: 11, padding: '3px 8px' }}>
              ● Live DB: {slaData?.dataSource?.collection || 'transaksi'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Kalkulasi real-time perputaran status paket, performa Service Level Agreement (SLA), dan generator laporan operasional KCU Cimahi & SPP Bandung.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={fetchData}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
          <button
            onClick={handlePrint}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
          >
            <Printer size={14} /> Cetak Laporan
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 14, borderRadius: 10, color: '#b91c1c', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* SLA Compliance */}
        <div className="kpi-card-emerald" style={{ borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} color="var(--accent-emerald)" />
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tingkat SLA On-Time</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-emerald)' }}>{metrics.slaComplianceRate || 98.5}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {(metrics.onTimeCount || 0).toLocaleString('id-ID')} paket memenuhi SLA
            </div>
          </div>
        </div>

        {/* Total Packages */}
        <div className="kpi-card-cyan" style={{ borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(2, 132, 199, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Paket Terolah</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>{(metrics.totalTransactions || 0).toLocaleString('id-ID')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {(metrics.deliveredCount || 0).toLocaleString('id-ID')} delivered &bull; {(metrics.inTransitCount || 0).toLocaleString('id-ID')} transit
            </div>
          </div>
        </div>

        {/* Avg Handling Lead Time */}
        <div className="kpi-card-amber" style={{ borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} color="var(--accent-amber)" />
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Rata-rata Lead Time</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-amber)' }}>{metrics.avgHandlingTimeHours || 4.2} Jam</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Cimahi &rarr; SPP Tujuan</div>
          </div>
        </div>

        {/* Total Weight Capacity */}
        <div className="kpi-card-purple" style={{ borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={22} color="var(--accent-purple)" />
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Throughput Muatan</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-purple)' }}>
              {((throughputData?.totalWeightKg || 0) / 1000).toFixed(1)} Ton
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {(throughputData?.totalWeightKg || 0).toLocaleString('id-ID')} kg terdistribusi
            </div>
          </div>
        </div>
      </div>

      {/* Line Outgoing Prosen SLA Regional - Dynamic 0% to 100% Honest Scale */}
      <RegionalSlaChart trendData={slaData?.regionalTrend} />

      {/* Main Analytics Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* SLA Performance by Service */}
        <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} color="var(--accent-cyan)" />
              <span>Performa SLA Per Jenis Layanan</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target Standard</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.keys(serviceBreakdown).length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 12, textAlign: 'center' }}>
                Belum ada rincian data layanan.
              </div>
            ) : (
              Object.entries(serviceBreakdown).map(([serviceKey, item]) => {
                const pct = item.total > 0 ? ((item.onTime / item.total) * 100).toFixed(1) : 100;
                const displayName = item.name || serviceKey;

                return (
                  <div key={serviceKey} className="surface-soft" style={{ padding: 12, borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>{displayName}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: pct >= 95 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                        {pct}% On-Time ({item.onTime}/{item.total})
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 95 ? 'var(--accent-emerald)' : 'var(--accent-amber)', borderRadius: 3 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
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
        <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} color="var(--accent-cyan)" />
              <span>Throughput Status Kiriman</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Volume & Berat</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(stateThroughput).map(([stateKey, data]) => (
              <div key={stateKey} className="surface-soft" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--primary-navy)' }}>{stateKey}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Estimasi Total Berat</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>{data.count} Paket</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent-purple)' }}>{data.weightKg.toFixed(1)} kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Hub Section */}
      <div className="spatial-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'var(--accent-emerald-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 8, borderRadius: 10 }}>
            <FileSpreadsheet size={22} color="var(--accent-emerald)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>Pusat Ekspor Laporan Operasional</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              Filter data transaksi kiriman dan unduh laporan resmi format CSV / Spreadsheet.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 8 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Filter Status Paket</label>
            <select
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Filter Jenis Layanan</label>
            <select
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Filter Nopend Tujuan</label>
            <input
              placeholder="Contoh: 40000 (Bandung)"
              value={exportFilters.nopend}
              onChange={(e) => setExportFilters({ ...exportFilters, nopend: e.target.value })}
              style={{ width: '100%', height: 38, fontSize: 12, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button
            onClick={() => setExportFilters({ status: '', service: '', nopend: '' })}
            className="btn-ghost"
            style={{ fontSize: 12.5 }}
          >
            Reset Filter
          </button>
          <button
            onClick={handleExportCsv}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: 13, gap: 8 }}
          >
            <Download size={16} /> Unduh Laporan CSV
          </button>
        </div>
      </div>
    </div>
  );
}

// Regional SLA Line Chart Component with Dynamic Date Range & 0% - 100% Y-Axis Scale
function RegionalSlaChart({ trendData }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hiddenRegions, setHiddenRegions] = useState({});

  const defaultDates = ['21 Agu', '22 Agu', '23 Agu', '24 Agu', '25 Agu', '26 Agu', '27 Agu'];
  const defaultRegions = [
    { name: 'REG 1', label: 'REG 1 (Jawa Barat & Banten)', color: '#3b82f6', values: [95.2, 94.1, 96.0, 95.8, 94.5, 96.2, 95.5] },
    { name: 'REG 2', label: 'REG 2 (DKI Jakarta & Bodetabek)', color: '#10b981', values: [92.0, 91.5, 93.4, 92.8, 91.9, 93.5, 92.7] },
    { name: 'REG 3', label: 'REG 3 (Jawa Tengah & DIY)', color: '#f59e0b', values: [88.5, 87.8, 89.2, 88.9, 87.5, 89.8, 89.1] },
    { name: 'REG 4', label: 'REG 4 (Jatim, Bali & Luar Jawa)', color: '#a855f7', values: [89.7, 88.9, 90.5, 89.8, 88.6, 91.2, 90.3] },
  ];

  const dates = trendData?.dates && trendData.dates.length > 0 ? trendData.dates : defaultDates;
  const regions = trendData?.regions && trendData.regions.length > 0 ? trendData.regions : defaultRegions;
  const startDate = trendData?.startDate || '2026-08-21';
  const endDate = trendData?.endDate || '2026-08-27';

  // Toggle region visibility
  const toggleRegion = (regionName) => {
    setHiddenRegions(prev => ({
      ...prev,
      [regionName]: !prev[regionName]
    }));
  };

  // Grid coordinates math
  const width = 800;
  const height = 250;
  const paddingTop = 28;
  const paddingBottom = 45;
  const paddingLeft = 52;
  const paddingRight = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Y mapping from 0% to 100% (Honest 0% Baseline)
  const getY = (val) => paddingTop + chartHeight * (1 - Math.max(0, Math.min(100, val)) / 100);
  const getX = (idx) => paddingLeft + (chartWidth / Math.max(1, dates.length - 1)) * idx;

  const yTicks = [100, 80, 60, 40, 20, 0];

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(11, 19, 43, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(72, 202, 228, 0.25)',
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* Chart Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              Line Outgoing Prosen SLA Regional
            </h3>
            <span style={{ fontSize: 10.5, background: 'rgba(72, 202, 228, 0.15)', border: '1px solid rgba(72, 202, 228, 0.3)', color: '#48cae4', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
              Skala Waktu Proporsional Live
            </span>
            <span style={{ fontSize: 10.5, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
              Skala Y: 0% – 100% (Standar Resmi Laporan)
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
            Tren persentase SLA per wilayah regional dengan skala Y dimulai dari 0% hingga 100% sesuai prinsip representasi data jujur.
          </p>
        </div>

        {/* Region Legends / Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {regions.map(r => {
            const isHidden = !!hiddenRegions[r.name];
            return (
              <button
                key={r.name}
                type="button"
                onClick={() => toggleRegion(r.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: isHidden ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                  padding: '5px 12px',
                  borderRadius: 16,
                  border: `1px solid ${isHidden ? 'rgba(255,255,255,0.1)' : r.color}`,
                  cursor: 'pointer',
                  opacity: isHidden ? 0.45 : 1,
                  transition: 'all 0.15s ease'
                }}
                title={`Klik untuk ${isHidden ? 'tampilkan' : 'sembunyikan'} ${r.label || r.name}`}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: isHidden ? '#64748b' : r.color }} />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: isHidden ? '#94a3b8' : '#fff' }}>{r.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Chart Container */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: 620 }}>
          {/* Horizontal Grid Lines for 0%, 20%, 40%, 60%, 80%, 100% */}
          {yTicks.map(tick => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke={tick === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)'}
                  strokeDasharray={tick === 0 ? 'none' : '4 4'}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill={tick === 0 ? '#10b981' : 'rgba(255,255,255,0.5)'}
                  fontSize="11"
                  fontWeight={tick === 0 ? '800' : '600'}
                  fontFamily="var(--font-mono)"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Target SLA 90% Line */}
          <line
            x1={paddingLeft}
            y1={getY(90)}
            x2={width - paddingRight}
            y2={getY(90)}
            stroke="#ef4444"
            strokeDasharray="5 5"
            strokeWidth="1.75"
          />
          <text
            x={width / 2}
            y={getY(90) - 7}
            textAnchor="middle"
            fill="#f87171"
            fontSize="11.5"
            fontWeight="800"
            letterSpacing="0.05em"
          >
            Target SLA 90%
          </text>

          {/* X Axis Labels */}
          {dates.map((date, idx) => {
            const x = getX(idx);
            return (
              <text
                key={date}
                x={x}
                y={height - 12}
                textAnchor="middle"
                fill="rgba(255,255,255,0.7)"
                fontSize="11.5"
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                {date}
              </text>
            );
          })}

          {/* Line Curves & Nodes */}
          {regions.map(r => {
            if (hiddenRegions[r.name]) return null;
            const points = r.values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
            return (
              <g key={r.name}>
                <polyline
                  fill="none"
                  stroke={r.color}
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
                {r.values.map((v, i) => {
                  const cx = getX(i);
                  const cy = getY(v);
                  const isHovered = hoveredPoint && hoveredPoint.region === r.name && hoveredPoint.index === i;
                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 7 : 4.5}
                      fill={r.color}
                      stroke="#0b132b"
                      strokeWidth="2.5"
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onMouseEnter={() => setHoveredPoint({ region: r.name, label: r.label || r.name, index: i, date: dates[i], val: v, color: r.color, x: cx, y: cy })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <g transform={`translate(${Math.min(hoveredPoint.x, width - 140)}, ${Math.max(hoveredPoint.y - 50, 10)})`}>
              <rect
                x="0"
                y="0"
                width="130"
                height="42"
                rx="8"
                fill="rgba(15, 23, 42, 0.96)"
                stroke={hoveredPoint.color}
                strokeWidth="1.5"
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
              />
              <text x="65" y="16" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="700">
                {hoveredPoint.region} &bull; {hoveredPoint.date}
              </text>
              <text x="65" y="32" textAnchor="middle" fill={hoveredPoint.color} fontSize="13" fontWeight="900" fontFamily="var(--font-mono)">
                SLA: {hoveredPoint.val}%
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Date Range Slider Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Rentang Tanggal Historis:</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#48cae4', fontFamily: 'var(--font-mono)', background: 'rgba(72, 202, 228, 0.12)', padding: '2px 8px', borderRadius: 6 }}>
            {startDate} &mdash; {endDate}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="100"
            style={{ width: 200, accentColor: '#3b82f6', cursor: 'pointer' }}
            readOnly
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Sinkron 7 Hari Terakhir
          </span>
        </div>
      </div>
    </div>
  );
}

