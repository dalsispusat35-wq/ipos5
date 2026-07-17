import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Layers, Plus, Edit2, Trash2, X, Eye, ChevronLeft, ChevronRight, Activity, MapPin, ArrowRight, Calendar } from 'lucide-react';

function MasterRoute() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filter States
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Master data options for form dropdowns
  const [kantorList, setKantorList] = useState([]);
  const [produkList, setProdukList] = useState([]);

  // Detail segments & templates states
  const [detailSegments, setDetailSegments] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'detail'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    route_id: '',
    nopen_asal: '',
    nama_asal: '',
    nopen_tujuan: '',
    nama_tujuan: '',
    kodeMile: '',
    deskripsi_produk: '',
    prioritas: 1,
    status_route: 'DRAFT',
    aktif: 'Y'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      let queryParams = `page=${page}&limit=12`;
      if (search) queryParams += `&search=${encodeURIComponent(search)}`;

      const res = await api.getRoute(queryParams);
      if (res.success) {
        setData(res.data);
        setPages(res.pagination.pages);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal mengambil data rute.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const resKantor = await api.getKantor('limit=1000&status=AKTIF');
      const resProduk = await api.getProduk('limit=1000&status=AKTIF');
      if (resKantor.success) setKantorList(resKantor.data);
      if (resProduk.success) setProdukList(resProduk.data);
    } catch (e) {
      console.error('Error fetching form options:', e);
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
      route_id: '',
      nopen_asal: '',
      nama_asal: '',
      nopen_tujuan: '',
      nama_tujuan: '',
      kodeMile: '',
      deskripsi_produk: '',
      prioritas: 1,
      status_route: 'DRAFT',
      aktif: 'Y'
    });
    setModalType('add');
    setModalOpen(true);
  };

  const openEditModal = (route) => {
    setFormData({ ...route });
    setCurrentId(route.route_id);
    setModalType('edit');
    setModalOpen(true);
  };

  const openDetailModal = async (route) => {
    setFormData({ ...route });
    setModalType('detail');
    setModalOpen(true);
    setDetailSegments([]);
    setTemplates([]);
    
    // Fetch segments & templates for this route
    try {
      const segmentsRes = await api.getDetailRoute(`route_id=${route.route_id}`);
      if (segmentsRes.success) {
        setDetailSegments(segmentsRes.data.sort((a, b) => a.seq - b.seq));
      }
      
      const templatesRes = await api.getTemplates(`route_id=${route.route_id}`);
      if (templatesRes.success) {
        setTemplates(templatesRes.data);
      }
    } catch (e) {
      console.error('Error loading detail/templates:', e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: name === 'prioritas' ? parseInt(value, 10) || 1 : value
      };

      // Auto-fill names based on selection
      if (name === 'nopen_asal') {
        const found = kantorList.find(k => k.nopend === value);
        updated.nama_asal = found ? found.nama_nopend : '';
      } else if (name === 'nopen_tujuan') {
        const found = kantorList.find(k => k.nopend === value);
        updated.nama_tujuan = found ? found.nama_nopend : '';
      } else if (name === 'kodeMile') {
        const found = produkList.find(p => p.kodeMile === value);
        updated.deskripsi_produk = found ? found.serviceName || found.serviceId : '';
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await api.createRoute(formData);
      } else if (modalType === 'edit') {
        await api.updateRoute(currentId, formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Rute ${id}? Semua segmen detail dan template rute ini juga akan dihapus.`)) {
      try {
        await api.deleteRoute(id);
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
            <Layers size={24} style={{ color: 'var(--accent-purple)' }} /> Master Route
          </h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Mengelola konfigurasi rute pengiriman Pos Indonesia ({total} rute)</span>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Tambah Route
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flexGrow: 1 }}>
            <input 
              type="text" 
              placeholder="Cari ID rute, asal, tujuan, kode mile..."
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
                  <th>Route ID</th>
                  <th>Asal KPRK</th>
                  <th>Tujuan KPRK</th>
                  <th>Kode Mile</th>
                  <th>Produk</th>
                  <th>Prioritas</th>
                  <th>Status Rute</th>
                  <th>Aktif</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.route_id}>
                    <td style={{ fontWeight: 700, color: 'white' }}>{item.route_id}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'white' }}>{item.nopen_asal}</span>
                        <span style={{ fontSize: '11px' }}>{item.nama_asal}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'white' }}>{item.nopen_tujuan}</span>
                        <span style={{ fontSize: '11px' }}>{item.nama_tujuan}</span>
                      </div>
                    </td>
                    <td>{item.kodeMile || '-'}</td>
                    <td>{item.deskripsi_produk || '-'}</td>
                    <td>{item.prioritas || 1}</td>
                    <td>
                      <span className={`badge ${item.status_route === 'LENGKAP' ? 'badge-success' : 'badge-warning'}`}>
                        {item.status_route || 'DRAFT'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.aktif === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                        {item.aktif === 'Y' ? 'YA' : 'TIDAK'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openDetailModal(item)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '4px' }} title="Rute Segmen & Template">
                          <Eye size={14} style={{ color: 'var(--accent-cyan)' }} />
                        </button>
                        <button onClick={() => openEditModal(item)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '4px' }} title="Edit">
                          <Edit2 size={14} style={{ color: 'var(--accent-orange)' }} />
                        </button>
                        <button onClick={() => handleDelete(item.route_id)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '4px' }} title="Hapus">
                          <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Tidak ada data rute ditemukan.
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
          <div className="modal-content animate-fade-in" style={{ maxWidth: modalType === 'detail' ? '850px' : '650px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'white', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
                {modalType === 'add' ? 'Tambah Rute Baru' : modalType === 'edit' ? 'Edit Data Rute' : 'Detail Konfigurasi Rute'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {modalType !== 'detail' ? (
                  <div>
                    {modalType !== 'add' && (
                      <div style={{ marginBottom: '15px' }}>
                        <label>Route ID</label>
                        <input type="text" name="route_id" value={formData.route_id} disabled />
                      </div>
                    )}

                    <div className="grid-2" style={{ marginBottom: '15px' }}>
                      <div>
                        <label>KPRK Asal <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                        <select name="nopen_asal" value={formData.nopen_asal} onChange={handleInputChange} required>
                          <option value="">-- Pilih Kantor Asal --</option>
                          {kantorList.map(k => <option key={k.nopend} value={k.nopend}>{k.nopend} - {k.nama_nopend}</option>)}
                        </select>
                      </div>
                      <div>
                        <label>KPRK Tujuan <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                        <select name="nopen_tujuan" value={formData.nopen_tujuan} onChange={handleInputChange} required>
                          <option value="">-- Pilih Kantor Tujuan --</option>
                          {kantorList.map(k => <option key={k.nopend} value={k.nopend}>{k.nopend} - {k.nama_nopend}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: '15px' }}>
                      <div>
                        <label>Kode Mile / Tipe Layanan <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                        <select name="kodeMile" value={formData.kodeMile} onChange={handleInputChange} required>
                          <option value="">-- Pilih Kode Mile --</option>
                          {produkList.map(p => <option key={p.kodeMile} value={p.kodeMile}>{p.kodeMile} - {p.serviceName || p.serviceId}</option>)}
                        </select>
                      </div>
                      <div>
                        <label>Prioritas Rute</label>
                        <input type="number" name="prioritas" value={formData.prioritas} onChange={handleInputChange} min="1" />
                      </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: '15px' }}>
                      <div>
                        <label>Status Rute</label>
                        <select name="status_route" value={formData.status_route} onChange={handleInputChange}>
                          <option value="LENGKAP">LENGKAP</option>
                          <option value="PARSIAL">PARSIAL</option>
                          <option value="DRAFT">DRAFT</option>
                        </select>
                      </div>
                      <div>
                        <label>Aktif</label>
                        <select name="aktif" value={formData.aktif} onChange={handleInputChange}>
                          <option value="Y">YA</option>
                          <option value="N">TIDAK</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Visual Route Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-navy)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>ASAL</span>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'white' }}>{formData.nopen_asal}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formData.nama_asal}</div>
                      </div>
                      <ArrowRight size={24} style={{ color: 'var(--accent-cyan)' }} />
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>TUJUAN</span>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'white' }}>{formData.nopen_tujuan}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formData.nama_tujuan}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <span className="badge badge-info">{formData.kodeMile}</span>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Prioritas: {formData.prioritas}</div>
                      </div>
                    </div>

                    <div className="grid-2">
                      {/* Segments table */}
                      <div className="glass-card" style={{ marginBottom: 0 }}>
                        <h4 className="card-title" style={{ fontSize: '14px' }}><MapPin size={16} /> Segmen Perjalanan (Detail Rute)</h4>
                        {detailSegments.length > 0 ? (
                          <table style={{ fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th>Seq</th>
                                <th>Asal</th>
                                <th>Tujuan</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailSegments.map(seg => (
                                <tr key={seg.detail_route_id}>
                                  <td style={{ fontWeight: 700, color: 'white' }}>{seg.seq}</td>
                                  <td>{seg.asal_nopen}</td>
                                  <td>{seg.tujuan_nopen}</td>
                                  <td>
                                    <span className={`badge ${seg.status === 'AKTIF' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                      {seg.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: '8px', fontSize: '12px' }}>
                            Tidak ada detail segmen dikonfigurasi.
                          </div>
                        )}
                      </div>

                      {/* Templates Table */}
                      <div className="glass-card" style={{ marginBottom: 0 }}>
                        <h4 className="card-title" style={{ fontSize: '14px' }}><Calendar size={16} /> Template Jadwal Rute</h4>
                        {templates.length > 0 ? (
                          <table style={{ fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Armada</th>
                                <th>Moda</th>
                                <th>Berangkat</th>
                                <th>Tiba</th>
                              </tr>
                            </thead>
                            <tbody>
                              {templates.map(t => (
                                <tr key={t.template_id}>
                                  <td style={{ fontWeight: 700, color: 'white' }}>{t.template_id}</td>
                                  <td>{t.nama_kendaraan || t.kendaraan_id}</td>
                                  <td>{t.moda}</td>
                                  <td>{t.jam_berangkat}</td>
                                  <td>{t.jam_tiba}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: '8px', fontSize: '12px' }}>
                            Tidak ada template jadwal dikonfigurasi.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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

export default MasterRoute;
