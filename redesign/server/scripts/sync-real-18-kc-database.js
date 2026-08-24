/**
 * SINKRONISASI DATA RIIL 18 KANTOR POS / AGEN POS BANDUNG-CIMAHI
 * KE 3 ARMADA KENDARAAN (RUTE PANJANG 6 KANTOR + SPP BANDUNG)
 * 
 * Usage: node scripts/sync-real-18-kc-database.js
 */

import DbConnection from '../config/DbConnection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONNECTIONS_FILE = path.join(__dirname, '..', 'config', 'connections.json');

// ─── 1. DAFTAR 18 KANTOR POS / AGEN POS + SPP BANDUNG ─────────────────────────
const REAL_OFFICES = [
  {
    nopend: '40000',
    nama_nopend: 'Bandung (KCU)',
    nama_kantor: 'KCU Bandung 40000 (Asia Afrika)',
    alamat: 'Jl. Asia Afrika No. 49 Bandung',
    kelurahan: 'BRAGA',
    kecamatan: 'SUMUR BANDUNG',
    kabupaten: 'KOTA BANDUNG',
    provinsi: 'JAWA BARAT',
    contact_center: '1500161',
    tipe_kantor: 'Kantor Cabang Utama',
    tipe: 'KCU',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.921350,
    longitude: 107.607830,
    status: 'AKTIF'
  },
  {
    nopend: '40100',
    nama_nopend: 'Ujungberung (KC)',
    nama_kantor: 'KC Ujungberung 40100',
    alamat: 'Jl. AH Nasution No.28 Ujb',
    kelurahan: 'PAKEMITAN',
    kecamatan: 'CINAMBO',
    kabupaten: 'KOTA BANDUNG',
    provinsi: 'JAWA BARAT',
    contact_center: '0227800103',
    tipe_kantor: 'Kantor Cabang',
    tipe: 'KC',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.912350,
    longitude: 107.695800,
    status: 'AKTIF'
  },
  {
    nopend: '40114A',
    nama_nopend: 'Bandungcihapit (KCP)',
    nama_kantor: 'KCP Bandungcihapit 40114A',
    alamat: 'Jl. Banda No. 30 Bandung',
    kelurahan: 'CIHAPIT',
    kecamatan: 'BANDUNG WETAN',
    kabupaten: 'KOTA BANDUNG',
    provinsi: 'JAWA BARAT',
    contact_center: '1500161',
    tipe_kantor: 'Kantor Cabang Pembantu',
    tipe: 'KCP',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.907150,
    longitude: 107.618520,
    status: 'AKTIF'
  },
  {
    nopend: '40115A',
    nama_nopend: 'Bandungcilaki (KCP)',
    nama_kantor: 'KCP Bandungcilaki 40115A',
    alamat: 'Jl. Cilaki No. 73 Bandung',
    kelurahan: 'CITARUM',
    kecamatan: 'BANDUNG WETAN',
    kabupaten: 'KOTA BANDUNG',
    provinsi: 'JAWA BARAT',
    contact_center: '1500161',
    tipe_kantor: 'Kantor Cabang Pembantu',
    tipe: 'KCP',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.903820,
    longitude: 107.625100,
    status: 'AKTIF'
  },
  {
    nopend: '40115B',
    nama_nopend: 'Bandungjuanda (KCP)',
    nama_kantor: 'KCP Bandungjuanda 40115B',
    alamat: 'Jl. Ir H Juanda No. 10 A Bandung',
    kelurahan: 'DAGO',
    kecamatan: 'COBLONG',
    kabupaten: 'KOTA BANDUNG',
    provinsi: 'JAWA BARAT',
    contact_center: '1500161',
    tipe_kantor: 'Kantor Cabang Pembantu',
    tipe: 'KCP',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.904500,
    longitude: 107.611200,
    status: 'AKTIF'
  },
  {
    nopend: '40116A',
    nama_nopend: 'Bandungcicendo (KCP)',
    nama_kantor: 'KCP Bandungcicendo 40116A',
    alamat: 'Jl. Cihampelas No. 12 Bandung',
    kelurahan: 'TAMANSARI',
    kecamatan: 'BANDUNG WETAN',
    kabupaten: 'KOTA BANDUNG',
    provinsi: 'JAWA BARAT',
    contact_center: '1500161',
    tipe_kantor: 'Kantor Cabang Pembantu',
    tipe: 'KCP',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.905600,
    longitude: 107.602800,
    status: 'AKTIF'
  },
  {
    nopend: '40122B',
    nama_nopend: 'Bandungsupratman (KCP)',
    nama_kantor: 'KCP Bandungsupratman 40122B',
    alamat: 'JL. Supratman No. 64 Bandung',
    kelurahan: 'CIHAUR GEULIS',
    kecamatan: 'CIBEUNYING KALER',
    kabupaten: 'KOTA BANDUNG',
    provinsi: 'JAWA BARAT',
    contact_center: '1500161',
    tipe_kantor: 'Kantor Cabang Pembantu',
    tipe: 'KCP',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.903200,
    longitude: 107.632100,
    status: 'AKTIF'
  },
  {
    nopend: '40122D1',
    nama_nopend: 'LE IMIGRASI',
    nama_kantor: 'Loket Ekstensi Imigrasi Surapati 40122D1',
    alamat: 'JL SURAPATI NO 82 CIHAURGEULIS',
    kelurahan: 'CIHAUR GEULIS',
    kecamatan: 'CIBEUNYING KALER',
    kabupaten: 'KOTA BANDUNG',
    provinsi: 'JAWA BARAT',
    contact_center: '1500161',
    tipe_kantor: 'Loket Ekstensi',
    tipe: 'LE',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.898800,
    longitude: 107.626400,
    status: 'AKTIF'
  },
  {
    nopend: '40123A',
    nama_nopend: 'Bandungsukaluyu (KCP)',
    nama_kantor: 'KCP Bandungsukaluyu 40123A',
    alamat: 'JL PAHLAWAN NO 87 SUKALUYU',
    kelurahan: 'SUKALUYU',
    kecamatan: 'CIBEUNYING KALER',
    kabupaten: 'KOTA BANDUNG',
    provinsi: 'JAWA BARAT',
    contact_center: '1500161',
    tipe_kantor: 'Kantor Cabang Pembantu',
    tipe: 'KCP',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.892600,
    longitude: 107.633800,
    status: 'AKTIF'
  },
  {
    nopend: '40184U5',
    nama_nopend: 'CIMINDI (Agenpos)',
    nama_kantor: 'Agenpos Optimalisasi Cimindi 40184U5',
    alamat: 'Jalan Gang Bp Ohe No 149 RT 01 RW 05',
    kelurahan: 'CAMPAKA',
    kecamatan: 'ANDIR',
    kabupaten: 'CIMAHI',
    provinsi: 'JAWA BARAT',
    contact_center: 'Hamdani | 082126521956',
    tipe_kantor: 'Agenpos Optimalisasi',
    tipe: 'AGEN',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.896700,
    longitude: 107.561200,
    status: 'AKTIF'
  },
  {
    nopend: '40215C6',
    nama_nopend: 'ARKAN FOTO (Agenpos)',
    nama_kantor: 'Agenpos Arkan Foto Cijerah 40215C6',
    alamat: 'Jl Gempol Sari Perum Cijerah 2 No 147',
    kelurahan: 'GEMPOLSARI',
    kecamatan: 'BANDUNG KULON',
    kabupaten: 'CIMAHI',
    provinsi: 'JAWA BARAT',
    contact_center: 'Nogi M | 081338064466',
    tipe_kantor: 'Agen Pos',
    tipe: 'AGEN',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.918900,
    longitude: 107.562300,
    status: 'AKTIF'
  },
  {
    nopend: '40351U2',
    nama_nopend: 'AZ ZAHRA MARGAASIH (Agenpos)',
    nama_kantor: 'Agenpos Az Zahra Margaasih 40351U2',
    alamat: 'Jl Raya Nanjung No 44 RT 03 RW 03',
    kelurahan: 'NANJUNG',
    kecamatan: 'MARGAASIH',
    kabupaten: 'CIMAHI',
    provinsi: 'JAWA BARAT',
    contact_center: '081394037810',
    tipe_kantor: 'Agen Pos',
    tipe: 'AGEN',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.938500,
    longitude: 107.545800,
    status: 'AKTIF'
  },
  {
    nopend: '40511A',
    nama_nopend: 'Cimahicisangkan (KCP)',
    nama_kantor: 'KCP Cimahicisangkan 40511A',
    alamat: 'Jl. Sangkuriang 2 RT.04/20',
    kelurahan: 'CIPAGERAN',
    kecamatan: 'CIMAHI UTARA',
    kabupaten: 'KOTA CIMAHI',
    provinsi: 'JAWA BARAT',
    contact_center: '1500161',
    tipe_kantor: 'Kantor Cabang Pembantu',
    tipe: 'KCP',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.865200,
    longitude: 107.538500,
    status: 'AKTIF'
  },
  {
    nopend: '40511CA',
    nama_nopend: 'SRIKANDI (Agenpos)',
    nama_kantor: 'Agenpos Srikandi Cikendal 40511CA',
    alamat: 'Jl Cikendal Rt 05 RW 04',
    kelurahan: 'CIPAGERAN',
    kecamatan: 'CIMAHI UTARA',
    kabupaten: 'CIMAHI',
    provinsi: 'JAWA BARAT',
    contact_center: '082269969273',
    tipe_kantor: 'Agen Pos',
    tipe: 'AGEN',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.852400,
    longitude: 107.532100,
    status: 'AKTIF'
  },
  {
    nopend: '40511CB',
    nama_nopend: 'SANGKURIANG (Agenpos)',
    nama_kantor: 'Agenpos Sangkuriang 40511CB',
    alamat: 'Jl Sangkuriang No 25A RT 03 RW 05',
    kelurahan: 'CIPAGERAN',
    kecamatan: 'CIMAHI UTARA',
    kabupaten: 'CIMAHI',
    provinsi: 'JAWA BARAT',
    contact_center: 'Siti N | 087737451813',
    tipe_kantor: 'Agen Pos',
    tipe: 'AGEN',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.861100,
    longitude: 107.539800,
    status: 'AKTIF'
  },
  {
    nopend: '40511U1',
    nama_nopend: 'KOPERASI JASA SPPI DPW 5 CMITE (Agenpos)',
    nama_kantor: 'Agenpos Koperasi Jasa SPPI 40511U1',
    alamat: 'Jalan Terusan No.30 RT 02 RW 03',
    kelurahan: 'CIPAGERAN',
    kecamatan: 'CIMAHI UTARA',
    kabupaten: 'CIMAHI',
    provinsi: 'JAWA BARAT',
    contact_center: 'HALOPOS 161',
    tipe_kantor: 'Agen Pos',
    tipe: 'AGEN',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.879500,
    longitude: 107.544200,
    status: 'AKTIF'
  },
  {
    nopend: '40511U3',
    nama_nopend: 'ETHALASE NISRAZKA CISANGKAN (Agenpos)',
    nama_kantor: 'Agenpos Ethalase Nisrazka Cisangkan 40511U3',
    alamat: 'Jl Sangkuriang 2 RT 04 RW 20',
    kelurahan: 'CIPAGERAN',
    kecamatan: 'CIMAHI UTARA',
    kabupaten: 'CIMAHI',
    provinsi: 'JAWA BARAT',
    contact_center: '08986090683',
    tipe_kantor: 'Agen Pos',
    tipe: 'AGEN',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.863800,
    longitude: 107.538900,
    status: 'AKTIF'
  },
  {
    nopend: '40511U4',
    nama_nopend: 'CIMAHI TENGAH (Agenpos)',
    nama_kantor: 'Agenpos Cimahi Tengah Melong 40511U4',
    alamat: 'Jl Melong Raya RT 04 RW 14',
    kelurahan: 'CIPAGERAN',
    kecamatan: 'CIMAHI UTARA',
    kabupaten: 'CIMAHI',
    provinsi: 'JAWA BARAT',
    contact_center: '085624030794',
    tipe_kantor: 'Agen Pos',
    tipe: 'AGEN',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.908200,
    longitude: 107.554600,
    status: 'AKTIF'
  },
  // TERMINAL HUB AKHIR
  {
    nopend: '40400',
    nama_nopend: 'SPP Bandung (Sentral Pengolahan Pos)',
    nama_kantor: 'SPP Bandung 40400 (Hub Sentral)',
    alamat: 'Jl. Soekarno Hatta No. 558 Bandung',
    kelurahan: 'SEKEJATI',
    kecamatan: 'BUAHBATU',
    kabupaten: 'KOTA BANDUNG',
    provinsi: 'JAWA BARAT',
    contact_center: '1500161',
    tipe_kantor: 'Sentral Pengolahan Pos',
    tipe: 'SPP',
    kdregional: '3',
    nama_regional: 'Regional III Jawa Barat',
    latitude: -6.940428,
    longitude: 107.632296,
    status: 'AKTIF'
  }
];

