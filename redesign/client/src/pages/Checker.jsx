import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, CheckCircle2, Circle, Clock, Package, Truck, Navigation, 
  Copy, Check, ArrowRight, RefreshCw, History, ShieldCheck, Zap, Sparkles, X, Filter, Eye
} from 'lucide-react';
import { api } from '../utils/api.js';

const stages = [
  { id: 0, label: 'Diterima di Counter / Entry', short: 'Received', color: '#2460b0', badgeClass: 'badge-blue' },
  { id: 1, label: 'Manifest & Bagging', short: 'Manifest', color: '#6ba3f0', badgeClass: 'badge-blue' },
  { id: 2, label: 'In Transit', short: 'In Transit', color: '#e8431f', badgeClass: 'badge-orange' },
  { id: 3, label: 'Tiba di Sorting Center', short: 'Arrived SC', color: '#f59e0b', badgeClass: 'badge-amber' },
  { id: 4, label: 'Telah Diterima / Delivered', short: 'Delivered', color: '#10b981', badgeClass: 'badge-emerald' },
];

const SAMPLE_RESIS = [
  { code: 'P2607150025574', label: 'Resi Reguler (Cimahi → Bandung)', badge: 'In Transit', badgeClass: 'badge-orange' },
  { code: 'P2607150025588', label: 'Resi Express (KCU Cimahi)', badge: 'Manifest', badgeClass: 'badge-blue' },
  { code: 'P2607150025590', label: 'Resi Kilat (Selesai)', badge: 'Delivered', badgeClass: 'badge-emerald' },
];

const RECENT_TRANSACTIONS_FALLBACK = [
  { connote_code: 'P2607150025574', origin: 'KPRK Cimahi (40511)', destination: 'SPP Bandung (40400)', service: 'Pos Reguler', weight: '1.2 kg', status: 'In Transit', badgeClass: 'badge-orange', date: '24 Jul 2026, 09:14' },
  { connote_code: 'P2607150025588', origin: 'KCP Cililin (40556)', destination: 'KPRK Cimahi (40511)', service: 'Pos Express', weight: '0.8 kg', status: 'Manifest & Bagging', badgeClass: 'badge-blue', date: '24 Jul 2026, 08:45' },
  { connote_code: 'P2607150025590', origin: 'SPP Bandung (40400)', destination: 'KCU Jakarta (10000)', service: 'Pos Nextday', weight: '0.5 kg', status: 'Delivered', badgeClass: 'badge-emerald', date: '24 Jul 2026, 07:30' },
  { connote_code: 'P2607150025601', origin: 'KPC Cimahi Selatan', destination: 'KCU Bandung Raya', service: 'Pos Reguler', weight: '2.1 kg', status: 'Diterima di Counter', badgeClass: 'badge-blue', date: '24 Jul 2026, 06:50' },
  { connote_code: 'P2607150025615', origin: 'KPC Cimahi Utara', destination: 'KCU Sumedang', service: 'Pos Cargo', weight: '5.4 kg', status: 'Tiba di Sorting Center', badgeClass: 'badge-amber', date: '23 Jul 2026, 18:20' },
];

