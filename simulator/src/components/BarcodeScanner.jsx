import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Scan, Camera, CameraOff, Send, CheckCircle, AlertCircle, Building2, Weight, Box, Sparkles, RefreshCw, Barcode, Info } from 'lucide-react';
import { sounds } from '../utils/sound.js';

export default function BarcodeScanner({
  options,
  selectedDate,
  onInjectSingle,
  selectedNopol
}) {
  const [scannedCode, setScannedCode] = useState('');
  const [selectedOfficeNopen, setSelectedOfficeNopen] = useState('40511A');
  const [weightKg, setWeightKg] = useState('2.5');
  const [service, setService] = useState('Pos Nextday');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [scanMessage, setScanMessage] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const offices = options?.offices?.filter(o => o.nopend !== '40400') || [];

  const startCamera = async () => {
    try {
      sounds.init();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setScanMessage('Kamera aktif. Arahkan barcode resi ke dalam kotak bidik laser.');
    } catch (err) {
      console.error('Camera access error:', err);
      setScanMessage('Gagal mengakses kamera web. Anda tetap bisa scan dengan barcode scanner USB atau ketik manual.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setScanMessage('');
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSingleSubmit = async (e) => {
    if (e) e.preventDefault();
    setInjecting(true);
    try {
      const payload = {
        connote_code: scannedCode || undefined,
        target_date: selectedDate,
        origin_nopen: selectedOfficeNopen,
        target_nopol: (!selectedNopol || selectedNopol === 'ALL') ? undefined : selectedNopol,
        weight_kg: parseFloat(weightKg) || 2.5,
        service
      };

      const res = await onInjectSingle(payload);
      sounds.playScanSuccess();
      if (res && res.data) {
        setLastScannedResult(res.data);
        setScannedCode('');
      }
    } catch (err) {
      sounds.playError();
      console.error('Error injecting single:', err);
    } finally {
      setInjecting(false);
    }
  };

  const handleGenerateSampleCode = () => {
    sounds.init();
    const cleanDateCompact = (selectedDate || '').replace(/-/g, '').slice(2);
    const randCode = `P${cleanDateCompact}${Math.floor(100000 + Math.random() * 900000)}`;
    setScannedCode(randCode);
  };

  return (
    <div className="tool-card-container">
      {/* Header */}
      <div className="tool-card-header">
        <div className="flex-align gap-12">
          <div className="tool-icon-badge tool-icon-purple">
            <Scan size={22} />
          </div>
          <div>
            <h3 className="tool-card-title">Barcode & QR Scanner (Loket & Gate Entry)</h3>
            <p className="tool-card-subtitle">
              Pindai barcode fisik via kamera atau ketik nomor resi connote kustom untuk disimpan ke database
            </p>
          </div>
        </div>
      </div>

      <div className="tool-card-body">
        <div className="grid-2-col gap-20">
          
          {/* Left Column: Holographic Laser Scanner Viewfinder */}
          <div className="scanner-hologram-panel">
            <div className="flex-between mb-10">
              <span className="flex-align gap-6 text-purple text-bold" style={{ fontSize: 12 }}>
                <Camera size={15} /> KAMERA SCANNER VIEW
              </span>

              {!isCameraActive ? (
                <button type="button" className="btn-ghost-sm" onClick={startCamera}>
                  <Camera size={13} /> Aktifkan Kamera
                </button>
              ) : (
                <button type="button" className="btn-danger-sm" onClick={stopCamera}>
                  <CameraOff size={13} /> Matikan Kamera
                </button>
              )}
            </div>

            <div className="hologram-camera-frame">
              {/* Corner Reticle Brackets */}
              <div className="reticle reticle-tl" />
              <div className="reticle reticle-tr" />
              <div className="reticle reticle-bl" />
              <div className="reticle reticle-br" />

              {isCameraActive ? (
                <video ref={videoRef} className="camera-video-feed" playsInline />
              ) : (
                <div className="camera-offline-content">
                  <Barcode size={54} className="text-purple-glow" />
                  <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: '#fff' }}>
                    Optical Barcode Scanner Ready
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                    Gunakan kamera web atau scanner barcode USB (Plug & Play)
                  </div>
                </div>
              )}

              {/* Animated Laser Scanning Line */}
              <div className="laser-scanner-line" />
            </div>

            {scanMessage && (
              <div className="scanner-message-banner">
                {scanMessage}
              </div>
            )}
          </div>

          {/* Right Column: Input Connote & Office Settings */}
          <form onSubmit={handleSingleSubmit} className="tool-form-stack">
            <div className="form-section-box">
              <div className="flex-between mb-6">
                <label className="section-label">NOMOR RESI CONNOTE (SCAN / INPUT):</label>
                <button
                  type="button"
                  onClick={handleGenerateSampleCode}
                  className="btn-quick-link flex-align gap-4"
                >
                  <Sparkles size={12} /> Generate Nomor Resi
                </button>
              </div>

              <input
                type="text"
                className="custom-dark-input font-mono"
                placeholder="Scan barcode atau ketik (contoh: P260820000001)..."
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                style={{ fontSize: 15, fontWeight: 900, color: 'var(--primary-blue)' }}
                autoFocus
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={12} color="var(--primary-blue)" /> Mendukung scanner barcode USB fisik (otomatis submit saat tombol scanner ditekan).
              </div>
            </div>

            <div className="form-section-box">
              <label className="section-label flex-align gap-6 mb-6">
                <Building2 size={14} className="text-emerald" /> LOKET / KANTOR POS ASAL:
              </label>
              <select
                className="custom-dark-select"
                value={selectedOfficeNopen}
                onChange={(e) => setSelectedOfficeNopen(e.target.value)}
              >
                <option value="RANDOM">Acak Otomatis (18 Kantor Pos Bandung & Cimahi)</option>
                {offices.map((o) => (
                  <option key={o.nopend} value={o.nopend}>
                    [{o.nopend}] {o.nama} — {o.alamat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2-col gap-10">
              <div className="form-section-box">
                <label className="section-label flex-align gap-6 mb-6">
                  <Weight size={14} className="text-orange" /> BERAT (KG):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  className="custom-dark-input font-mono"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>

              <div className="form-section-box">
                <label className="section-label flex-align gap-6 mb-6">
                  <Box size={14} className="text-purple" /> LAYANAN:
                </label>
                <select
                  className="custom-dark-select"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="Pos Nextday">Pos Nextday</option>
                  <option value="Pos Reguler">Pos Reguler</option>
                  <option value="Pos Sameday">Pos Sameday</option>
                  <option value="Pos Jumbo Cargo">Pos Jumbo Cargo</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-emerald-action"
              disabled={injecting}
            >
              {injecting ? (
                <span className="flex-align gap-8 justify-center">
                  <Sparkles size={18} className="spin text-cyan" />
                  <span>Menyimpan ke Database MongoDB...</span>
                </span>
              ) : (
                <span className="flex-align gap-8 justify-center">
                  <Send size={18} />
                  <span>SIMPAN RESI KE DATABASE</span>
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Scan Result Feedback Card */}
        {lastScannedResult && (
          <div className="injected-report-card" style={{ marginTop: 18, borderLeft: '4px solid #16a34a' }}>
            <div className="flex-between">
              <div className="flex-align gap-12">
                <div className="icon-badge-round-emerald">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>
                    Resi <span className="font-mono text-cyan">{lastScannedResult.connote_code}</span> Berhasil Disimpan!
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span>Pengirim: <strong style={{ color: 'var(--text-primary)' }}>{lastScannedResult.sender || lastScannedResult.origin}</strong></span>
                    <ArrowRight size={11} color="var(--primary-blue)" />
                    <span>Penerima: <strong style={{ color: 'var(--primary-navy)' }}>{lastScannedResult.receiver} ({lastScannedResult.destination_city || 'Tujuan Nasional'})</strong></span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Armada: <span className="badge-nopol-table">{lastScannedResult.vehicle}</span> • Berat: <span className="font-mono text-emerald">{lastScannedResult.weight_kg} kg</span> • Layanan: <span className="badge-service-table">{lastScannedResult.service}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
