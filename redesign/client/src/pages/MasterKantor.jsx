import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, ChevronLeft, ChevronRight, Building2, Filter, 
  Download, MapPin, Phone, ShieldCheck, CheckCircle2, Copy, 
  ExternalLink, RefreshCw, X, Eye, Navigation, Sparkles, Store, 
  Boxes, Layers, ArrowRight, Globe
} from 'lucide-react';
import { api } from '../utils/api.js';

export default function MasterKantor() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(13768);
  const [totalPages, setTotalPages] = useState(1);
  const [summaryStats, setSummaryStats] = useState({
    total: 13768,
    active: 13768,
    bandungCimahi: 19,
    kcu: 1834,
    kcp: 11001,
    agenpos: 914,
    sppDc: 19
  });

  // Filter Tabs
  const [activeTab, setActiveTab] = useState('BANDUNG_CIMAHI'); // 'BANDUNG_CIMAHI', 'ALL', 'KCU', 'KC', 'KCP', 'AGENPOS', 'SPP_DC'
  
  // Modals state
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [selectedMapOffice, setSelectedMapOffice] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const PAGE_SIZE = 10;

  const fetchKantor = async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim(),
        page,
        limit: PAGE_SIZE
      };

      if (activeTab === 'BANDUNG_CIMAHI') {
        params.region = 'BANDUNG_CIMAHI';
      } else if (activeTab !== 'ALL') {
        params.category = activeTab;
      }

      const res = await api.getKantor(params);
      if (res.success && res.data) {
        setOffices(res.data);
        if (res.pagination) {
          setTotalCount(res.pagination.total);
          setTotalPages(res.pagination.pages || 1);
        }
        if (res.summary) {
          setSummaryStats(res.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching master kantor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKantor();
  }, [search, page, activeTab]);

  // Reset page when tab or search changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleCopyNopend = (nopend) => {
    navigator.clipboard.writeText(nopend);
    setCopiedCode(nopend);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const exportCSV = () => {
    const headers = ['Nopend', 'Nama Kantor', 'Tipe', 'Alamat', 'Kelurahan', 'Kecamatan', 'Kota/Kabupaten', 'Provinsi', 'Contact Center', 'Latitude', 'Longitude', 'Status'];
    const rows = offices.map(o => [
      `"${o.nopend || ''}"`,
      `"${o.nama_nopend || o.nama_kantor || ''}"`,
      `"${o.jenis_kantor || o.tipe || ''}"`,
      `"${o.alamat || ''}"`,
      `"${o.kelurahan || ''}"`,
      `"${o.kecamatan || ''}"`,
      `"${o.kabupaten_kota || ''}"`,
      `"${o.provinsi || ''}"`,
      `"${o.contact_center || ''}"`,
      o.latitude || '',
      o.longitude || '',
      `"${o.status || 'AKTIF'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `master_kantor_posind_${activeTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Branch Type Badge Renderer
  const renderBranchBadge = (type = '', isVerified = false) => {
    const t = String(type).toUpperCase();
    if (t.includes('KCU') || t === 'KCU') {
      return (
        <span className="badge badge-pink" style={{ fontSize: 10.5, padding: '3px 8px', gap: 4 }}>
          <Building2 size={11} /> KCU HUB
        </span>
      );
    }
    if (t.includes('KC') || t === 'KC') {
      return (
        <span className="badge badge-orange" style={{ fontSize: 10.5, padding: '3px 8px', gap: 4 }}>
          <Building2 size={11} /> KC UTAMA
        </span>
      );
    }
    if (t.includes('SPP') || t.includes('DC') || t.includes('SENTRAL')) {
      return (
        <span className="badge badge-emerald" style={{ fontSize: 10.5, padding: '3px 8px', gap: 4 }}>
          <Boxes size={11} /> SPP / DC HUB
        </span>
      );
    }
    if (t.includes('AGEN') || t.includes('AGP')) {
      return (
        <span className="badge" style={{ background: '#faf5ff', color: '#9333ea', border: '1px solid #e9d5ff', fontSize: 10.5, padding: '3px 8px', gap: 4 }}>
          <Store size={11} /> AGENPOS MITRA
        </span>
      );
    }
    return (
      <span className="badge badge-navy" style={{ fontSize: 10.5, padding: '3px 8px', gap: 4 }}>
        <Building2 size={11} /> KCP FEEDER
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100%', paddingBottom: 24 }}>
      
      {/* 1. Header & Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0f2fe', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="#0284c7" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Master Kantor & Jaringan Pos Logistik
            </h2>
            <span className="badge badge-emerald">
              ● LIVE DB
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Database resmi jaringan Kantor Pos Indonesia (KCU, KC, KCP, Agenpos Feeder, dan Sentral Pengolahan Pos Hub)
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button 
            onClick={fetchKantor}
            className="btn-ghost" 
            style={{ fontSize: 12, gap: 6, padding: '7px 14px' }}
            title="Refresh Data"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Segarkan
          </button>
          <button 
            onClick={exportCSV}
            className="btn-ghost" 
            style={{ fontSize: 12, gap: 6, padding: '7px 14px' }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary" 
            style={{ fontSize: 12, gap: 6, padding: '7px 16px' }}
          >
            <Plus size={15} /> Tambah Kantor Pos
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (4-Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {[
          { 
            label: 'TOTAL KANTOR POS NASIONAL', 
            value: (summaryStats.total || 13768).toLocaleString(), 
            sub: 'Tersebar di seluruh Indonesia',
            icon: Building2, 
            color: '#0284c7', 
          },
          { 
            label: 'JARINGAN BANDUNG & CIMAHI', 
            value: '19 Kantor', 
            sub: '100% Terverifikasi GPS & Rute',
            icon: Sparkles, 
            color: '#10b981', 
          },
          { 
            label: 'KCU & KANTOR CABANG UTAMA', 
            value: '1,834 KCU', 
            sub: 'Kantor Pengelola Wilayah / KPRK',
            icon: Layers, 
            color: '#f59e0b', 
          },
          { 
            label: 'KCP & AGENPOS FEEDER', 
            value: '11,915 Unit', 
            sub: 'Titik Loket Pick-Up & Antaran',
            icon: Store, 
            color: '#a855f7', 
          }
        ].map(kpi => {
          const IconComp = kpi.icon;
          return (
            <div 
              key={kpi.label} 
              className="spatial-card"
              style={{ 
                padding: '16px 18px', 
                borderRadius: 14, 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  {kpi.label}
                </span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-workspace)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={14} color={kpi.color} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color, fontFamily: 'monospace' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>
                  {kpi.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Navigation Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'BANDUNG_CIMAHI', label: 'Bandung & Cimahi (19 Kantor)', icon: Sparkles, count: 19 },
            { id: 'ALL', label: 'Semua Kantor (Nasional)', icon: Globe, count: '13,768' },
            { id: 'KCU', label: 'KCU Hub Utama', icon: Building2, count: '1,834' },
            { id: 'KC', label: 'Kantor Cabang (KC)', icon: Building2, count: '412' },
            { id: 'KCP', label: 'KCP Feeder', icon: Building2, count: '11,001' },
            { id: 'AGENPOS', label: 'Agenpos Mitra', icon: Store, count: '914' },
            { id: 'SPP_DC', label: 'SPP Bandung (Hub)', icon: MapPin, count: '1' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'var(--primary-blue)' : 'var(--bg-workspace)',
                  border: isActive ? '1px solid var(--primary-blue)' : '1px solid var(--border-light)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <TabIcon size={14} style={{ opacity: isActive ? 1 : 0.8 }} />
                <span>{tab.label}</span>
                <span style={{ 
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)', 
                  color: isActive ? '#ffffff' : 'var(--text-muted)', 
                  fontSize: 10, 
                  fontWeight: 800, 
                  padding: '1px 6px', 
                  borderRadius: 99,
                  border: '1px solid var(--border-light)'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: 280 }}>
            <Search
              size={15}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari berdasarkan kode Nopend (misal: 40000, 40511A), nama kantor, kecamatan, kota..."
              style={{ paddingLeft: 40, paddingRight: 36, fontSize: 13, height: 42, width: '100%', borderRadius: 10, background: 'var(--bg-workspace)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Data Table */}
      <div className="spatial-card" style={{ borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
        
        {/* Table Container with Fully Opaque Sticky Header */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--primary-blue)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  KODE NOPEND
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  NAMA KANTOR POS & ALAMAT
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  TIPE JARINGAN
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  WILAYAH KOTA / KAB
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  KOORDINAT GPS
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  STATUS
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'right' }}>
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <RefreshCw size={24} className="spin" color="var(--primary-blue)" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Memuat master data kantor pos dari MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : offices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <Building2 size={32} color="var(--text-muted)" />
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Tidak ada data kantor pos ditemukan</span>
                      <span style={{ fontSize: 12 }}>Coba periksa kata kunci pencarian atau ganti filter kategori.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                offices.map((o, idx) => {
                  const isVerified = o.is_real_verified;
                  const hasCoordinates = o.latitude && o.longitude;
                  return (
                    <tr 
                      key={o.nopend || idx} 
                      style={{ 
                        borderBottom: '1px solid var(--border-light)',
                        background: isVerified ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* 1. Nopend with Copy Action */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => handleCopyNopend(o.nopend)}
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 12.5,
                              fontWeight: 800,
                              color: isVerified ? 'var(--primary-blue)' : 'var(--text-primary)',
                              background: 'var(--bg-workspace)',
                              border: isVerified ? '1px solid var(--primary-blue)' : '1px solid var(--border-light)',
                              padding: '3px 8px',
                              borderRadius: 6,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                            title="Klik untuk menyalin Nopend"
                          >
                            {o.nopend}
                            {copiedCode === o.nopend ? (
                              <CheckCircle2 size={12} color="#10b981" />
                            ) : (
                              <Copy size={11} color="var(--text-muted)" />
                            )}
                          </button>
                          {isVerified && (
                            <span 
                              title="Kantor Terverifikasi Rute Aktif Feeder" 
                              style={{ color: 'var(--primary-blue)', display: 'flex', alignItems: 'center' }}
                            >
                              <ShieldCheck size={14} />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Office Name & Address */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', maxWidth: 300 }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13, marginBottom: 2 }}>
                          {o.nama_kantor || o.nama_nopend}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.alamat !== '-' ? o.alamat : `${o.kelurahan || ''} ${o.kecamatan || ''}`.trim() || 'Wilayah Bandung Raya'}
                        </div>
                      </td>

                      {/* 3. Branch Type Badge */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        {renderBranchBadge(o.jenis_kantor || o.tipe, isVerified)}
                      </td>

                      {/* 4. City / Regency */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 12.5, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={12} color="#f59e0b" />
                          <span style={{ fontWeight: 600 }}>{o.kabupaten_kota}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 18 }}>
                          {o.provinsi || 'Jawa Barat'}
                        </div>
                      </td>

                      {/* 5. GPS Coordinates */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        {hasCoordinates ? (
                          <button
                            onClick={() => setSelectedMapOffice(o)}
                            style={{
                              background: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(52, 211, 153, 0.3)',
                              color: '#10b981',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                            title="Buka Peta GPS"
                          >
                            <Navigation size={11} /> {o.latitude?.toFixed(4)}, {o.longitude?.toFixed(4)}
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            -
                          </span>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span className={o.status === 'NONAKTIF' ? 'badge badge-pink' : 'badge badge-emerald'}>
                          ● {o.status || 'AKTIF'}
                        </span>
                      </td>

                      {/* 7. Actions */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedOffice(o)}
                            className="btn-ghost"
                            style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, gap: 4 }}
                          >
                            <Eye size={12} /> Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Menampilkan data ke</span>
            <strong style={{ color: 'var(--text-primary)' }}>{Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}</strong>
            <span>sampai</span>
            <strong style={{ color: 'var(--text-primary)' }}>{Math.min(page * PAGE_SIZE, totalCount)}</strong>
            <span>dari total</span>
            <strong style={{ color: 'var(--primary-blue)' }}>{totalCount.toLocaleString()}</strong>
            <span>kantor pos</span>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, opacity: page === 1 ? 0.4 : 1 }}
            >
              First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost"
              style={{ padding: '6px 10px', opacity: page === 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} />
            </button>

            {/* Pagination Number Buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = page - 2 + i;
              if (page <= 2) pageNum = i + 1;
              if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              if (pageNum < 1 || pageNum > totalPages) return null;
              
              const isCurrent = pageNum === page;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: isCurrent ? '#0b2e8a' : '#f8fafc',
                    border: isCurrent ? 'none' : '1px solid #e2e8f0',
                    color: isCurrent ? '#ffffff' : '#64748b',
                    fontSize: 12,
                    fontWeight: isCurrent ? 800 : 600,
                    cursor: 'pointer'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost"
              style={{ padding: '6px 10px', opacity: page === totalPages ? 0.4 : 1 }}
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, opacity: page === totalPages ? 0.4 : 1 }}
            >
              Last ({totalPages})
            </button>
          </div>
        </div>
      </div>

      {/* 6. Office Detail Drawer / Modal */}
      {selectedOffice && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedOffice(null); }}
        >
          <div className="modal-content" style={{ maxWidth: '640px', width: '95%', padding: 0, overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-cyan-bg)', border: '1px solid rgba(2, 132, 199, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={22} color="var(--accent-cyan)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 17, fontWeight: 800 }}>
                      {selectedOffice.nama_kantor || selectedOffice.nama_nopend}
                    </h3>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Nopend: {selectedOffice.nopend}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOffice(null)}
                className="capsule-btn-circle"
                style={{ width: 32, height: 32 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* Type Badge & Status */}
              <div className="surface-soft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, marginBottom: 4 }}>
                    KLASIFIKASI KANTOR
                  </div>
                  {renderBranchBadge(selectedOffice.jenis_kantor || selectedOffice.tipe, selectedOffice.is_real_verified)}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, marginBottom: 4 }}>
                    STATUS OPERASIONAL
                  </div>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 800, fontSize: 12 }}>
                    ● {selectedOffice.status || 'AKTIF'}
                  </span>
                </div>
              </div>

              {/* Spec Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div className="surface-soft" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                    ALAMAT KANTOR
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedOffice.alamat !== '-' ? selectedOffice.alamat : 'Jl. Asia Afrika / Feeder Bandung'}
                  </div>
                </div>

                <div className="surface-soft" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                    KELURAHAN / KECAMATAN
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedOffice.kelurahan || '-'} / {selectedOffice.kecamatan || '-'}
                  </div>
                </div>

                <div className="surface-soft" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                    KABUPATEN / KOTA & PROVINSI
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--primary-navy)' }}>
                    {selectedOffice.kabupaten_kota}, {selectedOffice.provinsi || 'Jawa Barat'}
                  </div>
                </div>

                <div className="surface-soft" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                    CONTACT CENTER
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={12} /> {selectedOffice.contact_center || '1500161'}
                  </div>
                </div>
              </div>

              {/* GPS Coordinates Section */}
              {selectedOffice.latitude && selectedOffice.longitude && (
                <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} /> KOORDINAT GPS TERVERIFIKASI
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', marginTop: 4 }}>
                        Lat: {selectedOffice.latitude}, Lng: {selectedOffice.longitude}
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedOffice.latitude},${selectedOffice.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      style={{ padding: '6px 12px', fontSize: 11.5, gap: 5, color: '#16a34a', borderColor: '#bbf7d0' }}
                    >
                      Buka Google Maps <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button
                  onClick={() => handleCopyNopend(selectedOffice.nopend)}
                  className="btn-ghost"
                  style={{ fontSize: 12, gap: 6 }}
                >
                  <Copy size={13} /> {copiedCode === selectedOffice.nopend ? 'Nopend Tersalin!' : 'Salin Nopend'}
                </button>
                <button
                  onClick={() => setSelectedOffice(null)}
                  className="btn-primary"
                  style={{ fontSize: 12 }}
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 7. Quick GPS Map View Modal */}
      {selectedMapOffice && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedMapOffice(null); }}
        >
          <div className="modal-content" style={{ maxWidth: '600px', width: '95%', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={20} color="var(--accent-emerald)" />
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>
                  Peta Lokasi: {selectedMapOffice.nama_kantor || selectedMapOffice.nama_nopend}
                </h3>
              </div>
              <button onClick={() => setSelectedMapOffice(null)} className="capsule-btn-circle" style={{ width: 30, height: 30 }}>
                <X size={16} />
              </button>
            </div>

            <div className="surface-soft" style={{ borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2, fontWeight: 600 }}>ALAMAT LENGKAP</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>{selectedMapOffice.alamat || 'Wilayah Bandung'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="surface-card" style={{ padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>LATITUDE</div>
                  <div style={{ fontSize: 13, color: 'var(--accent-emerald)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{selectedMapOffice.latitude}</div>
                </div>
                <div className="surface-card" style={{ padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>LONGITUDE</div>
                  <div style={{ fontSize: 13, color: 'var(--accent-emerald)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{selectedMapOffice.longitude}</div>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps?q=${selectedMapOffice.latitude},${selectedMapOffice.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ justifyContent: 'center', gap: 8, textDecoration: 'none', marginTop: 8 }}
              >
                Buka di Google Maps Live Navigation <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 8. Add Post Office Modal */}
      {showAddModal && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="modal-content" style={{ maxWidth: '500px', width: '95%', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>Tambah Kantor Pos Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="capsule-btn-circle" style={{ width: 30, height: 30 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const payload = {
                nopend: fd.get('nopend'),
                nama_nopend: fd.get('nama_nopend'),
                alamat: fd.get('alamat'),
                kabupaten_kota: fd.get('kabupaten_kota'),
                jenis_kantor: fd.get('jenis_kantor'),
                status: 'AKTIF'
              };
              try {
                await api.createKantor(payload);
                setShowAddModal(false);
                fetchKantor();
              } catch (err) {
                alert('Gagal menambah kantor: ' + err.message);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: 4 }}>KODE NOPEND</label>
                <input required name="nopend" placeholder="misal: 40118A" style={{ width: '100%', height: 38 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: 4 }}>NAMA KANTOR POS</label>
                <input required name="nama_nopend" placeholder="misal: KCP Bandung Gegerkalong" style={{ width: '100%', height: 38 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: 4 }}>TIPE KANTOR</label>
                <select name="jenis_kantor" style={{ width: '100%', height: 38 }}>
                  <option value="Kantor Cabang Pembantu">Kantor Cabang Pembantu (KCP)</option>
                  <option value="Kantor Cabang">Kantor Cabang (KC)</option>
                  <option value="Kantor Cabang Utama">Kantor Cabang Utama (KCU)</option>
                  <option value="Agenpos Mitra">Agenpos Mitra Feeder</option>
                  <option value="Sentral Pengolahan Pos">Sentral Pengolahan Pos (Hub)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: 4 }}>ALAMAT</label>
                <input name="alamat" placeholder="misal: Jl. Dr. Setiabudi No. 120" style={{ width: '100%', height: 38 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: 4 }}>KOTA / KABUPATEN</label>
                <input name="kabupaten_kota" defaultValue="Kota Bandung" style={{ width: '100%', height: 38 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost" style={{ fontSize: 12 }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ fontSize: 12 }}>Simpan Kantor</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
