import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { ShieldCheck, ShieldAlert, Package, CheckSquare, Square, Truck, Check, QrCode, ArrowRight, ClipboardList, Database, Loader2, AlertCircle } from 'lucide-react';

function GateMonitoring() {
  const [activeTab, setActiveTab] = useState('checkpoint1'); // checkpoint1, checkpoint2, checkpoint3
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Checkpoint 1 States
  const [cimahiPackages, setCimahiPackages] = useState([]);
  const [selectedConnotes, setSelectedConnotes] = useState([]);

  // Checkpoint 2 States
  const [manifestSearchCode, setManifestSearchCode] = useState('');
  const [scannedManifest, setScannedManifest] = useState(null);

  // Checkpoint 3 States
  const [destManifestSearchCode, setDestManifestSearchCode] = useState('');
  const [scannedDestManifest, setScannedDestManifest] = useState(null);
  const [destinationPackages, setDestinationPackages] = useState([]);

  // Load Initial Data
  useEffect(() => {
    if (activeTab === 'checkpoint1') {
      fetchCimahiPackages();
    } else if (activeTab === 'checkpoint3') {
      fetchDestinationPackages();
    }
    setError(null);
    setSuccess(null);
  }, [activeTab]);

  // Checkpoint 1: Fetch Cimahi Packages (DITERIMA_DI_CIMAHI and not yet in a manifest)
  const fetchCimahiPackages = async () => {
    try {
      setLoading(true);
      const res = await api.getTransactions('status=DITERIMA_DI_CIMAHI&manifest_id=null');
      if (res.success) {
        setCimahiPackages(res.data);
        setSelectedConnotes([]);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat paket dari Cimahi.');
    } finally {
      setLoading(false);
    }
  };

  // Checkpoint 3: Fetch Destination Packages (TIBA_DI_SPP_TUJUAN)
  const fetchDestinationPackages = async () => {
    try {
      setLoading(true);
      const res = await api.getTransactions('status=TIBA_DI_SPP_TUJUAN');
      if (res.success) {
        setDestinationPackages(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat paket di SPP Tujuan.');
    } finally {
      setLoading(false);
    }
  };

  // Checkpoint 1: Toggle Connote Selection
  const toggleSelectConnote = (code) => {
    if (selectedConnotes.includes(code)) {
      setSelectedConnotes(prev => prev.filter(c => c !== code));
    } else {
      setSelectedConnotes(prev => [...prev, code]);
    }
  };

  // Checkpoint 1: Select All
  const toggleSelectAll = () => {
    if (selectedConnotes.length === cimahiPackages.length) {
      setSelectedConnotes([]);
    } else {
      setSelectedConnotes(cimahiPackages.map(p => p.connote?.connote_code || p.connote_code));
    }
  };

  // Checkpoint 1: Perform Bagging
  const handleBagging = async () => {
    if (selectedConnotes.length === 0) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await api.createManifest({ connote_codes: selectedConnotes });
      if (res.success) {
        setSuccess(res.message);
        fetchCimahiPackages();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal membuat manifest baru.');
    } finally {
      setLoading(false);
    }
  };

  // Checkpoint 2: Find Manifest for Transit
  const handleSearchManifest = async (e) => {
    e.preventDefault();
    if (!manifestSearchCode.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setScannedManifest(null);
      
      const res = await api.getManifestByCode(manifestSearchCode.trim());
      if (res.success) {
        setScannedManifest(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal mencari manifest.');
    } finally {
      setLoading(false);
    }
  };

  // Checkpoint 2: Transit SPP Bandung Action
  const handleTransitAction = async () => {
    if (!scannedManifest) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await api.transitManifest({ master_manifest_code: scannedManifest.master_manifest_code });
      if (res.success) {
        setSuccess(res.message);
        setScannedManifest(null);
        setManifestSearchCode('');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memproses transit.');
    } finally {
      setLoading(false);
    }
  };

  // Checkpoint 3: Find Manifest for Arrival
  const handleSearchDestManifest = async (e) => {
    e.preventDefault();
    if (!destManifestSearchCode.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setScannedDestManifest(null);

      const res = await api.getManifestByCode(destManifestSearchCode.trim());
      if (res.success) {
        setScannedDestManifest(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal mencari manifest.');
    } finally {
      setLoading(false);
    }
  };

  // Checkpoint 3: Arrive Manifest Action
  const handleArrivalAction = async () => {
    if (!scannedDestManifest) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await api.arriveManifest({ master_manifest_code: scannedDestManifest.master_manifest_code });
      if (res.success) {
        setSuccess(res.message);
        setScannedDestManifest(null);
        setDestManifestSearchCode('');
        fetchDestinationPackages();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memproses kedatangan manifest.');
    } finally {
      setLoading(false);
    }
  };

  // Checkpoint 3: Deliver Individual Package Action
  const handleSetDelivered = async (code) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await api.updateTransactionStatus(code, 'DELIVERED');
      if (res.success) {
        setSuccess(res.message);
        fetchDestinationPackages();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal menyelesaikan pengiriman.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '5px' }}>
      {/* Subtitle */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(11, 25, 44, 0.6) 0%, rgba(30, 62, 98, 0.4) 100%)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Simulasi Gate Sorting & Transit Logistik Lapangan berdasar alur kaku: <strong>KCP Cililin → KC Cimahi → SPP Bandung → SPP Tujuan → Delivered</strong>.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="tab-menu" style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveTab('checkpoint1')}
          className={`btn ${activeTab === 'checkpoint1' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Package size={18} />
          <span>Checkpoint 1 (Cimahi Bagging)</span>
        </button>
        <button 
          onClick={() => setActiveTab('checkpoint2')}
          className={`btn ${activeTab === 'checkpoint2' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Truck size={18} />
          <span>Checkpoint 2 (Transit SPP Bandung)</span>
        </button>
        <button 
          onClick={() => setActiveTab('checkpoint3')}
          className={`btn ${activeTab === 'checkpoint3' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ShieldCheck size={18} />
          <span>Checkpoint 3 (Last-Mile SPP Tujuan)</span>
        </button>
      </div>

      {/* Status Notifications */}
      {error && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-red)', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertCircle size={24} style={{ color: 'var(--accent-red)' }} />
          <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{error}</span>
        </div>
      )}
      {success && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-green)', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Check size={24} style={{ color: 'var(--accent-green)' }} />
          <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{success}</span>
        </div>
      )}

      {/* Tab Contents */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0', gap: '10px', alignItems: 'center', color: 'var(--accent-cyan)' }}>
          <Loader2 className="animate-spin" size={24} />
          <span>Memproses data...</span>
        </div>
      )}

      {!loading && activeTab === 'checkpoint1' && (
        <div className="grid-3-1" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
          {/* Main Area */}
          <div className="glass-card">
            <h3 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Daftar Paket di KC Cimahi</span>
              {cimahiPackages.length > 0 && (
                <button onClick={toggleSelectAll} className="btn-text" style={{ fontSize: '13px', color: 'var(--accent-cyan)' }}>
                  {selectedConnotes.length === cimahiPackages.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </h3>

            {cimahiPackages.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ClipboardList size={48} style={{ margin: '0 auto 12px auto' }} />
                <p>Tidak ada paket individual berstatus "DITERIMA_DI_CIMAHI" untuk dibagging.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Connote Code</th>
                      <th>Layanan</th>
                      <th>Tujuan</th>
                      <th>Status saat ini</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cimahiPackages.map((p) => {
                      const code = p.connote?.connote_code || p.connote_code;
                      const isSelected = selectedConnotes.includes(code);
                      return (
                        <tr 
                          key={code} 
                          onClick={() => toggleSelectConnote(code)}
                          style={{ cursor: 'pointer', background: isSelected ? 'rgba(0, 210, 196, 0.05)' : 'transparent' }}
                        >
                          <td>
                            {isSelected ? (
                              <CheckSquare size={18} style={{ color: 'var(--accent-cyan)' }} />
                            ) : (
                              <Square size={18} style={{ color: 'var(--text-muted)' }} />
                            )}
                          </td>
                          <td style={{ fontWeight: 700, color: 'white' }}>{code}</td>
                          <td>
                            <span className="badge badge-info">{p.connote?.connote_service || p.connote_service}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{p.custom_field?.destination_kprk || '-'}</td>
                          <td>
                            <span className="badge badge-warning">CIMAHI Sortir</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar Action */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h3 className="card-title">Bagging & Consolidation</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Pilih paket dari tabel kiri untuk dikonsolidasikan ke dalam satu container manifest.
            </p>
            <div style={{ padding: '16px', background: 'var(--bg-navy)', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>PAKET TERPILIH</span>
              <h2 style={{ fontSize: '32px', color: 'var(--accent-cyan)', fontWeight: 800, marginTop: '4px' }}>
                {selectedConnotes.length}
              </h2>
            </div>
            <button 
              onClick={handleBagging} 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              disabled={selectedConnotes.length === 0}
            >
              <span>Buat Master Manifest</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {!loading && activeTab === 'checkpoint2' && (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="glass-card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <QrCode size={22} className="text-accent" style={{ color: 'var(--accent-cyan)' }} />
              Scan Transit Manifest (SPP Bandung)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Input Kode Manifest (misal: `MNF000001`) untuk melakukan sortir transit massal di Single Gate SPP Bandung.
            </p>
            
            <form onSubmit={handleSearchManifest} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input 
                type="text" 
                placeholder="Masukkan Master Manifest Code (Contoh: MNF000001)"
                value={manifestSearchCode}
                onChange={(e) => setManifestSearchCode(e.target.value)}
                style={{ height: '45px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ height: '45px', px: '25px' }}>
                Scan / Cari
              </button>
            </form>

            {scannedManifest && (
              <div className="animate-fade-in" style={{ padding: '20px', background: 'var(--bg-navy)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>MANIFEST CODE</span>
                    <h4 style={{ color: 'white', fontWeight: 800, fontSize: '18px', marginTop: '2px' }}>{scannedManifest.master_manifest_code}</h4>
                  </div>
                  <div>
                    <span className="badge badge-warning">{scannedManifest.status_perjalanan.toUpperCase()}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Isi Paket Connote ({scannedManifest.connote_codes?.length || 0}):</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {scannedManifest.connote_codes?.map(code => (
                      <span key={code} style={{ padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: 'white', border: '1px solid var(--border-light)' }}>
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {scannedManifest.status_perjalanan !== 'Transit' && scannedManifest.status_perjalanan !== 'Arrived' ? (
                  <button 
                    onClick={handleTransitAction}
                    className="btn btn-primary" 
                    style={{ width: '100%', background: 'var(--accent-cyan)', color: 'var(--bg-dark)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 800 }}
                  >
                    <Truck size={18} />
                    <span>Konfirmasi Transit SPP Bandung</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)', padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '13px' }}>
                    <Check size={18} />
                    <span>Manifest ini sudah diproses Transit / Arrived di SPP Bandung.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && activeTab === 'checkpoint3' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Arrival Scanner */}
          <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <QrCode size={22} className="text-accent" style={{ color: 'var(--accent-cyan)' }} />
              Scan Kedatangan Manifest di SPP Tujuan
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Input Kode Manifest (misal: `MNF000001`) yang baru sampai di SPP Tujuan (Jakarta Timur/Jogja/Semarang/Surabaya) untuk membongkar muatan secara massal.
            </p>
            
            <form onSubmit={handleSearchDestManifest} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Masukkan Master Manifest Code (Contoh: MNF000001)"
                value={destManifestSearchCode}
                onChange={(e) => setDestManifestSearchCode(e.target.value)}
                style={{ height: '45px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ height: '45px', px: '25px' }}>
                Scan Bongkar
              </button>
            </form>

            {scannedDestManifest && (
              <div className="animate-fade-in" style={{ padding: '20px', background: 'var(--bg-navy)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>MANIFEST CODE</span>
                    <h4 style={{ color: 'white', fontWeight: 800, fontSize: '18px', marginTop: '2px' }}>{scannedDestManifest.master_manifest_code}</h4>
                  </div>
                  <div>
                    <span className="badge badge-warning">{scannedDestManifest.status_perjalanan.toUpperCase()}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Isi Paket Connote ({scannedDestManifest.connote_codes?.length || 0}):</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {scannedDestManifest.connote_codes?.map(code => (
                      <span key={code} style={{ padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: 'white' }}>
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {scannedDestManifest.status_perjalanan !== 'Arrived' ? (
                  <button 
                    onClick={handleArrivalAction}
                    className="btn btn-primary" 
                    style={{ width: '100%', background: 'var(--accent-cyan)', color: 'var(--bg-dark)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 800 }}
                  >
                    <Check size={18} />
                    <span>Konfirmasi Tiba & Bongkar di SPP Tujuan</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)', padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '13px' }}>
                    <Check size={18} />
                    <span>Manifest ini sudah sukses dibongkar di SPP Tujuan.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Last-mile delivered table */}
          <div className="glass-card">
            <h3 className="card-title">
              <span>Kurir Last Mile - Paket Siap Diantar</span>
            </h3>

            {destinationPackages.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ClipboardList size={48} style={{ margin: '0 auto 12px auto' }} />
                <p>Tidak ada paket individual di SPP Tujuan yang siap diantar (berstatus "TIBA_DI_SPP_TUJUAN").</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Connote Code</th>
                      <th>Layanan</th>
                      <th>KPRK Tujuan</th>
                      <th>Status Paket</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {destinationPackages.map((p) => {
                      const code = p.connote?.connote_code || p.connote_code;
                      return (
                        <tr key={code}>
                          <td style={{ fontWeight: 700, color: 'white' }}>{code}</td>
                          <td>
                            <span className="badge badge-info">{p.connote?.connote_service || p.connote_service}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{p.custom_field?.destination_kprk || '-'}</td>
                          <td>
                            <span className="badge badge-purple">Tiba di SPP Tujuan</span>
                          </td>
                          <td>
                            <button 
                              onClick={() => handleSetDelivered(code)}
                              className="btn btn-primary"
                              style={{ padding: '4px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Check size={14} />
                              <span>Set Delivered</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GateMonitoring;
