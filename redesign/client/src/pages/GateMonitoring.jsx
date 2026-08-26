import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowRight, FileText, Send, CheckCircle, Package, Clock, 
  FileCheck, Truck, MapPin, RefreshCw, ShieldCheck, Search, Filter,
  Building2, CheckSquare, Sparkles, Database, Check, AlertCircle
} from 'lucide-react';
import { api } from '../utils/api.js';

export default function GateMonitoring() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [notification, setNotification] = useState(null);

  // Live Database States
  const [sessionInfo, setSessionInfo] = useState({
    dispatch_id: 'TRP-20260824-008',
    date: '24 Agu 2026',
    vehicle: 'B 9910 PCX — Gran Max Box',
    driver: 'Ahmad Supriadi',
    route: 'Cimahi → Bandung SC (Main)',
    departure_time: '08:30 WIB'
  });

  const [activeManifestCode, setActiveManifestCode] = useState('MNF000001');
  const [activeManifestStatus, setActiveManifestStatus] = useState('Draft');
  
  const [s1Items, setS1Items] = useState([]);
  const [s2Items, setS2Items] = useState([]);
  const [s3Items, setS3Items] = useState([]);
  const [totalDbCount, setTotalDbCount] = useState(0);

  // Selected connotes for Stage 1 Manifest creation
  const [selectedConnotes, setSelectedConnotes] = useState({});

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 4500);
  };

  // Fetch real-time gate pipeline data from MongoDB
  const fetchLivePipeline = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.getGatePipeline();
      if (res && res.success && res.data) {
        const d = res.data;
        if (d.session) setSessionInfo(d.session);
        if (d.active_manifest_code) setActiveManifestCode(d.active_manifest_code);
        if (d.active_manifest_status) setActiveManifestStatus(d.active_manifest_status);
        
        const stage1 = d.stage1_items || [];
        const stage2 = d.stage2_items || [];
        const stage3 = d.stage3_items || [];

        setS1Items(stage1);
        setS2Items(stage2);
        setS3Items(stage3);
        setTotalDbCount(d.total_db_transactions || 0);

        // Select all stage 1 by default
        const initialSelected = {};
        stage1.forEach(item => {
          initialSelected[item.connote] = true;
        });
        setSelectedConnotes(prev => Object.keys(prev).length === 0 ? initialSelected : prev);

        setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Error fetching live pipeline from DB:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLivePipeline(false);
  }, [fetchLivePipeline]);

  // Real-time polling timer
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLivePipeline(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLivePipeline]);

  // Stage 1 Toggle Selection
  const toggleSelectAllS1 = () => {
    const allSelected = s1Items.every(i => selectedConnotes[i.connote]);
    const updated = {};
    if (!allSelected) {
      s1Items.forEach(i => { updated[i.connote] = true; });
    }
    setSelectedConnotes(updated);
  };

  const toggleSelectConnote = (code) => {
    setSelectedConnotes(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  // Checkpoint 1: Manifest Creation (Bagging) in MongoDB
  const handleManifest = async () => {
    const chosen = s1Items.filter(i => selectedConnotes[i.connote]).map(i => i.connote);
    const connotesToProcess = chosen.length > 0 ? chosen : s1Items.map(i => i.connote);

    if (connotesToProcess.length === 0) {
      showToast('Pilih setidaknya 1 paket untuk dibuatkan manifest.', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.createManifest(connotesToProcess);
      if (res && res.success) {
        showToast(res.message || `Manifest berhasil dibuat di database MongoDB! Status berubah ke IN_MANIFEST.`, 'success');
        await fetchLivePipeline(true);
      } else {
        throw new Error(res?.message || 'Gagal membuat manifest di database.');
      }
    } catch (e) {
      console.error('Error creating manifest:', e);
      showToast(e.message || 'Gagal membuat manifest di database.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Checkpoint 2: Mark Transit in MongoDB
  const handleTransit = async () => {
    if (!activeManifestCode) {
      showToast('Tidak ada manifest aktif untuk diberangkatkan.', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.markTransit(activeManifestCode);
      if (res && res.success) {
        showToast(res.message || `Manifest ${activeManifestCode} resmi diberangkatkan dalam status TRANSIT_SPP_BANDUNG.`, 'success');
        await fetchLivePipeline(true);
      } else {
        throw new Error(res?.message || 'Gagal menandai transit di database.');
      }
    } catch (e) {
      console.error('Error marking transit:', e);
      showToast(e.message || 'Gagal memperbarui status transit di database.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Checkpoint 3: Confirm Final Arrival in MongoDB
  const handleArrive = async () => {
    if (!activeManifestCode) {
      showToast('Tidak ada manifest aktif untuk dikonfirmasi tiba.', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.arriveManifest(activeManifestCode);
      if (res && res.success) {
        showToast(res.message || `Manifest ${activeManifestCode} telah tiba di SPP Tujuan (TIBA_DI_SPP_TUJUAN).`, 'success');
        await fetchLivePipeline(true);
      } else {
        throw new Error(res?.message || 'Gagal mengonfirmasi kedatangan di database.');
      }
    } catch (e) {
      console.error('Error confirming arrival:', e);
      showToast(e.message || 'Gagal mengonfirmasi kedatangan di database.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Pipeline in MongoDB for re-testing
  const handleReset = async () => {
    try {
      setActionLoading(true);
      const res = await api.resetGatePipeline();
      if (res && res.success) {
        showToast(res.message || 'Database berhasil di-reset untuk pengujian siklus simulasi!', 'success');
        await fetchLivePipeline(false);
      }
    } catch (e) {
      console.error('Error resetting gate pipeline:', e);
      showToast('Gagal me-reset pipeline di database.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter list helper
  const filterList = (items) => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.connote.toLowerCase().includes(term) ||
        item.dest.toLowerCase().includes(term) ||
        (item.service && item.service.toLowerCase().includes(term)) ||
        (item.sender && item.sender.toLowerCase().includes(term))
    );
  };

  const selectedCount = s1Items.filter(i => selectedConnotes[i.connote]).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Toast Alert Notification */}
      {notification && (
        <div 
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: notification.type === 'error' ? '#ef4444' : notification.type === 'warning' ? '#f59e0b' : '#10b981',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            fontSize: 13,
            fontWeight: 800,
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="spatial-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--accent-cyan-bg)', border: '1px solid var(--border-light)', padding: 8, borderRadius: 10, display: 'flex' }}>
              <Truck size={22} color="var(--primary-blue)" />
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
              Monitoring Gate &amp; Transit Inbound
            </h1>
            <span className="badge badge-emerald" style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Database size={11} /> Live DB: MongoDB ipos5_reporting ({totalDbCount} Paket)
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Integrasi real-time database pos: Konsolidasi Manifesting &rarr; Pelepasan Transit Armada &rarr; Konfirmasi Tiba di Sorting Hub.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)} 
            className="btn-ghost" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              fontSize: 12,
              background: autoRefresh ? 'var(--accent-emerald-bg)' : 'transparent',
              color: autoRefresh ? 'var(--accent-emerald)' : 'var(--text-secondary)',
              border: autoRefresh ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-light)'
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: autoRefresh ? '#10b981' : '#64748b' }} />
            {autoRefresh ? 'Live Polling: Aktif' : 'Live Polling: Jeda'}
          </button>

          <button onClick={() => fetchLivePipeline(false)} disabled={loading || actionLoading} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <RefreshCw size={14} className={loading || actionLoading ? 'spin' : ''} /> {lastSyncTime ? `Sinkron (${lastSyncTime})` : 'Refresh'}
          </button>

          <button onClick={handleReset} disabled={actionLoading} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-cyan)' }}>
            <Sparkles size={14} /> Reset Siklus DB
          </button>
        </div>
      </div>

      {/* Session Metadata Header */}
      <div className="spatial-card" style={{ padding: '18px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {[
          { label: 'Sesi Dispatch', value: sessionInfo.dispatch_id, mono: true, icon: FileText, color: 'var(--primary-blue)' },
          { label: 'Tanggal Operasional', value: sessionInfo.date, icon: Clock, color: 'var(--text-secondary)' },
          { label: 'Armada Truk Aktif', value: sessionInfo.vehicle, icon: Truck, color: 'var(--accent-amber)' },
          { label: 'Driver Ditugaskan', value: sessionInfo.driver, icon: ShieldCheck, color: 'var(--accent-emerald)' },
          { label: 'Penugasan Koridor', value: sessionInfo.route, icon: MapPin, color: 'var(--accent-cyan)' },
          { label: 'Jadwal Keberangkatan', value: sessionInfo.departure_time, icon: Clock, color: 'var(--accent-purple)' },
        ].map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-surface-soft)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={f.color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {f.label}
                </div>
                <div className={f.mono ? 'font-mono' : ''} style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {f.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Flow Stepper */}
      <div className="spatial-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 240 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: s1Items.length === 0 && s2Items.length > 0 ? 'var(--accent-emerald)' : 'var(--primary-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
            {s1Items.length === 0 && s2Items.length > 0 ? '✓' : '1'}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>1. Manifesting &amp; Bagging</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{s1Items.length} paket siap di Cimahi</div>
          </div>
        </div>

        <div style={{ color: 'var(--border-light)', display: 'flex', alignItems: 'center' }}>
          <ArrowRight size={18} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 240 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: s2Items.length > 0 ? 'var(--accent-amber)' : 'var(--bg-surface-soft)', color: s2Items.length > 0 ? '#fff' : 'var(--text-muted)', border: s2Items.length === 0 ? '1px solid var(--border-light)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
            {s2Items.length === 0 && s3Items.length > 0 ? '✓' : '2'}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>2. Inbound Transit</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{s2Items.length} paket dalam perjalanan</div>
          </div>
        </div>

        <div style={{ color: 'var(--border-light)', display: 'flex', alignItems: 'center' }}>
          <ArrowRight size={18} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 240 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: s3Items.length > 0 ? 'var(--accent-emerald)' : 'var(--bg-surface-soft)', color: s3Items.length > 0 ? '#fff' : 'var(--text-muted)', border: s3Items.length === 0 ? '1px solid var(--border-light)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
            {s3Items.length > 0 ? '✓' : '3'}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>3. Final Arrival di Hub</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{s3Items.length} paket tiba terkonfirmasi</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 450 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Cari connote resi, penerima, atau kantor tujuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 34, height: 38, fontSize: 12.5, boxSizing: 'border-box' }}
          />
        </div>

        {s1Items.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleSelectAllS1} className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
              <CheckSquare size={13} /> {s1Items.every(i => selectedConnotes[i.connote]) ? 'Batal Pilih Semua' : 'Pilih Semua Paket'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>
              {selectedCount} dari {s1Items.length} dipilih
            </span>
          </div>
        )}
      </div>

      {/* 3 Kanban Checkpoint Stages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        
        {/* Stage 1: Manifest Creation */}
        <div
          className="spatial-card"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            border: s1Items.length > 0 ? '1px solid rgba(2, 132, 199, 0.4)' : '1px solid var(--border-light)',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: s1Items.length > 0 ? 'var(--accent-cyan-bg)' : 'var(--bg-surface-soft)',
                border: `2px solid ${s1Items.length > 0 ? 'var(--primary-blue)' : 'var(--border-light)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: s1Items.length > 0 ? 'var(--primary-blue)' : 'var(--text-muted)',
              }}
            >
              1
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Manifest Creation</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Bagging &amp; Konsolidasi Kiriman</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{s1Items.length}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>paket siap</div>
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--accent-cyan-bg)', border: '1px solid rgba(2, 132, 199, 0.25)', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <FileText size={16} color="var(--primary-blue)" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-blue)' }}>Manifest Target ID</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{activeManifestCode}</div>
            </div>
          </div>

          <div style={{ flex: 1, maxHeight: 360, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filterList(s1Items).length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                {s1Items.length === 0 ? '✓ Semua paket di antrean ini telah difinalisasi ke manifest.' : 'Tidak ada paket yang sesuai pencarian.'}
              </div>
            ) : (
              filterList(s1Items).map((item) => {
                const isChecked = !!selectedConnotes[item.connote];
                return (
                  <div 
                    key={item.connote} 
                    className="surface-soft" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10, 
                      padding: '10px 12px', 
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: isChecked ? '1px solid rgba(2, 132, 199, 0.4)' : '1px solid var(--border-light)'
                    }}
                    onClick={() => toggleSelectConnote(item.connote)}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => toggleSelectConnote(item.connote)}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary-blue)' }} 
                    />
                    <Package size={14} color="var(--primary-blue)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--primary-blue)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{item.connote}</span>
                        <span className="badge badge-navy" style={{ fontSize: 9.5, padding: '1px 5px' }}>{item.service}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-primary)', fontWeight: 600, marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.dest}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.weight}</span>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.time}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button 
            className="btn-primary" 
            onClick={handleManifest} 
            disabled={actionLoading || s1Items.length === 0} 
            style={{ width: '100%', justifyContent: 'center', height: 40, gap: 8 }}
          >
            <FileCheck size={16} /> {actionLoading ? 'Menyimpan ke MongoDB...' : `Cetak & Finalisasi Manifest (${selectedCount || s1Items.length} Paket)`}
          </button>
        </div>

        {/* Stage 2: Inbound Transit */}
        <div
          className="spatial-card"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            border: s2Items.length > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-light)',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: s2Items.length > 0 ? 'var(--accent-amber-bg)' : 'var(--bg-surface-soft)',
                border: `2px solid ${s2Items.length > 0 ? 'var(--accent-amber)' : 'var(--border-light)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: s2Items.length > 0 ? 'var(--accent-amber)' : 'var(--text-muted)',
              }}
            >
              2
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Inbound Transit</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Bandung Sorting Center Corridor</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{s2Items.length}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>paket jalan</div>
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--accent-amber-bg)', border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Truck size={16} color="var(--accent-amber)" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)' }}>Status Pengiriman Truk</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 800 }}>
                {s2Items.length > 0 ? `${s2Items.length} Paket Dalam Perjalanan Transit` : 'Belum Ada Paket Transit'}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, maxHeight: 360, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filterList(s2Items).length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                {s1Items.length > 0 ? 'Finalisasi tahap 1 untuk memuat paket ke transit.' : 'Tidak ada paket dalam transit.'}
              </div>
            ) : (
              filterList(s2Items).map((item) => (
                <div key={item.connote} className="surface-soft" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8 }}>
                  <Package size={14} color="var(--accent-amber)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--primary-blue)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{item.connote}</span>
                      <span className="badge badge-amber" style={{ fontSize: 9.5, padding: '1px 5px' }}>{item.service}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-primary)', fontWeight: 600, marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.dest}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.weight}</span>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button 
            className="btn-primary" 
            onClick={handleTransit} 
            disabled={actionLoading || s2Items.length === 0} 
            style={{ width: '100%', justifyContent: 'center', height: 40, gap: 8 }}
          >
            <Send size={16} /> {actionLoading ? 'Menyimpan ke MongoDB...' : `Tandai Berangkat Transit (${s2Items.length} Paket)`}
          </button>
        </div>

        {/* Stage 3: Final Arrival */}
        <div
          className="spatial-card"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            border: s3Items.length > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-light)',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: s3Items.length > 0 ? 'var(--accent-emerald-bg)' : 'var(--bg-surface-soft)',
                border: `2px solid ${s3Items.length > 0 ? 'var(--accent-emerald)' : 'var(--border-light)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: s3Items.length > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)',
              }}
            >
              3
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Final Arrival</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tiba di Kantor &amp; Hub Tujuan</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent-emerald)', lineHeight: 1 }}>{s3Items.length}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>tiba di hub</div>
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--accent-emerald-bg)', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <CheckCircle size={16} color="var(--accent-emerald)" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)' }}>Verifikasi Masuk Hub</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 800 }}>
                {s3Items.length > 0 ? `${s3Items.length} Paket Telah Tiba di Hub` : 'Menunggu Kedatangan Truk'}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, maxHeight: 360, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filterList(s3Items).length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                {s2Items.length > 0 ? 'Truk sedang menuju lokasi hub tujuan...' : 'Belum ada paket yang tiba di hub.'}
              </div>
            ) : (
              filterList(s3Items).map((item) => (
                <div key={item.connote} className="surface-soft" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8 }}>
                  <Package size={14} color="var(--accent-emerald)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--primary-blue)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{item.connote}</span>
                      <span className="badge badge-emerald" style={{ fontSize: 9.5, padding: '1px 5px' }}>{item.service}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-primary)', fontWeight: 600, marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.dest}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.weight}</span>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleArrive}
            disabled={actionLoading || s2Items.length === 0}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              height: 40,
              gap: 8,
              background: s2Items.length > 0 ? 'var(--accent-emerald)' : 'var(--bg-surface-soft)',
              color: s2Items.length > 0 ? '#ffffff' : 'var(--text-muted)',
              border: 'none'
            }}
          >
            <CheckCircle size={16} /> {actionLoading ? 'Menyimpan ke MongoDB...' : `Konfirmasi Kedatangan di Hub (${s2Items.length} Paket)`}
          </button>
        </div>

      </div>
    </div>
  );
}
