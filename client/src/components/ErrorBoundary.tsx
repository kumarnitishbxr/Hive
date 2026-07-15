import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-red-950/10 border border-red-500/20 rounded-2xl max-w-lg mx-auto my-12">
          <div className="mb-4 p-3 bg-red-500/10 rounded-full text-red-400">
            <AlertTriangle size={36} />
          </div>
          <h2 className="text-base font-extrabold text-white mb-2 uppercase tracking-wide">
            Application Error Occurred
          </h2>
          <p className="text-xs text-gray-400 mb-6 max-w-sm">
            {this.state.error?.message || 'A rendering error caused this section of the workspace to crash.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            <RotateCcw size={14} />
            Reload Workspace
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
