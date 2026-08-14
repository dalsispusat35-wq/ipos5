// In development Vite proxies /api to Express. In production both are served
// by Express, so no host, port, or database server is baked into the bundle.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export const getAuthToken = () => {
  return sessionStorage.getItem('ipos5_jwt_token') || localStorage.getItem('ipos5_jwt_token') || '';
};

export const setAuthToken = (token) => {
  if (token) {
    sessionStorage.setItem('ipos5_jwt_token', token);
  } else {
    sessionStorage.removeItem('ipos5_jwt_token');
    localStorage.removeItem('ipos5_jwt_token');
  }
};

export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
    if (response.status === 404) {
      throw new Error(`Endpoint API "${endpoint}" tidak ditemukan (HTTP 404). Backend tidak merespons dengan benar, pastikan server Express di folder server/ sudah berjalan dan di-restart.`);
    }
    throw new Error(`Response HTTP ${response.status}: Server backend mengembalikan non-JSON. Pastikan server Express di folder server/ aktif. (${text.slice(0, 80)})`);
  }

  const data = await response.json();

  if (response.status === 401 && endpoint !== '/auth/login' && import.meta.env.VITE_DISABLE_AUTH !== 'true') {
    setAuthToken('');
    sessionStorage.removeItem('ipos5_user');
    window.location.href = '/login';
    throw new Error(data.message || 'Sesi telah kadaluarsa. Silakan login kembali.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  // Auth
  login: (data) => fetchApi('/auth/login', { method: 'POST', body: data }),
  getMe: () => fetchApi('/auth/me'),
  logout: () => fetchApi('/auth/logout', { method: 'POST' }),

  // Stats
  getDashboardStats: () => fetchApi('/dashboard-stats'),

  // Checker
  checkRouting: (connoteCode, date) => fetchApi(`/checker/${encodeURIComponent(connoteCode)}${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  getCheckerData: (connoteCode, date) => fetchApi(`/checker/${encodeURIComponent(connoteCode)}${date ? `?date=${encodeURIComponent(date)}` : ''}`),

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
  getVehicleCapacity: (noKendaraan, params = '') => fetchApi(`/kendaraan/${encodeURIComponent(noKendaraan)}/kapasitas?${params}`),
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

  // Daily Routing (Date-based Journey Aggregation)
  getDailyRouting: (date) => fetchApi(`/route-journeys/daily?date=${encodeURIComponent(date)}`),
  searchConnoteByDate: (connoteCode, date) => fetchApi(`/route-journeys/daily/search/${encodeURIComponent(connoteCode)}?date=${encodeURIComponent(date)}`),

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
  // Daily Operation CSV Importer (Tooling Testing)
  importDailyOperationCsv: (csvText) => fetchApi('/daily-operation/import-csv', {
    method: 'POST',
    headers: { 'x-dev-access': 'true' },
    body: { csvText }
  }),
  deleteImportBatch: (batchId) => fetchApi(`/daily-operation/import-batch/${encodeURIComponent(batchId)}`, {
    method: 'DELETE',
    headers: { 'x-dev-access': 'true' }
  }),

  // User Management & Profile CRUD
  getUsers: () => fetchApi('/users'),
  createUser: (data) => fetchApi('/users', { method: 'POST', body: data }),
  updateUser: (username, data) => fetchApi(`/users/${encodeURIComponent(username)}`, { method: 'PUT', body: data }),
  updateUserPassword: (username, data) => fetchApi(`/users/${encodeURIComponent(username)}/password`, { method: 'PUT', body: data }),
  deleteUser: (username) => fetchApi(`/users/${encodeURIComponent(username)}`, { method: 'DELETE' }),

  // Analytics & Reports
  getSlaPerformance: () => fetchApi('/analytics/sla'),
  getVolumeThroughput: () => fetchApi('/analytics/throughput'),
  getExportCsvUrl: (params = '') => `${API_BASE}/analytics/export?${params}`,

  // Notifications & Alerts
  getSystemAlerts: () => fetchApi('/notifications/alerts'),
  markAlertRead: (id) => fetchApi(`/notifications/alerts/${id}/read`, { method: 'POST' })
};
