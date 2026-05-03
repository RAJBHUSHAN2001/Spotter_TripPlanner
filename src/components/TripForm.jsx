/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Package, Play, Clock, RotateCcw, Target, ShieldCheck, ChevronDown, ChevronRight, Truck, User, Building, FileText, Globe, AlertCircle, LayoutGrid } from 'lucide-react';

const InputGroup = ({ label, name, icon: Icon, fieldId, type = "text", placeholder = "", value, onChange, onFocus, activeField, error }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between px-1">
      <label className={`text-tactical ${error ? 'text-red-500 opacity-100' : 'opacity-40'}`}>
        {label}
      </label>
      {activeField === fieldId && (
        <motion.span layoutId="activeDot" className="w-1 h-1 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
      )}
    </div>
    <div className="relative group">
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => onFocus(fieldId)}
        className={`tactical-input pr-12 ${activeField === fieldId ? 'bg-white dark:bg-slate-800' : ''} ${error ? 'border-red-500/50 bg-red-500/5' : ''}`}
      />
      <div className={`absolute right-4 md:right-5 top-1/2 -translate-y-1/2 transition-all ${activeField === fieldId ? 'text-blue-600' : 'opacity-20'}`}>
        {error ? <AlertCircle size={14} className="text-red-500" /> : <Icon size={14} />}
      </div>
    </div>
    <AnimatePresence>
      {error && (
        <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-[9px] font-bold text-red-500 px-1 pt-1 uppercase tracking-wider">{error}</motion.p>
      )}
    </AnimatePresence>
  </div>
);

const SectionHeader = ({ icon: Icon, title, id, isCollapsed, onToggle }) => (
  <button 
    type="button"
    onClick={() => onToggle(id)}
    className="w-full flex items-center gap-3 mb-4 group cursor-pointer"
  >
    <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
      <Icon size={12} />
    </div>
    <span className="text-tactical font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{title}</span>
    <div className="flex-grow h-px bg-slate-500/10 mx-2" />
    {isCollapsed ? <ChevronRight size={14} className="opacity-30" /> : <ChevronDown size={14} className="opacity-30" />}
  </button>
);

const TripForm = ({ onPlanTrip, loading, formData, errors, onChange, onReset, activeField, setActiveField }) => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : { identification: false, vectors: false, parameters: false };
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const toggleSection = (id) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onPlanTrip();
  };

  const commonProps = (name) => ({
    name,
    value: formData[name] || '',
    onChange,
    onFocus: setActiveField,
    activeField,
    error: errors[name]
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <SectionHeader icon={User} title="IDENTIFICATION" id="identification" isCollapsed={collapsed.identification} onToggle={toggleSection} />
        <AnimatePresence>
          {!collapsed.identification && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4 px-1">
              <InputGroup label="PRIMARY DRIVER" icon={User} fieldId="driverName" placeholder="e.g. John R. Doe" {...commonProps('driverName')} />
              <InputGroup label="CO-DRIVER (OPTIONAL)" icon={User} fieldId="coDriverName" placeholder="e.g. Jane Smith" {...commonProps('coDriverName')} />
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="VEHICLE ID" icon={Truck} fieldId="vehicleId" placeholder="TRK-9900" {...commonProps('vehicleId')} />
                <InputGroup label="TRAILER ID" icon={Package} fieldId="trailerId" placeholder="TRL-1234" {...commonProps('trailerId')} />
              </div>
              <InputGroup label="HOME TERMINAL" icon={MapPin} fieldId="homeTerminal" placeholder="City, ST (e.g. Portland, OR)" {...commonProps('homeTerminal')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <SectionHeader icon={Target} title="MISSION VECTORS" id="vectors" isCollapsed={collapsed.vectors} onToggle={toggleSection} />
        <AnimatePresence>
          {!collapsed.vectors && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4 px-1">
              <InputGroup label="ORIGIN VECTOR" icon={MapPin} fieldId="currentLocation" placeholder="Select on map..." {...commonProps('currentLocation')} />
              <InputGroup label="HUB INTERCEPT" icon={Package} fieldId="pickupLocation" placeholder="Loading point..." {...commonProps('pickupLocation')} />
              <InputGroup label="DESTINATION TARGET" icon={Target} fieldId="dropoffLocation" placeholder="Final delivery..." {...commonProps('dropoffLocation')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <SectionHeader icon={ShieldCheck} title="LOGISTICS PARAMETERS" id="parameters" isCollapsed={collapsed.parameters} onToggle={toggleSection} />
        <AnimatePresence>
          {!collapsed.parameters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4 px-1 pb-4">
              <InputGroup label="SHIPPING DOC / MANIFEST #" icon={FileText} fieldId="manifestNo" placeholder="BOL-1002345" {...commonProps('manifestNo')} />
              <InputGroup label="ACTIVE CYCLE (0-70 HRS)" icon={Clock} fieldId="cycleUsed" type="number" {...commonProps('cycleUsed')} />
              <InputGroup label="CARRIER IDENTITY" icon={Building} fieldId="carrierName" placeholder="Carrier Name Inc." {...commonProps('carrierName')} />
              <InputGroup label="HEADQUARTERS" icon={Globe} fieldId="officeAddress" placeholder="Main Office Address" {...commonProps('officeAddress')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onReset}
          className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-all border border-black/5 dark:border-white/5"
        >
          <RotateCcw size={16} />
        </button>
        
        <button
          id="main-submit-btn"
          disabled={loading}
          className="flex-grow btn-premium flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Play size={14} fill="currentColor" />
              <span>Initiate Plan</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TripForm;
