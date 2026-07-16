import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Video, 
  Info, 
  Search, 
  X, 
  Pin, 
  Paperclip, 
  Calendar, 
  Mail, 
  Briefcase, 
  ArrowRight
} from 'lucide-react';

import { RootState } from '../store';
import { useSocket } from '../hooks/useSocket';
import { chatService } from '../services/api';
import { useMessages, useSendMessage, useConversations } from '../hooks/useReactQueries';
import { 
  MessageType, 
  ConversationType 
} from '../store/slices/chatSlice';

import ChatList from '../components/layout/Chat/ChatList';
import MessageBubble from '../components/layout/Chat/MessageBubble';
import MessageInput from '../components/layout/Chat/MessageInput';
import VirtualList from '../components/VirtualList';
import { Skeleton } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

export const ChatPage: React.FC = () => {
  const queryClient = useQueryClient();
  const auth = useSelector((state: RootState) => state.auth);
  const chatState = useSelector((state: RootState) => state.chat);
  const userState = useSelector((state: RootState) => state.user);
  const workspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);

  const { sendTyping, sendSeen } = useSocket();

  // Selected conversation data
  const [activeConvo, setActiveConvo] = useState<ConversationType | null>(null);
  
  // UI toggles
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useConversations(workspaceId);

  // Use React Query for loading messages
  const { 
    data: activeMessages = [], 
    isLoading: isMessagesLoading, 
    isError: isMessagesError, 
    refetch: refetchMessages 
  } = useMessages(chatState.activeConversationId);

  const sendMessageMutation = useSendMessage();

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (chatState.activeConversationId) {
      refetchMessages();
    }
    // Update recipient details
    const active = conversations.find(c => c._id === chatState.activeConversationId);
    setActiveConvo(active || null);
  }, [chatState.activeConversationId, conversations]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Mark active conversation messages as read when active conversation or messages list changes
  useEffect(() => {
    if (!chatState.activeConversationId) return;

    // Trigger API read receipt update in DB
    chatService.markRead(chatState.activeConversationId)
      .then(() => {
        // Invalidate query to update unread status across navigation list
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .catch(err => console.error('Error marking conversation read:', err));

    // Emit live socket event to update active participants' blue ticks
    sendSeen(chatState.activeConversationId);

  }, [chatState.activeConversationId, activeMessages.length, queryClient]);

  const handleSendMessage = async (text: string, attachments: any[]) => {
    if (!chatState.activeConversationId) return;

    try {
      if (editingMessage) {
        await chatService.editMessage(editingMessage._id, text);
        queryClient.invalidateQueries({ queryKey: ['messages', chatState.activeConversationId] });
        setEditingMessage(null);
        return;
      }

      const workspaceId = localStorage.getItem('activeWorkspaceId') || '';
      
      const payload = {
        conversationId: chatState.activeConversationId,
        message: text,
        attachments,
        replyTo: replyingTo?._id,
        workspaceId
      };

      await sendMessageMutation.mutateAsync(payload);
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string, mode: 'everyone' | 'me') => {
    try {
      await chatService.deleteMessage(messageId, mode);
      queryClient.invalidateQueries({ queryKey: ['messages', chatState.activeConversationId] });
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (chatState.activeConversationId) {
      sendTyping(chatState.activeConversationId, isTyping);
    }
  };

  // Find recipient details for Direct chats
  const getRecipientUser = () => {
    if (!activeConvo || activeConvo.type === 'group') return null;
    return activeConvo.participants.find(p => p._id !== auth.user?.id) || null;
  };

  const recipient = getRecipientUser();
  const isRecipientOnline = recipient ? userState.onlineUserIds.includes(recipient._id) : false;

  // Filter messages by search keyword if toggled
  const filteredMessages = activeMessages.filter((msg: any) => {
    if (!messageSearchQuery) return true;
    return msg.message.toLowerCase().includes(messageSearchQuery.toLowerCase());
  });

  // Extract shared files from messages list
  const sharedFiles = activeMessages.flatMap((msg: any) => 
    (msg.attachments || []).map((a: any) => ({
      name: a.name,
      url: a.url,
      type: a.fileType,
      sender: typeof msg.senderId === 'object' ? msg.senderId.fullName : 'Team Member',
      date: new Date(msg.createdAt).toLocaleDateString()
    }))
  );

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-slate-950/60 relative">
      
      {/* Col 1: Chat Sidebar List */}
      <ChatList onSelectConversation={() => setMessageSearchQuery('')} />

      {/* Col 2: Chat Box Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-900/40 relative border-r border-white/5">
        
        {activeConvo ? (
          <>
            {/* Conversation Header */}
            <div className="h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between z-30">
              
              {/* Profile details */}
              <div className="flex items-center gap-3">
                {activeConvo.type === 'group' ? (
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                    #
                  </div>
                ) : recipient?.avatarUrl ? (
                  <img src={recipient.avatarUrl} alt={recipient.fullName} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-sm text-indigo-400 uppercase">
                    {recipient?.fullName?.charAt(0) || 'C'}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold text-white">
                      {activeConvo.type === 'group' ? activeConvo.name : recipient?.fullName}
                    </h3>
                    {activeConvo.type === 'direct' && (
                      <span className={`w-2 h-2 rounded-full ${isRecipientOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {activeConvo.type === 'group' 
                      ? `${activeConvo.participants.length} Members • Group Chat` 
                      : `${recipient?.role || 'Team Member'} • ${isRecipientOnline ? 'Online' : 'Offline'}`}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSearchBox(prev => !prev)}
                  className={`p-2 rounded-lg border hover:border-white/15 transition cursor-pointer ${showSearchBox ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'border-white/5 text-gray-400 hover:text-white'}`}
                  title="Search Messages"
                >
                  <Search size={14} />
                </button>
                <button 
                  className="p-2 rounded-lg border border-white/5 text-gray-400 hover:text-white hover:border-white/15 transition cursor-pointer"
                  title="Voice Call (UI Placeholder)"
                >
                  <Phone size={14} />
                </button>
                <button 
                  className="p-2 rounded-lg border border-white/5 text-gray-400 hover:text-white hover:border-white/15 transition cursor-pointer"
                  title="Video Call (UI Placeholder)"
                >
                  <Video size={14} />
                </button>
                <button 
                  onClick={() => setShowRightPanel(p => !p)}
                  className={`p-2 rounded-lg border hover:border-white/15 transition cursor-pointer ${showRightPanel ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'border-white/5 text-gray-400 hover:text-white'}`}
                  title="Conversation Details"
                >
                  <Info size={14} />
                </button>
              </div>
            </div>

            {/* In-Chat Message Search Box */}
            {showSearchBox && (
              <div className="p-3 bg-slate-950/40 border-b border-white/5 flex items-center justify-between gap-3 animate-slide-down">
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search in conversation..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white/2 border border-white/8 rounded-lg text-xs outline-none text-white focus:border-indigo-500"
                  />
                </div>
                <button 
                  onClick={() => { setMessageSearchQuery(''); setShowSearchBox(false); }}
                  className="text-xs text-gray-400 hover:text-white p-1"
                >
                  Clear
                </button>
              </div>
            )}
            
            {/* Chat Body (Message Scrolling Canvas) */}
            <div className="grow flex flex-col min-h-0 bg-slate-950/20" ref={messagesContainerRef}>
              {isMessagesLoading ? (
                <div className="flex-1 flex flex-col justify-end p-5 space-y-4">
                  <Skeleton className="h-12 w-2/3 self-start rounded-xl" />
                  <Skeleton className="h-10 w-1/2 self-end rounded-xl" />
                  <Skeleton className="h-16 w-3/4 self-start rounded-xl" />
                </div>
              ) : isMessagesError ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <ErrorState onRetry={refetchMessages} message="Failed to load thread message history." />
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <VirtualList
                    items={filteredMessages}
                    estimateSize={85}
                    heightClass="h-full"
                    emptyComponent={
                      <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <p className="text-xs text-gray-500">
                          {messageSearchQuery ? "No matching messages found in history." : "This is the start of your conversation. Send a message to begin!"}
                        </p>
                      </div>
                    }
                    renderItem={(msg: any, idx: number) => {
                      const getSenderId = (m: MessageType) => typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
                      const prevMsg = idx > 0 ? filteredMessages[idx - 1] : null;
                      const nextMsg = idx < filteredMessages.length - 1 ? filteredMessages[idx + 1] : null;

                      const isFirstInGroup = !prevMsg || getSenderId(prevMsg) !== getSenderId(msg);
                      const isLastInGroup = !nextMsg || getSenderId(nextMsg) !== getSenderId(msg);

                      return (
                        <div className="px-5 py-0.5">
                          <MessageBubble
                            message={msg}
                            currentUserId={auth.user?.id || ''}
                            onReply={setReplyingTo}
                            onDelete={handleDeleteMessage}
                            onEdit={setEditingMessage}
                            isFirstInGroup={isFirstInGroup}
                            isLastInGroup={isLastInGroup}
                          />
                        </div>
                      );
                    }}
                  />
                </div>
              )}
              
              {/* Dynamic typing indicators in-flow (WhatsApp Style Bubble) */}
              {activeConvo && chatState.typingStatus[activeConvo._id] && 
               Object.values(chatState.typingStatus[activeConvo._id]).some(t => t.isTyping) && (
                <div className="flex items-start gap-3 w-full px-5 mt-2 animate-pulse mb-3">
                  <div className="w-8 h-8 shrink-0" />
                  <div className="bg-[#1B2236] px-4 py-2.5 rounded-[18px] flex items-center gap-1.5 self-start">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Composer Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              replyToMessage={replyingTo}
              onClearReply={() => setReplyingTo(null)}
              onTyping={handleTyping}
              editingMessage={editingMessage}
              onClearEdit={() => setEditingMessage(null)}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md liquid-glass p-8 rounded-2xl flex flex-col items-center gap-4 text-center border border-white/10"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-blue-500/15">
                H
              </div>
              <h2 className="text-sm font-extrabold text-foreground tracking-wide uppercase">Hive Chat Hub</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Connect and coordinate with your co-founders, team members, and mentors in real-time. Start a direct thread or launch a group channel.
              </p>
              <button
                onClick={() => {
                  const clickEvent = new CustomEvent('trigger-chat-modal');
                  window.dispatchEvent(clickEvent);
                }}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                Launch Conversation
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Col 3: Right Details Info Panel */}
      <AnimatePresence>
        {activeConvo && showRightPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="w-80 border-l border-white/5 bg-slate-950/80 backdrop-blur-md flex flex-col h-full z-15 overflow-hidden shrink-0"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
              <span className="text-[10px] text-gray-500 font-extrabold tracking-wider uppercase">Conversation Info</span>
              <button 
                onClick={() => setShowRightPanel(false)}
                className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Profile Details Header */}
              <div className="flex flex-col items-center text-center space-y-3 pb-5 border-b border-white/5">
                {activeConvo.type === 'group' ? (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xl text-indigo-400 shadow-xl">
                    #
                  </div>
                ) : recipient?.avatarUrl ? (
                  <img src={recipient.avatarUrl} alt={recipient.fullName} className="w-16 h-16 rounded-full object-cover border border-white/10 shadow-xl" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xl text-indigo-400 uppercase shadow-xl">
                    {recipient?.fullName?.charAt(0) || 'C'}
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    {activeConvo.type === 'group' ? activeConvo.name : recipient?.fullName}
                  </h4>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mt-1">
                    {activeConvo.type === 'group' ? 'Group Project' : recipient?.role || 'Team Member'}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              {activeConvo.type === 'direct' && recipient && (
                <div className="space-y-3">
                  <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Contact Details</span>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Mail size={13} className="text-gray-500 shrink-0" />
                      <span className="truncate">{recipient.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Briefcase size={13} className="text-gray-500 shrink-0" />
                      <span>{recipient.role}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Group Description / Members List */}
              {activeConvo.type === 'group' && (
                <div className="space-y-4">
                  {activeConvo.description && (
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Description</span>
                      <p className="text-xs text-gray-400 leading-relaxed">{activeConvo.description}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Participants ({activeConvo.participants.length})</span>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {activeConvo.participants.map(p => (
                        <div key={p._id} className="flex items-center gap-2 text-xs">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt={p.fullName} className="w-5.5 h-5.5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5.5 h-5.5 rounded-full bg-slate-800 text-[9px] font-bold text-indigo-400 flex items-center justify-center">
                              {p.fullName.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 truncate">
                            <p className="font-bold text-gray-300 truncate">{p.fullName}</p>
                            <p className="text-[8px] text-gray-500">{p.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Starred Messages / Pinned Messages List */}
              <div className="space-y-3">
                <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                  <Pin size={11} className="text-indigo-400" /> Pinned Messages
                </span>
                
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-gray-400 space-y-1 hover:border-white/10 transition">
                    <p className="italic leading-relaxed">"We need to push the Sprint validation checks before Friday's investor sync."</p>
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider text-right">- Nitish Kumar</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-gray-400 space-y-1 hover:border-white/10 transition">
                    <p className="italic leading-relaxed">"Pitch Deck Share links can be generated inside the CRM panel."</p>
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider text-right">- Admin</p>
                  </div>
                </div>
              </div>

              {/* Shared Assets/Attachments Gallery */}
              <div className="space-y-3">
                <span className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase block">Shared Media & Files</span>
                
                {sharedFiles.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {sharedFiles.slice(0, 6).map((file, idx) => {
                      const isImage = file.type?.startsWith('image') || file.url.match(/\.(jpeg|jpg|gif|png|webp)/i);
                      if (isImage) {
                        return (
                          <div 
                            key={idx} 
                            onClick={() => window.open(file.url, '_blank')}
                            className="aspect-square rounded-lg border border-white/5 overflow-hidden bg-black/40 hover:border-indigo-500/50 transition cursor-pointer"
                          >
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                          </div>
                        );
                      } else {
                        return (
                          <div 
                            key={idx} 
                            onClick={() => file.url !== '#' && window.open(file.url, '_blank')}
                            className="aspect-square rounded-lg border border-white/5 flex flex-col items-center justify-center bg-slate-900 p-1 hover:border-indigo-500/50 transition cursor-pointer"
                            title={file.name}
                          >
                            <Paperclip size={16} className="text-indigo-400" />
                            <span className="text-[8px] text-gray-500 truncate w-full text-center mt-1 font-semibold">{file.name}</span>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 italic">No media or files shared in this thread.</p>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global listener hook to toggle DM Modal */}
      <CustomChatModalTrigger showModal={() => {
        const btn = document.querySelector('button[title="Start direct chat"]') as HTMLButtonElement;
        if (btn) btn.click();
      }} />
    </div>
  );
};

// Helper shell component to map window events to start DM triggers
const CustomChatModalTrigger: React.FC<{ showModal: () => void }> = ({ showModal }) => {
  useEffect(() => {
    const handleEvent = () => showModal();
    window.addEventListener('trigger-chat-modal', handleEvent);
    return () => window.removeEventListener('trigger-chat-modal', handleEvent);
  }, [showModal]);
  return null;
};

export default ChatPage;
