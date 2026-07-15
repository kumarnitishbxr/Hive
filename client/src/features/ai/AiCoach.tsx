import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, User } from 'lucide-react';
import api from '../../services/api';

export const AiCoach: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'ai',
      text: "Hello! I am your AI Co-Founder. I have swept your workspace statistics. Ask me anything, or toggle one of the quick suggestions below:"
    }
  ]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: 'Suggest Next Milestones', topic: 'roadmap' },
    { label: 'Analyze Competitor Strategy', topic: 'competitors' },
    { label: 'Suggest GTM Marketing Launch', topic: 'gtm' },
    { label: 'Workspace Audit Review', topic: 'general' }
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend: string, topic?: string) => {
    if (!textToSend.trim()) return;
    setLoading(true);
    setPrompt('');

    // Append user message
    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);

    // Setup streaming output placeholder
    setMessages(prev => [...prev, { sender: 'ai', text: '', isStreaming: true }]);

    try {
      // Use standard fetch reader to stream Server Sent Events (SSE)
      const token = localStorage.getItem('token');
      const startupId = localStorage.getItem('startupId');
      const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5100/api';

      const response = await fetch(`${baseApiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-startup-id': startupId || ''
        },
        body: JSON.stringify({ prompt: textToSend, topic })
      });

      if (!response.body) throw new Error('Response body is empty.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finished = false;
      let accumulatedText = '';
      let buffer = '';

      while (!finished) {
        const { value, done } = await reader.read();
        finished = done;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const messagesList = buffer.split('\n\n');
          // The last element is either empty (if buffer ended in \n\n) or a partial message
          buffer = messagesList.pop() || '';
          
          for (const message of messagesList) {
            const cleanMessage = message.trim();
            if (!cleanMessage) continue;
            
            if (cleanMessage.startsWith('data: ')) {
              const content = cleanMessage.replace('data: ', '').trim();
              if (content === '[DONE]') {
                finished = true;
                break;
              }
              try {
                const parsed = JSON.parse(content);
                accumulatedText += parsed.text;
                
                // Update active streaming bubble text in state
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (updated[lastIdx]?.sender === 'ai' && updated[lastIdx]?.isStreaming) {
                    updated[lastIdx] = { sender: 'ai', text: accumulatedText, isStreaming: true };
                  }
                  return updated;
                });
              } catch (e) {
                // Ignore parse errors from blank lines or incomplete events
              }
            }
          }
        }
      }

      // Remove streaming tag
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]) {
          updated[lastIdx] = { ...updated[lastIdx], isStreaming: false };
        }
        return updated;
      });

    } catch (err) {
      console.error('AI chat failed', err);
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]) {
          updated[lastIdx] = { sender: 'ai', text: 'Error communicating with AI agent. Please ensure the backend is running.', isStreaming: false };
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(prompt);
  };

  return (
    <div className="liquid-glass rounded-xl flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Header Banner */}
      <div className="flex items-center gap-2 border-b border-white/5 p-4 bg-white/2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/10">
          <Sparkles size={16} />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white leading-tight">AI Co-Founder & Business Coach</h3>
          <span className="text-[9px] text-gray-500 mt-0.5 block">Streaming workspace sweep suggestions</span>
        </div>
      </div>

      {/* Messages Pane */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
        {messages.map((m, idx) => {
          const isAi = m.sender === 'ai';
          return (
            <div key={idx} className={`flex gap-3 max-w-[80%] ${isAi ? '' : 'ml-auto flex-row-reverse'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 uppercase border ${
                isAi 
                  ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-400' 
                  : 'bg-white/5 border-white/10 text-white'
              }`}>
                {isAi ? <Sparkles size={12} /> : <User size={12} />}
              </div>
              <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                isAi 
                  ? 'bg-white/2 border border-white/5 text-gray-300' 
                  : 'bg-indigo-600 border border-indigo-500 text-white'
              }`}>
                {/* Parse basic markdown format markers */}
                {m.text.split('\n\n').map((paragraph: string, pIdx: number) => {
                  if (paragraph.startsWith('### ')) {
                    return <h3 key={pIdx} className="font-extrabold text-white text-xs mt-2 mb-1.5">{paragraph.replace('### ', '')}</h3>;
                  }
                  if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
                    return <li key={pIdx} className="ml-3 list-disc text-gray-300">{paragraph.replace(/^(\* |- )/, '')}</li>;
                  }
                  return <p key={pIdx} className="mt-1">{paragraph}</p>;
                })}

                {m.isStreaming && (
                  <span className="inline-block w-1.5 h-3 bg-indigo-400 ml-1 animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Actions and inputs bottom pane */}
      <div className="border-t border-white/5 p-4 space-y-3 bg-white/2">
        {/* Quick prompt triggers */}
        <div className="flex gap-2 flex-wrap text-xs select-none">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSend(p.label, p.topic)}
              className="px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-white/12 hover:bg-white/5 text-gray-400 hover:text-gray-200 transition cursor-pointer text-[10px] font-semibold"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleFormSubmit} className="flex gap-2 text-xs">
          <input
            type="text"
            disabled={loading}
            placeholder="Query advice, OKR setups, GTMS pricing structures..."
            className="w-full glass-input text-xs"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
export default AiCoach;
