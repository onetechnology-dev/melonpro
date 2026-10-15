import React, { Component, ErrorInfo, ReactNode } from 'react';

interface SafeMapErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onCatch?: (error: Error) => void;
}

interface SafeMapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SafeMapErrorBoundary extends Component<
  SafeMapErrorBoundaryProps,
  SafeMapErrorBoundaryState
> {
  constructor(props: SafeMapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SafeMapErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[SafeMapErrorBoundary] Caught map rendering error:', error?.message || error);
    if (this.props.onCatch) {
      this.props.onCatch(error);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error || new Error('Map rendering error'), this.reset);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-2xl text-center">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5 text-lg">
            ⚠️
          </div>
          <h4 className="text-xs font-bold text-slate-100">Map Unavailable</h4>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
            {this.state.error?.message || 'The selected map provider encountered an issue. Switch providers in Settings.'}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
          >
            Retry Map
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
