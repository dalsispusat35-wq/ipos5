import { fetchApi } from './api.js';

export const estimasiApi = {
  /**
   * Fetch milk run logistic calculation & ETA schedule
   * @param {Object} params
   * @param {string} params.nopol
   * @param {string} [params.jam_berangkat] e.g. "16:00"
   * @param {number} [params.kecepatan_kmh] e.g. 40
   * @param {number} [params.waktu_muat_menit] e.g. 15
   * @param {string} [params.periode] e.g. "hari_ini", "minggu_lalu", "bulan_lalu"
   */
  getKalkulasi: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.nopol) query.append('nopol', params.nopol);
    if (params.jam_berangkat) query.append('jam_berangkat', params.jam_berangkat);
    if (params.kecepatan_kmh !== undefined) query.append('kecepatan_kmh', params.kecepatan_kmh);
    if (params.waktu_muat_menit !== undefined) query.append('waktu_muat_menit', params.waktu_muat_menit);
    if (params.periode) query.append('periode', params.periode);

    return fetchApi(`/estimasi/kalkulasi?${query.toString()}`);
  },

  /**
   * Test simulation adding extra cargo load
   * @param {Object} params
   * @param {string} params.nopol
   * @param {number} params.tambahan_paket_kg
   * @param {string} [params.periode]
   */
  simulasiBeban: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.nopol) query.append('nopol', params.nopol);
    if (params.tambahan_paket_kg !== undefined) query.append('tambahan_paket_kg', params.tambahan_paket_kg);
    if (params.periode) query.append('periode', params.periode);

    return fetchApi(`/estimasi/simulasi-beban?${query.toString()}`);
  }
};