// ─── 2. DAFTAR 3 ARMADA KENDARAAN (DISISIHKAN SESUAI PERMINTAAN USER) ─────────
const FLEET_VEHICLES = [
  {
    kendaraan_id: 'VH-B9910PCX',
    nopol: 'B 9910 PCX',
    nama_kendaraan: 'Daihatsu Gran Max Box - Feeder Cimahi Raya (B 9910 PCX)',
    jenis_kendaraan: 'MOBIL BOX FEEDER (1.5 TON)',
    kapasitas_ton: 1.5,
    max_capacity_kg: 1500,
    driver: 'Ahmad Supriadi',
    driver_phone: '0812-9876-54321',
    status: 'AKTIF',
    home_base: '40511A - KCP Cimahicisangkan',
    rute_utama: 'RT-B9910-CIMAHI-RAYA',
    assigned_route_id: 'RT-B9910-CIMAHI-RAYA',
    updatedAt: new Date()
  },
  {
    kendaraan_id: 'VH-D8812AB',
    nopol: 'D 8812 AB',
    nama_kendaraan: 'Mitsubishi Canter - Feeder Barat & Utara (D 8812 AB)',
    jenis_kendaraan: 'TRUK ENGKEL BOX (3.5 TON)',
    kapasitas_ton: 3.5,
    max_capacity_kg: 3500,
    driver: 'Dede Kurnia',
    driver_phone: '0815-7654-32109',
    status: 'AKTIF',
    home_base: '40184U5 - Agenpos Cimindi',
    rute_utama: 'RT-D8812-BARAT-UTARA',
    assigned_route_id: 'RT-D8812-BARAT-UTARA',
    updatedAt: new Date()
  },
  {
    kendaraan_id: 'VH-B9945PCY',
    nopol: 'B 9945 PCY',
    nama_kendaraan: 'Isuzu Elf Box - Feeder Timur & Pusat (B 9945 PCY)',
    jenis_kendaraan: 'TRUK BOX INTERCITY (4 TON)',
    kapasitas_ton: 4.0,
    max_capacity_kg: 4000,
    driver: 'Budi Santoso',
    driver_phone: '0813-8765-43210',
    status: 'AKTIF',
    home_base: '40000 - KCU Bandung Asia Afrika',
    rute_utama: 'RT-B9945-TIMUR-PUSAT',
    assigned_route_id: 'RT-B9945-TIMUR-PUSAT',
    updatedAt: new Date()
  }
];

