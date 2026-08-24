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
    const interval = setInterval(fetchAlerts, 30000);
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
          bg: 'var(--kpi-pink-bg, #fef2f2)',
          border: '1px solid var(--kpi-pink-border, #fecaca)',
          iconColor: '#ef4444',
          Icon: AlertTriangle,
          badgeBg: '#fee2e2',
          badgeColor: '#b91c1c'
        };
      case 'WARNING':
        return {
          bg: 'var(--accent-amber-bg, #fffbeb)',
          border: '1px solid var(--kpi-pink-border, #fde68a)',
          iconColor: '#d97706',
          Icon: AlertCircle,
          badgeBg: '#fef3c7',
          badgeColor: '#92400e'
        };
      default:
        return {
          bg: 'var(--kpi-cyan-bg, #f0f9ff)',
          border: '1px solid var(--kpi-cyan-border, #bae6fd)',
          iconColor: '#0284c7',
          Icon: Info,
          badgeBg: '#e0f2fe',
          badgeColor: '#0369a1'
        };
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Pusat Notifikasi Operasional"
        className="capsule-btn-circle"
        style={{
          width: 36,
          height: 36,
          position: 'relative'
        }}
      >
        <Bell size={17} />
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
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="spatial-card"
          style={{
            position: 'absolute',
            right: 0,
            top: 46,
            width: 380,
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: 14,
            padding: 0,
            boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} color="var(--primary-blue)" />
              <span style={{ fontSize: 13, fontWeight: 800 }}>Notifikasi & Alert System</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: 10, background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: 10, fontWeight: 800 }}>
                  {unreadCount} Warning
                </span>
              )}
            </div>
            <button
              onClick={fetchAlerts}
              title="Refresh Alert"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* List of Alerts */}
          <div style={{ maxHeight: 360, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                <Check size={28} color="#16a34a" style={{ margin: '0 auto 6px', display: 'block' }} />
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
                      borderRadius: 10,
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
                          <span style={{ fontSize: 12, fontWeight: 800 }}>{alert.title}</span>
                          <button
                            onClick={(e) => handleDismiss(e, alert.id)}
                            title="Abaikan"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 6 }}>
                          {alert.message}
                        </div>
                        {alert.link && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--primary-blue)' }}>
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
              borderTop: '1px solid var(--border-light)',
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--text-muted)',
              fontWeight: 600
            }}
          >
            Monitoring Real-time IPOS5 KCU Cimahi & SPP Bandung
          </div>
        </div>
      )}
    </div>
  );
}
