import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api.js';
import {
  Search, MapPin, Calendar, AlertTriangle, Building, Box, ArrowRight, Truck, Info, Clock,
  Check, Play, RefreshCw, Scale, ShieldAlert, Layers, CheckCircle2, RotateCcw, Package,
  Weight, Boxes, Activity, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';

const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0
});

export default function Checker() {
  const [connote, setConnote] = useState(() => {
    return localStorage.getItem('last_searched_connote') || 'P2607160088433';
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem('last_searched_result');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [error, setError] = useState(null);

  // Local Simulation state (Pure Frontend State - No DB mutation)
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  // Ref for auto-scrolling the road timeline track
  const roadTrackRef = useRef(null);

  // Fetch routing and journey info
  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!connote.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.checkRouting(connote.trim());
      if (res.success) {
        setResult(res);
        localStorage.setItem('last_searched_connote', connote.trim());
        localStorage.setItem('last_searched_result', JSON.stringify(res));
      } else {
        setError(res.message || 'Gagal mencari data resi.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Resi tidak ditemukan atau server mengalami error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connote && !result) {
      handleSearch();
    }
  }, []);

  // Extract variables safely
  const tx = result?.data?.transaction || {};

  // Build accumulative route payload for Slide 2 Night Pickup (B 9910 PCX)
  const searchedResi = tx.connoteCode || connote || 'P2607160088433';
  const searchedWeight = Number(tx.actualWeight) || 125;

  const slide2Sequence = [
    // 1. AGP ONG — titik awal (SKIPPED, tidak ada di DB)
    {
      pointName: 'AGP ONG', nopend: null, inDb: false, role: 'PPT_ORIGIN',
      beratNaik: 0, beratTurun: 0, cumulativeLoadKg: 0,
      manifestItems: []
    },
    // 2. AGEN ARVINET — muat pertama (ada di DB)
    {
      pointName: 'AGEN ARVINET', nopend: '40395C1', inDb: true, role: 'ORIGIN',
      beratNaik: searchedWeight + 320, beratTurun: 0,
      cumulativeLoadKg: searchedWeight + 320,
      manifestItems: [
        { resi: searchedResi, berat: searchedWeight, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160088434', berat: 180, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160088435', berat: 140, destination: 'SPP BANDUNG 40400' }
      ]
    },
    // 3. CICALENGKA
    {
      pointName: 'CICALENGKA', nopend: '40395U1', inDb: true, role: 'TRANSIT',
      beratNaik: 310, beratTurun: 0,
      cumulativeLoadKg: searchedWeight + 320 + 310,
      manifestItems: [
        { resi: searchedResi, berat: searchedWeight, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160088434', berat: 180, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160088435', berat: 140, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160091201', berat: 160, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160091202', berat: 150, destination: 'SPP BANDUNG 40400' }
      ]
    },
    // 4. CIPARAY
    {
      pointName: 'CIPARAY', nopend: '40381U2', inDb: true, role: 'TRANSIT',
      beratNaik: 245, beratTurun: 0,
      cumulativeLoadKg: searchedWeight + 320 + 310 + 245,
      manifestItems: [
        { resi: searchedResi, berat: searchedWeight, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160088434', berat: 180, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160088435', berat: 140, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160091201', berat: 160, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160091202', berat: 150, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160095511', berat: 245, destination: 'SPP BANDUNG 40400' }
      ]
    },
    // 5. MAJALAYA
    {
      pointName: 'MAJALAYA', nopend: '40382U1', inDb: true, role: 'TRANSIT',
      beratNaik: 180, beratTurun: 0,
      cumulativeLoadKg: searchedWeight + 320 + 310 + 245 + 180,
      manifestItems: [
        { resi: searchedResi, berat: searchedWeight, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160088434', berat: 180, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160091201', berat: 160, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160095511', berat: 245, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160096677', berat: 180, destination: 'SPP BANDUNG 40400' }
      ]
    },
    // 6. KCP MAJALAYA
    {
      pointName: 'KCP MAJALAYA', nopend: '40382B2', inDb: true, role: 'TRANSIT',
      beratNaik: 120, beratTurun: 0,
      cumulativeLoadKg: searchedWeight + 320 + 310 + 245 + 180 + 120,
      manifestItems: [
        { resi: searchedResi, berat: searchedWeight, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160088434', berat: 180, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160095511', berat: 245, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160096677', berat: 180, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160097788', berat: 120, destination: 'SPP BANDUNG 40400' }
      ]
    },
    // 7. AGP Omega — SKIPPED (tidak ada di DB), sesuai PPT: setelah KCP Majalaya sebelum Cileunyi
    {
      pointName: 'AGP Omega', nopend: null, inDb: false, role: 'PPT_TRANSIT',
      beratNaik: 0, beratTurun: 0,
      cumulativeLoadKg: searchedWeight + 320 + 310 + 245 + 180 + 120,
      manifestItems: [
        { resi: searchedResi, berat: searchedWeight, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160088434', berat: 180, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160095511', berat: 245, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160096677', berat: 180, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160097788', berat: 120, destination: 'SPP BANDUNG 40400' }
      ]
    },
    // 8. CILEUNYI
    {
      pointName: 'CILEUNYI', nopend: '40393U3', inDb: true, role: 'TRANSIT',
      beratNaik: 85, beratTurun: 0,
      cumulativeLoadKg: searchedWeight + 320 + 310 + 245 + 180 + 120 + 85,
      manifestItems: [
        { resi: searchedResi, berat: searchedWeight, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160088434', berat: 180, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160095511', berat: 245, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160097788', berat: 120, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160098899', berat: 85, destination: 'SPP BANDUNG 40400' }
      ]
    },
    // 9. CINUNUK Permata Biru
    {
      pointName: 'CINUNUK', nopend: '40393S8', inDb: true, role: 'TRANSIT',
      beratNaik: 65, beratTurun: 0,
      cumulativeLoadKg: searchedWeight + 320 + 310 + 245 + 180 + 120 + 85 + 65,
      manifestItems: [
        { resi: searchedResi, berat: searchedWeight, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160088434', berat: 180, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160095511', berat: 245, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160097788', berat: 120, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160098899', berat: 85, destination: 'SPP BANDUNG 40400' },
        { resi: 'P2607160099900', berat: 65, destination: 'SPP BANDUNG 40400' }
      ]
    },
    // 10. SPP BANDUNG 40400 — Tujuan Akhir, bongkar semua muatan
    {
      pointName: 'SPP BANDUNG 40400', nopend: '40400', inDb: true, role: 'DESTINATION',
      beratNaik: 0, beratTurun: searchedWeight + 320 + 310 + 245 + 180 + 120 + 85 + 65,
      cumulativeLoadKg: 0,
      manifestItems: []
    }
  ];

  const maxCapacityKg = 1500;
  
  // Calculate simulated load based on current stop index
  const currentStop = slide2Sequence[currentStopIndex] || slide2Sequence[0];
  const simulatedLoadKg = currentStop.cumulativeLoadKg;
  const remainingCapKg = maxCapacityKg - simulatedLoadKg;
  const capacityUsedPercent = Number(((simulatedLoadKg / maxCapacityKg) * 100).toFixed(1));

  // Controls (Pure local state movement, NO DB MUTATION)
  const handleNextStop = () => {
    if (isMoving || currentStopIndex >= slide2Sequence.length - 1) return;
    setIsMoving(true);
    setCurrentStopIndex(prev => prev + 1);
    setTimeout(() => {
      setIsMoving(false);
    }, 800);
  };

  const handleRestart = () => {
    if (isMoving) return;
    setCurrentStopIndex(0);
    setIsMoving(false);
  };

  // Auto scroll active stop to center of road lane track
  useEffect(() => {
    const activeNodeElement = document.getElementById(`road-node-${currentStopIndex}`);
    if (activeNodeElement && roadTrackRef.current) {
      const container = roadTrackRef.current;
      const containerWidth = container.offsetWidth;
      const elementLeft = activeNodeElement.offsetLeft;
      const elementWidth = activeNodeElement.offsetWidth;
      const targetScrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
      });
    }
  }, [currentStopIndex]);

  const getCapacityStyles = (pct) => {
    if (pct < 70) {
      return {
        barColor: 'linear-gradient(90deg, #00D2C4, #38BDF8)',
        textColor: 'var(--accent-cyan)',
        badge: 'badge-info',
        status: 'Aman (Safe)'
      };
    } else if (pct < 90) {
      return {
        barColor: 'linear-gradient(90deg, #F59E0B, #D4AF37)',
        textColor: 'var(--accent-yellow)',
        badge: 'badge-warning',
        status: 'Hampir Penuh (Warning)'
      };
    } else {
      return {
        barColor: 'linear-gradient(90deg, #EF4444, #DC2626)',
        textColor: 'var(--accent-red)',
        badge: 'badge-danger',
        status: 'Kritis (Critical - 97%)'
      };
    }
  };

  const statusStyle = getCapacityStyles(capacityUsedPercent);

  return (
    <div className="animate-fade-in">
      <style>{`
        /* Clean Ground Road Line & Building Nodes Layout (Matches User Image) */
        .milk-run-track-box {
          position: relative;
          width: 100%;
          overflow-x: auto;
          padding: 30px 20px 20px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          scrollbar-width: thin;
        }

        .milk-run-road-viewport {
          position: relative;
          min-width: 980px;
          height: 190px;
        }

        /* Blue progress fill — starts at 0 and grows right */
        .milk-run-ground-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 6px;
          background: linear-gradient(90deg, #00D2C4, #38BDF8);
          box-shadow: 0 0 12px rgba(0, 210, 196, 0.6);
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 3px;
          z-index: 2;
        }

        /* Ground container wrapper */
        .milk-run-ground-wrapper {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 60px;
          height: 6px;
          z-index: 1;
        }

        /* Light Theme */
        :root.light-theme .milk-run-ground-track {
          background: #CBD5E1;
        }

        :root.light-theme .milk-run-stop-label {
          color: #0b192c;
        }

        :root.light-theme .milk-run-stop-sub {
          color: #627d98;
        }

        :root.light-theme .milk-run-node-badge {
          background: #e2e8f0;
          border-color: #94a3b8;
          color: #334e68;
        }

        :root.light-theme .milk-run-truck-badge {
          background: #0b192c;
          border-color: #00D2C4;
          color: #00D2C4;
        }

        .milk-run-ground-progress {
          height: 100%;
          background: linear-gradient(90deg, #00D2C4, #38BDF8);
          box-shadow: 0 0 12px rgba(0, 210, 196, 0.5);
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 3px;
        }

        /* Buildings and Pins Container (Standing right on top of ground line) */
        .milk-run-nodes-container {
          position: absolute;
          left: 40px;
          right: 40px;
          bottom: 64px;
          display: flex;
          justify-content: space-between;
          z-index: 10;
        }

        .milk-run-stop-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 80px;
          position: relative;
          user-select: none;
        }

        .milk-run-pin-icon {
          color: var(--accent-cyan);
          font-size: 20px;
          margin-bottom: 2px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          transition: transform 0.3s ease;
        }

        .milk-run-building-icon {
          font-size: 32px;
          line-height: 1;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
          margin-bottom: 4px;
        }

        .milk-run-node-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--bg-dark);
          border: 2px solid var(--border-light);
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .milk-run-stop-item.active .milk-run-pin-icon {
          color: var(--accent-cyan);
          transform: scale(1.25) translateY(-4px);
        }

        .milk-run-stop-item.active .milk-run-node-badge {
          background: var(--accent-cyan);
          border-color: #FFFFFF;
          color: #0B192C;
          box-shadow: 0 0 12px var(--accent-cyan);
          transform: scale(1.15);
        }

        .milk-run-stop-item.visited .milk-run-node-badge {
          background: #10B981;
          border-color: #10B981;
          color: #FFFFFF;
        }

        .milk-run-stop-item.skipped .milk-run-pin-icon {
          color: var(--accent-yellow);
        }

        .milk-run-stop-item.skipped .milk-run-node-badge {
          background: rgba(234, 179, 8, 0.15);
          border-color: var(--accent-yellow);
          color: var(--accent-yellow);
        }

        /* Stop Text Labels under ground line */
        .milk-run-stop-label {
          position: absolute;
          top: 100%;
          margin-top: 8px;
          font-size: 11px;
          font-weight: 700;
          text-align: center;
          color: var(--text-primary);
          width: 90px;
          line-height: 1.2;
        }

        .milk-run-stop-sub {
          font-size: 10px;
          color: var(--text-muted);
          text-align: center;
          margin-top: 3px;
        }

        /* Truck Box Sliding on Ground Line (Red Cab + Blue Box Mobil Box B 9910 PCX) */
        .milk-run-truck-slider {
          position: absolute;
          bottom: 64px;
          z-index: 25;
          transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .milk-run-truck-badge {
          background: #0B192C;
          border: 1px solid var(--accent-cyan);
          color: var(--accent-cyan);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          box-shadow: 0 0 10px rgba(0, 210, 196, 0.4);
          white-space: nowrap;
          margin-bottom: 4px;
        }

        .milk-run-truck-body {
          width: 48px;
          height: 40px;
          background: linear-gradient(135deg, #EF4444 35%, #2563EB 35%);
          border: 2px solid #FFFFFF;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          box-shadow: 0 6px 16px rgba(0,0,0,0.5);
        }

        .timeline-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          margin: 30px 0 20px 0;
          padding: 0 10px;
        }

        .timeline-progress-line {
          position: absolute;
          top: 24px;
          left: 30px;
          right: 30px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          z-index: 1;
          border-radius: 2px;
        }

        .timeline-progress-fill {
          height: 100%;
          background: var(--accent-cyan);
          box-shadow: 0 0 12px var(--accent-cyan);
          transition: width 0.6s ease;
          border-radius: 2px;
        }

        .timeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          width: 120px;
        }

        .timeline-dot {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 2px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: var(--text-muted);
          transition: all 0.3s ease;
        }

        .timeline-step.active .timeline-dot {
          background: rgba(0, 210, 196, 0.15);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          box-shadow: 0 0 16px var(--accent-cyan);
          transform: scale(1.1);
        }

        .timeline-step.completed .timeline-dot {
          background: #10B981;
          border-color: #10B981;
          color: #FFFFFF;
        }

        .timeline-label {
          margin-top: 10px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          text-align: center;
        }

        .timeline-step.active .timeline-label,
        .timeline-step.completed .timeline-label {
          color: var(--text-primary);
        }

        .timeline-sublabel {
          font-size: 10px;
          color: var(--text-secondary);
          margin-top: 2px;
          text-align: center;
        }
        @media (max-width: 768px) {
          .milk-run-track-box {
            padding: 20px 10px 15px 10px;
          }
          .milk-run-road-viewport {
            min-width: 850px;
            height: 180px;
          }
          .milk-run-stop-item {
            width: 70px;
          }
          .milk-run-stop-label {
            font-size: 10px;
            width: 75px;
          }
          .milk-run-building-icon {
            font-size: 26px;
          }
        }
      `}</style>

      {/* Header Search Box */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h2 className="card-title" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={22} style={{ color: 'var(--accent-cyan)' }} /> 
          Routing & Transit Checker IPOS5
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
          Pelacakan paket dan simulasi operasional pickup malam armada Pos Laju B 9910 PCX (Slide 2 PPT).
        </p>

        <form onSubmit={handleSearch} className="checker-search-form" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Masukkan Connote Code / Nomor Resi (Contoh: P2607160088433)"
              value={connote}
              onChange={(e) => setConnote(e.target.value)}
              style={{ paddingLeft: '45px', height: '45px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', width: '100%' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '45px', px: '24px' }}>
            {loading ? 'Mencari...' : 'Lacak Resi'}
          </button>
        </form>

        {/* Quick sample resi shortcuts */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span>Resi Sampel:</span>
          {['P2607160088433', 'P2607150025574'].map(sample => (
            <button
              key={sample}
              type="button"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-light)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace' }}
              onClick={() => { setConnote(sample); }}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-red)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <AlertTriangle size={28} style={{ color: 'var(--accent-red)' }} />
            <div>
              <h4 style={{ color: 'white', fontWeight: 700, margin: 0 }}>Pencarian Gagal</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', margin: 0 }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && result.data && (
        <div className="animate-fade-in">
          {/* Main Info Badges */}
          <div className="grid-4" style={{ marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CONNOTE CODE</span>
              <h4 style={{ fontSize: '18px', color: 'var(--accent-cyan)', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace' }}>
                {tx.connoteCode || result.connote}
              </h4>
            </div>
            
            <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>LAYANAN & BERAT</span>
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-info">{tx.service || '-'}</span>
                <span style={{ fontWeight: 700, color: 'white', fontSize: '13px' }}>{searchedWeight} kg</span>
              </div>
            </div>
            
            <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS KIRIMAN SAAT INI</span>
              <div style={{ marginTop: '6px' }}>
                <span className="badge badge-purple" style={{ fontSize: '12px', padding: '4px 10px' }}>
                  {tx.state || result.status}
                </span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DESTINATION KPRK / SPP</span>
              <h4 style={{ fontSize: '16px', color: 'white', fontWeight: 800, marginTop: '4px' }}>
                {tx.destinationKprk || tx.destinationNopen || 'SPP BANDUNG (40400)'}
              </h4>
            </div>
          </div>

          {/* Section A: J&T / Pos Laju Style Parcel Tracking Timeline */}
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '14px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: 'var(--accent-purple)' }} /> STATUS PELAKSANAAN PARCEL TRACKING (LINE PIPELINE STATE)
            </h3>

            {(() => {
              const currentStatus = (tx.state || '').toUpperCase().trim();
              let activeIndex = 0;
              if (currentStatus === 'DITERIMA_DI_CIMAHI') activeIndex = 1;
              if (currentStatus === 'INVEHICLE' || currentStatus === 'TRANSIT_SPP_BANDUNG') activeIndex = 2;
              if (currentStatus === 'TIBA_DI_SPP_TUJUAN') activeIndex = 3;
              if (currentStatus === 'DELIVERED') activeIndex = 4;

              const steps = [
                { label: tx.originName || 'Agen / Kantor Asal', sub: `Origin (${tx.originNopen || '-'})`, icon: '🏢' },
                { label: 'KC Cimahi', sub: 'Origin Gateway (40500)', icon: '🏬' },
                { label: 'Mobil Box B 9910 PCX', sub: 'In Transit / Gate (40400)', icon: '🚚' },
                { label: 'SPP Bandung 40400', sub: 'Sorting Hub (40400)', icon: '🔄' },
                { label: 'Delivered', sub: 'Penerima Kiriman', icon: '🏁' }
              ];

              const progressPercentage = (activeIndex / (steps.length - 1)) * 100;

              return (
                <div style={{ position: 'relative' }}>
                  <div className="timeline-wrapper">
                    <div className="timeline-progress-line">
                      <div className="timeline-progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                    </div>

                    {steps.map((step, idx) => {
                      const isCompleted = idx < activeIndex;
                      const isActive = idx === activeIndex;
                      const stepClass = isCompleted ? 'completed' : isActive ? 'active' : '';

                      return (
                        <div key={idx} className={`timeline-step ${stepClass}`}>
                          <div className="timeline-dot">
                            {isCompleted ? <Check size={18} style={{ strokeWidth: 3 }} /> : step.icon}
                          </div>
                          <div className="timeline-label">{step.label}</div>
                          <div className="timeline-sublabel">{step.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section B: Milk Run Logistics Road Visualization (Desain Presisi Sesuai Gambar User & Simulator Zip) */}
          <div className="glass-card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
            <div className="milk-run-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <MapPin size={20} style={{ color: 'var(--accent-cyan)' }} /> 
                  Visualisasi Rute Milk Run Logistics (Line Telemetry & Mobil Box B 9910 PCX)
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Armada: <strong>B 9910 PCX</strong> (Mobil Box 1.5 Ton) | Shift: <strong>MALAM (16.00 – 21.00 WIB)</strong> | Tujuan Akhir: <strong>SPP BANDUNG 40400</strong>
                </div>
              </div>

              {/* Interactive Local Control Buttons (PURE LOCAL SIMULATION - NO DB MUTATION) */}
              <div className="milk-run-header-controls" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {currentStopIndex < slide2Sequence.length - 1 ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleNextStop}
                    disabled={isMoving}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', px: '18px', py: '10px' }}
                  >
                    {isMoving ? (
                      <>
                        <span className="animate-spin">🔄</span>
                        <span>Berjalan ke {slide2Sequence[currentStopIndex + 1]?.pointName}...</span>
                      </>
                    ) : (
                      <>
                        <span>Lanjut ke {slide2Sequence[currentStopIndex + 1]?.pointName}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={handleRestart}
                    style={{ background: '#10B981', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                  >
                    <RotateCcw size={16} />
                    <span>Ulangi Simulasi Rute (Restart)</span>
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  onClick={handleRestart}
                  disabled={isMoving || currentStopIndex === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <RotateCcw size={14} /> Reset Rute
                </button>
              </div>
            </div>

            {/* Clean Ground Road Line Track */}
            <div className="milk-run-track-box" ref={roadTrackRef}>
              <div className="milk-run-road-viewport">
                
                {/* Ground Line: grey track + blue fill from left edge to current node center */}
                {(() => {
                  const ratio = slide2Sequence.length > 1
                    ? currentStopIndex / (slide2Sequence.length - 1)
                    : 0;
                  const isLastStop = currentStopIndex === slide2Sequence.length - 1;
                  const fillWidth = isLastStop
                    ? '100%'
                    : `calc(80px + ${(ratio * 100).toFixed(4)}% - ${(ratio * 160).toFixed(2)}px)`;
                  return (
                    <div className="milk-run-ground-wrapper">
                      <div className="milk-run-ground-fill" style={{ width: fillWidth }} />
                    </div>
                  );
                })()}

                {/* Truck Box Slider on Ground Line (Red Cab + Blue Box Mobil Box B 9910 PCX) */}
                <div 
                  className="milk-run-truck-slider"
                  style={{ left: `calc(80px + (100% - 160px) * ${currentStopIndex / (slide2Sequence.length - 1)})` }}
                >
                  <div className="milk-run-truck-badge">
                    🚚 {numberFormatter.format(simulatedLoadKg)} kg
                  </div>
                  <div className="milk-run-truck-body">
                    <Truck size={24} />
                  </div>
                </div>

                {/* Building Pin Nodes Container (Standing on ground line) */}
                <div className="milk-run-nodes-container">
                  {slide2Sequence.map((node, index) => {
                    const isVisited = index < currentStopIndex;
                    const isActive = index === currentStopIndex;
                    const isSkipped = !node.inDb;

                    let nodeClass = 'milk-run-stop-item';
                    if (isActive) nodeClass += ' active';
                    else if (isVisited) nodeClass += ' visited';
                    else if (isSkipped) nodeClass += ' skipped';

                    return (
                      <div 
                        key={index} 
                        id={`road-node-${index}`} 
                        className={nodeClass}
                        onClick={() => {
                          if (!isMoving) {
                            setIsMoving(true);
                            setCurrentStopIndex(index);
                            setTimeout(() => setIsMoving(false), 800);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                        title={`Klik untuk simulasi pergerakan ke ${node.pointName}`}
                      >
                        {/* Location Pin */}
                        <MapPin size={22} className="milk-run-pin-icon" style={{ color: isSkipped ? 'var(--accent-yellow)' : isActive ? 'var(--accent-cyan)' : isVisited ? '#10B981' : 'var(--text-muted)' }} />
                        
                        {/* Building Icon */}
                        <div className="milk-run-building-icon">🏢</div>

                        {/* Node Circle Ring */}
                        <div className="milk-run-node-badge">
                          {isVisited ? <Check size={14} /> : isSkipped ? 'X' : index + 1}
                        </div>

                        {/* Stop Label below ground line */}
                        <div className="milk-run-stop-label">
                          {node.pointName}
                          <div className="milk-run-stop-sub">
                            {node.inDb ? (node.nopend ? `(${node.nopend})` : node.role) : 'SKIPPED'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Grid 2-Column: Kapasitas Truck & Manifest Cargo Aktif */}
            <div className="grid-2" style={{ marginTop: '24px' }}>
              
              {/* Capacity Progress Panel */}
              <div className="glass-card" style={{ padding: '18px', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                    <Weight size={18} style={{ color: 'var(--accent-cyan)' }} /> Utilisasi Kapasitas Armada B 9910 PCX
                  </div>
                  <span className={`badge ${statusStyle.badge}`} style={{ fontSize: '11px' }}>
                    {statusStyle.status}
                  </span>
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span>Muatan Aktif Saat Ini</span>
                  <span style={{ color: statusStyle.textColor }}>
                    {numberFormatter.format(simulatedLoadKg)} kg / {numberFormatter.format(maxCapacityKg)} kg ({capacityUsedPercent}%)
                  </span>
                </div>

                <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden', padding: '1px' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${Math.min(100, capacityUsedPercent)}%`, 
                      background: statusStyle.barColor,
                      borderRadius: '5px',
                      transition: 'width 0.6s ease'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  <span>Aktivitas Stop: {currentStop.beratNaik > 0 ? `+${currentStop.beratNaik} kg (Muat)` : currentStop.beratTurun > 0 ? `-${currentStop.beratTurun} kg (Bongkar)` : 'Tidak Ada Muatan'}</span>
                  <span>Sisa Daya Angkut: {numberFormatter.format(remainingCapKg)} kg</span>
                </div>
              </div>

              {/* Manifest Cargo Panel */}
              <div className="glass-card" style={{ padding: '18px', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                    <Boxes size={18} style={{ color: 'var(--accent-cyan)' }} /> Manifest Cargo Aktif di Dalam Truk
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '11px' }}>
                    {currentStop.manifestItems.length} Paket Resi
                  </span>
                </div>

                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentStop.manifestItems && currentStop.manifestItems.length > 0 ? (
                    currentStop.manifestItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Package size={14} style={{ color: 'var(--accent-cyan)' }} />
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: item.resi === searchedResi ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                            {item.resi} {item.resi === searchedResi ? '(Resi Yang Dicari)' : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Tujuan: <strong style={{ color: 'var(--text-primary)' }}>{item.destination}</strong> ({numberFormatter.format(item.berat)} kg)
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      Truk kosong (Belum ada muatan atau telah dibongkar di SPP Bandung).
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Section C: Detail Panel Informasi Transaksi */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 className="card-title" style={{ fontSize: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} style={{ color: 'var(--accent-cyan)' }} /> Detail Pengirim & Penerima Kiriman
            </h3>
            <div className="journey-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '14px' }}>
              <div className="detail-item-info">
                <span>PENGIRIM</span>
                <span>{tx.senderName || tx.connote_sender_name || '-'}</span>
              </div>
              <div className="detail-item-info">
                <span>ALAMAT PENGIRIM</span>
                <span style={{ fontSize: '12px' }}>{tx.senderAddress || tx.connote_sender_address || '-'}</span>
              </div>
              <div className="detail-item-info">
                <span>PENERIMA</span>
                <span>{tx.receiverName || tx.connote_receiver_name || '-'}</span>
              </div>
              <div className="detail-item-info">
                <span>ALAMAT PENERIMA</span>
                <span style={{ fontSize: '12px' }}>{tx.receiverAddress || tx.connote_receiver_address_detail || tx.connote_receiver_address || '-'}</span>
              </div>
              <div className="detail-item-info">
                <span>KPRK TUJUAN</span>
                <span style={{ fontFamily: 'monospace' }}>{tx.destinationKprk || '-'}</span>
              </div>
              <div className="detail-item-info">
                <span>BIAYA KIRIM</span>
                <span>Rp {numberFormatter.format(tx.amount !== undefined ? tx.amount : tx.connote_amount || 0)}</span>
              </div>
            </div>
          </div>

          {/* Section D: Penjadwalan Transportasi Sinkron MongoDB (jadwal_transportasi) */}
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
              <Calendar size={18} style={{ color: 'var(--accent-cyan)' }} /> Penjadwalan Transportasi & Shift Operasional (`jadwal_transportasi` MongoDB)
            </h3>
            {result.schedules && result.schedules.length > 0 ? (
              <div className="table-container" style={{ marginTop: '15px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>ID Jadwal</th>
                      <th>Route ID</th>
                      <th>Asal / Gateway</th>
                      <th>Tujuan Hub</th>
                      <th>Jam Berangkat - Tiba</th>
                      <th>Kendaraan / Nopol</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedules.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                          {item.jadwal_id || item.id_jadwal || `-`}
                        </td>
                        <td style={{ color: 'white', fontWeight: 600 }}>
                          {item.route_id || 'RT-MALAM-B9910-PCX'}
                        </td>
                        <td>{item.asal_nama || item.asal_nopen || '-'}</td>
                        <td>{item.tujuan_nama || item.tujuan_nopen || '-'}</td>
                        <td style={{ color: 'var(--accent-yellow)', fontWeight: 700 }}>
                          {item.jam_berangkat || '-'} – {item.jam_tiba || '-'} WIB
                        </td>
                        <td style={{ color: 'white' }}>
                          {item.nama_kendaraan || item.nopol || item.nama_moda || 'B 9910 PCX'}
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '11px' }}>
                            {item.status || 'AKTIF'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: '8px', marginTop: '15px' }}>
                <span>Belum terdapat data jadwal_transportasi yang tersinkronisasi.</span>
              </div>
            )}
          </div>

          {/* Section E: Tracking History Kronologis Audit Trail */}
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
              <Clock size={18} style={{ color: 'var(--accent-cyan)' }} /> Riwayat Pelacakan Paket Kronologis (Audit Trail)
            </h3>
            {result.data?.trackingHistory && result.data.trackingHistory.length > 0 ? (
              <div className="table-container" style={{ marginTop: '15px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Waktu Perubahan</th>
                      <th>Status Asal</th>
                      <th>Status Baru</th>
                      <th>Lokasi / Armada</th>
                      <th>Sumber Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.trackingHistory.map((history, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'white', fontWeight: 600 }}>
                          {new Date(history.changedAt).toLocaleString('id-ID')}
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {history.from ? history.from.replace(/_/g, ' ') : 'INITIAL'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '11px' }}>
                            {history.to ? history.to.replace(/_/g, ' ') : '-'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--accent-yellow)', fontWeight: 600 }}>
                          {history.vehicle_nopol || history.location_name || history.manifest_id || 'Pos Laju B 9910 PCX'}
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {history.source || 'SYSTEM'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: '8px', marginTop: '15px' }}>
                <span>Belum terdapat tracking_history pada dokumen transaksi.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
