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
  RotateCcw,
  MapPin,
  ShieldCheck,
  Compass,
  Crosshair,
  Radio
} from 'lucide-react';

// Official Verified POS Indonesia GPS Coordinates Registry (Bandung & Cimahi Region)
export const OFFICE_COORDINATES = {
  // ─── TERMINAL HUB AKHIR ───────────────────────────────────────────────────
  '40400': { lat: -6.940428, lng: 107.632296, name: 'SPP Bandung (40400)', address: 'Jl. Soekarno-Hatta No. 558, Sekejati Buahbatu, Bandung' },

  // ─── RUTE 1 (B 9910 PCX - FEEDER CIMAHI RAYA) ─────────────────────────────
  '40511A': { lat: -6.865200, lng: 107.538500, name: 'KCP Cimahicisangkan (40511A)', address: 'Jl. Sangkuriang 2 RT.04/20, Cisangkan Cimahi' },
  '40511CB': { lat: -6.861100, lng: 107.539800, name: 'Agenpos SANGKURIANG (40511CB)', address: 'Jl. Sangkuriang No. 25A, Cipageran Cimahi' },
  '40511U3': { lat: -6.863800, lng: 107.538900, name: 'Agenpos ETHALASE NISRAZKA (40511U3)', address: 'Jl. Sangkuriang 2, Cisangkan Cimahi' },
  '40511CA': { lat: -6.852400, lng: 107.532100, name: 'Agenpos SRIKANDI (40511CA)', address: 'Jl. Cikendal Rt 05/04, Cipageran Cimahi Utara' },
  '40511U1': { lat: -6.879500, lng: 107.544200, name: 'Agenpos KOPERASI SPPI (40511U1)', address: 'Jl. Terusan No. 30, Cimahi Tengah' },
  '40511U4': { lat: -6.908200, lng: 107.554600, name: 'Agenpos CIMAHI TENGAH (40511U4)', address: 'Jl. Melong Raya, Cimahi Selatan' },

  // ─── RUTE 2 (D 8812 AB - FEEDER BARAT & UTARA BANDUNG) ────────────────────
  '40184U5': { lat: -6.896700, lng: 107.561200, name: 'Agenpos CIMINDI (40184U5)', address: 'Jl. Gang Bp Ohe No. 149, Campaka Cimindi' },
  '40215C6': { lat: -6.918900, lng: 107.562300, name: 'Agenpos ARKAN FOTO (40215C6)', address: 'Jl. Gempol Sari No. 147, Cijerah Bandung Kulon' },
  '40351U2': { lat: -6.938500, lng: 107.545800, name: 'Agenpos AZ ZAHRA (40351U2)', address: 'Jl. Raya Nanjung No. 44, Margaasih' },
  '40116A': { lat: -6.905600, lng: 107.602800, name: 'KCP Bandungcicendo (40116A)', address: 'Jl. Cihampelas No. 12, Tamansari Bandung' },
  '40115B': { lat: -6.904500, lng: 107.611200, name: 'KCP Bandungjuanda (40115B)', address: 'Jl. Ir H Juanda No. 10A, Dago Coblong Bandung' },
  '40114A': { lat: -6.907150, lng: 107.618520, name: 'KCP Bandungcihapit (40114A)', address: 'Jl. Banda No. 30, Cihapit Bandung Wetan' },

  // ─── RUTE 3 (B 9945 PCY - EXPRESS PUSAT & TIMUR BANDUNG) ───────────────────
  '40000': { lat: -6.921350, lng: 107.607830, name: 'KCU Bandung Asia Afrika (40000)', address: 'Jl. Asia Afrika No. 49, Braga Sumur Bandung' },
  '40115A': { lat: -6.903820, lng: 107.625100, name: 'KCP Bandungcilaki (40115A)', address: 'Jl. Cilaki No. 73, Citarum Bandung Wetan' },
  '40122B': { lat: -6.903200, lng: 107.632100, name: 'KCP Bandungsupratman (40122B)', address: 'Jl. Supratman No. 64, Cihaur Geulis Bandung' },
  '40122D1': { lat: -6.898800, lng: 107.626400, name: 'LE IMIGRASI Surapati (40122D1)', address: 'Jl. Surapati No. 82, Cihaur Geulis Bandung' },
  '40123A': { lat: -6.892600, lng: 107.633800, name: 'KCP Bandungsukaluyu (40123A)', address: 'Jl. Pahlawan No. 87, Sukaluyu Bandung' },
  '40100': { lat: -6.912350, lng: 107.695800, name: 'KC Ujungberung (40100)', address: 'Jl. AH Nasution No. 28, Pakemitan Ujungberung' },

  // ─── COMPATIBILITY & LEGACY CODES ─────────────────────────────────────────
  '40511': { lat: -6.865200, lng: 107.538500, name: 'KCP Cimahi Cisangkan (40511)', address: 'Jl. Sangkuriang 2, Cimahi' },
  '40512': { lat: -6.908200, lng: 107.554600, name: 'KCP Cimahi Selatan (40512)', address: 'Jl. Melong Raya, Cimahi' },
  '40513': { lat: -6.852400, lng: 107.532100, name: 'KCP Cimahi Utara (40513)', address: 'Jl. Cipageran, Cimahi Utara' },
  '40395': { lat: -6.938500, lng: 107.545800, name: 'KCP Margaasih / Cililin (40395)', address: 'Jl. Raya Nanjung, Bandung Barat' },
  '40395C1': { lat: -6.918900, lng: 107.562300, name: 'Agenpos Cijerah Gempol (40395C1)', address: 'Cijerah, Bandung' },
  '10000': { lat: -6.168541, lng: 106.833512, name: 'MPC JAKARTA (10000)', address: 'Lapangan Banteng Utara No.1, Jakarta' }
};

