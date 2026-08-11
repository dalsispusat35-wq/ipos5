import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';

import { 
  X, 
  Truck, 
  Phone, 
  MessageSquare, 
  Navigation, 
  Star, 
  QrCode, 
  Clock,
  Play,
  Pause,
  SkipForward,
  RotateCcw
} from 'lucide-react';

// Official Verified POS Indonesia GPS Coordinates Registry (Bandung & Cimahi Region)
const OFFICE_COORDINATES = {
  // Main Processing Centers & KCU/KPC
  '40511': { lat: -6.872412, lng: 107.542468, name: 'KPC CIMAHI UTAMA (40511)', address: 'Jl. Gandawijaya No.1, Cimahi' },
  '40512': { lat: -6.892015, lng: 107.548912, name: 'KCP CIMAHI SELATAN (40512)', address: 'Jl. Utama No.45, Cimahi Selatan' },
  '40513': { lat: -6.851240, lng: 107.554120, name: 'KCP CIMAHI UTARA (40513)', address: 'Jl. Cihanjuang No.88, Cimahi Utara' },
  '40400': { lat: -6.940428, lng: 107.632296, name: 'SPP BANDUNG (40400)', address: 'Jl. Soekarno-Hatta No.558, Bandung' },
  '40000': { lat: -6.917520, lng: 107.609120, name: 'KCU BANDUNG (40000)', address: 'Jl. Asia Afrika No.49, Bandung' },
  
  // Branch & Sub-Offices (KCP & Agen Pos in Bandung & West Bandung)
  '40395': { lat: -6.945821, lng: 107.458925, name: 'KCP CILILIN (40395)', address: 'Jl. Raya Cililin No.112, Bandung Barat' },
  '40395C1': { lat: -6.907812, lng: 107.502415, name: 'AGEN ARVINET (40395C1)', address: 'Batujajar, Bandung Barat' },
  '40394': { lat: -6.983944, lng: 107.832210, name: 'KCP CICALENGKA (40394)', address: 'Jl. Raya Cicalengka No.25, Kab. Bandung' },
  '40381': { lat: -7.039215, lng: 107.712248, name: 'KCP CIPARAY (40381)', address: 'Jl. Raya Laswi No.18, Ciparay' },
  '40911': { lat: -7.031548, lng: 107.518742, name: 'KPC SOREANG (40911)', address: 'Jl. Raya Soreang No.15, Soreang' },
  '40391': { lat: -6.816321, lng: 107.618452, name: 'KCP LEMBANG (40391)', address: 'Jl. Raya Lembang No.158, Lembang' },
  '40553': { lat: -6.839812, lng: 107.478952, name: 'KCP PADALARANG (40553)', address: 'Jl. Raya Padalarang No.460, Padalarang' },
  '40132': { lat: -6.908420, lng: 107.695120, name: 'KCP UJUNGBERUNG (40132)', address: 'Jl. Raya AH Nasution No.102, Ujungberung' },
  '40232': { lat: -6.948120, lng: 107.625810, name: 'KCP BUAHBATU (40232)', address: 'Jl. Buahbatu No.215, Bandung' },
  '10000': { lat: -6.168541, lng: 106.833512, name: 'MPC JAKARTA (10000)', address: 'Lapangan Banteng Utara No.1, Jakarta' }
};

