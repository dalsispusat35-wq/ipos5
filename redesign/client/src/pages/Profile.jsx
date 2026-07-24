import { useState } from 'react';
import { 
  User, Shield, Key, Bell, Clock, Building2, Mail, Phone, MapPin, 
  CheckCircle2, Award, Activity, LogOut, ChevronRight, Edit3
} from 'lucide-react';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState({
    manifestCreated: true,
    vehicleDeparted: true,
    packageArrived: true,
    systemAlerts: true,
    dailySummary: false,
  });

  const activityLogs = [
    { id: 1, action: 'Created Manifest MNFST-240724-015', time: '10 mins ago', type: 'manifest' },
    { id: 2, action: 'Updated Vehicle status D 9021 AB to Operational', time: '45 mins ago', type: 'fleet' },
    { id: 3, action: 'Processed Inbound Transit for SPP Bandung 40000', time: '2 hours ago', type: 'gate' },
    { id: 4, action: 'Added new KCP route checkpoint (Cililin)', time: '5 hours ago', type: 'route' },
    { id: 5, action: 'Generated Monthly Transport Schedule for Aug 2026', time: 'Yesterday at 16:40', type: 'schedule' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Profile Header Banner */}
      <div 
        className="glass-card-solid"
        style={{
          padding: '24px 28px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(13,27,56,0.95), rgba(6,13,31,0.95))',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,67,31,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e8431f, #1a4080)',
              border: '3px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 20px rgba(232,67,31,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 800,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            SR
          </div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Sari Rahayu</h2>
              <span className="badge badge-orange">Master Dispatcher</span>
              <span className="badge badge-emerald">Active Duty</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={14} color="#e8431f" /> KCU Cimahi (40511)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} color="#10b981" /> sari.rahayu@posindonesia.co.id</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} color="#3b82f6" /> NIP: 994051188</span>
            </div>
          </div>

          <button className="btn-ghost" style={{ gap: 8 }}>
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 20, marginTop: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 2 }}>
          {[
            { id: 'overview', label: 'User Overview', icon: <User size={15} /> },
            { id: 'activity', label: 'Activity Logs', icon: <Activity size={15} /> },
            { id: 'security', label: 'Security & Auth', icon: <Shield size={15} /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #e8431f' : '2px solid transparent',
                padding: '8px 4px 12px 4px',
                color: activeTab === tab.id ? '#e8431f' : 'rgba(255,255,255,0.5)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Work Assignment Card */}
          <div className="glass-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={16} color="#e8431f" /> Station & Authority Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Assigned Branch</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>KCU Cimahi 40511</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Regional Hub</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Regional III Bandung</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Gate Access Level</span>
                <span className="badge badge-emerald">Level 4 - Full Dispatch</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Shift Schedule</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Morning Shift (07:00 - 15:00 WIB)</span>
              </div>
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="glass-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={16} color="#10b981" /> Dispatch Achievements
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>1,482</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Manifests Processed</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>99.9%</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Gate Accuracy Rate</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>342</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Vehicles Dispatched</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#e8431f' }}>0</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Data Discrepancies</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="glass-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="#3b82f6" /> Recent Operator Audit Trail
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activityLogs.map(log => (
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

      {activeTab === 'security' && (
        <div className="glass-card" style={{ padding: 22, maxWidth: 600 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={16} color="#f59e0b" /> Security & Password
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Current Password</label>
              <input type="password" className="input-navy" placeholder="••••••••••••" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>New Password</label>
              <input type="password" className="input-navy" placeholder="Enter new strong password" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Confirm New Password</label>
              <input type="password" className="input-navy" placeholder="Re-enter new password" />
            </div>
            <button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              Update Password
            </button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="glass-card" style={{ padding: 22, maxWidth: 640 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={16} color="#10b981" /> System Alert Preferences
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(notifications).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    Receive real-time push alerts on operational changes.
                  </div>
                </div>
                <div 
                  className="toggle-track"
                  style={{ background: val ? '#e8431f' : 'rgba(255,255,255,0.1)' }}
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                >
                  <div className="toggle-thumb" style={{ left: val ? 20 : 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
