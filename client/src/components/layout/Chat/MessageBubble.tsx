import React, { useState } from 'react';
import { MessageType } from '../../../store/slices/chatSlice';
import { 
  FileText, 
  Trash2, 
  CornerUpLeft, 
  Check, 
  CheckCheck, 
  Smile, 
  MoreHorizontal, 
  Star, 
  Pin 
} from 'lucide-react';

interface MessageBubbleProps {
  message: MessageType;
  currentUserId: string;
  onReply: (message: MessageType) => void;
  onDelete: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  onReply,
  onDelete
}) => {
  const [showOptions, setShowOptions] = useState(false);
  
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

  return (
    <div 
      className={`group relative flex gap-3 px-4 py-2 hover:bg-white/2 transition duration-200 ${
        isMe ? 'flex-row-reverse' : 'flex-row'
      }`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {/* Sender Avatar */}
      <div className="flex-shrink-0">
        {senderAvatar ? (
          <img 
            src={senderAvatar} 
            alt={senderName} 
            className="w-8 h-8 rounded-full object-cover border border-white/10"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-indigo-400 uppercase">
            {senderName.charAt(0)}
          </div>
        )}
      </div>

      {/* Message content panel */}
      <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Name and Role Badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-gray-200">{senderName}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getRoleBadgeClass(senderRole)}`}>
            {senderRole}
          </span>
          <span className="text-[9px] text-gray-500 font-semibold">{formatTime(message.createdAt)}</span>
        </div>

        {/* Thread Reply Reference */}
        {message.replyTo && (
          <div className="mb-1 text-[11px] bg-white/5 border-l-2 border-indigo-500 px-2.5 py-1 rounded text-gray-400 max-w-full truncate flex items-center gap-1.5">
            <span className="font-semibold text-[10px] text-indigo-400">Replying to:</span>
            <span className="italic">{message.replyTo.message}</span>
          </div>
        )}

        {/* Message bubble itself */}
        <div 
          className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
            message.deleted 
              ? 'bg-slate-900 border border-white/5 italic text-gray-500' 
              : isMe 
                ? 'bg-indigo-600/90 text-white rounded-tr-none border border-indigo-500/30' 
                : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/8'
          }`}
        >
          {message.message}

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
        </div>

        {/* Read receipts indicators (Seen Status / Delivered Status) */}
        {isMe && !message.deleted && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 font-semibold">
            {message.seenBy.length > 1 ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCheck size={12} /> Seen
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Check size={12} /> Sent
              </span>
            )}
            {message.edited && <span className="text-[9px] text-gray-600 bg-white/5 px-1 py-0.5 rounded ml-1 font-bold">EDITED</span>}
          </div>
        )}

        {!isMe && message.edited && !message.deleted && (
          <span className="text-[9px] text-gray-600 bg-white/5 px-1 py-0.5 rounded mt-1 font-bold">EDITED</span>
        )}
      </div>

      {/* Hover Action Options Toolbar */}
      {showOptions && !message.deleted && (
        <div 
          className={`absolute top-2 z-10 flex items-center bg-slate-900 border border-white/10 rounded-lg p-1 shadow-xl ${
            isMe ? 'left-4' : 'right-4'
          }`}
        >
          <button 
            onClick={() => onReply(message)}
            title="Reply"
            className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-indigo-400 rounded transition cursor-pointer"
          >
            <CornerUpLeft size={13} />
          </button>
          
          <button 
            title="Star message"
            className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-amber-400 rounded transition cursor-pointer"
          >
            <Star size={13} />
          </button>

          <button 
            title="Pin message"
            className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-emerald-400 rounded transition cursor-pointer"
          >
            <Pin size={13} />
          </button>

          {isMe && (
            <button 
              onClick={() => onDelete(message._id)}
              title="Delete message"
              className="p-1.5 hover:bg-red-950/30 text-gray-400 hover:text-red-400 rounded transition cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
