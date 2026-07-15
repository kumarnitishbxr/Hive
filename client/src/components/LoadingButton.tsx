import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`relative flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {isLoading && <Loader2 size={16} className="animate-spin text-current" />}
      {children}
    </button>
  );
};

export default LoadingButton;
