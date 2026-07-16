import React from 'react';
import { Brain, CheckCircle2, ChevronRight, Pin } from 'lucide-react';
import { IMemoryItem } from '../types';

interface WorkspaceMemoryProps {
  memoryItems?: IMemoryItem[];
  onFollowRecommendation?: (idx: number) => void;
}

export const WorkspaceMemory: React.FC<WorkspaceMemoryProps> = ({
  memoryItems = [
    { category: 'Validation', recommendation: 'Schedule 5 user feedback surveys', suggestedAt: 'Today', isFollowed: false },
    { category: 'Planning', recommendation: 'Invite 2 backend team members', suggestedAt: 'Today', isFollowed: true },
    { category: 'Execution', recommendation: 'Resolve Stripe webhook blockers', suggestedAt: 'Yesterday', isFollowed: false }
  ],
  onFollowRecommendation
}) => {
  return (
    <div className="space-y-4">
      {/* Persona card */}
      <div className="p-3.5 rounded-xl border border-white/5 bg-white/2 flex items-start gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
          <Brain size={14} />
        </div>
        <div>
          <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Advisory Persona</span>
          <p className="font-semibold text-white text-[11px] mt-0.5 leading-snug">
            Co-Founder & Lead Strategist
          </p>
          <span className="text-[9px] text-gray-400 font-medium block mt-1 leading-normal">
            Prioritizes short feedback loops, rapid validation, and keeping task overload down.
          </span>
        </div>
      </div>

      {/* Advisory recommendations list */}
      <div className="space-y-2">
        <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block ml-1">
          Preferences & Logs
        </span>
        <div className="space-y-2 max-h-55 overflow-y-auto pr-1">
          {memoryItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onFollowRecommendation?.(idx)}
              className={`p-2.5 rounded-xl border transition text-left cursor-pointer flex gap-2.5 ${
                item.isFollowed 
                  ? 'bg-emerald-500/5 border-emerald-500/10 text-gray-500' 
                  : 'bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/4 text-gray-300'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.isFollowed ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-white/20 mt-0.5" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                    item.isFollowed 
                      ? 'bg-white/5 text-gray-600 border border-white/5' 
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                  }`}>
                    {item.category}
                  </span>
                  <span className="text-[8px] text-gray-500 font-semibold">{item.suggestedAt}</span>
                </div>
                <p className={`text-[10px] leading-snug font-semibold ${item.isFollowed ? 'line-through' : ''}`}>
                  {item.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceMemory;