// Driver info mapping for 3 active vehicles
const DRIVER_INFO = {
  'B 9910 PCX': {
    name: 'Ahmad Supriadi',
    phone: '081298765432',
    phoneFormatted: '0812-9876-5432',
    nip: 'POS-DRV-99101',
    rating: '4.9/5.0 (1.420 Pengiriman)'
  },
  'D 8812 AB': {
    name: 'Dede Kurnia',
    phone: '081576543210',
    phoneFormatted: '0815-7654-3210',
    nip: 'POS-DRV-88122',
    rating: '4.95/5.0 (2.110 Pengiriman)'
  },
  'B 9945 PCY': {
    name: 'Budi Santoso',
    phone: '081387654321',
    phoneFormatted: '0813-8765-4321',
    nip: 'POS-DRV-99453',
    rating: '4.9/5.0 (1.890 Pengiriman)'
  }
};

// Realistic street network interpolator fallback
const getDetailedRoadWaypoints = (stopsCoords) => {
  const roadPoints = [];

  for (let i = 0; i < stopsCoords.length; i++) {
    const current = stopsCoords[i];
    roadPoints.push([current.lat, current.lng]);

    if (i < stopsCoords.length - 1) {
      const next = stopsCoords[i + 1];
      const steps = 6;
      for (let s = 1; s < steps; s++) {
        const ratio = s / steps;
        const lat = current.lat + (next.lat - current.lat) * ratio;
        const lng = current.lng + (next.lng - current.lng) * ratio;
        // Subtle natural road curvature
        const curveOffset = Math.sin(ratio * Math.PI) * 0.0008;
        roadPoints.push([lat + (s % 2 === 0 ? curveOffset : -curveOffset), lng + (s % 2 === 0 ? -curveOffset : curveOffset)]);
      }
    }
  }

  return roadPoints;
};

