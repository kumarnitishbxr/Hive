import React, { useState } from 'react';
import { 
  Plus, Search, MessageSquare, Pin, Trash2, Edit3, Check, X, FolderKanban 
} from 'lucide-react';
import { IConversation } from '../types';

interface ConversationSidebarProps {
  conversations: IConversation[];
  activeConversationId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onTogglePin?: (id: string) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onRename,
  onTogglePin
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filtered.filter(c => c.isPinned);
  const regularChats = filtered.filter(c => !c.isPinned);

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim() && onRename) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="w-64 border-r border-white/5 bg-slate-950/80 backdrop-blur-md flex flex-col h-full overflow-hidden text-xs font-sans select-none shrink-0">
      {/* Header action */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <button
          onClick={() => onSelect(null)}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer text-xs outline-none"
        >
          <Plus size={14} /> New Chat
        </button>

        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 bg-white/2 border border-white/8 rounded-lg text-[10px] outline-none text-white focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Pinned section */}
        {pinnedChats.length > 0 && (
          <div className="space-y-1">
            <span className="px-2 text-[9px] text-gray-500 font-extrabold tracking-wider uppercase flex items-center gap-1">
              <Pin size={9} /> Pinned
            </span>
            <div className="space-y-0.5">
              {pinnedChats.map(c => renderListItem(c))}
            </div>
          </div>
        )}

        {/* Workspace section */}
        <div className="space-y-1">
          <span className="px-2 text-[9px] text-gray-500 font-extrabold tracking-wider uppercase flex items-center gap-1">
            <MessageSquare size={9} /> Conversations
          </span>
          <div className="space-y-0.5">
            {regularChats.length > 0 ? (
              regularChats.map(c => renderListItem(c))
            ) : (
              <p className="text-[10px] text-gray-600 italic px-2 py-1">No chats found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function renderListItem(c: IConversation) {
    const isActive = activeConversationId === c._id;
    const isEditing = editingId === c._id;

    return (
      <div
        key={c._id}
        onClick={() => !isEditing && onSelect(c._id)}
        className={`group w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer border ${
          isActive 
            ? 'bg-white/5 border-white/10 text-indigo-400 font-bold' 
            : 'text-gray-400 hover:bg-white/2 hover:text-gray-200 border-transparent'
        }`}
      >
        <div className="flex items-center gap-2 truncate flex-1 mr-1">
          <MessageSquare size={13} className={isActive ? 'text-indigo-400' : 'text-gray-500'} />
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-indigo-500/50 rounded px-1.5 py-0.5 text-[10px] text-white w-full outline-none"
            />
          ) : (
            <span className="truncate flex-1 text-[11px]">{c.title}</span>
          )}
        </div>

        {/* Item controls */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0 select-none">
          {isEditing ? (
            <>
              <button onClick={e => handleSaveRename(c._id, e)} className="p-0.5 hover:text-white text-gray-500 transition cursor-pointer">
                <Check size={11} />
              </button>
              <button onClick={e => { e.stopPropagation(); setEditingId(null); }} className="p-0.5 hover:text-white text-gray-500 transition cursor-pointer">
                <X size={11} />
              </button>
            </>
          ) : (
            <>
              {onTogglePin && (
                <button onClick={e => { e.stopPropagation(); onTogglePin(c._id); }} className={`p-0.5 transition cursor-pointer ${c.isPinned ? 'text-indigo-400 hover:text-indigo-300' : 'text-gray-500 hover:text-white'}`} title="Pin chat">
                  <Pin size={11} />
                </button>
              )}
              {onRename && (
                <button onClick={e => startEditing(c._id, c.title, e)} className="p-0.5 hover:text-white text-gray-500 transition cursor-pointer" title="Rename chat">
                  <Edit3 size={11} />
                </button>
              )}
              <button onClick={e => { e.stopPropagation(); onDelete(c._id); }} className="p-0.5 hover:text-red-400 text-gray-500 transition cursor-pointer" title="Delete chat">
                <Trash2 size={11} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
};
export default ConversationSidebar;
