import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useChat } from './hooks/useChat';
import { useStreaming } from './hooks/useStreaming';
import { 
  Sparkles, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, 
  HelpCircle, ShieldAlert, CheckCircle2, ChevronRight, Activity, Terminal
} from 'lucide-react';

import ConversationSidebar from './components/ConversationSidebar';
import WorkspacePanel from './components/WorkspacePanel';
import MessageBubble from './components/MessageBubble';
import MessageInput from './components/MessageInput';
import VirtualList from '../../components/VirtualList';

export const AiCoach: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  
  // Custom hooks
  const { conversations, activeConversationId, selectConversation, deleteConversation } = useChat();
  const { streamChat, isStreaming } = useStreaming();

  // Sidebar Toggles
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);

  // Active chat state
  const [activeConvo, setActiveConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mock Workspace data for right panel
  const projectsList = [
    { name: 'Product Beta Launch', progress: 78 },
    { name: 'Investor CRM Deck', progress: 92 },
    { name: 'Stripe Billing Webhooks', progress: 45 }
  ];

  const memoryItems = [
    { category: 'Validation', recommendation: 'Schedule 5 user feedback surveys', suggestedAt: 'Today', isFollowed: false },
    { category: 'Planning', recommendation: 'Invite 2 backend team members', suggestedAt: 'Today', isFollowed: true },
    { category: 'Execution', recommendation: 'Resolve Stripe webhook blockers', suggestedAt: 'Yesterday', isFollowed: false }
  ];

  // Quick Action Buttons
  const quickActions = [
    { label: 'Generate Sprint', prompt: '/sprint' },
    { label: 'Create Tasks', prompt: '/task' },
    { label: 'Investor Pitch', prompt: '/pitch' },
    { label: 'Analyze Team', prompt: 'Who is overloaded?' },
    { label: 'View Risks', prompt: 'Which milestone is at risk?' }
  ];

  // Sync selected conversation messages
  useEffect(() => {
    if (activeConversationId) {
      const convo = conversations.find(c => c._id === activeConversationId);
      if (convo) {
        setActiveConvo(convo);
        setMessages(convo.messages);
      }
    } else {
      setActiveConvo(null);
      setMessages([]);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Append user message
    const userMsg = {
      _id: Math.random().toString(),
      sender: 'user' as const,
      text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    // Setup placeholder for streaming
    const streamingMsgId = 'stream-' + Math.random().toString();
    setMessages(prev => [...prev, {
      _id: streamingMsgId,
      sender: 'ai' as const,
      text: '',
      isStreaming: true,
      createdAt: new Date().toISOString()
    }]);

    let accumulated = '';
    await streamChat(
      text,
      activeConversationId,
      (token: string) => {
        accumulated += token;
        setMessages(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(m => m._id === streamingMsgId);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], text: accumulated };
          }
          return updated;
        });
      },
      (completeData) => {
        setMessages(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(m => m._id === streamingMsgId);
          if (idx !== -1) {
            updated[idx] = { 
              ...updated[idx], 
              _id: completeData.conversationId || streamingMsgId,
              text: accumulated,
              isStreaming: false,
              citations: completeData.citations,
              suggestedFollowups: completeData.suggestedFollowups
            };
          }
          return updated;
        });
        if (completeData.conversationId && !activeConversationId) {
          selectConversation(completeData.conversationId);
        }
      }
    );
  };

  return (
    <div className="flex h-full flex-1 overflow-hidden min-h-0 bg-slate-950 text-gray-200 border border-white/5 rounded-2xl relative z-10">
      
      {/* 2. Middle Panel: Chat Board */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-slate-900/10">
        
        {/* Chat top header toolbar */}
        <div className="h-14 border-b border-white/5 bg-slate-950/40 px-6 flex items-center justify-between z-30 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6.5 h-6.5 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                🤖
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Startup Copilot</h3>
                <span className="text-[8px] text-emerald-400 font-extrabold uppercase tracking-wide flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" /> Online • StartupOps Health score: 86%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Message View Area */}
        <div className="flex-1 p-6 overflow-hidden min-h-0">
          {messages.length > 0 ? (
            <VirtualList
              items={messages}
              estimateSize={110}
              heightClass="h-full"
              renderItem={(msg: any) => (
                <div className="px-1 py-1.5">
                  <MessageBubble
                    message={msg}
                    onRegenerate={() => handleSendMessage(msg.text)}
                  />
                </div>
              )}
            />
          ) : (
            /* Premium Empty Welcome Card (ChatGPT + Claude style) */
            <div className="h-full overflow-y-auto pr-1 flex flex-col justify-center max-w-xl mx-auto space-y-6 text-left select-none py-8">
              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-white leading-snug">
                  Good Evening {auth.user?.fullName.split(' ')[0] || 'Nitish'} 👋
                </h2>
                <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                  I am your AI Co-Founder. Ask me anything about your tasks, projects, roadmap, or startup health!
                </p>
              </div>

              {/* Today's Health Score Snapshot widget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 flex items-center justify-center font-black text-xs text-indigo-400 bg-indigo-500/5">
                    86%
                  </div>
                  <div>
                    <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Startup Health</h4>
                    <span className="text-xs font-extrabold text-white">Strong Operational Velocity</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 space-y-2">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Today's recommendations</span>
                  <ul className="space-y-1 text-[10px] text-gray-400 font-medium">
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-indigo-400" /> Finish Authentication Module</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-indigo-400" /> Invite 2 Team Members</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Quick Planning Actions</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quickActions.map(action => (
                    <button
                      key={action.label}
                      onClick={() => handleSendMessage(action.prompt)}
                      className="p-2.5 rounded-xl border border-white/5 hover:border-indigo-500/25 hover:bg-indigo-500/5 text-gray-400 hover:text-indigo-300 font-bold transition text-left cursor-pointer outline-none"
                    >
                      {action.label} <ChevronRight size={10} className="inline ml-0.5 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar Area */}
        <div className="p-6 border-t border-white/5 bg-white/2 select-none shrink-0">
          <MessageInput onSendMessage={handleSendMessage} isLoading={isStreaming} />
        </div>

      </div>

    </div>
  );
};
export default AiCoach;
