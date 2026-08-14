import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, AlertCircle, Info, Check, ExternalLink, X, RefreshCw } from 'lucide-react';
import { api } from '../utils/api.js';

export default function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemAlerts();
      if (res.success && res.data) {
        setAlerts(res.data.alerts || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch system alerts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismiss = async (e, alertId) => {
    e.stopPropagation();
    try {
      await api.markAlertRead(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    if (path) navigate(path);
  };

  const getAlertStyle = (type) => {
    switch (type) {
      case 'CRITICAL':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          iconColor: '#f87171',
          Icon: AlertTriangle,
          badgeBg: 'rgba(239, 68, 68, 0.25)',
          badgeColor: '#fca5a5'
        };
      case 'WARNING':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          iconColor: '#fbbf24',
          Icon: AlertCircle,
          badgeBg: 'rgba(245, 158, 11, 0.25)',
          badgeColor: '#fde68a'
        };
      default:
        return {
          bg: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          iconColor: '#38bdf8',
          Icon: Info,
          badgeBg: 'rgba(56, 189, 248, 0.2)',
          badgeColor: '#bae6fd'
        };
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Pusat Notifikasi Operasional"
        style={{
          background: isOpen ? 'rgba(72, 202, 228, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 8,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: unreadCount > 0 ? '#48cae4' : 'rgba(255, 255, 255, 0.7)',
          position: 'relative',
          transition: 'all 0.2s'
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 46,
            width: 380,
            maxWidth: 'calc(100vw - 32px)',
            background: 'rgba(11, 19, 43, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(72, 202, 228, 0.25)',
            borderRadius: 12,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} color="#48cae4" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Notifikasi & Alert System</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: 10, background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                  {unreadCount} Warning
                </span>
              )}
            </div>
            <button
              onClick={fetchAlerts}
              title="Refresh Alert"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* List of Alerts */}
          <div style={{ maxHeight: 360, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                <Check size={28} color="rgba(72, 202, 228, 0.5)" style={{ marginBottom: 6 }} />
                <div>Semua sistem operasional normal. Tidak ada alert aktif saat ini.</div>
              </div>
            ) : (
              alerts.map((alert) => {
                const style = getAlertStyle(alert.type);
                const AlertIcon = style.Icon;

                return (
                  <div
                    key={alert.id}
                    onClick={() => handleNavigate(alert.link)}
                    style={{
                      background: style.bg,
                      border: style.border,
                      borderRadius: 8,
                      padding: 12,
                      cursor: alert.link ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <AlertIcon size={18} color={style.iconColor} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{alert.title}</span>
                          <button
                            onClick={(e) => handleDismiss(e, alert.id)}
                            title="Abaikan"
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 2 }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4, marginBottom: 6 }}>
                          {alert.message}
                        </div>
                        {alert.link && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, color: '#48cae4' }}>
                            <span>Lihat Halaman</span>
                            <ExternalLink size={10} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.2)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
              fontSize: 10.5,
              color: 'rgba(255,255,255,0.4)'
            }}
          >
            Monitoring Real-time IPOS5 KCU Cimahi & SPP Bandung
          </div>
        </div>
      )}
    </div>
  );
}
