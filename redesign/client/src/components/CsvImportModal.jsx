import { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Trash2, RefreshCw, Sparkles, Copy } from 'lucide-react';
import { api } from '../utils/api.js';

const SAMPLE_CSV_TEMPLATE = `connote,office_code,office_name,event_type,event_datetime,weight_kg,origin_office,destination_office,route_code,vehicle_code,stop_sequence,stop_office
P20260724000001,40511,KCU Cimahi,RECEIVED,2026-07-24 15:30:00,4.5,40511,40400,RT-MALAM-B9910-PCX,B 9910 PCX,1,40511
P20260724000001,40511,KCU Cimahi,SCANNED,2026-07-24 16:02:00,4.5,40511,40400,RT-MALAM-B9910-PCX,B 9910 PCX,1,40511
P20260724000001,40511,KCU Cimahi,MANIFESTED,2026-07-24 16:30:00,4.5,40511,40400,RT-MALAM-B9910-PCX,B 9910 PCX,1,40511
P20260724000001,40511,KCU Cimahi,LOADED,2026-07-24 17:20:00,4.5,40511,40400,RT-MALAM-B9910-PCX,B 9910 PCX,1,40511
P20260724000002,40511,KCU Cimahi,LOADED,2026-07-24 17:25:00,12.0,40511,40000,RT-MALAM-B9910-PCX,B 9910 PCX,1,40511
P20260724000003,40521,KCP Cimahi Selatan,LOADED,2026-07-24 18:00:00,8.5,40521,40400,RT-MALAM-B9910-PCX,B 9910 PCX,2,40521
P20260724000004,40395C1,AGEN ARVINET,ARRIVED,2026-07-24 18:45:00,2.1,40395C1,40553,RT-MALAM-B9910-PCX,B 9910 PCX,3,40395C1`;

export default function CsvImportModal({ isOpen, onClose, onSuccess }) {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target?.result || '');
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca file CSV.');
    };
    reader.readAsText(file);
  };

  const handleInsertSample = () => {
    setCsvText(SAMPLE_CSV_TEMPLATE);
    setErrorMsg('');
  };

  const handleImportSubmit = async () => {
    if (!csvText.trim()) {
      setErrorMsg('Masukkan atau unggah konten CSV terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await api.importDailyOperationCsv(csvText);
      if (res.success && res.summary) {
        setResult(res);
        if (onSuccess && res.summary.datesCovered?.length > 0) {
          onSuccess(res.summary.datesCovered[0]);
        }
      } else {
        setErrorMsg(res.message || 'Gagal memproses file CSV.');
      }
    } catch (err) {
      console.error('CSV import modal submit error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengimpor CSV.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!batchId) return;
    if (!window.confirm(`Konfirmasi hapus seluruh data dari batch import "${batchId}"?`)) return;

    setDeletingBatch(true);
    try {
      const res = await api.deleteImportBatch(batchId);
      if (res.success) {
        alert(res.message || `Batch ${batchId} berhasil dihapus.`);
        setResult(null);
        setCsvText('');
      } else {
        alert(res.message || 'Gagal menghapus batch.');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingBatch(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(4, 9, 26, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        className="glass-card-solid gradient-border-card"
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(13,27,56,0.95), rgba(6,13,31,0.98))',
          border: '1.5px solid rgba(56,189,248,0.3)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(16,185,129,0.2))',
                border: '1px solid rgba(56,189,248,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Upload size={18} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
                Tooling Testing: CSV Importer Daily Operation 📥
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                Import data harian paket, tracking events, & kapasitas rute (Non-Production / QA Tool)
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Action Toolbar & Upload Zone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label
              className="btn-primary"
              style={{
                cursor: 'pointer',
                padding: '7px 16px',
                fontSize: 12,
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Upload size={14} /> Upload File CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            <button
              className="btn-ghost"
              onClick={handleInsertSample}
              style={{ padding: '7px 14px', fontSize: 12, borderRadius: 8, gap: 6, borderColor: 'rgba(56,189,248,0.3)', color: '#38bdf8' }}
            >
              <Sparkles size={14} /> Gunakan Sample CSV Testing
            </button>

            {csvText && (
              <button
                className="btn-ghost"
                onClick={() => { setCsvText(''); setResult(null); setErrorMsg(''); }}
                style={{ padding: '7px 12px', fontSize: 12, borderRadius: 8, marginLeft: 'auto' }}
              >
                Clear Text
              </button>
            )}
          </div>

          {/* Text Area Input */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Isi / Tempel Teks CSV:
            </div>
            <textarea
              className="input-navy font-mono"
              rows={8}
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setErrorMsg(''); }}
              placeholder="Tempel baris CSV di sini (headers: connote,office_code,office_name,event_type,event_datetime,weight_kg,origin_office,destination_office,route_code,vehicle_code,stop_sequence,stop_office)..."
              style={{ width: '100%', fontSize: 11.5, lineHeight: 1.5, resize: 'vertical' }}
            />
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 14px', borderRadius: 10, color: '#f87171', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} /> {errorMsg}
            </div>
          )}

          {/* Result Laporan Summary Card */}
          {result && result.summary && (
            <div
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 12,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#10b981' }}>
                  <CheckCircle2 size={16} /> Import Selesai! Tag Batch ID:
                  <span className="font-mono" style={{ background: 'rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 6, color: '#fff' }}>
                    {result.summary.import_batch_id}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteBatch(result.summary.import_batch_id)}
                  disabled={deletingBatch}
                  className="btn-ghost"
                  style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', gap: 4 }}
                >
                  <Trash2 size={12} /> {deletingBatch ? 'Menghapus...' : 'Rollback / Hapus Batch Ini'}
                </button>
              </div>

              {/* Grid Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Total Baris', val: result.summary.totalLines },
                  { label: 'Baris Diproses', val: result.summary.processedLines, color: '#10b981' },
                  { label: 'Baris Ditolak', val: result.summary.errorLines, color: result.summary.errorLines > 0 ? '#ef4444' : '#fff' },
                  { label: 'Jumlah Paket', val: result.summary.packagesCount, color: '#38bdf8' },
                  { label: 'Event Scanned', val: result.summary.eventsCount, color: '#f59e0b' },
                ].map(m => (
                  <div key={m.label} style={{ background: 'rgba(6,13,31,0.5)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: m.color || '#fff' }}>{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Covered Dates */}
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>
                <strong>Tanggal Operasional Tercover:</strong>{' '}
                {(result.summary.datesCovered || []).map(d => (
                  <span key={d} className="font-mono" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>
                    {d}
                  </span>
                ))}
              </div>

              {/* Error Line Breakdown if any */}
              {result.errors && result.errors.length > 0 && (
                <div style={{ marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: 6 }}>
                    Detail Baris Ditolak ({result.errors.length} error):
                  </div>
                  <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {result.errors.map((err, idx) => (
                      <div key={idx} style={{ fontSize: 11, color: '#fca5a5', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 4 }}>
                        Baris {err.line} (kolom {err.column}): {err.reason} (nilai: &quot;{err.value}&quot;)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            background: 'rgba(6,13,31,0.4)'
          }}
        >
          <button className="btn-ghost" onClick={onClose}>
            Tutup
          </button>

          <button className="btn-primary" onClick={handleImportSubmit} disabled={loading || !csvText.trim()}>
            {loading ? <RefreshCw size={14} className="spin" /> : <Upload size={14} />}
            {loading ? 'Memproses Import...' : 'Import CSV Data Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}
