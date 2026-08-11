import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { api, setAuthToken } from '../utils/api';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      const res = await api.login({ username, password });
      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        sessionStorage.setItem('ipos5_user', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
        navigate('/');
      } else {
        setErrorMsg(res.message || 'Login gagal.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #1c2541 0%, #0b132b 100%)',
      padding: 20,
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#fff'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: '40px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(72, 202, 228, 0.15)'
      }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #48cae4 0%, #0077b6 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(72, 202, 228, 0.3)',
            marginBottom: 16
          }}>
            <ShieldCheck size={30} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            IPOS5 Redesign
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Cimahi Origin Delivery System — Portal Logistik
          </p>
        </div>

        {/* Alert Error */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10,
            padding: '12px 14px',
            color: '#fca5a5',
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  padding: '12px 14px 12px 42px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  padding: '12px 14px 12px 42px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #48cae4 0%, #0077b6 100%)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 15px rgba(72, 202, 228, 0.3)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Memproses Login...' : 'Masuk ke Sistem'}
          </button>
        </form>

        {/* Demo Credentials Hint */}
        <div style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Sparkles size={12} color="#48cae4" /> Akun Demo Pengujian RBAC:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', fontSize: 11 }}>
            <span style={{ background: 'rgba(72,202,228,0.15)', border: '1px solid rgba(72,202,228,0.3)', padding: '3px 8px', borderRadius: 4, color: '#48cae4' }}>
              <strong>Admin:</strong> admin / admin
            </span>
            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 4 }}>
              <strong>Supervisor:</strong> sari / sari123
            </span>
            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 4 }}>
              <strong>Operator:</strong> operator / operator123
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
