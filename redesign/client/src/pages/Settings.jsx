import { useState, useEffect } from 'react';
import { Eye, EyeOff, Wifi, WifiOff, Save, RefreshCw, Shield, Bell } from 'lucide-react';
import { api } from '../utils/api.js';

export default function SettingsPage({ activeConnection, onConnectionSwitch, onDisconnect }) {
  const [uri, setUri] = useState('mongodb://127.0.0.1:27017/ipos5_reporting');
  const [showUri, setShowUri] = useState(false);
  const [connected, setConnected] = useState(true);
  const [testing, setTesting] = useState(false);
  const [lastTested, setLastTested] = useState('24 Jul 2026, 07:05 WIB');

  useEffect(() => {
    if (activeConnection) {
      setConnected(true);
      if (activeConnection.uri) setUri(activeConnection.uri);
    }
  }, [activeConnection]);

  const handleTest = async () => {
    setTesting(true);
    setConnected(false);
    try {
      const res = await api.testDbConnection({ uri });
      if (res.success && res.connected) {
        setConnected(true);
        if (onConnectionSwitch) onConnectionSwitch({ name: 'Active DB', uri, color: 'var(--accent-green)' });
      } else {
        setConnected(false);
      }
    } catch (e) {
      console.error('Error testing connection:', e);
      setConnected(false);
    } finally {
      setTesting(false);
      setLastTested(new Date().toLocaleString('id-ID') + ' WIB');
    }
  };

  return (
    <div style={{ maxWidth: 840, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Database Connection Settings Card */}
      <div className="gradient-border-card" style={{ padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'rgba(232,67,31,0.12)',
              border: '1px solid rgba(232,67,31,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e8431f',
            }}
          >
            <Wifi size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Database Connection</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              MongoDB connection string for IPOS5 data store
            </div>
          </div>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              background: connected ? 'rgba(16,185,129,0.08)' : 'rgba(232,67,31,0.08)',
              border: `1px solid ${connected ? 'rgba(16,185,129,0.2)' : 'rgba(232,67,31,0.2)'}`,
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: connected ? '#10b981' : '#e8431f',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: connected ? '#10b981' : '#e8431f' }}>
              {connected ? 'Connected' : testing ? 'Testing…' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginBottom: 7, textTransform: 'uppercase' }}>
            Connection URI
          </label>
          <div style={{ position: 'relative' }}>
            <input
              className="input-navy font-mono"
              type={showUri ? 'text' : 'password'}
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              style={{ paddingRight: 42, fontSize: 13 }}
            />
            <button
              onClick={() => setShowUri(!showUri)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
            >
              {showUri ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            Format: mongodb://[username:password@]host[:port]/database[?options]
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Host', value: '127.0.0.1' },
            { label: 'Port', value: '27017' },
            { label: 'Database', value: 'ipos5_reporting' },
            { label: 'Auth Source', value: 'admin' },
            { label: 'Username', value: 'ipos_user' },
            { label: 'Pool Size', value: '10' },
          ].map((f) => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>
                {f.label}
              </label>
              <input className="input-navy font-mono" defaultValue={f.value} style={{ fontSize: 12 }} />
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          {connected ? <Wifi size={13} color="#10b981" /> : <WifiOff size={13} color="#e8431f" />}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Last tested: {lastTested}</span>
          <span style={{ fontSize: 12, color: connected ? '#10b981' : '#e8431f', fontWeight: 600 }}>
            {connected ? '· Latency: 4ms' : '· Connection refused'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={handleTest} disabled={testing} style={{ minWidth: 160, justifyContent: 'center' }}>
            {testing ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Wifi size={14} />}
            {testing ? 'Testing Connection…' : 'Test Connection'}
          </button>
          <button className="btn-ghost"><Save size={14} /> Save Changes</button>
        </div>
      </div>

      {/* System Preferences */}
      <div className="glass-card-solid" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Shield size={16} color="rgba(255,255,255,0.5)" />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>System Preferences</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Branch Code', desc: 'The branch identifier for this installation', value: '40511' },
            { label: 'Branch Name', desc: 'Display name shown in reports', value: 'KPRK Cimahi' },
            { label: 'Session Timeout', desc: 'Auto-logout after inactivity (minutes)', value: '60' },
            { label: 'Default Page Size', desc: 'Records per page in data tables', value: '25' },
          ].map((f, i) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{f.desc}</div>
              </div>
              <input className="input-navy font-mono" defaultValue={f.value} style={{ width: 160, fontSize: 13 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Application Meta Info Footer */}
      <div style={{ padding: '14px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {[
          { label: 'Application', value: 'IPOS5' },
          { label: 'Version', value: 'v3.0.0' },
          { label: 'Build', value: '20260724-001' },
          { label: 'License', value: 'PT Pos Indonesia Internal' },
        ].map((f) => (
          <div key={f.label}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{f.label}</div>
            <div className="font-mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
