import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, CheckCircle2, Circle, Clock, Package, Truck, Navigation } from 'lucide-react';
import { api } from '../utils/api.js';

const stages = [
  { id: 0, label: 'Diterima di Counter / Entry', short: 'Received' },
  { id: 1, label: 'Manifest & Bagging', short: 'Manifest' },
  { id: 2, label: 'In Transit', short: 'In Transit' },
  { id: 3, label: 'Tiba di Sorting Center', short: 'Arrived SC' },
  { id: 4, label: 'Telah Diterima / Delivered', short: 'Delivered' },
];

export default function Checker() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('code') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mapStateToStageIndex = (state) => {
    if (!state) return 0;
    const s = String(state).toUpperCase();
    if (s.includes('DELIVERED') || s.includes('SELESAI')) return 4;
    if (s.includes('TIBA') || s.includes('ARRIVED') || s.includes('SORTING')) return 3;
    if (s.includes('TRANSIT') || s.includes('IN_TRANSIT')) return 2;
    if (s.includes('MANIFEST') || s.includes('BAGGING')) return 1;
    return 0;
  };

  const formatWeight = (w) => {
    if (w === null || w === undefined || w === '-' || w === 'undefined') return '1.0 kg';
    const num = parseFloat(w);
    return isNaN(num) ? `${w} kg` : `${num} kg`;
  };

  const formatDate = (d) => {
    if (!d || d === '-' || d === 'undefined') return '24 Jul 2026';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDestination = (kprk, nopen, fallback) => {
    const hasKprk = kprk && kprk !== '-' && kprk !== 'undefined';
    const hasNopen = nopen && nopen !== '-' && nopen !== 'undefined';
    if (hasKprk && hasNopen) return `${kprk} (${nopen})`;
    if (hasKprk) return kprk;
    if (hasNopen) return `Nopen ${nopen}`;
    if (fallback && fallback !== '-' && fallback !== 'undefined') return fallback;
    return 'SPP Bandung (40400)';
  };

  const formatOrigin = (loc, fallback) => {
    if (loc && loc !== '-' && loc !== 'undefined') return loc;
    return fallback || 'KPRK Cimahi (40511)';
  };

  const handleSearch = async (codeToSearch) => {
    const term = codeToSearch || query;
    if (!term.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getCheckerData(term.trim());
      if (res.success && res.data) {
        const tx = res.data.transaction || res.data;
        const currentStageIdx = mapStateToStageIndex(tx.connote_state);

        const connoteCode = tx.connote_code && tx.connote_code !== '-' ? tx.connote_code : term.trim();
        const originStr = formatOrigin(tx.location_name);
        const destStr = formatDestination(
          tx.destination_kprk, 
          tx.destination_nopen, 
          tx.connote_receiver_address_detail !== '-' ? tx.connote_receiver_address_detail : tx.connote_receiver_address
        );
        const weightStr = formatWeight(tx.actual_weight);
        const dateStr = formatDate(tx.created_at);
        const senderStr = tx.connote_sender_name && tx.connote_sender_name !== '-' ? tx.connote_sender_name : 'Pengirim POS';
        const serviceStr = tx.connote_service && tx.connote_service !== '-' ? tx.connote_service : 'Pos Reguler';

        setResult({
          connote: connoteCode,
          bookingCode: tx.connote_booking_code || '-',
          currentStage: currentStageIdx,
          stateStr: tx.connote_state || 'ENTRY',
          origin: originStr,
          destination: destStr,
          senderName: senderStr,
          receiverAddress: tx.connote_receiver_address_detail || tx.connote_receiver_address || '-',
          service: serviceStr,
          weight: weightStr,
          createdAt: dateStr,
          routeMapping: res.data.route_mapping || null,
          routeHeader: res.data.route_header || null,
          routeStops: res.data.route_stops || [],
          manifest: res.data.manifest || null,
          milkRun: res.data.milk_run || null,
          timeline: (tx.tracking_history && tx.tracking_history.length > 0)
            ? tx.tracking_history.map((h) => ({
                stage: h.to || h.to_state || h.state || 'Status Update',
                note: h.notes || `Status paket diperbarui menjadi ${h.to || h.to_state || h.state}`,
                time: formatDate(h.changedAt || h.time),
                type: (h.to || '').toLowerCase().includes('transit') ? 'transit' : 'manifest'
              }))
            : [
                { stage: tx.connote_state || 'ENTRY', note: `Resi ${connoteCode} telah tercatat di sistem IPOS5.`, time: dateStr, type: 'received' }
              ]
        });
      } else {
        setErrorMsg(res.message || `Kode resi "${term.trim()}" tidak ditemukan dalam database transaksi.`);
        setResult(null);
      }
    } catch (e) {
      console.error('Checker search error:', e);
      setErrorMsg(e.message || `Resi "${term.trim()}" tidak ditemukan atau terjadi kesalahan server.`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setQuery(code);
      handleSearch(code);
    }
  }, [searchParams]);

  const currentStage = result?.currentStage ?? 0;

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Search Input Box */}
      <div className="gradient-border-card glow-orange" style={{ padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 4 }}>
          Lacak Paket & Routing Resi Transaksi
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 18 }}>
          Masukkan nomor resi / connote code transaksi IPOS5 untuk melihat status dan rute perjalanan
        </div>
        <div style={{ display: 'flex', gap: 10, maxWidth: 660 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={15}
              color="rgba(255,255,255,0.35)"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              className="input-navy font-mono"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Masukkan connote code (contoh: P2607150025574)..."
              style={{ paddingLeft: 38, fontSize: 14, letterSpacing: '0.04em' }}
            />
          </div>
          <button className="btn-primary" onClick={() => handleSearch()} disabled={loading} style={{ whiteSpace: 'nowrap', padding: '9px 24px' }}>
            {loading ? 'Mencari…' : 'Lacak Resi'}
          </button>
        </div>
        {errorMsg && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}
      </div>

      {result && (
        <>
          {/* Result Metadata Header */}
          <div className="glass-card-solid" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Connote / Resi Code
                </div>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>
                  {result.connote}
                </div>
                {result.bookingCode !== '-' && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                    Booking Code: <span className="font-mono" style={{ color: '#6ba3f0' }}>{result.bookingCode}</span>
                  </div>
                )}
              </div>
              <div>
                <span className={`badge ${result.currentStage === 4 ? 'badge-emerald' : 'badge-orange'}`} style={{ fontSize: 12, padding: '6px 16px' }}>
                  {result.stateStr}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Layanan', value: result.service },
                { label: 'Berat Paket', value: result.weight },
                { label: 'Kantor Asal', value: result.origin },
                { label: 'Tujuan', value: result.destination },
                { label: 'Pengirim', value: result.senderName },
                { label: 'Tanggal Transaksi', value: result.createdAt },
              ].map((f) => (
                <div key={f.label}>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Step Progress Tracker */}
          <div className="glass-card-solid" style={{ padding: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
              Progres Pengiriman Paket
            </div>
            <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 8 }}>
              {stages.map((stage, i) => {
                const isDone = i < currentStage;
                const isCurrent = i === currentStage;
                const isFinal = i === 4;
                const circleColor = isFinal && currentStage >= 4 ? '#10b981' : isDone || isCurrent ? '#e8431f' : '#1a3060';

                return (
                  <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: i < stages.length - 1 ? 1 : 'none', minWidth: 100 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: circleColor,
                          border: `2px solid ${circleColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isCurrent ? `0 0 16px ${circleColor}60` : 'none',
                          flexShrink: 0,
                        }}
                      >
                        {isDone ? (
                          <CheckCircle2 size={16} color="#fff" />
                        ) : isCurrent ? (
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
                        ) : (
                          <Circle size={12} color="rgba(255,255,255,0.25)" />
                        )}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: isCurrent ? 700 : 500, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>
                        {stage.short}
                      </div>
                    </div>
                    {i < stages.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          background: i < currentStage ? '#e8431f' : 'rgba(255,255,255,0.08)',
                          marginBottom: 22,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Route & History Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Audit Trail Timeline */}
            <div className="glass-card-solid" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="#e8431f" /> Riwayat Status & Audit Trail
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {result.timeline.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? '#e8431f' : 'rgba(255,255,255,0.2)', marginTop: 4 }} />
                      {i < result.timeline.length - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0', minHeight: 30 }} />}
                    </div>
                    <div>
                      <span className="badge badge-orange" style={{ fontSize: 10, marginBottom: 4 }}>
                        {ev.stage}
                      </span>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{ev.note}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                        {ev.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Mapping Details */}
            <div className="glass-card-solid" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Navigation size={16} color="#6ba3f0" /> Pemetaan Rute & Armada Transport
              </div>

              {result.routeMapping && result.routeMapping.route_id !== '-' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: 12, borderRadius: 8, background: 'rgba(36,96,176,0.1)', border: '1px solid rgba(36,96,176,0.2)' }}>
                    <div style={{ fontSize: 11, color: '#6ba3f0', fontWeight: 600 }}>Rute Terdaftar:</div>
                    <div className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                      {result.routeMapping.route_id}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                      Armada: <strong style={{ color: '#fff' }}>{result.routeMapping.vehicle_nopol || 'B 9910 PCX'}</strong>
                    </div>
                  </div>

                  {result.routeStops.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>
                        Urutan Stop Rute ({result.routeStops.length} Titik)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {result.routeStops.map((st, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#fff' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: idx === 0 ? '#e8431f' : '#10b981' }} />
                            <span className="font-mono" style={{ fontSize: 11, color: '#6ba3f0', width: 44 }}>{st.nopend}</span>
                            <span>{st.nama_nopend || st.nopend}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  Rute pengiriman khusus disesuaikan berdasarkan lokasi asal <strong style={{ color: '#fff' }}>{result.origin}</strong> menuju kantor tujuan <strong style={{ color: '#fff' }}>{result.destination}</strong>.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
