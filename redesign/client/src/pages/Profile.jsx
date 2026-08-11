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

  // Form States
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    nip: '',
    branch: ''
  });

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

  // Open Edit Profile Modal
  const handleOpenEditProfile = () => {
    setProfileForm({
      name: currentUser.name || 'Super Administrator IT',
      email: currentUser.email || 'admin@posindonesia.co.id',
      nip: currentUser.nip || '994051101',
      branch: currentUser.branch || 'KCU Cimahi (40511)'
    });
    setIsEditProfileModalOpen(true);
  };

  // Save Edit Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateUser(currentUser.username, profileForm);
      if (res.success) {
        const updatedUser = { ...currentUser, ...profileForm };
        setCurrentUser(updatedUser);
        sessionStorage.setItem('ipos5_user', JSON.stringify(updatedUser));
        showAlert('success', 'Profil Anda berhasil diperbarui!');
        setIsEditProfileModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      showAlert('error', err.message || 'Gagal mengupdate profil.');
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
        return <span className="badge badge-orange">SUPER ADMIN</span>;
      case 'SUPERVISOR':
        return <span className="badge badge-emerald">SUPERVISOR</span>;
      case 'DISPATCHER':
        return <span className="badge badge-blue">DISPATCHER</span>;
      default:
        return <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>OPERATOR</span>;
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
          background: alertMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${alertMsg.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          color: alertMsg.type === 'error' ? '#fca5a5' : '#6ee7b7',
          fontSize: 13.5,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'modalSlideUp 0.2s ease'
        }}>
          {alertMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Profile Header Banner */}
      <div 
        className="glass-card-solid"
        style={{
          padding: '24px 28px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(13,27,56,0.95), rgba(6,13,31,0.98))',
          borderRadius: 16
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,67,31,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e8431f, #2460b0)',
              border: '3px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 20px rgba(232,67,31,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 900,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
                {currentUser.name || 'Super Administrator IT'}
              </h2>
              {getRoleBadge(currentUser.role)}
              <span className="badge badge-emerald">Aktif Sesi 🟢</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={14} color="#e8431f" /> {currentUser.branch || 'KCU Cimahi (40511)'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} color="#10b981" /> {currentUser.email || 'admin@posindonesia.co.id'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} color="#3b82f6" /> NIP: {currentUser.nip || '994051101'}
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
        <div style={{ display: 'flex', gap: 20, marginTop: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 2, overflowX: 'auto' }}>
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
                borderBottom: activeTab === tab.id ? '2.5px solid #e8431f' : '2.5px solid transparent',
                padding: '8px 4px 12px 4px',
                color: activeTab === tab.id ? '#e8431f' : 'rgba(255,255,255,0.5)',
                fontWeight: activeTab === tab.id ? 700 : 500,
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
          <div className="glass-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={17} color="#e8431f" /> Otoritas & Detail Kantor
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Kantor Utama</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{currentUser.branch || 'KCU Cimahi 40511'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Regional Hub</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Regional III Bandung</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Akses Otoritas</span>
                {getRoleBadge(currentUser.role)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Status Operasional</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Shift Active · Full Dispatcher</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={17} color="#10b981" /> Pencapaian Operasional System
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>1,482</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Manifest Diproses</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>99.9%</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Akurasi Dispatch</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>342</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Perjalanan Fleet</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>100%</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Integritas Database</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT (CRUD) */}
      {activeTab === 'users_crud' && (
        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
                Manajemen Pengguna Sistem IPOS5
              </h3>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
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
              className="input-navy"
              placeholder="Cari berdasarkan nama, username, atau role..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ width: '100%', fontSize: 13 }}
            />
          </div>

          {/* Users Table */}
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
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
                    <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                      {loadingUsers ? 'Memuat daftar pengguna...' : 'Tidak ada data pengguna yang cocok.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.username} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #e8431f, #2460b0)',
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
                            <div style={{ fontWeight: 700, color: '#fff' }}>{u.name || u.username}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {getRoleBadge(u.role)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.8)' }}>
                        <div>{u.email || `${u.username}@posindonesia.co.id`}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>NIP: {u.nip || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>
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
                              style={{ padding: '6px 10px', fontSize: 11, color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)', minHeight: 32 }}
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
        <div className="glass-card" style={{ padding: 24, maxWidth: 560 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={17} color="#f59e0b" /> Ubah Password Akun (@{currentUser.username})
          </h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>Password Saat Ini</label>
              <input 
                type="password" 
                className="input-navy" 
                placeholder="Masukkan password saat ini..." 
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>Password Baru</label>
              <input 
                type="password" 
                className="input-navy" 
                placeholder="Masukkan password baru..." 
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>Konfirmasi Password Baru</label>
              <input 
                type="password" 
                className="input-navy" 
                placeholder="Ketik ulang password baru..." 
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                style={{ width: '100%' }}
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
        <div className="glass-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={17} color="#3b82f6" /> Audit Log Aktivitas Pengguna
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 1, action: 'User login sukses sebagai SUPER_ADMIN', time: '5 menit lalu' },
              { id: 2, action: 'Melakukan pencarian resi P2607150025574 di Package Tracking', time: '18 menit lalu' },
              { id: 3, action: 'Menjalankan simulasi GPS Radar Live Tracking rute Milk Run', time: '42 menit lalu' },
              { id: 4, action: 'Pembaruan data master kendaraan armada B 9910 PCX', time: '2 jam lalu' }
            ].map(log => (
              <div 
                key={log.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 16px', 
                  background: 'rgba(255,255,255,0.025)', 
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8431f' }} />
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{log.action}</span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFIL AKUN SAAT INI */}
      {isEditProfileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color="#e8431f" /> Edit Profil Saya
              </h3>
              <button className="btn-ghost" onClick={() => setIsEditProfileModalOpen(false)} style={{ padding: 4 }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveProfile} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Nama Lengkap</label>
                <input type="text" className="input-navy" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Email Pos</label>
                <input type="email" className="input-navy" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>NIP Pegawai</label>
                <input type="text" className="input-navy" value={profileForm.nip} onChange={(e) => setProfileForm({ ...profileForm, nip: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Kantor Penugasan</label>
                <input type="text" className="input-navy" value={profileForm.branch} onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })} required style={{ width: '100%' }} />
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
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color="#10b981" /> Tambah Pengguna Sistem Baru
              </h3>
              <button className="btn-ghost" onClick={() => setIsCreateUserModalOpen(false)} style={{ padding: 4 }}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateUser} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Username</label>
                  <input type="text" className="input-navy" placeholder="misal: petrus" value={newUserForm.username} onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Password Default</label>
                  <input type="password" className="input-navy" placeholder="Password..." value={newUserForm.password} onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} required style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Nama Lengkap</label>
                <input type="text" className="input-navy" placeholder="misal: Petrus Kurniawan" value={newUserForm.name} onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Role Otoritas</label>
                  <select className="input-navy" value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })} style={{ width: '100%' }}>
                    <option value="SUPER_ADMIN" style={{ background: '#0b1830' }}>SUPER_ADMIN</option>
                    <option value="SUPERVISOR" style={{ background: '#0b1830' }}>SUPERVISOR</option>
                    <option value="DISPATCHER" style={{ background: '#0b1830' }}>DISPATCHER</option>
                    <option value="OPERATOR" style={{ background: '#0b1830' }}>OPERATOR</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>NIP Pegawai</label>
                  <input type="text" className="input-navy" placeholder="994051199" value={newUserForm.nip} onChange={(e) => setNewUserForm({ ...newUserForm, nip: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Kantor Penugasan</label>
                <input type="text" className="input-navy" placeholder="KCU Cimahi (40511)" value={newUserForm.branch} onChange={(e) => setNewUserForm({ ...newUserForm, branch: e.target.value })} style={{ width: '100%' }} />
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
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color="#38bdf8" /> Edit User @{userToEdit.username}
              </h3>
              <button className="btn-ghost" onClick={() => setIsEditUserModalOpen(false)} style={{ padding: 4 }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveEditUser} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Nama Lengkap</label>
                <input type="text" className="input-navy" value={editUserForm.name} onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Role Otoritas</label>
                <select className="input-navy" value={editUserForm.role} onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })} style={{ width: '100%' }}>
                  <option value="SUPER_ADMIN" style={{ background: '#0b1830' }}>SUPER_ADMIN</option>
                  <option value="SUPERVISOR" style={{ background: '#0b1830' }}>SUPERVISOR</option>
                  <option value="DISPATCHER" style={{ background: '#0b1830' }}>DISPATCHER</option>
                  <option value="OPERATOR" style={{ background: '#0b1830' }}>OPERATOR</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Email</label>
                <input type="email" className="input-navy" value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Kantor Penugasan</label>
                <input type="text" className="input-navy" value={editUserForm.branch} onChange={(e) => setEditUserForm({ ...editUserForm, branch: e.target.value })} style={{ width: '100%' }} />
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
          <div className="modal-content" style={{ maxWidth: 440, padding: 24, textAlignment: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={24} color="#ef4444" />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#fff' }}>Hapus Pengguna?</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, textAlign: 'center' }}>
                Apakah Anda yakin ingin menghapus akun <strong style={{ color: '#fff' }}>@{userToDelete.username}</strong> ({userToDelete.name})? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => setUserToDelete(null)} style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
                <button className="btn-primary" onClick={handleConfirmDeleteUser} style={{ flex: 1, justifyContent: 'center', background: '#ef4444', borderColor: '#ef4444' }}>Hapus User</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
