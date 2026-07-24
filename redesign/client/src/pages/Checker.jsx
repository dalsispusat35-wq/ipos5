import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, CheckCircle2, Circle, Clock, ArrowRight, Package } from 'lucide-react';
import { api } from '../utils/api.js';

const stages = [
  { id: 0, label: 'Received at Cimahi', short: 'Received' },
  { id: 1, label: 'In Manifest', short: 'Manifest' },
  { id: 2, label: 'In Transit to Bandung SC', short: 'In Transit' },
  { id: 3, label: 'Arrived at Destination SC', short: 'Arrived SC' },
  { id: 4, label: 'Delivered', short: 'Delivered' },
];

export default function Checker({ activeConnection }) {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('code') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mapStateToStageIndex = (state) => {
    if (!state) return 0;
    const s = state.toUpperCase();
    if (s.includes('DELIVERED')) return 4;
    if (s.includes('TIBA') || s.includes('ARRIVED')) return 3;
    if (s.includes('TRANSIT')) return 2;
    if (s.includes('MANIFEST')) return 1;
    return 0;
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

        setResult({
          connote: tx.connote_code || term.trim(),
          currentStage: currentStageIdx,
          origin: tx.custom_field?.origin_kprk || 'KPRK Cimahi — Jl. Amir Mahmud No.553, Cimahi',
          originCode: '40511',
          destination: tx.custom_field?.destination_kprk || 'KCU Garut — Jl. Ciledug No.138, Garut',
          destCode: '44114',
          service: tx.connote?.connote_service || 'Pos Ekspres',
          weight: tx.connote?.actual_weight ? `${tx.connote.actual_weight} kg` : '5.2 kg',
          receiver: tx.connote?.connote_receiver_name || 'Budi Hartono',
          timeline: (tx.tracking_history && tx.tracking_history.length > 0) 
            ? tx.tracking_history.map((h) => ({
                stage: h.to_state || h.state || 'Status Update',
                note: h.notes || `Package status updated to ${h.to_state || h.state}`,
                time: h.changedAt ? new Date(h.changedAt).toLocaleString('id-ID') : '24 Jul 2026, 08:30',
                type: (h.to_state || '').toLowerCase().includes('transit') ? 'transit' : 'manifest'
              }))
            : [
                { stage: 'In Transit to Bandung SC', note: 'Departed from KPRK Cimahi, manifested in CODS-TRP-240724-008', time: '24 Jul 2026, 08:30', type: 'transit' },
                { stage: 'In Manifest', note: 'Package consolidated into Manifest MNFST-240724-014 by operator Sari R.', time: '24 Jul 2026, 07:45', type: 'manifest' },
                { stage: 'Received at Cimahi', note: 'Package received and weighed at KPRK Cimahi counter.', time: '24 Jul 2026, 07:12', type: 'received' },
              ]
        });
      } else {
        setErrorMsg('Connote number not found in database.');
        setResult(null);
      }
    } catch (e) {
      console.error('Checker search error:', e);
      setErrorMsg('Failed to query package tracking from server.');
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
          Track Package
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 18 }}>
          Enter a connote number or tracking code to view shipment status
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
              placeholder="e.g. 00130000110724003"
              style={{ paddingLeft: 38, fontSize: 14, letterSpacing: '0.04em' }}
            />
          </div>
          <button className="btn-primary" onClick={() => handleSearch()} disabled={loading} style={{ whiteSpace: 'nowrap', padding: '9px 22px' }}>
            {loading ? 'Searching…' : 'Track'}
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              setQuery('00130000110724003');
              handleSearch('00130000110724003');
            }}
            style={{ whiteSpace: 'nowrap', fontSize: 12 }}
          >
            Demo
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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Connote Number
                </div>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>
                  {result.connote}
                </div>
              </div>
              <div>
                <span className={`badge ${result.currentStage === 4 ? 'badge-emerald' : 'badge-orange'}`} style={{ fontSize: 12, padding: '5px 14px' }}>
                  {stages[result.currentStage].label}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Service', value: result.service },
                { label: 'Weight', value: result.weight },
                { label: 'Receiver', value: result.receiver },
                { label: 'Est. Delivery', value: '25 Jul 2026' },
              ].map((f) => (
                <div key={f.label}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Step Progress Tracker */}
          <div className="glass-card-solid" style={{ padding: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
              Shipment Progress
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {stages.map((stage, i) => {
                const isDone = i < currentStage;
                const isCurrent = i === currentStage;
                const isFinal = i === 4;
                const circleColor = isFinal && currentStage >= 4 ? '#10b981' : isDone || isCurrent ? '#e8431f' : '#1a3060';

                return (
                  <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: i < stages.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: 90 }}>
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
                          boxShadow: isCurrent ? `0 0 16px ${circleColor}60, 0 0 32px ${circleColor}30` : 'none',
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

          {/* Timeline & Route Diagram */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Audit Trail Timeline */}
            <div className="glass-card-solid" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 20 }}>
                Status History
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
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {ev.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Diagram Flow */}
            <div className="glass-card-solid" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                Route Node Diagram
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(232,67,31,0.08)', border: '1px solid rgba(232,67,31,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <MapPin size={14} color="#e8431f" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Origin</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{result.origin}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: '#e8431f', marginTop: 3 }}>40511</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ArrowRight size={14} color="rgba(255,255,255,0.3)" style={{ transform: 'rotate(90deg)' }} />
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(36,96,176,0.1)', border: '1px solid rgba(36,96,176,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <MapPin size={14} color="#6ba3f0" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Sorting Center</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Bandung Sorting Center</div>
                    <div className="font-mono" style={{ fontSize: 11, color: '#6ba3f0', marginTop: 3 }}>40000</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ArrowRight size={14} color="rgba(255,255,255,0.3)" style={{ transform: 'rotate(90deg)' }} />
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <MapPin size={14} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Destination</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{result.destination}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: '#10b981', marginTop: 3 }}>{result.destCode}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!result && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          <Package size={48} style={{ marginBottom: 12, opacity: 0.2 }} />
          <div>Enter a connote number above to track a shipment</div>
        </div>
      )}
    </div>
  );
}
