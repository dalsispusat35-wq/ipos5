import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Settings, Plus, RefreshCw, Trash2, Edit2, Play, Check, X, Server, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

function SettingsPage({ activeConnection, onConnectionSwitch, onDisconnect }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Connection form state
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    uri: '',
    database: '',
    color: '#0f2640'
  });

  // Connection test/connection action states
  const [testResult, setTestResult] = useState(null); // { success: bool, message: str }
  const [testingId, setTestingId] = useState(null);
  const [connectingId, setConnectingId] = useState(null);

  const colors = ['#0f2640', '#059669', '#4f46e5', '#d97706', '#b91c1c', '#6b7280', '#0891b2'];

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getConnections();
      if (res.success) {
        setProfiles(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat profil koneksi database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const openAddModal = () => {
    setFormData({
      name: '',
      uri: 'mongodb://admin:password@192.168.5.141:27017/?authSource=admin',
      database: 'ipos5_reporting',
      color: '#0f2640'
    });
    setCurrentProfile(null);
    setTestResult(null);
    setModalOpen(true);
  };

  const openEditModal = (profile) => {
    setFormData({ ...profile });
    setCurrentProfile(profile);
    setTestResult(null);
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (currentProfile) payload.id = currentProfile.id;

      const res = await api.saveConnection(payload);
      if (res.success) {
        setModalOpen(false);
        fetchProfiles();
      }
    } catch (err) {
      alert(`Gagal menyimpan profil: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus profil koneksi ini?')) {
      try {
        await api.deleteConnection(id);
        fetchProfiles();
      } catch (err) {
        alert(`Gagal menghapus profil: ${err.message}`);
      }
    }
  };

  const handleTestConnection = async (profile) => {
    try {
      setTestingId(profile.id);
      setTestResult(null);
      // We hit connect API just to test connection
      const res = await api.connectProfile(profile);
      if (res.success) {
        setTestResult({ success: true, message: 'Koneksi berhasil! Database terhubung.' });
      }
    } catch (err) {
      console.error(err);
      setTestResult({ success: false, message: err.message || 'Gagal terhubung.' });
    } finally {
      setTestingId(null);
    }
  };

  const handleConnect = async (profile) => {
    try {
      setConnectingId(profile.id);
      const res = await api.connectProfile(profile);
      if (res.success) {
        onConnectionSwitch(profile);
        alert(`Koneksi aktif beralih ke: ${profile.name}`);
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Apakah Anda yakin ingin memutuskan koneksi MongoDB?')) return;
    try {
      if (onDisconnect) await onDisconnect();
    } catch (err) {
      alert('Gagal disconnect: ' + err.message);
    }
  };



  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={24} style={{ color: 'var(--primary-blue)' }} /> Pengaturan Koneksi
          </h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Mengkonfigurasi server koneksi MongoDB (seperti MongoDB Compass)</span>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Tambah Profil Koneksi
        </button>
      </div>

      {error && (
        <div className="info-alert" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', marginBottom: '20px' }}>
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <RefreshCw className="animate-spin" size={28} />
        </div>
      ) : (
        <div className="grid-2">
          {/* Connection profile cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {profiles.map(p => {
              const isActive = activeConnection?.id === p.id || (activeConnection?.uri === p.uri && activeConnection?.database === p.database);
              return (
                <div 
                  key={p.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '20px', 
                    marginBottom: 0,
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent-cyan)' : 'var(--border-light)',
                    boxShadow: isActive ? 'var(--shadow-cyan)' : 'var(--shadow-sm)',
                    position: 'relative'
                  }}
                >
                  {/* Color Pill */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: p.color || 'var(--primary-blue)', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ color: 'white', fontWeight: 800, fontSize: '16px' }}>{p.name}</h4>
                        {isActive && <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 6px' }}>Aktif</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '6px', wordBreak: 'break-all' }}>
                        {p.uri.replace(/:[^:@]+@/, ':****@')}
                      </div>
                      <div style={{ fontSize: '12px', color: 'white', marginTop: '6px', fontWeight: 600 }}>
                        Database: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>{p.database}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEditModal(p)} className="btn btn-secondary" style={{ padding: '6px' }} title="Edit">
                        <Edit2 size={13} style={{ color: 'var(--accent-orange)' }} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="btn btn-secondary" style={{ padding: '6px' }} disabled={isActive} title="Hapus">
                        <Trash2 size={13} style={{ color: 'var(--accent-red)' }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingLeft: '8px' }}>
                    <button 
                      onClick={() => handleConnect(p)} 
                      disabled={isActive || connectingId === p.id}
                      className="btn btn-primary"
                      style={{ padding: '6px 16px', fontSize: '12px' }}
                    >
                      {connectingId === p.id ? 'Menghubungkan...' : isActive ? '✓ Terhubung' : 'Connect'}
                    </button>
                    {isActive && (
                      <button 
                        onClick={handleDisconnect}
                        className="btn btn-secondary"
                        style={{ padding: '6px 16px', fontSize: '12px', color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' }}
                      >
                        Disconnect
                      </button>
                    )}
                    <button 
                      onClick={() => handleTestConnection(p)}
                      disabled={testingId === p.id}
                      className="btn btn-secondary"
                      style={{ padding: '6px 16px', fontSize: '12px' }}
                    >
                      {testingId === p.id ? 'Menguji...' : 'Test Connection'}
                    </button>
                  </div>
                </div>

              );
            })}
          </div>

          {/* Guide / Status Box */}
          <div>
            <div className="glass-card" style={{ height: '100%' }}>
              <h3 className="card-title"><Server size={18} style={{ color: 'var(--accent-cyan)' }} />Status Layanan MongoDB</h3>
              
              {activeConnection ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: 'var(--accent-green)' }}>
                    <ShieldCheck size={20} />
                    <div>
                      <div style={{ fontWeight: 700 }}>Terhubung ke Database</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Koneksi client MongoDB aktif. Semua modul master siap.</div>
                    </div>
                  </div>

                  <table className="table-borderless" style={{ width: '100%', fontSize: '13px' }}>
                    <tbody>
                      <tr>
                        <td style={{ border: 'none', padding: '4px 0', fontWeight: 600 }}>Nama Profil</td>
                        <td style={{ border: 'none', padding: '4px 0', color: 'white' }}>{activeConnection.name}</td>
                      </tr>
                      <tr>
                        <td style={{ border: 'none', padding: '4px 0', fontWeight: 600 }}>URI</td>
                        <td style={{ border: 'none', padding: '4px 0', color: 'white', fontFamily: 'monospace' }}>{activeConnection.uri.split('@')[1] || activeConnection.uri}</td>
                      </tr>
                      <tr>
                        <td style={{ border: 'none', padding: '4px 0', fontWeight: 600 }}>Database Aktif</td>
                        <td style={{ border: 'none', padding: '4px 0', color: 'white', fontFamily: 'monospace' }}>{activeConnection.database}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--accent-red)' }}>
                  <ShieldAlert size={20} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Koneksi Terputus</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tidak ada koneksi MongoDB yang aktif. Modul API CRUD tidak dapat digunakan.</div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ fontWeight: 600, color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={14} style={{ color: 'var(--accent-orange)' }} /> Cara Menghubungkan MongoDB
                </div>
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.5' }}>
                  <li>Klik tombol <strong>"Tambah Profil Koneksi"</strong> di atas.</li>
                  <li>Masukkan Nama, URI lengkap koneksi (termasuk user & pass jika ada), dan nama database target.</li>
                  <li>Uji koneksi dengan tombol <strong>"Test Connection"</strong>.</li>
                  <li>Klik <strong>"Connect"</strong> pada profil yang diinginkan untuk mengaktifkannya di seluruh aplikasi.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'white', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
                {currentProfile ? 'Edit Profil Koneksi' : 'Tambah Profil Koneksi Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                
                <div style={{ marginBottom: '15px' }}>
                  <label>Nama Koneksi <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="Contoh: R (192.168.5.219)"
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label>Koneksi URI MongoDB <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                  <input 
                    type="text" 
                    name="uri" 
                    placeholder="mongodb://username:password@host:port/"
                    value={formData.uri} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>

                <div className="grid-2" style={{ marginBottom: '15px' }}>
                  <div>
                    <label>Nama Database <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                    <input 
                      type="text" 
                      name="database" 
                      placeholder="ipos5_reporting"
                      value={formData.database} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div>
                    <label>Label Warna Profil</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      {colors.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: c,
                            border: formData.color === c ? '2px solid white' : 'none',
                            cursor: 'pointer',
                            transition: 'scale 0.2s ease'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {testResult && (
                  <div 
                    style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      background: testResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid',
                      borderColor: testResult.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: testResult.success ? 'var(--accent-green)' : 'var(--accent-red)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {testResult.success ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
