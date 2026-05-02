/* eslint-disable */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_Y = {
  off_duty: 30,
  sleeper_berth: 70,
  driving: 110,
  on_duty_not_driving: 150
};

const HOUR_WIDTH = 32; 
const X_OFFSET = 100;

const DailyLogSheet = ({ log, meta = {} }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const timeToX = (timeStr) => {
    if (!timeStr) return X_OFFSET;
    const parts = timeStr.split(':');
    if (parts.length < 2) return X_OFFSET;
    const [h, m] = parts.map(Number);
    return X_OFFSET + (h * HOUR_WIDTH) + (m / 60 * HOUR_WIDTH);
  };

  const renderSegments = () => {
    if (!log?.segments) return [];
    const lines = [];
    for (let i = 0; i < log.segments.length; i++) {
      const seg = log.segments[i];
      const startX = timeToX(seg.start_time);
      const endX = timeToX(seg.end_time);
      const y = STATUS_Y[seg.status];

      lines.push(
        <motion.line
          key={`h-${i}`}
          x1={startX} y1={y} x2={endX} y2={y}
          stroke={seg.status === 'driving' ? '#ef4444' : '#3b82f6'}
          strokeWidth="4"
          onMouseEnter={() => setHoveredSegment(seg)}
          onMouseLeave={() => setHoveredSegment(null)}
          className="cursor-pointer"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />
      );

      if (i < log.segments.length - 1) {
        const nextSeg = log.segments[i + 1];
        const nextY = STATUS_Y[nextSeg.status];
        lines.push(
          <line
            key={`v-${i}`}
            x1={endX} y1={y} x2={endX} y2={nextY}
            stroke={seg.status === 'driving' ? '#ef4444' : '#3b82f6'}
            strokeWidth="4"
            opacity="0.3"
          />
        );
      }
    }
    return lines;
  };

  return (
    <div className="compliance-doc relative">
      {/* DOT Header */}
      <div className="border-b-4 border-slate-900 dark:border-white mb-8 pb-6 flex justify-between items-end">
        <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-1 italic">Driver&apos;s Daily Log</h1>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] font-bold uppercase opacity-60 tracking-widest mt-4">
            <p><span className="opacity-40">Carrier:</span> {meta.carrier || 'SPOTTER LOGISTICS'}</p>
            <p><span className="opacity-40">Main Office:</span> {meta.office_address || 'USA'}</p>
            <p><span className="opacity-40">Home Terminal:</span> {meta.home_terminal || 'NOT SET'}</p>
            <p><span className="opacity-40">Compliance:</span> Form 395.8 / ELD Verified</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black tracking-[0.4em] opacity-30 uppercase mb-4">Official Record of Duty Status</p>
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-sm font-black text-2xl shadow-xl">
            {log.date}
          </div>
        </div>
      </div>

      {/* Driver & Vehicle Metadata */}
      <div className="grid grid-cols-6 gap-0 border-2 border-slate-900 dark:border-white mb-10 overflow-hidden rounded-sm">
        {[
          { label: 'Primary Driver', value: meta.driver_name, span: 'col-span-2' },
          { label: 'Co-Driver', value: meta.co_driver_name || 'NONE', span: 'col-span-2' },
          { label: 'Total Miles', value: `${log.total_miles_today} MI`, span: 'col-span-1' },
          { label: 'Today Mileage', value: `${log.total_miles_today} MI`, span: 'col-span-1' },
          { label: 'Truck / Tractor ID', value: meta.vehicle_id, span: 'col-span-1' },
          { label: 'Trailer Number(s)', value: meta.trailer_id, span: 'col-span-1' },
          { label: 'License Plate', value: `${meta.license_plate} (${meta.license_state})`, span: 'col-span-2' },
          { label: 'Shipping Docs / Manifest', value: meta.manifest_no || 'NOT SPECIFIED', span: 'col-span-2' },
        ].map((item, i) => (
          <div key={i} className={`${item.span} p-4 border-r border-b border-slate-900/10 dark:border-white/10 last:border-r-0`}>
            <p className="text-[8px] font-black uppercase opacity-40 mb-1 leading-none">{item.label}</p>
            <p className="font-bold text-[11px] truncate">{item.value || 'N/A'}</p>
          </div>
        ))}
      </div>

      {/* 24-Hour Grid */}
      <div className="relative mb-10 py-6 overflow-x-auto bg-slate-50/30 dark:bg-slate-800/20 rounded-xl p-6 border border-black/5 dark:border-white/5">
        <svg width="950" height="220" className="mx-auto overflow-visible">
          {Object.keys(STATUS_Y).map(status => (
            <text key={status} x={X_OFFSET - 20} y={STATUS_Y[status] + 5} textAnchor="end" className="text-[9px] font-black uppercase tracking-tighter opacity-60">
              {status.replace(/_/g, ' ')}
            </text>
          ))}

          <rect x={X_OFFSET} y={10} width={24 * HOUR_WIDTH} height="160" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8" />
          
          {Array.from({ length: 25 }).map((_, i) => (
            <React.Fragment key={i}>
              <line 
                x1={X_OFFSET + (i * HOUR_WIDTH)} y1={10} 
                x2={X_OFFSET + (i * HOUR_WIDTH)} y2={170} 
                stroke="currentColor" 
                opacity={i % 6 === 0 ? "0.6" : "0.15"} 
                strokeWidth={i % 6 === 0 ? "2" : "1"} 
              />
              <text x={X_OFFSET + (i * HOUR_WIDTH)} y="195" textAnchor="middle" className="text-[9px] font-black opacity-40">
                {i === 0 ? 'MID' : i === 12 ? 'NOON' : i === 24 ? 'MID' : i > 12 ? i - 12 : i}
              </text>
            </React.Fragment>
          ))}

          {Object.values(STATUS_Y).map(y => (
            <line key={y} x1={X_OFFSET} y1={y} x2={X_OFFSET + 24 * HOUR_WIDTH} y2={y} stroke="currentColor" opacity="0.1" strokeWidth="1" />
          ))}

          {renderSegments()}

          {/* Totals Section */}
          <rect x={X_OFFSET + 24 * HOUR_WIDTH + 15} y={10} width="65" height="160" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8" />
          <text x={X_OFFSET + 24 * HOUR_WIDTH + 47} y={-5} textAnchor="middle" className="text-[9px] font-black uppercase opacity-40">Total Hrs</text>
          {['off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving'].map(status => (
            <text key={status} x={X_OFFSET + 24 * HOUR_WIDTH + 47} y={STATUS_Y[status] + 5} textAnchor="middle" className="font-black text-sm">
              {log?.total_hours?.[status] || '0'}
            </text>
          ))}
        </svg>

        <AnimatePresence>
          {hoveredSegment && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute top-0 right-10 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-20 border border-white/10"
            >
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">{hoveredSegment.status.replace(/_/g, ' ')}</p>
              <p className="text-xl font-black text-blue-400">{hoveredSegment.start_time} — {hoveredSegment.end_time}</p>
              <p className="text-[10px] mt-2 font-bold italic opacity-70">{hoveredSegment.location}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Remarks & Recaps */}
      <div className="grid grid-cols-3 gap-10 pt-10 border-t-2 border-slate-900 dark:border-white">
        <div className="col-span-2">
          <h3 className="text-tactical opacity-30 mb-6">Detailed Log Remarks</h3>
          <div className="grid grid-cols-1 gap-3">
            {log.remarks.map((rem, i) => (
              <div key={i} className="flex gap-4 items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-black/5 dark:border-white/5">
                <span className="text-[10px] font-black text-blue-500 w-12 text-right">[{rem.split(' - ')[0]}]</span>
                <span className="text-[10px] font-bold opacity-80 truncate">{rem.split(' - ').slice(1).join(' - ')}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col justify-between">
          <div>
            <h3 className="text-tactical opacity-30 mb-4 text-right">Certification</h3>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border-2 border-dashed border-slate-900/10 dark:border-white/10">
              <p className="font-serif italic text-3xl opacity-90 text-right">{meta.driver_name || 'Driver Name'}</p>
              <p className="text-[9px] font-black uppercase tracking-widest mt-4 text-right opacity-40">Authorized Digital Signature</p>
            </div>
          </div>
          <div className="text-right pt-6">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-20">System: SPOTTER-ELD-PRO v3.2</p>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-20">Certified 49 CFR § 395.8</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLogSheet;
