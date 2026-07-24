// In development Vite proxies /api to Express. In production both are served
// by Express, so no host, port, or database server is baked into the bundle.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Response HTTP ${response.status}: Server backend belum di-restart atau mengembalikan non-JSON. (${text.slice(0, 100)})`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  // Stats
  getDashboardStats: () => fetchApi('/dashboard-stats'),

  // Checker
  checkRouting: (connoteCode) => fetchApi(`/checker/${encodeURIComponent(connoteCode)}`),
  getCheckerData: (connoteCode) => fetchApi(`/checker/${encodeURIComponent(connoteCode)}`),

  // Kantor
  getKantor: (params = '') => fetchApi(`/kantor?${params}`),
  getKantorFilters: () => fetchApi('/kantor/filters'),
  getKantorById: (id) => fetchApi(`/kantor/${id}`),
  createKantor: (data) => fetchApi('/kantor', { method: 'POST', body: data }),
  updateKantor: (id, data) => fetchApi(`/kantor/${id}`, { method: 'PUT', body: data }),
  deleteKantor: (id) => fetchApi(`/kantor/${id}`, { method: 'DELETE' }),

  // Produk
  getProduk: (params = '') => fetchApi(`/produk?${params}`),
  getProdukFilters: () => fetchApi('/produk/filters'),
  getProdukById: (id) => fetchApi(`/produk/${id}`),
  createProduk: (data) => fetchApi('/produk', { method: 'POST', body: data }),
  updateProduk: (id, data) => fetchApi(`/produk/${id}`, { method: 'PUT', body: data }),
  deleteProduk: (id) => fetchApi(`/produk/${id}`, { method: 'DELETE' }),

  // Kendaraan
  getKendaraan: (params = '') => fetchApi(`/kendaraan?${params}`),
  getKendaraanFilters: () => fetchApi('/kendaraan/filters'),
  getKendaraanById: (id) => fetchApi(`/kendaraan/${id}`),
  createKendaraan: (data) => fetchApi('/kendaraan', { method: 'POST', body: data }),
  updateKendaraan: (id, data) => fetchApi(`/kendaraan/${id}`, { method: 'PUT', body: data }),
  deleteKendaraan: (id) => fetchApi(`/kendaraan/${id}`, { method: 'DELETE' }),

  // Route
  getRoute: (params = '') => fetchApi(`/route?${params}`),
  getRouteById: (id) => fetchApi(`/route/${id}`),
  createRoute: (data) => fetchApi('/route', { method: 'POST', body: data }),
  updateRoute: (id, data) => fetchApi(`/route/${id}`, { method: 'PUT', body: data }),
  deleteRoute: (id) => fetchApi(`/route/${id}`, { method: 'DELETE' }),

  // Detail Route (Segments)
  getDetailRoute: (params = '') => fetchApi(`/detail-route?${params}`),
  getDetailRouteById: (id) => fetchApi(`/detail-route/${id}`),
  createDetailRoute: (data) => fetchApi('/detail-route', { method: 'POST', body: data }),
  updateDetailRoute: (id, data) => fetchApi(`/detail-route/${id}`, { method: 'PUT', body: data }),
  deleteDetailRoute: (id) => fetchApi(`/detail-route/${id}`, { method: 'DELETE' }),

  // Templates
  getTemplates: (params = '') => fetchApi(`/template?${params}`),
  getTemplateById: (id) => fetchApi(`/template/${id}`),
  createTemplate: (data) => fetchApi('/template', { method: 'POST', body: data }),
  updateTemplate: (id, data) => fetchApi(`/template/${id}`, { method: 'PUT', body: data }),
  deleteTemplate: (id) => fetchApi(`/template/${id}`, { method: 'DELETE' }),

  // Jadwal
  getJadwal: (params = '') => fetchApi(`/jadwal?${params}`),
  getJadwalById: (id) => fetchApi(`/jadwal/${id}`),
  createJadwal: (data) => fetchApi('/jadwal', { method: 'POST', body: data }),
  updateJadwal: (id, data) => fetchApi(`/jadwal/${id}`, { method: 'PUT', body: data }),
  deleteJadwal: (id) => fetchApi(`/jadwal/${id}`, { method: 'DELETE' }),
  generateJadwal: (data) => fetchApi('/jadwal/generate', { method: 'POST', body: data }),

  // Slide 2 PPT - pickup malam tervalidasi master_kantor
  getSlide2NightPickup: () => fetchApi('/pickup-schedules/slide-2/night'),

  // Dynamic Capacity Routing (Milk Run)
  simulateMilkRun: (data = {}) => fetchApi('/route-journeys/simulate', { method: 'POST', body: data }),
  getActiveRouteJourney: (nopol = 'B 9910 PCX') => fetchApi(`/route-journeys/active?vehicle_nopol=${encodeURIComponent(nopol)}`),
  getRouteJourney: (id) => fetchApi(`/route-journeys/${id}`),
  createRouteJourney: (data = {}) => fetchApi('/route-journeys', { method: 'POST', body: data }),
  startRouteJourney: (id) => fetchApi(`/route-journeys/${id}/start`, { method: 'POST' }),
  processRouteJourneyStop: (id, seq, idempotencyKey) => fetchApi(`/route-journeys/${id}/stops/${seq}/process`, {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
  }),
  completeRouteJourney: (id) => fetchApi(`/route-journeys/${id}/complete`, { method: 'POST' }),
  cancelRouteJourney: (id, reason) => fetchApi(`/route-journeys/${id}/cancel`, { method: 'POST', body: { reason } }),

  // Compass Manager
  getConnections: () => fetchApi('/compass/connections'),
  saveConnection: (data) => fetchApi('/compass/connections', { method: 'POST', body: data }),
  deleteConnection: (id) => fetchApi(`/compass/connections/${id}`, { method: 'DELETE' }),
  connectProfile: (data) => fetchApi('/compass/connect', { method: 'POST', body: data }),
  disconnectDb: () => fetchApi('/compass/disconnect', { method: 'POST' }),
  getActiveConnection: () => fetchApi('/compass/active-connection'),

  getDatabases: () => fetchApi('/compass/databases'),
  getCollections: (database = '') => fetchApi(`/compass/collections${database ? '?database=' + encodeURIComponent(database) : ''}`),
  getCollectionsByDb: (database) => fetchApi(`/compass/collections?database=${encodeURIComponent(database)}`),
  getDocuments: (colName, queryParams = '') => fetchApi(`/compass/documents/${colName}?${queryParams}`),
  insertDocument: (colName, doc) => fetchApi(`/compass/documents/${colName}`, { method: 'POST', body: doc }),
  updateDocument: (colName, id, doc) => fetchApi(`/compass/documents/${colName}/${id}`, { method: 'PUT', body: doc }),
  deleteDocument: (colName, id) => fetchApi(`/compass/documents/${colName}/${id}`, { method: 'DELETE' }),
  getIndexes: (colName) => fetchApi(`/compass/indexes/${colName}`),

  // Operational Transactions & Manifests
  getTransactions: (params = '') => fetchApi(`/transaksi?${params}`),
  getTransactionStats: (params = '') => fetchApi(`/transaksi/stats?${params}`),
  getTransactionByCode: (code) => fetchApi(`/transaksi/${code}`),
  getVehicleDetail: (nopol, params = '') => fetchApi(`/kendaraan/${nopol}/detail?${params}`),
  updateTransactionStatus: (connoteCode, status) => fetchApi(`/transaksi/${connoteCode}/status`, { method: 'PUT', body: { status } }),
  getManifests: (params = '') => fetchApi(`/manifests?${params}`),
  getManifestByCode: (code) => fetchApi(`/manifests/${encodeURIComponent(code)}`),
  createManifest: (data) => fetchApi('/manifests', { method: 'POST', body: data }),
  transitManifest: (data) => fetchApi('/manifests/transit', { method: 'POST', body: data }),
  arriveManifest: (data) => fetchApi('/manifests/arrive', { method: 'POST', body: data })
};