// ─── 3. DAFTAR 3 RUTE MASTER PANJANG ───────────────────────────────────────────
const MASTER_ROUTES = [
  {
    route_id: 'RT-B9910-CIMAHI-RAYA',
    nama_route: 'Rute Feeder Terpadu Cimahi Raya (Cisangkan - Cipageran - Melong) -> SPP Bandung',
    nopen_asal: '40511A',
    nama_asal: 'KCP Cimahicisangkan (40511A)',
    nopen_tujuan: '40400',
    nama_tujuan: 'SPP Bandung (40400)',
    kodeMile: 'FIRST_MILE',
    deskripsi_produk: 'Pickup Terpadu 6 Kantor Cimahi Raya menuju SPP Bandung',
    prioritas: 1,
    aktif: 'Y',
    status_route: 'LENGKAP',
    updatedAt: new Date()
  },
  {
    route_id: 'RT-D8812-BARAT-UTARA',
    nama_route: 'Rute Feeder Terpadu Cimindi - Margaasih - Cicendo - Dago -> SPP Bandung',
    nopen_asal: '40184U5',
    nama_asal: 'Agenpos Cimindi (40184U5)',
    nopen_tujuan: '40400',
    nama_tujuan: 'SPP Bandung (40400)',
    kodeMile: 'FIRST_MILE',
    deskripsi_produk: 'Pickup Terpadu 6 Kantor Barat & Utara Bandung menuju SPP Bandung',
    prioritas: 1,
    aktif: 'Y',
    status_route: 'LENGKAP',
    updatedAt: new Date()
  },
  {
    route_id: 'RT-B9945-TIMUR-PUSAT',
    nama_route: 'Rute Express Feeder Bandung Pusat - Cibeunying - Ujungberung -> SPP Bandung',
    nopen_asal: '40000',
    nama_asal: 'KCU Bandung (40000)',
    nopen_tujuan: '40400',
    nama_tujuan: 'SPP Bandung (40400)',
    kodeMile: 'FIRST_MILE',
    deskripsi_produk: 'Pickup Terpadu 6 Kantor Pusat & Timur Bandung menuju SPP Bandung',
    prioritas: 1,
    aktif: 'Y',
    status_route: 'LENGKAP',
    updatedAt: new Date()
  }
];

