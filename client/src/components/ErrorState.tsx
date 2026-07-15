import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message = 'An error occurred while loading this section. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-950/10 border border-red-500/20 rounded-2xl max-w-md mx-auto my-6">
      <div className="mb-4 p-3 bg-red-500/10 rounded-full text-red-400">
        <AlertTriangle size={32} />
      </div>
      <h3 className="text-sm font-bold text-red-400 mb-1 uppercase tracking-wide">{title}</h3>
      <p className="text-xs text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-indigo-500/20"
        >
          <RotateCcw size={14} />
          Retry Request
        </button>
      )}
    </div>
  );
};

export default ErrorState;
