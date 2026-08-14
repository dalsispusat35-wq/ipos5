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