// ─── 4. DAFTAR DETAIL WAYPOINTS (7 STOPS PER RUTE: 6 KANTOR + SPP BANDUNG) ────
const DETAIL_ROUTES = [
  // ─── RUTE 1: RT-B9910-CIMAHI-RAYA (7 Stops) ────────────────────────────────
  // 40511A -> 40511CB -> 40511U3 -> 40511CA -> 40511U1 -> 40511U4 -> 40400
  { detail_route_id: 'DR-B9910-01', route_id: 'RT-B9910-CIMAHI-RAYA', seq: 1, asal_nopen: '40511A', asal_nama: 'KCP Cimahicisangkan', tujuan_nopen: '40511CB', tujuan_nama: 'AGEN SANGKURIANG', estimasi_menit: 8, jarak_km: 1.5, status: 'AKTIF' },
  { detail_route_id: 'DR-B9910-02', route_id: 'RT-B9910-CIMAHI-RAYA', seq: 2, asal_nopen: '40511CB', asal_nama: 'AGEN SANGKURIANG', tujuan_nopen: '40511U3', tujuan_nama: 'AGEN ETHALASE NISRAZKA', estimasi_menit: 6, jarak_km: 1.0, status: 'AKTIF' },
  { detail_route_id: 'DR-B9910-03', route_id: 'RT-B9910-CIMAHI-RAYA', seq: 3, asal_nopen: '40511U3', asal_nama: 'AGEN ETHALASE NISRAZKA', tujuan_nopen: '40511CA', tujuan_nama: 'AGEN SRIKANDI', estimasi_menit: 10, jarak_km: 2.2, status: 'AKTIF' },
  { detail_route_id: 'DR-B9910-04', route_id: 'RT-B9910-CIMAHI-RAYA', seq: 4, asal_nopen: '40511CA', asal_nama: 'AGEN SRIKANDI', tujuan_nopen: '40511U1', tujuan_nama: 'AGEN KOPERASI JASA SPPI', estimasi_menit: 8, jarak_km: 1.8, status: 'AKTIF' },
  { detail_route_id: 'DR-B9910-05', route_id: 'RT-B9910-CIMAHI-RAYA', seq: 5, asal_nopen: '40511U1', asal_nama: 'AGEN KOPERASI JASA SPPI', tujuan_nopen: '40511U4', tujuan_nama: 'AGEN CIMAHI TENGAH (MELONG)', estimasi_menit: 15, jarak_km: 4.5, status: 'AKTIF' },
  { detail_route_id: 'DR-B9910-06', route_id: 'RT-B9910-CIMAHI-RAYA', seq: 6, asal_nopen: '40511U4', asal_nama: 'AGEN CIMAHI TENGAH (MELONG)', tujuan_nopen: '40400', tujuan_nama: 'SPP Bandung (Terminal Akhir)', estimasi_menit: 28, jarak_km: 13.5, status: 'AKTIF' },

  // ─── RUTE 2: RT-D8812-BARAT-UTARA (7 Stops) ────────────────────────────────
  // 40184U5 -> 40215C6 -> 40351U2 -> 40116A -> 40115B -> 40114A -> 40400
  { detail_route_id: 'DR-D8812-01', route_id: 'RT-D8812-BARAT-UTARA', seq: 1, asal_nopen: '40184U5', asal_nama: 'AGEN CIMINDI', tujuan_nopen: '40215C6', tujuan_nama: 'AGEN ARKAN FOTO (CIJERAH)', estimasi_menit: 12, jarak_km: 3.2, status: 'AKTIF' },
  { detail_route_id: 'DR-D8812-02', route_id: 'RT-D8812-BARAT-UTARA', seq: 2, asal_nopen: '40215C6', asal_nama: 'AGEN ARKAN FOTO (CIJERAH)', tujuan_nopen: '40351U2', tujuan_nama: 'AGEN AZ ZAHRA MARGAASIH', estimasi_menit: 18, jarak_km: 5.5, status: 'AKTIF' },
  { detail_route_id: 'DR-D8812-03', route_id: 'RT-D8812-BARAT-UTARA', seq: 3, asal_nopen: '40351U2', asal_nama: 'AGEN AZ ZAHRA MARGAASIH', tujuan_nopen: '40116A', tujuan_nama: 'KCP Bandungcicendo (Cihampelas)', estimasi_menit: 25, jarak_km: 9.8, status: 'AKTIF' },
  { detail_route_id: 'DR-D8812-04', route_id: 'RT-D8812-BARAT-UTARA', seq: 4, asal_nopen: '40116A', asal_nama: 'KCP Bandungcicendo (Cihampelas)', tujuan_nopen: '40115B', tujuan_nama: 'KCP Bandungjuanda (Dago)', estimasi_menit: 10, jarak_km: 2.5, status: 'AKTIF' },
  { detail_route_id: 'DR-D8812-05', route_id: 'RT-D8812-BARAT-UTARA', seq: 5, asal_nopen: '40115B', asal_nama: 'KCP Bandungjuanda (Dago)', tujuan_nopen: '40114A', tujuan_nama: 'KCP Bandungcihapit (Banda)', estimasi_menit: 12, jarak_km: 2.8, status: 'AKTIF' },
  { detail_route_id: 'DR-D8812-06', route_id: 'RT-D8812-BARAT-UTARA', seq: 6, asal_nopen: '40114A', asal_nama: 'KCP Bandungcihapit (Banda)', tujuan_nopen: '40400', tujuan_nama: 'SPP Bandung (Terminal Akhir)', estimasi_menit: 22, jarak_km: 8.5, status: 'AKTIF' },

  // ─── RUTE 3: RT-B9945-TIMUR-PUSAT (7 Stops) ────────────────────────────────
  // 40000 -> 40115A -> 40122B -> 40122D1 -> 40123A -> 40100 -> 40400
  { detail_route_id: 'DR-B9945-01', route_id: 'RT-B9945-TIMUR-PUSAT', seq: 1, asal_nopen: '40000', asal_nama: 'KCU Bandung (Asia Afrika)', tujuan_nopen: '40115A', tujuan_nama: 'KCP Bandungcilaki', estimasi_menit: 12, jarak_km: 3.0, status: 'AKTIF' },
  { detail_route_id: 'DR-B9945-02', route_id: 'RT-B9945-TIMUR-PUSAT', seq: 2, asal_nopen: '40115A', asal_nama: 'KCP Bandungcilaki', tujuan_nopen: '40122B', tujuan_nama: 'KCP Bandungsupratman', estimasi_menit: 8, jarak_km: 1.8, status: 'AKTIF' },
  { detail_route_id: 'DR-B9945-03', route_id: 'RT-B9945-TIMUR-PUSAT', seq: 3, asal_nopen: '40122B', asal_nama: 'KCP Bandungsupratman', tujuan_nopen: '40122D1', tujuan_nama: 'LE IMIGRASI (Surapati)', estimasi_menit: 10, jarak_km: 2.1, status: 'AKTIF' },
  { detail_route_id: 'DR-B9945-04', route_id: 'RT-B9945-TIMUR-PUSAT', seq: 4, asal_nopen: '40122D1', asal_nama: 'LE IMIGRASI (Surapati)', tujuan_nopen: '40123A', tujuan_nama: 'KCP Bandungsukaluyu (Pahlawan)', estimasi_menit: 10, jarak_km: 2.4, status: 'AKTIF' },
  { detail_route_id: 'DR-B9945-05', route_id: 'RT-B9945-TIMUR-PUSAT', seq: 5, asal_nopen: '40123A', asal_nama: 'KCP Bandungsukaluyu (Pahlawan)', tujuan_nopen: '40100', tujuan_nama: 'KC Ujungberung (AH Nasution)', estimasi_menit: 20, jarak_km: 8.2, status: 'AKTIF' },
  { detail_route_id: 'DR-B9945-06', route_id: 'RT-B9945-TIMUR-PUSAT', seq: 6, asal_nopen: '40100', asal_nama: 'KC Ujungberung (AH Nasution)', tujuan_nopen: '40400', tujuan_nama: 'SPP Bandung (Terminal Akhir)', estimasi_menit: 25, jarak_km: 9.5, status: 'AKTIF' }
];

