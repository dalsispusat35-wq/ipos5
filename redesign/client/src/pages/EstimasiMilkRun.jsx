import { useState, useEffect } from 'react';
import { 
  Truck, MapPin, ArrowRight, RotateCcw, Package, Scale, Clock, 
  ChevronRight, ChevronLeft, Filter, Search, ArrowUpDown, CheckCircle2, AlertCircle,
  FileText, User, Mail, Phone, Building, Tag, ShieldCheck, Camera, PenTool, Globe, Play, Pause, RefreshCw,
  Info
} from 'lucide-react';

// Embedded Responsive & Animation CSS Styles
const RESPONSIVE_STYLES = `
  @keyframes wheelSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .spinning-wheel {
    animation: wheelSpin 1.2s linear infinite;
    transform-origin: center;
  }
  .truck-hover-card {
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.25s ease;
  }
  .truck-hover-card:hover {
    transform: translateY(-4px) scale(1.03);
  }
  .filter-pill {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;
  }
  .filter-pill.active {
    background: #0b2e8a;
    border-color: #0284c7;
    color: #ffffff;
  }
  .filter-pill.inactive {
    background: #f8fafc;
    border-color: #e2e8f0;
    color: #64748b;
  }
  .filter-pill.inactive:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
  @media (max-width: 768px) {
    .responsive-header-row {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    .responsive-controls-group {
      width: 100% !important;
      justify-content: space-between !important;
    }
    .responsive-modal-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

// Custom Cargo Truck Component that renders cargo height based on weight with animations
function CargoTruckVisual({ weight, maxWeight = 600, packagesCount, isSelected, isMoving, onClick, currentStopName }) {
  const ratio = Math.min(1, weight / maxWeight);
  const boxHeight = weight === 0 ? 0 : Math.max(14, Math.round(ratio * 50));
  
  return (
    <div 
      onClick={onClick}
      className="truck-hover-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
      }}
      title={`Beban Aktif: ${weight} kg | ${packagesCount} paket di ${currentStopName} (Klik untuk detail manifest)`}
    >
      {/* Weight & Status Badge Floating Above the Single Truck */}
      <div style={{
        fontSize: 11.5,
        fontWeight: 800,
        color: weight > 0 ? '#0b2e8a' : '#64748b',
        background: '#ffffff',
        border: `1.5px solid ${weight > 0 ? '#0284c7' : '#e2e8f0'}`,
        padding: '3px 12px',
        borderRadius: 14,
        marginBottom: 4,
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        {weight === 0 ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Truck size={12} color="#64748b" /> Truk Kosong (Awal Rute)
          </span>
        ) : (
          <>
            <span style={{ 
              width: 7, 
              height: 7, 
              borderRadius: '50%', 
              background: isMoving ? '#16a34a' : '#0284c7', 
            }} />
            <span>{weight} kg · {packagesCount} pkt</span>
          </>
        )}
      </div>

      {/* Dynamic SVG Truck Graphic */}
      <div style={{ height: 85, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <svg width="115" height="85" viewBox="0 0 115 85" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground Line Shadow */}
          <ellipse cx="55" cy="77" rx="45" ry="3.5" fill="rgba(0,0,0,0.08)" />

          {/* Animated Wheels */}
          <g className={isMoving ? 'spinning-wheel' : ''} style={{ transformOrigin: '30px 71px' }}>
            <circle cx="30" cy="71" r="7.5" fill="#0f172a" stroke="#0284c7" strokeWidth="2.5" />
            <circle cx="30" cy="71" r="3" fill="#0284c7" />
            <line x1="30" y1="63.5" x2="30" y2="78.5" stroke="#0284c7" strokeWidth="1" />
            <line x1="22.5" y1="71" x2="37.5" y2="71" stroke="#0284c7" strokeWidth="1" />
          </g>

          <g className={isMoving ? 'spinning-wheel' : ''} style={{ transformOrigin: '80px 71px' }}>
            <circle cx="80" cy="71" r="7.5" fill="#0f172a" stroke="#0284c7" strokeWidth="2.5" />
            <circle cx="80" cy="71" r="3" fill="#0284c7" />
            <line x1="80" y1="63.5" x2="80" y2="78.5" stroke="#0284c7" strokeWidth="1" />
            <line x1="72.5" y1="71" x2="87.5" y2="71" stroke="#0284c7" strokeWidth="1" />
          </g>

          {/* Truck Chassis / Base Frame */}
          <rect x="14" y="65" width="78" height="4" rx="1" fill="#64748b" />

          {/* Driver Cabin (Front Right) */}
          <path d="M 72 44 L 86 44 Q 92 44 94 50 L 98 60 Q 99 65 94 65 L 72 65 Z" fill="#0b2e8a" stroke="#0284c7" strokeWidth="1.5" />
          {/* Cabin Window */}
          <path d="M 76 47 L 85 47 Q 88 47 90 51 L 91 56 L 76 56 Z" fill="#bae6fd" opacity="0.9" />
          {/* Headlight */}
          <rect x="95" y="58" width="3" height="4" rx="1" fill="#f59e0b" />

          {/* Cargo Box Mounted on Top */}
          {boxHeight > 0 && (
            <g>
              <rect 
                x="16" 
                y={65 - boxHeight} 
                width="55" 
                height={boxHeight} 
                rx="3" 
                fill="#0284c7"
                stroke="#0b2e8a" 
                strokeWidth="1.8" 
              />
              <line x1="43.5" y1={65 - boxHeight + 3} x2="43.5" y2={64} stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 2" />
              {boxHeight >= 22 && (
                <g>
                  <rect x="24" y={65 - boxHeight + 6} width="15" height="10" rx="2" fill="#e8431f" />
                  <text x="31.5" y={65 - boxHeight + 13} fontSize="6" fontWeight="bold" fill="#ffffff" textAnchor="middle">POS</text>
                </g>
              )}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

// 4 Routes Data
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
      { id: 'S0', name: 'Start (Truck Kosong)', code: 'AWAL', time: '08:00', weight: 0, packages: 0, manifest: null },
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
      { id: 'S4', name: 'SPP Bandung', code: '40400', time: '14:30 (EST)', weight: 420, packages: 145, manifest: null }
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
  const [routes] = useState(DUMMY_ROUTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('PLATE_ASC');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedManifest, setSelectedManifest] = useState(null);

  const [activeStopMap, setActiveStopMap] = useState({
    'RUTE-01': 3,
    'RUTE-02': 2,
    'RUTE-03': 3,
    'RUTE-04': 1
  });

  const [playingRouteId, setPlayingRouteId] = useState(null);
  const [isGlobalPlaying, setIsGlobalPlaying] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isGlobalPlaying || playingRouteId) {
      interval = setInterval(() => {
        setActiveStopMap(prev => {
          const nextState = { ...prev };
          routes.forEach(r => {
            if (isGlobalPlaying || playingRouteId === r.id) {
              const curIdx = nextState[r.id] || 0;
              const nextIdx = (curIdx + 1) % r.stops.length;
              nextState[r.id] = nextIdx;
            }
          });
          return nextState;
        });
      }, 2200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGlobalPlaying, playingRouteId, routes]);

  const getFilteredAndSortedRoutes = () => {
    let result = [...routes];

    if (statusFilter !== 'ALL') {
      result = result.filter(r => r.status === statusFilter);
    }

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

  const handleSetStopIndex = (routeId, stopIndex, stop, openModal = false) => {
    setActiveStopMap(prev => ({ ...prev, [routeId]: stopIndex }));
    if (openModal && stop && stop.manifest) {
      setSelectedManifest(stop.manifest);
    }
  };

  const toggleRoutePlay = (routeId) => {
    if (playingRouteId === routeId) {
      setPlayingRouteId(null);
    } else {
      setIsGlobalPlaying(false);
      setPlayingRouteId(routeId);
    }
  };

  const toggleGlobalPlay = () => {
    if (isGlobalPlaying) {
      setIsGlobalPlaying(false);
    } else {
      setPlayingRouteId(null);
      setIsGlobalPlaying(true);
    }
  };

  const filteredRoutes = getFilteredAndSortedRoutes();
  const grandTotalPackages = routes.reduce((acc, r) => acc + r.totalPackages, 0);
  const grandTotalWeight = routes.reduce((acc, r) => acc + r.totalWeightKg, 0).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#0f172a' }}>
      <style>{RESPONSIVE_STYLES}</style>

      {/* Top Header Card */}
      <div className="spatial-card" style={{ padding: '22px 26px' }}>
        <div className="responsive-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div 
                style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 10, 
                  background: '#e0f2fe', 
                  border: '1px solid #bae6fd',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <Truck size={20} color="#0284c7" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Simulasi Milk Run & Telemetri Truk (4 Rute)
              </h2>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
              <span>Total Armada: <strong style={{ color: '#0b2e8a' }}>4 Mobil Box</strong></span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span>Total Beban: <strong style={{ color: '#16a34a' }}>{grandTotalWeight} Kg</strong></span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span>Total Muatan: <strong style={{ color: '#d97706' }}>{grandTotalPackages} Paket</strong></span>
            </div>
          </div>

          {/* Interactive Global Simulation & Search Controls */}
          <div className="responsive-controls-group" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* Global Auto Simulation Play/Pause Button */}
            <button
              onClick={toggleGlobalPlay}
              className={isGlobalPlaying ? "btn-ghost" : "btn-primary"}
              style={{
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isGlobalPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isGlobalPlaying ? 'Jeda Simulasi' : 'Simulasi Jalan Otomatis'}</span>
            </button>

            {/* Search Filter */}
            <div style={{ position: 'relative', width: 200 }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Plat / Mobil..."
                style={{ paddingLeft: 30, fontSize: 12.5, width: '100%', height: 38, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Sorting Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <ArrowUpDown size={14} color="#0284c7" />
              <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>Urutkan:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0f172a',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="PLATE_ASC">Plat Mobil (A - Z)</option>
                <option value="WEIGHT_DESC">Total Berat (Terberat)</option>
                <option value="PACKAGES_DESC">Total Paket (Terbanyak)</option>
                <option value="PROGRESS_DESC">Progress SLA (Terjauh)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Interactive Filter Pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <button onClick={() => setStatusFilter('ALL')} className={`filter-pill ${statusFilter === 'ALL' ? 'active' : 'inactive'}`}>
            Semua Rute ({routes.length})
          </button>
          <button onClick={() => setStatusFilter('EN_ROUTE')} className={`filter-pill ${statusFilter === 'EN_ROUTE' ? 'active' : 'inactive'}`}>
            Berjalan / En Route ({routes.filter(r => r.status === 'EN_ROUTE').length})
          </button>
          <button onClick={() => setStatusFilter('LOADING')} className={`filter-pill ${statusFilter === 'LOADING' ? 'active' : 'inactive'}`}>
            Proses Muat / Loading ({routes.filter(r => r.status === 'LOADING').length})
          </button>
          <button onClick={() => setStatusFilter('SCHEDULED')} className={`filter-pill ${statusFilter === 'SCHEDULED' ? 'active' : 'inactive'}`}>
            Terjadwal / Scheduled ({routes.filter(r => r.status === 'SCHEDULED').length})
          </button>
        </div>
      </div>

      {/* Main 4 Routes Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {filteredRoutes.map((route) => {
          const currentStopIndex = activeStopMap[route.id] !== undefined ? activeStopMap[route.id] : 0;
          const currentStop = route.stops[currentStopIndex] || route.stops[0];
          const isRouteSimulating = isGlobalPlaying || playingRouteId === route.id;
          
          const truckPercentPos = (currentStopIndex / (route.stops.length - 1)) * 82 + 9;

          return (
            <div 
              key={route.id}
              className="spatial-card"
              style={{
                padding: '22px 26px',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 18
              }}
            >
              {/* Route Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-workspace)',
                    border: '1px solid var(--border-light)',
                    fontWeight: 900,
                    fontSize: 14.5,
                    color: 'var(--primary-blue)',
                    letterSpacing: '0.05em',
                    fontFamily: 'monospace'
                  }}>
                    {route.plateNumber}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {route.truckName} <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>({route.driver})</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Kapasitas Maksimal: <strong style={{ color: 'var(--text-primary)' }}>{route.maxCapacityKg} Kg</strong>
                    </div>
                  </div>
                </div>

                {/* Summary Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-workspace)', border: '1px solid var(--border-light)', padding: '5px 12px', borderRadius: 8 }}>
                    <Package size={14} color="#0284c7" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Paket:</span>
                    <strong style={{ fontSize: 13, color: 'var(--primary-blue)' }}>{route.totalPackages} pkt</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-workspace)', border: '1px solid var(--border-light)', padding: '5px 12px', borderRadius: 8 }}>
                    <Scale size={14} color="#10b981" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Berat:</span>
                    <strong style={{ fontSize: 13, color: '#10b981' }}>{route.totalWeightKg} Kg</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-workspace)', border: '1px solid var(--border-light)', padding: '5px 12px', borderRadius: 8 }}>
                    <Clock size={14} color="#f59e0b" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Estimasi:</span>
                    <strong style={{ fontSize: 13, color: '#f59e0b' }}>{route.eta}</strong>
                  </div>

                  {/* Step Buttons */}
                  <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
                    <button
                      onClick={() => toggleRoutePlay(route.id)}
                      className={isRouteSimulating ? "btn-primary" : "btn-ghost"}
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        gap: 4
                      }}
                      title="Simulasi Perjalanan Rute Ini"
                    >
                      {isRouteSimulating ? <Pause size={13} /> : <Play size={13} />}
                      <span>{isRouteSimulating ? 'Stop' : 'Play'}</span>
                    </button>

                    <button
                      disabled={currentStopIndex === 0}
                      onClick={() => handleSetStopIndex(route.id, currentStopIndex - 1, route.stops[currentStopIndex - 1], false)}
                      className="btn-ghost"
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        opacity: currentStopIndex === 0 ? 0.4 : 1
                      }}
                      title="Mundurkan Truk ke Stop Sebelumnya"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <button
                      disabled={currentStopIndex === route.stops.length - 1}
                      onClick={() => handleSetStopIndex(route.id, currentStopIndex + 1, route.stops[currentStopIndex + 1], false)}
                      className="btn-primary"
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        opacity: currentStopIndex === route.stops.length - 1 ? 0.4 : 1
                      }}
                      title="Jalankan Truk ke Stop Berikutnya"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                  <span>Status Posisi Truk Terbaru</span>
                  <span style={{ color: '#0b2e8a', fontWeight: 800 }}>
                    Stop {currentStopIndex + 1} dari {route.stops.length}: <strong style={{ color: '#0f172a' }}>{currentStop.name}</strong>
                  </span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${(currentStopIndex / (route.stops.length - 1)) * 100}%`, 
                      height: '100%', 
                      background: '#0284c7', 
                      borderRadius: 3,
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} 
                  />
                </div>
              </div>

              {/* DYNAMIC SINGLE TRUCK ROUTE TRACK */}
              <div style={{ overflowX: 'auto', padding: '16px 0 6px' }}>
                <div 
                  style={{ 
                    position: 'relative', 
                    minWidth: 720, 
                    height: 175, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    padding: '0 20px' 
                  }}
                >
                  {/* Single Moving Truck Overlay Container */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: `${truckPercentPos}%`, 
                      transform: 'translateX(-50%)', 
                      zIndex: 10,
                      transition: 'left 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)' 
                    }}
                  >
                    <CargoTruckVisual 
                      weight={currentStop.weight}
                      maxWeight={route.maxCapacityKg}
                      packagesCount={currentStop.packages}
                      isSelected={selectedManifest && selectedManifest.resi === (currentStop.manifest && currentStop.manifest.resi)}
                      isMoving={isRouteSimulating}
                      onClick={() => handleSetStopIndex(route.id, currentStopIndex, currentStop, true)}
                      currentStopName={currentStop.name}
                    />
                  </div>

                  {/* Route Track Line connecting all nodes */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: 105, 
                      left: '9%', 
                      right: '9%', 
                      height: 3, 
                      background: '#e2e8f0', 
                      zIndex: 1 
                    }} 
                  >
                    {/* Active Track Progress Line */}
                    <div 
                      style={{ 
                        width: `${(currentStopIndex / (route.stops.length - 1)) * 100}%`, 
                        height: '100%', 
                        background: '#0284c7', 
                        transition: 'width 0.6s ease' 
                      }} 
                    />
                  </div>

                  {/* Bottom Stop Nodes Row */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: 92, 
                      left: 0, 
                      right: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0 9%',
                      zIndex: 2 
                    }}
                  >
                    {route.stops.map((stop, idx) => {
                      const isActiveNode = idx === currentStopIndex;
                      const isPassedNode = idx <= currentStopIndex;

                      return (
                        <div 
                          key={stop.id} 
                          onClick={() => handleSetStopIndex(route.id, idx, stop, false)}
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            width: 110
                          }}
                        >
                          {/* Node Circle */}
                          <div 
                            style={{ 
                              width: 28, 
                              height: 28, 
                              borderRadius: '50%', 
                              background: isActiveNode ? '#0b2e8a' : isPassedNode ? '#0284c7' : '#f8fafc',
                              border: `2.5px solid ${isActiveNode ? '#0284c7' : isPassedNode ? '#bae6fd' : '#cbd5e1'}`,
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: 11.5, 
                              fontWeight: 800, 
                              color: isActiveNode || isPassedNode ? '#ffffff' : '#64748b',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {idx}
                          </div>

                          {/* Node Text & Weight Badge */}
                          <div style={{ marginTop: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span style={{ 
                              fontSize: 12.5, 
                              fontWeight: isActiveNode ? 800 : 600, 
                              color: isActiveNode ? '#0b2e8a' : isPassedNode ? '#0f172a' : '#64748b',
                              transition: 'color 0.3s'
                            }}>
                              {stop.name}
                            </span>
                            <span style={{ fontSize: 10.5, color: '#94a3b8' }}>
                              {stop.time}
                            </span>
                            <span style={{ 
                              fontSize: 10, 
                              fontWeight: 700, 
                              color: stop.weight > 0 ? '#0b2e8a' : '#94a3b8',
                              background: stop.weight > 0 ? '#f0f9ff' : 'transparent',
                              border: stop.weight > 0 ? '1px solid #bae6fd' : 'none',
                              padding: '1px 6px',
                              borderRadius: 8,
                              marginTop: 2
                            }}>
                              {stop.weight === 0 ? 'Truk Kosong' : `${stop.weight} kg (${stop.packages} pkt)`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              <div style={{ fontSize: 11.5, color: '#64748b', textAlign: 'center', fontStyle: 'italic', marginTop: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Info size={14} color="#0284c7" />
                <span>Klik tombol <strong>Next / Prev</strong> atau node stop (0-4) untuk menggerakkan Truk. Klik pada <strong>gambar MOBIL TRUK</strong> untuk membuka detail manifest kiriman.</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manifest Detail Modal */}
      {selectedManifest && (
        <div className="modal-overlay">
          <div 
            className="modal-content"
            style={{
              width: '100%',
              maxWidth: 920,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 16,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '24px 28px',
              color: '#0f172a'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Detail Data Manifest Kiriman (40 Field Lengkap)
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '4px 0 0' }}>
                  Resi: {selectedManifest.resi}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedManifest(null)}
                className="btn-ghost"
                style={{ fontSize: 12 }}
              >
                Tutup
              </button>
            </div>

            {/* Grid Container for all 40 Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Section 1: Informasi Dasar & Resi */}
              <div>
                <h4 style={{ fontSize: 13, color: '#0b2e8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
                  <FileText size={15} /> 1. Informasi Identifikasi Kiriman
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  <FieldCard label="1. Resi" value={selectedManifest.resi} highlight />
                  <FieldCard label="2. Kode Booking" value={selectedManifest.kodebooking} />
                  <FieldCard label="3. Kantor Kirim" value={selectedManifest.kantorkirim} />
                  <FieldCard label="4. No Pend Kirim" value={selectedManifest.nopendkirim} />
                  <FieldCard label="19. Layanan" value={selectedManifest.layanan} highlight />
                  <FieldCard label="22. Kode Pelanggan" value={selectedManifest.kodepelanggan} />
                  <FieldCard label="26. Status" value={selectedManifest.status} />
                  <FieldCard label="31. Lokasi Terakhir" value={selectedManifest.lokasiterakhir} />
                </div>
              </div>

              {/* Section 2: Data Pengirim & Penerima */}
              <div>
                <h4 style={{ fontSize: 13, color: '#0b2e8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
                  <User size={15} /> 2. Data Pengirim & Penerima Lengkap
                </h4>
                <div className="responsive-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Pengirim Box */}
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, color: '#d97706', fontSize: 12, marginBottom: 8 }}>DOKUMEN PENGIRIM</div>
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
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, color: '#16a34a', fontSize: 12, marginBottom: 8 }}>DOKUMEN PENERIMA</div>
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
                <h4 style={{ fontSize: 13, color: '#0b2e8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
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
                <h4 style={{ fontSize: 13, color: '#0b2e8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
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
                <h4 style={{ fontSize: 13, color: '#0b2e8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
                  <Camera size={15} /> 5. Bukti Lampiran Visual (Photo1, Photo2, TTD)
                </h4>
                <div className="responsive-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>37. Photo1 (Paket FISIK)</div>
                    <img src={selectedManifest.photo1} alt="Photo 1" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>38. Photo2 (Manifest Barcode)</div>
                    <img src={selectedManifest.photo2} alt="Photo 2" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>39. Tanda Tangan (Verified TTD)</div>
                    <div style={{ height: 75, background: '#ffffff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontFamily: 'cursive', fontSize: 18, color: '#0b2e8a' }}>{selectedManifest.namapengirim.split(' ')[0]} Verified</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#16a34a', textAlign: 'center', fontWeight: 700 }}>
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

function FieldCard({ label, value, highlight }) {
  return (
    <div style={{
      background: highlight ? '#f0f9ff' : '#f8fafc',
      border: `1px solid ${highlight ? '#bae6fd' : '#e2e8f0'}`,
      padding: '8px 12px',
      borderRadius: 8
    }}>
      <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: highlight ? '#0b2e8a' : '#0f172a', fontWeight: highlight ? 800 : 600, marginTop: 2, wordBreak: 'break-word' }}>
        {value || '-'}
      </div>
    </div>
  );
}

function FieldRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
      <span style={{ color: '#64748b', fontWeight: 600 }}>{label}:</span>
      <span style={{ color: '#0f172a', fontWeight: 700, maxWidth: '60%', textAlign: 'right' }}>{value || '-'}</span>
    </div>
  );
}
