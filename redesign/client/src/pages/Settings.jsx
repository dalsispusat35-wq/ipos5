import { useState, useEffect } from 'react';
import { Eye, EyeOff, Wifi, WifiOff, Save, RefreshCw, Shield, Bell, CheckCircle2 } from 'lucide-react';
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
        if (onConnectionSwitch) onConnectionSwitch({ name: 'Active DB', uri, color: '#16a34a' });
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
      <div className="spatial-card" style={{ padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}
          >
            <Wifi size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Database Connection</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              MongoDB connection string for IPOS5 data store (Live Sync)
            </div>
          </div>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 20,
              background: connected ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${connected ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: connected ? '#16a34a' : '#ef4444',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 800, color: connected ? '#16a34a' : '#ef4444' }}>
              {connected ? 'Connected' : testing ? 'Testing…' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 7, textTransform: 'uppercase' }}>
            Connection URI
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showUri ? 'text' : 'password'}
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 42px 0 12px',
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                fontSize: 13,
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={() => setShowUri(!showUri)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              {showUri ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
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
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>
                {f.label}
              </label>
              <input 
                defaultValue={f.value} 
                style={{ 
                  width: '100%', 
                  height: 36, 
                  padding: '0 10px', 
                  borderRadius: 6, 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  color: '#0f172a', 
                  fontSize: 12, 
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box'
                }} 
              />
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          {connected ? <Wifi size={14} color="#16a34a" /> : <WifiOff size={14} color="#ef4444" />}
          <span style={{ fontSize: 12, color: '#64748b' }}>Last tested: {lastTested}</span>
          <span style={{ fontSize: 12, color: connected ? '#16a34a' : '#ef4444', fontWeight: 700 }}>
            {connected ? '· Latency: 4ms (Optimal)' : '· Connection refused'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={handleTest} disabled={testing} style={{ minWidth: 160, justifyContent: 'center' }}>
            {testing ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Wifi size={14} />}
            {testing ? 'Testing Connection…' : 'Test Connection'}
          </button>
          <button className="btn-ghost" style={{ gap: 6 }}><Save size={14} /> Save Changes</button>
        </div>
      </div>

      {/* System Preferences */}
      <div className="spatial-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Shield size={18} color="#0284c7" />
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>System Preferences</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Branch Code', desc: 'The branch identifier for this installation', value: '40511' },
            { label: 'Branch Name', desc: 'Display name shown in reports', value: 'KPRK Cimahi' },
            { label: 'Session Timeout', desc: 'Auto-logout after inactivity (minutes)', value: '60' },
            { label: 'Default Page Size', desc: 'Records per page in data tables', value: '25' },
          ].map((f, i) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{f.desc}</div>
              </div>
              <input 
                defaultValue={f.value} 
                style={{ 
                  width: 160, 
                  height: 36, 
                  padding: '0 10px', 
                  borderRadius: 6, 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  color: '#0f172a', 
                  fontSize: 13, 
                  fontFamily: 'monospace',
                  outline: 'none'
                }} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Application Meta Info Footer */}
      <div style={{ padding: '14px 18px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {[
          { label: 'Application', value: 'IPOS5 Dashboard Enterprise' },
          { label: 'Version', value: 'v3.2.0 (Light SaaS)' },
          { label: 'Build', value: '20260821-LIVE' },
          { label: 'License', value: 'PT Pos Indonesia (Persero)' },
        ].map((f) => (
          <div key={f.label}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, fontWeight: 700 }}>{f.label}</div>
            <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, fontFamily: 'monospace' }}>{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
