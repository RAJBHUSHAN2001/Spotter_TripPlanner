/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TripForm from './components/TripForm';
import MapView from './components/MapView';
import TripSummary from './components/TripSummary';
import LogSheets from './components/LogSheets';
import ErrorBoundary from './components/ErrorBoundary';
import { planTrip, reverseGeocode } from './api/tripApi';
import { AlertCircle, Moon, Sun, FileText, Map as MapIcon, History, Play, Compass, Activity, RotateCcw, Command } from 'lucide-react';

function App() {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [activeTab, setActiveTab] = useState('map');
  const [mapClickData, setMapClickData] = useState(null);
  const [recentTrips, setRecentTrips] = useState(() => JSON.parse(localStorage.getItem('recentTrips') || '[]'));
  const [activeField, setActiveField] = useState('currentLocation');
  const [draftMarkers, setDraftMarkers] = useState({});
  const [clickMenu, setClickMenu] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handlePlanTrip = async (formData) => {
    setLoading(true);
    setError(null);
    
    // Accuracy Patch: Use coordinates for map-clicked points to ensure 100% routing precision
    const submissionData = { ...formData };
    Object.keys(draftMarkers).forEach(field => {
      const pos = draftMarkers[field];
      if (pos && pos.lat && pos.lng) {
        submissionData[field] = `${pos.lat}, ${pos.lng}`;
      }
    });

    try {
      const data = await planTrip(submissionData);
      setTripData(data);
      setActiveTab('map');
      
      const newRecent = [
        { id: Date.now(), from: formData.currentLocation, to: formData.dropoffLocation },
        ...recentTrips.slice(0, 4)
      ];
      setRecentTrips(newRecent);
      localStorage.setItem('recentTrips', JSON.stringify(newRecent));
      
    } catch (err) {
      setError(err?.response?.data?.error || 'Vector Calculation Interrupted.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const clearWorkspace = () => {
    setTripData(null);
    setDraftMarkers({});
    setActiveTab('map');
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--bg-main)]">
      {/* Brand Header */}
      <header className="h-20 shrink-0 flex items-center justify-between px-10 z-50 border-b border-black/5 dark:border-white/5 bg-[var(--bg-main)]/80 backdrop-blur-xl">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="logo-box">
              <Command className="w-5 h-5 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl text-brand leading-none">
                SPOTTER <span className="text-blue-600 dark:text-blue-400">ELD</span>
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[8px] font-black tracking-[0.3em] opacity-30 uppercase">v2.4 Production</span>
                <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                <span className="text-[8px] font-black tracking-[0.3em] opacity-30 uppercase">Tactical.NAV</span>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/40 p-1.5 rounded-[1.2rem]">
            {[
              { id: 'map', icon: MapIcon, label: 'Tactical View' },
              { id: 'logs', icon: FileText, label: 'Daily Logs' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'opacity-40 hover:opacity-100'}`}
              >
                <tab.icon size={14} /> {tab.label.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <button 
            onClick={clearWorkspace}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold text-red-500 hover:bg-red-500/5 transition-all"
          >
            <RotateCcw size={14} /> RESET WORKSPACE
          </button>

          <div className="w-px h-6 bg-slate-500/10" />

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
        <aside className="w-[480px] shrink-0 border-r border-black/5 dark:border-white/5 flex flex-col bg-slate-50/50 dark:bg-slate-900/10 overflow-y-auto">
          <div className="p-12 space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-tactical opacity-30 flex items-center gap-2">
                <Compass size={14} /> Tactical Navigator
              </h2>
              <div className="flex items-center gap-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-600">HOS COMPLIANT</span>
              </div>
            </div>

            <TripForm 
              onPlanTrip={handlePlanTrip} 
              loading={loading} 
              mapClickData={mapClickData} 
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
              <h3 className="text-tactical opacity-30 mb-6 flex items-center gap-2">
                <History size={13} /> Operation History
              </h3>
              <div className="space-y-3">
                {recentTrips.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[2rem] text-center opacity-20">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No Active Logs</p>
                  </div>
                ) : recentTrips.map(trip => (
                  <div 
                    key={trip.id} 
                    onClick={() => {
                      setMapClickData({ lat: 0, lng: 0, address: trip.from, t: Date.now() });
                    }}
                    className="p-5 rounded-[1.5rem] bg-white dark:bg-slate-800/40 border border-black/5 dark:border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="truncate">
                      <p className="text-[11px] font-bold opacity-70 uppercase truncate">Vector: {trip.to}</p>
                      <p className="text-[8px] text-tactical opacity-20 mt-1">RE-INITIATE MISSION</p>
                    </div>
                    <Activity size={14} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Visualizer Area */}
        <section className="flex-grow relative bg-white/20 dark:bg-slate-950/20">
          <AnimatePresence mode="wait">
            {activeTab === 'map' ? (
              <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full relative">
                <MapView 
                  route={tripData?.route} 
                  theme={theme} 
                  draftMarkers={draftMarkers}
                  onMapClick={(lat, lng, point) => setClickMenu({ lat, lng, x: point.x, y: point.y })} 
                />

                {/* Tactical HUD Overlay */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-6 pointer-events-none">
                  {!tripData && !loading && (
                    <motion.div 
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-white/10"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-tactical">Manual Entry: Define {activeField.replace('Location', '')} Point</span>
                    </motion.div>
                  )}
                  
                  {Object.keys(draftMarkers).length >= 3 && !loading && (
                    <motion.button
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      onClick={(e) => { e.stopPropagation(); document.getElementById('main-submit-btn').click(); }}
                      className="btn-premium flex items-center gap-3 pointer-events-auto"
                    >
                      <Play fill="currentColor" size={14} /> <span>Initiate Plan</span>
                    </motion.button>
                  )}
                </div>

                <AnimatePresence>
                  {clickMenu && (
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0, x: '-50%', y: '-20%' }}
                      animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
                      className="absolute z-[2000] glass-card p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col gap-1 min-w-[240px]"
                      style={{ 
                        left: `${clickMenu.x}px`, 
                        top: `${clickMenu.y}px`,
                      }}
                    >
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20 text-center py-5">Point Assignment</p>
                      {[
                        { id: 'currentLocation', label: 'Start Point', color: 'text-emerald-500' },
                        { id: 'pickupLocation', label: 'Hub Intercept', color: 'text-amber-500' },
                        { id: 'dropoffLocation', label: 'Target Dest', color: 'text-rose-500' }
                      ].map(item => (
                        <button 
                          key={item.id}
                          onClick={async () => {
                            const { lat, lng } = clickMenu;
                            setClickMenu(null);
                            const address = await reverseGeocode(lat, lng);
                            setMapClickData({ lat, lng, address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, t: Date.now() });
                            setActiveField(item.id);
                            setDraftMarkers(prev => ({ ...prev, [item.id]: { lat, lng } }));
                          }}
                          className={`w-full text-left px-8 py-5 rounded-[2rem] text-[11px] font-black uppercase ${item.color} hover:bg-slate-500/10 transition-all flex items-center gap-4 group`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${item.color.replace('text', 'bg')} shadow-lg group-hover:scale-125 transition-transform`} /> 
                          <span className="tracking-widest">{item.label}</span>
                        </button>
                      ))}
                      <div className="h-px bg-slate-500/10 my-3 mx-4" />
                      <button onClick={() => setClickMenu(null)} className="w-full py-5 text-[10px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity tracking-widest">Abort</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {tripData && (
                  <div className="absolute bottom-10 left-10 right-10 z-[1000]">
                    <ErrorBoundary>
                      <TripSummary route={tripData.route} dailyLogs={tripData.daily_logs} />
                    </ErrorBoundary>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="h-full w-full overflow-y-auto p-16 custom-scrollbar bg-white dark:bg-slate-900/20"
              >
                <ErrorBoundary>
                  <LogSheets logs={tripData?.daily_logs || []} meta={tripData?.meta} />
                </ErrorBoundary>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

export default App;
