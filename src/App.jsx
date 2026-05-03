/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TripForm from './components/TripForm';
import MapView from './components/MapView';
import TripSummary from './components/TripSummary';
import LogSheets from './components/LogSheets';
import ErrorBoundary from './components/ErrorBoundary';
import { planTrip, reverseGeocode } from './api/tripApi';
import { AlertCircle, Moon, Sun, FileText, Map as MapIcon, History, Play, Compass, Activity, RotateCcw, Command, CheckCircle2 } from 'lucide-react';

const LOADING_STEPS = [
  "Geocoding mission vectors...",
  "Calculating tactical route distances...",
  "Applying HOS rules (§ 395.3)...",
  "Generating audit-ready logs...",
  "Finalizing mission control data..."
];

function App() {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [activeTab, setActiveTab] = useState('map');
  const [mapClickData, setMapClickData] = useState(null);
  const [recentTrips, setRecentTrips] = useState(() => JSON.parse(localStorage.getItem('recentTrips') || '[]'));
  const [activeField, setActiveField] = useState('currentLocation');
  const [draftMarkers, setDraftMarkers] = useState({});
  const [clickMenu, setClickMenu] = useState(null);

  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    currentLocation: '',
    pickupLocation: '',
    dropoffLocation: '',
    cycleUsed: '0',
    driverName: '',
    coDriverName: '',
    vehicleId: '',
    trailerId: '',
    licensePlate: '',
    licenseState: '',
    carrierName: '',
    officeAddress: '',
    homeTerminal: '',
    manifestNo: ''
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    const required = {
      driverName: 'Primary Driver required',
      vehicleId: 'Vehicle ID required',
      currentLocation: 'Origin Vector required',
      dropoffLocation: 'Destination required',
      homeTerminal: 'Home Terminal required'
    };
    
    Object.entries(required).forEach(([field, msg]) => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = msg;
      }
    });

    const cycle = parseFloat(formData.cycleUsed);
    if (isNaN(cycle) || cycle < 0 || cycle > 70) {
      newErrors.cycleUsed = 'Must be 0-70 hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      currentLocation: '', pickupLocation: '', dropoffLocation: '', cycleUsed: '0',
      driverName: '', coDriverName: '', vehicleId: '', trailerId: '',
      licensePlate: '', licenseState: '', carrierName: '', officeAddress: '',
      homeTerminal: '', manifestNo: ''
    });
    setErrors({});
    setActiveField('currentLocation');
    setDraftMarkers({});
    setTripData(null);
  };

  const handlePlanTrip = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setLoadingStep(0);
    setError(null);
    
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 600);

    const submissionData = { ...formData };
    // Enrich with exact addresses from reverse geocoding if available
    for (const field of Object.keys(draftMarkers)) {
      if (draftMarkers[field]?.address) {
        submissionData[field] = draftMarkers[field].address;
      }
    }

    try {
      const data = await planTrip(submissionData);
      await new Promise(r => setTimeout(r, 1000));
      setTripData(data);
      setActiveTab('map');
      
      const newRecent = [
        {
          id: Date.now(),
          from: formData.currentLocation,
          to: formData.dropoffLocation,
          formData: { ...formData }
        },
        ...recentTrips.slice(0, 4)
      ];
      setRecentTrips(newRecent);
      localStorage.setItem('recentTrips', JSON.stringify(newRecent));
      
    } catch (err) {
      setError(err?.response?.data?.error || 'Vector Calculation Interrupted.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const clearWorkspace = () => {
    resetForm();
    setActiveTab('map');
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--bg-main)]">
      {/* Brand Header */}
      <header className="h-16 md:h-20 shrink-0 flex items-center justify-between px-4 md:px-10 relative z-[6000] border-b border-black/5 dark:border-white/5 bg-[var(--bg-main)]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 md:gap-10 min-w-0">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="logo-box">
              <Command className="w-5 h-5 text-white dark:text-slate-900 relative z-10" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl lg:text-2xl text-brand leading-none font-black italic">
                SPOTTER <span className="text-blue-600">ELD</span>
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[8px] font-black tracking-[0.3em] opacity-30 uppercase">v2.5 Tactical</span>
                <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                <span className="text-[8px] font-black tracking-[0.3em] opacity-30 uppercase">Audit Ready</span>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl md:rounded-[1.2rem]">
            {[
              { id: 'map', icon: MapIcon, label: 'Tactical View' },
              { id: 'logs', icon: FileText, label: 'Daily Logs' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 md:px-5 lg:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-[11px] font-black tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'opacity-40 hover:opacity-100'}`}
              >
                <tab.icon size={14} /> {tab.label.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-5">
          <button 
            onClick={toggleTheme}
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm hover:scale-110 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
          </button>
        </div>
      </header>

      {/* Main Mission Control */}
      <main className="flex-grow flex overflow-hidden">
        <aside className="w-[300px] lg:w-[340px] xl:w-[380px] shrink-0 border-r border-black/5 dark:border-white/5 flex flex-col bg-slate-50/50 dark:bg-slate-900/10">
          <div className="flex-grow overflow-y-auto p-4 md:p-6 xl:p-8 space-y-10 custom-scrollbar">
            <TripForm 
              onPlanTrip={handlePlanTrip} 
              loading={loading} 
              formData={formData}
              errors={errors}
              onChange={handleFormChange}
              onReset={resetForm}
              activeField={activeField}
              setActiveField={setActiveField}
            />

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4 items-center text-red-500"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-10 border-t border-black/5 dark:border-white/5">
              <h3 className="text-tactical opacity-20 mb-6 flex items-center gap-2">
                <History size={13} /> Operation History
              </h3>
              <div className="space-y-3">
                {recentTrips.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[2rem] text-center opacity-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Recent Missions</p>
                  </div>
                ) : recentTrips.map(trip => (
                  <div 
                    key={trip.id} 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, ...trip.formData }));
                      setErrors({});
                      setActiveTab('map');
                    }}
                    className="p-5 rounded-[1.5rem] bg-white dark:bg-slate-800/40 border border-black/5 dark:border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="truncate">
                      <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Target Vector</p>
                      <p className="text-[11px] font-black text-slate-900 dark:text-white truncate mt-0.5">{trip.to}</p>
                    </div>
                    <Activity size={14} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Visualizer Area */}
        <section className="flex-grow relative bg-white/10 dark:bg-slate-950/20">
          {/* Tactical Progress Overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-[5000] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center"
              >
                <div className="relative w-40 h-40 flex items-center justify-center mb-12">
                   <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                   <motion.div 
                      className="absolute inset-0 border-4 border-t-blue-600 rounded-full" 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                   />
                   <Command className="w-12 h-12 text-white animate-pulse" />
                </div>
                
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 italic">Mission Initialization</h2>
                
                <div className="w-full max-w-md space-y-4">
                   {LOADING_STEPS.map((step, idx) => (
                      <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${loadingStep >= idx ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-4'}`}>
                         <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingStep > idx ? 'bg-emerald-500' : loadingStep === idx ? 'bg-blue-600' : 'bg-white/10'}`}>
                            {loadingStep > idx ? <CheckCircle2 size={12} className="text-white" /> : <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                         </div>
                         <span className={`text-xs font-black uppercase tracking-widest ${loadingStep === idx ? 'text-blue-400' : 'text-white/40'}`}>{step}</span>
                      </div>
                   ))}
                </div>
                
                <p className="mt-12 text-tactical opacity-20 animate-pulse">Establishing tactical downlink...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'map' ? (
              <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full relative">
                <MapView 
                  route={tripData?.route} 
                  theme={theme} 
                  draftMarkers={draftMarkers}
                  onMapClick={(lat, lng, point) => setClickMenu({ lat, lng, x: point.x, y: point.y })} 
                />

                {tripData && (
                  <div className="absolute bottom-10 left-0 right-0 z-[1000] px-6 flex justify-center">
                    <div className="w-full max-w-4xl lg:max-w-5xl">
                      <ErrorBoundary>
                        <TripSummary route={tripData.route} dailyLogs={tripData.daily_logs} />
                      </ErrorBoundary>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {clickMenu && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0, x: '-50%', y: '-50%' }}
                      animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
                      className="absolute z-[2000] glass-card p-2 rounded-[2.5rem] shadow-2xl flex flex-col gap-1 min-w-[240px]"
                      style={{ left: `${clickMenu.x}px`, top: `${clickMenu.y}px` }}
                    >
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20 text-center py-5">Assignment</p>
                      {[
                        { id: 'currentLocation', label: 'Origin Point', color: 'text-emerald-500', dot: 'bg-emerald-500' },
                        { id: 'pickupLocation', label: 'Hub Intercept', color: 'text-amber-500', dot: 'bg-amber-500' },
                        { id: 'dropoffLocation', label: 'Target Dest', color: 'text-rose-500', dot: 'bg-rose-500' }
                      ].map(item => (
                        <button 
                          key={item.id}
                          onClick={async () => {
                            const { lat, lng } = clickMenu;
                            const fieldId = item.id;
                            setClickMenu(null);
                            
                            const coordsStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                            setDraftMarkers(prev => ({ ...prev, [fieldId]: { lat, lng } }));
                            setFormData(prev => ({ ...prev, [fieldId]: coordsStr }));
                            setErrors(prev => ({ ...prev, [fieldId]: null }));
                            setActiveField(fieldId);

                             try {
                               const address = await reverseGeocode(lat, lng);
                               if (address) {
                                 setFormData(prev => ({ ...prev, [fieldId]: address }));
                                 setDraftMarkers(prev => ({ ...prev, [fieldId]: { lat, lng, address } }));
                               }
                             } catch (err) {
                               console.error("Geocoding failed, keeping coordinates.");
                             }
                           }}
                          className={`w-full text-left px-8 py-5 rounded-[2rem] text-[11px] font-black uppercase ${item.color} hover:bg-slate-500/10 transition-all flex items-center gap-4 group ${activeField === item.id ? 'bg-slate-500/5' : ''}`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${item.dot} shadow-lg shrink-0`} /> 
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                      <button onClick={() => setClickMenu(null)} className="w-full py-5 text-[10px] font-black uppercase opacity-20 hover:opacity-100 transition-opacity">Abort</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                key="logs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="h-full w-full overflow-y-auto overflow-x-auto p-4 md:p-8 xl:p-12 custom-scrollbar"
              >
                <LogSheets logs={tripData?.daily_logs || []} meta={tripData?.meta} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Global Page Footer */}
      <footer className="h-12 shrink-0 border-t border-black/5 dark:border-white/5 bg-[var(--bg-main)]/80 backdrop-blur-xl flex items-center justify-between px-10 z-[3000]">
        <div className="flex items-center gap-6">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 italic">© 2026 Spotter Tactical Logistics</p>
          <div className="h-4 w-px bg-slate-500/10" />
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest opacity-30">System Nominal</span>
          </div>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30">
          Developed by <span className="opacity-100 text-blue-600">Raj</span> • Audit-Ready v2.5
        </p>
      </footer>
    </div>
  );
}

export default App;
