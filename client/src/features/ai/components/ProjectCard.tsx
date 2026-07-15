import React from 'react';
import { FolderGit2, CheckCircle2, Users, Calendar } from 'lucide-react';

interface ProjectCardProps {
  projectName: string;
  progress: number; // 0 to 100
  membersCount: number;
  milestonesCount: number;
  deadline: string;
  onViewClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  projectName,
  progress,
  membersCount,
  milestonesCount,
  deadline,
  onViewClick
}) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-white/5 p-4 rounded-xl hover:border-white/10 transition space-y-3.5 text-xs font-sans w-full max-w-sm text-left">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
          <FolderGit2 size={15} />
        </div>
        <div className="truncate flex-1">
          <h4 className="font-extrabold text-white truncate leading-tight">{projectName}</h4>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Active Workspace Project</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wide select-none">
          <span>Sprint Completion</span>
          <span className="text-white font-extrabold">{progress}%</span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-400 select-none">
        <div className="flex items-center gap-1.5">
          <Users size={12} className="text-indigo-400 shrink-0" />
          <span>{membersCount} Assigned Members</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-indigo-400 shrink-0" />
          <span>{milestonesCount} Milestones</span>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-white/5 pt-3">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Calendar size={12} className="shrink-0" />
          <span className="font-semibold">{deadline}</span>
        </div>
        {onViewClick && (
          <button onClick={onViewClick} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded font-bold transition cursor-pointer text-[9px] uppercase tracking-wider border border-white/5">
            Quick View
          </button>
        )}
      </div>
    </div>
  );
};
export default ProjectCard;
