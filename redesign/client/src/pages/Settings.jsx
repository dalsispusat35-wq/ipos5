import { useState, useEffect } from 'react';
import { 
  Eye, EyeOff, Wifi, WifiOff, Save, RefreshCw, Shield,
  Newspaper, Plus, Edit2, Trash2, ExternalLink, Globe, Search,
  X, Check, Filter, Image as ImageIcon, Calendar, AlertCircle, Radio, Upload
} from 'lucide-react';
import { api } from '../utils/api.js';
import { processImageFile } from '../utils/imageHelper.js';

const FALLBACK_PREVIEWS = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&auto=format&fit=crop&q=80'
];

export default function SettingsPage({ activeConnection, onConnectionSwitch, onDisconnect }) {
  const [uri, setUri] = useState('mongodb://127.0.0.1:27017/ipos5_reporting');
  const [showUri, setShowUri] = useState(false);
  const [connected, setConnected] = useState(true);
  const [testing, setTesting] = useState(false);
  const [lastTested, setLastTested] = useState('24 Jul 2026, 07:05 WIB');

  // ── News Management Admin States ──
  const [newsList, setNewsList] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [syncingNews, setSyncingNews] = useState(false);
  const [newsSearch, setNewsSearch] = useState('');
  const [newsFilterType, setNewsFilterType] = useState('all'); // 'all' | 'manual' | 'scraped'
  const [newsPage, setNewsPage] = useState(1);
  const [newsTotalPages, setNewsTotalPages] = useState(1);
  const [newsTotalCount, setNewsTotalCount] = useState(0);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalForm, setModalForm] = useState({
    title: '',
    sourceUrl: '',
    sourceName: 'PT Pos Indonesia (Official)',
    imageUrl: '',
    publishedAt: new Date().toISOString().slice(0, 10),
    summary: ''
  });
  const [savingNews, setSavingNews] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [adminImageTab, setAdminImageTab] = useState('upload'); // 'upload' | 'preset' | 'url'
  const [uploadedInfo, setUploadedInfo] = useState(null);

  const handleAdminFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setFormError('');
      const processed = await processImageFile(file, 1200, 800, 0.85);
      setUploadedInfo(processed);
      setModalForm(prev => ({ ...prev, imageUrl: processed.dataUrl }));
    } catch (err) {
      setFormError(err.message || 'Gagal memproses file foto');
    }
  };

  const handleAdminDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      setFormError('');
      const processed = await processImageFile(file, 1200, 800, 0.85);
      setUploadedInfo(processed);
      setModalForm(prev => ({ ...prev, imageUrl: processed.dataUrl }));
    } catch (err) {
      setFormError(err.message || 'Gagal memproses file foto drop');
    }
  };

  useEffect(() => {
    if (activeConnection) {
      setConnected(true);
      if (activeConnection.uri) setUri(activeConnection.uri);
    }
  }, [activeConnection]);

  // Load news list for admin table
  const loadNews = async () => {
    try {
      setLoadingNews(true);
      let query = `page=${newsPage}&limit=15`;
      if (newsSearch) query += `&search=${encodeURIComponent(newsSearch)}`;
      if (newsFilterType === 'manual') query += `&isManual=true`;
      if (newsFilterType === 'scraped') query += `&isManual=false`;

      const res = await api.getNews(query);
      if (res.success && Array.isArray(res.data)) {
        setNewsList(res.data);
        if (res.pagination) {
          setNewsTotalPages(res.pagination.pages || 1);
          setNewsTotalCount(res.pagination.total || res.data.length);
        }
      }
    } catch (err) {
      console.error('Error loading news list:', err);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [newsPage, newsFilterType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setNewsPage(1);
    loadNews();
  };

  const handleTest = async () => {
    setTesting(true);
    setConnected(false);
    try {
      const res = await api.testDbConnection({ uri });
      if (res.success && res.connected) {
        setConnected(true);
        if (onConnectionSwitch) onConnectionSwitch({ name: 'Active DB', uri, color: 'var(--accent-emerald)' });
      } else {
        setConnected(false);
      }
    } catch (e) {
      console.error('Error testing connection:', e);
      setConnected(false);
    } finally {
      setTesting(false);
      setLastTested(new Date().toLocaleString('id-ID') + ' WIB');
    }
  };

  // Sync / Scrape RSS
  const handleSyncNews = async () => {
    try {
      setSyncingNews(true);
      const res = await api.scrapeNews();
      setActionSuccess(res.message || 'Sinkronisasi RSS berhasil!');
      setTimeout(() => setActionSuccess(''), 4000);
      await loadNews();
    } catch (err) {
      alert(`Gagal sinkronisasi: ${err.message}`);
    } finally {
      setSyncingNews(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setModalForm({
      title: '',
      sourceUrl: '',
      sourceName: 'PT Pos Indonesia (Official)',
      imageUrl: FALLBACK_PREVIEWS[0],
      publishedAt: new Date().toISOString().slice(0, 10),
      summary: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setModalForm({
      title: item.title || '',
      sourceUrl: item.sourceUrl || '',
      sourceName: item.sourceName || 'PT Pos Indonesia',
      imageUrl: item.imageUrl || '',
      publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      summary: item.summary || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveNews = async (e) => {
    e.preventDefault();
    if (!modalForm.title.trim()) {
      setFormError('Judul berita wajib diisi.');
      return;
    }

    try {
      setSavingNews(true);
      setFormError('');

      if (editingItem) {
        // Update
        const res = await api.updateNews(editingItem._id, modalForm);
        if (res.success) {
          setActionSuccess('Berita berhasil diperbarui');
          setIsModalOpen(false);
          await loadNews();
        } else {
          setFormError(res.message || 'Gagal memperbarui berita');
        }
      } else {
        // Create manual
        const res = await api.createManualNews(modalForm);
        if (res.success) {
          setActionSuccess('Berita manual berhasil ditambahkan');
          setIsModalOpen(false);
          await loadNews();
        } else {
          setFormError(res.message || 'Gagal menambahkan berita');
        }
      }
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan berita');
    } finally {
      setSavingNews(false);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  // Delete News
  const handleDeleteNews = async (item) => {
    if (!window.confirm(`Yakin ingin menghapus berita: "${item.title}"?`)) {
      return;
    }

    try {
      const res = await api.deleteNews(item._id);
      if (res.success) {
        setActionSuccess('Berita berhasil dihapus');
        setTimeout(() => setActionSuccess(''), 3000);
        await loadNews();
      } else {
        alert(res.message || 'Gagal menghapus berita');
      }
    } catch (err) {
      alert(`Gagal menghapus berita: ${err.message}`);
    }
  };

  const manualCount = newsList.filter(n => n.isManual).length;
  const scrapedCount = newsList.filter(n => !n.isManual).length;

  return (
    <div style={{ maxWidth: 1080, display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 30 }}>
      
      {/* Action Toast Alert */}
      {actionSuccess && (
        <div 
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: 'var(--accent-emerald-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-emerald)',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <Check size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ── SECTION: NEWS FEED MANAGEMENT (ADMIN) ── */}
      <div className="spatial-card" style={{ padding: 26 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Newspaper size={22} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                Manajemen Berita (News Feed POSIND)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Kelola feed berita Google News RSS & publikasi berita korporasi manual di Dashboard
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSyncNews}
              disabled={syncingNews}
              className="btn-ghost"
              style={{ fontSize: 12, padding: '8px 14px', borderRadius: 8, gap: 6 }}
              title="Tarik berita RSS terbaru sekarang"
            >
              <RefreshCw size={14} className={syncingNews ? 'spin' : ''} />
              <span>{syncingNews ? 'Sedang Sinkronisasi…' : 'Sinkronkan RSS Sekarang'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn-primary"
              style={{ fontSize: 12, padding: '8px 16px', borderRadius: 8, gap: 6 }}
            >
              <Plus size={15} />
              <span>Tambah Berita Manual</span>
            </button>
          </div>
        </div>

        {/* Mini KPI summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div className="surface-soft" style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Berita Terdata</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary-navy)', marginTop: 2 }}>{newsTotalCount}</div>
          </div>
          <div className="surface-soft" style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scraped (Google News)</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary-blue)', marginTop: 2 }}>
              {newsTotalCount - (newsList.filter(n => n.isManual).length > 0 ? manualCount : 0)}
            </div>
          </div>
          <div className="surface-soft" style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Berita Manual Admin</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent-orange)', marginTop: 2 }}>{manualCount}</div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240, maxWidth: 420 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                value={newsSearch}
                onChange={(e) => setNewsSearch(e.target.value)}
                placeholder="Cari judul berita atau sumber…"
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 36px 0 12px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <Search size={15} />
              </button>
            </div>
          </form>

          {/* Type Filter Pills */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[
              { id: 'all', label: 'Semua Berita' },
              { id: 'scraped', label: 'RSS Scraped' },
              { id: 'manual', label: 'Manual Admin' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setNewsFilterType(tab.id); setNewsPage(1); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: '1px solid',
                  cursor: 'pointer',
                  background: newsFilterType === tab.id ? 'var(--primary-navy)' : 'transparent',
                  borderColor: newsFilterType === tab.id ? 'var(--primary-navy)' : 'var(--border-light)',
                  color: newsFilterType === tab.id ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border-light)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-soft)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)', width: 70 }}>Foto</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)' }}>Judul Berita & Ringkasan</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)', width: 140 }}>Sumber Media</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)', width: 120 }}>Tanggal Terbit</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)', width: 100 }}>Tipe</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)', width: 110, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loadingNews ? (
                <tr>
                  <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={18} className="spin" style={{ margin: '0 auto 8px' }} />
                    <div>Memuat daftar berita…</div>
                  </td>
                </tr>
              ) : newsList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Newspaper size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <div style={{ fontWeight: 700 }}>Tidak ada data berita yang cocok</div>
                    <div style={{ fontSize: 11.5, marginTop: 4 }}>Klik "Sinkronkan RSS Sekarang" atau "Tambah Berita Manual" di atas.</div>
                  </td>
                </tr>
              ) : (
                newsList.map((item) => (
                  <tr 
                    key={item._id} 
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-soft)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Thumbnail */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ width: 50, height: 40, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-surface-soft)' }}>
                        <img 
                          src={item.imageUrl || FALLBACK_PREVIEWS[0]} 
                          alt="Thumb" 
                          onError={(e) => { e.target.src = FALLBACK_PREVIEWS[0]; }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    </td>

                    {/* Judul & Summary */}
                    <td style={{ padding: '10px 14px', maxWidth: 360 }}>
                      <div style={{ fontWeight: 750, color: 'var(--text-primary)', marginBottom: 3, lineHeight: 1.3 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 350 }}>
                        {item.summary || item.title}
                      </div>
                    </td>

                    {/* Sumber */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 600 }}>
                        <Globe size={12} color="var(--primary-blue)" />
                        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.sourceName || 'PT Pos Indonesia'}
                        </span>
                      </div>
                    </td>

                    {/* Tanggal */}
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>

                    {/* Badge Tipe */}
                    <td style={{ padding: '10px 14px' }}>
                      {item.isManual ? (
                        <span className="badge badge-amber" style={{ fontSize: 10, padding: '2px 8px' }}>
                          MANUAL
                        </span>
                      ) : (
                        <span className="badge badge-navy" style={{ fontSize: 10, padding: '2px 8px' }}>
                          RSS FEED
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        {item.sourceUrl && item.sourceUrl !== '#' && (
                          <button
                            type="button"
                            onClick={() => window.open(item.sourceUrl, '_blank', 'noopener,noreferrer')}
                            className="btn-ghost"
                            style={{ padding: 6, borderRadius: 6 }}
                            title="Buka URL Berita Asli"
                          >
                            <ExternalLink size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="btn-ghost"
                          style={{ padding: 6, borderRadius: 6, color: 'var(--primary-blue)' }}
                          title="Edit Berita"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNews(item)}
                          className="btn-ghost"
                          style={{ padding: 6, borderRadius: 6, color: 'var(--accent-pink)' }}
                          title="Hapus Berita"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {newsTotalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <button
              type="button"
              disabled={newsPage <= 1}
              onClick={() => setNewsPage(p => Math.max(1, p - 1))}
              className="btn-ghost"
              style={{ fontSize: 11.5, padding: '4px 10px' }}
            >
              Sebelumnya
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Halaman {newsPage} dari {newsTotalPages}
            </span>
            <button
              type="button"
              disabled={newsPage >= newsTotalPages}
              onClick={() => setNewsPage(p => Math.min(newsTotalPages, p + 1))}
              className="btn-ghost"
              style={{ fontSize: 11.5, padding: '4px 10px' }}
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* ── MODAL: TAMBAH / EDIT BERITA MANUAL ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div 
            className="surface-card modal-content" 
            style={{ width: '100%', maxWidth: 580, padding: 24, borderRadius: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Newspaper size={20} color="var(--primary-blue)" />
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {editingItem ? 'Edit Berita' : 'Tambah Berita Manual'}
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="btn-ghost" 
                style={{ padding: 6, borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--accent-pink-bg)', color: 'var(--accent-pink)', fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveNews} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Judul Berita */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Judul Berita *
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.title}
                  onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                  placeholder="Masukkan judul berita PT Pos Indonesia…"
                  style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Source Name & URL */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    Nama Sumber / Media
                  </label>
                  <input
                    type="text"
                    value={modalForm.sourceName}
                    onChange={(e) => setModalForm({ ...modalForm, sourceName: e.target.value })}
                    placeholder="Contoh: Humas Pos Indonesia"
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    Tanggal Terbit
                  </label>
                  <input
                    type="date"
                    value={modalForm.publishedAt}
                    onChange={(e) => setModalForm({ ...modalForm, publishedAt: e.target.value })}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Source URL */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  URL Sumber / Link Eksternal (Opsional)
                </label>
                <input
                  type="url"
                  value={modalForm.sourceUrl}
                  onChange={(e) => setModalForm({ ...modalForm, sourceUrl: e.target.value })}
                  placeholder="https://posindonesia.co.id/news/..."
                  style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* ── IMAGE SELECTOR WITH FILE UPLOAD TAB ── */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Foto Banner Berita
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { id: 'upload', label: 'Upload Berkas' },
                      { id: 'preset', label: 'Koleksi Preset' },
                      { id: 'url', label: 'Tautan URL' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAdminImageTab(tab.id)}
                        style={{
                          padding: '2px 7px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: adminImageTab === tab.id ? 800 : 600,
                          background: adminImageTab === tab.id ? 'var(--accent-orange-bg)' : 'transparent',
                          color: adminImageTab === tab.id ? 'var(--accent-orange)' : 'var(--text-muted)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab: Upload from Computer */}
                {adminImageTab === 'upload' && (
                  <div>
                    <label
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleAdminDrop}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        padding: '16px',
                        borderRadius: 10,
                        border: '2px dashed var(--border-light)',
                        background: 'var(--bg-surface-soft)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleAdminFileChange}
                        style={{ display: 'none' }}
                      />
                      <Upload size={22} color="var(--accent-orange)" style={{ marginBottom: 4 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Pilih foto dari komputer atau drag & drop ke sini
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                        PNG, JPG, JPEG, WebP (Otomatis dikompres)
                      </span>
                    </label>
                  </div>
                )}

                {/* Tab: Presets */}
                {adminImageTab === 'preset' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {FALLBACK_PREVIEWS.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setModalForm({ ...modalForm, imageUrl: img });
                          setUploadedInfo(null);
                        }}
                        style={{
                          height: 55,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: modalForm.imageUrl === img ? '2px solid var(--accent-orange)' : '1px solid var(--border-light)',
                          cursor: 'pointer',
                          transform: modalForm.imageUrl === img ? 'scale(1.03)' : 'scale(1)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img src={img} alt="pick" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: URL */}
                {adminImageTab === 'url' && (
                  <input
                    type="url"
                    value={modalForm.imageUrl}
                    onChange={(e) => {
                      setModalForm({ ...modalForm, imageUrl: e.target.value });
                      setUploadedInfo(null);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                  />
                )}

                {/* Live Preview */}
                {modalForm.imageUrl && (
                  <div 
                    style={{ 
                      marginTop: 8, 
                      position: 'relative', 
                      height: 90, 
                      borderRadius: 8, 
                      overflow: 'hidden', 
                      border: '1px solid var(--border-light)' 
                    }}
                  >
                    <img 
                      src={modalForm.imageUrl} 
                      alt="Banner Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 6,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(0,0,0,0.75)',
                        color: '#ffffff',
                        fontSize: 9.5,
                        fontWeight: 700
                      }}
                    >
                      {uploadedInfo ? `Foto Komputer (${uploadedInfo.sizeKb} KB)` : 'Preview Banner'}
                    </div>

                    <button
                      type="button"
                      onClick={() => setModalForm(prev => ({ ...prev, imageUrl: '' }))}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        padding: 4,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.7)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      title="Hapus foto"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Ringkasan / Cuplikan Singkat
                </label>
                <textarea
                  rows={3}
                  value={modalForm.summary}
                  onChange={(e) => setModalForm({ ...modalForm, summary: e.target.value })}
                  placeholder="Tuliskan 1-3 kalimat ringkasan penting mengenai berita ini…"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingNews}
                  className="btn-primary"
                  style={{ minWidth: 120, justifyContent: 'center' }}
                >
                  {savingNews ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                  <span>{savingNews ? 'Menyimpan…' : 'Simpan Berita'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Database Connection Settings Card */}
      <div className="spatial-card" style={{ padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--accent-cyan-bg)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
            }}
          >
            <Wifi size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Database Connection</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              MongoDB connection string for IPOS5 data store (Live Sync)
            </div>
          </div>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 20,
              background: connected ? 'var(--accent-emerald-bg)' : 'var(--accent-pink-bg)',
              border: `1px solid ${connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: connected ? 'var(--accent-emerald)' : 'var(--accent-pink)',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 800, color: connected ? 'var(--accent-emerald)' : 'var(--accent-pink)' }}>
              {connected ? 'Connected' : testing ? 'Testing…' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7, textTransform: 'uppercase' }}>
            Connection URI
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showUri ? 'text' : 'password'}
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 42px 0 12px',
                borderRadius: 8,
                fontFamily: 'var(--font-mono)',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={() => setShowUri(!showUri)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              {showUri ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            Format: mongodb://[username:password@]host[:port]/database[?options]
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Host', value: '127.0.0.1' },
            { label: 'Port', value: '27017' },
            { label: 'Database', value: 'ipos5_reporting' },
            { label: 'Auth Source', value: 'admin' },
            { label: 'Username', value: 'ipos_user' },
            { label: 'Pool Size', value: '10' },
          ].map((f) => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                {f.label}
              </label>
              <input 
                defaultValue={f.value} 
                style={{ 
                  width: '100%', 
                  height: 36, 
                  padding: '0 10px', 
                  borderRadius: 6, 
                  fontSize: 12, 
                  fontFamily: 'var(--font-mono)',
                  boxSizing: 'border-box'
                }} 
              />
            </div>
          ))}
        </div>

        <div className="surface-soft" style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          {connected ? <Wifi size={14} color="var(--accent-emerald)" /> : <WifiOff size={14} color="var(--accent-pink)" />}
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Last tested: {lastTested}</span>
          <span style={{ fontSize: 12, color: connected ? 'var(--accent-emerald)' : 'var(--accent-pink)', fontWeight: 700 }}>
            {connected ? '· Latency: 4ms (Optimal)' : '· Connection refused'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={handleTest} disabled={testing} style={{ minWidth: 160, justifyContent: 'center' }}>
            {testing ? <RefreshCw size={14} className="spin" /> : <Wifi size={14} />}
            {testing ? 'Testing Connection…' : 'Test Connection'}
          </button>
          <button className="btn-ghost" style={{ gap: 6 }}><Save size={14} /> Save Changes</button>
        </div>
      </div>

      {/* System Preferences */}
      <div className="spatial-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Shield size={18} color="var(--accent-cyan)" />
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>System Preferences</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Branch Code', desc: 'The branch identifier for this installation', value: '40511' },
            { label: 'Branch Name', desc: 'Display name shown in reports', value: 'KPRK Cimahi' },
            { label: 'Session Timeout', desc: 'Auto-logout after inactivity (minutes)', value: '60' },
            { label: 'Default Page Size', desc: 'Records per page in data tables', value: '25' },
          ].map((f, i) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.desc}</div>
              </div>
              <input 
                defaultValue={f.value} 
                style={{ 
                  width: 160, 
                  height: 36, 
                  padding: '0 10px', 
                  borderRadius: 6, 
                  fontSize: 13, 
                  fontFamily: 'var(--font-mono)'
                }} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Application Meta Info Footer */}
      <div className="surface-soft" style={{ padding: '14px 18px', borderRadius: 10, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {[
          { label: 'Application', value: 'IPOS5 Dashboard Enterprise' },
          { label: 'Version', value: 'v3.2.0 (Unified Theme)' },
          { label: 'Build', value: '20260824-RELEASE' },
          { label: 'License', value: 'PT Pos Indonesia (Persero)' },
        ].map((f) => (
          <div key={f.label}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2, fontWeight: 700 }}>{f.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
