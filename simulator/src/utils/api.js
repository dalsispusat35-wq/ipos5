/**
 * Simulator API Client
 */

const API_BASE = '/api/simulator';

export const api = {
  async getStats(date) {
    const res = await fetch(`${API_BASE}/stats${date ? `?date=${encodeURIComponent(date)}` : ''}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async getOptions() {
    const res = await fetch(`${API_BASE}/options`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async injectBulk(payload) {
    const res = await fetch(`${API_BASE}/inject-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async injectSingle(payload) {
    const res = await fetch(`${API_BASE}/inject-single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async clearDate(targetDate) {
    const res = await fetch(`${API_BASE}/clear-date`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_date: targetDate })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  }
};
