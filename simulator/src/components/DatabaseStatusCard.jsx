import { useState } from 'react';
import { Database, Calendar, Trash2, RefreshCw, Truck, Layers, CheckCircle2, AlertCircle, Sparkles, Navigation, Gauge, ShieldCheck, Package, User, MapPin } from 'lucide-react';
import { sounds } from '../utils/sound.js';

export default function DatabaseStatusCard({
  stats,
  selectedDate,
  setSelectedDate,
  loading,
  onRefresh,
  onResetDate,
  selectedNopol,
  onSelectVehicle
}) {
  const [resetConfirming, setResetConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      sounds.playReset();
      await onResetDate(selectedDate);
      setResetConfirming(false);
    } finally {
      setResetting(false);
    }
  };

  const totalTransactions = stats?.total_transactions || 0;
  const fleet = stats?.fleet || [];

  const getTodayWibStr = () => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
    } catch (e) {
      return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    }
  };

  return (
    <div className="status-hub-container">
      {/* Top Banner: DB Connection & Date Picker */}
      <div className="status-hub-header">
        <div className="flex-between flex-wrap gap-14">
          <div className="flex-align gap-12">
            <div className="hub-badge-glow">
              <Database size={22} className="text-cyan" />
            </div>
            <div>
              <div className="flex-align gap-8">
                <h3 className="hub-title">MONGODB LIVE CLUSTER</h3>
                <span className="live-db-pill">
                  <span className="live-db-dot" /> CONNECTED (PORT 27017)
                </span>
              </div>
              <p className="hub-subtitle">
                Database: <span className="font-mono text-cyan text-bold">ipos5_reporting</span> • Multi-Fleet Telemetry
              </p>
            </div>
          </div>

          <div className="flex-align gap-10 flex-wrap">
            {/* Date Controller */}
            <div className="hub-date-box flex-align gap-8">
              <Calendar size={15} className="text-cyan" />
              <span className="text-dim" style={{ fontSize: 11, fontWeight: 700 }}>TANGGAL:</span>
              <input
                type="date"
                className="hub-date-input font-mono"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              {selectedDate !== getTodayWibStr() && (
                <button
                  type="button"
                  className="btn-today-pill"
                  onClick={() => setSelectedDate(getTodayWibStr())}
                  title="Kembali ke Tanggal Hari Ini"
                >
                  Hari Ini
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              className="btn-icon-square"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh Data dari MongoDB"
            >
              <RefreshCw size={16} className={loading ? 'spin text-cyan' : 'text-dim'} />
            </button>

            {/* Reset Database Button */}
            {!resetConfirming ? (
              <button
                className="btn-reset-ghost"
                onClick={() => setResetConfirming(true)}
                title="Kosongkan paket pada tanggal ini kembali ke 0"
              >
                <Trash2 size={14} /> Reset ke 0
              </button>
            ) : (
              <div className="reset-confirm-box flex-align gap-6">
                <button
                  className="btn-reset-confirm"
                  onClick={handleReset}
                  disabled={resetting}
                >
                  {resetting ? 'Mereset...' : 'Yakin Kosongkan?'}
                </button>
                <button
                  className="btn-reset-cancel"
                  onClick={() => setResetConfirming(false)}
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Metric Counter Bar */}
        <div className="global-metric-bar flex-between flex-wrap gap-12" style={{ marginTop: 16 }}>
          <div className="flex-align gap-10">
            <div className="metric-icon-wrap">
              <Layers size={18} className="text-emerald" />
            </div>
            <div>
              <div className="metric-label">TOTAL RESI TERSIMPAN DI DATABASE ({selectedDate})</div>
              <div className="metric-value font-mono text-emerald">
                {totalTransactions} <span className="metric-unit">Connotes</span>
              </div>
            </div>
          </div>

          <div className="flex-align gap-8" style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            <ShieldCheck size={15} className="text-cyan" />
            <span>3 Armada Aktif • 18 Kantor Pos Riil Terpetakan • Rute Final: SPP Bandung (40400)</span>
          </div>
        </div>
      </div>

      {/* 3 Fleet Telemetry Cards */}
      <div className="status-hub-body">
        <div className="fleet-cards-header flex-between mb-10">
          <span className="flex-align gap-6 text-bold" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
            <Truck size={15} className="text-cyan" /> 3 ARMADA KENDARAAN RUTE PANJANG (PILIH ARMADA UNTUK DISUNTIK):
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Klik kartu armada di bawah untuk memilih target suntik secara cepat
          </span>
        </div>

        <div className="fleet-telemetry-grid">
          {fleet.map((v) => {
            const utilPct = v.utilization_pct || 0;
            const isSelected = selectedNopol === v.nopol;
            const barColor = utilPct >= 100 ? '#ef4444' : utilPct >= 80 ? '#f59e0b' : '#0284c7';
            const loadKg = v.current_load_kg || 0;
            const maxKg = v.max_capacity_kg || 1500;
            const cargoCount = v.total_cargo_count || 0;

            return (
              <div
                key={v.nopol}
                className={`fleet-telemetry-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectVehicle && onSelectVehicle(v.nopol)}
              >
                {/* Top Row: Nopol, Type, & Cargo Count Badge */}
                <div className="flex-between mb-8">
                  <div className="flex-align gap-8">
                    <span className="fleet-nopol-badge font-mono">{v.nopol}</span>
                    <span className="fleet-route-pill">{v.route_id?.replace('RT-', '')}</span>
                  </div>
                  <span className="badge-cargo font-mono flex-align gap-4">
                    <Package size={11} /> {cargoCount} Paket
                  </span>
                </div>

                {/* Vehicle Name & Driver */}
                <div className="fleet-vehicle-name" title={v.nama_kendaraan}>
                  {v.nama_kendaraan}
                </div>
                <div className="fleet-driver-info flex-align gap-4 flex-wrap">
                  <User size={12} color="#64748b" />
                  <span>Sopir: <strong style={{ color: 'var(--text-primary)' }}>{v.driver}</strong></span>
                  <span>•</span>
                  <MapPin size={12} color="#64748b" />
                  <span>{v.home_base?.split('-')[1]?.trim() || v.home_base}</span>
                </div>

                {/* Progress Bar & Gauges */}
                <div className="fleet-progress-container" style={{ marginTop: 12 }}>
                  <div className="flex-between mb-4" style={{ fontSize: 11 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Muatan: <strong style={{ color: 'var(--text-primary)' }}>{loadKg} kg</strong> / {maxKg} kg
                    </span>
                    <span className="font-mono text-bold" style={{ color: barColor }}>
                      {utilPct}%
                    </span>
                  </div>

                  <div className="hub-progress-track">
                    <div
                      className="hub-progress-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, utilPct))}%`,
                        background: barColor
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Route Summary Tag */}
                <div className="fleet-card-footer flex-between" style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    7 Waypoints • Final: SPP Bandung
                  </span>
                  <span className="badge-status-ready">
                    {v.journey_status || 'READY'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
