import React, { useState } from 'react';
import { 
  Briefcase, Bell, Sparkles, Pin, CheckCircle2, AlertCircle, Clock 
} from 'lucide-react';
import { IMemoryItem } from '../types';

interface WorkspacePanelProps {
  projects: { name: string; progress: number }[];
  blockedTasksCount: number;
  recommendations: IMemoryItem[];
  focusArea?: string;
  onFollowRecommendation?: (idx: number) => void;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  projects,
  blockedTasksCount,
  recommendations,
  focusArea = 'Product Delivery',
  onFollowRecommendation
}) => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'memory'>('workspace');

  return (
    <div className="w-64 border-l border-white/5 bg-slate-950/80 backdrop-blur-md flex flex-col h-full overflow-hidden text-xs font-sans select-none shrink-0">
      
      {/* Side Tabs header */}
      <div className="flex border-b border-white/5 bg-white/2">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-wider text-center border-b transition cursor-pointer outline-none ${
            activeTab === 'workspace' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Workspace
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-wider text-center border-b transition cursor-pointer outline-none ${
            activeTab === 'memory' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          AI Memory
        </button>
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'workspace' ? (
          <>
            {/* Context focus area */}
            <div className="space-y-1">
              <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Focus Direction</span>
              <p className="font-bold text-white text-[11px] flex items-center gap-1.5">
                <Sparkles size={11} className="text-indigo-400" /> {focusArea}
              </p>
            </div>

            {/* Active Sprints */}
            <div className="space-y-2.5">
              <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Workspace Projects</span>
              <div className="space-y-2">
                {projects.map((p, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-white/5 bg-white/2 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-gray-300 truncate max-w-[120px]">{p.name}</span>
                      <span className="text-indigo-400 font-extrabold">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Telemetry Alert indicators */}
            <div className="space-y-2">
              <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Sprint Blockers</span>
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${blockedTasksCount > 0 ? 'border-amber-500/30 bg-amber-500/5 text-amber-300' : 'border-white/5 bg-white/2 text-gray-500'}`}>
                <AlertCircle size={14} className={blockedTasksCount > 0 ? 'text-amber-400 animate-pulse' : 'text-gray-600'} />
                <span className="font-bold text-[10px] leading-tight">
                  {blockedTasksCount > 0 ? `${blockedTasksCount} Blocked Task Cards` : 'No blockers flagged.'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* AI Preferences */}
            <div className="space-y-1">
              <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Advisory Persona</span>
              <p className="font-bold text-gray-300 text-[10px] italic">"Co-Founder & Strategic Advisor"</p>
            </div>

            {/* Recommendations checklist */}
            <div className="space-y-2.5">
              <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Preferences & Logs</span>
              <div className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl border border-white/5 text-left space-y-1.5 cursor-pointer hover:border-white/10 transition ${rec.isFollowed ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-white/2'}`}
                    onClick={() => onFollowRecommendation?.(idx)}>
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] px-1 bg-indigo-500/10 text-indigo-300 rounded font-extrabold uppercase border border-indigo-500/20">{rec.category}</span>
                      {rec.isFollowed && <CheckCircle2 size={10} className="text-emerald-400" />}
                    </div>
                    <p className={`text-[10px] leading-snug font-semibold ${rec.isFollowed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                      {rec.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default WorkspacePanel;
