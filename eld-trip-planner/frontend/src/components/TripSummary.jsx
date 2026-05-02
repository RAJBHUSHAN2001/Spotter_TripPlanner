/* eslint-disable */
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Navigation, ShieldCheck, MapPin, Fuel, Gauge } from 'lucide-react';

const TripSummary = ({ route, dailyLogs }) => {
  if (!route || !dailyLogs) return null;

  const totalMiles = route?.total_miles || 0;
  
  const lastDay = dailyLogs?.[dailyLogs.length - 1];
  const lastStop = lastDay?.segments?.[lastDay.segments.length - 1];
  const finalEta = lastDay && lastStop ? `${lastDay.date} ${lastStop.end_time}` : 'Calculating...';

  const totalDriving = dailyLogs?.reduce((acc, log) => acc + parseFloat(log.total_hours?.driving || 0), 0).toFixed(1) || '0.0';

  const StatItem = ({ label, value, unit, icon: Icon, color }) => (
    <div className="flex items-center gap-5 px-6 border-r border-black/5 dark:border-white/5 last:border-0">
      <div className={`w-11 h-11 flex items-center justify-center rounded-2xl ${color} bg-opacity-10 shadow-inner`}>
        <Icon className={color.replace('bg-', 'text-')} size={18} />
      </div>
      <div>
        <p className="text-tactical opacity-30 mb-1">{label}</p>
        <p className="text-xl font-black tabular-nums tracking-tighter">
          {value} <span className="text-[10px] font-bold opacity-30 ml-0.5">{unit}</span>
        </p>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card rounded-[2.5rem] p-2 flex items-center shadow-2xl border-white/40 dark:border-white/10"
    >
      <div className="flex-grow flex items-center py-4">
        <StatItem 
          label="Total Distance" 
          value={totalMiles.toLocaleString()} 
          unit="MI" 
          icon={Navigation} 
          color="bg-blue-500" 
        />
        <StatItem 
          label="Estimated Arrival" 
          value={finalEta} 
          unit="ETA" 
          icon={Clock} 
          color="bg-emerald-500" 
        />
        <StatItem 
          label="Active Drive Time" 
          value={totalDriving} 
          unit="HRS" 
          icon={Gauge} 
          color="bg-amber-500" 
        />
      </div>

      <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] px-8 py-5 flex items-center gap-4 m-2 shadow-xl">
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest leading-none">Operational Status</p>
          <p className="text-[8px] font-bold opacity-40 uppercase tracking-[0.2em] mt-1 italic">HOS Rule 395.3 Compliance</p>
        </div>
        <div className="w-px h-8 bg-current opacity-20" />
        <ShieldCheck size={24} />
      </div>
    </motion.div>
  );
};

export default TripSummary;
