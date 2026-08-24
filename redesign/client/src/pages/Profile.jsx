import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, Key, Bell, Clock, Building2, Mail, Phone, 
  Award, Activity, LogOut, Edit3, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, X, Lock, Users
} from 'lucide-react';
import { api, setAuthToken } from '../utils/api.js';

export default function Profile() {
  const navigate = useNavigate();

  // Active User State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('ipos5_user');
    return saved ? JSON.parse(saved) : {
      username: 'admin',
      name: 'Super Administrator IT',
      role: 'SUPER_ADMIN',
      email: 'admin@posindonesia.co.id',
      nip: '994051101',
      branch: 'KCU Cimahi (40511)'
    };
  });

  const [activeTab, setActiveTab] = useState('overview');

  // User Management List (CRUD State)
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Toast / Feedback State
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Modal States
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const [newUserForm, setNewUserForm] = useState({
    username: '',
    name: '',
    role: 'OPERATOR',
    password: '',
    email: '',
    nip: '',
    branch: 'KCU Cimahi (40511)'
  });

  const [editUserForm, setEditUserForm] = useState({
    name: '',
    role: 'OPERATOR',
    email: '',
    nip: '',
    branch: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch all users for CRUD table
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.getUsers();
      if (res.success && res.data) {
        setUsersList(res.data);
      }
    } catch (e) {
      console.error('Fetch users error:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), 4000);
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setAuthToken('');
    sessionStorage.removeItem('ipos5_user');
    navigate('/login');
  };

  // Form States
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    nip: '',
    branch: '',
    avatar: ''
  });

  // Open Edit Profile Modal
  const handleOpenEditProfile = () => {
    setProfileForm({
      name: currentUser.name || 'Super Administrator IT',
      email: currentUser.email || 'admin@posindonesia.co.id',
      nip: currentUser.nip || '994051101',
      branch: currentUser.branch || 'KCU Cimahi (40511)',
      avatar: currentUser.avatar || ''
    });
    setIsEditProfileModalOpen(true);
  };

  // Handle Photo File Upload
  const handleAvatarFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', 'Ukuran foto maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Edit Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const updatedUser = { ...currentUser, ...profileForm };

    setCurrentUser(updatedUser);
    sessionStorage.setItem('ipos5_user', JSON.stringify(updatedUser));
    localStorage.setItem('ipos5_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('ipos5_user_updated'));
    showAlert('success', 'Profil & foto Anda berhasil diperbarui!');
    setIsEditProfileModalOpen(false);

    try {
      await api.updateUser(currentUser.username, profileForm);
      fetchUsers();
    } catch (err) {
      console.warn('API sync warning:', err.message);
    }
  };

  // Create New User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.username || !newUserForm.name || !newUserForm.password) {
      showAlert('error', 'Username, Nama, dan Password wajib diisi.');
      return;
    }

    try {
      const res = await api.createUser(newUserForm);
      if (res.success) {
        showAlert('success', `Pengguna "${newUserForm.username}" berhasil ditambahkan!`);
        setIsCreateUserModalOpen(false);
        setNewUserForm({
          username: '',
          name: '',
          role: 'OPERATOR',
          password: '',
          email: '',
          nip: '',
          branch: 'KCU Cimahi (40511)'
        });
        fetchUsers();
      }
    } catch (err) {
      showAlert('error', err.message || 'Gagal menambah pengguna.');
    }
  };

  // Open Edit Selected User Modal
  const handleOpenEditUser = (u) => {
    setUserToEdit(u);
    setEditUserForm({
      name: u.name || '',
      role: u.role || 'OPERATOR',
      email: u.email || '',
      nip: u.nip || '',
      branch: u.branch || 'KCU Cimahi (40511)'
    });
    setIsEditUserModalOpen(true);
  };

  // Save Edit Selected User
  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!userToEdit) return;

    try {
      const res = await api.updateUser(userToEdit.username, editUserForm);
      if (res.success) {
        showAlert('success', `Profil "${userToEdit.username}" berhasil diperbarui!`);
        setIsEditUserModalOpen(false);
        setUserToEdit(null);
        fetchUsers();
      }
    } catch (err) {
      showAlert('error', err.message || 'Gagal mengupdate pengguna.');
    }
  };

  // Delete User
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await api.deleteUser(userToDelete.username);
      if (res.success) {
        showAlert('success', `Pengguna "${userToDelete.username}" telah dihapus.`);
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (err) {
      showAlert('error', err.message || 'Gagal menghapus pengguna.');
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showAlert('error', 'Konfirmasi password baru tidak cocok.');
      return;
    }
    if (passwordForm.newPassword.length < 3) {
      showAlert('error', 'Password baru minimal 3 karakter.');
      return;
    }

    try {
      const res = await api.updateUserPassword(currentUser.username, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.success) {
        showAlert('success', 'Password Anda berhasil diperbarui!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      showAlert('error', err.message || 'Gagal memperbarui password.');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="badge badge-navy">SUPER ADMIN</span>;
      case 'SUPERVISOR':
        return <span className="badge badge-emerald">SUPERVISOR</span>;
      case 'DISPATCHER':
        return <span className="badge badge-blue">DISPATCHER</span>;
      default:
        return <span className="badge badge-navy">OPERATOR</span>;
    }
  };

  const filteredUsers = usersList.filter(u => {
    const term = searchFilter.toLowerCase();
    return !term || 
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      
      {/* Toast Alert Banner */}
      {alertMsg.text && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 12,
          background: alertMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${alertMsg.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          color: alertMsg.type === 'error' ? '#b91c1c' : '#16a34a',
          fontSize: 13.5,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {alertMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Profile Header Banner */}
      <div className="spatial-card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: '#0b2e8a',
              border: '3px solid #e0f2fe',
              boxShadow: '0 4px 12px rgba(11, 46, 138, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 900,
              color: '#fff',
              flexShrink: 0,
              overflow: 'hidden'
            }}
          >
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Foto Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AD'
            )}
          </div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {currentUser.name || 'Super Administrator IT'}
              </h2>
              {getRoleBadge(currentUser.role)}
              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> Aktif Sesi
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={14} color="#0284c7" /> {currentUser.branch || 'KCU Cimahi (40511)'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} color="#16a34a" /> {currentUser.email || 'admin@posindonesia.co.id'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} color="#0b2e8a" /> NIP: {currentUser.nip || '994051101'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-ghost" onClick={handleOpenEditProfile} style={{ gap: 6, minHeight: 38 }}>
              <Edit3 size={15} /> Edit Profil
            </button>
            <button 
              className="btn-primary" 
              onClick={handleLogout} 
              style={{ gap: 6, background: '#ef4444', borderColor: '#ef4444', minHeight: 38 }}
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 20, marginTop: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 2, overflowX: 'auto' }}>
          {[
            { id: 'overview', label: 'Ringkasan User', icon: <User size={15} /> },
            { id: 'users_crud', label: 'Kelola Pengguna (CRUD)', icon: <Users size={15} /> },
            { id: 'security', label: 'Keamanan & Password', icon: <Shield size={15} /> },
            { id: 'activity', label: 'Log Aktivitas', icon: <Activity size={15} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2.5px solid #0b2e8a' : '2.5px solid transparent',
                padding: '8px 4px 12px 4px',
                color: activeTab === tab.id ? '#0b2e8a' : '#64748b',
                fontWeight: activeTab === tab.id ? 800 : 500,
                fontSize: 13.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="spatial-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={17} color="var(--accent-cyan)" /> Otoritas & Detail Kantor
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Kantor Utama</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{currentUser.branch || 'KCU Cimahi 40511'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Regional Hub</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Regional III Bandung</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Akses Otoritas</span>
                {getRoleBadge(currentUser.role)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Status Operasional</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)' }}>Shift Active · Full Dispatcher</span>
              </div>
            </div>
          </div>

          <div className="spatial-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={17} color="var(--accent-emerald)" /> Pencapaian Operasional System
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="surface-soft" style={{ padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>1,482</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Manifest Diproses</div>
              </div>
              <div className="kpi-card-emerald" style={{ padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-emerald)' }}>99.9%</div>
                <div style={{ fontSize: 11, color: 'var(--accent-emerald)', marginTop: 2 }}>Akurasi Dispatch</div>
              </div>
              <div className="kpi-card-amber" style={{ padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-amber)' }}>342</div>
                <div style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 2 }}>Perjalanan Fleet</div>
              </div>
              <div className="kpi-card-cyan" style={{ padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-cyan)' }}>100%</div>
                <div style={{ fontSize: 11, color: 'var(--accent-cyan)', marginTop: 2 }}>Integritas Database</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT (CRUD) */}
      {activeTab === 'users_crud' && (
        <div className="spatial-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Manajemen Pengguna Sistem IPOS5
              </h3>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Tambah, edit profil, atur hak akses role, dan kelola daftar akun sistem.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button 
                className="btn-ghost" 
                onClick={fetchUsers} 
                disabled={loadingUsers} 
                style={{ padding: '8px 12px', minHeight: 38 }}
                title="Refresh Daftar User"
              >
                <RefreshCw size={14} className={loadingUsers ? 'spin' : ''} /> Refresh
              </button>
              <button 
                className="btn-primary" 
                onClick={() => setIsCreateUserModalOpen(true)}
                style={{ gap: 6, minHeight: 38 }}
              >
                <Plus size={16} /> Tambah Pengguna Baru
              </button>
            </div>
          </div>

          {/* Search Filter */}
          <div style={{ maxWidth: 360, width: '100%' }}>
            <input
              type="text"
              placeholder="Cari berdasarkan nama, username, atau role..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                borderRadius: 8,
                background: 'var(--bg-surface-soft)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>

          {/* Users Table */}
          <div className="table-responsive" style={{ borderRadius: 10, border: '1px solid var(--border-light)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-soft)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  <th style={{ padding: '12px 16px' }}>Pengguna</th>
                  <th style={{ padding: '12px 16px' }}>Role Otoritas</th>
                  <th style={{ padding: '12px 16px' }}>Email & NIP</th>
                  <th style={{ padding: '12px 16px' }}>Kantor Penugasan</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                      {loadingUsers ? 'Memuat daftar pengguna...' : 'Tidak ada data pengguna yang cocok.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.username} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: '#0b2e8a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 12,
                            color: '#fff'
                          }}>
                            {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{u.name || u.username}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {getRoleBadge(u.role)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <div>{u.email || `${u.username}@posindonesia.co.id`}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>NIP: {u.nip || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {u.branch || 'KCU Cimahi (40511)'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn-ghost"
                            onClick={() => handleOpenEditUser(u)}
                            style={{ padding: '6px 10px', fontSize: 11, minHeight: 32 }}
                            title="Edit User"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          {u.username !== 'admin' && (
                            <button
                              className="btn-ghost"
                              onClick={() => setUserToDelete(u)}
                              style={{ padding: '6px 10px', fontSize: 11, color: '#ef4444', minHeight: 32 }}
                              title="Hapus User"
                            >
                              <Trash2 size={13} /> Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="spatial-card" style={{ padding: 24, maxWidth: 560 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={17} color="#0284c7" /> Ubah Password Akun (@{currentUser.username})
          </h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password Saat Ini</label>
              <input 
                type="password" 
                placeholder="Masukkan password saat ini..." 
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                style={{ width: '100%', height: 38, padding: '0 12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password Baru</label>
              <input 
                type="password" 
                placeholder="Masukkan password baru..." 
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                style={{ width: '100%', height: 38, padding: '0 12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Konfirmasi Password Baru</label>
              <input 
                type="password" 
                placeholder="Ketik ulang password baru..." 
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                style={{ width: '100%', height: 38, padding: '0 12px', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 6, gap: 6 }}>
              <Key size={14} /> Perbarui Password
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL LOGS */}
      {activeTab === 'activity' && (
        <div className="spatial-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={17} color="var(--accent-cyan)" /> Audit Log Aktivitas Pengguna
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 1, action: 'User login sukses sebagai SUPER_ADMIN', time: '5 menit lalu' },
              { id: 2, action: 'Melakukan pencarian resi di Package Tracking', time: '18 menit lalu' },
              { id: 3, action: 'Menjalankan simulasi rute Milk Run', time: '42 menit lalu' },
              { id: 4, action: 'Pembaruan data master kendaraan armada B 9910 PCX', time: '2 jam lalu' }
            ].map(log => (
              <div 
                key={log.id} 
                className="surface-soft"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 16px', 
                  borderRadius: 10 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{log.action}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFIL AKUN SAAT INI */}
      {isEditProfileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-soft)' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color="var(--accent-cyan)" /> Edit Profil Saya
              </h3>
              <button className="capsule-btn-circle" onClick={() => setIsEditProfileModalOpen(false)} style={{ width: 30, height: 30 }}><X size={14} /></button>
            </div>
            <form onSubmit={handleSaveProfile} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nama Lengkap</label>
                <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required style={{ width: '100%', height: 38, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Email Pos</label>
                <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required style={{ width: '100%', height: 38, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>NIP Pegawai</label>
                <input type="text" value={profileForm.nip} onChange={(e) => setProfileForm({ ...profileForm, nip: e.target.value })} required style={{ width: '100%', height: 38, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Kantor Penugasan</label>
                <input type="text" value={profileForm.branch} onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })} required style={{ width: '100%', height: 38, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-ghost" onClick={() => setIsEditProfileModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Profil</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH PENGGUNA BARU */}
      {isCreateUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-soft)' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color="var(--accent-emerald)" /> Tambah Pengguna Sistem Baru
              </h3>
              <button className="capsule-btn-circle" onClick={() => setIsCreateUserModalOpen(false)} style={{ width: 30, height: 30 }}><X size={14} /></button>
            </div>
            <form onSubmit={handleCreateUser} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Username</label>
                  <input type="text" placeholder="misal: petrus" value={newUserForm.username} onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })} required style={{ width: '100%', height: 38, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Password Default</label>
                  <input type="password" placeholder="Password..." value={newUserForm.password} onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} required style={{ width: '100%', height: 38, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nama Lengkap</label>
                <input type="text" placeholder="misal: Petrus Kurniawan" value={newUserForm.name} onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })} required style={{ width: '100%', height: 38, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Role Otoritas</label>
                  <select value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })} style={{ width: '100%', height: 38 }}>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="DISPATCHER">DISPATCHER</option>
                    <option value="OPERATOR">OPERATOR</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>NIP Pegawai</label>
                  <input type="text" placeholder="994051199" value={newUserForm.nip} onChange={(e) => setNewUserForm({ ...newUserForm, nip: e.target.value })} style={{ width: '100%', height: 38 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Kantor Penugasan</label>
                <input type="text" placeholder="KCU Cimahi (40511)" value={newUserForm.branch} onChange={(e) => setNewUserForm({ ...newUserForm, branch: e.target.value })} style={{ width: '100%', height: 38 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-ghost" onClick={() => setIsCreateUserModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Tambah User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER DARI TABEL */}
      {isEditUserModalOpen && userToEdit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-soft)' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color="var(--accent-cyan)" /> Edit User @{userToEdit.username}
              </h3>
              <button className="capsule-btn-circle" onClick={() => setIsEditUserModalOpen(false)} style={{ width: 30, height: 30 }}><X size={14} /></button>
            </div>
            <form onSubmit={handleSaveEditUser} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nama Lengkap</label>
                <input type="text" value={editUserForm.name} onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })} required style={{ width: '100%', height: 38 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Role Otoritas</label>
                <select value={editUserForm.role} onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })} style={{ width: '100%', height: 38 }}>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="SUPERVISOR">SUPERVISOR</option>
                  <option value="DISPATCHER">DISPATCHER</option>
                  <option value="OPERATOR">OPERATOR</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Email</label>
                <input type="email" value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} style={{ width: '100%', height: 38 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Kantor Penugasan</label>
                <input type="text" value={editUserForm.branch} onChange={(e) => setEditUserForm({ ...editUserForm, branch: e.target.value })} style={{ width: '100%', height: 38 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-ghost" onClick={() => setIsEditUserModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS USER */}
      {userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440, padding: 24, textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-pink-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={24} color="var(--accent-pink)" />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>Hapus Pengguna?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
                Apakah Anda yakin ingin menghapus akun <strong style={{ color: 'var(--text-primary)' }}>@{userToDelete.username}</strong> ({userToDelete.name})? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => setUserToDelete(null)} style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
                <button className="btn-primary" onClick={handleConfirmDeleteUser} style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-pink)', borderColor: 'var(--accent-pink)' }}>Hapus User</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
