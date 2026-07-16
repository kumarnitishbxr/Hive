import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useChat } from './hooks/useChat';
import { useStreaming } from './hooks/useStreaming';

import AIHeader from './components/AIHeader';
import EmptyState from './components/EmptyState';
import ConversationSidebar from './components/ConversationList';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import { IConversation, IMessage } from './types';

interface AiCoachProps {
  isModalMode?: boolean;
  onClose?: () => void;
}

export const AiCoach: React.FC<AiCoachProps> = ({ isModalMode = false, onClose }) => {
  const auth = useSelector((state: RootState) => state.auth);
  
  // Custom hooks
  const { conversations: serverConversations, activeConversationId, selectConversation, deleteConversation } = useChat();
  const { streamChat, isStreaming } = useStreaming();

  // Mobile drawer visibility toggle state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Local synced conversations to handle client-side renaming and pinning actions
  const [localConvos, setLocalConvos] = useState<IConversation[]>([]);

  // Active messages list
  const [messages, setMessages] = useState<IMessage[]>([]);

  // Sync server conversations list to local state
  useEffect(() => {
    setLocalConvos(serverConversations);
  }, [serverConversations]);

  // Sync active selected conversation messages
  useEffect(() => {
    if (activeConversationId) {
      const convo = localConvos.find(c => c._id === activeConversationId);
      if (convo) {
        setMessages(convo.messages);
      }
    } else {
      setMessages([]);
    }
  }, [activeConversationId, localConvos]);

  const handleRename = (id: string, newTitle: string) => {
    setLocalConvos(prev => prev.map(c => c._id === id ? { ...c, title: newTitle } : c));
  };

  const handleTogglePin = (id: string) => {
    setLocalConvos(prev => prev.map(c => c._id === id ? { ...c, isPinned: !c.isPinned } : c));
  };

  const handleClearChat = () => {
    if (activeConversationId) {
      deleteConversation(activeConversationId);
    } else {
      setMessages([]);
    }
  };

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

    // Setup placeholder for streaming response
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
    <div className={`flex h-full w-full overflow-hidden bg-[#0B1120] text-gray-200 ${
      isModalMode ? '' : 'border border-white/5 rounded-[24px] shadow-2xl'
    }`}>
      
      {/* 1. Left Sidebar Panel (Visible on Desktop only: w-[300px]) */}
      <div className="hidden md:block w-[300px] h-full shrink-0 border-r border-white/5">
        <ConversationSidebar
          conversations={localConvos}
          activeConversationId={activeConversationId}
          onSelect={selectConversation}
          onDelete={deleteConversation}
          onRename={handleRename}
          onTogglePin={handleTogglePin}
          isOpen={true}
        />
      </div>

      {/* Mobile Drawer (Collapsible slide-out overlay for history navigation) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          {/* Slide out card */}
          <div className="relative flex flex-col w-[280px] max-w-xs h-full bg-[#111827] shadow-2xl animate-fade-in border-r border-white/5">
            <ConversationSidebar
              conversations={localConvos}
              activeConversationId={activeConversationId}
              onSelect={selectConversation}
              onDelete={deleteConversation}
              onRename={handleRename}
              onTogglePin={handleTogglePin}
              isOpen={true}
              onCloseMobile={() => setIsMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 2. Right Main Chat Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-[#0B1120]">
        
        {/* ChatHeader (Logo title, status pulse, basic action shortcuts) */}
        <AIHeader
          onNewChat={() => selectConversation(null)}
          onClearChat={handleClearChat}
          onToggleSidebarMobile={() => setIsMobileDrawerOpen(true)}
        />

        {/* Scrollable messages container or empty illustrations */}
        <div className="flex-grow flex flex-col overflow-hidden min-h-0 relative">
          {messages.length > 0 ? (
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              onRegenerateMessage={handleSendMessage}
            />
          ) : (
            <EmptyState
              userName={auth.user?.fullName.split(' ')[0] || 'Nitish'}
              onSuggestionClick={handleSendMessage}
            />
          )}
        </div>

        {/* Sticky bottom input block */}
        <div className="p-4 border-t border-white/5 bg-[#111827]/40 shrink-0">
          <div className="max-w-3xl mx-auto w-full">
            <MessageInput onSendMessage={handleSendMessage} isLoading={isStreaming} />
          </div>
        </div>

      </div>

    </div>
  );
};

export default AiCoach;
