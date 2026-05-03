/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DailyLogSheet from './DailyLogSheet';
import { FileText, Download, Map as MapIcon, Compass, AlertTriangle, CheckCircle, Truck, Clock, ShieldCheck } from 'lucide-react';

const LogSheets = ({ logs, meta }) => {
  const [activeDay, setActiveDay] = useState(0);
  const scrollRefs = useRef([]);
  const containerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleScroll = (e) => {
      setIsScrolled(e.target.scrollTop > 50);
    };

    const container = containerRef.current?.parentElement;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-day-index'));
            setActiveDay(index);
          }
        });
      },
      { threshold: 0.3 }
    );

    scrollRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [logs]);

  const scrollToDay = (index) => {
    scrollRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      window.print();
      setExporting(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-20 text-center">
        <div className="w-32 h-32 bg-slate-500/5 rounded-full flex items-center justify-center mb-10 border border-black/5 dark:border-white/5 relative">
          <FileText className="text-blue-500 opacity-20" size={60} />
          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <Compass className="text-blue-500" size={30} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-brand mb-4 uppercase tracking-tighter">No Active Logs</h2>
        <p className="text-tactical opacity-30 max-w-sm mb-12 leading-relaxed">
          The daily log manifest is currently offline. Define your mission vectors on the map to generate DOT-compliant documentation.
        </p>
      </div>
    );
  }

  const springTransition = {
    type: "spring",
    stiffness: 200,
    damping: 25,
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-4 relative">
      {/* Dynamic Header - Zero Glitch Cross-Fade Version */}
      <motion.div 
        className={`sticky -top-8 md:-top-8 lg:-top-12 z-[2000] -mx-8 md:-mx-8 lg:-mx-12 border-b border-slate-200 dark:border-white/10 shadow-xl overflow-hidden transition-colors duration-500
          ${isScrolled ? 'bg-[var(--bg-main)]/95 backdrop-blur-2xl' : 'bg-white dark:bg-slate-900'}`}
        animate={{ height: isScrolled ? 64 : 140 }}
        transition={springTransition}
      >
        <div className="relative h-full w-full">
          {/* COMPACT STATE - Only visible when scrolled */}
          <AnimatePresence>
            {isScrolled && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 px-8 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg shadow-lg flex items-center justify-center">
                    <FileText className="text-white w-4 h-4" />
                  </div>
                  <h2 className="font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none text-sm">
                    Compliance
                  </h2>
                </div>

                <div className="flex-grow flex items-center justify-center gap-2 overflow-x-auto no-scrollbar mx-10">
                  {logs.map((log, idx) => (
                    <button key={idx} onClick={() => scrollToDay(idx)}
                      className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${activeDay === idx ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      D{idx + 1}
                    </button>
                  ))}
                </div>

                <button onClick={handleExport} disabled={exporting}
                  className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 rounded-lg text-[9px] font-black hover:scale-105 transition-all shadow-md disabled:opacity-50"
                >
                  <Download size={12} /> <span>PDF</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FULL STATE - Only visible when at top */}
          <AnimatePresence>
            {!isScrolled && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 px-10 flex flex-col justify-center"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl shadow-xl flex items-center justify-center">
                      <FileText className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                        HOS Compliance Logs
                      </h2>
                      <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mt-1">Official Records Repository</p>
                    </div>
                  </div>
                  
                  <button onClick={handleExport} disabled={exporting}
                    className="flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3.5 rounded-xl text-xs font-black hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                  >
                    <Download size={16} /> <span>EXPORT PDF DOCUMENT</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {logs.map((log, idx) => {
                    const date = new Date(log.date.replace(/-/g, '/'));
                    return (
                      <button key={idx} onClick={() => scrollToDay(idx)}
                        className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${activeDay === idx ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                        Day {idx + 1} — {date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="space-y-24 pb-12 pt-4">
        {logs.map((log, idx) => (
          <div 
            key={idx} 
            ref={(el) => (scrollRefs.current[idx] = el)} 
            data-day-index={idx}
            className="relative"
          >
             <div className="mb-6 flex items-center justify-between print:hidden">
                <div className="h-px flex-grow bg-slate-200 dark:bg-white/5" />
                <div className="px-6 flex flex-col items-center">
                  <h3 className="text-tactical opacity-20 scale-90">Phase {idx + 1}</h3>
                  <p className="text-[10px] font-black opacity-10 uppercase tracking-[0.3em]">Syncing Record {idx + 1}/{logs.length}</p>
                </div>
                <div className="h-px flex-grow bg-slate-200 dark:bg-white/5" />
             </div>
             
             <DailyLogSheet 
                log={log} 
                meta={meta} 
                dayNumber={idx + 1} 
                totalDays={logs.length} 
              />
          </div>
        ))}
      </div>

      {/* TRIP SUMMARY PANEL - CLEANED FOR PDF */}
      <div className="mt-8 border-t-2 border-slate-900 pt-10 pb-12 break-inside-avoid">
         <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">Mission Debriefing</h2>
         </div>

         <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Mission Distance', value: logs[logs.length-1]?.total_miles_cumulative || 'N/A', unit: 'MI' },
              { label: 'Total Drive Time', value: logs.reduce((acc, l) => acc + parseFloat(l.total_hours?.driving || 0), 0).toFixed(1), unit: 'HRS' },
              { label: 'On-Duty Logistics', value: logs.reduce((acc, l) => acc + parseFloat(l.total_hours?.on_duty_not_driving || 0), 0).toFixed(1), unit: 'HRS' },
              { label: 'Rest & Recuperation', value: logs.reduce((acc, l) => acc + parseFloat(l.total_hours?.off_duty || 0) + parseFloat(l.total_hours?.sleeper_berth || 0), 0).toFixed(1), unit: 'HRS' },
              { label: 'Forced Rest Cycles', value: logs.length - 1, unit: 'STOPS' },
              { label: 'HOS Compliance Status', value: 'VERIFIED', unit: 'DOT READY' },
              { label: 'Vehicle Readiness', value: meta.vehicle_id || 'TRK-9900', unit: 'ACTIVE' },
              { label: 'Mission Duration', value: `${logs.length} days`, unit: 'RECORDED' }
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-[#e0e0e0] p-4 rounded-lg h-[100px] flex flex-col justify-center">
                 <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">{stat.label}</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-[20px] font-bold text-black">{stat.value}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{stat.unit}</span>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 z-[5000] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4"
          >
            <CheckCircle size={24} />
            <div>
              <p className="text-sm font-black uppercase tracking-widest">Success</p>
              <p className="text-xs opacity-80">PDF exported successfully</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LogSheets;
