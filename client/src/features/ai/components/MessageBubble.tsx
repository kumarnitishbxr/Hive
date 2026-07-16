import React from 'react';
import { 
  Sparkles, User, Copy, ThumbsUp, ThumbsDown, RefreshCw 
} from 'lucide-react';
import { IMessage } from '../types';

interface MessageBubbleProps {
  message: IMessage;
  onRegenerate?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRegenerate }) => {
  const isAi = message.sender === 'ai';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.text);
    alert('Copied to clipboard!');
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const renderContent = () => {
    const rawText = message.text;

    // Markdown rendering (paragraphs, lists, tables, inline codes, titles)
    return (
      <div className="space-y-2.5">
        {rawText.split('\n\n').map((paragraph: string, pIdx: number) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h3 
                key={pIdx} 
                className="font-bold text-white text-[13px] mt-4 mb-2 font-sans border-b border-white/5 pb-1.5 leading-snug"
              >
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
            return (
              <ul key={pIdx} className="space-y-1.5 my-2 pl-2">
                {paragraph.split('\n').map((line, lIdx) => (
                  <li key={lIdx} className="ml-3 list-disc text-gray-300 font-sans text-xs leading-relaxed">
                    {line.replace(/^(\* |- )/, '')}
                  </li>
                ))}
              </ul>
            );
          }
          if (paragraph.includes('|')) {
            const rows = paragraph.split('\n').filter(r => r.includes('|') && !r.includes(':---'));
            if (rows.length > 0) {
              return (
                <div key={pIdx} className="my-3.5 overflow-x-auto border border-white/5 rounded-xl bg-slate-950/40 shadow-inner">
                  <table className="w-full text-left text-[11px] text-gray-300 font-sans border-collapse">
                    <tbody>
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-white/5 hover:bg-white/2 transition">
                          {row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((cell, cIdx) => (
                            <td key={cIdx} className="px-3.5 py-2.5 font-medium">{cell.trim()}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
          }
          return <p key={pIdx} className="font-sans text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">{paragraph}</p>;
        })}
      </div>
    );
  };

  return (
    <div className={`group flex flex-col gap-1 w-full max-w-[80%] ${isAi ? '' : 'ml-auto'}`}>
      
      {/* Header containing Avatar and Name */}
      <div className={`flex items-center gap-2 px-1 select-none ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border text-[10px] shrink-0 ${
          isAi 
            ? 'bg-linear-to-tr from-indigo-500 to-purple-500 border-indigo-500/20 text-white shadow-sm' 
            : 'bg-white/5 border-white/10 text-white'
        }`}>
          {isAi ? <Sparkles size={11} /> : <User size={11} />}
        </div>
        <span className="text-[11px] font-bold text-white tracking-wide">
          {isAi ? 'Startup Copilot' : 'You'}
        </span>
        <span className="text-[9px] text-gray-500 font-medium">
          {formatTime(message.createdAt)}
        </span>
      </div>

      {/* Bubble Container (Dark for AI, Indigo/Purple Gradient for User) */}
      <div className={`p-4 rounded-2xl text-xs leading-relaxed border shadow-md flex flex-col gap-2 ${
        isAi 
          ? 'bg-[#161E2E] border-white/5 text-gray-300' 
          : 'bg-linear-to-tr from-[#6366F1] to-[#8B5CF6] border-indigo-500/30 text-white shadow-indigo-500/5'
      }`}>
        {renderContent()}
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-3.5 bg-indigo-400 ml-1 animate-pulse align-middle" />
        )}
      </div>

      {/* Message Actions (Appear on Hover, AI bubbles only) */}
      {isAi && !message.isStreaming && (
        <div className="flex items-center gap-3 mt-1 px-2 text-gray-500 select-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={copyToClipboard} className="p-0.5 hover:text-white transition cursor-pointer" title="Copy Message">
            <Copy size={11} />
          </button>
          {onRegenerate && (
            <button onClick={onRegenerate} className="p-0.5 hover:text-white transition cursor-pointer" title="Regenerate reply">
              <RefreshCw size={11} />
            </button>
          )}
          <button className="p-0.5 hover:text-emerald-400 transition cursor-pointer" title="Like">
            <ThumbsUp size={11} />
          </button>
          <button className="p-0.5 hover:text-rose-400 transition cursor-pointer" title="Dislike">
            <ThumbsDown size={11} />
          </button>
        </div>
      )}

    </div>
  );
};

export default MessageBubble;
