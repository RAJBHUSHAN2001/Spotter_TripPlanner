/* eslint-disable */
import React from 'react';
import { motion } from 'framer-motion';
import DailyLogSheet from './DailyLogSheet';
import { FileText, Download, Map as MapIcon, Compass } from 'lucide-react';

const LogSheets = ({ logs, meta }) => {
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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <FileText className="text-blue-500 w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            HOS Compliance Logs
          </h2>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-slate-900 dark:text-white"
        >
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div className="space-y-12 pb-20">
        {logs.map((log, idx) => (
          <motion.div 
            key={idx}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <DailyLogSheet log={log} meta={meta} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LogSheets;
