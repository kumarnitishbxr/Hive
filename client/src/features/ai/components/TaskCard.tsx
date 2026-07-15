import React from 'react';
import { CheckCircle2, Clock, User, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  taskName: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignee: string;
  deadline: string;
  status: string;
  onAssign?: () => void;
  onView?: () => void;
  onComplete?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  taskName,
  priority,
  assignee,
  deadline,
  status,
  onAssign,
  onView,
  onComplete
}) => {
  const priorityColors = {
    Low: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    Medium: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    High: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Urgent: 'text-red-400 bg-red-500/10 border-red-500/20'
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-white/5 p-4 rounded-xl hover:border-white/10 transition space-y-3.5 text-xs font-sans w-full max-w-sm text-left">
      <div className="flex justify-between items-start gap-3">
        <h4 className="font-extrabold text-white leading-snug truncate flex-1">{taskName}</h4>
        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${priorityColors[priority]}`}>
          {priority}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-400 select-none">
        <div className="flex items-center gap-1.5 truncate">
          <User size={12} className="text-indigo-400 shrink-0" />
          <span className="truncate">{assignee || 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-indigo-400 shrink-0" />
          <span>{deadline || 'No date'}</span>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-white/5 pt-3">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase">
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span>{status}</span>
        </div>
        <div className="flex gap-1.5">
          {onAssign && (
            <button onClick={onAssign} className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded font-bold transition cursor-pointer text-[9px] uppercase tracking-wider border border-white/5">
              Assign
            </button>
          )}
          {onView && (
            <button onClick={onView} className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded font-bold transition cursor-pointer text-[9px] uppercase tracking-wider border border-indigo-500/20">
              View
            </button>
          )}
          {onComplete && (
            <button onClick={onComplete} className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded font-bold transition cursor-pointer text-[9px] uppercase tracking-wider border border-emerald-500/20">
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default TaskCard;
