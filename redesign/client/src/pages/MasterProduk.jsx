import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Search, Box, Plus, Edit2, Trash2, X, Eye, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

function MasterProduk() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filter States
  const [search, setSearch] = useState('');
  const [segmen, setSegmen] = useState('');
  const [pasar, setPasar] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dropdown options
  const [segmenOptions, setSegmenOptions] = useState([]);
  const [pasarOptions, setPasarOptions] = useState([]);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'detail'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    kodeMile: '',
    serviceId: '',
    serviceName: '',
    segmenProduk: '',
    pasar: '',
    status: 'AKTIF',
    noPerioritas: 1
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      let queryParams = `page=${page}&limit=15`;
      if (search) queryParams += `&search=${encodeURIComponent(search)}`;
      if (segmen) queryParams += `&segmenProduk=${encodeURIComponent(segmen)}`;
      if (pasar) queryParams += `&pasar=${encodeURIComponent(pasar)}`;
      if (status) queryParams += `&status=${encodeURIComponent(status)}`;

      const res = await api.getProduk(queryParams);
      if (res.success) {
        setData(res.data);
        setPages(res.pagination.pages);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal mengambil data produk.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const res = await api.getProdukFilters();
      if (res.success) {
        setSegmenOptions(res.data.segmen);
        setPasarOptions(res.data.pasar);
      }
    } catch (e) {
      console.error('Error fetching filters options:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, segmen, pasar, status]);

  useEffect(() => {
    fetchFilters();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const openAddModal = () => {
    setFormData({
      kodeMile: '',
      serviceId: '',
      serviceName: '',
      segmenProduk: '',
      pasar: '',
      status: 'AKTIF',
      noPerioritas: 1
    });
    setModalType('add');
    setModalOpen(true);
  };

  const openEditModal = (produk) => {
    setFormData({ ...produk });
    setCurrentId(produk.kodeMile);
    setModalType('edit');
    setModalOpen(true);
  };

  const openDetailModal = (produk) => {
    setFormData({ ...produk });
    setModalType('detail');
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'noPerioritas' ? parseInt(value, 10) || 1 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await api.createProduk(formData);
      } else if (modalType === 'edit') {
        await api.updateProduk(currentId, formData);
      }
      setModalOpen(false);
      fetchData();
      fetchFilters(); // Refresh options
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (kodeMile) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Produk dengan Kode Mile ${kodeMile}?`)) {
      try {
        await api.deleteProduk(kodeMile);
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
            <Box size={24} style={{ color: 'var(--accent-orange)' }} /> Master Produk
          </h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Mengelola tipe layanan kiriman Pos Indonesia ({total} produk)</span>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flexGrow: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="Cari kode mile, service ID, nama produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            />
          </div>
          
          <div style={{ width: '150px' }}>
            <select name="segmen" value={segmen} onChange={(e) => { setSegmen(e.target.value); setPage(1); }} style={{ padding: '8px 12px', fontSize: '13px' }}>
              <option value="">-- Segmen Produk --</option>
              {segmenOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <select name="pasar" value={pasar} onChange={(e) => { setPasar(e.target.value); setPage(1); }} style={{ padding: '8px 12px', fontSize: '13px' }}>
              <option value="">-- Target Pasar --</option>
              {pasarOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <select name="status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ padding: '8px 12px', fontSize: '13px' }}>
              <option value="">-- Status --</option>
              <option value="AKTIF">AKTIF</option>
              <option value="NONAKTIF">NONAKTIF</option>
            </select>
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
                  <th>Kode Mile</th>
                  <th>Service ID</th>
                  <th>Nama Layanan</th>
                  <th>Segmen Produk</th>
                  <th>Pasar</th>
                  <th>Prioritas</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.kodeMile}>
                    <td style={{ fontWeight: 700, color: 'white' }}>{item.kodeMile}</td>
                    <td>{item.serviceId || '-'}</td>
                    <td>{item.serviceName || item.serviceId || '-'}</td>
                    <td>{item.segmenProduk || '-'}</td>
                    <td>{item.pasar || '-'}</td>
                    <td>{item.noPerioritas || 1}</td>
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
                        <button onClick={() => handleDelete(item.kodeMile)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '4px' }} title="Hapus">
                          <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Tidak ada data produk ditemukan.
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
          <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'white', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
                {modalType === 'add' ? 'Tambah Produk Baru' : modalType === 'edit' ? 'Edit Data Produk' : 'Detail Produk'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Kode Mile <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                    <input 
                      type="text" 
                      name="kodeMile" 
                      placeholder="Contoh: M1, M2"
                      value={formData.kodeMile} 
                      onChange={handleInputChange} 
                      required 
                      disabled={modalType !== 'add'} 
                    />
                  </div>
                  <div>
                    <label>Service ID <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                    <input 
                      type="text" 
                      name="serviceId" 
                      placeholder="Contoh: POS_EXPRESS"
                      value={formData.serviceId} 
                      onChange={handleInputChange} 
                      required 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                </div>

                <div className="grid-1" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Nama Layanan / Service Name</label>
                    <input 
                      type="text" 
                      name="serviceName" 
                      placeholder="Contoh: Pos Sameday, Pos Kilat Khusus"
                      value={formData.serviceName} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Segmen Produk</label>
                    <input 
                      type="text" 
                      name="segmenProduk" 
                      value={formData.segmenProduk} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                  <div>
                    <label>Target Pasar</label>
                    <input 
                      type="text" 
                      name="pasar" 
                      value={formData.pasar} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>No Prioritas</label>
                    <input 
                      type="number" 
                      name="noPerioritas" 
                      value={formData.noPerioritas} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                  <div>
                    <label>Status</label>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleInputChange}
                      disabled={modalType === 'detail'}
                    >
                      <option value="AKTIF">AKTIF</option>
                      <option value="NONAKTIF">NONAKTIF</option>
                    </select>
                  </div>
                </div>

                {modalType === 'detail' && (
                  <div style={{ marginTop: '15px', padding: '12px', background: 'var(--light-navy)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <div><strong>Created At:</strong> {formData.createdAt ? new Date(formData.createdAt).toLocaleString() : '-'}</div>
                    <div style={{ marginTop: '4px' }}><strong>Updated At:</strong> {formData.updatedAt ? new Date(formData.updatedAt).toLocaleString() : '-'}</div>
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

export default MasterProduk;
