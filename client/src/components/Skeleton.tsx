import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/10 ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="liquid-glass p-6 rounded-xl space-y-4 border border-white/5 bg-slate-950/40">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
};

export default Skeleton;
