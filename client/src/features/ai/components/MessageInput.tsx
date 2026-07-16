import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the input textarea height depending on characters count
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  const handleAttachmentClick = () => {
    alert('Select files to upload into context...');
  };

  const handleEmojiClick = () => {
    alert('Open emoji selector...');
  };

  return (
    <form onSubmit={handleFormSubmit} className="relative w-full select-none">
      <div className="relative flex items-end bg-[#161E2E] border border-white/5 focus-within:border-indigo-500/30 rounded-2xl p-2 transition shadow-lg">
        
        {/* Attachment icon */}
        <button
          type="button"
          onClick={handleAttachmentClick}
          className="p-2.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-xl transition cursor-pointer shrink-0 mb-0.5"
          title="Attach Files"
        >
          <Paperclip size={16} />
        </button>

        {/* Emoji selector icon */}
        <button
          type="button"
          onClick={handleEmojiClick}
          className="p-2.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-xl transition cursor-pointer shrink-0 mb-0.5"
          title="Insert Emoji"
        >
          <Smile size={16} />
        </button>

        {/* Text Input area (Textarea for multiline Shift+Enter support) */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Startup Copilot..."
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 outline-none text-xs text-white border-0 focus:ring-0 placeholder-gray-500 font-sans resize-none max-h-36 overflow-y-auto custom-scrollbar self-center leading-relaxed"
          style={{ minHeight: '20px' }}
        />

        {/* Send prompt action button */}
        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/10 mb-0.5"
          title="Send message"
        >
          <Send size={14} />
        </button>

      </div>
    </form>
  );
};

export default MessageInput;
