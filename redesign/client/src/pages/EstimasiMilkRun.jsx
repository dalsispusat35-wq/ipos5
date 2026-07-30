import { useState } from 'react';
import { 
  Truck, MapPin, ArrowRight, RotateCcw, Package, Scale, Clock, 
  ChevronRight, Filter, Search, ArrowUpDown, CheckCircle2, AlertCircle,
  FileText, User, Mail, Phone, Building, Tag, ShieldCheck, Camera, PenTool, Globe
} from 'lucide-react';

// Custom Cargo Truck Component that renders cargo height based on weight
function CargoTruckVisual({ weight, maxWeight = 600, packagesCount, isSelected, onClick }) {
  // Height scale: 0 when empty, max 52px when loaded (natural proportion)
  const ratio = Math.min(1, weight / maxWeight);
  const boxHeight = weight === 0 ? 0 : Math.max(14, Math.round(ratio * 50));
  
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        transform: isSelected ? 'scale(1.06)' : 'scale(1)',
      }}
      title={`Beban: ${weight} kg | ${packagesCount} paket (Klik untuk detail manifest)`}
    >
      {/* Weight Badge above Truck */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: weight > 0 ? '#38bdf8' : 'rgba(255,255,255,0.4)',
        background: weight > 0 ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${weight > 0 ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.1)'}`,
        padding: '2px 8px',
        borderRadius: 12,
        marginBottom: 6,
        whiteSpace: 'nowrap'
      }}>
        {weight === 0 ? 'Truk Kosong' : `${weight} kg · ${packagesCount} pkt`}
      </div>

      {/* Dynamic SVG Truck with Cargo Box */}
      <div style={{ height: 85, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <svg width="110" height="85" viewBox="0 0 110 85" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground Line */}
          <line x1="5" y1="78" x2="105" y2="78" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="3 3" />
          
          {/* Wheels */}
          <circle cx="28" cy="72" r="7" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="28" cy="72" r="2.5" fill="#38bdf8" />
          
          <circle cx="75" cy="72" r="7" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="75" cy="72" r="2.5" fill="#38bdf8" />

          {/* Truck Chassis / Base Frame */}
          <rect x="12" y="66" x2="88" y2="70" width="76" height="4" rx="1" fill="#475569" />

          {/* Driver Cabin (Front Right) */}
          <path d="M 68 46 L 82 46 Q 88 46 90 52 L 94 62 Q 95 66 90 66 L 68 66 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          {/* Window */}
          <path d="M 72 49 L 81 49 Q 84 49 86 53 L 87 58 L 72 58 Z" fill="#bae6fd" opacity="0.85" />
          {/* Headlight */}
          <rect x="91" y="60" width="3" height="4" rx="1" fill="#fef08a" />

          {/* Cargo Box Mounted on Top (Dynamic Height) */}
          {boxHeight > 0 && (
            <g>
              {/* Main Cargo Box */}
              <rect 
                x="14" 
                y={66 - boxHeight} 
                width="53" 
                height={boxHeight} 
                rx="3" 
                fill={isSelected ? 'url(#boxGradientActive)' : 'url(#boxGradient)'}
                stroke={isSelected ? '#e8431f' : '#0284c7'} 
                strokeWidth="1.8" 
              />
              {/* Cargo Door Seam */}
              <line x1="40.5" y1={66 - boxHeight + 3} x2="40.5" y2={65} stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2" />
              {/* POS Indonesia Logo / Indicator Badge on Cargo */}
              {boxHeight >= 24 && (
                <rect x="22" y={66 - boxHeight + 6} width="14" height="10" rx="2" fill="rgba(232,67,31,0.85)" />
              )}
            </g>
          )}

          {/* Gradients */}
          <defs>
            <linearGradient id="boxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="boxGradientActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// Full 4 Dummy Routes Data
const DUMMY_ROUTES = [
  {
    id: 'RUTE-01',
    truckName: 'Mobil Box Isuzu Elf',
    plateNumber: 'D 8102 XZ',
    driver: 'Asep Sunandar',
    phone: '0812-9988-1234',
    maxCapacityKg: 800,
    totalPackages: 145,
    totalWeightKg: 420,
    status: 'EN_ROUTE',
    progressPct: 75,
    eta: '14:30 WIB',
    stops: [
      { 
        id: 'S0', name: 'Start (Truck Kosong)', code: 'AWAL', time: '08:00', weight: 0, packages: 0,
        manifest: null 
      },
      { 
        id: 'S1', name: 'KCU Cimahi', code: '40500', time: '09:15', weight: 120, packages: 45,
        manifest: {
          resi: 'POS405009821101', kodebooking: 'BK-2026-9812', kantorkirim: 'KCU Cimahi 40500', nopendkirim: '40500',
          namapengirim: 'PT Textile Jaya Cimahi', alamtpengirim: 'Jl. Raya Cimindi No. 45, Cimahi', alamatemailpengirim: 'logistics@textilejaya.co.id', kodepospengirim: '40511', telpengirim: '0812-3456-7890',
          namapenerima: 'Bpk. Budi Santoso', alamtpenerima: 'Jl. Asia Afrika No. 120, Bandung', alamtemailpenerima: 'budi.santoso@gmail.com', kodepospenerima: '40111', alamatpenerimadetail: 'Gedung Asia Afrika Lt. 3 Unit 302', telppenerima: '0813-9876-5432',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Sameday Express', hargabarang: 'Rp 2.500.000', berat: '120.0 kg', kodepelanggan: 'CUST-CIM-0089',
          beadasar: 'Rp 145.000', beakirim: 'Rp 165.000', finalsla: '24 Juli 2026 18:00 WIB', status: 'LOADED_IN_TRUCK', tanggalkirim: '24 Juli 2026 09:15 WIB', tanggaljatuhtempo: '24 Juli 2026 18:00 WIB', tanggalantaranpertama: '24 Juli 2026 14:00 WIB',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'DC Cimindi (Transit)', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: 'Satpam Gedung (Bpk. Agus)', keteranganiireg: 'NIL / Normal Transfer', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80', tandatangan: 'Digitally Verified by Driver Asep', kordinat: '-6.88412, 107.54129'
        }
      },
      { 
        id: 'S2', name: 'DC Cimindi', code: '40511', time: '10:45', weight: 280, packages: 100,
        manifest: {
          resi: 'POS405117765102', kodebooking: 'BK-2026-9813', kantorkirim: 'DC Cimindi 40511', nopendkirim: '40511',
          namapengirim: 'CV Garmen Mandiri', alamtpengirim: 'Jl. Gunung Batu No. 88, Cimahi', alamatemailpengirim: 'info@garmenmandiri.com', kodepospengirim: '40511', telpengirim: '0811-2233-4455',
          namapenerima: 'Ibu Ratna Dewi', alamtpenerima: 'Jl. Merdeka No. 45, Bandung', alamtemailpenerima: 'ratna.dewi@yahoo.com', kodepospenerima: '40113', alamatpenerimadetail: 'Ruko Merdeka Plaza Blok B-5', telppenerima: '0815-6677-8899',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Nextday', hargabarang: 'Rp 4.100.000', berat: '160.0 kg', kodepelanggan: 'CUST-CIM-0102',
          beadasar: 'Rp 210.000', beakirim: 'Rp 235.000', finalsla: '24 Juli 2026 17:00 WIB', status: 'IN_TRANSIT', tanggalkirim: '24 Juli 2026 10:45 WIB', tanggaljatuhtempo: '25 Juli 2026 12:00 WIB', tanggalantaranpertama: '-',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'Agp Rajawali (Menuju Lokasi)', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: '-', keteranganiireg: 'NIL', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=400&q=80', tandatangan: 'Verified by Gate Officer', kordinat: '-6.89123, 107.56234'
        }
      },
      { 
        id: 'S3', name: 'Agp Rajawali', code: '40184', time: '12:30', weight: 420, packages: 145,
        manifest: {
          resi: 'POS401845512103', kodebooking: 'BK-2026-9814', kantorkirim: 'Agp Rajawali 40184', nopendkirim: '40184',
          namapengirim: 'Toko Sparepart Utama', alamtpengirim: 'Jl. Rajawali Barat No. 12', alamatemailpengirim: 'admin@sparepartutama.co.id', kodepospengirim: '40184', telpengirim: '0878-1122-3344',
          namapenerima: 'PT Otto Motor Bandung', alamtpenerima: 'Jl. Soekarno Hatta No. 500, Bandung', alamtemailpenerima: 'procurement@ottomotor.co.id', kodepospenerima: '40286', alamatpenerimadetail: 'Kawasan Industri Soekarno Hatta Gudang C', telppenerima: '0821-3344-5566',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Reguler Logistik', hargabarang: 'Rp 6.800.000', berat: '140.0 kg', kodepelanggan: 'CUST-RAJ-0044',
          beadasar: 'Rp 180.000', beakirim: 'Rp 200.000', finalsla: '25 Juli 2026 15:00 WIB', status: 'DEPARTED_TO_SPP', tanggalkirim: '24 Juli 2026 12:30 WIB', tanggaljatuhtempo: '25 Juli 2026 17:00 WIB', tanggalantaranpertama: '-',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'Sedang Perjalanan ke SPP Bandung', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: '-', keteranganiireg: 'NIL', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=400&q=80', tandatangan: 'Digital Dispatch Sign', kordinat: '-6.91455, 107.58112'
        }
      },
      { 
        id: 'S4', name: 'SPP Bandung', code: '40400', time: '14:30 (EST)', weight: 420, packages: 145,
        manifest: null
      }
    ]
  },
  {
    id: 'RUTE-02',
    truckName: 'Mitsubishi Fuso Heavy',
    plateNumber: 'D 9341 YB',
    driver: 'Dadang Hidayat',
    phone: '0813-8877-6655',
    maxCapacityKg: 1200,
    totalPackages: 180,
    totalWeightKg: 580,
    status: 'LOADING',
    progressPct: 50,
    eta: '15:15 WIB',
    stops: [
      { id: 'S0', name: 'Start (Truck Kosong)', code: 'AWAL', time: '08:30', weight: 0, packages: 0, manifest: null },
      { 
        id: 'S1', name: 'KCU Cimahi', code: '40500', time: '09:45', weight: 200, packages: 60,
        manifest: {
          resi: 'POS405001199201', kodebooking: 'BK-2026-9901', kantorkirim: 'KCU Cimahi 40500', nopendkirim: '40500',
          namapengirim: 'PT Elektronik Maju', alamtpengirim: 'Jl. Industri Cimahi No. 10', alamatemailpengirim: 'sales@elektronikmaju.com', kodepospengirim: '40522', telpengirim: '0812-7766-5544',
          namapenerima: 'Toko Cahaya Listrik', alamtpenerima: 'Jl. ABC No. 89, Bandung', alamtemailpenerima: 'cahayalistrik@gmail.com', kodepospenerima: '40111', alamatpenerimadetail: 'Pertokoan ABC No. 89', telppenerima: '0818-0011-2233',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Express', hargabarang: 'Rp 8.500.000', berat: '200.0 kg', kodepelanggan: 'CUST-ELEK-001',
          beadasar: 'Rp 320.000', beakirim: 'Rp 350.000', finalsla: '24 Juli 2026 17:00 WIB', status: 'LOADED', tanggalkirim: '24 Juli 2026 09:45 WIB', tanggaljatuhtempo: '24 Juli 2026 18:00 WIB', tanggalantaranpertama: '-',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'Padalarang (Proses Muat)', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: '-', keteranganiireg: 'NIL', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80', tandatangan: 'Verified Dadang Hidayat', kordinat: '-6.84512, 107.47219'
        }
      },
      { 
        id: 'S2', name: 'Pos Padalarang', code: '40553', time: '11:30', weight: 430, packages: 130,
        manifest: {
          resi: 'POS405532288202', kodebooking: 'BK-2026-9902', kantorkirim: 'Pos Padalarang 40553', nopendkirim: '40553',
          namapengirim: 'Sentra Kerajinan Marmer', alamtpengirim: 'Jl. Raya Padalarang No. 230', alamatemailpengirim: 'marmer@padalarang.org', kodepospengirim: '40553', telpengirim: '0852-9988-7766',
          namapenerima: 'Gallery Seni Decor', alamtpenerima: 'Jl. Riau No. 112, Bandung', alamtemailpenerima: 'decor@galleryseni.com', kodepospenerima: '40115', alamatpenerimadetail: 'Riau Junction Lt 2', telppenerima: '0813-4455-6677',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Jumbo Cargo', hargabarang: 'Rp 12.000.000', berat: '230.0 kg', kodepelanggan: 'CUST-PAD-099',
          beadasar: 'Rp 450.000', beakirim: 'Rp 490.000', finalsla: '25 Juli 2026 12:00 WIB', status: 'IN_TRANSIT', tanggalkirim: '24 Juli 2026 11:30 WIB', tanggaljatuhtempo: '25 Juli 2026 14:00 WIB', tanggalantaranpertama: '-',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'Menuju Batujajar', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: '-', keteranganiireg: 'NIL', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=400&q=80', tandatangan: 'Verified Padalarang Chief', kordinat: '-6.83901, 107.48112'
        }
      },
      { 
        id: 'S3', name: 'Pos Batujajar', code: '40561', time: '13:30', weight: 580, packages: 180,
        manifest: {
          resi: 'POS405613377203', kodebooking: 'BK-2026-9903', kantorkirim: 'Pos Batujajar 40561', nopendkirim: '40561',
          namapengirim: 'PT Sepatu Nusantara', alamtpengirim: 'Jl. Batujajar No. 77', alamatemailpengirim: 'dispatch@sepatunusantara.id', kodepospengirim: '40561', telpengirim: '0819-3322-1100',
          namapenerima: 'Distributor Sepatu Asia', alamtpenerima: 'Jl. Cibadak No. 200, Bandung', alamtemailpenerima: 'asia@distributorsepatu.com', kodepospenerima: '40241', alamatpenerimadetail: 'Gudang Batujajar Utama', telppenerima: '0812-6655-4433',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Standard Cargo', hargabarang: 'Rp 5.400.000', berat: '150.0 kg', kodepelanggan: 'CUST-BAT-033',
          beadasar: 'Rp 200.000', beakirim: 'Rp 220.000', finalsla: '25 Juli 2026 16:00 WIB', status: 'DEPARTED', tanggalkirim: '24 Juli 2026 13:30 WIB', tanggaljatuhtempo: '25 Juli 2026 18:00 WIB', tanggalantaranpertama: '-',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'Batujajar Hub (Finish Load)', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: '-', keteranganiireg: 'NIL', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=400&q=80', tandatangan: 'Verified Driver Dadang', kordinat: '-6.87912, 107.50299'
        }
      },
      { id: 'S4', name: 'SPP Bandung', code: '40400', time: '15:15 (EST)', weight: 580, packages: 180, manifest: null }
    ]
  },
  {
    id: 'RUTE-03',
    truckName: 'Hino Dutro Light Box',
    plateNumber: 'D 7712 KA',
    driver: 'Agus Supriatna',
    phone: '0857-2211-4433',
    maxCapacityKg: 650,
    totalPackages: 110,
    totalWeightKg: 310,
    status: 'EN_ROUTE',
    progressPct: 80,
    eta: '14:00 WIB',
    stops: [
      { id: 'S0', name: 'Start (Truck Kosong)', code: 'AWAL', time: '07:45', weight: 0, packages: 0, manifest: null },
      { 
        id: 'S1', name: 'KCU Cimahi', code: '40500', time: '08:45', weight: 110, packages: 40,
        manifest: {
          resi: 'POS405008811301', kodebooking: 'BK-2026-9701', kantorkirim: 'KCU Cimahi 40500', nopendkirim: '40500',
          namapengirim: 'Agro Lembang Farm', alamtpengirim: 'Jl. Raya Lembang No. 15', alamatemailpengirim: 'orders@lembangfarm.co.id', kodepospengirim: '40391', telpengirim: '0812-4433-2211',
          namapenerima: 'Supermarket Segar Bandung', alamtpenerima: 'Jl. Setiabudi No. 180, Bandung', alamtemailpenerima: 'purchasing@segar.co.id', kodepospenerima: '40153', alamatpenerimadetail: 'Gedung Supermarket Segar Lt 1', telppenerima: '0811-9988-7766',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Sameday', hargabarang: 'Rp 1.800.000', berat: '110.0 kg', kodepelanggan: 'CUST-LEM-012',
          beadasar: 'Rp 120.000', beakirim: 'Rp 135.000', finalsla: '24 Juli 2026 15:00 WIB', status: 'IN_TRANSIT', tanggalkirim: '24 Juli 2026 08:45 WIB', tanggaljatuhtempo: '24 Juli 2026 16:00 WIB', tanggalantaranpertama: '-',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'Cisarua Transit', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: '-', keteranganiireg: 'NIL', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80', tandatangan: 'Verified Agus Supriatna', kordinat: '-6.81234, 107.61890'
        }
      },
      { 
        id: 'S2', name: 'Pos Lembang', code: '40391', time: '10:15', weight: 230, packages: 80,
        manifest: {
          resi: 'POS403919922302', kodebooking: 'BK-2026-9702', kantorkirim: 'Pos Lembang 40391', nopendkirim: '40391',
          namapengirim: 'Toko Souvenir Tangkuban', alamtpengirim: 'Jl. Raya Tangkuban Perahu No. 8', alamatemailpengirim: 'souvenir@tangkuban.com', kodepospengirim: '40391', telpengirim: '0813-1122-3344',
          namapenerima: 'Pusat Oleh-Oleh Bandung', alamtpenerima: 'Jl. Cihampelas No. 160, Bandung', alamtemailpenerima: 'oleholeh@bandung.co.id', kodepospenerima: '40131', alamatpenerimadetail: 'Cihampelas Walk Unit G-12', telppenerima: '0822-5566-7788',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Nextday', hargabarang: 'Rp 3.200.000', berat: '120.0 kg', kodepelanggan: 'CUST-LEM-088',
          beadasar: 'Rp 150.000', beakirim: 'Rp 170.000', finalsla: '24 Juli 2026 18:00 WIB', status: 'IN_TRANSIT', tanggalkirim: '24 Juli 2026 10:15 WIB', tanggaljatuhtempo: '25 Juli 2026 12:00 WIB', tanggalantaranpertama: '-',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'Setiabudi KM 8', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: '-', keteranganiireg: 'NIL', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=400&q=80', tandatangan: 'Verified Lembang Pos Manager', kordinat: '-6.81900, 107.62001'
        }
      },
      { 
        id: 'S3', name: 'Pos Cisarua', code: '40551', time: '12:00', weight: 310, packages: 110,
        manifest: {
          resi: 'POS405517733303', kodebooking: 'BK-2026-9703', kantorkirim: 'Pos Cisarua 40551', nopendkirim: '40551',
          namapengirim: 'Kerajinan Bambu Cisarua', alamtpengirim: 'Jl. Cisarua No. 44', alamatemailpengirim: 'bambu@cisarua.id', kodepospengirim: '40551', telpengirim: '0856-7788-9900',
          namapenerima: 'Hotel Savoy Homann', alamtpenerima: 'Jl. Asia Afrika No. 112, Bandung', alamtemailpenerima: 'procurement@savoyhomann.com', kodepospenerima: '40112', alamatpenerimadetail: 'Receiving Dock Savoy Homann', telppenerima: '0812-4455-6677',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Standard Cargo', hargabarang: 'Rp 2.900.000', berat: '80.0 kg', kodepelanggan: 'CUST-CIS-001',
          beadasar: 'Rp 110.000', beakirim: 'Rp 125.000', finalsla: '25 Juli 2026 10:00 WIB', status: 'DEPARTED', tanggalkirim: '24 Juli 2026 12:00 WIB', tanggaljatuhtempo: '25 Juli 2026 15:00 WIB', tanggalantaranpertama: '-',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'Tol Pasteur KM 2', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: '-', keteranganiireg: 'NIL', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=400&q=80', tandatangan: 'Verified Driver Agus', kordinat: '-6.84000, 107.55000'
        }
      },
      { id: 'S4', name: 'SPP Bandung', code: '40400', time: '14:00 (EST)', weight: 310, packages: 110, manifest: null }
    ]
  },
  {
    id: 'RUTE-04',
    truckName: 'Daihatsu Gran Max Box',
    plateNumber: 'D 8804 BM',
    driver: 'Rian Permana',
    phone: '0812-3344-5566',
    maxCapacityKg: 500,
    totalPackages: 125,
    totalWeightKg: 310.5,
    status: 'SCHEDULED',
    progressPct: 30,
    eta: '16:00 WIB',
    stops: [
      { id: 'S0', name: 'Start (Truck Kosong)', code: 'AWAL', time: '10:00', weight: 0, packages: 0, manifest: null },
      { 
        id: 'S1', name: 'KCU Cimahi', code: '40500', time: '11:00', weight: 130, packages: 50,
        manifest: {
          resi: 'POS405006644401', kodebooking: 'BK-2026-9601', kantorkirim: 'KCU Cimahi 40500', nopendkirim: '40500',
          namapengirim: 'Konveksi Hijab Cimahi', alamtpengirim: 'Jl. Cibeureum No. 99, Cimahi', alamatemailpengirim: 'hijab@konveksicimahi.com', kodepospengirim: '40535', telpengirim: '0813-8899-0011',
          namapenerima: 'Boutique Hijab Premium', alamtpenerima: 'Jl. Banda No. 30, Bandung', alamtemailpenerima: 'orders@hijabpremium.id', kodepospenerima: '40115', alamatpenerimadetail: 'Store Front Ruko Banda No 30', telppenerima: '0817-2233-4455',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Sameday', hargabarang: 'Rp 4.500.000', berat: '130.0 kg', kodepelanggan: 'CUST-CIM-099',
          beadasar: 'Rp 140.000', beakirim: 'Rp 155.000', finalsla: '24 Juli 2026 17:00 WIB', status: 'IN_TRANSIT', tanggalkirim: '24 Juli 2026 11:00 WIB', tanggaljatuhtempo: '24 Juli 2026 18:00 WIB', tanggalantaranpertama: '-',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'Soreang Hub', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: '-', keteranganiireg: 'NIL', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80', tandatangan: 'Verified Rian Permana', kordinat: '-6.89200, 107.57100'
        }
      },
      { 
        id: 'S2', name: 'Pos Soreang', code: '40911', time: '13:00', weight: 235.5, packages: 95,
        manifest: {
          resi: 'POS409115533402', kodebooking: 'BK-2026-9602', kantorkirim: 'Pos Soreang 40911', nopendkirim: '40911',
          namapengirim: 'Sentra Sepatu Cibaduyut', alamtpengirim: 'Jl. Raya Soreang No. 50', alamatemailpengirim: 'sepatu@soreang.com', kodepospengirim: '40911', telpengirim: '0812-7788-9900',
          namapenerima: 'Toko Sepatu Gaya', alamtpenerima: 'Jl. Kepatihan No. 12, Bandung', alamtemailpenerima: 'gaya@sepatubandung.com', kodepospenerima: '40241', alamatpenerimadetail: 'Kings Shopping Centre Lt 2', telppenerima: '0819-0011-2244',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Nextday', hargabarang: 'Rp 3.800.000', berat: '105.5 kg', kodepelanggan: 'CUST-SOR-005',
          beadasar: 'Rp 135.000', beakirim: 'Rp 150.000', finalsla: '25 Juli 2026 14:00 WIB', status: 'IN_TRANSIT', tanggalkirim: '24 Juli 2026 13:00 WIB', tanggaljatuhtempo: '25 Juli 2026 16:00 WIB', tanggalantaranpertama: '-',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'Banjaran POS', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: '-', keteranganiireg: 'NIL', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=400&q=80', tandatangan: 'Verified Soreang Officer', kordinat: '-7.02900, 107.51800'
        }
      },
      { 
        id: 'S3', name: 'Pos Banjaran', code: '40377', time: '14:30', weight: 310.5, packages: 125,
        manifest: {
          resi: 'POS403774422403', kodebooking: 'BK-2026-9603', kantorkirim: 'Pos Banjaran 40377', nopendkirim: '40377',
          namapengirim: 'Koperasi Produksi Teh', alamtpengirim: 'Jl. Raya Banjaran No. 100', alamatemailpengirim: 'teh@banjaran.co.id', kodepospengirim: '40377', telpengirim: '0852-1122-3344',
          namapenerima: 'Eksportir Teh Nusantara', alamtpenerima: 'Jl. Pasirkaliki No. 90, Bandung', alamtemailpenerima: 'export@tehnusantara.com', kodepospenerima: '40171', alamatpenerimadetail: 'Gedung Pasirkaliki Lt. 4', telppenerima: '0812-9900-1122',
          nopentujuan: '40000', regionaltujuan: 'Regional 3 Jawa Barat', kprktujuan: 'KPRK Bandung 40000', layanan: 'Pos Reguler', hargabarang: 'Rp 2.100.000', berat: '75.0 kg', kodepelanggan: 'CUST-BAN-011',
          beadasar: 'Rp 95.000', beakirim: 'Rp 110.000', finalsla: '25 Juli 2026 18:00 WIB', status: 'DEPARTED', tanggalkirim: '24 Juli 2026 14:30 WIB', tanggaljatuhtempo: '26 Juli 2026 12:00 WIB', tanggalantaranpertama: '-',
          kantorasal: 'KCU Cimahi 40500', lokasiterakhir: 'Jl. Raya Kopo (In Transit)', kantortujuan: 'SPP Bandung 40400', keteranganpenerima: '-', keteranganiireg: 'NIL', keterangangagalantar: '-',
          photo1: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=400&q=80', photo2: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=400&q=80', tandatangan: 'Verified Driver Rian', kordinat: '-7.04500, 107.58900'
        }
      },
      { id: 'S4', name: 'SPP Bandung', code: '40400', time: '16:00 (EST)', weight: 310.5, packages: 125, manifest: null }
    ]
  }
];

export default function EstimasiMilkRun() {
  const [routes, setRoutes] = useState(DUMMY_ROUTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('PLATE_ASC'); // PLATE_ASC, WEIGHT_DESC, PACKAGES_DESC, ETA_ASC
  const [selectedManifest, setSelectedManifest] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedStopId, setSelectedStopId] = useState(null);

  // Sorting and filtering handler
  const getFilteredAndSortedRoutes = () => {
    let result = [...routes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.plateNumber.toLowerCase().includes(q) || 
        r.truckName.toLowerCase().includes(q) || 
        r.driver.toLowerCase().includes(q) ||
        r.stops.some(s => s.name.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'PLATE_ASC') return a.plateNumber.localeCompare(b.plateNumber);
      if (sortBy === 'WEIGHT_DESC') return b.totalWeightKg - a.totalWeightKg;
      if (sortBy === 'PACKAGES_DESC') return b.totalPackages - a.totalPackages;
      if (sortBy === 'PROGRESS_DESC') return b.progressPct - a.progressPct;
      return 0;
    });

    return result;
  };

  const handleStopClick = (routeId, stop) => {
    setSelectedRouteId(routeId);
    setSelectedStopId(stop.id);
    if (stop.manifest) {
      setSelectedManifest(stop.manifest);
    } else {
      setSelectedManifest(null);
    }
  };

  const filteredRoutes = getFilteredAndSortedRoutes();
  const grandTotalPackages = routes.reduce((acc, r) => acc + r.totalPackages, 0);
  const grandTotalWeight = routes.reduce((acc, r) => acc + r.totalWeightKg, 0).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#fff' }}>
      
      {/* Top Header Card */}
      <div 
        className="glass-card-solid gradient-border-card" 
        style={{ padding: '22px 26px', background: 'linear-gradient(135deg, rgba(13,27,56,0.95), rgba(6,13,31,0.95))' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div 
                style={{ 
                  width: 34, 
                  height: 34, 
                  borderRadius: 9, 
                  background: 'rgba(56,189,248,0.15)', 
                  border: '1px solid rgba(56,189,248,0.3)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <Truck size={20} color="#38bdf8" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                Estimasi Milk Run (Visualisasi Kargo Truk & Manifest 4 Rute)
              </h2>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
              <span>Total Armada Berjalan: <strong style={{ color: '#38bdf8' }}>4 Mobil Box</strong></span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span>Total Beban: <strong style={{ color: '#34d399' }}>{grandTotalWeight} Kg</strong></span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span>Total Paket Muatan: <strong style={{ color: '#fbbf24' }}>{grandTotalPackages} Paket</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Filter */}
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                className="input-navy"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Plat / Mobil / Stop..."
                style={{ paddingLeft: 30, fontSize: 12.5 }}
              />
            </div>

            {/* Sorting Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
              <ArrowUpDown size={14} color="#38bdf8" />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>Urutkan:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="PLATE_ASC" style={{ background: '#0b1830' }}>Plat Mobil (A - Z)</option>
                <option value="WEIGHT_DESC" style={{ background: '#0b1830' }}>Total Berat (Terberat)</option>
                <option value="PACKAGES_DESC" style={{ background: '#0b1830' }}>Total Paket (Terbanyak)</option>
                <option value="PROGRESS_DESC" style={{ background: '#0b1830' }}>Progress SLA (Terjauh)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4 Routes Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {filteredRoutes.map((route) => {
          return (
            <div 
              key={route.id}
              className="glass-card"
              style={{
                padding: '20px 24px',
                borderRadius: 14,
                background: 'rgba(10,22,46,0.75)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
            >
              {/* Route Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(232,67,31,0.2), rgba(232,67,31,0.05))',
                    border: '1px solid rgba(232,67,31,0.3)',
                    fontWeight: 800,
                    fontSize: 14,
                    color: '#ff6b4a',
                    letterSpacing: '0.05em'
                  }}>
                    {route.plateNumber}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                      {route.truckName} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>({route.driver})</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                      Kapasitas Maksimal: <strong style={{ color: '#cbd5e1' }}>{route.maxCapacityKg} Kg</strong>
                    </div>
                  </div>
                </div>

                {/* Summary Badges: Total Paket, Total Berat, ETA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', padding: '5px 12px', borderRadius: 8 }}>
                    <Package size={14} color="#38bdf8" />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Total Paket:</span>
                    <strong style={{ fontSize: 13, color: '#38bdf8' }}>{route.totalPackages} pkt</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', padding: '5px 12px', borderRadius: 8 }}>
                    <Scale size={14} color="#34d399" />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Total Berat:</span>
                    <strong style={{ fontSize: 13, color: '#34d399' }}>{route.totalWeightKg} Kg</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', padding: '5px 12px', borderRadius: 8 }}>
                    <Clock size={14} color="#fbbf24" />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Estimasi (ETA):</span>
                    <strong style={{ fontSize: 13, color: '#fbbf24' }}>{route.eta}</strong>
                  </div>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  <span>Progress Perjalanan Milk Run</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{route.progressPct}% Selesai</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${route.progressPct}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #0284c7, #38bdf8)', 
                      borderRadius: 3,
                      transition: 'width 0.5s ease'
                    }} 
                  />
                </div>
              </div>

              {/* Horizontal Route Journey Visualiser with Custom Dynamic Box Truck Graphics */}
              <div style={{ overflowX: 'auto', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', minWidth: 680, justifyContent: 'space-between', padding: '0 10px' }}>
                  {route.stops.map((stop, idx) => {
                    const isSelected = selectedRouteId === route.id && selectedStopId === stop.id;
                    const isFirstStop = idx === 0;

                    return (
                      <div key={stop.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        
                        {/* Stop Node Component */}
                        <div 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            position: 'relative',
                            minWidth: 120
                          }}
                        >
                          {/* Visual Truck Graphic */}
                          <CargoTruckVisual 
                            weight={stop.weight}
                            maxWeight={route.maxCapacityKg}
                            packagesCount={stop.packages}
                            isSelected={isSelected}
                            onClick={() => handleStopClick(route.id, stop)}
                          />

                          {/* Stop Node Circle & Label */}
                          <div 
                            onClick={() => handleStopClick(route.id, stop)}
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              cursor: 'pointer',
                              marginTop: 8
                            }}
                          >
                            <div 
                              style={{ 
                                width: 28, 
                                height: 28, 
                                borderRadius: '50%', 
                                background: isSelected ? '#e8431f' : stop.weight > 0 ? '#0284c7' : 'rgba(255,255,255,0.1)',
                                border: `2px solid ${isSelected ? '#ff8c66' : stop.weight > 0 ? '#38bdf8' : 'rgba(255,255,255,0.2)'}`,
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 800,
                                color: '#fff',
                                boxShadow: isSelected ? '0 0 12px rgba(232,67,31,0.6)' : 'none'
                              }}
                            >
                              {idx}
                            </div>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', marginTop: 4, textAlign: 'center' }}>
                              {stop.name}
                            </span>
                            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>
                              {stop.time}
                            </span>
                          </div>
                        </div>

                        {/* Route Line Connector between stops */}
                        {idx < route.stops.length - 1 && (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 4px', marginBottom: 20 }}>
                            <div style={{ height: 2, flex: 1, background: idx < 2 ? '#38bdf8' : 'rgba(255,255,255,0.15)' }} />
                            <ChevronRight size={14} color={idx < 2 ? '#38bdf8' : 'rgba(255,255,255,0.2)'} style={{ marginLeft: -4 }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', textAlign: 'right', fontStyle: 'italic' }}>
                💡 Klik pada gambar truk / node stop di atas untuk melihat detail data manifest (40 Field Lengkap).
              </div>
            </div>
          );
        })}
      </div>

      {/* Manifest Detail Modal (40 Fields Exact Format) */}
      {selectedManifest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3,8,22,0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }}>
          <div 
            className="glass-card-solid"
            style={{
              width: '100%',
              maxWidth: 900,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 16,
              background: '#09152e',
              border: '1px solid rgba(56,189,248,0.3)',
              padding: 28,
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Detail Data Manifest Kiriman (40 Field)
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '4px 0 0' }}>
                  Resi: {selectedManifest.resi}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedManifest(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '6px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Tutup (Esc)
              </button>
            </div>

            {/* Grid Container for all 40 Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Section 1: Informasi Dasar & Resi */}
              <div>
                <h4 style={{ fontSize: 13, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={15} /> 1. Informasi Identifikasi Kiriman
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  <FieldCard label="1. Resi" value={selectedManifest.resi} highlight />
                  <FieldCard label="2. Kode Booking" value={selectedManifest.kodebooking} />
                  <FieldCard label="3. Kantor Kirim" value={selectedManifest.kantorkirim} />
                  <FieldCard label="4. No Pend Kirim" value={selectedManifest.nopendkirim} />
                  <FieldCard label="19. Layanan" value={selectedManifest.layanan} highlight />
                  <FieldCard label="22. Kode Pelanggan" value={selectedManifest.kodepelanggan} />
                  <FieldCard label="26. Status" value={selectedManifest.status} badge="emerald" />
                  <FieldCard label="31. Lokasi Terakhir" value={selectedManifest.lokasiterakhir} />
                </div>
              </div>

              {/* Section 2: Data Pengirim & Penerima */}
              <div>
                <h4 style={{ fontSize: 13, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={15} /> 2. Data Pengirim & Penerima Lengkap
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Pengirim Box */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: 12, marginBottom: 8 }}>DOKUMEN PENGIRIM</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <FieldRow label="5. Nama Pengirim" value={selectedManifest.namapengirim} />
                      <FieldRow label="6. Alamat Pengirim" value={selectedManifest.alamtpengirim} />
                      <FieldRow label="7. Email Pengirim" value={selectedManifest.alamatemailpengirim} />
                      <FieldRow label="8. Kode Pos Pengirim" value={selectedManifest.kodepospengirim} />
                      <FieldRow label="9. Telp Pengirim" value={selectedManifest.telpengirim} />
                      <FieldRow label="30. Kantor Asal" value={selectedManifest.kantorasal} />
                    </div>
                  </div>

                  {/* Penerima Box */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#34d399', fontSize: 12, marginBottom: 8 }}>DOKUMEN PENERIMA</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <FieldRow label="10. Nama Penerima" value={selectedManifest.namapenerima} />
                      <FieldRow label="11. Alamat Penerima" value={selectedManifest.alamtpenerima} />
                      <FieldRow label="12. Email Penerima" value={selectedManifest.alamtemailpenerima} />
                      <FieldRow label="13. Kode Pos Penerima" value={selectedManifest.kodepospenerima} />
                      <FieldRow label="14. Detail Alamat Penerima" value={selectedManifest.alamatpenerimadetail} />
                      <FieldRow label="15. Telp Penerima" value={selectedManifest.telppenerima} />
                      <FieldRow label="32. Kantor Tujuan" value={selectedManifest.kantortujuan} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Destinasi & Keuangan */}
              <div>
                <h4 style={{ fontSize: 13, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building size={15} /> 3. Destinasi Regional & Keuangan
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  <FieldCard label="16. No Pend Tujuan" value={selectedManifest.nopentujuan} />
                  <FieldCard label="17. Regional Tujuan" value={selectedManifest.regionaltujuan} />
                  <FieldCard label="18. KPRK Tujuan" value={selectedManifest.kprktujuan} />
                  <FieldCard label="20. Harga Barang" value={selectedManifest.hargabarang} />
                  <FieldCard label="21. Berat Paket" value={selectedManifest.berat} highlight />
                  <FieldCard label="23. Bea Dasar" value={selectedManifest.beadasar} />
                  <FieldCard label="24. Bea Kirim" value={selectedManifest.beakirim} />
                </div>
              </div>

              {/* Section 4: SLA, Tanggal & Keterangan */}
              <div>
                <h4 style={{ fontSize: 13, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} /> 4. SLA, Log Tanggal & Keterangan Serah Terima
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  <FieldCard label="25. Final SLA" value={selectedManifest.finalsla} highlight />
                  <FieldCard label="27. Tanggal Kirim" value={selectedManifest.tanggalkirim} />
                  <FieldCard label="28. Tanggal Jatuh Tempo" value={selectedManifest.tanggaljatuhtempo} />
                  <FieldCard label="29. Tgl Antaran Pertam" value={selectedManifest.tanggalantaranpertama} />
                  <FieldCard label="34. Ket. Penerima" value={selectedManifest.keteranganpenerima} />
                  <FieldCard label="35. Ket. Irreguler" value={selectedManifest.keteranganiireg} />
                  <FieldCard label="36. Ket. Gagal Antar" value={selectedManifest.keterangangagalantar} />
                  <FieldCard label="40. Koordinat GPS" value={selectedManifest.kordinat} />
                </div>
              </div>

              {/* Section 5: Bukti Foto & Tanda Tangan */}
              <div>
                <h4 style={{ fontSize: 13, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Camera size={15} /> 5. Bukti Lampiran Visual (Photo1, Photo2, TTD)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  {/* Photo 1 */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>37. Photo1 (Paket FISIK)</div>
                    <img src={selectedManifest.photo1} alt="Photo 1" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }} />
                  </div>
                  {/* Photo 2 */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>38. Photo2 (Manifest Barcode)</div>
                    <img src={selectedManifest.photo2} alt="Photo 2" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }} />
                  </div>
                  {/* TTD Digital */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>39. Tanda Tangan (Verified TTD)</div>
                    <div style={{ height: 75, background: 'rgba(0,0,0,0.4)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px stroke rgba(255,255,255,0.1)' }}>
                      <span style={{ fontFamily: 'cursive', fontSize: 18, color: '#38bdf8' }}>{selectedManifest.namapengirim.split(' ')[0]} Verified</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#34d399', textAlign: 'center', fontWeight: 600 }}>
                      ✓ {selectedManifest.tandatangan}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper Card Component for 40 fields
function FieldCard({ label, value, highlight, badge }) {
  return (
    <div style={{
      background: highlight ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${highlight ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.07)'}`,
      padding: '8px 12px',
      borderRadius: 8
    }}>
      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: highlight ? '#38bdf8' : '#fff', fontWeight: highlight ? 700 : 500, marginTop: 2, wordBreak: 'break-word' }}>
        {value || '-'}
      </div>
    </div>
  );
}

function FieldRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}:</span>
      <span style={{ color: '#fff', fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{value || '-'}</span>
    </div>
  );
}