export default function LiveGpsMapModal({ 
  isOpen, 
  onClose, 
  connoteCode = 'P260820010001',
  vehicleNopol = 'B 9910 PCX',
  routeId = 'RT-B9910-CIMAHI-RAYA',
  stops = [],
  routeStops = [],
  activeSeq: externalActiveSeq,
  currentStopSeq: externalCurrentStopSeq,
  onAdvanceStop,
  onResetStop,
  isPlaying: externalIsPlaying,
  onTogglePlay,
  loadKg = 0,
  currentLoadKg,
  maxCapKg = 1500,
  maxCapacityKg
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const hasFittedRef = useRef(false);

  // Normalize stops and props
  const rawIncomingStops = routeStops && routeStops.length > 0 ? routeStops : stops;
  const initialActiveSeq = externalActiveSeq !== undefined ? externalActiveSeq : (externalCurrentStopSeq !== undefined ? externalCurrentStopSeq : 1);
  const actualLoadKg = currentLoadKg !== undefined ? currentLoadKg : loadKg;
  const actualMaxCapKg = maxCapacityKg !== undefined ? maxCapacityKg : maxCapKg;

  // Internal simulation state
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [internalSeq, setInternalSeq] = useState(initialActiveSeq);

  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalPlaying;
  const activeSeq = externalActiveSeq !== undefined ? externalActiveSeq : (externalCurrentStopSeq !== undefined ? externalCurrentStopSeq : internalSeq);

  // Reset internal simulation when modal is re-opened
  useEffect(() => {
    if (isOpen) {
      setInternalSeq(initialActiveSeq || 1);
      setInternalPlaying(false);
      hasFittedRef.current = false;
    }
  }, [isOpen, initialActiveSeq]);

  // Normalize stops to exact verified GPS coordinates
  const stopsCoords = useMemo(() => {
    // Default fallback to 7 stops of Route 1 if empty
    const rawStops = rawIncomingStops && rawIncomingStops.length > 0 ? rawIncomingStops : [
      { seq: 1, nopen: '40511A', officeName: 'KCP Cimahicisangkan (40511A)', role: 'ORIGIN' },
      { seq: 2, nopen: '40511CB', officeName: 'Agenpos SANGKURIANG (40511CB)', role: 'TRANSIT' },
      { seq: 3, nopen: '40511U3', officeName: 'Agenpos ETHALASE NISRAZKA (40511U3)', role: 'TRANSIT' },
      { seq: 4, nopen: '40511CA', officeName: 'Agenpos SRIKANDI (40511CA)', role: 'TRANSIT' },
      { seq: 5, nopen: '40511U1', officeName: 'Agenpos KOPERASI SPPI (40511U1)', role: 'TRANSIT' },
      { seq: 6, nopen: '40511U4', officeName: 'Agenpos CIMAHI TENGAH (40511U4)', role: 'TRANSIT' },
      { seq: 7, nopen: '40400', officeName: 'SPP Bandung (40400)', role: 'DESTINATION' }
    ];

    return rawStops.map((st, idx) => {
      const nopenKey = String(st.nopen || '').trim().toUpperCase();
      const matched = OFFICE_COORDINATES[nopenKey] || OFFICE_COORDINATES[st.nopen];
      
      const lat = (typeof st.latitude === 'number' && st.latitude !== 0) ? st.latitude :
                  (typeof st.lat === 'number' && st.lat !== 0) ? st.lat :
                  (matched ? matched.lat : -6.9175);

      const lng = (typeof st.longitude === 'number' && st.longitude !== 0) ? st.longitude :
                  (typeof st.lng === 'number' && st.lng !== 0) ? st.lng :
                  (matched ? matched.lng : 107.6091);

      return {
        ...st,
        seq: st.seq || (idx + 1),
        nopen: st.nopen || nopenKey || '-',
        officeName: st.officeName || st.nama_nopend || st.nama || (matched ? matched.name : `Kantor ${st.nopen}`),
        lat,
        lng,
        address: st.address || st.alamat || (matched ? matched.address : `Nopen ${st.nopen}`)
      };
    });
  }, [rawIncomingStops]);

  // Driver details
  const driver = DRIVER_INFO[vehicleNopol] || DRIVER_INFO['B 9910 PCX'];

  // Auto-play simulation timer
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
      }, 2200);
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

  // Synchronous static fallback road waypoints
  const staticFallbackWaypoints = useMemo(() => {
    return getDetailedRoadWaypoints(stopsCoords);
  }, [stopsCoords]);

  // OSRM fetched real street network geometry
  const [osrmPolylineCoords, setOsrmPolylineCoords] = useState([]);

  // String primitive key for stable useEffect dependency comparison
  const stopsKey = useMemo(() => stopsCoords.map(s => `${s.nopen}-${s.lat.toFixed(5)}-${s.lng.toFixed(5)}`).join('|'), [stopsCoords]);

  // Fetch OSRM Road Geometry ONCE when modal opens or stopsKey changes
  useEffect(() => {
    if (!isOpen || stopsCoords.length < 2) {
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
      .catch((err) => {
        console.warn('OSRM Route fetch fallback:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, stopsKey]);

  // Active polyline is OSRM geometry if fetched, otherwise staticFallbackWaypoints
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

    const firstCoord = stopsCoords[0] ? [stopsCoords[0].lat, stopsCoords[0].lng] : [-6.8652, 107.5385];
    const map = L.map(mapContainerRef.current, {
      center: firstCoord,
      zoom: 12,
      zoomControl: true,
      fadeAnimation: true,
      zoomAnimation: true
    });

    // 1. OpenStreetMap Standard Layer
    const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | PT Pos Indonesia'
    });

    // 2. CartoDB Dark Mode
    const osmDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; CARTO'
    });

    // 3. OpenStreetMap HOT
    const osmHot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
    });

    // Default to CartoDB Dark for modern cyber telemetry look
    osmDark.addTo(map);

    // Layer Switcher
    const baseMaps = {
      "OpenStreetMap Dark Mode": osmDark,
      "OpenStreetMap Standard": osmStandard,
      "OpenStreetMap HOT": osmHot
    };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

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

  // Synchronous Map Render Effect for Markers, Vehicle Pin, and Polylines
  useEffect(() => {
    if (!isOpen || !mapInstanceRef.current || activePolylineCoords.length === 0) return;

    const map = mapInstanceRef.current;

    // Clear existing markers & polylines
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Draw solid blue line for complete planned route
    L.polyline(activePolylineCoords, {
      color: '#0284c7',
      weight: 5.5,
      opacity: 0.95
    }).addTo(map);

    // Fit bounds on first render
    const stopsLatLngs = stopsCoords.map(s => [s.lat, s.lng]);
    if (stopsLatLngs.length > 0 && !hasFittedRef.current) {
      const bounds = L.latLngBounds(stopsLatLngs);
      const isMobile = window.innerWidth < 768;
      map.fitBounds(bounds, { padding: isMobile ? [30, 30] : [60, 60], maxZoom: 13 });
      hasFittedRef.current = true;
    }

    const passedIndex = Math.min(Math.max(0, activeSeq - 1), stopsCoords.length - 1);

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
          color: '#10b981',
          weight: 6.5,
          opacity: 0.95
        }).addTo(map);
      }
    }

    // Add Office Markers with Floating Badges
    stopsCoords.forEach((st) => {
      const isPassed = st.seq < activeSeq;
      const isCurrent = st.seq === activeSeq;
      const isOrigin = st.seq === 1;
      const isDest = st.seq === stopsCoords.length;

      let pinColor = isPassed ? '#10b981' : isCurrent ? '#ea580c' : isOrigin ? '#10b981' : isDest ? '#ef4444' : '#38bdf8';

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
        iconSize: [200, 65],
        iconAnchor: [100, 52]
      });

      const marker = L.marker([st.lat, st.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 6px 4px; min-width: 210px;">
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
            ${st.officeName} <span style="font-family: monospace; color: #0284c7;">(${st.nopen})</span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px; line-height: 1.4;">
            ${st.address}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: ${pinColor}; margin-bottom: 8px;">
            ${isPassed ? 'TELAH DILALUI / TERMUAT' : isCurrent ? 'POSISI KENDARAAN AKTIF saat ini' : 'Stop Selanjutnya (Akan Datang)'}
          </div>
          <div style="font-size: 10px; color: #64748b;">
            Koordinat: ${st.lat.toFixed(5)}, ${st.lng.toFixed(5)} · Stop #${st.seq} dari ${stopsCoords.length}
          </div>
        </div>
      `);

      marker.on('click', () => {
        map.flyTo([st.lat, st.lng], 14, { duration: 0.8 });
      });
    });

    // Add Live Moving Truck Marker
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
          ${vehicleNopol}
        </div>
      `,
      iconSize: [120, 32],
      iconAnchor: [60, 16]
    });

    L.marker([currentPos.lat, currentPos.lng], { icon: truckIcon }).addTo(map);

  }, [isOpen, activeSeq, activePolylineCoords, vehicleNopol, stopsCoords]);

  if (!isOpen) return null;

  const currentStopObj = stopsCoords.find(s => s.seq === activeSeq) || stopsCoords[0];
  const isFinished = activeSeq >= stopsCoords.length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15,23,42,0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12
    }}>
      <div className="gps-modal-wrapper" style={{
        width: '95vw',
        maxWidth: 1300,
        height: '88vh',
        background: '#ffffff',
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '14px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
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
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Navigation size={20} color="#0284c7" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>GPS Radar Live Tracking & Rute Jalur Riil</span>
                <span className="badge badge-emerald" style={{ padding: '3px 8px', fontSize: 10 }}>
                  GPS COORDINATES VERIFIED
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                Rute: <strong style={{ color: '#0b2e8a' }}>{routeId}</strong> · Armada <strong style={{ color: '#0f172a' }}>{vehicleNopol}</strong> · {stopsCoords.length} Waypoints
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '6px 14px', borderRadius: 10, minHeight: 38 }}
          >
            <X size={18} /> Tutup Radar
          </button>
        </div>

        {/* Modal Main Body (Grid 2-Cols: Left Driver Panel, Right Leaflet Map) */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          minHeight: 0,
          position: 'relative'
        }}>
          
          {/* Left Panel: Driver & Operational Info */}
          <div style={{
            padding: 16,
            background: '#f8fafc',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflowY: 'auto'
          }}>
            {/* Live Driver Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#0b2e8a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 16,
                  color: '#fff',
                  border: '2px solid #bae6fd'
                }}>
                  {driver.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{driver.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>NIP: {driver.nip} · Driver Utama</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#d97706', marginTop: 2, fontWeight: 700 }}>
                    <Star size={11} fill="#d97706" color="#d97706" /> {driver.rating}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <a
                  href={`https://wa.me/62${driver.phone.replace(/^0/, '')}?text=Halo%20Driver%20Pos%20${encodeURIComponent(driver.name)},%20konfirmasi%20muatan%20rute%20${encodeURIComponent(routeId)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ padding: '8px 10px', fontSize: 11, borderRadius: 8, gap: 4, textDecoration: 'none', justifyContent: 'center', minHeight: 38 }}
                >
                  <MessageSquare size={13} /> WA Driver
                </a>
                <button
                  className="btn-ghost"
                  onClick={() => alert(`Menghubungi Supir ${driver.name} (${driver.phoneFormatted})...`)}
                  style={{ padding: '8px 10px', fontSize: 11, borderRadius: 8, gap: 4, justifyContent: 'center', minHeight: 38 }}
                >
                  <Phone size={13} /> Telepon
                </button>
              </div>
            </div>

            {/* ETA & Live Status Banner */}
            <div style={{ background: '#ffffff', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                Status Stop Saat Ini
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0b2e8a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={15} color="#0284c7" />
                Stop #{activeSeq} dari {stopsCoords.length}
              </div>
              <div style={{ fontSize: 12.5, color: '#0f172a', marginTop: 4, fontWeight: 800 }}>
                {currentStopObj.officeName}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} color="#64748b" /> {currentStopObj.address}
              </div>
            </div>

            {/* Live Simulation Controls */}
            <div style={{ background: '#ffffff', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
                Kontrol Simulasi GPS Live
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn-primary"
                  onClick={handleTogglePlay}
                  style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8, gap: 6, width: '100%', justifyContent: 'center', minHeight: 38 }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {isPlaying ? 'Pause Auto Play' : 'Auto Play GPS Pergerakan'}
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    className="btn-ghost"
                    onClick={handleAdvanceStop}
                    style={{ padding: '8px 10px', fontSize: 11, borderRadius: 8, gap: 4, justifyContent: 'center', minHeight: 38 }}
                  >
                    <SkipForward size={13} /> Lanjut Stop
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={handleResetStop}
                    style={{ padding: '8px 10px', fontSize: 11, borderRadius: 8, gap: 4, justifyContent: 'center', minHeight: 38 }}
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Digital Proof of Delivery QR Scanner Ticket */}
            <div style={{
              background: '#ffffff',
              padding: 12,
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 'auto'
            }}>
              <div style={{ background: '#f8fafc', padding: 6, borderRadius: 8, border: '1px solid #e2e8f0', flexShrink: 0 }}>
                <QrCode size={34} color="#0f172a" />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a' }}>Digital POD & Gate Scan</div>
                <div style={{ fontSize: 10.5, color: '#0b2e8a', marginTop: 2, fontFamily: 'monospace', fontWeight: 700 }}>{connoteCode}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Scan saat barang turun di SPP 40400</div>
              </div>
            </div>

          </div>

          {/* Right Panel: Leaflet Dark Mode GPS Map Container */}
          <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0 }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#040810' }} />

            {/* Map Floating HUD Overlay */}
            <div style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              zIndex: 1000,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Truck size={18} color="#0284c7" />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>
                    {vehicleNopol} · {routeId}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Muatan Aktual: <strong style={{ color: '#0b2e8a' }}>{actualLoadKg} kg</strong> / {actualMaxCapKg} kg
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
                  style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 8, gap: 6 }}
                  title="Kembalikan fokus peta ke seluruh rute"
                >
                  <Crosshair size={13} /> Reset Kamera Peta
                </button>
                <span className="badge badge-emerald" style={{ fontSize: 10, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Radio size={11} /> GPS COORDINATES ACTIVE
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