// Helper to generate realistic high-precision road waypoints following West Java & Bandung primary arterial roads (GAMBAR 1 REFERENSI)
const getDetailedRoadWaypoints = (stopsCoords) => {
  const roadPoints = [];

  for (let i = 0; i < stopsCoords.length; i++) {
    const current = stopsCoords[i];
    roadPoints.push([current.lat, current.lng]);

    if (i < stopsCoords.length - 1) {
      const next = stopsCoords[i + 1];
      const curNopen = String(current.nopen);
      const nextNopen = String(next.nopen);

      // Segment: KPC Cimahi Utama (40511) -> AGEN ARVINET (40395C1)
      if (curNopen === '40511' && nextNopen === '40395C1') {
        roadPoints.push([-6.8765, 107.5412]); // Jl. Gandawijaya
        roadPoints.push([-6.8850, 107.5385]); // Baros Junction
        roadPoints.push([-6.8925, 107.5360]); // Leuwigajah Flyover
        roadPoints.push([-6.8970, 107.5315]); // Jl. Kerkof Leuwigajah
        roadPoints.push([-6.9015, 107.5210]); // Simpang Lagadar Jembatan Cimahi
        roadPoints.push([-6.9050, 107.5110]); // Jl. Raya Batujajar East
        roadPoints.push([-6.9065, 107.5080]); // Batujajar Main Corridor
      }
      // Segment: AGEN ARVINET (40395C1) -> SPP BANDUNG (40400) — GAMBAR 1 REFERENSI BENAR
      else if ((curNopen === '40395C1' || curNopen === '40395') && nextNopen === '40400') {
        roadPoints.push([-6.9065, 107.5080]); // Batujajar Main Corridor
        roadPoints.push([-6.9120, 107.5250]); // Jl. Raya Margaasih
        roadPoints.push([-6.9185, 107.5390]); // Simpang Nanjung Margaasih
        roadPoints.push([-6.9240, 107.5510]); // Jembatan Tol Margaasih / Nanjung
        roadPoints.push([-6.9325, 107.5750]); // Bundaran Kopo / Margahayu
        roadPoints.push([-6.9360, 107.5855]); // Simpang Kopo Soekarno-Hatta
        roadPoints.push([-6.9385, 107.6040]); // Simpang Moh. Toha Soekarno-Hatta
        roadPoints.push([-6.9400, 107.6210]); // Simpang Buahbatu Soekarno-Hatta
      }
      // Segment: KPC Cimahi (40511) -> KCP Cimahi Selatan (40512)
      else if (curNopen === '40511' && nextNopen === '40512') {
        roadPoints.push([-6.8785, 107.5405]);
        roadPoints.push([-6.8852, 107.5388]);
        roadPoints.push([-6.8900, 107.5440]);
      }
      // Segment: KCP Cimahi Selatan (40512) -> AGEN ARVINET (40395C1)
      else if (curNopen === '40512' && nextNopen === '40395C1') {
        roadPoints.push([-6.8950, 107.5410]);
        roadPoints.push([-6.8985, 107.5320]);
        roadPoints.push([-6.9015, 107.5245]);
        roadPoints.push([-6.9045, 107.5140]);
      }
      // Segment: AGEN ARVINET (40395C1) -> KCP Padalarang (40553)
      else if (curNopen === '40395C1' && nextNopen === '40553') {
        roadPoints.push([-6.8950, 107.5020]);
        roadPoints.push([-6.8650, 107.4910]);
        roadPoints.push([-6.8480, 107.4820]);
      }
      // Segment: KCP Padalarang (40553) -> KCU Bandung (40000)
      else if (curNopen === '40553' && nextNopen === '40000') {
        roadPoints.push([-6.8620, 107.5150]);
        roadPoints.push([-6.8920, 107.5610]);
        roadPoints.push([-6.9050, 107.5950]);
        roadPoints.push([-6.9140, 107.6050]);
      }
      // Segment: KCU Bandung (40000) -> SPP Bandung (40400)
      else if (curNopen === '40000' && nextNopen === '40400') {
        roadPoints.push([-6.9215, 107.6125]);
        roadPoints.push([-6.9270, 107.6210]);
        roadPoints.push([-6.9355, 107.6275]);
        roadPoints.push([-6.9400, 107.6300]);
      }
      // Generic interpolator with subtle street curves for any other route
      else {
        const steps = 5;
        for (let s = 1; s < steps; s++) {
          const ratio = s / steps;
          const lat = current.lat + (next.lat - current.lat) * ratio;
          const lng = current.lng + (next.lng - current.lng) * ratio;
          const curveOffset = Math.sin(ratio * Math.PI) * 0.0035;
          roadPoints.push([lat + (s % 2 === 0 ? curveOffset : -curveOffset), lng + curveOffset]);
        }
      }
    }
  }

  return roadPoints;
};