// Helper: Get today WIB date string
const getTodayWib = () => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch (e) {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  }
};

// ─── 5. GENERATE CARGO UNTUK KE-3 ARMADA ─────────────────────────────────────
function generateFleetCargoAndTransactions(dateStr) {
  const cleanDateCompact = dateStr.replace(/-/g, '').slice(2); // e.g. "260820"
  
  const journeysData = [
    // 1. B 9910 PCX (6 Kantor Cimahi Raya -> SPP Bandung)
    {
      vehicle_nopol: 'B 9910 PCX',
      route_id: 'RT-B9910-CIMAHI-RAYA',
      shift: 'MALAM',
      status: 'IN_PROGRESS',
      current_stop_seq: 3,
      max_capacity_kg: 1500,
      cargo: [
        { connote_code: `P${cleanDateCompact}010001`, weight_kg: 15.5, origin_nopen: '40511A', origin_name: 'KCP Cimahicisangkan', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 1, unloaded_at_seq: 7, sender_name: 'Konveksi Sangkuriang Cimahi', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}010002`, weight_kg: 8.0, origin_nopen: '40511A', origin_name: 'KCP Cimahicisangkan', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 1, unloaded_at_seq: 7, sender_name: 'Toko Kain Cipageran', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}010003`, weight_kg: 18.0, origin_nopen: '40511CB', origin_name: 'AGEN SANGKURIANG', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 2, unloaded_at_seq: 7, sender_name: 'Distro Sangkuriang 25A', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}010004`, weight_kg: 22.5, origin_nopen: '40511U3', origin_name: 'AGEN ETHALASE NISRAZKA', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 3, unloaded_at_seq: 7, sender_name: 'Ethalase Nisrazka Craft', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}010005`, weight_kg: 35.0, origin_nopen: '40511CA', origin_name: 'AGEN SRIKANDI', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 4, unloaded_at_seq: 7, sender_name: 'Sentra Bordir Srikandi', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}010006`, weight_kg: 50.0, origin_nopen: '40511U1', origin_name: 'AGEN KOPERASI JASA SPPI', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 5, unloaded_at_seq: 7, sender_name: 'Koperasi Jasa SPPI Terusan', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}010007`, weight_kg: 95.0, origin_nopen: '40511U4', origin_name: 'AGEN CIMAHI TENGAH', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 6, unloaded_at_seq: 7, sender_name: 'Industri Rajut Melong Raya', receiver_name: 'SPP Bandung Gateway' }
      ]
    },

    // 2. D 8812 AB (6 Kantor Barat & Utara -> SPP Bandung)
    {
      vehicle_nopol: 'D 8812 AB',
      route_id: 'RT-D8812-BARAT-UTARA',
      shift: 'MALAM',
      status: 'IN_PROGRESS',
      current_stop_seq: 2,
      max_capacity_kg: 3500,
      cargo: [
        { connote_code: `P${cleanDateCompact}020001`, weight_kg: 28.5, origin_nopen: '40184U5', origin_name: 'AGEN CIMINDI', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 1, unloaded_at_seq: 7, sender_name: 'Hamdani Sentra Cimindi', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}020002`, weight_kg: 35.0, origin_nopen: '40215C6', origin_name: 'AGEN ARKAN FOTO', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 2, unloaded_at_seq: 7, sender_name: 'Arkan Foto Gempolsari', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}020003`, weight_kg: 60.0, origin_nopen: '40351U2', origin_name: 'AGEN AZ ZAHRA MARGAASIH', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 3, unloaded_at_seq: 7, sender_name: 'Az Zahra Olshop Nanjung', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}020004`, weight_kg: 18.2, origin_nopen: '40116A', origin_name: 'KCP Bandungcicendo', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 4, unloaded_at_seq: 7, sender_name: 'Toko Kaos Cihampelas', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}020005`, weight_kg: 24.0, origin_nopen: '40115B', origin_name: 'KCP Bandungjuanda', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 5, unloaded_at_seq: 7, sender_name: 'Dago Boutique Store', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}020006`, weight_kg: 20.5, origin_nopen: '40114A', origin_name: 'KCP Bandungcihapit', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 6, unloaded_at_seq: 7, sender_name: 'Kuliner Banda Cihapit', receiver_name: 'SPP Bandung Gateway' }
      ]
    },

    // 3. B 9945 PCY (6 Kantor Timur & Pusat -> SPP Bandung)
    {
      vehicle_nopol: 'B 9945 PCY',
      route_id: 'RT-B9945-TIMUR-PUSAT',
      shift: 'MALAM',
      status: 'IN_PROGRESS',
      current_stop_seq: 3,
      max_capacity_kg: 4000,
      cargo: [
        { connote_code: `P${cleanDateCompact}030001`, weight_kg: 250.0, origin_nopen: '40000', origin_name: 'KCU Bandung (Asia Afrika)', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 1, unloaded_at_seq: 7, sender_name: 'KCU Bandung Asia Afrika Consolidation Hub', receiver_name: 'SPP Bandung Sentral' },
        { connote_code: `P${cleanDateCompact}030002`, weight_kg: 32.0, origin_nopen: '40115A', origin_name: 'KCP Bandungcilaki', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 2, unloaded_at_seq: 7, sender_name: 'Kopi Cilaki Roastery', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}030003`, weight_kg: 45.0, origin_nopen: '40122B', origin_name: 'KCP Bandungsupratman', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 3, unloaded_at_seq: 7, sender_name: 'Percetakan Supratman 64', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}030004`, weight_kg: 25.0, origin_nopen: '40122D1', origin_name: 'LE IMIGRASI', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 4, unloaded_at_seq: 7, sender_name: 'Dokumen Express Loket Imigrasi', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}030005`, weight_kg: 55.0, origin_nopen: '40123A', origin_name: 'KCP Bandungsukaluyu', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 5, unloaded_at_seq: 7, sender_name: 'Sentra Kaos Pahlawan Sukaluyu', receiver_name: 'SPP Bandung Gateway' },
        { connote_code: `P${cleanDateCompact}030006`, weight_kg: 180.0, origin_nopen: '40100', origin_name: 'KC Ujungberung', destination_nopen: '40400', destination_name: 'SPP Bandung', loaded_at_seq: 6, unloaded_at_seq: 7, sender_name: 'KC Ujungberung East Corridor Hub', receiver_name: 'SPP Bandung Sentral' }
      ]
    }
  ];

  return journeysData;
}

