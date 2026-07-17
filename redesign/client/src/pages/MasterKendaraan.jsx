import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { Search, Truck, Plus, Edit2, Trash2, X, Eye, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import VehicleDetailModal from '../components/VehicleDetailModal.jsx';

function MasterKendaraan() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Pagination & Filter States
  const [search, setSearch] = useState('');
  const [moda, setModa] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dropdown options
  const [modaOptions, setModaOptions] = useState([]);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'detail'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    kendaraan_id: '',
    nopol: '',
    nama_kendaraan: '',
    jenis_kendaraan: '',
    kapasitas_kg: 0,
    kapasitas_m3: 0,
    moda: 'DARAT',
    status: 'AKTIF'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      let queryParams = `page=${page}&limit=15`;
      if (search) queryParams += `&search=${encodeURIComponent(search)}`;
      if (moda) queryParams += `&moda=${encodeURIComponent(moda)}`;
      if (status) queryParams += `&status=${encodeURIComponent(status)}`;

      const res = await api.getKendaraan(queryParams);
      if (res.success) {
        setData(res.data);
        setPages(res.pagination.pages);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal mengambil data kendaraan.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const res = await api.getKendaraanFilters();
      if (res.success) {
        setModaOptions(res.data.modas);
      }
    } catch (e) {
      console.error('Error fetching filters options:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, moda, status]);

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
      kendaraan_id: '',
      nopol: '',
      nama_kendaraan: '',
      jenis_kendaraan: '',
      kapasitas_kg: 0,
      kapasitas_m3: 0,
      moda: 'DARAT',
      status: 'AKTIF'
    });
    setModalType('add');
    setModalOpen(true);
  };

  const openEditModal = (kendaraan) => {
    setFormData({ ...kendaraan });
    setCurrentId(kendaraan.kendaraan_id);
    setModalType('edit');
    setModalOpen(true);
  };

  const openDetailModal = (kendaraan) => {
    setFormData({ ...kendaraan });
    setModalType('detail');
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'kapasitas_kg' || name === 'kapasitas_m3' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await api.createKendaraan(formData);
      } else if (modalType === 'edit') {
        await api.updateKendaraan(currentId, formData);
      }
      setModalOpen(false);
      fetchData();
      fetchFilters(); // Refresh options
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Kendaraan ${id}?`)) {
      try {
        await api.deleteKendaraan(id);
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
            <Truck size={24} style={{ color: 'var(--accent-green)' }} /> Master Kendaraan
          </h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Mengelola armada pengiriman Pos Indonesia ({total} kendaraan)</span>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Tambah Kendaraan
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flexGrow: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="Cari ID, nopol, nama kendaraan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            />
          </div>
          
          <div style={{ width: '150px' }}>
            <select name="moda" value={moda} onChange={(e) => { setModa(e.target.value); setPage(1); }} style={{ padding: '8px 12px', fontSize: '13px' }}>
              <option value="">-- Moda --</option>
              {modaOptions.map(m => <option key={m} value={m}>{m}</option>)}
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
                  <th>ID Kendaraan</th>
                  <th>No Polisi</th>
                  <th>Nama Kendaraan</th>
                  <th>Jenis</th>
                  <th>Kapasitas (Kg)</th>
                  <th>Kapasitas (M³)</th>
                  <th>Moda</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.kendaraan_id}>
                    <td style={{ fontWeight: 700, color: 'white' }}>{item.kendaraan_id}</td>
                     <td>
                      <button
                        onClick={() => setSelectedVehicle(item.nopol)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        title="Klik untuk detail operasional"
                      >
                        {item.nopol || '-'}
                      </button>
                    </td>
                    <td>{item.nama_kendaraan || '-'}</td>
                    <td>{item.jenis_kendaraan || '-'}</td>
                    <td>{item.kapasitas_kg ? item.kapasitas_kg.toLocaleString() : '0'} kg</td>
                    <td>{item.kapasitas_m3 ? item.kapasitas_m3.toLocaleString() : '0'} m³</td>
                    <td>
                      <span className={`badge ${item.moda === 'U' || item.moda === 'UDARA' ? 'badge-info' : 'badge-success'}`}>
                        {item.moda || 'DARAT'}
                      </span>
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
                        <button onClick={() => handleDelete(item.kendaraan_id)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '4px' }} title="Hapus">
                          <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Tidak ada data kendaraan ditemukan.
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
                {modalType === 'add' ? 'Tambah Kendaraan Baru' : modalType === 'edit' ? 'Edit Data Kendaraan' : 'Detail Kendaraan'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {modalType !== 'add' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label>ID Kendaraan</label>
                    <input 
                      type="text" 
                      name="kendaraan_id" 
                      value={formData.kendaraan_id} 
                      disabled 
                    />
                  </div>
                )}

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>No Polisi / Nopol <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                    <input 
                      type="text" 
                      name="nopol" 
                      placeholder="Contoh: B 1234 POS"
                      value={formData.nopol} 
                      onChange={handleInputChange} 
                      required 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                  <div>
                    <label>Nama Kendaraan <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                    <input 
                      type="text" 
                      name="nama_kendaraan" 
                      placeholder="Contoh: Colt Diesel Double"
                      value={formData.nama_kendaraan} 
                      onChange={handleInputChange} 
                      required 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Jenis Kendaraan</label>
                    <input 
                      type="text" 
                      name="jenis_kendaraan" 
                      placeholder="Contoh: Truk Box, Blind Van"
                      value={formData.jenis_kendaraan} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                  <div>
                    <label>Moda Transportasi</label>
                    <select 
                      name="moda" 
                      value={formData.moda} 
                      onChange={handleInputChange}
                      disabled={modalType === 'detail'}
                    >
                      <option value="DARAT">DARAT</option>
                      <option value="UDARA">UDARA</option>
                      <option value="LAUT">LAUT</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Kapasitas Berat (Kg)</label>
                    <input 
                      type="number" 
                      name="kapasitas_kg" 
                      value={formData.kapasitas_kg} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                  <div>
                    <label>Kapasitas Volume (M³)</label>
                    <input 
                      type="number" 
                      name="kapasitas_m3" 
                      step="0.01"
                      value={formData.kapasitas_m3} 
                      onChange={handleInputChange} 
                      disabled={modalType === 'detail'} 
                    />
                  </div>
                </div>

                <div className="grid-1" style={{ marginBottom: '15px' }}>
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

      {/* Operational Vehicle details modal */}
      {selectedVehicle && (
        <VehicleDetailModal 
          nopol={selectedVehicle} 
          onClose={() => setSelectedVehicle(null)} 
          onViewTransaction={(code) => navigate(`/transaksi?search=${code}`)}
        />
      )}
    </div>
  );
}

export default MasterKendaraan;
