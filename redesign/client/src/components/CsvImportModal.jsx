import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Trash2, X, RefreshCw, Sparkles } from 'lucide-react';
import { api } from '../utils/api.js';

const SAMPLE_CSV = `connote,office_code,office_name,event_type,event_datetime,weight_kg,origin_office,destination_office,route_code,vehicle_code,stop_sequence,stop_office
P260820010001,40511,KCU Cimahi,ENTRY,2026-08-20 08:30:00,2.5,40511,40400,R-BDG-01,B 9910 PCX,1,40511
P260820010001,40512,KCP Cimahi Selatan,IN_TRANSIT,2026-08-20 09:15:00,2.5,40511,40400,R-BDG-01,B 9910 PCX,2,40512
P260820010001,40513,KCP Cimindi,IN_TRANSIT,2026-08-20 09:45:00,2.5,40511,40400,R-BDG-01,B 9910 PCX,3,40513
P260820010001,40400,SPP Bandung,ARRIVED,2026-08-20 10:30:00,2.5,40511,40400,R-BDG-01,B 9910 PCX,4,40400
P260820020001,40513,KCP Cimindi,ENTRY,2026-08-20 09:00:00,4.2,40513,40400,R-BDG-02,D 8812 AB,1,40513
P260820020001,40400,SPP Bandung,ARRIVED,2026-08-20 10:15:00,4.2,40513,40400,R-BDG-02,D 8812 AB,2,40400`;

export default function CsvImportModal({ isOpen, onClose, onImportSuccess }) {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingBatch, setDeletingBatch] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvText(evt.target.result || '');
      setErrorMsg('');
      setResult(null);
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca file CSV');
    };
    reader.readAsText(file);
  };

  const handleInsertSample = () => {
    setCsvText(SAMPLE_CSV);
    setErrorMsg('');
    setResult(null);
  };

  const handleImportSubmit = async () => {
    if (!csvText.trim()) {
      setErrorMsg('Konten CSV tidak boleh kosong');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.importCsvRaw({ csvContent: csvText });
      if (res.success) {
        setResult(res);
        if (onImportSuccess) {
          onImportSuccess(res.summary);
        }
      } else {
        setErrorMsg(res.message || 'Import gagal diproses');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!batchId || !window.confirm(`Yakin ingin menghapus seluruh data batch ${batchId}? Data transaksi paket ini akan di-rollback.`)) return;

    try {
      setDeletingBatch(true);
      const res = await api.deleteImportBatch(batchId);
      if (res.success) {
        alert(`Batch ${batchId} berhasil dihapus.`);
        setResult(null);
        setCsvText('');
        if (onImportSuccess) onImportSuccess(null);
      } else {
        alert(res.message || 'Gagal menghapus batch');
      }
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan penghapusan batch');
    } finally {
      setDeletingBatch(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 999 }}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 20,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-primary)',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-soft)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--accent-cyan-bg)',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Upload size={18} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                CSV Importer Daily Operation
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Import data harian paket, tracking events, & kapasitas rute
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="capsule-btn-circle"
            style={{ width: 32, height: 32 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
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
              style={{ padding: '7px 14px', fontSize: 12, borderRadius: 8, gap: 6 }}
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
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Isi / Tempel Teks CSV:
            </div>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setErrorMsg(''); }}
              placeholder="Tempel baris CSV di sini (headers: connote,office_code,office_name,event_type,event_datetime,weight_kg,origin_office,destination_office,route_code,vehicle_code,stop_sequence,stop_office)..."
              style={{ width: '100%', fontSize: 11.5, lineHeight: 1.5, resize: 'vertical', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 10, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {errorMsg && (
            <div style={{ background: 'var(--accent-pink-bg)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px 14px', borderRadius: 10, color: 'var(--accent-pink)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} /> {errorMsg}
            </div>
          )}

          {/* Result Laporan Summary Card */}
          {result && result.summary && (
            <div
              className="surface-soft"
              style={{
                background: 'var(--accent-emerald-bg)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 12,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  <CheckCircle2 size={16} /> Import Selesai! Tag Batch ID:
                  <span style={{ background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: 6, color: 'var(--primary-navy)', fontFamily: 'var(--font-mono)' }}>
                    {result.summary.import_batch_id}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteBatch(result.summary.import_batch_id)}
                  disabled={deletingBatch}
                  className="btn-ghost"
                  style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, color: 'var(--accent-pink)', borderColor: 'rgba(244, 63, 94, 0.3)', gap: 4 }}
                >
                  <Trash2 size={12} /> {deletingBatch ? 'Menghapus...' : 'Rollback / Hapus Batch Ini'}
                </button>
              </div>

              {/* Grid Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Total Baris', val: result.summary.totalLines },
                  { label: 'Baris Diproses', val: result.summary.processedLines, color: 'var(--accent-emerald)' },
                  { label: 'Baris Ditolak', val: result.summary.errorLines, color: result.summary.errorLines > 0 ? 'var(--accent-pink)' : 'var(--text-primary)' },
                  { label: 'Jumlah Paket', val: result.summary.packagesCount, color: 'var(--primary-navy)' },
                  { label: 'Event Scanned', val: result.summary.eventsCount, color: 'var(--accent-amber)' },
                ].map(m => (
                  <div key={m.label} className="surface-card" style={{ padding: '8px 12px', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>{m.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: m.color || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Covered Dates */}
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                <strong>Tanggal Operasional Tercover:</strong>{' '}
                {(result.summary.datesCovered || []).map(d => (
                  <span key={d} style={{ background: 'var(--accent-cyan-bg)', border: '1px solid rgba(2, 132, 199, 0.3)', color: 'var(--primary-navy)', padding: '2px 6px', borderRadius: 4, marginRight: 6, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {d}
                  </span>
                ))}
              </div>

              {/* Error Line Breakdown */}
              {result.errors && result.errors.length > 0 && (
                <div style={{ marginTop: 6, borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-pink)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Detail Baris Ditolak ({result.errors.length} error):
                  </div>
                  <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {result.errors.map((err, idx) => (
                      <div key={idx} style={{ fontSize: 11, color: 'var(--accent-pink)', background: 'var(--accent-pink-bg)', padding: '4px 8px', borderRadius: 4 }}>
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
          className="modal-footer"
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            background: 'var(--bg-surface-soft)'
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
