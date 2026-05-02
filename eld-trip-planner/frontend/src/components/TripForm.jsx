/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Package, Play, Clock, RotateCcw, Target, ShieldCheck, ChevronDown, ChevronUp, Truck, User, Building, FileText, Globe, AlertCircle } from 'lucide-react';

const InputGroup = ({ label, name, icon: Icon, fieldId, type = "text", placeholder = "", value, onChange, onFocus, activeField, error }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between px-1">
      <label className={`text-tactical ${error ? 'text-red-500 opacity-100' : 'opacity-40'}`}>
        {label} {error && <span className="lowercase font-normal tracking-normal ml-2">({error})</span>}
      </label>
      {activeField === fieldId && (
        <motion.span layoutId="activeDot" className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
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
        min={type === "number" ? "0" : undefined}
        max={type === "number" && name === "cycleUsed" ? "70" : undefined}
      />
      <div className={`absolute right-5 top-1/2 -translate-y-1/2 transition-all ${activeField === fieldId ? 'text-blue-600' : 'opacity-20'}`}>
        {error ? <AlertCircle size={14} className="text-red-500" /> : <Icon size={14} />}
      </div>
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
    <div className="w-6 h-px bg-slate-500/10" />
    <div className="flex items-center gap-2 text-tactical opacity-50">
      <Icon size={12} className="text-blue-500/60" />
      <span className="font-black">{title}</span>
    </div>
    <div className="flex-grow h-px bg-slate-500/10" />
  </div>
);

const TripForm = ({ onPlanTrip, loading, mapClickData, activeField, setActiveField }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
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
    if (mapClickData && activeField) {
      const displayValue = mapClickData.address || `${mapClickData.lat.toFixed(5)}, ${mapClickData.lng.toFixed(5)}`;
      setFormData(prev => ({ ...prev, [activeField]: displayValue }));
      // Clear error when value is set via map
      setErrors(prev => ({ ...prev, [activeField]: null }));
    }
  }, [mapClickData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    const required = ['driverName', 'vehicleId', 'currentLocation', 'pickupLocation', 'dropoffLocation', 'manifestNo'];
    
    required.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = 'Required';
      }
    });

    if (parseFloat(formData.cycleUsed) < 0 || parseFloat(formData.cycleUsed) > 70) {
      newErrors.cycleUsed = 'Max 70 hrs';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    setFormData({
      currentLocation: '', pickupLocation: '', dropoffLocation: '', cycleUsed: '0',
      driverName: '', coDriverName: '', vehicleId: '', trailerId: '',
      licensePlate: '', licenseState: '', carrierName: '', officeAddress: '',
      homeTerminal: '', manifestNo: ''
    });
    setErrors({});
    setActiveField('currentLocation');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onPlanTrip(formData);
    }
  };

  const commonProps = (name) => ({
    name,
    value: formData[name],
    onChange: handleChange,
    onFocus: setActiveField,
    activeField: activeField,
    error: errors[name]
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionHeader icon={User} title="IDENTIFICATION" />
      <div className="space-y-6">
        <InputGroup label="PRIMARY DRIVER" icon={User} fieldId="driverName" placeholder="e.g. John R. Doe" {...commonProps('driverName')} />
        <InputGroup label="CO-DRIVER (OPTIONAL)" icon={User} fieldId="coDriverName" placeholder="e.g. Jane Smith" {...commonProps('coDriverName')} />
        <div className="grid grid-cols-2 gap-4">
          <InputGroup label="VEHICLE ID" icon={Truck} fieldId="vehicleId" placeholder="TRK-9900" {...commonProps('vehicleId')} />
          <InputGroup label="TRAILER ID" icon={Package} fieldId="trailerId" placeholder="TRL-1234" {...commonProps('trailerId')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputGroup label="LICENSE PLATE" icon={Globe} fieldId="licensePlate" placeholder="NYC-1234" {...commonProps('licensePlate')} />
          <InputGroup label="PLATE STATE" icon={Globe} fieldId="licenseState" placeholder="NY" {...commonProps('licenseState')} />
        </div>
      </div>

      <SectionHeader icon={Target} title="MISSION VECTORS" />
      <div className="space-y-6">
        <InputGroup label="ORIGIN VECTOR" icon={MapPin} fieldId="currentLocation" placeholder="Select on map or type address..." {...commonProps('currentLocation')} />
        <InputGroup label="HUB INTERCEPT" icon={Package} fieldId="pickupLocation" placeholder="Loading point..." {...commonProps('pickupLocation')} />
        <InputGroup label="DESTINATION TARGET" icon={Target} fieldId="dropoffLocation" placeholder="Final delivery point..." {...commonProps('dropoffLocation')} />
      </div>

      <SectionHeader icon={ShieldCheck} title="LOGISTICS PARAMETERS" />
      <div className="space-y-6">
        <InputGroup label="SHIPPING DOC / MANIFEST #" icon={FileText} fieldId="manifestNo" placeholder="BOL-1002345" {...commonProps('manifestNo')} />
        <InputGroup label="ACTIVE CYCLE (HRS)" icon={Clock} fieldId="cycleUsed" type="number" placeholder="0 - 70" {...commonProps('cycleUsed')} />
        
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between py-4 px-4 group bg-slate-500/5 hover:bg-slate-500/10 rounded-2xl transition-all border border-black/5 dark:border-white/5"
        >
          <div className="flex items-center gap-3">
            <Building size={14} className="text-blue-500 opacity-60 group-hover:opacity-100" />
            <span className="text-[11px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">Company Metadata</span>
          </div>
          {showAdvanced ? <ChevronUp size={14} className="opacity-30" /> : <ChevronDown size={14} className="opacity-30" />}
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4 pb-4 px-1"
            >
              <InputGroup label="CARRIER IDENTITY" icon={Building} fieldId="carrierName" placeholder="Carrier Name Inc." {...commonProps('carrierName')} />
              <InputGroup label="HEADQUARTERS" icon={MapPin} fieldId="officeAddress" placeholder="123 Logistics Way, City, ST" {...commonProps('officeAddress')} />
              <InputGroup label="HOME TERMINAL" icon={MapPin} fieldId="homeTerminal" placeholder="City Terminal HQ" {...commonProps('homeTerminal')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 pt-8">
        <button
          type="button"
          onClick={handleReset}
          className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-200/40 dark:bg-slate-800/40 hover:bg-red-500/10 hover:text-red-500 transition-all border border-black/5 dark:border-white/5"
        >
          <RotateCcw size={18} />
        </button>
        
        <button
          id="main-submit-btn"
          disabled={loading}
          className={`flex-grow btn-premium flex items-center justify-center gap-4 ${Object.keys(errors).length > 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
          ) : (
            <>
              <Play size={14} fill="currentColor" />
              <span>Initiate Calculation</span>
            </>
          )}
        </button>
      </div>
      {Object.keys(errors).length > 0 && (
        <p className="text-[10px] font-bold text-red-500/60 text-center uppercase tracking-widest pt-2">Fix highlighted fields to proceed</p>
      )}
    </form>
  );
};

export default TripForm;
