import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Map as MapIcon, Globe, Mountain, Maximize2, Minimize2 } from 'lucide-react';
import { fetchApi } from '../../utils/api.js';

// Fix Leaflet standard marker icon paths in Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BASEMAP_TILES = {
  peta: {
    name: 'Peta',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  },
  satelit: {
    name: 'Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19
  },
  terrain: {
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
    maxZoom: 17
  }
};

const labelNode = text => {
  const node = document.createElement('span');
  node.textContent = text;
  return node;
};

// Extracts flat array of closed coordinate rings [[lat, lng], [lat, lng], ...]
// handles 2D arrays, 3D arrays, and nested MultiPolygons cleanly without cross-island seams.
function extractPolygonRings(rawPath) {
  if (!rawPath) return [];
  let path = rawPath;
  if (typeof path === 'string') {
    try {
      path = JSON.parse(path);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(path) || path.length === 0) return [];

  // Check if it's already a single ring: [[lat, lng], [lat, lng], ...]
  if (Array.isArray(path[0]) && typeof path[0][0] === 'number') {
    return [path];
  }

  const rings = [];
  function traverse(node) {
    if (!Array.isArray(node) || node.length === 0) return;
    if (Array.isArray(node[0]) && typeof node[0][0] === 'number') {
      rings.push(node);
    } else {
      for (const child of node) traverse(child);
    }
  }
  traverse(path);
  return rings;
}

export default function KantorWilayahMap({ kode, offices, selectedOffice, onSelect, onOfficeSelect }) {
  const container = useRef(null);
  const map = useRef(null);
  const baseTileLayer = useRef(null);
  const regions = useRef(null);
  const markers = useRef(null);
  const centerPin = useRef(null);
  const focusBox = useRef(null);
  const selectedPoint = useRef(null);
  const callbacks = useRef({ onSelect, onOfficeSelect });
  const clickRequest = useRef(0);

  const [basemap, setBasemap] = useState('peta');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [message, setMessage] = useState('Klik area berwarna atau titik pada peta untuk memilih wilayah.');
  const [loading, setLoading] = useState(false);
  const [scene, setScene] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Adjust body scroll and trigger map invalidateSize upon fullscreen toggle
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const timer = setTimeout(() => {
      if (map.current) {
        map.current.invalidateSize({ pan: false });
        if (focusBox.current) {
          try {
            const b = focusBox.current.getBounds();
            if (b && b.isValid()) {
              map.current.fitBounds(b.pad(0.08), { maxZoom: 16, animate: true });
            }
          } catch {}
        }
      }
    }, 120);

    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [isFullscreen]);

  useEffect(() => {
    callbacks.current = { onSelect, onOfficeSelect };
  }, [onSelect, onOfficeSelect]);

  // Switch basemap tile layer dynamically
  const switchBasemap = useCallback((type) => {
    if (!map.current) return;
    setBasemap(type);
    setShowBasemapMenu(false);
    if (baseTileLayer.current) {
      map.current.removeLayer(baseTileLayer.current);
    }
    const cfg = BASEMAP_TILES[type] || BASEMAP_TILES.peta;
    baseTileLayer.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom
    }).addTo(map.current);
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    let mounted = true;
    const instance = L.map(container.current, {
      preferCanvas: true,
      zoomControl: false,
      scrollWheelZoom: true
    }).setView([-2.5, 118], 5);
    map.current = instance;

    // Add zoom control at bottom right (cahyadsn style)
    L.control.zoom({ position: 'bottomright' }).addTo(instance);

    // Initial OSM tile layer
    const initialCfg = BASEMAP_TILES.peta;
    baseTileLayer.current = L.tileLayer(initialCfg.url, {
      attribution: initialCfg.attribution,
      maxZoom: initialCfg.maxZoom
    }).addTo(instance);

    regions.current = L.featureGroup().addTo(instance);
    markers.current = L.featureGroup().addTo(instance);

    // Map click reverse-lookup
    instance.on('click', async event => {
      const request = ++clickRequest.current;
      setCandidates([]);
      const { lat, lng } = event.latlng;
      if (selectedPoint.current) selectedPoint.current.remove();
      selectedPoint.current = L.circleMarker([lat, lng], { radius: 6, color: '#e11d48', fillOpacity: 1 }).addTo(instance);
      setMessage(`Mencari wilayah pada ${lat.toFixed(5)}, ${lng.toFixed(5)}…`);

      try {
        const response = await fetchApi(`/kantor/wilayah/reverse?lat=${lat}&lng=${lng}`);
        if (!mounted || request !== clickRequest.current) return;
        if (!response.data) {
          setMessage('Titik ini tidak berada dalam boundary yang tersedia. Silakan pilih area lain.');
          return;
        }
        if (response.data.matches?.length > 1) {
          setCandidates(response.data.matches);
          setMessage('Boundary pada sumber saling tumpang tindih di titik ini. Pilih wilayah yang dimaksud:');
          return;
        }
        await callbacks.current.onSelect(response.data.kode);
        if (mounted && request === clickRequest.current) {
          setMessage(`Dipilih: ${response.data.nama} (${response.data.kode}) · ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } catch (error) {
        if (mounted && request === clickRequest.current) setMessage(error.message);
      }
    });

    const resize = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
    resize.observe(container.current);

    return () => {
      mounted = false;
      resize.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);

  // Update map boundary scene when kode changes
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);

    fetchApi(`/kantor/wilayah/map?kode=${encodeURIComponent(kode || '')}`, { signal: controller.signal })
      .then(response => {
        if (!active || !map.current) return;
        const data = response.data;
        setScene(data);
        setCandidates([]);

        const chosen = data.selected;
        const selectedName = chosen?.desaKelurahan?.nama || chosen?.kecamatan?.nama || chosen?.kabupatenKota?.nama || chosen?.provinsi?.nama;
        const parts = kode ? kode.split('.') : [];

        if (parts.length >= 3) {
          const lvlLabel = parts.length === 4 ? 'Desa / Kelurahan' : 'Kecamatan';
          setMessage(`Fokus Wilayah: ${selectedName} (${kode}) · Peta difokuskan ke koordinat administratif tingkat ${lvlLabel}.`);
        } else {
          setMessage(selectedName ? `Dipilih: ${selectedName} (${kode})` : 'Klik area berwarna atau titik pada peta untuk memilih wilayah.');
        }

        // Clean previous boundary and pin layers
        regions.current.clearLayers();
        if (centerPin.current) {
          centerPin.current.remove();
          centerPin.current = null;
        }
        if (focusBox.current) {
          focusBox.current.remove();
          focusBox.current = null;
        }

        // 1. National view (!kode): Draw interactive provincial boundaries
        if (!kode && data.features?.length > 0) {
          data.features.forEach(feature => {
            const polyColor = '#38bdf8';
            const geoLayer = L.geoJSON(feature, {
              style: {
                color: polyColor,
                fillColor: polyColor,
                fillOpacity: 0.08,
                weight: 1.5,
                lineJoin: 'round',
                lineCap: 'round'
              },
              bubblingMouseEvents: false,
              onEachFeature: (f, layer) => {
                layer.bindTooltip(labelNode(`${f.properties.nama} (${f.properties.kode}) — klik untuk pilih`), { sticky: true });
                layer.on({
                  mouseover: () => layer.setStyle({ weight: 3, fillOpacity: 0.25 }),
                  mouseout: () => layer.setStyle({
                    color: polyColor,
                    fillColor: polyColor,
                    fillOpacity: 0.08,
                    weight: 1.5
                  }),
                  click: async event => {
                    if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
                    clickRequest.current++;
                    try {
                      await callbacks.current.onSelect(f.properties.kode);
                      setMessage(`Dipilih: ${f.properties.nama} (${f.properties.kode})`);
                    } catch (error) {
                      setMessage(error.message);
                    }
                  }
                });
              }
            });
            geoLayer.addTo(regions.current);
          });
        }

        // 2. Specific region selected (kode): Draw ONLY the clean, exact polygon matching wilayah-master
        const rings = extractPolygonRings(data.path);
        let activeBounds = null;

        if (kode && rings.length > 0) {
          const polygonLayers = [];
          rings.forEach(ring => {
            // Dark halo underneath for crisp contrast (wilayah-master styling)
            const halo = L.polygon(ring, {
              color: '#0F172A',
              fill: false,
              weight: 6.5,
              opacity: 0.22,
              lineJoin: 'round',
              lineCap: 'round'
            });
            // Vibrant cyan/sky main line with subtle fill
            const main = L.polygon(ring, {
              color: '#38bdf8',
              fillColor: '#38bdf8',
              fillOpacity: 0.13,
              weight: 3.5,
              opacity: 0.95,
              lineJoin: 'round',
              lineCap: 'round'
            });
            polygonLayers.push(halo, main);
          });
          const polyGroup = L.layerGroup(polygonLayers).addTo(regions.current);
          focusBox.current = polyGroup;

          try {
            activeBounds = L.featureGroup(polygonLayers).getBounds();
          } catch {
            activeBounds = null;
          }
        }

        // 3. Center Blue Location Pin Marker at [data.lat, data.lng] (wilayah-master style)
        if (data.lat && data.lng) {
          const pinPoint = [data.lat, data.lng];
          const popupHtml = `
            <div style="font-family: inherit; font-size: 12px; line-height: 1.5; min-width: 170px;">
              <strong style="font-size: 13.5px; color: #0284c7; display: block; margin-bottom: 2px;">${selectedName || 'Pusat Wilayah'}</strong>
              <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Kode: <b style="color: #0f172a;">${kode || '—'}</b></div>
              ${data.luas ? `<div>Luas: <b>${Number(data.luas).toLocaleString('id-ID')}</b> km²</div>` : ''}
              ${data.penduduk?.total || data.penduduk ? `<div>Penduduk: <b>${Number(data.penduduk?.total ?? data.penduduk).toLocaleString('id-ID')}</b> jiwa</div>` : ''}
              <div style="color: #64748b; font-size: 10.5px; margin-top: 4px; font-family: monospace;">${Number(data.lat).toFixed(5)}, ${Number(data.lng).toFixed(5)}</div>
            </div>
          `;
          centerPin.current = L.marker(pinPoint).bindPopup(popupHtml).addTo(map.current);
        }

        // 4. Camera Zooming / Flying logic: zoom accurately to polygon bounds or coordinates
        if (kode && activeBounds && activeBounds.isValid()) {
          map.current.fitBounds(activeBounds.pad(0.09), { maxZoom: 16, animate: true });
        } else if (data.targetBounds) {
          map.current.fitBounds(data.targetBounds, { maxZoom: 15, animate: true, padding: [30, 30] });
        } else if (data.lat && data.lng && kode) {
          map.current.flyTo([data.lat, data.lng], parts.length === 4 ? 15 : parts.length === 3 ? 14 : 10, { animate: true });
        } else {
          map.current.setView([-2.5, 118], 5);
        }
      })
      .catch(error => {
        if (active && error.name !== 'AbortError') setMessage(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [kode]);

  // Render Post Office Markers (from scene offices + current offices prop)
  useEffect(() => {
    if (!markers.current) return;
    markers.current.clearLayers();

    const officeMap = new Map();
    if (scene?.offices?.length) {
      for (const o of scene.offices) {
        if (o.nopend) officeMap.set(o.nopend, o);
      }
    }
    if (offices?.length) {
      for (const o of offices) {
        if (o.nopend && (o.latitude || o.has_gps)) officeMap.set(o.nopend, o);
      }
    }

    let highlightedMarker = null;

    for (const office of officeMap.values()) {
      if (office.latitude == null || office.longitude == null || office.latitude === '' || office.longitude === '') continue;
      const lat = Number(office.latitude), lng = Number(office.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;

      const isHighlighted = selectedOffice && String(selectedOffice.nopend) === String(office.nopend);

      const marker = L.circleMarker([lat, lng], {
        radius: isHighlighted ? 11 : 7,
        color: isHighlighted ? '#b45309' : '#047857',
        fillColor: isHighlighted ? '#f59e0b' : '#10b981',
        fillOpacity: 0.95,
        weight: isHighlighted ? 3.5 : 2,
        bubblingMouseEvents: false
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 170px;">
          <strong style="color: #047857; font-size: 13px; display: block; margin-bottom: 2px;">
            ${office.nama_nopend || office.nama_kantor || office.nopend}
          </strong>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Nopend: <b style="color: #0f172a;">${office.nopend}</b> · ${office.tipe || office.jenis_kantor || 'Kantor Pos'}</div>
          ${office.alamat ? `<div style="font-size: 11px; margin-bottom: 4px;">${office.alamat}</div>` : ''}
          <div style="color: #0284c7; font-size: 10.5px; font-family: monospace;">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.bindTooltip(labelNode(`${office.nama_nopend || office.nama_kantor || office.nopend} (${office.nopend})`));
      marker.on('click', () => callbacks.current.onOfficeSelect?.(office));
      marker.addTo(markers.current);

      if (isHighlighted) {
        highlightedMarker = marker;
      }
    }

    if (highlightedMarker && map.current) {
      highlightedMarker.openPopup();
      const latLng = highlightedMarker.getLatLng();
      map.current.setView([latLng.lat, latLng.lng], Math.max(map.current.getZoom(), 14), { animate: true });
    }
  }, [offices, scene?.offices, selectedOffice]);

  const chain = scene?.selected;
  const chooseRegion = async code => {
    try {
      await onSelect(code);
      setCandidates([]);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const activeLat = scene?.lat;
  const activeLng = scene?.lng;
  const activeLuas = scene?.luas;
  const activePenduduk = scene?.penduduk?.total;

  return (
    <div 
      className="spatial-card" 
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'var(--bg-card, #0f172a)',
        padding: '14px 18px',
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'none'
      } : { 
        padding: 14, 
        position: 'relative' 
      }}
    >
      {/* Top Header & Breadcrumbs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <strong style={{ fontSize: 12, marginRight: 4 }}>Jelajahi wilayah pada peta:</strong>
          <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 9px' }} onClick={() => chooseRegion('')}>
            Indonesia
          </button>
          {[chain?.provinsi, chain?.kabupatenKota, chain?.kecamatan, chain?.desaKelurahan].filter(Boolean).map(item => (
            <button key={item.kode} className="btn-ghost" style={{ fontSize: 11, padding: '4px 9px' }} onClick={() => chooseRegion(item.kode)}>
              {item.nama}
            </button>
          ))}
          {loading && <span role="status" style={{ fontSize: 11, color: 'var(--primary-blue)' }}>Memuat peta…</span>}
        </div>

        {/* Controls: Basemap Switcher & Fullscreen Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Basemap Switcher Toggle */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowBasemapMenu(v => !v)}
              className="btn-ghost"
              style={{ fontSize: 11, padding: '5px 10px', gap: 5, background: 'var(--bg-surface-soft)' }}
              title="Ganti Peta Dasar"
            >
              <Layers size={13} />
              <span>Peta Dasar: <strong>{BASEMAP_TILES[basemap]?.name}</strong></span>
            </button>

            {showBasemapMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 4,
                zIndex: 1100,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                minWidth: 140
              }}>
                {[
                  { id: 'peta', label: 'Peta Jalan (OSM)', icon: MapIcon },
                  { id: 'satelit', label: 'Satelit (Esri)', icon: Globe },
                  { id: 'terrain', label: 'Terrain (Kontur)', icon: Mountain }
                ].map(opt => {
                  const IconComp = opt.icon;
                  const isSelected = basemap === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => switchBasemap(opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        fontSize: 11.5,
                        border: 'none',
                        background: isSelected ? 'var(--primary-blue)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--text-primary)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <IconComp size={13} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={() => setIsFullscreen(v => !v)}
            className="btn-ghost"
            style={{
              fontSize: 11,
              padding: '5px 11px',
              gap: 6,
              background: isFullscreen ? 'var(--primary-blue)' : 'var(--bg-surface-soft)',
              color: isFullscreen ? '#ffffff' : 'var(--text-primary)',
              border: isFullscreen ? '1px solid var(--primary-blue)' : '1px solid var(--border-light)',
              fontWeight: 700
            }}
            title={isFullscreen ? 'Keluar Layar Penuh (Esc)' : 'Perbesar Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullscreen ? 'Keluar Fullscreen (Esc)' : 'Layar Penuh'}</span>
          </button>
        </div>
      </div>

      {/* Status & Hints */}
      <div aria-live="polite" style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
        {message}
      </div>

      {candidates.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {candidates.map(item => (
            <button key={item.kode} className="btn-ghost" onClick={() => chooseRegion(item.kode)}>
              {item.nama} ({item.kode})
            </button>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div style={{ 
        position: 'relative', 
        borderRadius: isFullscreen ? 8 : 10, 
        overflow: 'hidden', 
        flex: isFullscreen ? 1 : 'none',
        display: 'flex',
        flexDirection: 'column',
        minHeight: isFullscreen ? 0 : 470
      }}>
        <div 
          ref={container} 
          aria-label="Peta wilayah interaktif" 
          style={{ 
            height: isFullscreen ? '100%' : 470, 
            width: '100%',
            flex: isFullscreen ? 1 : 'none'
          }} 
        />

        {/* Floating Quick Fullscreen Button on Map */}
        <button
          onClick={() => setIsFullscreen(v => !v)}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 900,
            width: 36,
            height: 36,
            padding: 0,
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f8fafc',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title={isFullscreen ? 'Keluar Layar Penuh (Esc)' : 'Perbesar Layar Penuh'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Info Strip (cahyadsn exact format) */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 14,
          zIndex: 900,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          padding: '6px 14px',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.15)',
          fontSize: 11,
          fontFamily: 'monospace',
          color: '#f8fafc',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <span>KODE: <strong style={{ color: '#38bdf8' }}>{kode || '—'}</strong></span>
          <span>LAT: <strong>{activeLat ? Number(activeLat).toFixed(5) : '—'}</strong></span>
          <span>LNG: <strong>{activeLng ? Number(activeLng).toFixed(5) : '—'}</strong></span>
          {activeLuas && <span>LUAS: <strong>{Number(activeLuas).toLocaleString('id-ID')}</strong> km²</span>}
          {activePenduduk && <span>PENDUDUK: <strong>{Number(activePenduduk).toLocaleString('id-ID')}</strong> jiwa</span>}
        </div>
      </div>

      {/* Legend Footer */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
        <div>
          Batas cyan/biru: boundary wilayah Kemendagri · Pin biru: pusat wilayah terpilih · Titik hijau: kantor pos aktif (klik untuk detail).
        </div>
        <div style={{ fontStyle: 'italic', fontSize: 10.5 }}>
          Data wilayah sesuai Kepmendagri No 300.2.2-2430 Tahun 2025
        </div>
      </div>
    </div>
  );
}
