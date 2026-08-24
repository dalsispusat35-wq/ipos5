import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, Key, Clock, Building2, Mail, Phone, 
  Award, Activity, LogOut, Edit3, Plus, Trash2, CheckCircle2, AlertCircle, 
  RefreshCw, X, Lock, Users, Camera, Upload, Image as ImageIcon, Eye, EyeOff, Check
} from 'lucide-react';
import { api, setAuthToken } from '../utils/api.js';

// Preset avatar options for quick selection
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
];

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Active User State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('ipos5_user') || localStorage.getItem('ipos5_user');
    return saved ? JSON.parse(saved) : {
      username: 'admin',
      name: 'Super Administrator IT',
      role: 'SUPER_ADMIN',
      email: 'admin@posindonesia.co.id',
      nip: '994051101',
      branch: 'KCU Cimahi (40511)',
      phone: '0812-3456-7890',
      avatar: ''
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
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Profile Edit Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    nip: '',
    branch: '',
    phone: '',
    avatar: ''
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
    localStorage.removeItem('ipos5_user');
    window.dispatchEvent(new Event('ipos5_user_updated'));
    navigate('/login');
  };

  // Open Edit Profile Modal
  const handleOpenEditProfile = () => {
    setProfileForm({
      name: currentUser.name || 'Super Administrator IT',
      email: currentUser.email || 'admin@posindonesia.co.id',
      nip: currentUser.nip || '994051101',
      branch: currentUser.branch || 'KCU Cimahi (40511)',
      phone: currentUser.phone || '0812-3456-7890',
      avatar: currentUser.avatar || ''
    });
    setIsEditProfileModalOpen(true);
  };

  // Handle Photo File Upload
  const handleAvatarFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showAlert('error', 'Harap pilih file gambar (JPG, PNG, atau WEBP).');
        return;
      }
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

  // Direct quick photo upload from avatar click
  const handleQuickAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', 'Ukuran foto maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result;
        const updated = { ...currentUser, avatar: newAvatar };
        setCurrentUser(updated);
        sessionStorage.setItem('ipos5_user', JSON.stringify(updated));
        localStorage.setItem('ipos5_user', JSON.stringify(updated));
        window.dispatchEvent(new Event('ipos5_user_updated'));
        showAlert('success', 'Foto profil berhasil diperbarui!');
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
          background: alertMsg.type === 'error' ? 'var(--accent-pink-bg)' : 'var(--accent-emerald-bg)',
          border: `1px solid ${alertMsg.type === 'error' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          color: alertMsg.type === 'error' ? 'var(--accent-pink)' : 'var(--accent-emerald)',
          fontSize: 13.5,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)'
        }}>
          {alertMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Hidden File Input for Direct Avatar Change */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleQuickAvatarChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {/* ── 1. MAIN PROFILE HEADER BANNER ── */}
      <div className="surface-card" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          
          {/* Avatar Container with Interactive Camera Button */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))',
                border: '3px solid var(--border-light)',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 900,
                color: '#fff',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.boxShadow = '0 6px 22px rgba(37, 99, 235, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.25)';
              }}
              title="Klik untuk mengganti foto profil"
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Foto Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'SU'
              )}
            </div>

            {/* Quick Upload Camera Badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--primary-blue)',
                border: '2px solid var(--bg-card)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Ganti Foto Profil"
            >
              <Camera size={13} />
            </button>
          </div>

          {/* User Info Texts */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                {currentUser.name || 'Super Administrator IT'}
              </h2>
              {getRoleBadge(currentUser.role)}
              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> Aktif Sesi
              </span>
            </div>
            
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={14} color="var(--accent-cyan)" /> {currentUser.branch || 'KCU Cimahi (40511)'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} color="var(--accent-emerald)" /> {currentUser.email || 'admin@posindonesia.co.id'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} color="var(--primary-blue)" /> NIP: {currentUser.nip || '994051101'}
              </span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={handleOpenEditProfile} style={{ gap: 6, minHeight: 40, padding: '0 16px', fontWeight: 700 }}>
              <Edit3 size={15} /> Edit Profil
            </button>
            <button 
              className="btn-primary" 
              onClick={handleLogout} 
              style={{ gap: 6, background: 'var(--accent-pink)', borderColor: 'var(--accent-pink)', minHeight: 40, padding: '0 16px' }}
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 20, marginTop: 28, borderBottom: '1px solid var(--border-light)', paddingBottom: 2, overflowX: 'auto' }}>
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
                borderBottom: activeTab === tab.id ? '2.5px solid var(--primary-blue)' : '2.5px solid transparent',
                padding: '8px 4px 12px 4px',
                color: activeTab === tab.id ? 'var(--primary-blue)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 800 : 600,
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

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          
          {/* Card 1: Authority & Office Detail */}
          <div className="surface-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} color="var(--accent-cyan)" /> Otoritas & Detail Kantor
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Kantor Utama</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{currentUser.branch || 'KCU Cimahi (40511)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Regional Hub</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Regional III Bandung</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Akses Otoritas</span>
                {getRoleBadge(currentUser.role)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Status Operasional</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-emerald)' }}>Shift Active · Full Dispatcher</span>
              </div>
            </div>
          </div>

          {/* Card 2: System Operational Achievements */}
          <div className="surface-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} color="var(--accent-emerald)" /> Pencapaian Operasional System
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="surface-soft" style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>1,482</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>Manifest Diproses</div>
              </div>
              <div className="kpi-card-emerald" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-emerald)' }}>99.9%</div>
                <div style={{ fontSize: 11.5, color: 'var(--accent-emerald)', marginTop: 4, fontWeight: 600 }}>Akurasi Dispatch</div>
              </div>
              <div className="kpi-card-amber" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-amber)' }}>342</div>
                <div style={{ fontSize: 11.5, color: 'var(--accent-amber)', marginTop: 4, fontWeight: 600 }}>Perjalanan Fleet</div>
              </div>
              <div className="kpi-card-cyan" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-cyan)' }}>100%</div>
                <div style={{ fontSize: 11.5, color: 'var(--accent-cyan)', marginTop: 4, fontWeight: 600 }}>Integritas Database</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: USER MANAGEMENT (CRUD) ── */}
      {activeTab === 'users_crud' && (
        <div className="surface-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Manajemen Pengguna Sistem IPOS5
              </h3>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>
                Tambah, edit profil, atur hak akses role, dan kelola daftar akun sistem secara terpusat.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                className="btn-ghost" 
                onClick={fetchUsers} 
                disabled={loadingUsers} 
                style={{ padding: '8px 14px', minHeight: 38, fontWeight: 700 }}
                title="Refresh Daftar User"
              >
                <RefreshCw size={14} className={loadingUsers ? 'spin' : ''} /> Refresh
              </button>
              <button 
                className="btn-primary" 
                onClick={() => setIsCreateUserModalOpen(true)}
                style={{ gap: 6, minHeight: 38, padding: '0 16px' }}
              >
                <Plus size={16} /> Tambah Pengguna Baru
              </button>
            </div>
          </div>

          {/* Search Filter */}
          <div style={{ maxWidth: 380, width: '100%' }}>
            <input
              type="text"
              placeholder="Cari berdasarkan nama, username, atau role..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 14px',
                borderRadius: 10,
                background: 'var(--bg-surface-soft)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Users Table */}
          <div className="table-responsive" style={{ borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-soft)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  <th style={{ padding: '12px 18px' }}>Pengguna</th>
                  <th style={{ padding: '12px 18px' }}>Role Otoritas</th>
                  <th style={{ padding: '12px 18px' }}>Email & NIP</th>
                  <th style={{ padding: '12px 18px' }}>Kantor Penugasan</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>
                      {loadingUsers ? 'Memuat daftar pengguna...' : 'Tidak ada data pengguna yang cocok.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.username} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 12.5,
                            color: '#fff',
                            flexShrink: 0
                          }}>
                            {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{u.name || u.username}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {getRoleBadge(u.role)}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.email || `${u.username}@posindonesia.co.id`}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NIP: {u.nip || '-'}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {u.branch || 'KCU Cimahi (40511)'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="btn-ghost"
                            onClick={() => handleOpenEditUser(u)}
                            style={{ padding: '6px 12px', fontSize: 11.5, minHeight: 32, fontWeight: 700 }}
                            title="Edit User"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          {u.username !== 'admin' && (
                            <button
                              className="btn-ghost"
                              onClick={() => setUserToDelete(u)}
                              style={{ padding: '6px 12px', fontSize: 11.5, color: 'var(--accent-pink)', minHeight: 32, fontWeight: 700 }}
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

      {/* ── TAB 3: SECURITY & PASSWORD ── */}
      {activeTab === 'security' && (
        <div className="surface-card" style={{ padding: 28, maxWidth: 580 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={18} color="var(--primary-blue)" /> Ubah Password Akun (@{currentUser.username})
          </h3>
          
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Current Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Password Saat Ini
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showCurrentPass ? 'text' : 'password'} 
                  placeholder="Masukkan password saat ini..." 
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  style={{ width: '100%', height: 40, padding: '0 40px 0 14px', boxSizing: 'border-box', borderRadius: 10 }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Password Baru
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showNewPass ? 'text' : 'password'} 
                  placeholder="Masukkan password baru..." 
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  style={{ width: '100%', height: 40, padding: '0 40px 0 14px', boxSizing: 'border-box', borderRadius: 10 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Konfirmasi Password Baru
              </label>
              <input 
                type="password" 
                placeholder="Ketik ulang password baru..." 
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                style={{ width: '100%', height: 40, padding: '0 14px', boxSizing: 'border-box', borderRadius: 10 }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8, gap: 8, padding: '10px 20px' }}>
              <Key size={15} /> Perbarui Password
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 4: AUDIT TRAIL LOGS ── */}
      {activeTab === 'activity' && (
        <div className="surface-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="var(--accent-cyan)" /> Audit Log Aktivitas Pengguna
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 1, action: 'User login sukses sebagai SUPER_ADMIN', time: '5 menit lalu', tag: 'AUTH' },
              { id: 2, action: 'Melakukan pencarian resi di Live Telemetry Connotes', time: '18 menit lalu', tag: 'SEARCH' },
              { id: 3, action: 'Menjalankan simulasi rute armada B 9910 PCX', time: '42 menit lalu', tag: 'DISPATCH' },
              { id: 4, action: 'Pembaruan data master kendaraan armada Feeder', time: '2 jam lalu', tag: 'UPDATE' },
              { id: 5, action: 'Sinkronisasi database MongoDB IPOS5 Reporting', time: '5 jam lalu', tag: 'SYNC' }
            ].map(log => (
              <div 
                key={log.id} 
                className="surface-soft"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px 18px', 
                  borderRadius: 12,
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="badge badge-navy" style={{ fontSize: 9.5 }}>{log.tag}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{log.action}</span>
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT PROFIL AKUN & EDIT FOTO PROFIL ── */}
      {isEditProfileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-soft)' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color="var(--primary-blue)" /> Edit Profil & Foto Akun
              </h3>
              <button className="capsule-btn-circle" onClick={() => setIsEditProfileModalOpen(false)} style={{ width: 32, height: 32 }}><X size={15} /></button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* ── PHOTO UPLOAD & PRESET SECTION ── */}
              <div style={{
                padding: '16px',
                borderRadius: 14,
                background: 'var(--bg-surface-soft)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                flexWrap: 'wrap'
              }}>
                {/* Photo Preview Circle */}
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))',
                  border: '2px solid var(--primary-blue)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#fff',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {profileForm.avatar ? (
                    <img src={profileForm.avatar} alt="Preview Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profileForm.name ? profileForm.name.slice(0, 2).toUpperCase() : 'SU'
                  )}
                </div>

                {/* Upload Buttons */}
                <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Foto Profil Anda
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Mendukung format JPG, PNG, WEBP (Maksimal 5MB)
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <label 
                      className="btn-primary" 
                      style={{ 
                        padding: '6px 14px', 
                        fontSize: 12, 
                        cursor: 'pointer', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        fontWeight: 700 
                      }}
                    >
                      <Upload size={13} /> Upload Foto
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarFileUpload} 
                        style={{ display: 'none' }} 
                      />
                    </label>

                    {profileForm.avatar && (
                      <button
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, avatar: '' })}
                        className="btn-ghost"
                        style={{ padding: '6px 12px', fontSize: 12, color: 'var(--accent-pink)' }}
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Form Inputs */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Nama Lengkap
                </label>
                <input 
                  type="text" 
                  value={profileForm.name} 
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} 
                  required 
                  style={{ width: '100%', height: 40, boxSizing: 'border-box', borderRadius: 10 }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Email POSIND
                  </label>
                  <input 
                    type="email" 
                    value={profileForm.email} 
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} 
                    required 
                    style={{ width: '100%', height: 40, boxSizing: 'border-box', borderRadius: 10 }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    NIP Pegawai
                  </label>
                  <input 
                    type="text" 
                    value={profileForm.nip} 
                    onChange={(e) => setProfileForm({ ...profileForm, nip: e.target.value })} 
                    required 
                    style={{ width: '100%', height: 40, boxSizing: 'border-box', borderRadius: 10 }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Kantor Penugasan
                </label>
                <input 
                  type="text" 
                  value={profileForm.branch} 
                  onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })} 
                  required 
                  style={{ width: '100%', height: 40, boxSizing: 'border-box', borderRadius: 10 }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-ghost" onClick={() => setIsEditProfileModalOpen(false)} style={{ padding: '10px 18px', fontWeight: 700 }}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 22px', fontWeight: 800 }}>
                  Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: TAMBAH PENGGUNA BARU ── */}
      {isCreateUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-soft)' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color="var(--accent-emerald)" /> Tambah Pengguna Sistem Baru
              </h3>
              <button className="capsule-btn-circle" onClick={() => setIsCreateUserModalOpen(false)} style={{ width: 32, height: 32 }}><X size={15} /></button>
            </div>
            <form onSubmit={handleCreateUser} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Username</label>
                  <input type="text" placeholder="misal: petrus" value={newUserForm.username} onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })} required style={{ width: '100%', height: 40, boxSizing: 'border-box', borderRadius: 10 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password Default</label>
                  <input type="password" placeholder="Password..." value={newUserForm.password} onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} required style={{ width: '100%', height: 40, boxSizing: 'border-box', borderRadius: 10 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nama Lengkap</label>
                <input type="text" placeholder="misal: Petrus Kurniawan" value={newUserForm.name} onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })} required style={{ width: '100%', height: 40, boxSizing: 'border-box', borderRadius: 10 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Role Otoritas</label>
                  <select value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })} style={{ width: '100%', height: 40, borderRadius: 10 }}>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="DISPATCHER">DISPATCHER</option>
                    <option value="OPERATOR">OPERATOR</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>NIP Pegawai</label>
                  <input type="text" placeholder="994051199" value={newUserForm.nip} onChange={(e) => setNewUserForm({ ...newUserForm, nip: e.target.value })} style={{ width: '100%', height: 40, borderRadius: 10 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Kantor Penugasan</label>
                <input type="text" placeholder="KCU Cimahi (40511)" value={newUserForm.branch} onChange={(e) => setNewUserForm({ ...newUserForm, branch: e.target.value })} style={{ width: '100%', height: 40, boxSizing: 'border-box', borderRadius: 10 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-ghost" onClick={() => setIsCreateUserModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Tambah User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT USER DARI TABEL ── */}
      {isEditUserModalOpen && userToEdit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-soft)' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color="var(--primary-blue)" /> Edit User @{userToEdit.username}
              </h3>
              <button className="capsule-btn-circle" onClick={() => setIsEditUserModalOpen(false)} style={{ width: 32, height: 32 }}><X size={15} /></button>
            </div>
            <form onSubmit={handleSaveEditUser} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nama Lengkap</label>
                <input type="text" value={editUserForm.name} onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })} required style={{ width: '100%', height: 40, borderRadius: 10 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Role Otoritas</label>
                <select value={editUserForm.role} onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })} style={{ width: '100%', height: 40, borderRadius: 10 }}>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="SUPERVISOR">SUPERVISOR</option>
                  <option value="DISPATCHER">DISPATCHER</option>
                  <option value="OPERATOR">OPERATOR</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
                <input type="email" value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} style={{ width: '100%', height: 40, borderRadius: 10 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Kantor Penugasan</label>
                <input type="text" value={editUserForm.branch} onChange={(e) => setEditUserForm({ ...editUserForm, branch: e.target.value })} style={{ width: '100%', height: 40, borderRadius: 10 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-ghost" onClick={() => setIsEditUserModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: KONFIRMASI HAPUS USER ── */}
      {userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440, padding: 24, textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-pink-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={26} color="var(--accent-pink)" />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 800 }}>Hapus Pengguna?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus akun <strong style={{ color: 'var(--text-primary)' }}>@{userToDelete.username}</strong> ({userToDelete.name})? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 14 }}>
                <button className="btn-ghost" onClick={() => setUserToDelete(null)} style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Batal</button>
                <button className="btn-primary" onClick={handleConfirmDeleteUser} style={{ flex: 1, justifyContent: 'center', padding: '10px', background: 'var(--accent-pink)', borderColor: 'var(--accent-pink)' }}>Hapus User</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
