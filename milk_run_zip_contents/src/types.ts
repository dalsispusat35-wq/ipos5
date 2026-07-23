export interface Barang {
  resi: string;
  berat: number;
  tujuan: string;
}

export interface RuteTitik {
  id_kc: number;
  nama_titik: string;
  barang_naik: Barang[];
  barang_turun: string[]; // List of Resi codes that drop off here
}

export interface Mobil {
  nopol: string;
  kapasitas_maks: number;
}

export interface LogAktivitas {
  id: string;
  timestamp: string;
  nama_titik: string;
  barang_turun: string[];
  barang_naik: Barang[];
  berat_turun: number;
  berat_naik: number;
  total_berat_setelah: number;
}
