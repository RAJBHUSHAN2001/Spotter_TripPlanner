/* eslint-disable */
import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Mission Critical Failure:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-red-500/20">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8">
            <ShieldAlert className="text-red-500" size={40} />
          </div>
          <h2 className="text-2xl font-black text-brand mb-4 uppercase tracking-tighter">System Malfunction</h2>
          <p className="text-tactical opacity-40 max-w-md mb-10 leading-relaxed">
            The mission control interface encountered a critical state error. All tactical data has been preserved in the local cache.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-premium flex items-center gap-4"
          >
            <RotateCcw size={14} /> <span>Reboot Command Center</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
