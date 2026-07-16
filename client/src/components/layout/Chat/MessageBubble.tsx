import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { MessageType } from '../../../store/slices/chatSlice';
import { 
  FileText, 
  Trash2, 
  CornerUpLeft, 
  Check, 
  CheckCheck, 
  Star, 
  Pin,
  Edit3
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: MessageType;
  currentUserId: string;
  onReply: (message: MessageType) => void;
  onDelete: (messageId: string, mode: 'everyone' | 'me') => void;
  onEdit?: (message: MessageType) => void;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  onReply,
  onDelete,
  onEdit,
  isFirstInGroup = true,
  isLastInGroup = true
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  
  const userRole = useSelector((state: RootState) => state.auth.role);
  const isFounder = userRole === 'Founder' || userRole === 'Co-Founder';

  const sender = typeof message.senderId === 'object' ? message.senderId : null;
  const senderId = sender ? sender._id : (message.senderId as string);
  const isMe = senderId === currentUserId;

  const senderName = sender?.fullName || 'Unknown User';
  const senderAvatar = sender?.avatarUrl;
  const senderRole = sender?.role || 'Team Member';

  // Format timestamp
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Get role color theme
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Founder':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Co-Founder':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Admin':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Mentor':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Investor':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const minutesElapsed = (Date.now() - new Date(message.createdAt).getTime()) / 60000;
  const isWithinLimit = minutesElapsed <= 15;
  const canDeleteForEveryone = isMe ? (isWithinLimit || isFounder) : isFounder;
  const canEdit = isMe && (isWithinLimit || isFounder);

  // Status mapping
  const status = (message as any).status;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`group relative flex items-start gap-3 w-full px-5 ${
        isMe ? 'justify-end' : 'justify-start'
      } ${isFirstInGroup ? 'mt-3.5' : 'mt-1'}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => {
        setShowOptions(false);
        setShowDeleteMenu(false);
      }}
    >
      {/* Col 1: Sender Avatar spacer (Only for incoming messages) */}
      {!isMe && (
        <div className="shrink-0 w-8 h-8 flex items-center justify-center">
          {isFirstInGroup && (
            senderAvatar ? (
              <img 
                src={senderAvatar} 
                alt={senderName} 
                className="w-8 h-8 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-indigo-400 uppercase">
                {senderName.charAt(0)}
              </div>
            )
          )}
        </div>
      )}

      {/* Col 2: Message Content Block */}
      <div className={`flex flex-col max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Name and Role Badge (Only for incoming messages, first in group) */}
        {!isMe && isFirstInGroup && (
          <div className="flex items-center gap-2 mb-1 pl-1">
            <span className="text-xs font-bold text-gray-200">{senderName}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getRoleBadgeClass(senderRole)}`}>
              {senderRole}
            </span>
          </div>
        )}

        {/* Thread Reply Reference */}
        {message.replyTo && (
          <div className="mb-1 text-[10px] bg-white/5 border-l-2 border-indigo-500 px-2.5 py-1 rounded text-gray-400 max-w-full truncate flex items-center gap-1.5">
            <span className="font-semibold text-[9px] text-indigo-400">Replying to:</span>
            <span className="italic">{message.replyTo.message}</span>
          </div>
        )}

        {/* Message bubble itself */}
        <div 
          className={`px-4 py-2.5 rounded-[18px] text-xs leading-relaxed shadow-sm flex flex-col relative ${
            message.deleted 
              ? 'bg-slate-900 border border-white/5 italic text-gray-500' 
              : isMe 
                ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white' 
                : 'bg-[#1B2236] text-white'
          }`}
        >
          <span className="wrap-break-word white-space-pre-wrap">{message.message}</span>

          {/* Render Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2.5 space-y-2">
              {message.attachments.map((attach, idx) => {
                const isImage = attach.fileType?.startsWith('image') || attach.url.match(/\.(jpeg|jpg|gif|png|webp)/i);
                if (isImage) {
                  return (
                    <div key={idx} className="rounded-lg overflow-hidden border border-white/10 max-w-xs bg-black/40">
                      <img 
                        src={attach.url} 
                        alt={attach.name} 
                        className="w-full max-h-48 object-cover hover:scale-105 transition cursor-zoom-in"
                        onClick={() => window.open(attach.url, '_blank')}
                      />
                      <div className="p-1 px-2 text-[10px] text-gray-400 bg-slate-950/80 truncate border-t border-white/5">
                        {attach.name}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <a
                      key={idx}
                      href={attach.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/60 border border-white/8 hover:border-indigo-500/40 hover:bg-slate-900 transition text-gray-300 hover:text-white"
                    >
                      <FileText size={16} className="text-indigo-400" />
                      <div className="flex-1 text-[11px] truncate">
                        <p className="font-semibold truncate">{attach.name}</p>
                        <p className="text-[9px] text-gray-500 uppercase font-bold">{attach.fileType || 'file'}</p>
                      </div>
                    </a>
                  );
                }
              })}
            </div>
          )}

          {/* Outgoing Metadata inside Bubble */}
          {isMe && !message.deleted && (
            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-white/50 self-end">
              <span>{formatTime(message.createdAt)}</span>
              {status === 'SEEN' || (status === undefined && message.seenBy && message.seenBy.length > 0) ? (
                <CheckCheck size={11} className="text-cyan-400" />
              ) : status === 'DELIVERED' ? (
                <CheckCheck size={11} className="text-white/40" />
              ) : (
                <Check size={11} className="text-white/40" />
              )}
            </div>
          )}
        </div>

        {/* Incoming Metadata below Bubble */}
        {!isMe && !message.deleted && (
          <span className="text-[9px] text-gray-500 mt-0.5 ml-1">{formatTime(message.createdAt)}</span>
        )}
      </div>

      {/* Hover Action Options Toolbar */}
      {showOptions && !message.deleted && (
        <div 
          className={`absolute top-1/2 -translate-y-1/2 z-10 flex items-center bg-slate-900 border border-white/10 rounded-lg p-0.5 shadow-xl ${
            isMe ? 'left-5' : 'right-5'
          }`}
        >
          <button 
            onClick={() => onReply(message)}
            title="Reply"
            className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-indigo-400 rounded transition cursor-pointer"
          >
            <CornerUpLeft size={12} />
          </button>

          {canEdit && onEdit && (
            <button 
              onClick={() => onEdit(message)}
              title="Edit message"
              className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-indigo-400 rounded transition cursor-pointer"
            >
              <Edit3 size={12} />
            </button>
          )}
          
          <button 
            title="Star message"
            className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-amber-400 rounded transition cursor-pointer"
          >
            <Star size={12} />
          </button>

          <button 
            title="Pin message"
            className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-emerald-400 rounded transition cursor-pointer"
          >
            <Pin size={12} />
          </button>

          <button 
            onClick={() => setShowDeleteMenu(true)}
            title="Delete message Options"
            className="p-1.5 hover:bg-red-950/30 text-gray-400 hover:text-red-400 rounded transition cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog Dropdown */}
      {showDeleteMenu && (
        <div className={`absolute z-40 bg-slate-900 border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col gap-1 text-[11px] ${isMe ? 'right-12' : 'left-12'} top-0`}>
          <p className="font-bold text-gray-400 px-2 py-1 select-none">Delete Message?</p>
          <button
            onClick={() => {
              onDelete(message._id, 'me');
              setShowDeleteMenu(false);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-white/5 rounded text-white font-semibold transition cursor-pointer"
          >
            Delete for Me
          </button>
          {canDeleteForEveryone && (
            <button
              onClick={() => {
                onDelete(message._id, 'everyone');
                setShowDeleteMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 hover:text-red-400 rounded text-red-500 font-bold transition cursor-pointer"
            >
              Delete for Everyone
            </button>
          )}
          <button
            onClick={() => setShowDeleteMenu(false)}
            className="w-full text-left px-3 py-1.5 hover:bg-white/5 rounded text-gray-400 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default MessageBubble;
