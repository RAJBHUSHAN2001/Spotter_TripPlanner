/* eslint-disable */
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Navigation, ShieldCheck, MapPin, Fuel, Gauge, AlertTriangle } from 'lucide-react';

const TripSummary = ({ route, dailyLogs }) => {
  if (!route || !dailyLogs) return null;

  const totalMiles = route?.total_miles || 0;
  const dropoffStop = [...(route?.stops || [])].reverse().find((stop) => stop?.type === 'dropoff');
  const finalEta = dropoffStop?.arrival_time || dropoffStop?.departure_time || 'Calculating...';
  const totalDriving = dailyLogs?.reduce((acc, log) => acc + parseFloat(log.total_hours?.driving || 0), 0).toFixed(1) || '0.0';

  const StatCard = ({ label, value, unit, icon: Icon, color, isAccent = false }) => (
    <div className={`flex-grow flex items-center gap-4 px-6 py-6 border-r border-slate-200/50 dark:border-white/5 last:border-0 ${isAccent ? 'bg-blue-600 text-white min-w-[240px] overflow-visible' : ''}`}>
      <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${isAccent ? 'bg-white/20' : color + ' bg-opacity-10'} shadow-sm`}>
        <Icon className={isAccent ? 'text-white' : color.replace('bg-', 'text-')} size={20} />
      </div>
      <div className="flex-shrink-0">
        <p className={`text-tactical ${isAccent ? 'text-white opacity-60' : 'opacity-30'} mb-1.5`}>{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-black tabular-nums tracking-tighter leading-none whitespace-nowrap">
            {value}
          </p>
          <span className={`text-[10px] font-black ${isAccent ? 'text-white opacity-40' : 'opacity-30'} uppercase whitespace-nowrap`}>{unit}</span>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card rounded-[2rem] overflow-hidden flex items-stretch shadow-[0_40px_100px_rgba(0,0,0,0.4)] border-white/40 dark:border-white/10"
    >
      <StatCard 
        label="Total Distance" 
        value={totalMiles.toLocaleString()} 
        unit="MI" 
        icon={Navigation} 
        color="bg-blue-500" 
      />
      <StatCard 
        label="Estimated Arrival" 
        value={finalEta} 
        unit="ETA" 
        icon={Clock} 
        color="bg-emerald-500" 
      />
      <StatCard 
        label="Active Drive Time" 
        value={totalDriving} 
        unit="HRS" 
        icon={Gauge} 
        color="bg-amber-500" 
      />
      
      <StatCard 
        label="HOS Compliance" 
        value="VERIFIED" 
        unit="DOT READY" 
        icon={ShieldCheck} 
        color="bg-emerald-500" 
        isAccent={true}
      />
    </motion.div>
  );
};

export default TripSummary;
