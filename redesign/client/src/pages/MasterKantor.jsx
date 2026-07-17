import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Search, Building, Plus, Edit2, Trash2, X, Eye, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

function MasterKantor() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filter States
  const [search, setSearch] = useState('');
  const [regional, setRegional] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dropdown options
  const [regionals, setRegionals] = useState([]);
  const [types, setTypes] = useState([]);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'detail'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    nopend: '',
    nama_nopend: '',
    nopen_kc_kcu: '',
    nama_kcu_kc: '',
    nopen_kcu: '',
    nama_kcu: '',
    kdregional: '',
    nama_regional: '',
    typekantor: '',
    status: 'AKTIF'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      let queryParams = `page=${page}&limit=15`;
      if (search) queryParams += `&search=${encodeURIComponent(search)}`;
      if (regional) queryParams += `&kdregional=${encodeURIComponent(regional)}`;
      if (type) queryParams += `&typekantor=${encodeURIComponent(type)}`;
      if (status) queryParams += `&status=${encodeURIComponent(status)}`;

      const res = await api.getKantor(queryParams);
      if (res.success) {
        setData(res.data);
        setPages(res.pagination.pages);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal mengambil data kantor.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const res = await api.getKantorFilters();
      if (res.success) {
        setRegionals(res.data.regionals);
        setTypes(res.data.types);
      }
    } catch (e) {
      console.error('Error fetching filters options:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, regional, type, status]);

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
      nopend: '',
      nama_nopend: '',
      nopen_kc_kcu: '',
      nama_kcu_kc: '',
      nopen_kcu: '',
      nama_kcu: '',
      kdregional: '',
      nama_regional: '',
      typekantor: '',
      status: 'AKTIF'
    });
    setModalType('add');
    setModalOpen(true);
  };

  const openEditModal = (kantor) => {
    setFormData({ ...kantor });
    setCurrentId(kantor.nopend);
    setModalType('edit');
    setModalOpen(true);
  };

  const openDetailModal = (kantor) => {
    setFormData({ ...kantor });
    setModalType('detail');
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await api.createKantor(formData);
      } else if (modalType === 'edit') {
        await api.updateKantor(currentId, formData);
      }
      setModalOpen(false);
      fetchData();
      fetchFilters(); // Refresh options
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (nopen) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Kantor dengan Nopen ${nopen}?`)) {
      try {
        await api.deleteKantor(nopen);
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
            <Building size={24} style={{ color: 'var(--primary-blue)' }} /> Master Kantor
          </h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Mengelola data KPRK/KCU dan kantor cabang Pos Indonesia ({total} kantor)</span>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Tambah Kantor
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flexGrow: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="Cari nopen, nama kantor, regional..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            />
          </div>
          
          <div style={{ width: '150px' }}>
            <select name="regional" value={regional} onChange={(e) => { setRegional(e.target.value); setPage(1); }} style={{ padding: '8px 12px', fontSize: '13px' }}>
              <option value="">-- Regional --</option>
              {regionals.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <select name="type" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} style={{ padding: '8px 12px', fontSize: '13px' }}>
              <option value="">-- Tipe Kantor --</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
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
                  <th>Nopen / Kode</th>
                  <th>Nama Kantor / DC</th>
                  <th>Regional</th>
                  <th>KCU / KC Induk</th>
                  <th>KCU Wilayah</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.nopend || item._id}>
                    <td style={{ fontWeight: 700, color: 'white' }}>{item.nopend}</td>
                    <td>{item.nama_nopend}</td>
                    <td>{item.kdregional ? `Regional ${item.kdregional} — ${item.nama_regional || ''}` : '-'}</td>
                    <td>{item.nama_kcu_kc || item.nopen_kc_kcu || '-'}</td>
                    <td>{item.nama_kcu || item.nopen_kcu || '-'}</td>
                    <td>
                      <span className={`badge ${item.status === 'NONAKTIF' ? 'badge-danger' : 'badge-success'}`}>
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
                        <button onClick={() => handleDelete(item.nopend)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '4px' }} title="Hapus">
                          <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Tidak ada data kantor ditemukan.
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
                {modalType === 'add' ? 'Tambah Kantor Baru' : modalType === 'edit' ? 'Edit Data Kantor' : 'Detail Kantor'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Nopen / Kode Kantor <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                    <input 
                      type="text" 
                      name="nopend" 
                      value={formData.nopend || ''} 
                      onChange={handleInputChange} 
                      required 
                      disabled={modalType !== 'add'} 
                    />
                  </div>
                  <div>
                    <label>Nama Kantor <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                    <input 
                      type="text" 
                      name="nama_nopend" 
                      value={formData.nama_nopend || ''} 
                      onChange={handleInputChange} 
                      required 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Kode Regional</label>
                    <input 
                      type="text" 
                      name="kdregional" 
                      value={formData.kdregional} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                  <div>
                    <label>Nama Regional</label>
                    <input 
                      type="text" 
                      name="nama_regional" 
                      value={formData.nama_regional} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Kode KCU / KC Induk</label>
                    <input 
                      type="text" 
                      name="nopen_kc_kcu" 
                      value={formData.nopen_kc_kcu || ''} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                  <div>
                    <label>Nama KCU / KC Induk</label>
                    <input 
                      type="text" 
                      name="nama_kcu_kc" 
                      value={formData.nama_kcu_kc || ''} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Kode KCU Wilayah</label>
                    <input 
                      type="text" 
                      name="nopen_kcu" 
                      value={formData.nopen_kcu || ''} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                  <div>
                    <label>Nama KCU Wilayah</label>
                    <input 
                      type="text" 
                      name="nama_kcu" 
                      value={formData.nama_kcu || ''} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Tipe Kantor</label>
                    <input 
                      type="text" 
                      name="typekantor" 
                      placeholder="Contoh: KCU, KC, KCP" 
                      value={formData.typekantor} 
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

export default MasterKantor;
