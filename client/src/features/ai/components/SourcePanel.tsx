import React, { useState } from 'react';
import { 
  Sparkles, FolderKanban, AlertCircle, CheckCircle2, 
  Layers, FileText, BrainCircuit, Pin, ChevronRight
} from 'lucide-react';
import WorkspaceMemory from './WorkspaceMemory';
import { IMemoryItem } from '../types';

interface SourcePanelProps {
  projects?: { name: string; progress: number }[];
  blockedTasksCount?: number;
  memoryItems?: IMemoryItem[];
  focusArea?: string;
  onFollowRecommendation?: (idx: number) => void;
  isOpen: boolean;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  projects = [
    { name: 'Product Beta Launch', progress: 78 },
    { name: 'Investor CRM Deck', progress: 92 },
    { name: 'Stripe Billing Webhooks', progress: 45 }
  ],
  blockedTasksCount = 2,
  memoryItems,
  focusArea = 'Product Delivery',
  onFollowRecommendation,
  isOpen
}) => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'memory'>('workspace');

  if (!isOpen) return null;

  return (
    <div className="w-72 border-l border-white/5 bg-[#111827]/85 backdrop-blur-xl flex flex-col h-full overflow-hidden text-xs font-sans select-none shrink-0 z-20">
      
      {/* Side Tabs header */}
      <div className="flex border-b border-white/5 bg-white/[0.01] shrink-0">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-wider text-center border-b transition cursor-pointer outline-none flex items-center justify-center gap-1.5 ${
            activeTab === 'workspace' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Layers size={11} />
          Workspace
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-wider text-center border-b transition cursor-pointer outline-none flex items-center justify-center gap-1.5 ${
            activeTab === 'memory' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <BrainCircuit size={11} />
          AI Memory
        </button>
      </div>

      {/* Pane Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-5 custom-scrollbar min-h-0">
        {activeTab === 'workspace' ? (
          <>
            {/* Focus area banner */}
            <div className="space-y-1.5 p-3 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/5 border border-indigo-500/10">
              <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Focus Direction</span>
              <p className="font-bold text-white text-[11px] flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-400 animate-pulse" /> {focusArea}
              </p>
            </div>

            {/* Active Sprints / Workspace Projects */}
            <div className="space-y-2.5">
              <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block ml-1">Workspace Projects</span>
              <div className="space-y-2">
                {projects.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-gray-200 truncate max-w-[150px]">{p.name}</span>
                      <span className="text-indigo-400 font-extrabold">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Telemetry Blockers */}
            <div className="space-y-2.5">
              <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block ml-1">Sprint Blockers</span>
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition duration-300 ${
                blockedTasksCount > 0 
                  ? 'border-rose-500/30 bg-rose-500/5 text-rose-300' 
                  : 'border-white/5 bg-white/[0.01] text-gray-500'
              }`}>
                <AlertCircle size={15} className={blockedTasksCount > 0 ? 'text-rose-400 animate-pulse shrink-0' : 'text-gray-600 shrink-0'} />
                <div className="flex flex-col">
                  <span className="font-extrabold text-[10px] leading-tight">
                    {blockedTasksCount > 0 ? `${blockedTasksCount} Blocked Task Cards` : 'No blockers flagged.'}
                  </span>
                  {blockedTasksCount > 0 && (
                    <span className="text-[9px] text-rose-400/80 font-medium block mt-0.5">
                      Review webhook Stripe tasks
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Citations panel placeholder */}
            <div className="space-y-2.5">
              <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block ml-1">Retrieved Sources</span>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.01] text-gray-400 flex items-center gap-2">
                  <FileText size={12} className="text-indigo-400 shrink-0" />
                  <span className="truncate text-[10px] font-semibold">Authentication Schema Contract.md</span>
                </div>
                <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.01] text-gray-400 flex items-center gap-2">
                  <FileText size={12} className="text-indigo-400 shrink-0" />
                  <span className="truncate text-[10px] font-semibold">Milestone Beta Checklist.docx</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <WorkspaceMemory 
            memoryItems={memoryItems} 
            onFollowRecommendation={onFollowRecommendation} 
          />
        )}
      </div>
    </div>
  );
};

export default SourcePanel;
