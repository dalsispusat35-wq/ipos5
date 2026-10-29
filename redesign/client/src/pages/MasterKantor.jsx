import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Plus, ChevronLeft, ChevronRight, Building2,
  Download, MapPin, Phone, ShieldCheck, CheckCircle2, Copy, 
  ExternalLink, RefreshCw, X, Eye, Navigation, Sparkles, Store, 
  Boxes, Layers, Globe, Check
} from 'lucide-react';
import { api, fetchApi } from '../utils/api.js';
import KantorWilayahMap from './kantor/KantorWilayahMap.jsx';

export default function MasterKantor() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summaryStats, setSummaryStats] = useState({ total: 0, active: 0 });
  const [regionCounts, setRegionCounts] = useState([0, 0, 0, 0]);
  const [regionOptions, setRegionOptions] = useState([[], [], [], []]);
  const [regionCodes, setRegionCodes] = useState(['', '', '', '']);
  const [regionError, setRegionError] = useState('');
  const regionRequest = useRef(0);
  const [showMap, setShowMap] = useState(true);
  const [officeError, setOfficeError] = useState('');
  const officeRequest = useRef(0);
  const selectedWilayahCode = [...regionCodes].reverse().find(Boolean) || '';

  // Nopend selection filter state (synchronized with wilayah)
  const [selectedNopend, setSelectedNopend] = useState('');
  const [nopenOptions, setNopenOptions] = useState([]);
  const [loadingNopens, setLoadingNopens] = useState(false);

  // Filter Tabs
  const [activeTab, setActiveTab] = useState('ALL');
  
  // Modals state
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [selectedMapOffice, setSelectedMapOffice] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const PAGE_SIZE = 10;

  const fetchKantor = useCallback(async () => {
    const request = ++officeRequest.current;
    try {
      setLoading(true);
      const params = {
        search: search.trim(),
        page,
        limit: PAGE_SIZE
      };
      if (selectedWilayahCode) params.wilayahKode = selectedWilayahCode;
      if (selectedNopend) params.nopend = selectedNopend;

      if (activeTab === 'BANDUNG_CIMAHI' && !selectedWilayahCode && !selectedNopend) {
        params.region = 'BANDUNG_CIMAHI';
      } else if (activeTab !== 'ALL') {
        params.category = activeTab;
      }

      const res = await api.getKantor(params);
      if (request !== officeRequest.current) return;
      if (res.success && res.data) {
        setOfficeError('');
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
      if (request !== officeRequest.current) return;
      console.error('Error fetching master kantor:', err);
      setOfficeError(err.message);
      setOffices([]);
      setTotalCount(0);
    } finally {
      if (request === officeRequest.current) setLoading(false);
    }
  }, [search, page, activeTab, selectedWilayahCode, selectedNopend]);

  useEffect(() => {
    const timer = setTimeout(fetchKantor, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchKantor, search]);

  // Fetch NOPEND list for currently selected wilayah
  useEffect(() => {
    let active = true;
    setLoadingNopens(true);
    fetchApi(`/kantor/wilayah/nopens?kode=${encodeURIComponent(selectedWilayahCode || '')}`)
      .then(res => {
        if (!active) return;
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
        setNopenOptions(list);
        setSelectedNopend(curr => {
          if (curr && !list.some(o => o.nopend === curr)) return '';
          return curr;
        });
      })
      .catch(() => {
        if (active) setNopenOptions([]);
      })
      .finally(() => {
        if (active) setLoadingNopens(false);
      });
    return () => { active = false; };
  }, [selectedWilayahCode]);

  useEffect(() => {
    let active = true;
    fetchApi('/kantor/wilayah').then(res => {
      if (!active) return;
      setRegionOptions([res.data, [], [], []]);
      setRegionCounts(res.counts);
    }).catch(error => { if (active) setRegionError(error.message); });
    return () => { active = false; };
  }, []);

  const handleRegionChange = async (level, code) => {
    const request = ++regionRequest.current;
    const nextCodes = [...regionCodes];
    const nextOptions = [...regionOptions];
    nextCodes[level] = code;
    for (let i = level + 1; i < 4; i++) {
      nextCodes[i] = '';
      nextOptions[i] = [];
    }
    setRegionCodes(nextCodes);
    setRegionOptions(nextOptions);
    setSelectedNopend('');
    setPage(1);
    setRegionError('');
    if (code && level < 3) {
      try {
        const res = await fetchApi(`/kantor/wilayah?parent=${encodeURIComponent(code)}`);
        if (request !== regionRequest.current) return;
        setRegionOptions(current => {
          const updated = [...current];
          updated[level + 1] = res.data;
          return updated;
        });
      } catch (error) { if (request === regionRequest.current) setRegionError(error.message); }
    }
  };

  const handleResetFilter = () => {
    setRegionCodes(['', '', '', '']);
    setSelectedNopend('');
    setSearch('');
    setPage(1);
    setRegionError('');
  };

  const handleMapRegionSelect = useCallback(async (code) => {
    const request = ++regionRequest.current;
    const parts = code ? code.split('.') : [];
    const codes = [0, 1, 2, 3].map(level => level < parts.length ? parts.slice(0, level + 1).join('.') : '');
    try {
      const options = await Promise.all([0, 1, 2, 3].map(level => {
        if (level > 0 && !codes[level - 1]) return Promise.resolve({ data: [] });
        return fetchApi(`/kantor/wilayah${level ? `?parent=${encodeURIComponent(codes[level - 1])}` : ''}`);
      }));
      if (request !== regionRequest.current) return;
      setRegionOptions(options.map(result => result.data));
      setRegionCodes(codes);
      setRegionError('');
      setPage(1);
    } catch (error) {
      if (request === regionRequest.current) setRegionError(error.message);
      throw error;
    }
  }, []);

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
      `"${o.wilayah?.desaKelurahan?.nama || ''}"`,
      `"${o.wilayah?.kecamatan?.nama || ''}"`,
      `"${o.wilayah?.kabupatenKota?.nama || ''}"`,
      `"${o.wilayah?.provinsi?.nama || ''}"`,
      `"${o.contact_center || ''}"`,
      o.latitude || '',
      o.longitude || '',
      `"${o.status || 'Tidak diketahui'}"`
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

  // Branch Type Badge Renderer with Name-aware categorization
  const renderBranchBadge = (type = '', name = '') => {
    const t = String(type || '').toUpperCase();
    const n = String(name || '').toUpperCase();

    if (t.includes('KCU') || n.startsWith('KCU') || n.includes('KCU ') || t === 'KCU') {
      return (
        <span className="badge badge-pink" style={{ fontSize: 11, padding: '3px 9px', gap: 5 }}>
          <Building2 size={12} /> KCU HUB
        </span>
      );
    }
    if (t.includes('SPP') || t.includes('DC') || n.includes('SPP') || n.includes('SENTRAL')) {
      return (
        <span className="badge badge-emerald" style={{ fontSize: 11, padding: '3px 9px', gap: 5 }}>
          <Boxes size={12} /> SPP / DC HUB
        </span>
      );
    }
    if (t.includes('KC ') || t === 'KC' || n.startsWith('KC ') || n.includes(' KANTOR CABANG UTAMA')) {
      return (
        <span className="badge badge-amber" style={{ fontSize: 11, padding: '3px 9px', gap: 5 }}>
          <Building2 size={12} /> KC UTAMA
        </span>
      );
    }
    if (t.includes('AGEN') || t.includes('AGP') || n.startsWith('AGEN') || n.includes('AGENPOS')) {
      return (
        <span className="badge badge-purple" style={{ fontSize: 11, padding: '3px 9px', gap: 5 }}>
          <Store size={12} /> AGENPOS MITRA
        </span>
      );
    }
    if (t.includes('KCP') || n.startsWith('KCP')) return <span className="badge badge-navy" style={{ fontSize: 11, padding: '3px 9px' }}><Building2 size={12} /> KCP FEEDER</span>;
    if (!t && !n) return <span className="badge badge-navy">Belum diketahui</span>;
    return <span className="badge badge-navy" style={{ fontSize: 11, padding: '3px 9px', gap: 5 }}>
      <Building2 size={12} /> {t || 'Tipe belum diketahui'}
    </span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100%', paddingBottom: 40 }}>
      
      {/* 1. Header & Page Title Banner */}
      <div className="spatial-card" style={{ padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-cyan-bg)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} color="var(--primary-blue)" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Master Kantor &amp; Jaringan Pos Logistik
            </h1>
            <span className="badge badge-emerald" style={{ fontSize: 11, padding: '3px 8px' }}>
              ● Master Kantor &amp; Wilayah Kemendagri
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Data kantor dari master_kantor; referensi administrasi dari wilayah-master. Relasi yang belum pasti ditandai belum terpetakan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchKantor}
            className="btn-ghost" 
            style={{ fontSize: 12.5, gap: 6, padding: '8px 14px' }}
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Segarkan
          </button>
          <button 
            onClick={exportCSV}
            className="btn-ghost" 
            style={{ fontSize: 12.5, gap: 6, padding: '8px 14px' }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary" 
            style={{ fontSize: 12.5, gap: 6, padding: '8px 16px' }}
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
            value: summaryStats.total.toLocaleString('id-ID'),
            sub: 'Data master_kantor yang tersedia',
            icon: Building2, 
            color: 'var(--primary-blue)', 
          },
          { 
            label: 'MASTER WILAYAH: PROVINSI',
            value: regionCounts[0].toLocaleString('id-ID'),
            sub: 'Kode wilayah administratif',
            icon: Sparkles, 
            color: 'var(--accent-emerald)', 
          },
          { 
            label: 'MASTER WILAYAH: KAB/KOTA',
            value: regionCounts[1].toLocaleString('id-ID'),
            sub: 'Kode wilayah administratif',
            icon: Layers, 
            color: 'var(--accent-amber)', 
          },
          { 
            label: 'MASTER WILAYAH: KECAMATAN / DESA',
            value: `${regionCounts[2].toLocaleString('id-ID')} / ${regionCounts[3].toLocaleString('id-ID')}`,
            sub: 'Kecamatan / desa atau kelurahan',
            icon: Store, 
            color: 'var(--accent-purple)', 
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
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-surface-soft)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={15} color={kpi.color} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color, fontFamily: 'var(--font-mono)' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 600 }}>
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
        <div className="scrollable-chips" style={{ paddingBottom: 4 }}>
          {[
            { id: 'BANDUNG_CIMAHI', label: 'Bandung & Cimahi', icon: Sparkles },
            { id: 'ALL', label: 'Semua Kantor (Nasional)', icon: Globe },
            { id: 'KCU', label: 'KCU Hub Utama', icon: Building2 },
            { id: 'KC', label: 'Kantor Cabang (KC)', icon: Building2 },
            { id: 'KCP', label: 'KCP Feeder', icon: Building2 },
            { id: 'AGENPOS', label: 'Agenpos Mitra', icon: Store },
            { id: 'SPP_DC', label: 'SPP / DC', icon: MapPin }
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
                  background: isActive ? 'var(--primary-blue)' : 'var(--bg-card)',
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
              </button>
            );
          })}
        </div>

        {/* Search & Filter Bar */}
        <div className="spatial-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
              Master Wilayah Kemendagri &amp; Jaringan Kantor Pos · Filter spesifik wilayah &amp; Nopend
            </div>
            {(selectedWilayahCode || selectedNopend || search) && (
              <button 
                onClick={handleResetFilter} 
                className="btn-ghost" 
                style={{ fontSize: 11, padding: '4px 10px', color: 'var(--accent-pink)', gap: 5, borderRadius: 6 }}
              >
                <X size={12} /> Reset Semua Filter
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
            {['Provinsi', 'Kota / Kabupaten', 'Kecamatan', 'Desa / Kelurahan'].map((label, level) => (
              <label key={label} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                {label}
                <select 
                  value={regionCodes[level]} 
                  disabled={level > 0 && !regionCodes[level - 1]}
                  onChange={e => handleRegionChange(level, e.target.value)}
                  style={{ display: 'block', width: '100%', height: 38, marginTop: 5, background: 'var(--input-bg)', color: 'var(--input-text)', border: '1px solid var(--input-border)', borderRadius: 8 }}
                >
                  <option value="">Semua {label}</option>
                  {regionOptions[level].map(item => <option key={item.kode} value={item.kode}>{item.nama} ({item.kode})</option>)}
                </select>
              </label>
            ))}

            {/* 5th Dropdown: Kode Nopen / Kantor Pos (Connected to Selected Region) */}
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Kode Nopen / Kantor Pos
              <select
                value={selectedNopend}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedNopend(val);
                  setPage(1);
                  if (val) {
                    const found = nopenOptions.find(o => o.nopend === val);
                    if (found) setSelectedOffice(found);
                  }
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 38,
                  marginTop: 5,
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)',
                  border: selectedNopend ? '1.5px solid var(--primary-blue)' : '1px solid var(--input-border)',
                  borderRadius: 8,
                  fontWeight: selectedNopend ? 700 : 400
                }}
              >
                <option value="">
                  {loadingNopens 
                    ? 'Memuat daftar kantor pos…' 
                    : selectedWilayahCode 
                      ? `Semua Nopen (${nopenOptions.length} Kantor)` 
                      : `Pilih Nopen (${nopenOptions.length} Kantor)`}
                </option>
                {nopenOptions.map(item => (
                  <option key={item.nopend} value={item.nopend}>
                    {item.nopend} — {item.nama_nopend} ({item.tipe || 'KCP'}) {item.has_gps ? '📍' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {regionError && <div style={{ color: 'var(--accent-pink)', fontSize: 12, marginTop: 8 }}>{regionError}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
            {selectedWilayahCode && <span>Kode Wilayah: <strong style={{ color: 'var(--primary-blue)' }}>{selectedWilayahCode}</strong></span>}
            {selectedNopend && <span>Nopend Terpilih: <strong style={{ color: 'var(--accent-emerald)' }}>{selectedNopend}</strong></span>}
            {nopenOptions.length > 0 && <span>Jaringan Pos Terhubung: <strong>{nopenOptions.length}</strong> kantor</span>}
          </div>
        </div>
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
              placeholder="Cari NOPEND, kantor, alamat, nama atau kode wilayah..."
              style={{ paddingLeft: 40, paddingRight: 36, fontSize: 13, height: 42, width: '100%', borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)', outline: 'none', boxSizing: 'border-box' }}
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
          <button className="btn-ghost" onClick={() => setShowMap(value => !value)} style={{ height: 42, fontSize: 12 }}>
            <MapPin size={14} /> {showMap ? 'Tutup Peta' : 'Peta Wilayah'}
          </button>
        </div>
      </div>

      {showMap && (
        <KantorWilayahMap 
          kode={selectedWilayahCode} 
          offices={offices} 
          selectedOffice={selectedOffice} 
          onSelect={handleMapRegionSelect} 
          onOfficeSelect={office => {
            setSelectedOffice(office);
            if (office?.nopend) setSelectedNopend(office.nopend);
          }} 
        />
      )}
      {officeError && <div className="spatial-card" style={{ padding: 12, color: 'var(--accent-pink)', fontSize: 12 }}>Data kantor gagal dimuat: {officeError}</div>}

      {/* 4. Main Data Table */}
      <div className="spatial-card" style={{ borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
        
        {/* Table Container with Fully Opaque Sticky Header */}
        <div className="table-responsive-container" style={{ border: 'none', background: 'transparent' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-soft)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--primary-blue)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  KODE NOPEND
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  NAMA KANTOR POS &amp; ALAMAT
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
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedWilayahCode ? 'Belum ada kantor yang terpetakan sesuai filter wilayah ini' : 'Tidak ada data kantor pos ditemukan'}</span>
                      <span style={{ fontSize: 12 }}>{selectedWilayahCode ? 'Data wilayah tetap tersedia. Kantor tanpa relasi wilayah yang sesuai tidak ditampilkan pada filter ini.' : 'Coba periksa kata kunci pencarian atau ganti filter kategori.'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                offices.map((o, idx) => {
                  const isVerified = o.is_real_verified;
                  const hasCoordinates = o.latitude && o.longitude;
                  const officeName = o.nama_kantor || o.nama_nopend || '';
                  return (
                    <tr 
                      key={o.nopend || idx} 
                      style={{ 
                        borderBottom: '1px solid var(--border-light)',
                        background: isVerified ? 'rgba(2, 132, 199, 0.06)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* 1. Nopend with Copy Action */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => handleCopyNopend(o.nopend)}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12.5,
                              fontWeight: 800,
                              color: isVerified ? 'var(--primary-blue)' : 'var(--text-primary)',
                              background: 'var(--bg-surface-soft)',
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
                              <CheckCircle2 size={12} color="var(--accent-emerald)" />
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
                          {officeName}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.alamat || 'Alamat belum tersedia'}
                        </div>
                      </td>

                      {/* 3. Branch Type Badge */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        {renderBranchBadge(o.jenis_kantor || o.tipe, officeName)}
                      </td>

                      {/* 4. City / Regency */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 12.5, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={12} color="var(--accent-amber)" />
                          <span style={{ fontWeight: 600 }}>{o.wilayah?.kabupatenKota?.nama || 'Belum Terpetakan'}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 18 }}>
                          {o.wilayah?.provinsi?.nama || 'Kode wilayah belum tersedia'}
                        </div>
                      </td>

                      {/* 5. GPS Coordinates */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        {hasCoordinates ? (
                          <button
                            onClick={() => setSelectedMapOffice(o)}
                            style={{
                              background: 'var(--accent-emerald-bg)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: 'var(--accent-emerald)',
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
                            <Navigation size={11} /> {Number(o.latitude).toFixed(4)}, {Number(o.longitude).toFixed(4)}
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
                          ● {o.status || 'Tidak diketahui'}
                        </span>
                      </td>

                      {/* 7. Actions */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedOffice(o)}
                            className="btn-ghost"
                            style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6, gap: 4 }}
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
            <span>Menampilkan</span>
            <strong style={{ color: 'var(--text-primary)' }}>{Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}</strong>
            <span>-</span>
            <strong style={{ color: 'var(--text-primary)' }}>{Math.min(page * PAGE_SIZE, totalCount)}</strong>
            <span>dari</span>
            <strong style={{ color: 'var(--primary-blue)' }}>{totalCount.toLocaleString('id-ID')}</strong>
            <span>kantor pos</span>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, opacity: page === 1 ? 0.4 : 1 }}
            >
              Awal
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
                    background: isCurrent ? 'var(--primary-blue)' : 'var(--bg-surface-soft)',
                    border: isCurrent ? '1px solid var(--primary-blue)' : '1px solid var(--border-light)',
                    color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: isCurrent ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
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
              Akhir ({totalPages})
            </button>
          </div>
        </div>
      </div>

      {/* 6. Harmonized Office Detail Modal */}
      {selectedOffice && (() => {
        const officeName = selectedOffice.nama_kantor || selectedOffice.nama_nopend || '';
        return (
          <div 
            className="modal-overlay" 
            style={{ zIndex: 1000 }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedOffice(null); }}
          >
            <div 
              className="modal-content" 
              style={{ 
                maxWidth: '640px', 
                width: '95%', 
                padding: 0, 
                overflow: 'hidden',
                background: 'var(--bg-card)',
                border: '1px solid rgba(2, 132, 199, 0.35)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              
              {/* Modal Header */}
              <div 
                style={{ 
                  padding: '20px 24px', 
                  borderBottom: '1px solid var(--border-light)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: 'var(--bg-surface-soft)' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-cyan-bg)', border: '1px solid rgba(2, 132, 199, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={22} color="var(--primary-blue)" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 17, fontWeight: 900, letterSpacing: '-0.01em' }}>
                      {officeName}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Kode Nopend:
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--primary-blue)', fontFamily: 'var(--font-mono)', fontWeight: 800, background: 'var(--bg-card)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-light)' }}>
                        {selectedOffice.nopend}
                      </span>
                    </div>
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
                
                {/* Type Badge & Status Banner */}
                <div 
                  className="surface-soft" 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 18px', 
                    borderRadius: 12,
                    background: 'var(--bg-surface-soft)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, marginBottom: 5 }}>
                      KLASIFIKASI KANTOR
                    </div>
                    {renderBranchBadge(selectedOffice.jenis_kantor || selectedOffice.tipe, officeName)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, marginBottom: 5 }}>
                      STATUS OPERASIONAL
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: 11, padding: '3px 8px' }}>
                      ● {selectedOffice.status || 'Tidak diketahui'}
                    </span>
                  </div>
                </div>

                {/* Spec Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  <div className="surface-soft" style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4, letterSpacing: '0.04em' }}>
                      ALAMAT KANTOR
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {selectedOffice.alamat || 'Alamat belum tersedia'}
                    </div>
                  </div>

                  <div className="surface-soft" style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4, letterSpacing: '0.04em' }}>
                      KELURAHAN / KECAMATAN
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {selectedOffice.kelurahan || '-'} / {selectedOffice.kecamatan || '-'}
                    </div>
                  </div>

                  <div className="surface-soft" style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4, letterSpacing: '0.04em' }}>
                      KABUPATEN / KOTA &amp; PROVINSI
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--primary-blue)', lineHeight: 1.4 }}>
                      {selectedOffice.wilayah?.kabupatenKota?.nama || 'Belum Terpetakan'}, {selectedOffice.wilayah?.provinsi?.nama || '—'}
                    </div>
                  </div>

                  <div className="surface-soft" style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4, letterSpacing: '0.04em' }}>
                      CONTACT CENTER
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} /> {selectedOffice.contact_center || 'Belum tersedia'}
                    </div>
                  </div>
                </div>

                <div className="surface-soft" style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-primary)' }}>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>INFORMASI WILAYAH · {selectedOffice.wilayah?.status || 'Belum Terpetakan'}</div>
                  <div>Provinsi: {selectedOffice.wilayah?.provinsi?.nama || '—'}</div>
                  <div>Kota/Kabupaten: {selectedOffice.wilayah?.kabupatenKota?.nama || '—'}</div>
                  <div>Kecamatan: {selectedOffice.wilayah?.kecamatan?.nama || '—'}</div>
                  <div>Desa/Kelurahan: {selectedOffice.wilayah?.desaKelurahan?.nama || '—'}</div>
                  <div>Kode Kemendagri: {selectedOffice.wilayah?.kode || '—'}</div>
                  <div>Latitude: {selectedOffice.latitude ?? '—'} · Longitude: {selectedOffice.longitude ?? '—'}</div>
                </div>

                {/* Harmonized GPS Coordinates Section */}
                {selectedOffice.latitude && selectedOffice.longitude && (
                  <div 
                    style={{ 
                      background: 'var(--accent-emerald-bg)', 
                      padding: 16, 
                      borderRadius: 12, 
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} /> KOORDINAT GPS TERVERIFIKASI
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                        Lat: {selectedOffice.latitude}, Lng: {selectedOffice.longitude}
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedOffice.latitude},${selectedOffice.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      style={{ 
                        padding: '6px 14px', 
                        fontSize: 12, 
                        gap: 6, 
                        color: 'var(--accent-emerald)', 
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        textDecoration: 'none'
                      }}
                    >
                      Buka Google Maps <ExternalLink size={13} />
                    </a>
                  </div>
                )}

                {/* Bottom Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                  <button
                    onClick={() => handleCopyNopend(selectedOffice.nopend)}
                    className="btn-ghost"
                    style={{ fontSize: 12, gap: 6, padding: '7px 14px' }}
                  >
                    {copiedCode === selectedOffice.nopend ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                    {copiedCode === selectedOffice.nopend ? 'Nopend Tersalin!' : 'Salin Nopend'}
                  </button>
                  <button
                    onClick={() => setSelectedOffice(null)}
                    className="btn-primary"
                    style={{ fontSize: 12, padding: '7px 18px' }}
                  >
                    Tutup
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. Quick GPS Map View Modal */}
      {selectedMapOffice && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedMapOffice(null); }}
        >
          <div className="modal-content" style={{ maxWidth: '600px', width: '95%', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
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
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>{selectedMapOffice.alamat || 'Alamat belum tersedia'}</div>
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
          <div className="modal-content" style={{ maxWidth: '500px', width: '95%', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
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
                wilayah_kode: fd.get('wilayah_kode') || null,
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
                <input name="kabupaten_kota" placeholder="Sesuai alamat kantor" style={{ width: '100%', height: 38 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: 4 }}>KODE WILAYAH KEMENDAGRI (OPSIONAL)</label>
                <select name="wilayah_kode" defaultValue="" style={{ width: '100%', height: 38 }}>
                  <option value="">Belum terpetakan</option>
                  {regionCodes.filter(Boolean).map(code => <option key={code} value={code}>{code} · {regionOptions[code.split('.').length - 1].find(item => item.kode === code)?.nama}</option>)}
                </select>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Pilih dahulu wilayah pada filter halaman jika ingin menautkan kantor baru.</div>
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
