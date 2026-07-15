import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description,
  icon = <AlertCircle size={32} className="text-gray-500" />,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/2 border border-white/5 rounded-2xl max-w-md mx-auto my-6">
      <div className="mb-4 p-3 bg-white/5 rounded-full">{icon}</div>
      <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">{title}</h3>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
};

export default EmptyState;
