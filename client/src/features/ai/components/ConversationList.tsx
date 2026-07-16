import React, { useState } from 'react';
import { 
  MessageSquare, Pin, Trash2, Edit3, Check, X, Plus, Search, Sparkles
} from 'lucide-react';
import { IConversation } from '../types';

interface ConversationItemProps {
  convo: IConversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onTogglePin?: (id: string) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  convo,
  isActive,
  onSelect,
  onDelete,
  onRename,
  onTogglePin
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(convo.title);

  // Extract last message preview
  const lastMessage = convo.messages && convo.messages.length > 0 
    ? convo.messages[convo.messages.length - 1]
    : null;
  const lastMessageText = lastMessage ? lastMessage.text : 'No messages yet';

  // Format timestamp helper
  const formatConvoDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      
      // Check if today
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // Check if yesterday
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      // Otherwise, show month and day
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(convo.title);
  };

  const handleSaveRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim() && onRename) {
      onRename(convo._id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => !isEditing && onSelect(convo._id)}
      className={`group w-full flex flex-col p-3 rounded-xl transition cursor-pointer border select-none ${
        isActive 
          ? 'bg-indigo-600/10 border-indigo-500/20 text-white font-semibold' 
          : 'bg-transparent border-transparent text-gray-400 hover:bg-[#161E2E] hover:text-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5 w-full">
        {/* Left Part: Icon & Title */}
        <div className="flex items-start gap-2.5 truncate flex-1 min-w-0">
          <div className={`mt-0.5 p-1 rounded-lg shrink-0 border ${
            isActive ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-white/5 border-white/5 text-gray-500'
          }`}>
            <Sparkles size={11} />
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="bg-[#0B1120] border border-indigo-500/50 rounded px-1.5 py-0.5 text-[11px] text-white w-full outline-none"
              autoFocus
            />
          ) : (
            <span className="truncate text-xs font-bold leading-snug text-white">
              {convo.title}
            </span>
          )}
        </div>

        {/* Right Part: Time / Actions */}
        <div className="shrink-0 flex items-center gap-1.5 select-none">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button onClick={handleSaveRename} className="p-0.5 hover:text-white text-gray-500 transition cursor-pointer">
                <Check size={11} />
              </button>
              <button onClick={handleCancelRename} className="p-0.5 hover:text-white text-gray-500 transition cursor-pointer">
                <X size={11} />
              </button>
            </div>
          ) : (
            <>
              {/* Timestamp shows when not hovered */}
              <span className="text-[9px] text-gray-500 font-semibold group-hover:hidden block transition-opacity duration-150">
                {formatConvoDate(lastMessage ? lastMessage.createdAt : convo.updatedAt)}
              </span>

              {/* Action Buttons show on hover */}
              <div className="hidden group-hover:flex items-center gap-1 transition-opacity duration-150">
                {onTogglePin && (
                  <button 
                    onClick={e => { e.stopPropagation(); onTogglePin(convo._id); }} 
                    className={`p-0.5 transition cursor-pointer ${convo.isPinned ? 'text-indigo-400 hover:text-indigo-300' : 'text-gray-500 hover:text-white'}`} 
                    title="Pin chat"
                  >
                    <Pin size={11} className={convo.isPinned ? '' : 'rotate-45'} />
                  </button>
                )}
                {onRename && (
                  <button onClick={handleStartRename} className="p-0.5 hover:text-white text-gray-500 transition cursor-pointer" title="Rename chat">
                    <Edit3 size={11} />
                  </button>
                )}
                <button 
                  onClick={e => { e.stopPropagation(); onDelete(convo._id); }} 
                  className="p-0.5 hover:text-rose-400 text-gray-500 transition cursor-pointer" 
                  title="Delete chat"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Last Message Preview Text Block */}
      {!isEditing && (
        <p className="text-[10px] text-gray-500 font-medium truncate mt-1 leading-normal pl-6.5 select-none">
          {lastMessageText}
        </p>
      )}
    </div>
  );
};

interface ConversationSidebarProps {
  conversations: IConversation[];
  activeConversationId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onTogglePin?: (id: string) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
  isOpen,
  onCloseMobile
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filtered.filter(c => c.isPinned);
  const regularChats = filtered.filter(c => !c.isPinned);

  const handleSelectConvo = (id: string | null) => {
    onSelect(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <div className={`w-full md:w-75 bg-[#111827] border-r border-white/5 flex flex-col h-full overflow-hidden shrink-0 select-none`}>
      {/* Sidebar Header Bar */}
      <div className="p-4 border-b border-white/5 flex flex-col gap-3 shrink-0">
        <button
          onClick={() => handleSelectConvo(null)}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer text-xs outline-none shadow-lg shadow-indigo-600/10 border border-indigo-500/20"
        >
          <Plus size={14} /> New Chat
        </button>

        <div className="relative">
          <Search size={13} className="absolute left-3.5 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0B1120] border border-white/8 rounded-xl text-[10px] outline-none text-white focus:border-indigo-500/50 transition font-sans placeholder-gray-500"
          />
        </div>
      </div>

      {/* Conversations scroll section */}
      <div className="grow overflow-y-auto p-2 space-y-4 custom-scrollbar min-h-0">
        {/* Pinned Section */}
        {pinnedChats.length > 0 && (
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 text-[8px] text-gray-500 font-extrabold tracking-wider uppercase flex items-center gap-1">
              <Pin size={8} className="rotate-45" /> Pinned
            </span>
            <div className="space-y-1">
              {pinnedChats.map(c => (
                <ConversationItem
                  key={c._id}
                  convo={c}
                  isActive={activeConversationId === c._id}
                  onSelect={handleSelectConvo}
                  onDelete={onDelete}
                  onRename={onRename}
                  onTogglePin={onTogglePin}
                />
              ))}
            </div>
          </div>
        )}

        {/* Conversations History List */}
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 text-[8px] text-gray-500 font-extrabold tracking-wider uppercase flex items-center gap-1">
            <MessageSquare size={8} /> Conversations
          </span>
          <div className="space-y-1">
            {regularChats.length > 0 ? (
              regularChats.map(c => (
                <ConversationItem
                  key={c._id}
                  convo={c}
                  isActive={activeConversationId === c._id}
                  onSelect={handleSelectConvo}
                  onDelete={onDelete}
                  onRename={onRename}
                  onTogglePin={onTogglePin}
                />
              ))
            ) : (
              <p className="text-[10px] text-gray-600 italic px-2.5 py-2">No chats found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationSidebar;
