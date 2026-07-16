import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3.5 max-w-[75%]">
      {/* Avatar placeholder with animate-pulse */}
      <div className="w-8 h-8 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-md">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/50 animate-pulse" />
      </div>

      {/* Bubble with loading skeletons */}
      <div className="p-4 rounded-2xl bg-[#161E2E] border border-white/5 flex flex-col gap-2.5 w-70">
        {/* Animated pulsing bars */}
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
        </div>
        
        {/* Skeleton content layout */}
        <div className="space-y-2 mt-1">
          <div className="h-2 bg-white/5 rounded w-full animate-pulse" />
          <div className="h-2 bg-white/5 rounded w-5/6 animate-pulse" />
          <div className="h-2 bg-white/5 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
