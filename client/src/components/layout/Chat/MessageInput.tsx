import React, { useState, useRef, useEffect } from 'react';
import { 
  Smile, 
  Send, 
  X, 
  Paperclip
} from 'lucide-react';
import { MessageType } from '../../../store/slices/chatSlice';

interface MessageInputProps {
  onSendMessage: (text: string, attachments: any[]) => void;
  replyToMessage: MessageType | null;
  onClearReply: () => void;
  onTyping: (isTyping: boolean) => void;
  editingMessage: MessageType | null;
  onClearEdit: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  replyToMessage,
  onClearReply,
  onTyping,
  editingMessage,
  onClearEdit
}) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  
  // Textarea ref for auto-grow
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typing debounce timer
  const typingTimer = useRef<any>(null);
  const isTypingRef = useRef(false);

  const emojis = ['👍', '❤️', '😂', '🎉', '🔥', '🚀', '👀', '🤔', '👏', '💯', '💡', '💻', '🤝', '✅', '⚠️'];

  // Load editing message content when it changes
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.message);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else {
      setText('');
    }
  }, [editingMessage]);

  // Auto-grow effect for textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // Typing indicators mapping
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);
    
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    
    onSendMessage(text, []);
    setText('');
    onClearReply();
    
    if (editingMessage) {
      onClearEdit();
    }
    
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping(false);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  return (
    <div className="p-3 border-t border-white/5 bg-slate-950/80 flex flex-col gap-2 relative z-30 shrink-0">
      
      {/* Reply Reference Preview Banner */}
      {replyToMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-indigo-500/10 border-l-4 border-indigo-500 text-xs text-gray-300">
          <div className="truncate">
            <span className="font-bold text-indigo-400">Replying to {typeof replyToMessage.senderId === 'object' ? replyToMessage.senderId.fullName : 'user'}: </span>
            <span className="italic">{replyToMessage.message}</span>
          </div>
          <button 
            onClick={onClearReply}
            className="p-0.5 text-gray-500 hover:text-white transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Editing Reference Preview Banner */}
      {editingMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-emerald-500/10 border-l-4 border-emerald-500 text-xs text-gray-300">
          <div className="truncate">
            <span className="font-bold text-emerald-400">Editing Message: </span>
            <span className="italic">{editingMessage.message}</span>
          </div>
          <button 
            onClick={onClearEdit}
            className="p-0.5 text-gray-500 hover:text-white transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input controls container */}
      <div className="flex items-end gap-2 bg-white/3 border border-white/8 focus-within:border-indigo-500/50 rounded-2xl px-3 py-1.5 transition-all">
        
        {/* Text Area Input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyPress}
          rows={1}
          placeholder="Type a message..."
          className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-gray-500 resize-none max-h-32 py-1.5 leading-relaxed"
          style={{ height: 'auto' }}
        />

        {/* Action icons row */}
        <div className="flex items-center gap-0.5 mb-0.5">
          <span
            title="File and voice attachments require a real media upload pipeline and are disabled in production mode."
            className="p-1.5 text-gray-500 rounded-lg border border-white/5 cursor-not-allowed"
          >
            <Paperclip size={15} />
          </span>

          <div className="relative">
            <button
              onClick={() => setShowEmoji(prev => !prev)}
              title="Add Emoji"
              className={`p-1.5 hover:bg-white/5 rounded-lg transition cursor-pointer ${showEmoji ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Smile size={15} />
            </button>
            
            {showEmoji && (
              <div className="absolute bottom-10 right-0 p-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl grid grid-cols-5 gap-1.5 z-40 w-44">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setText(prev => prev + emoji);
                      setShowEmoji(false);
                    }}
                    className="p-1 hover:bg-white/5 rounded text-sm transition cursor-pointer text-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-lg transition cursor-pointer ml-1"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