// ─── MAIN EXECUTION ───────────────────────────────────────────────────────────
async function runSync() {
  console.log('========================================================================');
  console.log('🚀 IPOS5 SINKRONISASI 18 KANTOR POS RIIL KE 3 ARMADA RUTE PANJANG KE SPP BANDUNG');
  console.log('========================================================================');

  const connections = JSON.parse(fs.readFileSync(CONNECTIONS_FILE, 'utf8'));
  let connected = false;

  for (const conn of connections) {
    try {
      console.log(`Connecting to: ${conn.name}...`);
      await DbConnection.connect(conn);
      connected = true;
      break;
    } catch (e) {
      // try next
    }
  }

  if (!connected) {
    console.error('❌ Gagal terhubung ke database MongoDB.');
    process.exit(1);
  }

  const db = await DbConnection.getDb();
  console.log('✅ Database connected successfully!\n');

  // 1. UPDATE MASTER_KANTOR (18 Kantor Riil + SPP Bandung)
  console.log('📌 1/6. Mengupdate data 18 Kantor Pos & SPP Bandung pada master_kantor...');
  for (const off of REAL_OFFICES) {
    await db.collection('master_kantor').updateOne(
      { nopend: off.nopend },
      { 
        $set: {
          ...off,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  }
  console.log(`   -> Sukses memperbarui ${REAL_OFFICES.length} kantor pos.`);

  // 2. UPDATE MASTER_KENDARAAN (Hanya 3 Armada Aktif)
  console.log('\n📌 2/6. Mengupdate 3 Armada Kendaraan pada master_kendaraan...');
  await db.collection('master_kendaraan').deleteMany({});
  for (const v of FLEET_VEHICLES) {
    await db.collection('master_kendaraan').replaceOne(
      { nopol: v.nopol },
      v,
      { upsert: true }
    );
  }
  console.log(`   -> Sukses menyimpan ${FLEET_VEHICLES.length} armada kendaraan aktif.`);

  // 3. UPDATE MASTER_ROUTE_NOPEN (3 Rute Panjang)
  console.log('\n📌 3/6. Mengupdate 3 Rute Master pada master_route_nopen...');
  await db.collection('master_route_nopen').deleteMany({});
  for (const r of MASTER_ROUTES) {
    await db.collection('master_route_nopen').replaceOne(
      { route_id: r.route_id },
      r,
      { upsert: true }
    );
  }
  console.log(`   -> Sukses menyimpan ${MASTER_ROUTES.length} rute master.`);

  // 4. UPDATE DETAIL_ROUTE (Waypoints untuk 3 Rute Panjang)
  console.log('\n📌 4/6. Mengupdate Waypoints pada detail_route...');
  await db.collection('detail_route').deleteMany({});
  for (const dr of DETAIL_ROUTES) {
    await db.collection('detail_route').replaceOne(
      { detail_route_id: dr.detail_route_id },
      dr,
      { upsert: true }
    );
  }
  console.log(`   -> Sukses menyimpan ${DETAIL_ROUTES.length} detail waypoints.`);

  // 5. UPDATE ROUTE_JOURNEYS & TRANSAKSI UNTUK HARI INI & TANGGAL HISTORIS
  console.log('\n📌 5/6. Membuat Perjalanan Operasional (route_journeys) & Transaksi (transaksi)...');
  await db.collection('route_journeys').deleteMany({});
  
  const todayWib = getTodayWib();
  const targetDates = [todayWib, '2026-08-12', '2026-07-24', '2026-08-11', '2026-08-13'];

  for (const targetDate of targetDates) {
    const isToday = targetDate === todayWib;
    const journeys = generateFleetCargoAndTransactions(targetDate);
    const startDate = new Date(`${targetDate}T00:00:00.000+07:00`);

    for (let i = 0; i < journeys.length; i++) {
      const j = journeys[i];
      const cleanNopol = j.vehicle_nopol.replace(/\s+/g, '');
      const journeyId = `JRN-${targetDate.replace(/-/g, '')}-${cleanNopol}-001`;

      const currentLoadKg = Number(j.cargo.reduce((sum, c) => sum + (c.weight_kg || 1), 0).toFixed(1));

      const journeyDoc = {
        journey_id: journeyId,
        vehicle_nopol: j.vehicle_nopol,
        resolved_vehicle_nopol: j.vehicle_nopol,
        route_id: j.route_id,
        shift: j.shift,
        status: isToday ? j.status : 'COMPLETED',
        current_stop_seq: isToday ? j.current_stop_seq : 7,
        max_capacity_kg: j.max_capacity_kg,
        maximum_capacity_kg: j.max_capacity_kg,
        current_load_kg: currentLoadKg,
        tanggal_operasional: targetDate,
        journey_date: startDate,
        cargo: j.cargo,
        version: 1,
        createdAt: startDate,
        updatedAt: new Date()
      };

      await db.collection('route_journeys').replaceOne(
        { journey_id: journeyId },
        journeyDoc,
        { upsert: true }
      );

      // Simpan transaksi & tracking event untuk tiap paket cargo
      for (const c of j.cargo) {
        const txDoc = {
          connote_code: c.connote_code,
          connote: {
            connote_code: c.connote_code,
            connote_booking_code: `BK-${c.connote_code}`,
            connote_service: 'Pos Nextday',
            connote_amount: 25000,
            actual_weight: c.weight_kg,
            connote_state: isToday ? 'IN_TRANSIT' : 'DELIVERED',
            connote_sender_name: c.sender_name,
            connote_receiver_name: c.receiver_name,
            connote_receiver_address: 'Sentral Pengolahan Pos Bandung, Jl. Soekarno Hatta No. 558',
            created_at: `${targetDate} 08:30:00`
          },
          location_data_created: {
            location_name: c.origin_name,
            custom_field: {
              nopen: c.origin_nopen,
              destination_nopen: c.destination_nopen
            }
          },
          custom_field: {
            origin_nopen: c.origin_nopen,
            destination_nopen: c.destination_nopen,
            vehicle_nopol: j.vehicle_nopol,
            route_id: j.route_id
          },
          createdAt: startDate,
          updatedAt: new Date()
        };

        await db.collection('transaksi').replaceOne(
          { connote_code: c.connote_code },
          txDoc,
          { upsert: true }
        );

        // Tracking events
        const event1 = {
          event_id: `EVT-${c.connote_code}-01`,
          connote_code: c.connote_code,
          event_type: 'POSTING_LOKET',
          office_code: c.origin_nopen,
          office_name: c.origin_name,
          vehicle_code: j.vehicle_nopol,
          route_code: j.route_id,
          note: `Paket diterima di loket ${c.origin_name}.`,
          event_datetime: new Date(`${targetDate}T08:30:00.000+07:00`)
        };

        const event2 = {
          event_id: `EVT-${c.connote_code}-02`,
          connote_code: c.connote_code,
          event_type: 'LOADED',
          office_code: c.origin_nopen,
          office_name: c.origin_name,
          vehicle_code: j.vehicle_nopol,
          route_code: j.route_id,
          note: `Paket dimuat ke armada truk ${j.vehicle_nopol} (${j.route_id}) tujuan SPP Bandung.`,
          event_datetime: new Date(`${targetDate}T10:15:00.000+07:00`)
        };

        const event3 = {
          event_id: `EVT-${c.connote_code}-03`,
          connote_code: c.connote_code,
          event_type: isToday ? 'IN_TRANSIT' : 'ARRIVED_HUB',
          office_code: isToday ? c.origin_nopen : '40400',
          office_name: isToday ? `Dalam Perjalanan Truk ${j.vehicle_nopol}` : 'SPP Bandung (40400)',
          vehicle_code: j.vehicle_nopol,
          route_code: j.route_id,
          note: isToday 
            ? `Armada ${j.vehicle_nopol} sedang bergerak melintasi rute menuju SPP Bandung.`
            : `Paket telah tiba di SPP Bandung (Sentral Pengolahan Pos).`,
          event_datetime: new Date(`${targetDate}T12:45:00.000+07:00`)
        };

        await db.collection('tracking_events').replaceOne({ event_id: event1.event_id }, event1, { upsert: true });
        await db.collection('tracking_events').replaceOne({ event_id: event2.event_id }, event2, { upsert: true });
        await db.collection('tracking_events').replaceOne({ event_id: event3.event_id }, event3, { upsert: true });
      }
    }
    console.log(`   -> Perjalanan & transaksi untuk tanggal ${targetDate} berhasil disinkronkan.`);
  }

  // 6. CREATE INDEXES
  console.log('\n📌 6/6. Memastikan indeks MongoDB optimal...');
  async function safeIdx(col, spec, opt = {}) {
    try { await col.createIndex(spec, opt); } catch (e) {}
  }
  await safeIdx(db.collection('master_kantor'), { nopend: 1 });
  await safeIdx(db.collection('master_kendaraan'), { nopol: 1 });
  await safeIdx(db.collection('master_route_nopen'), { route_id: 1 });
  await safeIdx(db.collection('detail_route'), { route_id: 1, seq: 1 });
  await safeIdx(db.collection('route_journeys'), { journey_id: 1 });
  await safeIdx(db.collection('route_journeys'), { vehicle_nopol: 1, tanggal_operasional: 1 });
  await safeIdx(db.collection('transaksi'), { connote_code: 1 });
  await safeIdx(db.collection('tracking_events'), { connote_code: 1, event_datetime: 1 });

  console.log('\n🎉 SINKRONISASI DATABASE 100% SUKSES!');
  console.log('3 Armada Kendaraan telah diatur dengan masing-masing 6 kantor pos + terminal SPP Bandung (7 stops per rute).');
  process.exit(0);
}

runSync().catch(err => {
  console.error('❌ Error during sync:', err);
  process.exit(1);
});
