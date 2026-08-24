import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, Sparkles, LogIn } from 'lucide-react';
import { api, setAuthToken } from '../utils/api';
import logoImg from '../assets/logo.png';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.login({ username: username.trim(), password: password.trim() });
      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        sessionStorage.setItem('ipos5_user', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
        navigate('/');
      } else {
        setErrorMsg(res.message || 'Username atau password tidak valid.');
      }
    } catch (err) {
      console.error('Login submit error:', err);
      // Fallback for demo mode if server endpoint errors out
      if (username.trim().toLowerCase() === 'admin' && (password.trim() === 'admin' || password.trim() === 'admin123')) {
        const demoUser = {
          username: 'admin',
          name: 'Super Administrator IT',
          role: 'SUPER_ADMIN',
          email: 'admin@posindonesia.co.id',
          nip: '994051101',
          branch: 'KCU Cimahi (40511)'
        };
        setAuthToken('demo_jwt_token_admin_2026');
        sessionStorage.setItem('ipos5_user', JSON.stringify(demoUser));
        if (onLoginSuccess) onLoginSuccess(demoUser);
        navigate('/');
        return;
      }
      setErrorMsg(err.message || 'Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      backgroundImage: 'radial-gradient(circle at 50% 15%, #e0f2fe 0%, #f8fafc 70%)',
      padding: 20,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: '#0f172a',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        padding: '40px 32px',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* Ambient Top Accent Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #0b2e8a, #0284c7, #e8431f)'
        }} />

        {/* Brand Header & Official IPOS5 Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: '#f0f9ff',
            border: '1.5px solid #bae6fd',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}>
            <img 
              src={logoImg} 
              alt="IPOS5 PT Pos Indonesia Logo" 
              style={{ width: 48, height: 48, objectFit: 'contain' }} 
            />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: '#0f172a' }}>
            IPOS5 Redesign
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 600 }}>
            PT Pos Indonesia — Portal Logistik & Telemetri Rute
          </p>
        </div>

        {/* Alert Error */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '12px 14px',
            color: '#b91c1c',
            fontSize: 13,
            marginBottom: 20
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username (misal: admin)..."
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '12px 14px 12px 42px',
                  color: '#0f172a',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password (misal: admin)..."
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '12px 14px 12px 42px',
                  color: '#0f172a',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              marginTop: 8,
              width: '100%',
              padding: '13px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: loading ? 0.7 : 1,
              minHeight: 44
            }}
          >
            <LogIn size={16} />
            {loading ? 'Memproses Login...' : 'Masuk ke Sistem'}
          </button>
        </form>

        {/* Demo Credentials Hint */}
        <div style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}>
            <Sparkles size={13} color="#0284c7" /> Kredensial Akun Pengujian:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', fontSize: 11.5 }}>
            <span style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: 6, color: '#0369a1', fontWeight: 800 }}>
              Admin: admin / admin
            </span>
            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: 6, color: '#475569', fontWeight: 600 }}>
              Supervisor: sari / sari123
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
