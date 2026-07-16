import React from 'react';
import { Sparkles, Compass, ShieldAlert, FileText, Map } from 'lucide-react';

interface EmptyStateProps {
  userName?: string;
  onSuggestionClick: (prompt: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  userName = 'Nitish',
  onSuggestionClick
}) => {
  const suggestions = [
    { 
      label: "Generate today's sprint", 
      prompt: "Generate today's sprint", 
      icon: Compass, 
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/10" 
    },
    { 
      label: "Analyze blocked tasks", 
      prompt: "Analyze blocked tasks", 
      icon: ShieldAlert, 
      color: "text-rose-400 bg-rose-500/10 border-rose-500/10" 
    },
    { 
      label: "Summarize project", 
      prompt: "Summarize project status", 
      icon: FileText, 
      color: "text-purple-400 bg-purple-500/10 border-purple-500/10" 
    },
    { 
      label: "Create roadmap", 
      prompt: "Create workspace roadmap", 
      icon: Map, 
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10" 
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none max-w-xl mx-auto my-auto space-y-7">
      
      {/* Animated Glowing AI Icon */}
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
          <Sparkles size={24} className="animate-pulse" />
        </div>
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0B1120] rounded-full" />
      </div>

      {/* Greetings block */}
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white tracking-tight">
          Hello {userName} 👋
        </h2>
        <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-md">
          I'm your AI Startup Copilot. Ask me anything about your startup's tasks, sprints, or roadmap planning.
        </p>
      </div>

      {/* Suggested prompts grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
        {suggestions.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => onSuggestionClick(item.prompt)}
              className="p-3.5 rounded-xl bg-[#161E2E] border border-white/5 hover:border-indigo-500/30 hover:bg-[#1C2638] text-left transition duration-200 text-gray-300 hover:text-white cursor-pointer flex items-center gap-3 w-full shadow-sm outline-none"
            >
              <div className={`p-2 rounded-lg border shrink-0 ${item.color}`}>
                <IconComponent size={14} />
              </div>
              <span className="text-[11px] font-semibold tracking-wide">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default EmptyState;
