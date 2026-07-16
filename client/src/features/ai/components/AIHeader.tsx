import React from 'react';
import { Sparkles, Trash2, Plus, Menu } from 'lucide-react';

interface AIHeaderProps {
  onNewChat: () => void;
  onClearChat: () => void;
  onToggleSidebarMobile?: () => void; // Trigger mobile menu drawer
}

export const AIHeader: React.FC<AIHeaderProps> = ({
  onNewChat,
  onClearChat,
  onToggleSidebarMobile
}) => {
  return (
    <div className="h-16 px-6 border-b border-white/5 bg-[#111827] flex items-center justify-between shrink-0 select-none z-30">
      
      {/* Left part: Title & Status (with mobile menu drawer trigger) */}
      <div className="flex items-center gap-3">
        {onToggleSidebarMobile && (
          <button
            onClick={onToggleSidebarMobile}
            className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl md:hidden transition cursor-pointer"
            title="Open Conversations Sidebar"
          >
            <Menu size={16} />
          </button>
        )}
        
        {/* Glowing mini AI avatar */}
        <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/10">
          <Sparkles size={14} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-white tracking-wide leading-none">Startup Copilot</h3>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Right part: Simple Actions (New Chat, Clear Chat) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="h-8.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border border-indigo-500/20"
          title="Start New Chat"
        >
          <Plus size={13} />
          <span>New Chat</span>
        </button>

        <button
          onClick={onClearChat}
          className="p-2 text-gray-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition cursor-pointer"
          title="Clear Conversation"
        >
          <Trash2 size={14} />
        </button>
      </div>

    </div>
  );
};

export default AIHeader;