export default function LiveGpsMapModal({ 
  isOpen, 
  onClose, 
  connoteCode = 'P2607150025574',
  vehicleNopol = 'B 9910 PCX',
  routeId = 'RT-MALAM-B9910-PCX',
  stops = [],
  activeSeq: externalActiveSeq,
  onAdvanceStop,
  onResetStop,
  isPlaying: externalIsPlaying,
  onTogglePlay,
  loadKg = 750,
  maxCapKg = 1500
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const hasFittedRef = useRef(false);

  // Internal simulation fallback state (Self-contained Auto Play)
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [internalSeq, setInternalSeq] = useState(1);

  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalPlaying;
  const activeSeq = externalActiveSeq !== undefined ? externalActiveSeq : internalSeq;

  // Reset internal simulation when modal is re-opened
  useEffect(() => {
    if (isOpen) {
      setInternalSeq(1);
      setInternalPlaying(false);
    }
  }, [isOpen]);

  // Normalize stops to exact GPS coordinates (Memoized synchronously)
  const stopsCoords = useMemo(() => {
    const rawStops = stops && stops.length > 0 ? stops : [
      { seq: 1, nopen: '40511', officeName: 'KPC CIMAHI (40511)', role: 'ORIGIN' },
      { seq: 2, nopen: '40395C1', officeName: 'AGEN ARVINET (40395C1)', role: 'TRANSIT' },
      { seq: 3, nopen: '40400', officeName: 'SPP BANDUNG (40400)', role: 'DESTINATION' }
    ];

    return rawStops.map((st) => {
      const matched = OFFICE_COORDINATES[st.nopen];
      const fallbackLat = -6.9175 + (st.seq * 0.025);
      const fallbackLng = 107.5422 + (st.seq * 0.035);
      return {
        ...st,
        lat: matched ? matched.lat : fallbackLat,
        lng: matched ? matched.lng : fallbackLng,
        address: matched ? matched.address : `Nopen ${st.nopen}`
      };
    });
  }, [stops]);

  // Auto-play simulation interval timer
  useEffect(() => {
    let timer = null;
    if (isOpen && isPlaying) {
      timer = setInterval(() => {
        if (onAdvanceStop) {
          onAdvanceStop();
        } else {
          setInternalSeq((prev) => {
            if (prev >= stopsCoords.length) {
              setInternalPlaying(false);
              return prev;
            }
            return prev + 1;
          });
        }
      }, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isPlaying, stopsCoords.length, onAdvanceStop]);

  const handleTogglePlay = () => {
    if (onTogglePlay) {
      onTogglePlay();
    } else {
      if (internalSeq >= stopsCoords.length) {
        setInternalSeq(1);
      }
      setInternalPlaying((prev) => !prev);
    }
  };

  const handleAdvanceStop = () => {
    if (onAdvanceStop) {
      onAdvanceStop();
    } else {
      setInternalSeq((prev) => (prev < stopsCoords.length ? prev + 1 : prev));
    }
  };

  const handleResetStop = () => {
    if (onResetStop) {
      onResetStop();
    } else {
      setInternalSeq(1);
      setInternalPlaying(false);
    }
  };

  // Synchronous static fallback waypoints (GAMBAR 1 REFERENSI BENAR)
  const staticFallbackWaypoints = useMemo(() => {
    return getDetailedRoadWaypoints(stopsCoords);
  }, [stopsCoords]);

  // OSRM fetched geometry state
  const [osrmPolylineCoords, setOsrmPolylineCoords] = useState([]);

  // String primitive key for stable useEffect dependency comparison
  const stopsKey = useMemo(() => stopsCoords.map(s => `${s.nopen}-${s.lat}-${s.lng}`).join('|'), [stopsCoords]);

  // Fetch OSRM Road Geometry ONCE when modal opens or stopsKey changes (Single Source of Truth)
  useEffect(() => {
    if (!isOpen || stopsCoords.length === 0) {
      setOsrmPolylineCoords([]);
      return;
    }

    let isSubscribed = true;
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${stopsCoords.map(s => `${s.lng},${s.lat}`).join(';')}?overview=full&geometries=geojson`;

    fetch(osrmUrl)
      .then(res => res.json())
      .then(data => {
        if (isSubscribed && data && data.routes && data.routes[0] && data.routes[0].geometry) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          if (coords && coords.length > 0) {
            setOsrmPolylineCoords(coords);
          }
        }
      })
      .catch((err) => console.warn('OSRM Route fetch fallback', err));

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, stopsKey]);

  // Active polyline is OSRM geometry if fetched, otherwise staticFallbackWaypoints (Single Source of Truth)
  const activePolylineCoords = osrmPolylineCoords.length > 0 ? osrmPolylineCoords : staticFallbackWaypoints;

  // Map Initialization & Destruction Cleanup Lifecycle
  useEffect(() => {
    if (!isOpen) {
      hasFittedRef.current = false;
      return;
    }
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    hasFittedRef.current = false;

    const firstCoord = stopsCoords[0] ? [stopsCoords[0].lat, stopsCoords[0].lng] : [-6.872412, 107.542468];
    const map = L.map(mapContainerRef.current, {
      center: firstCoord,
      zoom: 12,
      zoomControl: true,
      fadeAnimation: true,
      zoomAnimation: true
    });

    // 🗺️ 1. OpenStreetMap Standard Layer (Primary Default Tile Layer)
    const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | PT Pos Indonesia'
    });

    // 🌙 2. OpenStreetMap Dark Theme (CartoDB Dark)
    const osmDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; CARTO'
    });

    // 🚲 3. OpenStreetMap HOT (Humanitarian High Contrast)
    const osmHot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, France'
    });

    // Add Default OpenStreetMap Standard Tile Layer to map
    osmStandard.addTo(map);

    // Add Interactive Layer Switcher Control at top-right
    const baseMaps = {
      "🗺️ OpenStreetMap Standard": osmStandard,
      "🌙 OpenStreetMap Dark Mode": osmDark,
      "🚲 OpenStreetMap HOT (High Contrast)": osmHot
    };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    // Responsive invalidateSize timer & window resize listener
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Synchronous Map Render Effect for Markers, Vehicle Pin, and Polylines (NO FLICKERING & ZERO BLANK SCREEN)
  useEffect(() => {
    if (!isOpen || !mapInstanceRef.current || activePolylineCoords.length === 0) return;

    const map = mapInstanceRef.current;

    // Clear existing markers & polylines synchronously before drawing new frame
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Draw single solid blue polyline from Single Source of Truth activePolylineCoords
    L.polyline(activePolylineCoords, {
      color: '#0284c7',
      weight: 5.5,
      opacity: 0.95
    }).addTo(map);

    // Keep entire route framed perfectly ONLY ON INITIAL OPEN
    const stopsLatLngs = stopsCoords.map(s => [s.lat, s.lng]);
    if (stopsLatLngs.length > 0 && !hasFittedRef.current) {
      const bounds = L.latLngBounds(stopsLatLngs);
      const isMobile = window.innerWidth < 768;
      map.fitBounds(bounds, { padding: isMobile ? [30, 30] : [60, 60], maxZoom: 13 });
      hasFittedRef.current = true;
    }

    const passedIndex = Math.min(activeSeq - 1, stopsCoords.length - 1);

    // Draw passed polyline segment up to current active stop (SOLID GREEN LINE)
    if (passedIndex > 0) {
      const targetPassedCoord = [stopsCoords[passedIndex].lat, stopsCoords[passedIndex].lng];
      let splitIdx = 0;
      let minDistance = Infinity;

      for (let k = 0; k < activePolylineCoords.length; k++) {
        const pt = activePolylineCoords[k];
        const dist = Math.hypot(pt[0] - targetPassedCoord[0], pt[1] - targetPassedCoord[1]);
        if (dist < minDistance) {
          minDistance = dist;
          splitIdx = k;
        }
      }

      const passedSegment = activePolylineCoords.slice(0, splitIdx + 1);
      if (passedSegment.length > 1) {
        L.polyline(passedSegment, {
          color: '#16a34a',
          weight: 6.5,
          opacity: 0.95
        }).addTo(map);
      }
    }

    // Add Office Markers with Permanent Visual Floating Name Badges
    stopsCoords.forEach((st) => {
      const isPassed = st.seq < activeSeq;
      const isCurrent = st.seq === activeSeq;
      const isOrigin = st.seq === 1;
      const isDest = st.seq === stopsCoords.length;

      let pinColor = isPassed ? '#16a34a' : isCurrent ? '#ea580c' : isOrigin ? '#16a34a' : isDest ? '#dc2626' : '#0284c7';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; position: relative;">
            <div style="
              background: rgba(15,23,42,0.92);
              color: #fff;
              border: 1.5px solid ${pinColor};
              border-radius: 8px;
              padding: 3px 8px;
              font-size: 10px;
              font-weight: 800;
              white-space: nowrap;
              box-shadow: 0 4px 14px rgba(0,0,0,0.4);
              margin-bottom: 5px;
              letter-spacing: 0.02em;
              display: flex;
              align-items: center;
              gap: 5px;
            ">
              <span style="color: ${pinColor}; font-family: monospace; font-weight: 900;">[${st.nopen}]</span>
              <span>${st.officeName}</span>
            </div>

            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${pinColor};
              border: 2.5px solid #fff;
              box-shadow: 0 0 18px ${pinColor};
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-weight: 900;
              font-size: 12px;
              font-family: sans-serif;
              cursor: pointer;
            ">
              ${st.seq}
            </div>
          </div>
        `,
        iconSize: [180, 60],
        iconAnchor: [90, 50]
      });

      const marker = L.marker([st.lat, st.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 6px 4px; min-width: 200px;">
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
            ${st.officeName} <span style="font-family: monospace; color: #0284c7;">(${st.nopen})</span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px; line-height: 1.4;">
            📍 ${st.address}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: ${pinColor}; margin-bottom: 8px;">
            ${isPassed ? '✓ TERKIRIM / SELESAI' : isCurrent ? '📍 POSISI KENDARAAN AKTIF saat ini' : '⏱️ Stop Selanjutnya (Transit)'}
          </div>
          <div style="font-size: 10px; color: #64748b;">
            Stop Ke-${st.seq} dari ${stopsCoords.length} Waypoints
          </div>
        </div>
      `);

      marker.on('click', () => {
        map.flyTo([st.lat, st.lng], 14, { duration: 0.8 });
      });
    });

    // Add Live Moving Truck Marker at current position
    const currentPos = stopsCoords[passedIndex] || stopsCoords[0];
    const truckIcon = L.divIcon({
      className: 'custom-truck-pin',
      html: `
        <div style="
          padding: 6px 12px;
          border-radius: 20px;
          background: #e8431f;
          color: #fff;
          font-weight: 900;
          font-size: 11px;
          border: 2px solid #fff;
          box-shadow: 0 0 24px #e8431f;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        ">
          🚚 ${vehicleNopol}
        </div>
      `,
      iconSize: [120, 32],
      iconAnchor: [60, 16]
    });

    L.marker([currentPos.lat, currentPos.lng], { icon: truckIcon }).addTo(map);

  }, [isOpen, activeSeq, activePolylineCoords, vehicleNopol]);

  if (!isOpen) return null;

  const currentStopObj = stopsCoords.find(s => s.seq === activeSeq) || stopsCoords[0];
  const isFinished = activeSeq >= stopsCoords.length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(2,6,18,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12
    }}>
      <div className="gps-modal-wrapper">
        {/* Modal Header */}
        <div style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(13,27,56,0.95), rgba(4,8,16,0.98))',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(56,189,248,0.15)',
              border: '1px solid rgba(56,189,248,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Navigation size={20} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>GPS Radar Live Tracking</span>
                <span className="badge badge-emerald" style={{ padding: '3px 8px', fontSize: 10 }}>
                  LIVE TELEMETRY 🟢
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                Resi <strong style={{ color: '#38bdf8' }}>{connoteCode}</strong> · Nopol <strong style={{ color: '#fff' }}>{vehicleNopol}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '6px 12px', borderRadius: 10, color: '#fff', borderColor: 'rgba(255,255,255,0.15)', minHeight: 38 }}
          >
            <X size={18} /> Tutup Radar
          </button>
        </div>

        {/* Modal Main Body (Responsive Grid: Desktop 2-Cols, Mobile Stacked) */}
        <div className="gps-modal-body">
          
          {/* Left Panel: Driver & Operational Info */}
          <div className="gps-modal-left-panel">
            {/* Live Driver Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(232,67,31,0.15), rgba(56,189,248,0.08))',
              border: '1px solid rgba(232,67,31,0.3)',
              borderRadius: 14,
              padding: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e8431f, #2460b0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 16,
                  color: '#fff',
                  boxShadow: '0 0 14px rgba(232,67,31,0.5)',
                  border: '2px solid #fff'
                }}>
                  SP
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>Sdr. Supriatna</div>
                  <div style={{ fontSize: 10.5, color: '#6ba3f0', fontWeight: 600 }}>NIP: POS-DRV-98412 · Driver Utama</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#f59e0b', marginTop: 2, fontWeight: 700 }}>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" /> 4.9/5.0 (1.248 Pengiriman)
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <a
                  href={`https://wa.me/6281234567890?text=Halo%20Driver%20Pos%20Supriatna,%20konfirmasi%20resi%20${connoteCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ padding: '8px 10px', fontSize: 11, borderRadius: 8, gap: 4, textDecoration: 'none', justifyContent: 'center', minHeight: 40 }}
                >
                  <MessageSquare size={13} /> WA Driver
                </a>
                <button
                  className="btn-ghost"
                  onClick={() => alert(`Menghubungi Supir Supriatna (0812-3456-7890)...`)}
                  style={{ padding: '8px 10px', fontSize: 11, borderRadius: 8, gap: 4, justifyContent: 'center', minHeight: 40 }}
                >
                  <Phone size={13} /> Telepon
                </button>
              </div>
            </div>

            {/* ETA & Live Status Banner */}
            <div style={{ background: 'rgba(6,13,31,0.8)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                Estimasi Waktu Tiba (ETA)
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={16} color="#38bdf8" />
                {isFinished ? 'Tiba di SPP Bandung (40400)' : '48 Menit Lagi (19:30 WIB)'}
              </div>
              <div style={{ fontSize: 11, color: '#fff', marginTop: 6, fontWeight: 600 }}>
                Lokasi Saat Ini: <span style={{ color: '#ff7b59' }}>{currentStopObj.officeName}</span>
              </div>
            </div>

            {/* Live Simulation Controls */}
            <div style={{ background: 'rgba(6,13,31,0.8)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
                Kontrol Simulasi GPS Live
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn-primary"
                  onClick={handleTogglePlay}
                  style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8, gap: 6, width: '100%', justifyContent: 'center', minHeight: 40, background: isPlaying ? '#e8431f' : '#2460b0' }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {isPlaying ? 'Pause Auto Play' : 'Auto Play GPS Pergerakan'}
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    className="btn-ghost"
                    onClick={handleAdvanceStop}
                    style={{ padding: '8px 10px', fontSize: 11, borderRadius: 8, gap: 4, justifyContent: 'center', minHeight: 40 }}
                  >
                    <SkipForward size={13} /> Lanjut Stop
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={handleResetStop}
                    style={{ padding: '8px 10px', fontSize: 11, borderRadius: 8, gap: 4, justifyContent: 'center', minHeight: 40 }}
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Digital Proof of Delivery QR Scanner Ticket */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{ background: '#fff', padding: 6, borderRadius: 8, flexShrink: 0 }}>
                <QrCode size={36} color="#000" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>Digital POD & Gate Scan</div>
                <div className="font-mono" style={{ fontSize: 10, color: '#38bdf8', marginTop: 2 }}>{connoteCode}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Scan saat barang turun di SPP</div>
              </div>
            </div>

          </div>

          {/* Right Panel: Leaflet Dark Mode GPS Map Container */}
          <div className="gps-modal-map-panel">
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#040810' }} />

            {/* Map Floating HUD Overlay */}
            <div className="gps-hud-overlay">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Truck size={18} color="#ff7b59" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>
                    {vehicleNopol} · {routeId}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    Muatan Aktual: <strong style={{ color: '#38bdf8' }}>{loadKg} kg</strong> / {maxCapKg} kg
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => {
                    if (mapInstanceRef.current && stopsCoords.length > 0) {
                      const bounds = L.latLngBounds(stopsCoords.map(s => [s.lat, s.lng]));
                      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
                    }
                  }}
                  className="btn-ghost"
                  style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 8, gap: 6, color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.1)' }}
                  title="Kembalikan fokus peta ke seluruh rute"
                >
                  🎯 Reset Kamera Peta
                </button>
                <span className="badge badge-emerald" style={{ fontSize: 10, padding: '4px 10px' }}>
                  GPS COORDINATES ACTIVE 📡
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
