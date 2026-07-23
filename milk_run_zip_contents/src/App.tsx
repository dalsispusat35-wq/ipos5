import { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  Package, 
  MapPin, 
  RotateCcw, 
  ArrowRight, 
  Clock, 
  Boxes, 
  Weight, 
  Calendar, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle
} from 'lucide-react';
import { Barang, LogAktivitas } from './types';
import { ruteData, mobilData } from './data';

export default function App() {
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
  const [activePayload, setActivePayload] = useState<Barang[]>(ruteData[0].barang_naik);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogAktivitas[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Refs for auto-scrolling the timeline track
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Initialize clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize first stop log on mount
  useEffect(() => {
    const initialStop = ruteData[0];
    const initialLog: LogAktivitas = {
      id: "init",
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      nama_titik: initialStop.nama_titik,
      barang_turun: [],
      barang_naik: initialStop.barang_naik,
      berat_turun: 0,
      berat_naik: initialStop.barang_naik.reduce((acc, item) => acc + item.berat, 0),
      total_berat_setelah: initialStop.barang_naik.reduce((acc, item) => acc + item.berat, 0),
    };
    setLogs([initialLog]);
  }, []);

  // Auto-scroll the timeline so the active node is kept centered in view
  useEffect(() => {
    const activeNodeElement = document.getElementById(`node-${currentStopIndex}`);
    if (activeNodeElement && timelineContainerRef.current) {
      const container = timelineContainerRef.current;
      const containerWidth = container.offsetWidth;
      const elementLeft = activeNodeElement.offsetLeft;
      const elementWidth = activeNodeElement.offsetWidth;
      
      // Calculate target scroll to keep the active node centered
      const targetScrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
      });
    }
  }, [currentStopIndex]);

  // Calculations
  const totalWeight = activePayload.reduce((acc, item) => acc + item.berat, 0);
  const capacityPercentage = Math.min(100, Math.round((totalWeight / mobilData.kapasitas_maks) * 100));

  // Determine styles depending on capacity utilization
  const getCapacityStyles = (pct: number) => {
    if (pct < 70) {
      return {
        barColor: "bg-emerald-500",
        textColor: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
        borderColor: "border-emerald-200 dark:border-emerald-900/40",
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
        pulse: "bg-emerald-400",
        status: "Aman (Safe)"
      };
    } else if (pct < 90) {
      return {
        barColor: "bg-amber-500",
        textColor: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950/20",
        borderColor: "border-amber-200 dark:border-amber-900/40",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        pulse: "bg-amber-400",
        status: "Hampir Penuh (Warning)"
      };
    } else {
      return {
        barColor: "bg-rose-500",
        textColor: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-50 dark:bg-rose-950/20",
        borderColor: "border-rose-200 dark:border-rose-900/40",
        badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
        pulse: "bg-rose-400",
        status: "Kritis (Critical)"
      };
    }
  };

  const statusStyle = getCapacityStyles(capacityPercentage);

  // Triggering next stop movement
  const goToNextStop = () => {
    if (isMoving || currentStopIndex >= ruteData.length - 1) return;

    const nextIndex = currentStopIndex + 1;
    setIsMoving(true);
    setCurrentStopIndex(nextIndex);

    // After animation duration (e.g., 1000ms), update the physical state of items & log
    setTimeout(() => {
      const nextStop = ruteData[nextIndex];
      let newPayload = [...activePayload];

      // 1. Identify packages to unload
      const unloadedItems = activePayload.filter(item => nextStop.barang_turun.includes(item.resi));
      const unloadedWeight = unloadedItems.reduce((acc, item) => acc + item.berat, 0);

      // Remove unloaded items
      newPayload = newPayload.filter(item => !nextStop.barang_turun.includes(item.resi));

      // 2. Identify packages to load
      const loadedItems = nextStop.barang_naik;
      const loadedWeight = loadedItems.reduce((acc, item) => acc + item.berat, 0);

      // Add loaded items
      newPayload = [...newPayload, ...loadedItems];

      // 3. Recalculate
      const totalWeightAfter = newPayload.reduce((acc, item) => acc + item.berat, 0);

      // 4. Update states
      setActivePayload(newPayload);

      // 5. Append to logs
      const logEntry: LogAktivitas = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        nama_titik: nextStop.nama_titik,
        barang_turun: nextStop.barang_turun,
        barang_naik: nextStop.barang_naik,
        berat_turun: unloadedWeight,
        berat_naik: loadedWeight,
        total_berat_setelah: totalWeightAfter,
      };

      setLogs(prev => [logEntry, ...prev]);
      setIsMoving(false);
    }, 1000); // 1s syncs with the CSS layout transition
  };

  // Reset/Restart the simulation
  const restartSimulation = () => {
    if (isMoving) return;
    setCurrentStopIndex(0);
    setActivePayload(ruteData[0].barang_naik);
    setIsMoving(false);

    const initialStop = ruteData[0];
    const initialLog: LogAktivitas = {
      id: "init-" + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      nama_titik: initialStop.nama_titik,
      barang_turun: [],
      barang_naik: initialStop.barang_naik,
      berat_turun: 0,
      berat_naik: initialStop.barang_naik.reduce((acc, item) => acc + item.berat, 0),
      total_berat_setelah: initialStop.barang_naik.reduce((acc, item) => acc + item.berat, 0),
    };
    setLogs([initialLog]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      {/* 1. Header & Status Panel */}
      <header id="dashboard-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Truck className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Logistics Milk Run Simulation
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                System Live Telemetry • 10 Kantor Cabang (KC)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Truck Info Card */}
            <div className="bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2 flex items-center gap-3 shadow-inner">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <span className="text-xs font-bold font-mono">TRK</span>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Identitas Truk</div>
                <div className="text-sm font-bold text-slate-800 font-mono">
                  {mobilData.nopol} <span className="text-slate-400 font-normal">| Max {mobilData.kapasitas_maks} kg</span>
                </div>
              </div>
            </div>

            {/* Clock Widget */}
            <div className="bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2 flex items-center gap-3">
              <Clock className="h-4 w-4 text-slate-400" />
              <div>
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Waktu Lokal</div>
                <div className="text-sm font-bold text-slate-800 font-mono">{currentTime || '--:--:--'}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* 2. Visualisasi Rute & Animasi (Core Feature) */}
        <section id="route-visualization-panel" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Visualisasi Rute Pengiriman (Milk Run Line)</h2>
            </div>
            <div className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded-full">
              Langkah: {currentStopIndex + 1} / {ruteData.length}
            </div>
          </div>

          {/* Interactive Road Scroll Container */}
          <div 
            ref={timelineContainerRef}
            className="overflow-x-auto pb-6 pt-10 px-8 scrollbar-thin scrollbar-thumb-slate-200 relative"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="relative min-w-[1000px] h-24 flex items-center">
              
              {/* Road Lane Line */}
              <div className="absolute left-0 right-0 h-4 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/60 overflow-hidden flex items-center">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-out"
                  style={{ width: `${(currentStopIndex / (ruteData.length - 1)) * 100}%` }}
                />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t border-dashed border-slate-300 dark:border-slate-600 transform -translate-y-1/2" />
              </div>

              {/* Smooth Gliding Truck Representation */}
              <div 
                className="absolute z-20 transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col items-center"
                style={{ 
                  left: `${(currentStopIndex / (ruteData.length - 1)) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {/* Truck Badge Popup */}
                <div className="absolute -top-10 bg-indigo-900 text-white text-[10px] font-mono font-semibold py-1 px-2.5 rounded-md shadow-lg flex items-center gap-1.5 whitespace-nowrap border border-indigo-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {totalWeight} kg
                </div>

                {/* Truck Visual representation with vibration/tilt animation when moving */}
                <div className={`p-3 rounded-xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 border-2 border-white transition-transform ${isMoving ? 'animate-bounce scale-110' : 'hover:scale-105'}`}>
                  <Truck className="h-6 w-6" />
                </div>
              </div>

              {/* Route Stop Nodes */}
              <div className="absolute left-0 right-0 flex justify-between z-10">
                {ruteData.map((node, index) => {
                  const isVisited = index < currentStopIndex;
                  const isActive = index === currentStopIndex;
                  const isFuture = index > currentStopIndex;

                  return (
                    <div 
                      key={node.id_kc} 
                      id={`node-${index}`}
                      className="flex flex-col items-center select-none"
                      style={{ width: '80px' }}
                    >
                      {/* Node Circle */}
                      <div className="relative flex items-center justify-center">
                        {/* Active pulsating ring */}
                        {isActive && (
                          <div className="absolute w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 animate-ping opacity-75"></div>
                        )}

                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-500 border-2
                          ${isActive 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                            : isVisited 
                              ? 'bg-emerald-500 text-white border-emerald-500' 
                              : 'bg-white text-slate-400 border-slate-300'
                          }
                        `}>
                          {isVisited ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                      </div>

                      {/* Node label */}
                      <span className={`text-xs mt-3 font-semibold text-center tracking-tight transition-colors duration-500 truncate w-full ${isActive ? 'text-indigo-600 font-bold' : isVisited ? 'text-slate-600' : 'text-slate-400'}`}>
                        {node.nama_titik}
                      </span>

                      {/* Info preview tooltip on hover/active */}
                      <div className="mt-1 h-3 text-[10px] text-slate-400 font-medium truncate w-full text-center">
                        {node.barang_naik.length > 0 && `+${node.barang_naik.length} kargo`}
                        {node.barang_naik.length === 0 && node.barang_turun.length > 0 && `-${node.barang_turun.length} kargo`}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </section>

        {/* 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 3. Indikator Kapasitas Dinamis (Progress Bar) & Current Manifest */}
          <section id="capacity-and-cargo-panel" className="lg:col-span-4 space-y-6">
            
            {/* Capacity Progress Bar Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Weight className="h-5 w-5 text-slate-700" />
                  <h3 className="text-base font-bold text-slate-900">Kapasitas Truk</h3>
                </div>
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${statusStyle.badge}`}>
                  {statusStyle.status}
                </span>
              </div>

              {/* Progress bar container */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline font-mono">
                  <span className="text-xs text-slate-400">Muat/Kapasitas</span>
                  <span className="text-lg font-bold text-slate-800">
                    {totalWeight} <span className="text-xs text-slate-400">/ {mobilData.kapasitas_maks} kg</span>
                  </span>
                </div>

                {/* Background Track */}
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/30">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out relative ${statusStyle.barColor}`}
                    style={{ width: `${capacityPercentage}%` }}
                  >
                    {/* Shiny indicator overlay */}
                    <div className="absolute inset-0 bg-linear-to-r from-white/25 to-transparent animate-shimmer" />
                  </div>
                </div>

                {/* Numeric load indicator */}
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span>Utilisasi Kapasitas</span>
                  <span className={`font-bold font-mono ${statusStyle.textColor}`}>
                    {capacityPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Current Cargo Manifest */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Manifest Cargo Aktif</h3>
                </div>
                <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                  {activePayload.length} Item
                </span>
              </div>

              {/* Package Cargo Grid */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
                {activePayload.length > 0 ? (
                  activePayload.map((item) => (
                    <div 
                      key={item.resi}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-200 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-500 shadow-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-700">{item.resi}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <span>Tujuan:</span>
                            <span className="font-semibold text-slate-600">{item.tujuan}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                          {item.berat} kg
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400">
                    <Boxes className="h-10 w-10 stroke-1 mb-2 text-slate-300" />
                    <p className="text-xs font-medium">Truk Kosong</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                      Semua barang telah diturunkan di kantor cabang tujuan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 4. Log Aktivitas & Interactive Controls */}
          <section id="controls-and-logs-panel" className="lg:col-span-8 space-y-6">
            
            {/* Simulation Controls Dashboard */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-2">Simulasi Kontrol</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Metode <strong>Milk Run Logistics</strong> berfokus pada efisiensi rute dan pemanfaatan kapasitas muatan truk. 
                Gunakan kontrol di bawah untuk memajukan truk ke cabang berikutnya dan saksikan bongkar-muat barang secara real-time.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {currentStopIndex < ruteData.length - 1 ? (
                  <button
                    id="btn-next-stop"
                    onClick={goToNextStop}
                    disabled={isMoving}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all duration-300
                      ${isMoving 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-100 cursor-pointer active:scale-[0.98]'
                      }
                    `}
                  >
                    {isMoving ? (
                      <>
                        <span className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                        Truk Berjalan ke {ruteData[currentStopIndex + 1]?.nama_titik}...
                      </>
                    ) : (
                      <>
                        <span>Lanjut ke {ruteData[currentStopIndex + 1]?.nama_titik}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    id="btn-restart"
                    onClick={restartSimulation}
                    disabled={isMoving}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-sm shadow-md shadow-emerald-100 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Ulangi Simulasi (Restart)</span>
                  </button>
                )}

                <button
                  id="btn-reset-secondary"
                  onClick={restartSimulation}
                  disabled={isMoving || currentStopIndex === 0}
                  className={`px-5 py-3.5 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all
                    ${isMoving || currentStopIndex === 0
                      ? 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 active:scale-[0.98] cursor-pointer'
                    }
                  `}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>

              {/* Informative Edge Cases Warning Panel */}
              {totalWeight >= 90 && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs animate-bounce">
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>
                    <strong>Peringatan Kapasitas:</strong> Muatan truk saat ini mencapai <strong>{totalWeight} kg</strong> ({capacityPercentage}%). Mendekati batas kritis kapasitas muatan!
                  </span>
                </div>
              )}
            </div>

            {/* Activity Log / Live Tracking */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Log Aktivitas & Live Tracking</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Update otomatis saat tiba di KC
                </span>
              </div>

              {/* Scrollable logs list */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {logs.length > 0 ? (
                  logs.map((log, index) => {
                    const isLatest = index === 0;

                    return (
                      <div 
                        key={log.id} 
                        className={`p-4 rounded-xl border transition-all duration-300 ${isLatest ? 'bg-indigo-50/40 border-indigo-200 shadow-sm' : 'bg-slate-50/50 border-slate-200'}`}
                      >
                        {/* Log Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 mb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md bg-white border border-slate-200 flex items-center justify-center text-indigo-600">
                              <MapPin className="h-3.5 w-3.5" />
                            </span>
                            <span className="font-bold text-sm text-slate-800">
                              {log.nama_titik}
                            </span>
                            {isLatest && (
                              <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                                Terbaru
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {log.timestamp}
                            </span>
                            <span>•</span>
                            <span className="font-bold text-slate-700">Muatan: {log.total_berat_setelah} / 100 kg</span>
                          </div>
                        </div>

                        {/* Log Grid: Bongkar vs Muat */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Unloaded items (Barang Turun) */}
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                              <ArrowDownCircle className="h-3.5 w-3.5" />
                              <span>🔴 Barang Turun ({log.berat_turun} kg)</span>
                            </div>

                            {log.barang_turun.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {log.barang_turun.map((resi) => (
                                  <span 
                                    key={resi} 
                                    className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-100 shadow-3xs"
                                  >
                                    {resi}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic block">Tidak ada barang diturunkan</span>
                            )}
                          </div>

                          {/* Loaded items (Barang Naik) */}
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                              <ArrowUpCircle className="h-3.5 w-3.5" />
                              <span>🟢 Barang Naik ({log.berat_naik} kg)</span>
                            </div>

                            {log.barang_naik.length > 0 ? (
                              <div className="space-y-1">
                                {log.barang_naik.map((item) => (
                                  <div 
                                    key={item.resi} 
                                    className="flex items-center justify-between px-2 py-1 rounded-md text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 shadow-3xs"
                                  >
                                    <span className="font-mono font-bold">{item.resi}</span>
                                    <span className="text-[9px] text-emerald-600">
                                      {item.berat} kg → {item.tujuan}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic block">Tidak ada barang dinaikkan</span>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400">
                    <Activity className="h-10 w-10 stroke-1 mb-2 text-slate-300" />
                    <p className="text-xs font-medium">Belum ada log aktivitas</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Klik "Next Stop" untuk memulai rute perjalanan logistik.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
