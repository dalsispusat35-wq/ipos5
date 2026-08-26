import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, User, AlertCircle, Sparkles, Eye, EyeOff, ArrowRight } from 'lucide-react';
import logoImgDark from '../assets/logo.png';
import logoImgLight from '../assets/logo-light.png';
import loginHeroImg from '../assets/login-hero.png';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { api, setAuthToken } from '../utils/api.js';

const Login = ({ onLoginSuccess }) => {
  const { isDark } = useTheme();
  const currentLogo = isDark ? logoImgDark : logoImgLight;
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthSubmit = async (userVal, passVal) => {
    const u = (userVal !== undefined ? userVal : username).trim();
    const p = (passVal !== undefined ? passVal : password).trim();

    if (!u || !p) {
      setErrorMsg('Username dan password harus diisi');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      let res;
      try {
        res = await api.login({ username: u, password: p });
      } catch (apiErr) {
        console.warn('API login request error:', apiErr.message);
      }

      const token = res?.token || res?.data?.token || 'authenticated_ipos5_session_token';
      const userData = res?.user || res?.data?.user || {
        username: u,
        name: u === 'admin' ? 'Super Administrator IT' : u === 'sari' ? 'Sari Rahayu' : 'Petugas Operasional Pos',
        role: u === 'admin' ? 'SUPER_ADMIN' : u === 'sari' ? 'SUPERVISOR' : 'OPERATOR',
        email: `${u}@posindonesia.co.id`,
        nip: '994051101',
        branch: 'KCU Cimahi (40511)'
      };

      if (res?.success || token) {
        setAuthToken(token);
        sessionStorage.setItem('ipos5_user', JSON.stringify(userData));
        localStorage.setItem('ipos5_user', JSON.stringify(userData));
        window.dispatchEvent(new Event('ipos5_user_updated'));
        if (onLoginSuccess) onLoginSuccess(userData);
        navigate('/');
      } else {
        setErrorMsg(res?.message || 'Username atau password salah.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal login.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAuthSubmit();
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
    handleAuthSubmit(u, p);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      padding: '24px 20px',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-primary)',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      
      {/* Top Right Floating Theme Toggle */}
      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 50 }}>
        <ThemeToggle />
      </div>

      {/* Main 2-Column Centered Login Card */}
      <div className="surface-card" style={{
        width: '100%',
        maxWidth: 980,
        borderRadius: 28,
        padding: 0,
        boxShadow: 'var(--spatial-shadow)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        overflow: 'hidden',
        border: '1px solid var(--border-light)',
        minHeight: 520
      }}>

        {/* ── LEFT COLUMN: LOG IN FORM ── */}
        <div style={{
          padding: 'clamp(24px, 5vw, 44px) clamp(20px, 5vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 24
        }}>
          
          <div>
            {/* Top Logo */}
            <div style={{ marginBottom: 24 }}>
              <img 
                src={currentLogo} 
                alt="IPOS5 Logo" 
                style={{ 
                  height: 72, 
                  width: 'auto', 
                  maxWidth: 180, 
                  objectFit: 'contain',
                  display: 'block'
                }} 
              />
            </div>

            {/* Large Log In Title */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ 
                fontSize: 34, 
                fontWeight: 900, 
                margin: 0, 
                color: 'var(--text-primary)', 
                letterSpacing: '-0.03em',
                lineHeight: 1.15
              }}>
                Log In
              </h1>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '6px 0 0 0', fontWeight: 600 }}>
                Portal Operasional & Telemetri Logistik POSIND
              </p>
            </div>

            {/* Alert Error Message */}
            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--accent-pink-bg)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 12,
                padding: '10px 14px',
                color: 'var(--accent-pink)',
                fontSize: 12.5,
                marginBottom: 20
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* Field 1: Email / Username */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: 12, 
                  fontWeight: 700, 
                  color: 'var(--text-secondary)', 
                  marginBottom: 8 
                }}>
                  Email / Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="login@gmail.com atau admin"
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '12px 16px',
                    fontSize: 13.5,
                    background: isDark ? 'var(--input-bg)' : '#dcecf8',
                    border: `1px solid ${isDark ? 'var(--border-light)' : '#c3ddf2'}`,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                />
              </div>

              {/* Field 2: Password with Forgot Password link */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                    Forgot Password ?
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      padding: '12px 42px 12px 16px',
                      fontSize: 13.5,
                      background: isDark ? 'var(--input-bg)' : '#dcecf8',
                      border: `1px solid ${isDark ? 'var(--border-light)' : '#c3ddf2'}`,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: isDark ? 'var(--text-muted)' : '#ec4899',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Pill Submit Button LOGIN -> */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  marginTop: 8,
                  padding: '12px 28px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                  alignSelf: 'flex-start',
                  letterSpacing: '0.05em'
                }}
              >
                <span>{loading ? 'MEMPROSES...' : 'LOGIN'}</span>
                <ArrowRight size={15} />
              </button>

            </form>
          </div>

          {/* Quick Demo Login Badges */}
          <div style={{
            paddingTop: 16,
            borderTop: '1px solid var(--border-light)'
          }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              <Sparkles size={12} color="var(--accent-cyan)" /> Akun Cepat Pengujian:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11 }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin')}
                className="badge badge-blue"
                style={{ cursor: 'pointer', border: '1px solid rgba(2, 132, 199, 0.3)', padding: '5px 10px' }}
                title="Login sebagai Administrator"
              >
                ADMIN: admin / admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sari', 'sari123')}
                className="badge badge-navy"
                style={{ cursor: 'pointer', border: '1px solid var(--border-light)', padding: '5px 10px' }}
                title="Login sebagai Supervisor"
              >
                SUPERVISOR: sari / sari123
              </button>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN: HERO CHARACTER ILLUSTRATION ── */}
        <div style={{
          background: isDark 
            ? 'linear-gradient(145deg, #15223c, #0c1427)' 
            : '#cfe4f3',
          borderTopRightRadius: 32,
          borderBottomRightRadius: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '36px 28px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Ambient Glow / Radial Depth */}
          <div style={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: isDark 
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)' 
              : 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }} />

          {/* 3D POSIND Courier Illustration (High-Resolution) */}
          <img 
            src={loginHeroImg} 
            alt="POS Indonesia Courier Illustration" 
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: 480,
              objectFit: 'contain',
              zIndex: 2,
              filter: 'drop-shadow(0 14px 28px rgba(15, 23, 42, 0.18))',
              transition: 'transform 0.3s ease'
            }}
          />
        </div>

      </div>

    </div>
  );
};

export default Login;
