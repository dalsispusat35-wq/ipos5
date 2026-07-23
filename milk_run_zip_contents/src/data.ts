import { Mobil, RuteTitik } from './types';

export const mobilData: Mobil = {
  nopol: "D 1234 XXX",
  kapasitas_maks: 100 // 100 kg
};

export const ruteData: RuteTitik[] = [
  {
    id_kc: 0,
    nama_titik: "Gudang Pusat",
    barang_naik: [
      { resi: "RESI-001", berat: 30, tujuan: "KC Leuwigajah" },
      { resi: "RESI-002", berat: 20, tujuan: "KC Cimahi" },
      { resi: "RESI-003", berat: 25, tujuan: "KC Padalarang" }
    ],
    barang_turun: []
  },
  {
    id_kc: 1,
    nama_titik: "KC Cimahi",
    barang_naik: [
      { resi: "RESI-004", berat: 35, tujuan: "KC Batujajar" }
    ],
    barang_turun: ["RESI-002"]
  },
  {
    id_kc: 2,
    nama_titik: "KC Leuwigajah",
    barang_naik: [
      { resi: "RESI-005", berat: 20, tujuan: "KC Lembang" }
    ],
    barang_turun: ["RESI-001"]
  },
  {
    id_kc: 3,
    nama_titik: "KC Padalarang",
    barang_naik: [
      { resi: "RESI-006", berat: 15, tujuan: "KC Dago" },
      { resi: "RESI-007", berat: 20, tujuan: "KC Batujajar" }
    ],
    barang_turun: ["RESI-003"]
  },
  {
    id_kc: 4,
    nama_titik: "KC Batujajar",
    barang_naik: [
      { resi: "RESI-008", berat: 40, tujuan: "KC Cicaheum" }
    ],
    barang_turun: ["RESI-004", "RESI-007"]
  },
  {
    id_kc: 5,
    nama_titik: "KC Lembang",
    barang_naik: [
      { resi: "RESI-009", berat: 30, tujuan: "KC Cibiru" }
    ],
    barang_turun: ["RESI-005"]
  },
  {
    id_kc: 6,
    nama_titik: "KC Dago",
    barang_naik: [
      { resi: "RESI-010", berat: 20, tujuan: "KC Terakhir" }
    ],
    barang_turun: ["RESI-006"]
  },
  {
    id_kc: 7,
    nama_titik: "KC Cicaheum",
    barang_naik: [
      { resi: "RESI-011", berat: 15, tujuan: "KC Terakhir" }
    ],
    barang_turun: ["RESI-008"]
  },
  {
    id_kc: 8,
    nama_titik: "KC Cibiru",
    barang_naik: [
      { resi: "RESI-012", berat: 45, tujuan: "KC Terakhir" }
    ],
    barang_turun: ["RESI-009"]
  },
  {
    id_kc: 9,
    nama_titik: "KC Terakhir",
    barang_naik: [],
    barang_turun: ["RESI-010", "RESI-011", "RESI-012"]
  }
];
