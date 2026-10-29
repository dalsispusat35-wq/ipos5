import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Newspaper, ExternalLink, RefreshCw, Calendar, Globe, Sparkles, 
  ArrowUpRight, Radio, Plus, X, Save, Check, UploadCloud, BookOpen, 
  Clock, Building2, Truck, Layers, Trash2, CheckCircle2, ShieldCheck,
  Search, ArrowRight, Bell, Sparkle, Tag
} from 'lucide-react';
import { api } from '../utils/api.js';
import { processImageFile } from '../utils/imageHelper.js';

// Curated high quality POSIND themed presets
const THEMED_PRESETS = [
  {
    name: 'Gedung & Korporat',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=80'
  },
  {
    name: 'Armada Truk Logistik',
    url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1000&auto=format&fit=crop&q=80'
  },
  {
    name: 'Sortir & Paket Kilat',
    url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1000&auto=format&fit=crop&q=80'
  },
  {
    name: 'Kurir & Pengantaran',
    url: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=1000&auto=format&fit=crop&q=80'
  }
];

export default function NewsFeed() {
  const [isOpen, setIsOpen] = useState(false);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const panelRef = useRef(null);

  // In-App Article Reader Modal State
  const [readingArticle, setReadingArticle] = useState(null);

  // Quick Info / Manual News Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'preset' | 'url'
  const [uploadedImageInfo, setUploadedImageInfo] = useState(null);
  const fileInputRef = useRef(null);

  const [modalForm, setModalForm] = useState({
    title: '',
    sourceUrl: '',
    sourceName: 'Humas PT Pos Indonesia',
    imageUrl: THEMED_PRESETS[0].url,
    publishedAt: new Date().toISOString().slice(0, 10),
    summary: ''
  });

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await api.getNews('limit=40');
      if (res.success && Array.isArray(res.data)) {
        setNews(res.data);
      } else {
        setNews([]);
      }
    } catch (err) {
      console.warn('Failed to load news feed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncScrape = async () => {
    try {
      setSyncing(true);
      const res = await api.scrapeNews();
      setToastMessage(res.message || 'Sinkronisasi berhasil diperbarui.');
      setTimeout(() => setToastMessage(''), 4000);
      await fetchNews();
    } catch (err) {
      console.error('Error manual syncing news:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const triggerBtn = document.getElementById('news-feed-fab-trigger');
        if (triggerBtn && triggerBtn.contains(e.target)) return;
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFormError('');
      const processed = await processImageFile(file, 1200, 800, 0.85);
      setUploadedImageInfo(processed);
      setModalForm(prev => ({ ...prev, imageUrl: processed.dataUrl }));
    } catch (err) {
      setFormError(err.message || 'Gagal memproses berkas gambar');
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      setFormError('');
      const processed = await processImageFile(file, 1200, 800, 0.85);
      setUploadedImageInfo(processed);
      setModalForm(prev => ({ ...prev, imageUrl: processed.dataUrl }));
    } catch (err) {
      setFormError(err.message || 'Gagal memproses berkas gambar');
    }
  };

  const handleOpenCreateModal = () => {
    setModalForm({
      title: '',
      sourceUrl: '',
      sourceName: 'Humas PT Pos Indonesia',
      imageUrl: THEMED_PRESETS[0].url,
      publishedAt: new Date().toISOString().slice(0, 10),
      summary: ''
    });
    setUploadedImageInfo(null);
    setImageTab('upload');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!modalForm.title.trim()) {
      setFormError('Judul warta wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const res = await api.createManualNews(modalForm);
      if (res.success) {
        setToastMessage('Warta berhasil dipublikasikan.');
        setIsCreateModalOpen(false);
        setTimeout(() => setToastMessage(''), 4000);
        await fetchNews();
      } else {
        setFormError(res.message || 'Gagal menyimpan warta');
      }
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan informasi');
    } finally {
      setSaving(false);
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Terkini';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Terkini';
      const now = new Date();
      const diffMs = now - date;
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 5) return 'Baru saja';
      if (diffMinutes < 60) return `${diffMinutes}m lalu`;
      if (diffHours < 24) return `${diffHours}j lalu`;
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays}h lalu`;
      
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch (e) {
      return 'Terkini';
    }
  };

  const filteredNews = useMemo(() => {
    let list = news;

    if (activeCategory === 'OFFICIAL') list = list.filter(n => n.isManual);
    else if (activeCategory === 'RSS') list = list.filter(n => !n.isManual);
    else if (activeCategory === 'LOGISTIK') {
      list = list.filter(n => {
        const text = (n.title + ' ' + (n.summary || '')).toLowerCase();
        return text.includes('logistik') || text.includes('paket') || text.includes('kurir') || text.includes('kargo') || text.includes('armada');
      });
    } else if (activeCategory === 'KORPORAT') {
      list = list.filter(n => {
        const text = (n.title + ' ' + (n.summary || '')).toLowerCase();
        return text.includes('dirut') || text.includes('posind') || text.includes('bumn') || text.includes('kerja sama') || text.includes('gaji') || text.includes('dpr');
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.summary || '').toLowerCase().includes(q) || (n.sourceName || '').toLowerCase().includes(q));
    }

    return list;
  }, [news, activeCategory, searchQuery]);

  return (
    <>
      {/* ── 1. ULTRA-AESTHETIC FLOATING TRIGGER BUTTON (POJOK KANAN BAWAH) ── */}
      <div 
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <button
          id="news-feed-fab-trigger"
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          style={{
            height: 44,
            padding: isOpen ? '0 16px' : '0 18px 0 14px',
            borderRadius: 9999,
            background: isOpen
              ? 'var(--primary-navy)'
              : 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            color: '#ffffff',
            boxShadow: isOpen
              ? '0 12px 30px rgba(30, 64, 175, 0.45)'
              : '0 10px 28px rgba(30, 58, 138, 0.38)',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'scale(0.96)' : 'scale(1)',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 14px 34px rgba(37, 99, 235, 0.48)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = isOpen ? 'scale(0.96)' : 'scale(1)';
            e.currentTarget.style.boxShadow = isOpen ? '0 12px 30px rgba(30, 64, 175, 0.45)' : '0 10px 28px rgba(30, 58, 138, 0.38)';
          }}
          title={isOpen ? 'Tutup Panel Warta' : 'Buka Warta PT Pos Indonesia'}
        >
          {isOpen ? (
            <>
              <X size={16} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
                Tutup
              </span>
            </>
          ) : (
            <>
              {/* Pulse Indicator */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Newspaper size={16} />
                <span 
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -3,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#60a5fa',
                    boxShadow: '0 0 6px #93c5fd'
                  }} 
                />
              </div>

              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em' }}>
                Warta POSIND
              </span>

              {news.length > 0 && (
                <span 
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 9999,
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    lineHeight: 1.2
                  }}
                >
                  {news.length}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* ── 2. SLEEK FLOATING SLIDE-OVER DRAWER ── */}
      {isOpen && (
        <div 
          ref={panelRef}
          style={{
            position: 'fixed',
            bottom: 78,
            right: 24,
            width: 400,
            maxWidth: 'calc(100vw - 32px)',
            height: 'min(620px, calc(100vh - 100px))',
            borderRadius: 20,
            background: 'var(--bg-card)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid var(--border-light)',
            boxShadow: '0 24px 64px -12px rgba(15, 23, 42, 0.35), 0 4px 16px rgba(0, 0, 0, 0.08)',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* ── HEADER ── */}
          <div 
            style={{
              padding: '16px 18px 12px 18px',
              borderBottom: '1px solid var(--border-light)',
              background: 'var(--bg-surface-soft)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div 
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: 'var(--primary-navy)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}
                >
                  <Newspaper size={15} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      Warta Pos Indonesia
                    </h3>
                    <span 
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 9999,
                        background: 'var(--accent-cyan-bg)',
                        color: 'var(--primary-blue)',
                        border: '1px solid rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      LIVE
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Diseminasi Berita & Pengumuman
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <button
                  type="button"
                  onClick={handleSyncScrape}
                  disabled={syncing || loading}
                  className="btn-ghost"
                  style={{
                    width: 30,
                    height: 30,
                    padding: 0,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Sinkronkan RSS Google News"
                >
                  <RefreshCw size={13} className={syncing ? 'spin' : ''} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-ghost"
                  style={{
                    width: 30,
                    height: 30,
                    padding: 0,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Tutup"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul warta atau sumber…"
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 28px 0 32px',
                  borderRadius: 9,
                  fontSize: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Clean Filter Segment */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'OFFICIAL', label: 'Resmi' },
                { id: 'LOGISTIK', label: 'Logistik' },
                { id: 'KORPORAT', label: 'Korporat' },
                { id: 'RSS', label: 'Media' }
              ].map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    style={{
                      padding: '4px 11px',
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: isActive ? 800 : 600,
                      border: '1px solid',
                      borderColor: isActive ? 'var(--primary-navy)' : 'transparent',
                      background: isActive ? 'var(--primary-navy)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── SCROLLABLE LIST CONTENT ── */}
          <div 
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            {toastMessage && (
              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--accent-emerald-bg)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: 'var(--accent-emerald)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Check size={13} />
                <span>{toastMessage}</span>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="surface-soft" style={{ height: 72, borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : filteredNews.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Newspaper size={26} style={{ margin: '0 auto 8px', opacity: 0.35 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Tidak Ada Warta</div>
                <div style={{ fontSize: 11.5, marginTop: 2 }}>Coba ubah kata kunci atau kategori filter.</div>
              </div>
            ) : (
              filteredNews.map((item, index) => {
                const fallbackImg = THEMED_PRESETS[index % THEMED_PRESETS.length].url;

                return (
                  <div
                    key={item._id || item.sourceUrl || index}
                    style={{
                      padding: '10px',
                      borderRadius: 12,
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.16s ease'
                    }}
                    onClick={() => setReadingArticle(item)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-blue)';
                      e.currentTarget.style.background = 'var(--bg-surface-soft)';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                      e.currentTarget.style.background = 'var(--bg-card)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {/* Thumbnail 16:10 */}
                    <div 
                      style={{ 
                        width: 76, 
                        height: 56, 
                        borderRadius: 8, 
                        overflow: 'hidden', 
                        flexShrink: 0, 
                        position: 'relative',
                        background: 'var(--bg-surface-soft)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <img
                        src={item.imageUrl || fallbackImg}
                        alt={item.title}
                        onError={(e) => { e.target.src = fallbackImg; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Metadata & Headline */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                          <span 
                            style={{ 
                              fontSize: 9.5, 
                              fontWeight: 800, 
                              color: item.isManual ? 'var(--primary-navy)' : 'var(--text-secondary)',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              letterSpacing: '0.2px'
                            }}
                          >
                            {item.sourceName || 'PT Pos Indonesia'}
                          </span>
                          {item.isManual && (
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary-blue)' }} />
                          )}
                        </div>

                        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                          {formatRelativeTime(item.publishedAt)}
                        </span>
                      </div>

                      <h4 
                        style={{ 
                          fontSize: 12, 
                          fontWeight: 750, 
                          margin: 0, 
                          color: 'var(--text-primary)', 
                          lineHeight: 1.35, 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden' 
                        }}
                      >
                        {item.title}
                      </h4>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── FOOTER: CREATE ACTION BUTTON ── */}
          <div 
            style={{
              padding: '10px 14px',
              borderTop: '1px solid var(--border-light)',
              background: 'var(--bg-surface-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}
          >
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn-primary"
              style={{
                width: '100%',
                height: 34,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Plus size={14} />
              <span>Publikasikan Warta Baru</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 3. MODAL: IN-APP FULL ARTICLE READER ── */}
      {readingArticle && (
        <div 
          className="modal-overlay" 
          onClick={() => setReadingArticle(null)}
          style={{ zIndex: 10000, background: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(8px)' }}
        >
          <div 
            className="surface-card modal-content" 
            style={{ 
              width: '100%', 
              maxWidth: 620, 
              borderRadius: 20, 
              overflow: 'hidden',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover Image */}
            <div style={{ position: 'relative', width: '100%', height: 210, overflow: 'hidden' }}>
              <img
                src={readingArticle.imageUrl || THEMED_PRESETS[0].url}
                alt={readingArticle.title}
                onError={(e) => { e.target.src = THEMED_PRESETS[0].url; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.3) 60%, transparent 100%)'
                }}
              />

              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>

              <div style={{ position: 'absolute', bottom: 14, left: 18, right: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span 
                    style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: readingArticle.isManual ? 'var(--primary-navy)' : 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {readingArticle.isManual ? 'WARTA RESMI' : 'MEDIA DIGITAL'}
                  </span>

                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Globe size={12} color="var(--primary-blue)" />
                    {readingArticle.sourceName || 'PT Pos Indonesia'}
                  </span>

                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} />
                    {new Date(readingArticle.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <h2 style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', lineHeight: 1.35, margin: 0 }}>
                  {readingArticle.title}
                </h2>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                {readingArticle.summary || readingArticle.title}
              </div>

              {readingArticle.isManual && (
                <div 
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-surface-soft)',
                    border: '1px solid var(--border-light)',
                    fontSize: 11.5,
                    color: 'var(--text-secondary)'
                  }}
                >
                  Informasi ini diterbitkan resmi melalui integrasi internal IPOS5 PT Pos Indonesia (Persero).
                </div>
              )}
            </div>

            {/* Footer */}
            <div 
              style={{
                padding: '12px 22px',
                borderTop: '1px solid var(--border-light)',
                background: 'var(--bg-surface-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10
              }}
            >
              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                className="btn-ghost"
                style={{ fontSize: 12 }}
              >
                Tutup
              </button>

              {readingArticle.sourceUrl && readingArticle.sourceUrl !== '#' && readingArticle.sourceUrl !== '' ? (
                <button
                  type="button"
                  onClick={() => window.open(readingArticle.sourceUrl, '_blank', 'noopener,noreferrer')}
                  className="btn-primary"
                  style={{ fontSize: 12, gap: 5 }}
                >
                  <span>Buka Tautan Sumber</span>
                  <ExternalLink size={13} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. MODAL: BUAT INFORMASI BARU (WITH FILE UPLOAD) ── */}
      {isCreateModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsCreateModalOpen(false)}
          style={{ zIndex: 10001, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
        >
          <div 
            className="surface-card modal-content" 
            style={{ width: '100%', maxWidth: 560, padding: 24, borderRadius: 18, maxHeight: '92vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div 
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: 'var(--primary-navy)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}
                >
                  <Plus size={17} />
                </div>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 900, color: 'var(--text-primary)' }}>
                    Publikasikan Warta Baru
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Buat pengumuman internal atau informasi operasional
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)} 
                className="btn-ghost" 
                style={{ padding: 6, borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--accent-pink-bg)', color: 'var(--accent-pink)', fontSize: 12, fontWeight: 750, marginBottom: 12 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Judul Informasi Warta *
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.title}
                  onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                  placeholder="Masukkan judul warta resmi PT Pos Indonesia…"
                  style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Nama Sumber / Penulis
                  </label>
                  <input
                    type="text"
                    value={modalForm.sourceName}
                    onChange={(e) => setModalForm({ ...modalForm, sourceName: e.target.value })}
                    placeholder="Contoh: Humas PT Pos Indonesia"
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Tanggal Publikasi
                  </label>
                  <input
                    type="date"
                    value={modalForm.publishedAt}
                    onChange={(e) => setModalForm({ ...modalForm, publishedAt: e.target.value })}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)' }}>
                    Lampiran Foto Banner
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { id: 'upload', label: 'Upload Berkas' },
                      { id: 'preset', label: 'Koleksi POSIND' },
                      { id: 'url', label: 'Tautan URL' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setImageTab(tab.id)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 10.5,
                          fontWeight: imageTab === tab.id ? 800 : 600,
                          background: imageTab === tab.id ? 'var(--accent-cyan-bg)' : 'transparent',
                          color: imageTab === tab.id ? 'var(--primary-blue)' : 'var(--text-muted)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {imageTab === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
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
                      <UploadCloud size={22} color="var(--primary-blue)" style={{ margin: '0 auto 4px' }} />
                      <div style={{ fontSize: 12, fontWeight: 750, color: 'var(--text-primary)' }}>
                        Pilih berkas foto dari komputer atau drag & drop ke sini
                      </div>
                    </div>
                  </div>
                )}

                {imageTab === 'preset' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {THEMED_PRESETS.map((preset, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setModalForm({ ...modalForm, imageUrl: preset.url });
                          setUploadedImageInfo(null);
                        }}
                        style={{
                          height: 55,
                          borderRadius: 6,
                          overflow: 'hidden',
                          position: 'relative',
                          cursor: 'pointer',
                          border: modalForm.imageUrl === preset.url ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)'
                        }}
                      >
                        <img src={preset.url} alt={preset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}

                {imageTab === 'url' && (
                  <input
                    type="url"
                    value={modalForm.imageUrl}
                    onChange={(e) => {
                      setModalForm({ ...modalForm, imageUrl: e.target.value });
                      setUploadedImageInfo(null);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                )}

                {modalForm.imageUrl && (
                  <div style={{ marginTop: 6, position: 'relative', height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                    <img src={modalForm.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setModalForm(prev => ({ ...prev, imageUrl: '' }))}
                      style={{ position: 'absolute', top: 4, right: 4, padding: 3, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Tautan URL Eksternal (Opsional)
                </label>
                <input
                  type="url"
                  value={modalForm.sourceUrl}
                  onChange={(e) => setModalForm({ ...modalForm, sourceUrl: e.target.value })}
                  placeholder="https://posindonesia.co.id/..."
                  style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Uraian Isi Informasi Lengkap *
                </label>
                <textarea
                  rows={3}
                  required
                  value={modalForm.summary}
                  onChange={(e) => setModalForm({ ...modalForm, summary: e.target.value })}
                  placeholder="Tuliskan uraian informasi atau rincian warta selengkapnya…"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 12.5, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{ minWidth: 140, justifyContent: 'center', fontSize: 12 }}
                >
                  {saving ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
                  <span>{saving ? 'Menyimpan…' : 'Publikasikan Warta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
