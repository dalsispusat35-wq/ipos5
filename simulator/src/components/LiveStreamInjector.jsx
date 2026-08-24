import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Activity, Radio, Volume2, VolumeX, Sparkles, Clock, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/sound.js';

export default function LiveStreamInjector({
  selectedDate,
  onInjectSingle,
  options
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [intervalMs, setIntervalMs] = useState(1500); // 1.5s default
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [injectedCount, setInjectedCount] = useState(0);
  const [totalKgStreamed, setTotalKgStreamed] = useState(0);
  const [liveLogs, setLiveLogs] = useState([]);

  const isRunningRef = useRef(false);
  isRunningRef.current = isRunning;

  const timerRef = useRef(null);

  const offices = options?.offices?.filter(o => o.nopend !== '40400') || [];

  // Single injection cycle
  const runCycle = async () => {
    if (!isRunningRef.current) return;
    try {
      const randomOffice = offices.length > 0 ? offices[Math.floor(Math.random() * offices.length)] : null;
      const weight = Number((1.5 + Math.random() * 8.5).toFixed(1));

      const payload = {
        target_date: selectedDate,
        origin_nopen: randomOffice ? randomOffice.nopend : undefined,
        weight_kg: weight,
        service: Math.random() > 0.4 ? 'Pos Nextday' : 'Pos Reguler'
      };

      const res = await onInjectSingle(payload);

      if (res && res.data) {
        if (soundEnabled) {
          sounds.playStreamTick();
        }

        const logItem = {
          id: Date.now() + Math.random(),
          time: new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }),
          code: res.data.connote_code,
          origin: res.data.origin,
          vehicle: res.data.vehicle,
          weightKg: res.data.weight_kg,
          service: res.data.service,
          sender: res.data.sender,
          receiver: res.data.receiver,
          destCity: res.data.destination_city
        };

        setLiveLogs(prev => [logItem, ...prev.slice(0, 30)]);
        setInjectedCount(prev => prev + 1);
        setTotalKgStreamed(prev => Number((prev + weight).toFixed(1)));
      }
    } catch (e) {
      console.error('Live stream error:', e);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(runCycle, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, intervalMs, selectedDate]);

  const handleTogglePlay = () => {
    sounds.init();
    setIsRunning(prev => !prev);
  };

  const handleStopAndClear = () => {
    setIsRunning(false);
    setInjectedCount(0);
    setTotalKgStreamed(0);
    setLiveLogs([]);
  };

  const SPEED_OPTIONS = [
    { id: 1000, label: '1.0 Detik', sub: 'Kecepatan Ekstrem' },
    { id: 1500, label: '1.5 Detik', sub: 'Kecepatan Tinggi' },
    { id: 3000, label: '3.0 Detik', sub: 'Kecepatan Normal' },
    { id: 5000, label: '5.0 Detik', sub: 'Santai' }
  ];

  return (
    <div className="tool-card-container">
      {/* Header */}
      <div className="tool-card-header">
        <div className="flex-between flex-wrap gap-12">
          <div className="flex-align gap-12">
            <div className={`tool-icon-badge ${isRunning ? 'tool-icon-emerald pulse' : 'tool-icon-blue'}`}>
              <Radio size={22} className={isRunning ? 'spin-slow' : ''} />
            </div>
            <div>
              <div className="flex-align gap-8">
                <h3 className="tool-card-title">Live Stream Injector (Suntik Otomatis Tiap Detik)</h3>
                {isRunning && (
                  <span className="live-stream-pill flex-align gap-4">
                    <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                    STREAMING LIVE
                  </span>
                )}
              </div>
              <p className="tool-card-subtitle">
                Menstimulasikan loket pos & gate yang sedang aktif dengan menyuntikkan paket secara beruntun
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`btn-audio-toggle ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Suara Beep Scanner' : 'Unmute Suara Beep'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Audio Scanner ON' : 'Audio Muted'}</span>
          </button>
        </div>
      </div>

      <div className="tool-card-body">
        {/* Stream Controls & Telemetry Stats Bar */}
        <div className="stream-control-panel flex-between flex-wrap gap-14">
          <div className="flex-align gap-12 flex-wrap">
            <button
              type="button"
              className={`btn-stream-action ${isRunning ? 'running' : 'idle'}`}
              onClick={handleTogglePlay}
            >
              {isRunning ? (
                <span className="flex-align gap-8">
                  <Pause size={18} /> PAUSE STREAM
                </span>
              ) : (
                <span className="flex-align gap-8">
                  <Play size={18} fill="#fff" /> START LIVE STREAM SUNTIK
                </span>
              )}
            </button>

            {isRunning && (
              <button
                type="button"
                className="btn-danger-ghost"
                onClick={handleStopAndClear}
              >
                <Square size={15} /> Stop & Bersihkan Log
              </button>
            )}
          </div>

          {/* Speed Preset Pills */}
          <div className="flex-align gap-6">
            <span className="text-dim" style={{ fontSize: 11, fontWeight: 700, marginRight: 4 }}>INTERVAL:</span>
            {SPEED_OPTIONS.map((sp) => (
              <button
                key={sp.id}
                type="button"
                className={`btn-speed-pill ${intervalMs === sp.id ? 'active' : ''}`}
                onClick={() => setIntervalMs(sp.id)}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Stream Counters */}
        <div className="stream-stats-grid" style={{ marginTop: 14 }}>
          <div className="stream-stat-item">
            <div className="stat-sub-label">PAKET TERKIRIM DI SESI INI:</div>
            <div className="stat-big-value font-mono text-emerald">{injectedCount} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pcs</span></div>
          </div>
          <div className="stream-stat-item">
            <div className="stat-sub-label">TOTAL BERAT MASUK:</div>
            <div className="stat-big-value font-mono text-cyan">{totalKgStreamed} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Kg</span></div>
          </div>
          <div className="stream-stat-item">
            <div className="stat-sub-label">KECEPATAN SUNTIK:</div>
            <div className="stat-big-value font-mono text-orange">{(1000 / intervalMs).toFixed(1)} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Resi/detik</span></div>
          </div>
        </div>

        {/* Live Cyber Terminal Console */}
        <div className="cyber-terminal-container" style={{ marginTop: 16 }}>
          <div className="terminal-topbar flex-between">
            <div className="flex-align gap-8">
              <span className="term-dot term-dot-red" />
              <span className="term-dot term-dot-yellow" />
              <span className="term-dot term-dot-green" />
              <span className="font-mono text-cyan text-bold" style={{ fontSize: 11, marginLeft: 6 }}>
                LIVE_INJECTION_FEED://MONGODB/TRANSAKSI
              </span>
            </div>
            <span className="font-mono text-emerald" style={{ fontSize: 11 }}>
              {isRunning ? '● TRANSMITTING STREAM...' : '○ READY TO STREAM'}
            </span>
          </div>

          <div className="terminal-content-feed">
            {liveLogs.length === 0 ? (
              <div className="terminal-idle-message">
                {isRunning ? (
                  <div className="flex-align gap-8 justify-center">
                    <Sparkles size={16} className="spin text-cyan" /> Menunggu suntikan paket pertama...
                  </div>
                ) : (
                  <div>
                    <Radio size={28} className="text-dim mb-6" />
                    <div>Tekan tombol <strong style={{ color: '#16a34a' }}>START LIVE STREAM SUNTIK</strong> di atas untuk memulai simulasi.</div>
                  </div>
                )}
              </div>
            ) : (
              liveLogs.map((log) => (
                <div key={log.id} className="terminal-feed-line flex-between">
                  <div className="flex-align gap-8" style={{ overflow: 'hidden' }}>
                    <span className="font-mono text-dim">[{log.time}]</span>
                    <span className="font-mono text-cyan text-bold">{log.code}</span>
                    <span className="text-dim">|</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{log.origin}</span>
                    <ArrowRight size={11} color="var(--primary-blue)" />
                    <span style={{ color: 'var(--primary-navy)', fontSize: 12, fontWeight: 700 }}>
                      {log.receiver ? `${log.receiver} (${log.destCity || 'Yogyakarta'})` : 'Penerima Pelanggan'}
                    </span>
                    <span className="text-dim">|</span>
                    <span className="badge-nopol-table">{log.vehicle}</span>
                  </div>
                  <div className="flex-align gap-8 flex-shrink-0">
                    <span className="badge-service-table">{log.service}</span>
                    <span className="font-mono text-emerald text-bold">{log.weightKg} kg</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
