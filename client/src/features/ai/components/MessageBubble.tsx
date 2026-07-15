import React from 'react';
import { Sparkles, User, Copy, ThumbsUp, ThumbsDown, Bookmark, RefreshCw } from 'lucide-react';
import { IMessage } from '../types';
import TaskCard from './TaskCard';
import ProjectCard from './ProjectCard';
import AnalyticsCard from './AnalyticsCard';
import DocumentCard from './DocumentCard';

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

  // Parsing custom card templates inside prompt message bodies
  const renderCardContents = () => {
    const rawText = message.text;

    if (rawText.includes('[Task Card]')) {
      return (
        <TaskCard
          taskName="Integrate Stripe Checkout Webhook"
          priority="Urgent"
          assignee="Sarah Jenkins"
          deadline="Friday"
          status="Blocked"
          onView={() => {}}
          onComplete={() => {}}
        />
      );
    }

    if (rawText.includes('[Project Card]')) {
      return (
        <ProjectCard
          projectName="Product Beta Release"
          progress={78}
          membersCount={4}
          milestonesCount={6}
          deadline="Jul 30, 2026"
          onViewClick={() => {}}
        />
      );
    }

    if (rawText.includes('[Analytics Card]')) {
      return (
        <AnalyticsCard
          startupHealth={86}
          executionScore={92}
          velocity={24}
          riskScore={15}
        />
      );
    }

    if (rawText.includes('[Document Card]')) {
      return (
        <DocumentCard
          documentName="Investor Deck Strategic Canvas"
          similarityScore={94}
          onOpenDocument={() => {}}
        />
      );
    }

    // Default Markdown block rendering fallback
    return (
      <div className="space-y-2">
        {rawText.split('\n\n').map((paragraph: string, pIdx: number) => {
          if (paragraph.startsWith('### ')) {
            return <h3 key={pIdx} className="font-extrabold text-white text-xs mt-3 mb-1.5 font-sans border-b border-white/5 pb-1">{paragraph.replace('### ', '')}</h3>;
          }
          if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
            return (
              <ul key={pIdx} className="space-y-1 my-1">
                {paragraph.split('\n').map((line, lIdx) => (
                  <li key={lIdx} className="ml-3 list-disc text-gray-300 font-sans text-xs">{line.replace(/^(\* |- )/, '')}</li>
                ))}
              </ul>
            );
          }
          if (paragraph.includes('|')) {
            const rows = paragraph.split('\n').filter(r => r.includes('|') && !r.includes(':---'));
            if (rows.length > 0) {
              return (
                <div key={pIdx} className="my-3 overflow-x-auto border border-white/5 rounded-lg bg-slate-900/40">
                  <table className="w-full text-left text-[10px] text-gray-300 font-sans border-collapse">
                    <tbody>
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-white/5 hover:bg-white/[0.01]">
                          {row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 font-semibold">{cell.trim()}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
          }
          return <p key={pIdx} className="font-sans text-xs leading-relaxed text-gray-300">{paragraph}</p>;
        })}
      </div>
    );
  };

  return (
    <div className={`flex flex-col gap-1.5 max-w-[85%] ${isAi ? '' : 'ml-auto items-end'}`}>
      <div className={`flex gap-3.5 ${isAi ? '' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
          isAi 
            ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-500/5' 
            : 'bg-white/5 border-white/10 text-white'
        }`}>
          {isAi ? <Sparkles size={13} /> : <User size={13} />}
        </div>

        {/* Text Container */}
        <div className={`p-4 rounded-2xl text-xs leading-relaxed border flex flex-col gap-2 ${
          isAi 
            ? 'bg-white/2 border-white/5 text-gray-300' 
            : 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
        }`}>
          {renderCardContents()}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-3 bg-indigo-400 ml-1 animate-pulse" />
          )}
        </div>
      </div>

      {/* Citations chip */}
      {isAi && message.citations && message.citations.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mt-1 ml-11 select-none">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider flex items-center">Sources used:</span>
          {message.citations.map((c, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-white/2 border border-white/5 px-2 py-0.5 rounded text-[9px] text-gray-400">
              <span className="font-semibold">{c.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Message action bar */}
      {isAi && !message.isStreaming && (
        <div className="flex items-center gap-3.5 mt-1.5 ml-11 text-gray-500 select-none">
          <button onClick={copyToClipboard} className="p-0.5 hover:text-white transition cursor-pointer" title="Copy to clipboard">
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
          <button className="p-0.5 hover:text-red-400 transition cursor-pointer" title="Dislike">
            <ThumbsDown size={11} />
          </button>
          <button className="p-0.5 hover:text-indigo-400 transition cursor-pointer" title="Bookmark">
            <Bookmark size={11} />
          </button>
        </div>
      )}
    </div>
  );
};
export default MessageBubble;
