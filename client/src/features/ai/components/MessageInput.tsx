import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Sparkles, HelpCircle, Terminal } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const slashCommands = [
    { cmd: '/task', desc: 'Create a workspace task suggestion' },
    { cmd: '/project', desc: 'Audit active projects milestones' },
    { cmd: '/sprint', desc: 'Generate a proposal for today\'s sprint' },
    { cmd: '/pitch', desc: 'Draft an investor pitch update' },
    { cmd: '/analytics', desc: 'Display execution velocity and burn rates' },
    { cmd: '/help', desc: 'List active co-founder capabilities' }
  ];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSlashCommands(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    if (val.startsWith('/')) {
      setShowSlashCommands(true);
    } else {
      setShowSlashCommands(false);
    }
  };

  const selectCommand = (cmd: string) => {
    setText(cmd + ' ');
    setShowSlashCommands(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleFormSubmit} className="relative w-full select-none">
      
      {/* Slash commands autocomplete box */}
      {showSlashCommands && (
        <div ref={dropdownRef} className="absolute bottom-full mb-2 left-0 w-64 bg-slate-950 border border-white/10 rounded-xl p-1.5 shadow-2xl z-50 text-[10px] font-sans">
          <span className="px-2 py-1 text-[8px] font-bold text-gray-500 uppercase block tracking-wider">Slash Commands</span>
          <div className="space-y-0.5 mt-1 max-h-36 overflow-y-auto">
            {slashCommands.map(item => (
              <button
                key={item.cmd}
                type="button"
                onClick={() => selectCommand(item.cmd)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition text-left text-gray-300 hover:text-white cursor-pointer"
              >
                <span className="font-extrabold text-indigo-400 font-mono">{item.cmd}</span>
                <span className="text-gray-500 font-semibold">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input container */}
      <div className="relative flex items-center bg-white/2 hover:bg-white/[0.03] border border-white/8 hover:border-white/12 rounded-2xl p-2 transition">
        
        {/* Attachment trigger icon placeholder */}
        <button
          type="button"
          className="p-2 hover:bg-white/5 text-gray-500 hover:text-gray-300 rounded-xl transition cursor-pointer"
          title="Attach file (PDF, TXT, Markdown)"
        >
          <Paperclip size={14} />
        </button>

        <input
          type="text"
          value={text}
          onChange={handleInputChange}
          placeholder="Ask Startup Copilot or type / to inspect commands..."
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 outline-none text-xs text-white border-0 focus:ring-0 placeholder-gray-500 font-sans"
        />

        {/* Action triggers indicator */}
        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20"
        >
          <Send size={13} />
        </button>

      </div>
    </form>
  );
};
export default MessageInput;
