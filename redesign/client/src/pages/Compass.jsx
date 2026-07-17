import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Database, FolderOpen, Play, Search, Plus, Trash2, Edit2, Check, RefreshCw, X, ChevronLeft, ChevronRight, Key, Code, Layers, FileCode, Activity } from 'lucide-react';

function Compass({ activeConnection }) {
  const [databases, setDatabases] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [activeCollection, setActiveCollection] = useState('');
  const [activeTab, setActiveTab] = useState('documents'); // 'documents', 'indexes'
  
  // Query Bar States
  const [filterStr, setFilterStr] = useState('{}');
  const [projectStr, setProjectStr] = useState('{}');
  const [sortStr, setSortStr] = useState('{}');
  
  // Documents States
  const [documents, setDocuments] = useState([]);
  const [indexes, setIndexes] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [error, setError] = useState(null);

  // Document Editor Modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('insert'); // 'insert', 'edit'
  const [editorJson, setEditorJson] = useState('{\n  \n}');
  const [editingId, setEditingId] = useState(null);

  const fetchDatabases = async () => {
    try {
      setLoadingSchema(true);
      setError(null);
      const res = await api.getDatabases();
      if (res.success) {
        setDatabases(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar database. Pastikan koneksi server aktif.');
    } finally {
      setLoadingSchema(false);
    }
  };

  const fetchCollections = async (db = '') => {
    try {
      setError(null);
      const res = await api.getCollections(db);
      if (res.success) {
        setCollections(res.data);
        setActiveCollection(''); // reset collection on db switch
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar koleksi database.');
    }
  };

  useEffect(() => {
    if (activeConnection) {
      fetchDatabases();
      const dbName = activeConnection.database || '';
      setSelectedDb(dbName);
      fetchCollections(dbName);
    }
  }, [activeConnection]);

  // When user clicks a different database, reload collections
  useEffect(() => {
    if (selectedDb) {
      fetchCollections(selectedDb);
    }
  }, [selectedDb]);

  // Load documents for active collection
  const loadDocuments = async () => {
    if (!activeCollection) return;
    try {
      setLoadingDocs(true);
      setError(null);
      
      let params = `limit=${limit}&skip=${skip}`;
      if (filterStr && filterStr !== '{}') params += `&filter=${encodeURIComponent(filterStr.trim())}`;
      if (projectStr && projectStr !== '{}') params += `&projection=${encodeURIComponent(projectStr.trim())}`;
      if (sortStr && sortStr !== '{}') params += `&sort=${encodeURIComponent(sortStr.trim())}`;

      const res = await api.getDocuments(activeCollection, params);
      if (res.success) {
        setDocuments(res.data);
        setTotalDocs(res.total);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memuat dokumen dari koleksi.');
    } finally {
      setLoadingDocs(false);
    }
  };

  // Load indexes for active collection
  const loadIndexes = async () => {
    if (!activeCollection) return;
    try {
      const res = await api.getIndexes(activeCollection);
      if (res.success) {
        setIndexes(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeCollection) {
      setSkip(0);
      loadDocuments();
      loadIndexes();
    } else {
      setDocuments([]);
      setIndexes([]);
      setTotalDocs(0);
    }
  }, [activeCollection]);

  // Reload when page changes
  useEffect(() => {
    if (activeCollection) {
      loadDocuments();
    }
  }, [skip]);

  const handleQueryFind = (e) => {
    e.preventDefault();
    setSkip(0);
    loadDocuments();
  };

  const handleQueryReset = () => {
    setFilterStr('{}');
    setProjectStr('{}');
    setSortStr('{}');
    setSkip(0);
    setTimeout(() => loadDocuments(), 50);
  };

  const openInsertModal = () => {
    setEditorMode('insert');
    setEditorJson(JSON.stringify({
      
    }, null, 2));
    setEditingId(null);
    setEditorOpen(true);
  };

  const openEditModal = (doc) => {
    setEditorMode('edit');
    const editable = { ...doc };
    setEditingId(doc._id);
    setEditorJson(JSON.stringify(editable, null, 2));
    setEditorOpen(true);
  };

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    try {
      let parsedDoc;
      try {
        parsedDoc = JSON.parse(editorJson);
      } catch (err) {
        alert(`JSON tidak valid: ${err.message}`);
        return;
      }

      if (editorMode === 'insert') {
        await api.insertDocument(activeCollection, parsedDoc);
      } else {
        await api.updateDocument(activeCollection, editingId, parsedDoc);
      }

      setEditorOpen(false);
      loadDocuments();
    } catch (err) {
      alert(`Gagal menyimpan dokumen: ${err.message}`);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus dokumen ini secara permanen?')) {
      try {
        await api.deleteDocument(activeCollection, id);
        loadDocuments();
      } catch (err) {
        alert(`Gagal menghapus dokumen: ${err.message}`);
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
      
      {error && !loadingDocs && (
        <div className="info-alert" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', marginBottom: '15px' }}>
          <div>⚠️ {error}</div>
        </div>
      )}

      <div className="compass-grid" style={{ height: '100%' }}>
        
        {/* Left Side: Databases & Collections list */}
        <div className="compass-sidebar">
          <div className="compass-sidebar-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} /> Databases & Collections
            </span>
            <button onClick={fetchDatabases} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}>
              <RefreshCw size={14} />
            </button>
          </div>
          
          <div className="compass-db-list">
            {loadingSchema ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Activity className="animate-spin" size={20} />
              </div>
            ) : databases.length > 0 ? (
              databases.map(db => (
                <div key={db.name} className="compass-db-group" style={{ display: 'block', marginBottom: '2px' }}>
                  <div 
                    className={`compass-db-item ${selectedDb === db.name ? 'active' : ''}`}
                    onClick={() => setSelectedDb(selectedDb === db.name ? null : db.name)}
                  >
                    <FolderOpen size={14} style={{ color: 'var(--accent-orange)' }} />
                    <span style={{ fontWeight: selectedDb === db.name ? 700 : 500 }}>{db.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{(db.sizeOnDisk / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  
                  {/* Collections list for selected Database */}
                  {selectedDb === db.name && (
                    <div className="compass-col-list animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '2px 0 6px 0' }}>
                      {collections.map(col => (
                        <div 
                          key={col.name} 
                          className={`compass-collection-item ${activeCollection === col.name ? 'active' : ''}`}
                          onClick={() => setActiveCollection(col.name)}
                        >
                          <FileCode size={12} />
                          <span>{col.name}</span>
                        </div>
                      ))}
                      {collections.length === 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '4px 10px 4px 28px' }}>
                          Tidak ada koleksi
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Tidak ada koneksi aktif. Silakan masuk ke Pengaturan.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Main Work Area */}
        <div className="compass-main">
          {activeCollection ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Tab Header */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button 
                  onClick={() => setActiveTab('documents')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: activeTab === 'documents' ? 'var(--light-navy)' : 'transparent',
                    color: activeTab === 'documents' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  <Code size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Documents
                </button>
                <button 
                  onClick={() => setActiveTab('indexes')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: activeTab === 'indexes' ? 'var(--light-navy)' : 'transparent',
                    color: activeTab === 'indexes' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  <Key size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Indexes
                </button>
              </div>

              {activeTab === 'documents' ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  {/* Query Filter Bar */}
                  <div className="compass-query-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      <Search size={14} /> FILTER QUERY COMPASS
                    </div>
                    
                    <div className="compass-query-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ fontSize: '10px', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Filter (JSON)</label>
                        <input 
                          type="text" 
                          placeholder="{}" 
                          value={filterStr} 
                          onChange={(e) => setFilterStr(e.target.value)}
                          style={{ fontFamily: 'monospace', fontSize: '12px', padding: '8px 12px' }}
                        />
                      </div>
                      <div style={{ width: '180px', minWidth: '140px' }}>
                        <label style={{ fontSize: '10px', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Project (JSON)</label>
                        <input 
                          type="text" 
                          placeholder="{}" 
                          value={projectStr} 
                          onChange={(e) => setProjectStr(e.target.value)}
                          style={{ fontFamily: 'monospace', fontSize: '12px', padding: '8px 12px' }}
                        />
                      </div>
                      <div style={{ width: '180px', minWidth: '140px' }}>
                        <label style={{ fontSize: '10px', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Sort (JSON)</label>
                        <input 
                          type="text" 
                          placeholder="{}" 
                          value={sortStr} 
                          onChange={(e) => setSortStr(e.target.value)}
                          style={{ fontFamily: 'monospace', fontSize: '12px', padding: '8px 12px' }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button onClick={handleQueryFind} className="btn btn-primary" style={{ padding: '8px 16px', height: '38px', display: 'flex', alignItems: 'center' }}>
                          Find
                        </button>
                        <button onClick={handleQueryReset} className="btn btn-secondary" style={{ padding: '8px 16px', height: '38px', display: 'flex', alignItems: 'center' }}>
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Documents Viewer */}
                  <div className="compass-docs-container">
                    <div className="compass-docs-header">
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Koleksi: <strong style={{ color: 'var(--accent-cyan)' }}>{activeCollection}</strong> ({totalDocs} dokumen cocok)
                      </span>
                      <button onClick={openInsertModal} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <Plus size={14} /> Insert Document
                      </button>
                    </div>

                    <div className="compass-docs-list">
                      {loadingDocs ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                          <Activity className="animate-spin" size={28} />
                        </div>
                      ) : documents.length > 0 ? (
                        documents.map(doc => (
                          <div key={doc._id} className="compass-doc-card">
                            <div className="compass-doc-actions">
                              <button onClick={() => openEditModal(doc)} className="btn btn-secondary" style={{ padding: '4px', borderRadius: '4px' }} title="Edit JSON">
                                <Edit2 size={12} style={{ color: 'var(--accent-orange)' }} />
                              </button>
                              <button onClick={() => handleDeleteDocument(doc._id)} className="btn btn-secondary" style={{ padding: '4px', borderRadius: '4px' }} title="Hapus">
                                <Trash2 size={12} style={{ color: 'var(--accent-red)' }} />
                              </button>
                            </div>
                            {JSON.stringify(doc, null, 2)}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                          Tidak ada dokumen yang cocok dengan filter query.
                        </div>
                      )}
                    </div>

                    {/* Pagination Bar */}
                    <div className="pagination-bar" style={{ padding: '10px 15px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Menampilkan dokumen {skip + 1} - {Math.min(skip + limit, totalDocs)} dari {totalDocs}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => setSkip(s => Math.max(0, s - limit))}
                          disabled={skip === 0}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          <ChevronLeft size={14} /> Prev
                        </button>
                        <button 
                          onClick={() => setSkip(s => s + limit)}
                          disabled={skip + limit >= totalDocs}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Next <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Indexes Tab */
                <div className="glass-card animate-fade-in">
                  <h3 className="card-title" style={{ fontSize: '15px' }}><Key size={16} /> Indexes untuk {activeCollection}</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Nama Index</th>
                          <th>Keys</th>
                          <th>Unik</th>
                          <th>Versi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {indexes.map(idx => (
                          <tr key={idx.name}>
                            <td style={{ fontWeight: 700, color: 'white' }}>{idx.name}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{JSON.stringify(idx.key)}</td>
                            <td>
                              <span className={`badge ${idx.unique ? 'badge-success' : 'badge-secondary'}`}>
                                {idx.unique ? 'UNIQUE' : 'FALSE'}
                              </span>
                            </td>
                            <td>v{idx.v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div style={{ display: 'flex', flexGrow: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-light)', borderRadius: '16px', background: 'var(--bg-navy)', padding: '40px' }}>
              <Layers size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <h3 style={{ color: 'white', fontWeight: 700 }}>Pilih Koleksi Database</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textAlign: 'center' }}>
                Silakan pilih database dan koleksi di panel sebelah kiri untuk mulai menelusuri data mentah MongoDB.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Document JSON Editor Modal */}
      {editorOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'white', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
                {editorMode === 'insert' ? 'Insert New Document' : 'Edit Document JSON'}
              </h3>
              <button onClick={() => setEditorOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveDocument}>
              <div className="modal-body">
                <div style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  ⚠️ Masukkan data dalam format JSON standar. Field <code>_id</code> otomatis dibuat jika dikosongkan.
                </div>
                <textarea 
                  className="compass-json-input"
                  value={editorJson}
                  onChange={(e) => setEditorJson(e.target.value)}
                  style={{ width: '100%', fontFamily: 'monospace', padding: '12px', background: '#090d16', border: '1px solid var(--border-light)', borderRadius: '8px', color: '#a7f3d0' }}
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditorOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editorMode === 'insert' ? 'Insert' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Compass;
