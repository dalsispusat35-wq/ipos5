import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import {
  Truck, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw,
  Play, StopCircle, CheckSquare, Layers, Scale, XCircle, Info, ShieldAlert
} from 'lucide-react';
import './RouteJourney.css';

const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0
});

export default function RouteJourney() {
  const [activeJourney, setActiveJourney] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [simulationData, setSimulationData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('cargo'); // 'cargo' | 'rejected' | 'diagnostics'

  // Action confirmation state
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, title: '', message: '' });

  // Fetch current journey on mount
  const fetchCurrentJourney = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getActiveRouteJourney('B 9910 PCX');
      if (res.success && res.data) {
        setActiveJourney(res.data);
        setRouteStops(res.routeStops || []);
        setDiagnostics(res.diagnostics || null);
      } else {
        setActiveJourney(null);
        // Load default route stops if no active journey
        const simRes = await api.simulateMilkRun();
        if (simRes.success && simRes.data) {
          setSimulationData(simRes.data);
          setRouteStops(simRes.data.stops || []);
          setDiagnostics(simRes.data.diagnostics || null);
        }
      }
    } catch (err) {
      console.error('Error fetching journey:', err);
      setErrorMsg(err.message || 'Gagal memuat data journey.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentJourney();
  }, []);

  // Run Simulation (Dry-Run)
  const handleSimulate = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.simulateMilkRun();
      if (res.success && res.data) {
        setSimulationData(res.data);
        setSuccessMsg('Simulasi berhasil dijalankan (Dry Run — Tidak ada perubahan database).');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menjalankan simulasi.');
    } finally {
      setLoading(false);
    }
  };

  // Create Journey
  const executeCreateJourney = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.createRouteJourney({ route_id: 'RT-MALAM-B9910-PCX', vehicle_nopol: 'B 9910 PCX' });
      if (res.success && res.data) {
        setActiveJourney(res.data);
        setSimulationData(null);
        setSuccessMsg(`Journey "${res.data.journey_id}" berhasil dibuat dengan status READY.`);
        await fetchCurrentJourney();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membuat journey.');
    } finally {
      setLoading(false);
    }
  };

  // Start Journey
  const executeStartJourney = async () => {
    if (!activeJourney) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.startRouteJourney(activeJourney.journey_id);
      if (res.success && res.data) {
        setActiveJourney(res.data);
        setSuccessMsg(`Perjalanan "${activeJourney.journey_id}" dimulai (IN_PROGRESS).`);
        await fetchCurrentJourney();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memulai journey.');
    } finally {
      setLoading(false);
    }
  };

  // Process Next Stop
  const executeProcessNextStop = async () => {
    if (!activeJourney) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const nextSeq = (activeJourney.processed_stops?.length || 0) + 1;
    const idempotencyKey = `IDEMP-${activeJourney.journey_id}-SEQ-${nextSeq}-${Date.now()}`;

    try {
      const res = await api.processRouteJourneyStop(activeJourney.journey_id, nextSeq, idempotencyKey);
      if (res.success && res.data) {
        setActiveJourney(res.data);
        setSuccessMsg(`Titik seq ${nextSeq} (${res.stopResult?.officeName}) berhasil diproses!`);
        await fetchCurrentJourney();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses titik stop.');
    } finally {
      setLoading(false);
    }
  };

  // Complete Journey
  const executeCompleteJourney = async () => {
    if (!activeJourney) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.completeRouteJourney(activeJourney.journey_id);
      if (res.success && res.data) {
        setActiveJourney(res.data);
        setSuccessMsg(`Perjalanan "${activeJourney.journey_id}" SELESAI di SPP Bandung 40400!`);
        await fetchCurrentJourney();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyelesaikan journey.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel Journey
  const executeCancelJourney = async () => {
    if (!activeJourney) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.cancelRouteJourney(activeJourney.journey_id, 'Dibatalkan oleh operator');
      if (res.success && res.data) {
        setActiveJourney(res.data);
        setSuccessMsg(`Perjalanan "${activeJourney.journey_id}" telah DIBATALKAN.`);
        await fetchCurrentJourney();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membatalkan journey.');
    } finally {
      setLoading(false);
    }
  };

  // Action confirm modal handler
  const openConfirm = (action, title, message) => {
    setConfirmModal({ open: true, action, title, message });
  };

  const handleConfirmAction = async () => {
    const action = confirmModal.action;
    setConfirmModal({ open: false, action: null, title: '', message: '' });
    if (action === 'CREATE') await executeCreateJourney();
    if (action === 'START') await executeStartJourney();
    if (action === 'PROCESS') await executeProcessNextStop();
    if (action === 'COMPLETE') await executeCompleteJourney();
    if (action === 'CANCEL') await executeCancelJourney();
  };

  // Calculations
  const maxCapacityKg = activeJourney?.maximum_capacity_kg || simulationData?.vehicle?.maximumCapacityKg || 1500;
  const currentLoadKg = activeJourney ? (activeJourney.current_load_kg || 0) : 0;
  const remainingCapKg = maxCapacityKg - currentLoadKg;
  const capacityUsedPercent = Number(((currentLoadKg / maxCapacityKg) * 100).toFixed(2));

  // Determine stop status for flowchart
  const getStopStatus = (stop) => {
    if (!activeJourney) {
      return { status: 'PENDING', isCurrent: false, isCompleted: false };
    }
    const processedList = activeJourney.processed_stops || [];
    const isCompleted = processedList.some(ps => ps.seq === stop.seq);
    const nextExpectedSeq = processedList.length + 1;
    const isCurrent = (stop.seq === nextExpectedSeq) && activeJourney.status === 'IN_PROGRESS';

    if (isCompleted) return { status: 'COMPLETED', isCurrent: false, isCompleted: true };
    if (isCurrent) return { status: 'CURRENT', isCurrent: true, isCompleted: false };
    return { status: 'PENDING', isCurrent: false, isCompleted: false };
  };

  // Current and Next stop info
  const processedCount = activeJourney?.processed_stops?.length || 0;
  const currentStopObj = routeStops[processedCount - 1] || null;
  const nextStopObj = routeStops[processedCount] || null;

  return (
    <div className="route-journey-container">
      {/* Notifications */}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#F87171', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Error:</strong> {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34D399', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={20} />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Header Info Card */}
      <div className="route-journey-header-card">
        <div className="route-journey-header-top">
          <div className="route-journey-header-title">
            <Truck size={32} style={{ color: 'var(--rj-accent-cyan)' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#F8FAFC' }}>
                Dynamic Capacity Routing — Milk Run
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--rj-text-muted)', marginTop: '2px' }}>
                Operational Pickup Malam (16.00 – 21.00 WIB) &rarr; Destination: SPP BANDUNG 40400
              </div>
            </div>
          </div>
          <div>
            <span className={`route-journey-badge route-journey-badge-${(activeJourney?.status || 'IDLE').toLowerCase()}`}>
              {activeJourney?.status || (simulationData ? 'SIMULATION MODE' : 'NO ACTIVE JOURNEY')}
            </span>
          </div>
        </div>

        <div className="route-journey-meta-grid">
          <div className="route-journey-meta-item">
            <span className="route-journey-meta-label">Journey ID</span>
            <span className="route-journey-meta-value" style={{ color: 'var(--rj-accent-cyan)' }}>
              {activeJourney?.journey_id || '-'}
            </span>
          </div>
          <div className="route-journey-meta-item">
            <span className="route-journey-meta-label">Nopol Kendaraan</span>
            <span className="route-journey-meta-value">B 9910 PCX</span>
          </div>
          <div className="route-journey-meta-item">
            <span className="route-journey-meta-label">Route ID</span>
            <span className="route-journey-meta-value">RT-MALAM-B9910-PCX</span>
          </div>
          <div className="route-journey-meta-item">
            <span className="route-journey-meta-label">Shift & Jam</span>
            <span className="route-journey-meta-value">MALAM (16:00 – 21:00)</span>
          </div>
          <div className="route-journey-meta-item">
            <span className="route-journey-meta-label">Titik Saat Ini</span>
            <span className="route-journey-meta-value">
              {currentStopObj ? `${currentStopObj.officeName} (seq ${currentStopObj.seq})` : 'Belum Berangkat'}
            </span>
          </div>
          <div className="route-journey-meta-item">
            <span className="route-journey-meta-label">Titik Berikutnya</span>
            <span className="route-journey-meta-value" style={{ color: 'var(--rj-accent-yellow)' }}>
              {nextStopObj ? `${nextStopObj.officeName} (seq ${nextStopObj.seq})` : (processedCount === routeStops.length ? 'Tiba di Tujuan Akhir' : '-')}
            </span>
          </div>
        </div>
      </div>

      {/* Control Action Buttons */}
      <div className="route-journey-controls">
        <button
          className="route-journey-btn route-journey-btn-secondary"
          onClick={handleSimulate}
          disabled={loading}
        >
          <Layers size={16} />
          Simulasikan (Dry Run)
        </button>

        {!activeJourney && (
          <button
            className="route-journey-btn route-journey-btn-primary"
            onClick={() => openConfirm('CREATE', 'Buat Journey Baru', 'Apakah Anda yakin ingin membuat perjalan (Journey) baru untuk B 9910 PCX?')}
            disabled={loading}
          >
            <Play size={16} />
            Buat Journey
          </button>
        )}

        {activeJourney && (activeJourney.status === 'READY' || activeJourney.status === 'DRAFT') && (
          <button
            className="route-journey-btn route-journey-btn-primary"
            onClick={() => openConfirm('START', 'Mulai Perjalanan', 'Apakah Anda yakin ingin memulai perjalanan kendaraan B 9910 PCX?')}
            disabled={loading}
          >
            <Play size={16} />
            Mulai Perjalanan
          </button>
        )}

        {activeJourney && activeJourney.status === 'IN_PROGRESS' && nextStopObj && (
          <button
            className="route-journey-btn route-journey-btn-primary"
            onClick={() => openConfirm('PROCESS', 'Proses Titik Berikutnya', `Apakah Anda yakin ingin memproses muat/bongkar di titik seq ${nextStopObj.seq} (${nextStopObj.officeName})?`)}
            disabled={loading}
          >
            <ArrowRight size={16} />
            Proses Titik Berikutnya ({nextStopObj.officeName})
          </button>
        )}

        {activeJourney && activeJourney.status === 'IN_PROGRESS' && processedCount === routeStops.length && (
          <button
            className="route-journey-btn route-journey-btn-primary"
            style={{ background: '#10B981', color: '#FFFFFF' }}
            onClick={() => openConfirm('COMPLETE', 'Selesaikan Perjalanan', 'Apakah Anda yakin ingin menyelesaikan perjalanan di SPP Bandung 40400?')}
            disabled={loading}
          >
            <CheckSquare size={16} />
            Selesaikan Perjalanan
          </button>
        )}

        {activeJourney && (activeJourney.status === 'READY' || activeJourney.status === 'IN_PROGRESS') && (
          <button
            className="route-journey-btn route-journey-btn-danger"
            onClick={() => openConfirm('CANCEL', 'Batalkan Perjalanan', 'Apakah Anda yakin ingin membatalkan journey ini?')}
            disabled={loading}
          >
            <XCircle size={16} />
            Batalkan Journey
          </button>
        )}

        <button
          className="route-journey-btn route-journey-btn-secondary"
          onClick={fetchCurrentJourney}
          disabled={loading}
          style={{ marginLeft: 'auto' }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="route-journey-metrics-grid">
        <div className="route-journey-metric-card">
          <div className="route-journey-metric-icon">
            <Scale size={24} />
          </div>
          <div className="route-journey-metric-info">
            <span className="route-journey-meta-label">Kapasitas Maksimal</span>
            <span className="route-journey-metric-val">{numberFormatter.format(maxCapacityKg)} kg</span>
          </div>
        </div>

        <div className="route-journey-metric-card">
          <div className="route-journey-metric-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
            <Truck size={24} />
          </div>
          <div className="route-journey-metric-info">
            <span className="route-journey-meta-label">Muatan Aktif</span>
            <span className="route-journey-metric-val" style={{ color: '#38BDF8' }}>
              {numberFormatter.format(currentLoadKg)} kg
            </span>
          </div>
        </div>

        <div className="route-journey-metric-card">
          <div className="route-journey-metric-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--rj-accent-yellow)' }}>
            <Info size={24} />
          </div>
          <div className="route-journey-metric-info">
            <span className="route-journey-meta-label">Sisa Kapasitas</span>
            <span className="route-journey-metric-val" style={{ color: 'var(--rj-accent-yellow)' }}>
              {numberFormatter.format(remainingCapKg)} kg
            </span>
          </div>
        </div>

        <div className="route-journey-metric-card">
          <div className="route-journey-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
            <Layers size={24} />
          </div>
          <div className="route-journey-metric-info">
            <span className="route-journey-meta-label">Jumlah Cargo Aktif</span>
            <span className="route-journey-metric-val" style={{ color: '#34D399' }}>
              {activeJourney?.cargo?.length || 0} Paket
            </span>
          </div>
        </div>
      </div>

      {/* Dual Capacity Progress Bar */}
      <div className="route-journey-capacity-card">
        <div className="route-journey-capacity-header">
          <span style={{ fontWeight: 700, fontSize: '15px' }}>Penggunaan Kapasitas Kendaraan</span>
          <span style={{ fontWeight: 700, color: capacityUsedPercent > 90 ? '#EF4444' : capacityUsedPercent > 70 ? 'var(--rj-accent-yellow)' : 'var(--rj-accent-cyan)' }}>
            {numberFormatter.format(currentLoadKg)} kg / {numberFormatter.format(maxCapacityKg)} kg ({capacityUsedPercent}%)
          </span>
        </div>
        <div className="route-journey-progress-track">
          <div
            className={`route-journey-progress-fill ${capacityUsedPercent > 90 ? 'fill-danger' : capacityUsedPercent > 70 ? 'fill-yellow' : 'fill-cyan'}`}
            style={{ width: `${Math.min(100, capacityUsedPercent)}%` }}
          ></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--rj-text-muted)' }}>
          <span>Sisa Kapasitas: {numberFormatter.format(remainingCapKg)} kg</span>
          <span>Status Armada: B 9910 PCX (Mobil Box 1.5 Ton)</span>
        </div>
      </div>

      {/* Route Flowchart Visualization */}
      <div className="route-journey-flow-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Visualisasi Alur Rute Operasional (RT-MALAM-B9910-PCX)
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--rj-text-muted)' }}>
            Progress: {processedCount} / {routeStops.length} Stop Selesai
          </span>
        </div>

        <div className="route-journey-flow-track">
          {routeStops.map((stop, idx) => {
            const { status, isCurrent, isCompleted } = getStopStatus(stop);
            const processedData = activeJourney?.processed_stops?.find(ps => ps.seq === stop.seq);
            const simStopData = simulationData?.stops?.find(s => s.seq === stop.seq);

            const displayData = processedData || simStopData || null;

            return (
              <div key={stop.nopen} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className={`route-journey-stop-card ${isCurrent ? 'stop-current' : ''} ${isCompleted ? 'stop-completed' : ''}`}>
                  <div className="route-journey-stop-header">
                    <span className="route-journey-stop-seq">{stop.seq}</span>
                    <span className="route-journey-badge" style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {stop.role}
                    </span>
                  </div>

                  <div className="route-journey-stop-name" title={stop.officeName}>
                    {stop.officeName}
                  </div>
                  <div className="route-journey-stop-nopen">NOPEN: {stop.nopen}</div>

                  {isCurrent && (
                    <div className="route-journey-vehicle-anim" style={{ marginBottom: '10px' }}>
                      <Truck size={16} /> POSISI POS LAJU
                    </div>
                  )}

                  <div className="route-journey-stop-metrics">
                    <div>Turun: <strong>{displayData ? displayData.unloadedCount || displayData.unloaded_count || 0 : 0} resi</strong> ({numberFormatter.format(displayData ? displayData.unloadedWeightKg || displayData.unloaded_weight_kg || 0 : 0)} kg)</div>
                    <div>Naik: <strong>{displayData ? displayData.loadedCount || displayData.loaded_count || 0 : 0} resi</strong> ({numberFormatter.format(displayData ? displayData.loadedWeightKg || displayData.loaded_weight_kg || 0 : 0)} kg)</div>
                    <div style={{ marginTop: '4px', borderTop: '1px solid var(--rj-border)', paddingTop: '4px' }}>
                      Muatan Set: <strong>{numberFormatter.format(displayData ? displayData.loadAfterKg || displayData.load_after_kg || 0 : 0)} kg</strong>
                    </div>
                  </div>
                </div>

                {idx < routeStops.length - 1 && (
                  <div className="route-journey-arrow">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs & Detail Data Tables */}
      <div className="route-journey-table-card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--rj-border)', marginBottom: '16px', gap: '16px' }}>
          <button
            style={{
              padding: '10px 16px', background: 'none', border: 'none', color: activeTab === 'cargo' ? 'var(--rj-accent-cyan)' : 'var(--rj-text-muted)',
              borderBottom: activeTab === 'cargo' ? '2px solid var(--rj-accent-cyan)' : '2px solid transparent',
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onClick={() => setActiveTab('cargo')}
          >
            <Truck size={16} /> Cargo Aktif ({activeJourney?.cargo?.length || 0})
          </button>

          <button
            style={{
              padding: '10px 16px', background: 'none', border: 'none', color: activeTab === 'rejected' ? 'var(--rj-accent-yellow)' : 'var(--rj-text-muted)',
              borderBottom: activeTab === 'rejected' ? '2px solid var(--rj-accent-yellow)' : '2px solid transparent',
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onClick={() => setActiveTab('rejected')}
          >
            <ShieldAlert size={16} /> Log Kiriman Ditolak
          </button>

          <button
            style={{
              padding: '10px 16px', background: 'none', border: 'none', color: activeTab === 'diagnostics' ? '#38BDF8' : 'var(--rj-text-muted)',
              borderBottom: activeTab === 'diagnostics' ? '2px solid #38BDF8' : '2px solid transparent',
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onClick={() => setActiveTab('diagnostics')}
          >
            <Info size={16} /> Diagnostics PPT
          </button>
        </div>

        {activeTab === 'cargo' && (
          <div>
            {(!activeJourney?.cargo || activeJourney.cargo.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--rj-text-muted)' }}>
                Belum ada cargo yang dimuat di kendaraan saat ini.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="route-journey-table">
                  <thead>
                    <tr>
                      <th>No. Resi / Connote</th>
                      <th>Berat (kg)</th>
                      <th>Origin Nopen</th>
                      <th>Destination Nopen</th>
                      <th>Dimuat Di</th>
                      <th>Waktu Dimuat</th>
                      <th>Status State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeJourney.cargo.map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, color: 'var(--rj-accent-cyan)' }}>{item.connote_code}</td>
                        <td>{numberFormatter.format(item.weight_kg)} kg</td>
                        <td>{item.origin_nopen}</td>
                        <td>{item.destination_nopen}</td>
                        <td>{item.loaded_at_nopen}</td>
                        <td>{new Date(item.loaded_at).toLocaleString('id-ID')}</td>
                        <td><span className="route-journey-badge route-journey-badge-in_progress">INVEHICLE</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rejected' && (
          <div>
            <div style={{ padding: '8px 0', fontSize: '13px', color: 'var(--rj-text-muted)' }}>
              Log resi yang ditolak saat proses muat beserta alasan bisnis penolakannya:
            </div>
            <div style={{ overflowX: 'auto', marginTop: '12px' }}>
              <table className="route-journey-table">
                <thead>
                  <tr>
                    <th>No. Resi</th>
                    <th>Berat (kg)</th>
                    <th>Alasan Penolakan</th>
                  </tr>
                </thead>
                <tbody>
                  {activeJourney?.processed_stops?.flatMap(ps => ps.rejectedItems || []).length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--rj-text-muted)', padding: '24px' }}>
                        Tidak ada barang yang ditolak.
                      </td>
                    </tr>
                  ) : (
                    activeJourney?.processed_stops?.flatMap(ps => ps.rejectedItems || []).map((rej, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700 }}>{rej.connote_code}</td>
                        <td>{numberFormatter.format(rej.weight_kg)} kg</td>
                        <td style={{ color: 'var(--rj-accent-yellow)', fontWeight: 600 }}>{rej.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div style={{ fontSize: '13px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--rj-text-main)' }}>Titik PPT Slide 2 Tidak Dikonfigurasi di Database</h4>
            <div style={{ background: 'rgba(11, 25, 44, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid var(--rj-border)' }}>
              {(diagnostics?.pptSkippedPoints || []).map((pt, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: index < diagnostics.pptSkippedPoints.length - 1 ? '1px solid var(--rj-border)' : 'none' }}>
                  <span><strong>{pt.pointName}</strong></span>
                  <span style={{ color: 'var(--rj-accent-yellow)', fontWeight: 700 }}>{pt.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 25, 44, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--rj-bg-card)', border: '1px solid var(--rj-border)', borderRadius: '12px', padding: '24px', maxWidth: '440px', width: '100%', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#F8FAFC' }}>{confirmModal.title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--rj-text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="route-journey-btn route-journey-btn-secondary"
                onClick={() => setConfirmModal({ open: false, action: null, title: '', message: '' })}
              >
                Batal
              </button>
              <button
                className="route-journey-btn route-journey-btn-primary"
                onClick={handleConfirmAction}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
