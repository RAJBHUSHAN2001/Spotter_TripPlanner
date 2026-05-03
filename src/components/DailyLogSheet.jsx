/* eslint-disable */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Truck, Globe, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

const ROWS = [
  { id: 'off_duty', label: 'OFF DUTY', color: '#2563eb' },
  { id: 'sleeper_berth', label: 'SLEEPER BERTH', color: '#8b5cf6' },
  { id: 'driving', label: 'DRIVING', color: 'currentColor' }, // Using currentColor to adapt to theme
  { id: 'on_duty_not_driving', label: 'ON DUTY (ND)', color: '#10b981' }
];

const ROW_HEIGHT = 40; 
const HOUR_WIDTH = 30; 
const X_OFFSET = 110;

const DailyLogSheet = ({ log, meta = {}, dayNumber, totalDays }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const getStatusY = (status) => {
    const idx = ROWS.findIndex(r => r.id === status);
    return 30 + (idx * ROW_HEIGHT);
  };

  const timeToX = (timeStr) => {
    if (!timeStr) return X_OFFSET;
    const parts = timeStr.split(':');
    if (parts.length < 2) return X_OFFSET;
    const [h, m] = parts.map(Number);
    return X_OFFSET + (h * HOUR_WIDTH) + (m / 60 * HOUR_WIDTH);
  };



  return (
    <div className="compliance-doc relative bg-white dark:bg-slate-900 shadow-2xl rounded-sm border-t-[4px] border-blue-600 overflow-hidden mb-16">
      {/* Redesigned Date Badge & Day Indicator */}
      <div className="flex items-stretch h-20 border-b-2 border-slate-900 dark:border-white">
        <div className="bg-slate-100 dark:bg-slate-800/80 px-8 flex flex-col justify-center border-r-2 border-slate-900 dark:border-white">
          <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">Mission Phase</span>
          <span className="text-xl font-black text-blue-600 uppercase italic">Day {dayNumber || 1} <span className="opacity-30 text-slate-900 dark:text-white">/ {totalDays || 1}</span></span>
        </div>
        <div className="flex-grow flex items-center px-10 bg-slate-900 text-white relative">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />
          <h2 className="text-3xl font-black tracking-tight italic uppercase">
            {new Date(log.date.replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
          </h2>
          <div className="ml-auto">
             <div className="bg-emerald-600 px-6 py-2 rounded-sm flex items-center gap-3 shadow-lg">
               <span className="text-xs font-black uppercase text-white tracking-widest">✓ ELD RECORD VERIFIED</span>
             </div>
          </div>
        </div>
      </div>

      <div className="p-10">
        {/* Header Info Card - High Performance Layout */}
        <div className="grid grid-cols-4 border-2 border-slate-900 dark:border-white mb-10 rounded-sm overflow-hidden divide-x-2 divide-slate-900 dark:divide-white">
          <div className="p-5 space-y-1.5">
            <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Primary Driver</p>
            <p className="font-bold text-sm truncate uppercase">{meta.driver_name || 'NOT SPECIFIED'}</p>
          </div>
          <div className="p-5 space-y-1.5">
            <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Co-Driver</p>
            <p className="font-bold text-sm truncate uppercase">{meta.co_driver_name || 'NONE'}</p>
          </div>
          <div className="p-5 space-y-1.5 bg-slate-50 dark:bg-white/5">
            <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Total Miles</p>
            <p className="font-bold text-sm flex items-center gap-3">🚛 {log.total_miles_cumulative || log.total_miles_today} <span className="text-[10px] opacity-30">MI</span></p>
          </div>
          <div className="p-5 space-y-1.5 bg-slate-50 dark:bg-white/5">
            <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Today Mileage</p>
            <p className="font-bold text-sm flex items-center gap-3">📍 {log.total_miles_today} <span className="text-[10px] opacity-30">MI</span></p>
          </div>
          <div className="p-5 space-y-1.5 border-t-2 border-slate-900 dark:border-white">
            <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Vehicle ID</p>
            <p className="font-bold text-sm">{meta.vehicle_id}</p>
          </div>
          <div className="p-5 space-y-1.5 border-t-2 border-slate-900 dark:border-white">
            <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Trailer(s)</p>
            <p className="font-bold text-sm">{meta.trailer_id || 'N/A'}</p>
          </div>
          <div className="p-5 space-y-1.5 col-span-2 border-t-2 border-slate-900 dark:border-white">
            <p className={`text-[9px] font-black uppercase tracking-widest ${!meta.home_terminal ? 'text-amber-600' : 'opacity-40'}`}>
              {!meta.home_terminal ? '⚠ HOME TERMINAL: NOT SET' : 'Home Terminal'}
            </p>
            <p className={`font-bold text-sm ${!meta.home_terminal ? 'text-amber-600 italic' : 'uppercase'}`}>
              {meta.home_terminal || 'REQUIRED FOR COMPLIANCE'}
            </p>
          </div>
        </div>

        {/* Graph Legend */}
        <div className="flex gap-8 mb-4 px-2" style={{ marginLeft: X_OFFSET }}>
          {ROWS.map(row => (
            <div key={row.id} className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: row.color }} />
              <span className="text-[11px] font-black opacity-40 uppercase tracking-tighter">{row.label}</span>
            </div>
          ))}
        </div>

        {/* 24-Hour Grid */}
        <div className="relative overflow-x-auto custom-scrollbar pb-12 bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-sm border border-slate-200 dark:border-white/10">
          <svg width={X_OFFSET + (24 * HOUR_WIDTH) + 120} height={230} className="overflow-visible">
            {/* Grid Row Backgrounds - Fixed neutral color to prevent "ghost" segments */}
            {ROWS.map((row, i) => (
              <React.Fragment key={row.id}>
                <line 
                  x1={X_OFFSET} 
                  y1={getStatusY(row.id)} 
                  x2={X_OFFSET + 24 * HOUR_WIDTH} 
                  y2={getStatusY(row.id)} 
                  stroke="#e2e8f0" 
                  strokeWidth="1" 
                  strokeDasharray="2,2"
                />
                <text x={X_OFFSET - 20} y={getStatusY(row.id) + 4} textAnchor="end" className="text-[11px] font-black opacity-40 uppercase tracking-tighter fill-slate-500">
                  {row.label}
                </text>
              </React.Fragment>
            ))}

            {/* Vertical Hour Markers & Labels */}
            {Array.from({ length: 25 }).map((_, i) => {
              const x = X_OFFSET + (i * HOUR_WIDTH);
              const isMajor = i % 12 === 0;
              const isTwoHour = i % 2 === 0;
              return (
                <React.Fragment key={i}>
                  <line 
                    x1={x} y1={10} x2={x} y2={180} 
                    stroke="#e2e8f0" 
                    opacity={isMajor ? 1 : 0.5} 
                    strokeDasharray={isMajor ? "0" : "3,3"}
                    strokeWidth={isMajor ? 1 : 0.5}
                  />
                  {isTwoHour && (
                    <text x={x} y={205} textAnchor="middle" className={`text-[10px] font-black fill-slate-400 ${isMajor ? 'fill-slate-900 dark:fill-white scale-110' : ''}`}>
                      {i === 0 ? 'MID' : i === 12 ? 'NOON' : i === 24 ? 'MID' : i}
                    </text>
                  )}
                </React.Fragment>
              );
            })}

            {/* Total Hrs Summary Column */}
            <rect x={X_OFFSET + 24 * HOUR_WIDTH + 20} y={10} width="90" height="175" fill="none" stroke="#e2e8f0" strokeWidth="2" />
            <text x={X_OFFSET + 24 * HOUR_WIDTH + 65} y={-5} textAnchor="middle" className="text-[9px] font-black opacity-40 uppercase tracking-widest fill-slate-500">Total Hrs</text>
            
            {ROWS.map((row, i) => (
              <React.Fragment key={`total-${row.id}`}>
                <text x={X_OFFSET + 24 * HOUR_WIDTH + 65} y={getStatusY(row.id) - 12} textAnchor="middle" className="text-[7px] font-black opacity-30 uppercase tracking-widest fill-slate-500">
                  {row.label}
                </text>
                <text x={X_OFFSET + 24 * HOUR_WIDTH + 65} y={getStatusY(row.id) + 6} textAnchor="middle" className="text-base font-black italic fill-slate-900 dark:fill-white">
                  {parseFloat(log.total_hours?.[row.id] || 0).toFixed(1)}
                </text>
                <line x1={X_OFFSET + 24 * HOUR_WIDTH + 30} y1={getStatusY(row.id) + 20} x2={X_OFFSET + 24 * HOUR_WIDTH + 100} y2={getStatusY(row.id) + 20} stroke="#e2e8f0" />
              </React.Fragment>
            ))}

            <text x={X_OFFSET + 24 * HOUR_WIDTH + 65} y={180} textAnchor="middle" className={`text-xs font-black ${Math.abs(Object.values(log.total_hours || {}).reduce((a, b) => a + b, 0) - 24) > 0.01 ? 'fill-red-600' : 'fill-slate-900 dark:fill-white'}`}>
              TOTAL: {Object.values(log.total_hours || {}).reduce((a, b) => a + b, 0).toFixed(1)}
            </text>

            {/* Duty Status Segments */}
            {log.segments.map((seg, i) => {
              const startX = timeToX(seg.start_time);
              const endX = timeToX(seg.end_time);
              
              // Skip rendering segments with zero or negative width to prevent visual artifacts
              if (endX <= startX) return null;
              
              const y = getStatusY(seg.status);
              const rowColor = ROWS.find(r => r.id === seg.status)?.color;

              return (
                <React.Fragment key={i}>
                  <line 
                    x1={startX} y1={y} x2={endX} y2={y} 
                    stroke={rowColor} 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    className="cursor-pointer transition-all hover:stroke-blue-400"
                    onMouseEnter={() => setHoveredSegment(seg)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                  {i < log.segments.length - 1 && (
                    <line 
                      x1={endX} y1={y} x2={endX} y2={getStatusY(log.segments[i+1].status)} 
                      stroke={rowColor} strokeWidth="1" opacity="0.3" 
                    />
                  )}
                </React.Fragment>
              );
            })}
          </svg>

          <AnimatePresence>
            {hoveredSegment && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 right-32 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl z-20 border border-white/10 min-w-[200px]"
              >
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-40">{hoveredSegment.status.replace(/_/g, ' ')}</p>
                <p className="text-xl font-black text-blue-400 tabular-nums">{hoveredSegment.start_time} — {hoveredSegment.end_time}</p>
                <p className="text-[10px] mt-3 font-bold italic opacity-60 leading-relaxed border-t border-white/10 pt-2">{hoveredSegment.location}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Detailed Timeline Remarks */}
        <div className="mt-12">
           <h3 className="text-tactical opacity-30 mb-10 flex items-center gap-4">
             <div className="w-12 h-px bg-slate-500/20" /> DETAILED LOG REMARKS
           </h3>
           <div className="relative pl-10 space-y-2">
             <div className="absolute left-[4.25rem] top-4 bottom-4 w-px bg-slate-200 dark:bg-white/10" />
             {log.remarks.map((rem, i) => {
                const timeMatch = rem.match(/\[(.*?)\]/);
                const time = timeMatch ? timeMatch[1] : '';
                const parts = rem.replace(`[${time}]`, '').split(' - ');
                const location = parts[0].trim();
                const status = parts[1] ? parts[1].trim() : '';
                const rowColor = ROWS.find(r => status.toLowerCase().includes(r.label.toLowerCase().split(' ')[0]))?.color || '#94a3b8';

                return (
                  <div key={i} className="group relative flex items-center py-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all rounded-2xl px-6 -ml-6">
                    <div className="w-24 shrink-0">
                      <span 
                        className="inline-block px-4 py-1.5 rounded-full text-[11px] font-black text-white shadow-md tabular-nums" 
                        style={{ background: rowColor === 'currentColor' ? '#334155' : rowColor }}
                      >
                        {time}
                      </span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-[5px] relative z-10 mx-5 transition-transform group-hover:scale-125" style={{ borderColor: rowColor }} />
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white/90 truncate">{location}</p>
                    </div>
                    <div className="text-right ml-6 shrink-0">
                      <span className="text-[10px] font-black uppercase opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: rowColor }}>{status}</span>
                    </div>
                  </div>
                );
             })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLogSheet;
