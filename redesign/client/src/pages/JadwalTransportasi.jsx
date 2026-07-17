import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Calendar, Plus, Trash2, X, Eye, ChevronLeft, ChevronRight, Activity, CalendarClock, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

function JadwalTransportasi() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filter States
  const [search, setSearch] = useState('');
  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Generate Modal States
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [genFormData, setGenFormData] = useState({
    bulan: String(new Date().getMonth() + 1).padStart(2, '0'),
    tahun: String(new Date().getFullYear()),
    template_id: '',
    lewati_minggu: true
  });
  const [genLoading, setGenLoading] = useState(false);
  const [genSummary, setGenSummary] = useState(null);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState(null);

  const MONTHS = [
    { value: '01', name: 'Januari' },
    { value: '02', name: 'Februari' },
    { value: '03', name: 'Maret' },
    { value: '04', name: 'April' },
    { value: '05', name: 'Mei' },
    { value: '06', name: 'Juni' },
    { value: '07', name: 'Juli' },
    { value: '08', name: 'Agustus' },
    { value: '09', name: 'September' },
    { value: '10', name: 'Oktober' },
    { value: '11', name: 'November' },
    { value: '12', name: 'Desember' }
  ];

  const YEARS = [
    String(new Date().getFullYear() - 1),
    String(new Date().getFullYear()),
    String(new Date().getFullYear() + 1),
    String(new Date().getFullYear() + 2)
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      let queryParams = `page=${page}&limit=15`;
      if (search) queryParams += `&search=${encodeURIComponent(search)}`;
      if (filterBulan) queryParams += `&bulan_generate=${encodeURIComponent(filterBulan)}`;

      const res = await api.getJadwal(queryParams);
      if (res.success) {
        setData(res.data);
        setPages(res.pagination.pages);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal mengambil data jadwal.');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await api.getTemplates('limit=1000&status=AKTIF');
      if (res.success) {
        setTemplates(res.data);
      }
    } catch (e) {
      console.error('Error loading active templates:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filterBulan]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const openGenerateModal = () => {
    setGenSummary(null);
    setGenFormData({
      bulan: String(new Date().getMonth() + 1).padStart(2, '0'),
      tahun: String(new Date().getFullYear()),
      template_id: '',
      lewati_minggu: true
    });
    setGenModalOpen(true);
  };

  const handleGenInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGenFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!genFormData.template_id) {
      alert('Silakan pilih template!');
      return;
    }

    try {
      setGenLoading(true);
      const res = await api.generateJadwal(genFormData);
      if (res.success) {
        setGenSummary(res.summary);
        setFilterBulan(res.summary.bulan); // Automatically switch view to the generated month!
        fetchData();
      }
    } catch (err) {
      alert(`Gagal generate jadwal: ${err.message}`);
    } finally {
      setGenLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus jadwal ${id}?`)) {
      try {
        await api.deleteJadwal(id);
        fetchData();
      } catch (err) {
        alert(`Gagal menghapus jadwal: ${err.message}`);
      }
    }
  };

  const openDetail = (sched) => {
    setSelectedJadwal(sched);
    setDetailModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={24} style={{ color: 'var(--accent-cyan)' }} /> Jadwal Transportasi
          </h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Kalender operasional armada pengiriman Pos Indonesia ({total} jadwal)</span>
        </div>
        <button onClick={openGenerateModal} className="btn btn-primary">
          <CalendarClock size={16} /> Generate Jadwal Bulanan
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flexGrow: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="Cari ID jadwal, rute, nama kendaraan, asal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            />
          </div>
          
          <div style={{ width: '180px' }}>
            <input 
              type="month" 
              value={filterBulan} 
              onChange={(e) => { setFilterBulan(e.target.value); setPage(1); }} 
              style={{ padding: '8px 12px', fontSize: '13px' }}
            />
          </div>

          <button type="submit" className="btn btn-secondary" style={{ padding: '8px 16px' }}>Cari</button>
        </form>
      </div>

      {/* Table grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Activity className="animate-spin text-accent" size={36} style={{ color: 'var(--accent-cyan)' }} />
        </div>
      ) : error ? (
        <div className="info-alert" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)' }}>
          <div>{error}</div>
        </div>
      ) : (
        <div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Jadwal ID</th>
                  <th>Tanggal</th>
                  <th>Hari</th>
                  <th>Rute</th>
                  <th>Asal KPRK</th>
                  <th>Tujuan KPRK</th>
                  <th>Armada / Kendaraan</th>
                  <th>Moda</th>
                  <th>Waktu (Berangkat → Tiba)</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.jadwal_id}>
                    <td style={{ fontWeight: 700, color: 'white' }}>{item.jadwal_id}</td>
                    <td style={{ color: 'white', fontWeight: 600 }}>{item.tanggal_berangkat || item.tanggal}</td>
                    <td>{item.hari_berangkat || item.hari}</td>
                    <td>{item.route_id}</td>
                    <td>{item.asal_nama || item.asal_nopen}</td>
                    <td>{item.tujuan_nama || item.tujuan_nopen}</td>
                    <td>{item.nama_kendaraan || item.kendaraan_id}</td>
                    <td>
                      <span className={`badge ${(item.moda === 'U' || item.nama_moda === 'UDARA') ? 'badge-info' : 'badge-success'}`}>
                        {item.nama_moda || item.moda || 'DARAT'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'white' }}>
                        <span>{item.jam_berangkat}</span>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <span>{item.jam_tiba}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openDetail(item)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '4px' }} title="Detail">
                          <Eye size={14} style={{ color: 'var(--accent-cyan)' }} />
                        </button>
                        <button onClick={() => handleDelete(item.jadwal_id)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '4px' }} title="Hapus">
                          <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Tidak ada data jadwal ditemukan pada bulan ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="pagination-bar">
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Menampilkan Halaman <strong>{page}</strong> dari <strong>{pages}</strong> ({total} data)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="btn btn-secondary" 
                style={{ padding: '6px 12px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pages, p + 1))} 
                disabled={page === pages}
                className="btn btn-secondary" 
                style={{ padding: '6px 12px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Schedule Modal */}
      {genModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'white', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
                Generate Jadwal Bulanan
              </h3>
              <button onClick={() => setGenModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            {genSummary ? (
              <div className="modal-body">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <CheckCircle2 size={56} style={{ color: 'var(--accent-green)', margin: '0 auto 12px auto' }} />
                  <h4 style={{ color: 'white', fontSize: '18px', fontWeight: 800 }}>Generate Jadwal Selesai!</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Bulan Generate: {genSummary.bulan}</p>
                </div>
                
                <div className="grid-2" style={{ gap: '15px', marginBottom: '20px' }}>
                  <div style={{ background: 'var(--light-navy)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'white' }}>{genSummary.total_dates}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>TOTAL HARI DI BULAN INI</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-green)' }}>{genSummary.total_created}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>JADWAL BERHASIL DIBUAT</div>
                  </div>
                  <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-orange)' }}>{genSummary.total_skipped_existing}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>LEWAT (JADWAL SUDAH ADA)</div>
                  </div>
                  <div style={{ background: 'var(--bg-navy)', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-muted)' }}>{genSummary.total_skipped_hari}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>LEWAT (HARI NON-OPERASI)</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setGenModalOpen(false)} className="btn btn-primary">
                    Selesai & Lihat
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerate}>
                <div className="modal-body">
                  <div className="grid-2" style={{ marginBottom: '15px' }}>
                    <div>
                      <label>Bulan <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                      <select name="bulan" value={genFormData.bulan} onChange={handleGenInputChange} required>
                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Tahun <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                      <select name="tahun" value={genFormData.tahun} onChange={handleGenInputChange} required>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label>Template Jadwal <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                    <select name="template_id" value={genFormData.template_id} onChange={handleGenInputChange} required>
                      <option value="">-- Pilih Template Jadwal --</option>
                      {templates.map(t => (
                        <option key={t.template_id} value={t.template_id}>
                          {t.template_id} : {t.asal_nama || t.asal_nopen} → {t.tujuan_nama || t.tujuan_nopen} ({t.jam_berangkat})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ padding: '12px', background: 'var(--light-navy)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'none', cursor: 'pointer', marginBottom: 0 }}>
                      <input 
                        type="checkbox" 
                        name="lewati_minggu" 
                        checked={genFormData.lewati_minggu} 
                        onChange={handleGenInputChange}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>Lewati Hari Minggu (Bypass Sundays)</span>
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setGenModalOpen(false)} className="btn btn-secondary" disabled={genLoading}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={genLoading}>
                    {genLoading ? 'Sedang Generate...' : 'Mulai Generate'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalOpen && selectedJadwal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'white', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
                Detail Jadwal Keberangkatan
              </h3>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'var(--bg-navy)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>JADWAL ID</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginTop: '2px' }}>{selectedJadwal.jadwal_id}</div>
              </div>

              <div className="grid-2">
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>TANGGAL</span>
                  <div style={{ color: 'white', fontWeight: 700, marginTop: '2px' }}>{selectedJadwal.tanggal}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>HARI</span>
                  <div style={{ color: 'white', fontWeight: 700, marginTop: '2px' }}>{selectedJadwal.hari}</div>
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>RUTE ID</span>
                  <div style={{ color: 'white', fontWeight: 700, marginTop: '2px' }}>{selectedJadwal.route_id}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>MODA</span>
                  <div style={{ marginTop: '2px' }}>
                    <span className="badge badge-info">{selectedJadwal.moda}</span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>KANTOR ASAL</span>
                <div style={{ color: 'white', fontWeight: 700, marginTop: '2px' }}>{selectedJadwal.asal_nopen} - {selectedJadwal.asal_nama}</div>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>KANTOR TUJUAN</span>
                <div style={{ color: 'white', fontWeight: 700, marginTop: '2px' }}>{selectedJadwal.tujuan_nopen} - {selectedJadwal.tujuan_nama}</div>
              </div>

              <div className="grid-2">
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>JAM BERANGKAT</span>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '16px', marginTop: '2px' }}>{selectedJadwal.jam_berangkat}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>JAM TIBA</span>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '16px', marginTop: '2px' }}>{selectedJadwal.jam_tiba}</div>
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>CUT OFF TIME</span>
                  <div style={{ color: 'white', fontWeight: 700, marginTop: '2px' }}>{selectedJadwal.cut_off}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>ESTIMASI DURASI</span>
                  <div style={{ color: 'white', fontWeight: 700, marginTop: '2px' }}>{selectedJadwal.estimasi_jam} jam</div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>KENDARAAN ARMADA</span>
                <div style={{ color: 'white', fontWeight: 700, marginTop: '2px' }}>{selectedJadwal.kendaraan_id} - {selectedJadwal.nama_kendaraan}</div>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>KETERANGAN / SUMBER</span>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                  {selectedJadwal.keterangan} ({selectedJadwal.sumber_generate})
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" onClick={() => setDetailModalOpen(false)} className="btn btn-secondary">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JadwalTransportasi;
