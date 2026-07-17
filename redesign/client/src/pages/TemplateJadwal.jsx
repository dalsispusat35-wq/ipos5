import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Calendar, Plus, Edit2, Trash2, X, Eye, ChevronLeft, ChevronRight, Activity, Clock } from 'lucide-react';

function TemplateJadwal() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filter States
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Form options
  const [detailRouteList, setDetailRouteList] = useState([]);
  const [kendaraanList, setKendaraanList] = useState([]);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'detail'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    template_id: '',
    detail_route_id: '',
    route_id: '',
    kendaraan_id: '',
    nama_kendaraan: '',
    moda: 'DARAT',
    jam_berangkat: '00:00',
    jam_tiba: '00:00',
    cut_off: '00:00',
    estimasi_jam: 0,
    hari_operasi: [],
    status: 'AKTIF'
  });

  const DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      let queryParams = `page=${page}&limit=12`;
      if (search) queryParams += `&search=${encodeURIComponent(search)}`;

      const res = await api.getTemplates(queryParams);
      if (res.success) {
        setData(res.data);
        setPages(res.pagination.pages);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal mengambil data template.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const resRoute = await api.getDetailRoute('limit=1000&status=AKTIF');
      const resKendaraan = await api.getKendaraan('limit=1000&status=AKTIF');
      if (resRoute.success) setDetailRouteList(resRoute.data);
      if (resKendaraan.success) setKendaraanList(resKendaraan.data);
    } catch (e) {
      console.error('Error fetching template form options:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const openAddModal = () => {
    setFormData({
      template_id: '',
      detail_route_id: '',
      route_id: '',
      kendaraan_id: '',
      nama_kendaraan: '',
      moda: 'DARAT',
      jam_berangkat: '08:00',
      jam_tiba: '12:00',
      cut_off: '07:00',
      estimasi_jam: 4,
      hari_operasi: ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'],
      status: 'AKTIF'
    });
    setModalType('add');
    setModalOpen(true);
  };

  const openEditModal = (template) => {
    setFormData({ 
      ...template,
      hari_operasi: Array.isArray(template.hari_operasi) ? template.hari_operasi : [template.hari_operasi]
    });
    setCurrentId(template.template_id);
    setModalType('edit');
    setModalOpen(true);
  };

  const openDetailModal = (template) => {
    setFormData({ 
      ...template,
      hari_operasi: Array.isArray(template.hari_operasi) ? template.hari_operasi : [template.hari_operasi]
    });
    setModalType('detail');
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: name === 'estimasi_jam' ? parseFloat(value) || 0 : value
      };

      // Fill secondary values based on selections
      if (name === 'detail_route_id') {
        const found = detailRouteList.find(d => d.detail_route_id === value);
        updated.route_id = found ? found.route_id : '';
        updated.asal_nopen = found ? found.asal_nopen : '';
        updated.asal_nama = found ? found.asal_nama : '';
        updated.tujuan_nopen = found ? found.tujuan_nopen : '';
        updated.tujuan_nama = found ? found.tujuan_nama : '';
      } else if (name === 'kendaraan_id') {
        const found = kendaraanList.find(k => k.kendaraan_id === value);
        updated.nama_kendaraan = found ? found.nama_kendaraan : '';
        updated.moda = found ? found.moda : 'DARAT';
      }

      return updated;
    });
  };

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const days = [...prev.hari_operasi];
      const idx = days.indexOf(day);
      if (idx !== -1) {
        days.splice(idx, 1);
      } else {
        days.push(day);
      }
      return { ...prev, hari_operasi: days };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await api.createTemplate(formData);
      } else if (modalType === 'edit') {
        await api.updateTemplate(currentId, formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Template ${id}?`)) {
      try {
        await api.deleteTemplate(id);
        fetchData();
      } catch (err) {
        alert(`Gagal menghapus: ${err.message}`);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={24} style={{ color: 'var(--accent-orange)' }} /> Template Jadwal Transportasi
          </h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Mengelola blueprint operasional jadwal pengiriman rutin ({total} template)</span>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Tambah Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flexGrow: 1 }}>
            <input 
              type="text" 
              placeholder="Cari ID template, rute, kendaraan, hari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                  <th>Template ID</th>
                  <th>Rute / Segmen</th>
                  <th>Armada</th>
                  <th>Jam Keberangkatan</th>
                  <th>Jam Tiba</th>
                  <th>Estimasi</th>
                  <th>Hari Operasi</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.template_id}>
                    <td style={{ fontWeight: 700, color: 'white' }}>{item.template_id}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'white' }}>{item.route_id}</span>
                        <span style={{ fontSize: '11px' }}>{item.asal_nama || item.asal_nopen} → {item.tujuan_nama || item.tujuan_nopen}</span>
                      </div>
                    </td>
                    <td>{item.nama_kendaraan || item.kendaraan_id}</td>
                    <td style={{ color: 'white', fontWeight: 600 }}>{item.jam_berangkat}</td>
                    <td>{item.jam_tiba}</td>
                    <td>{item.estimasi_jam} jam</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {(Array.isArray(item.hari_operasi) ? item.hari_operasi : [item.hari_operasi]).map(d => (
                          <span key={d} className="badge badge-secondary" style={{ background: 'var(--light-navy)', color: 'white', fontSize: '9px', padding: '2px 6px' }}>{d}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'AKTIF' ? 'badge-success' : 'badge-danger'}`}>
                        {item.status || 'AKTIF'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openDetailModal(item)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '4px' }} title="Detail">
                          <Eye size={14} style={{ color: 'var(--accent-cyan)' }} />
                        </button>
                        <button onClick={() => openEditModal(item)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '4px' }} title="Edit">
                          <Edit2 size={14} style={{ color: 'var(--accent-orange)' }} />
                        </button>
                        <button onClick={() => handleDelete(item.template_id)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '4px' }} title="Hapus">
                          <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Tidak ada data template ditemukan.
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

      {/* Modal dialog for ADD / EDIT / DETAIL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'white', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
                {modalType === 'add' ? 'Tambah Template Baru' : modalType === 'edit' ? 'Edit Template Jadwal' : 'Detail Template Jadwal'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {modalType !== 'add' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label>Template ID</label>
                    <input type="text" name="template_id" value={formData.template_id} disabled />
                  </div>
                )}

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Rute / Segmen Rute <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                    <select name="detail_route_id" value={formData.detail_route_id} onChange={handleInputChange} required disabled={modalType === 'detail'}>
                      <option value="">-- Pilih Segmen Rute --</option>
                      {detailRouteList.map(d => (
                        <option key={d.detail_route_id} value={d.detail_route_id}>
                          {d.detail_route_id} ({d.route_id}) : {d.asal_nama || d.asal_nopen} → {d.tujuan_nama || d.tujuan_nopen}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Kendaraan Armada <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                    <select name="kendaraan_id" value={formData.kendaraan_id} onChange={handleInputChange} required disabled={modalType === 'detail'}>
                      <option value="">-- Pilih Kendaraan --</option>
                      {kendaraanList.map(k => (
                        <option key={k.kendaraan_id} value={k.kendaraan_id}>
                          {k.kendaraan_id} - {k.nama_kendaraan} ({k.nopol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-3" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Jam Berangkat</label>
                    <input type="time" name="jam_berangkat" value={formData.jam_berangkat} onChange={handleInputChange} required disabled={modalType === 'detail'} />
                  </div>
                  <div>
                    <label>Jam Tiba</label>
                    <input type="time" name="jam_tiba" value={formData.jam_tiba} onChange={handleInputChange} required disabled={modalType === 'detail'} />
                  </div>
                  <div>
                    <label>Cut-Off Time</label>
                    <input type="time" name="cut_off" value={formData.cut_off} onChange={handleInputChange} required disabled={modalType === 'detail'} />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Estimasi Perjalanan (Jam)</label>
                    <input type="number" name="estimasi_jam" value={formData.estimasi_jam} onChange={handleInputChange} min="0" step="0.5" disabled={modalType === 'detail'} />
                  </div>
                  <div>
                    <label>Status Template</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} disabled={modalType === 'detail'}>
                      <option value="AKTIF">AKTIF</option>
                      <option value="NONAKTIF">NONAKTIF</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label>Hari Operasi Jadwal</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {DAYS.map(day => {
                      const isActive = formData.hari_operasi.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          disabled={modalType === 'detail'}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: '1px solid',
                            cursor: modalType === 'detail' ? 'default' : 'pointer',
                            backgroundColor: isActive ? 'var(--primary-blue)' : 'var(--bg-navy)',
                            borderColor: isActive ? 'var(--accent-cyan)' : 'var(--border-light)',
                            color: isActive ? 'white' : 'var(--text-secondary)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  {modalType === 'detail' ? 'Tutup' : 'Batal'}
                </button>
                {modalType !== 'detail' && (
                  <button type="submit" className="btn btn-primary">
                    Simpan
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplateJadwal;