export default function Checker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('code') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [tableFilter, setTableFilter] = useState('ALL');
  
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('ipos5_recent_searches');
      return saved ? JSON.parse(saved) : ['P2607150025574', 'P2607150025588'];
    } catch {
      return ['P2607150025574', 'P2607150025588'];
    }
  });

  const saveRecentSearch = (code) => {
    try {
      const filtered = recentSearches.filter((item) => item.toUpperCase() !== code.toUpperCase());
      const updated = [code, ...filtered].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('ipos5_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent search', e);
    }
  };

  const removeRecentSearch = (e, codeToRemove) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== codeToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem('ipos5_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const mapStateToStageIndex = (state) => {
    if (!state) return 0;
    const s = String(state).toUpperCase();
    if (s.includes('DELIVERED') || s.includes('SELESAI')) return 4;
    if (s.includes('TIBA') || s.includes('ARRIVED') || s.includes('SORTING')) return 3;
    if (s.includes('TRANSIT') || s.includes('IN_TRANSIT')) return 2;
    if (s.includes('MANIFEST') || s.includes('BAGGING')) return 1;
    return 0;
  };

  const getBadgeClassByStage = (stageIdx) => {
    return stages[stageIdx]?.badgeClass || 'badge-navy';
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
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    setQuery(cleanTerm);
    setSearchParams({ code: cleanTerm });
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getCheckerData(cleanTerm);
      if (res.success && res.data) {
        saveRecentSearch(cleanTerm);
        const tx = res.data.transaction || res.data;
        const currentStageIdx = mapStateToStageIndex(tx.connote_state);

        const connoteCode = tx.connote_code && tx.connote_code !== '-' ? tx.connote_code : cleanTerm;
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
          badgeClass: getBadgeClassByStage(currentStageIdx),
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
        setErrorMsg(res.message || `Kode resi "${cleanTerm}" tidak ditemukan dalam database transaksi.`);
        setResult(null);
      }
    } catch (e) {
      console.error('Checker search error:', e);
      setErrorMsg(e.message || `Resi "${cleanTerm}" tidak ditemukan atau terjadi kesalahan server.`);
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

  const handleCopyCode = () => {
    if (result?.connote) {
      navigator.clipboard.writeText(result.connote);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentStage = result?.currentStage ?? 0;

  const filteredTransactions = RECENT_TRANSACTIONS_FALLBACK.filter(tx => {
    if (tableFilter === 'ALL') return true;
    if (tableFilter === 'TRANSIT') return tx.status.includes('Transit');
    if (tableFilter === 'MANIFEST') return tx.status.includes('Manifest');
    if (tableFilter === 'DELIVERED') return tx.status.includes('Delivered');
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      
      {/* Top Search & Toolbar Card */}
      <div className="glass-card-solid" style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <Search
              size={15}
              color="rgba(255,255,255,0.4)"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              className="input-navy font-mono"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Lacak kode resi / connote (contoh: P2607150025574)..."
              style={{ paddingLeft: 38, paddingRight: 36 }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResult(null); setErrorMsg(''); setSearchParams({}); }}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button 
            className="btn-primary" 
            onClick={() => handleSearch()} 
            disabled={loading}
          >
            {loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
            {loading ? 'Mencari...' : 'Lacak Resi'}
          </button>

          {result && (
            <button 
              className="btn-ghost"
              onClick={() => { setResult(null); setQuery(''); setErrorMsg(''); setSearchParams({}); }}
            >
              <RefreshCw size={14} /> Reset Pencarian
            </button>
          )}
        </div>

        {/* Quick Test Chips & Search History */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Sampel Resi:
            </span>
            {SAMPLE_RESIS.map((s) => (
              <button
                key={s.code}
                onClick={() => handleSearch(s.code)}
                className="btn-ghost"
                style={{ padding: '3px 10px', fontSize: 11, borderRadius: 6 }}
              >
                <span className="font-mono" style={{ color: '#6ba3f0', fontWeight: 600 }}>{s.code}</span>
                <span className={`badge ${s.badgeClass}`} style={{ fontSize: 9.5, padding: '1px 6px', marginLeft: 4 }}>
                  {s.badge}
                </span>
              </button>
            ))}
          </div>

          {recentSearches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
                <History size={12} /> Riwayat:
              </span>
              {recentSearches.map((rec) => (
                <div
                  key={rec}
                  onClick={() => handleSearch(rec)}
                  className="badge badge-navy"
                  style={{ cursor: 'pointer', padding: '3px 8px', gap: 4 }}
                >
                  <span className="font-mono" style={{ color: '#fff' }}>{rec}</span>
                  <X size={10} onClick={(e) => removeRecentSearch(e, rec)} style={{ cursor: 'pointer' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {errorMsg && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <X size={14} /> {errorMsg}
          </div>
        )}
      </div>

      {/* Main View Area */}
      {result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Connote Result Header Card */}
          <div className="glass-card-solid" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  Nomor Resi / Connote Code
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div className="font-mono" style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '0.03em' }}>
                    {result.connote}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="btn-ghost"
                    style={{ padding: '3px 8px', fontSize: 11, borderRadius: 6 }}
                  >
                    {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    {copied ? 'Tercopy' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <span className={`badge ${result.badgeClass}`} style={{ fontSize: 12, padding: '6px 16px', fontWeight: 700 }}>
                  {result.stateStr}
                </span>
              </div>
            </div>

            {/* Spec Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Layanan', value: result.service },
                { label: 'Berat Paket', value: result.weight },
                { label: 'Kantor Asal', value: result.origin },
                { label: 'Tujuan', value: result.destination },
                { label: 'Pengirim', value: result.senderName },
                { label: 'Tanggal Transaksi', value: result.createdAt },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Step Stage Tracker Card */}
          <div className="glass-card-solid" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
              Progres Pengiriman Paket (Step {currentStage + 1} dari 5)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 6 }}>
              {stages.map((st, i) => {
                const isDone = i < currentStage;
                const isCurrent = i === currentStage;
                const activeColor = st.color;

                return (
                  <div key={st.id} style={{ display: 'flex', alignItems: 'center', flex: i < stages.length - 1 ? 1 : 'none', minWidth: 120 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: isDone || isCurrent ? activeColor : 'rgba(255,255,255,0.05)',
                          border: `2px solid ${isDone || isCurrent ? activeColor : 'rgba(255,255,255,0.1)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isCurrent ? `0 0 16px ${activeColor}80` : 'none',
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
                      <div style={{ fontSize: 11, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? activeColor : '#fff', textAlign: 'center' }}>
                        {st.short}
                      </div>
                    </div>

                    {i < stages.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          background: i < currentStage ? activeColor : 'rgba(255,255,255,0.08)',
                          marginBottom: 18,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Grid: History Timeline & Route Mapping */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            
            {/* Audit Trail Timeline Card */}
            <div className="glass-card-solid" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={15} color="#e8431f" /> Riwayat Audit Trail
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {result.timeline.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#e8431f' : 'rgba(255,255,255,0.3)', marginTop: 4 }} />
                      {i < result.timeline.length - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0', minHeight: 24 }} />}
                    </div>
                    <div>
                      <span className="badge badge-orange" style={{ fontSize: 10 }}>{ev.stage}</span>
                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{ev.note}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{ev.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Mapping Card */}
            <div className="glass-card-solid" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Navigation size={15} color="#6ba3f0" /> Pemetaan Rute Transportasi
              </div>

              {result.routeMapping && result.routeMapping.route_id !== '-' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 8, background: 'rgba(36,96,176,0.1)', border: '1px solid rgba(36,96,176,0.2)' }}>
                    <div style={{ fontSize: 11, color: '#6ba3f0', fontWeight: 600 }}>Rute Terdaftar:</div>
                    <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                      {result.routeMapping.route_id}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                      Armada: <strong style={{ color: '#fff' }}>{result.routeMapping.vehicle_nopol || 'B 9910 PCX'}</strong>
                    </div>
                  </div>

                  {result.routeStops.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>
                        Titik Singgah Checkpoint ({result.routeStops.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {result.routeStops.map((st, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#fff' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: idx === 0 ? '#e8431f' : '#10b981' }} />
                            <span className="font-mono" style={{ fontSize: 11, color: '#6ba3f0', width: 46 }}>{st.nopend}</span>
                            <span>{st.nama_nopend || st.nopend}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  Rute kargo dikirimkan langsung dari lokasi asal <strong style={{ color: '#fff' }}>{result.origin}</strong> menuju titik tujuan <strong style={{ color: '#fff' }}>{result.destination}</strong>.
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* Default Empty State: Recent Transactions Data Table */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Table Container Card */}
          <div className="glass-card-solid" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Table Header & Quick Filters */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
                  Daftar Transaksi Resi Terbaru
                </h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0 0' }}>
                  Pilih resi dari tabel di bawah ini untuk melacak status dan alur perjalanan kargo.
                </p>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'TRANSIT', label: 'In Transit' },
                  { key: 'MANIFEST', label: 'Manifest' },
                  { key: 'DELIVERED', label: 'Delivered' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTableFilter(f.key)}
                    className="btn-ghost"
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      borderRadius: 6,
                      background: tableFilter === f.key ? 'rgba(232,67,31,0.2)' : 'rgba(255,255,255,0.04)',
                      borderColor: tableFilter === f.key ? 'rgba(232,67,31,0.4)' : 'rgba(255,255,255,0.08)',
                      color: tableFilter === f.key ? '#ff7b59' : 'rgba(255,255,255,0.7)'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Data Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Connote</th>
                    <th>Kantor Asal</th>
                    <th>Kantor Tujuan</th>
                    <th>Layanan</th>
                    <th>Berat</th>
                    <th>Status Kargo</th>
                    <th>Tanggal</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((row) => (
                    <tr key={row.connote_code}>
                      <td>
                        <span className="font-mono" style={{ color: '#6ba3f0', fontWeight: 600 }}>
                          {row.connote_code}
                        </span>
                      </td>
                      <td>{row.origin}</td>
                      <td>{row.destination}</td>
                      <td>{row.service}</td>
                      <td>{row.weight}</td>
                      <td>
                        <span className={`badge ${row.badgeClass}`}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{row.date}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleSearch(row.connote_code)}
                          className="btn-ghost"
                          style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6 }}
                        >
                          <Eye size={12} /> Lacak
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Menampilkan {filteredTransactions.length} dari {RECENT_TRANSACTIONS_FALLBACK.length} transaksi sampel IPOS5</span>
              <span>Terhubung ke Sistem Pos Indonesia</span>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}


