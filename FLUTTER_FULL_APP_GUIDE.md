# 📱 IPOS5 Mobile — Panduan Lengkap Pembuatan Aplikasi Flutter (Full Features & MongoDB Backend)

> **Dokumen Arsitektur & Implementasi Resmi**  
> **Target Platform:** Android, iOS, Tablet / iPad, Web, & Desktop  
> **Database:** MongoDB (`ipos5_reporting`) via Express/Node.js REST & WebSocket API  
> **State Management:** BLoC / Riverpod + Clean Architecture  
> **Desain UI:** Modern Spatial Navy & POSIND Glassmorphism (Light & Dark Theme)

---

## 📑 Daftar Isi
1. [Ringkasan Arsitektur Sistem](#1-ringkasan-arsitektur-sistem)
2. [Spesifikasi Dependensi (`pubspec.yaml`)](#2-spesifikasi-dependensi-pubspecyaml)
3. [Struktur Direktori Proyek Flutter (Clean Architecture)](#3-struktur-direktori-proyek-flutter-clean-architecture)
4. [Integrasi Koneksi Database MongoDB & Network Layer](#4-integrasi-koneksi-database-mongodb--network-layer)
5. [Pemetaan Seluruh Fitur (100% Full Parity dengan Web)](#5-pemetaan-seluruh-fitur-100-full-parity-dengan-web)
   - [5.1 Autentikasi, Profil & RBAC](#51-autentikasi-profil--rbac)
   - [5.2 Dashboard Eksekutif & KPI Real-Time](#52-dashboard-eksekutif--kpi-real-time)
   - [5.3 Tracking Resi & Barcode / QR Scanner](#53-tracking-resi--barcode--qr-scanner)
   - [5.4 Armada Fleet & Live GPS Radar Tracking (Maps)](#54-armada-fleet--live-gps-radar-tracking-maps)
   - [5.5 Gate & Transit Inbound Monitoring (Kanban 3-Stage)](#55-gate--transit-inbound-monitoring-kanban-3-stage)
   - [5.6 Master Data (Kantor Pos, Rute, Kendaraan, Produk Layanan)](#56-master-data-kantor-pos-rute-kendaraan-produk-layanan)
   - [5.7 Jadwal Transportasi & Pickup Loket](#57-jadwal-transportasi--pickup-loket)
   - [5.8 Invoices & Transaksi Registry](#58-invoices--transaksi-registry)
   - [5.9 MongoDB Compass Viewer & Pengaturan Sistem](#59-mongodb-compass-viewer--pengaturan-sistem)
6. [Contoh Kode Implementasi Inti](#6-contoh-kode-implementasi-inti)
   - [Network Client & Interceptor JWT](#61-network-client--interceptor-jwt)
   - [Scanner Barcode / QR Kamera](#62-scanner-barcode--qr-kamera)
   - [Live GPS Map (FlutterMap / Leaflet OSM)](#63-live-gps-map-fluttermap--leaflet-osm)
   - [Responsive Layout Builder (HP, iPad, Tablet)](#64-responsive-layout-builder-hp-ipad-tablet)
   - [Kapasitas Muatan & Load Gauge Visualizer](#65-kapasitas-muatan--load-gauge-visualizer)
7. [Panduan Menjalankan & Build Aplikasi](#7-panduan-menjalankan--build-aplikasi)

---

## 1. Ringkasan Arsitektur Sistem

Aplikasi **IPOS5 Flutter** dibangun menggunakan prinsip **Clean Architecture** (Domain, Data, Presentation) yang terhubung ke basis data **MongoDB** yang sama yang digunakan oleh aplikasi web melalui backend Node.js / Express API.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   IPOS5 FLUTTER CLIENT APPLICATION                     │
│  (Android / iOS / iPad / Tablet / Web)                                 │
├────────────────────────────────────────────────────────────────────────┤
│  Presentation Layer: UI Widgets, BLoC / Cubit State, Responsive Engine │
│  Domain Layer: Entities, UseCases, Repositories Contracts              │
│  Data Layer: Models (JSON), Remote Data Source (Dio), Local Cache      │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │ REST API (HTTPS)               │ WebSockets (WSS)
┌───────────────────▼────────────────────────────────▼───────────────────┐
│              NODE.JS + EXPRESS BACKEND API (PORT 5000)                 │
│  - Auth & RBAC Middleware                                              │
│  - Transaction Controller (ACID Session)                               │
│  - Kendaraan & GPS Telemetry Controller                                │
│  - Gate Transit & Manifest Controller                                  │
│  - Master Data & Report Export Controller                              │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Mongoose / MongoDB Driver
┌───────────────────────────────────▼────────────────────────────────────┐
│                    MONGODB DATABASE (ipos5_reporting)                  │
│  - Collections: transaksi, master_kendaraan, master_kantor,            │
│    master_route_nopen, detail_route, route_journeys, manifests,        │
│    jadwal_transportasi, users, master_produk, tracking_events          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Spesifikasi Dependensi (`pubspec.yaml`)

Simpan konfigurasi paket dependensi berikut di dalam file `pubspec.yaml`:

```yaml
name: ipos5_mobile
description: "Aplikasi Logistik & Telemetri Terintegrasi IPOS5 PT Pos Indonesia"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # ── State Management & Dependency Injection ──
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5
  get_it: ^7.6.4
  injectable: ^2.3.2

  # ── Networking & API ──
  dio: ^5.4.1
  retrofit: ^4.1.0
  web_socket_channel: ^2.4.1
  connectivity_plus: ^5.0.2

  # ── Local Storage & Caching (Offline Support) ──
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.2

  # ── UI, Typography & Icons ──
  google_fonts: ^6.1.0
  lucide_icons: ^0.320.0
  flutter_svg: ^2.0.9
  intl: ^0.19.0
  shimmer: ^3.0.0
  badges: ^3.1.2

  # ── Charts & Visualizations ──
  fl_chart: ^0.66.2
  percent_indicator: ^4.2.3

  # ── Camera & Barcode Scanner (Live Scanning Resi) ──
  mobile_scanner: ^5.0.0

  # ── Maps & GPS Geolocation ──
  flutter_map: ^6.1.0
  latlong2: ^0.9.0
  geolocator: ^11.0.0
  url_launcher: ^6.2.4

  # ── PDF & Printing ──
  pdf: ^3.10.7
  printing: ^5.11.1
  share_plus: ^7.2.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  build_runner: ^2.4.8
  json_serializable: ^6.7.1
  retrofit_generator: ^8.1.0
  injectable_generator: ^2.4.1

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icons/
```

---

## 3. Struktur Direktori Proyek Flutter (Clean Architecture)

```
lib/
├── core/
│   ├── constants/
│   │   ├── api_endpoints.dart         # URL backend & remote MongoDB API
│   │   ├── app_colors.dart            # Navy, Electric Blue, Orange POSIND
│   │   └── app_typography.dart        # Plus Jakarta Sans & JetBrains Mono
│   ├── network/
│   │   ├── api_client.dart            # Dio client + JWT Interceptor
│   │   ├── error_handler.dart         # Custom exceptions & network handler
│   │   └── socket_client.dart         # Live telemetri stream listener
│   ├── storage/
│   │   ├── secure_storage_service.dart# Simpan token JWT & NIP
│   │   └── hive_cache_manager.dart    # Cache offline paket & master data
│   ├── theme/
│   │   ├── app_theme.dart             # Konfigurasi Light & Dark Theme
│   │   └── theme_cubit.dart           # Switcher Dark Mode otomatis
│   └── utils/
│       ├── date_formatter.dart        # Format WIB, YYYY-MM-DD
│       └── weight_formatter.dart      # Format berat Kg / Tonase
│
├── data/
│   ├── datasources/
│   │   ├── auth_remote_ds.dart
│   │   ├── dashboard_remote_ds.dart
│   │   ├── checker_remote_ds.dart
│   │   ├── fleet_remote_ds.dart
│   │   ├── gate_remote_ds.dart
│   │   └── master_remote_ds.dart
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── connote_model.dart
│   │   ├── vehicle_model.dart
│   │   ├── office_model.dart
│   │   ├── route_model.dart
│   │   ├── manifest_model.dart
│   │   └── dashboard_stats_model.dart
│   └── repositories/
│       ├── auth_repository_impl.dart
│       ├── dashboard_repository_impl.dart
│       ├── checker_repository_impl.dart
│       ├── fleet_repository_impl.dart
│       └── master_repository_impl.dart
│
├── domain/
│   ├── entities/
│   │   ├── user_entity.dart
│   │   ├── connote_entity.dart
│   │   ├── vehicle_entity.dart
│   │   └── route_stop_entity.dart
│   ├── repositories/
│   │   ├── auth_repository.dart
│   │   ├── checker_repository.dart
│   │   └── fleet_repository.dart
│   └── usecases/
│       ├── login_usecase.dart
│       ├── check_connote_usecase.dart
│       ├── get_dashboard_stats_usecase.dart
│       └── process_gate_manifest_usecase.dart
│
└── presentation/
    ├── bloc/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── checker/
    │   ├── fleet/
    │   └── gate/
    ├── screens/
    │   ├── auth/
    │   │   └── login_screen.dart
    │   ├── dashboard/
    │   │   └── dashboard_screen.dart
    │   ├── checker/
    │   │   ├── checker_screen.dart
    │   │   └── barcode_scanner_screen.dart
    │   ├── fleet/
    │   │   ├── fleet_list_screen.dart
    │   │   ├── vehicle_detail_screen.dart
    │   │   └── live_gps_radar_screen.dart
    │   ├── gate/
    │   │   └── gate_monitoring_screen.dart
    │   ├── master/
    │   │   ├── master_kantor_screen.dart
    │   │   ├── master_kendaraan_screen.dart
    │   │   ├── master_route_screen.dart
    │   │   └── master_produk_screen.dart
    │   ├── jadwal/
    │   │   ├── jadwal_transportasi_screen.dart
    │   │   └── jadwal_pickup_screen.dart
    │   ├── transaksi/
    │   │   └── transaksi_list_screen.dart
    │   ├── analytics/
    │   │   └── analytics_report_screen.dart
    │   ├── profile/
    │   │   └── profile_screen.dart
    │   └── settings/
    │       └── settings_screen.dart
    ├── widgets/
    │   ├── responsive_builder.dart     # Engine adaptif HP vs Tablet
    │   ├── kpi_summary_card.dart       # Kartu metrik pastel & glowing
    │   ├── capacity_gauge_bar.dart     # Visualizer load muatan kendaraan
    │   ├── waypoint_timeline_view.dart # Stepper rute perhentian
    │   ├── responsive_data_table.dart  # Tabel ber-scroll momentum
    │   └── custom_bottom_nav_bar.dart  # Tab bar floating gaya iOS/Android
    └── main_navigation_wrapper.dart    # Shell scaffold dengan BottomBar & Drawer
```

---

## 4. Integrasi Koneksi Database MongoDB & Network Layer

Aplikasi Flutter berkomunikasi dengan server backend IPOS5 via REST API dan WebSockets:

| Base URL Konfigurasi | Keterangan |
|---|---|
| `http://10.0.2.2:5000/api` | Emulator Android ke Localhost |
| `http://192.168.x.x:5000/api` | Perangkat Fisik (HP / Tablet) via Wi-Fi Lokal |
| `https://ipos5-api.posindonesia.co.id/api` | Server Produksi / Staging |

### Endpoint API Utama (Mapping Koleksi MongoDB):
1. **Otentikasi & Akun:** `POST /api/auth/login`, `GET /api/auth/me` (`users`)
2. **Dashboard Real-Time:** `GET /api/dashboard-stats` (`transaksi`, `master_kendaraan`, `master_kantor`)
3. **Tracking & Resi:** `GET /api/checker/:code?date=YYYY-MM-DD` (`transaksi`, `tracking_events`, `route_journeys`)
4. **Armada & Rute:** `GET /api/kendaraan`, `GET /api/kendaraan/:nopol/detail` (`master_kendaraan`, `detail_route`)
5. **Gate Monitoring:** `GET /api/gate/pipeline`, `POST /api/gate/manifest`, `POST /api/gate/transit` (`manifests`, `transaksi`)
6. **Master Data:** `GET /api/master/kantor`, `GET /api/master/routes`, `GET /api/master/produk` (`master_kantor`, `master_route_nopen`, `master_produk`)

---

## 5. Pemetaan Seluruh Fitur (100% Full Parity dengan Web)

### 5.1 Autentikasi, Profil & RBAC
- **Login Screen:** Input username & password dengan auto-fill demo accounts (`admin`, `sari`, `operator`), verifikasi role, dan penyimpanan JWT di `flutter_secure_storage`.
- **Role Guards (RBAC):**
  - `SUPER_ADMIN`: Akses penuh semua modul (termasuk Compass & Settings).
  - `DISPATCHER`: Akses Operasional, Gate Monitoring, Checker, Fleet.
  - `DRIVER`: Akses Live GPS, Manifest Muatan Truk, Konfirmasi POD.
  - `LOKET_OPERATOR`: Input Resi, Jadwal Pickup, Manifesting Checkpoint 1.
- **Profil User:** Avatar visual, statistik NIP, badge role, log riwayat aksi, dan toggle tema (Dark / Light).

### 5.2 Dashboard Eksekutif & KPI Real-Time
- **5 Kartu KPI Utama:**
  - `Total Shipments` (Blue gradient)
  - `Active Shipments` (Soft Cyan)
  - `Completed` (Emerald Green)
  - `Returned / Failed` (Rose Pink)
  - `Freight Revenue & Tonase` (Purple)
- **Interactive Line / Bar Chart (`fl_chart`):**
  - Volume pengiriman mingguan/bulanan.
  - Donut chart breakdown jenis layanan (Pos Nextday, Reguler, Jumbo Cargo).
- **Date Range Selector Modal:** Pilihan cepat (Hari Ini, 7 Hari Terakhir, 30 Hari, Rentang Tanggal Kustom).
- **Live Connote Stream:** Stream 20 transaksi terbaru dengan indikator status berdenyut (*pulsing badge*).

### 5.3 Tracking Resi & Barcode / QR Scanner
- **Scanner Kamera Bawaan:** Menggunakan kamera smartphone (`mobile_scanner`) untuk membaca Barcode 1D / QR Code pada resi POSIND secara instan.
- **Mode Dual Switcher:** Switch instan antara **Cari Nomor Resi** (`P2608...`) atau **Cari Plat Truk** (`B 9910 PCX`).
- **Stepper Rute Multi-Stop:** Visualisasi titik asal (Origin), titik-titik transit (KCP Cimahicisangkan, Cimindi, Juanda), dan tujuan akhir (SPP Bandung 40400).
- **Manifest Accordion:** Menampilkan rincian paket per kantor tujuan dengan tombol expand/collapse dan pagination dinamis.

### 5.4 Armada Fleet & Live GPS Radar Tracking (Maps)
- **Interactive OpenStreetMap / Leaflet (`flutter_map`):**
  - Menggambar garis rute berwarna biru (rute terencana) dan hijau pekat (rute yang sudah dilalui).
  - Marker kantor pos dengan nama nopend dan alamat resmi.
  - Marker truk live bergerak mengikuti simulasi waypoint.
- **HUD Kontrol Simulasi:** Tombol Play, Pause, Step Next Waypoint, dan slider kecepatan (20, 40, 80 km/jam).
- **Driver Action Cockpit:** Tombol 1-tap panggil WhatsApp langsung atau Telepon GSM ke driver armada.
- **Load Gauge Indicator:** Meteran kapasitas muatan truk (misal: 850 kg / 1.500 kg = 56% SAFE) dengan warna dinamis (Hijau, Kuning, Merah).

### 5.5 Gate & Transit Inbound Monitoring (Kanban 3-Stage)
- **Pipeline 3 Tahap Checkpoint:**
  1. `Checkpoint 1 - Manifesting & Bagging`: Pemilihan paket status `DITERIMA_DI_CIMAHI` untuk digabung menjadi kode manifest baru (`MNF...`).
  2. `Checkpoint 2 - Inbound Transit SPP Bandung`: Scan masuk manifest truk kontainer.
  3. `Checkpoint 3 - Arrival & Final Delivery`: Konfirmasi kedatangan di SPP tujuan dan update status menjadi `DELIVERED`.
- **Integritas ACID MongoDB:** Transaksi pembentukan manifest dibungkus aman tanpa data menggantung.

### 5.6 Master Data (Kantor Pos, Rute, Kendaraan, Produk Layanan)
- **Master Kantor:** Pencarian cepat dari 13.000+ data nopend, koordinat GPS, wilayah regional, dan verifikasi status aktif.
- **Master Rute:** Pemetaan rute asal-tujuan dengan nopen autocomplete.
- **Master Kendaraan:** CRUD armada, plat nomor, nomor polisi, jenis truk box, kapasitas maksimum.
- **Master Produk:** Daftar layanan POSIND dengan switch toggle on/off.

### 5.7 Jadwal Transportasi & Pickup Loket
- **Transport Calendar Grid:** Kalender perjalanan armada 7 hari yang dapat di-scroll responsif.
- **Jadwal Pickup Loket:** Jadwal penjemputan berkala ke agen-agen pos dan KCP.

### 5.8 Invoices & Transaksi Registry
- **Pencarian Multi-Filter:** Filter berdasarkan layanan, kota tujuan, status kiriman, tanggal, dan kendaraan.
- **Ekspor Dokumen:** Cetak invoice dan export ke format CSV / PDF.

### 5.9 MongoDB Compass Viewer & Pengaturan Sistem
- **Mobile Compass GUI (Super Admin):** Melihat daftar koleksi MongoDB, jumlah dokumen, dan struktur JSON dokumen secara langsung dari HP.
- **Connection Switcher:** Mengubah target database string MongoDB secara aman.

---

## 6. Contoh Kode Implementasi Inti

### 6.1 Network Client & Interceptor JWT

`lib/core/network/api_client.dart`:
```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String baseUrl = 'http://10.0.2.2:5000/api'; // Sesuaikan IP server
  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'ipos5_jwt_token');
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException error, handler) {
        // Handle token expiration / unauthorized
        if (error.response?.statusCode == 401) {
          _storage.delete(key: 'ipos5_jwt_token');
        }
        return handler.next(error);
      },
    ));
  }
}
```

---

### 6.2 Scanner Barcode / QR Kamera

`lib/presentation/screens/checker/barcode_scanner_screen.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:lucide_icons/lucide_icons.dart';

class BarcodeScannerScreen extends StatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );
  bool _isScanned = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Scan Barcode / QR Resi POSIND', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: _controller.torchState,
              builder: (context, state, child) {
                return Icon(state == TorchState.on ? LucideIcons.zap : LucideIcons.zapOff);
              },
            ),
            onPressed: () => _controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(LucideIcons.switchCamera),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: (capture) {
              final barcodes = capture.barcodes;
              if (barcodes.isNotEmpty && !_isScanned) {
                final code = barcodes.first.rawValue;
                if (code != null && code.isNotEmpty) {
                  setState(() => _isScanned = true);
                  Navigator.pop(context, code);
                }
              }
            },
          ),
          // Viewfinder HUD Overlay
          Center(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF00D2C4), width: 2.5),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF00D2C4).withOpacity(0.2),
                    blurRadius: 20,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text('Arahkan kamera ke Barcode Resi', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text('IPOS5 Auto Detector', style: TextStyle(color: Color(0xFF00D2C4), fontSize: 10, fontWeight: FontWeight.w800)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

---

### 6.3 Live GPS Map (FlutterMap / Leaflet OSM)

`lib/presentation/screens/fleet/live_gps_radar_screen.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:lucide_icons/lucide_icons.dart';

class LiveGpsRadarScreen extends StatefulWidget {
  final String routeId;
  final String vehicleNopol;
  final List<LatLng> polylinePoints;
  final List<Map<String, dynamic>> waypoints;

  const LiveGpsRadarScreen({
    super.key,
    required this.routeId,
    required this.vehicleNopol,
    required this.polylinePoints,
    required this.waypoints,
  });

  @override
  State<LiveGpsRadarScreen> createState() => _LiveGpsRadarScreenState();
}

class _LiveGpsRadarScreenState extends State<LiveGpsRadarScreen> {
  final MapController _mapController = MapController();
  int _activeStopIndex = 1;

  @override
  Widget build(BuildContext context) {
    final currentPos = widget.polylinePoints.isNotEmpty 
        ? widget.polylinePoints[0] 
        : const LatLng(-6.940428, 107.632296);

    return Scaffold(
      appBar: AppBar(
        title: Text('GPS Radar Live: ${widget.vehicleNopol}'),
        backgroundColor: const Color(0xFF0B192C),
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: currentPos,
              initialZoom: 12.5,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.posindonesia.ipos5',
              ),
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: widget.polylinePoints,
                    strokeWidth: 5.0,
                    color: const Color(0xFF0284C7),
                  ),
                ],
              ),
              MarkerLayer(
                markers: widget.waypoints.map((wp) {
                  return Marker(
                    point: LatLng(wp['lat'], wp['lng']),
                    width: 40,
                    height: 40,
                    child: const Icon(
                      LucideIcons.mapPin,
                      color: Color(0xFFEF4444),
                      size: 32,
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
          // Floating Simulation HUD at Bottom
          Positioned(
            bottom: 20,
            left: 16,
            right: 16,
            child: Card(
              color: const Color(0xFF0F172A).withOpacity(0.92),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('RUTE: ${widget.routeId}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        Text('Stop #$_activeStopIndex / ${widget.waypoints.length}', style: const TextStyle(color: Color(0xFF00D2C4), fontSize: 12)),
                      ],
                    ),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0284C7)),
                      onPressed: () {
                        setState(() {
                          _activeStopIndex = (_activeStopIndex % widget.waypoints.length) + 1;
                        });
                      },
                      icon: const Icon(LucideIcons.skipForward, size: 16),
                      label: const Text('Next Stop'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

---

### 6.4 Responsive Layout Builder (HP, iPad, Tablet)

`lib/presentation/widgets/responsive_builder.dart`:
```dart
import 'package:flutter/material.dart';

enum DeviceScreenType { mobile, tablet, desktop }

class ResponsiveBuilder extends StatelessWidget {
  final Widget Function(BuildContext context, DeviceScreenType screenType) builder;

  const ResponsiveBuilder({super.key, required this.builder});

  static DeviceScreenType getDeviceType(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width >= 1024) return DeviceScreenType.desktop;
    if (width >= 600) return DeviceScreenType.tablet;
    return DeviceScreenType.mobile;
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final screenType = getDeviceType(context);
        return builder(context, screenType);
      },
    );
  }
}
```

---

### 6.5 Kapasitas Muatan & Load Gauge Visualizer

`lib/presentation/widgets/capacity_gauge_bar.dart`:
```dart
import 'package:flutter/material.dart';

class CapacityGaugeBar extends StatelessWidget {
  final double currentLoadKg;
  final double maxCapacityKg;

  const CapacityGaugeBar({
    super.key,
    required this.currentLoadKg,
    this.maxCapacityKg = 1500.0,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = (currentLoadKg / maxCapacityKg).clamp(0.0, 1.0);
    final isOverload = currentLoadKg > maxCapacityKg;
    final color = isOverload
        ? const Color(0xFFEF4444)
        : percentage >= 0.8
            ? const Color(0xFFF59E0B)
            : const Color(0xFF10B981);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${currentLoadKg.toStringAsFixed(1)} kg / ${maxCapacityKg.toStringAsFixed(0)} kg',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
            ),
            Text(
              '${(percentage * 100).toStringAsFixed(0)}% ${isOverload ? "OVERLOAD" : "SAFE"}',
              style: TextStyle(fontWeight: FontWeight.w800, color: color, fontSize: 12),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: percentage,
            minHeight: 10,
            backgroundColor: Colors.grey.withOpacity(0.2),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
```

---

## 7. Panduan Menjalankan & Build Aplikasi

### 7.1 Prasyarat Lingkungan
1. **Flutter SDK:** Versi `3.19.x` atau lebih baru.
2. **Android Studio / Xcode:** Untuk emulasi dan build native Android/iOS.
3. **Node.js & MongoDB Server:** Server Express backend di direktori `c:\ipos5\redesign\server` harus berjalan di port `5000`.

### 7.2 Menjalankan Server Backend
```bash
cd c:\ipos5\redesign\server
npm install
npm start
# Server berjalan di http://localhost:5000 (Terhubung ke MongoDB ipos5_reporting)
```

### 7.3 Menjalankan Aplikasi Flutter
```bash
# 1. Masuk ke direktori flutter
cd flutter_ipos5

# 2. Ambil seluruh dependensi
flutter pub get

# 3. Jalankan generator (JSON Serialization & Retrofit)
flutter pub run build_runner build --delete-conflicting-outputs

# 4. Jalankan aplikasi di Emulator / Device Fisik
flutter run
```

### 7.4 Build Rilis APK (Android) & IPA (iOS)
```bash
# Build APK Android Rilis Standalone
flutter build apk --release

# Build App Bundle untuk Google Play Store
flutter build appbundle --release

# Build iOS IPA (Memerlukan macOS & Xcode)
flutter build ipa --release
```

---

*Dokumen panduan ini dibuat sebagai spesifikasi resmi untuk pengembangan aplikasi lintas-platform IPOS5 Flutter dengan integrasi penuh basis data MongoDB.*
