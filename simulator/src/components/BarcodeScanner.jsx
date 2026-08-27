import React, { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  Scan, 
  Camera, 
  CameraOff, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Building2, 
  Weight, 
  Box, 
  Sparkles, 
  Barcode, 
  Info, 
  ArrowRight,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import { sounds } from '../utils/sound.js';

// SVG Barcode Generator Component (Code 128 / Code 39 Style)
function BarcodeSvg({ value }) {
  if (!value) return null;
  
  // Deterministic bar widths based on char codes
  const bars = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    bars.push((code % 3) + 1);
    bars.push(((code >> 1) % 2) + 1);
    bars.push(((code >> 2) % 3) + 1);
  }

  let totalW = 12;
  const rects = [];
  
  // Start guard bars
  rects.push(<rect key="g1" x={0} y={0} width={3} height={46} fill="#0f172a" />);
  rects.push(<rect key="g2" x={5} y={0} width={2} height={46} fill="#0f172a" />);
  rects.push(<rect key="g3" x={9} y={0} width={1.5} height={46} fill="#0f172a" />);

  // Data bars
  for (let i = 0; i < bars.length; i++) {
    const w = bars[i];
    if (i % 2 === 0) {
      rects.push(<rect key={`b_${i}`} x={totalW} y={0} width={w * 1.8} height={40} fill="#0f172a" />);
    }
    totalW += w * 1.8 + 2;
  }

  // End guard bars
  rects.push(<rect key="ge1" x={totalW} y={0} width={1.5} height={46} fill="#0f172a" />);
  rects.push(<rect key="ge2" x={totalW + 4} y={0} width={2} height={46} fill="#0f172a" />);
  rects.push(<rect key="ge3" x={totalW + 8} y={0} width={3} height={46} fill="#0f172a" />);
  totalW += 14;

  return (
    <div className="barcode-badge-card" style={{ width: '100%', background: '#ffffff', border: '1.5px solid var(--border-light)', borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ width: '100%', maxWidth: 360, overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${totalW} 48`} style={{ width: '100%', height: 44, display: 'block' }}>
          {rects}
        </svg>
      </div>
      <div className="barcode-text-code font-mono" style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.18em', color: '#0f172a', marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

export default function BarcodeScanner({
  options,
  selectedDate,
  onInjectSingle,
  selectedNopol
}) {
  const [scannedCode, setScannedCode] = useState('P260827000101');
  const [selectedOfficeNopen, setSelectedOfficeNopen] = useState('40511A');
  const [weightKg, setWeightKg] = useState('2.5');
  const [service, setService] = useState('Pos Nextday');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [scanMessage, setScanMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

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
      setScanMessage('Kamera aktif. Arahkan barcode resi fisik ke dalam kotak bidik laser.');
    } catch (err) {
      console.error('Camera access error:', err);
      setScanMessage('Kamera tidak terdeteksi atau izin ditolak. Anda tetap bisa scan dengan barcode scanner USB atau generate otomatis.');
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
        handleGenerateSampleCode();
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
    sounds.playBeep?.();
    const cleanDateCompact = (selectedDate || '').replace(/-/g, '').slice(2) || '260827';
    const randCode = `P${cleanDateCompact}${Math.floor(100000 + Math.random() * 900000)}`;
    setScannedCode(randCode);
  };

  const handleCopyCode = () => {
    if (!scannedCode) return;
    navigator.clipboard.writeText(scannedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1600);
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
              Pindai barcode fisik via kamera web, scanner USB fisik, atau generate resi connote otomatis untuk disimpan ke database
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

              <div className="flex-align gap-6">
                <button 
                  type="button" 
                  className="btn-ghost-sm" 
                  onClick={handleGenerateSampleCode}
                  title="Simulasi Scan Barcode Baru"
                >
                  <Zap size={13} className="text-orange" /> Scan Demo
                </button>
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
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Scan size={36} color="#c084fc" />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    Optical Barcode Scanner Ready
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, maxWidth: 260 }}>
                    Arahkan scanner USB fisik, aktifkan kamera web, atau klik tombol <strong>Scan Demo</strong>
                  </div>
                </div>
              )}

              {/* Animated Laser Scanning Line */}
              <div className="laser-scanner-line" />
            </div>

            {scanMessage && (
              <div className="scanner-message-banner">
                <Info size={14} />
                <span>{scanMessage}</span>
              </div>
            )}

            {/* Live Rendered Barcode Graphic */}
            {scannedCode && (
              <div style={{ marginTop: 14 }}>
                <div className="flex-between mb-4">
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)' }}>
                    PREVIEW FISIK BARCODE CONNOTE:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {isCopied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    {isCopied ? 'Tersalin' : 'Salin Resi'}
                  </button>
                </div>
                <BarcodeSvg value={scannedCode} />
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
                placeholder="Scan barcode atau ketik (contoh: P260827000001)..."
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
