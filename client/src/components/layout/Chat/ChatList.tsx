import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { chatService } from '../../../services/api';
import { setConversations, setActiveConversationId, ConversationType } from '../../../store/slices/chatSlice';
import { setUsers, UserProfile } from '../../../store/slices/userSlice';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Hash, 
  Users, 
  X, 
  CircleDot 
} from 'lucide-react';

interface ChatListProps {
  onSelectConversation: (convoId: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelectConversation }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const chatState = useSelector((state: RootState) => state.chat);
  const userState = useSelector((state: RootState) => state.user);
  const workspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalType, setModalType] = useState<'direct' | 'group'>('direct');
  
  // Modal Form State
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  // Fetch conversations and startup members on mount or workspace change
  useEffect(() => {
    if (!workspaceId) return;
    const loadConversationsAndMembers = async () => {
      try {
        const convoRes = await chatService.getConversations();
        dispatch(setConversations(convoRes.data));

        const membersRes = await chatService.getMembers();
        dispatch(setUsers(membersRes.data));
      } catch (err) {
        console.error('Failed to load chat resources:', err);
      }
    };
    loadConversationsAndMembers();
  }, [dispatch, auth.startupId, workspaceId]);

  // Handle conversation select
  const handleSelectConvo = (convoId: string) => {
    dispatch(setActiveConversationId(convoId));
    onSelectConversation(convoId);
    // Mark seen on backend
    chatService.markSeen(convoId);
  };

  // Start a new Direct Message conversation
  const startDirectChat = async (recipientId: string) => {
    try {
      const workspaceId = localStorage.getItem('activeWorkspaceId') || '';
      const res = await chatService.sendMessage({
        recipientId,
        message: 'Started conversation',
        attachments: []
      });
      
      // Reload conversations
      const convoRes = await chatService.getConversations();
      dispatch(setConversations(convoRes.data));
      
      // Select the conversation
      const conversationId = res.data.conversationId;
      dispatch(setActiveConversationId(conversationId));
      onSelectConversation(conversationId);
      
      setShowCreateModal(false);
      setSelectedUserIds([]);
    } catch (err) {
      console.error('Failed to start direct message:', err);
    }
  };

  // Start a new Group Chat
  const startGroupChat = async () => {
    if (!groupName.trim()) return;
    try {
      const workspaceId = localStorage.getItem('activeWorkspaceId') || '';
      
      // Call create endpoint or send message to initialize group
      // In our controller, we can send a message with multiple recipients
      // Or we can just reuse sendMessage by passing recipients array in participants
      // Let's create the group first by sending initial announcement.
      // We will add all selectedUserIds and the sender as participants.
      const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
      const participants = [...selectedUserIds, user.id];
      
      // For groups, we send group name and description
      const payload: any = {
        message: `Created group channel #${groupName}`,
        attachments: [],
        workspaceId // Attach active workspace context
      };
      
      // We will call send endpoint with conversation initialization params
      const res = await apiCreateGroupConversation(groupName, groupDescription, participants);
      
      // Reload conversations
      const convoRes = await chatService.getConversations();
      dispatch(setConversations(convoRes.data));
      
      dispatch(setActiveConversationId(res._id));
      onSelectConversation(res._id);
      
      setShowCreateModal(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedUserIds([]);
    } catch (err) {
      console.error('Failed to create group channel:', err);
    }
  };

  // Direct group chat creation helper via raw send
  const apiCreateGroupConversation = async (name: string, desc: string, userIds: string[]) => {
    const token = localStorage.getItem('token');
    const startupId = localStorage.getItem('startupId');
    const workspaceId = localStorage.getItem('activeWorkspaceId') || '';
    const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5100/api';
    
    // Create conversation directly on backend
    const response = await fetch(`${baseApiUrl}/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-startup-id': startupId || '',
        'x-workspace-id': workspaceId
      },
      body: JSON.stringify({
        message: `Welcome to the new channel #${name}. ${desc}`,
        attachments: [],
        workspaceId
      })
    });
    
    const initialMsg = await response.json();
    
    // Find conversation and modify it to group on backend if needed, 
    // but our controller does this automatically if we pass recipients or initialize it.
    // Let's make sure we update conversation type to group and set name.
    const convoId = initialMsg.conversationId;
    await fetch(`${baseApiUrl}/chat/conversations/${convoId}/update-group`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        description: desc,
        participants: userIds,
        type: 'group'
      })
    });
    
    return { _id: convoId };
  };

  // Filters conversations based on query
  const filteredConversations = chatState.conversations.filter(convo => {
    if (convo.type === 'direct') {
      const recipient = convo.participants.find(p => p._id !== auth.user?.id);
      return recipient?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      return convo.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  const getRecipientInfo = (convo: ConversationType) => {
    if (convo.type === 'group') {
      return {
        name: convo.name || 'Group Project Chat',
        avatar: undefined,
        role: 'Group Channel',
        isOnline: false
      };
    }
    const recipient = convo.participants.find(p => p._id !== auth.user?.id);
    const isOnline = userState.onlineUserIds.includes(recipient?._id || '');
    return {
      name: recipient?.fullName || 'Deleted Account',
      avatar: recipient?.avatarUrl,
      role: recipient?.role || 'Team Member',
      isOnline
    };
  };

  const formatLastActive = (timeString?: string) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-80 border-r border-white/5 bg-slate-950/90 flex flex-col h-full overflow-hidden z-20">
      
      {/* Search Header */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white tracking-wider uppercase">Workspace Chats</h2>
          <div className="flex gap-1">
            <button
              onClick={() => { setModalType('direct'); setShowCreateModal(true); }}
              title="Start direct chat"
              className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-indigo-400 rounded-lg border border-white/5 transition cursor-pointer"
            >
              <MessageSquare size={13} />
            </button>
            <button
              onClick={() => { setModalType('group'); setShowCreateModal(true); }}
              title="Create group channel"
              className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-indigo-400 rounded-lg border border-white/5 transition cursor-pointer"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 bg-white/2 border border-white/8 rounded-lg text-[11px] outline-none text-white focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Group Channels Section */}
        <div>
          <span className="px-2 text-[10px] text-gray-500 font-extrabold tracking-wider uppercase flex items-center gap-1 mb-1">
            <Hash size={10} /> CHANNELS ({filteredConversations.filter(c => c.type === 'group').length})
          </span>
          <div className="space-y-0.5">
            {filteredConversations.filter(c => c.type === 'group').map(convo => {
              const isActive = chatState.activeConversationId === convo._id;
              // Check if anyone is typing in this room
              const typingUsers = chatState.typingStatus[convo._id];
              const someoneTyping = typingUsers ? Object.values(typingUsers).filter(t => t.isTyping) : [];

              return (
                <button
                  key={convo._id}
                  onClick={() => handleSelectConvo(convo._id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer ${
                    isActive 
                      ? 'bg-white/5 border border-white/10 text-indigo-400' 
                      : 'text-gray-400 hover:bg-white/2 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    <Hash size={14} className={isActive ? 'text-indigo-400' : 'text-gray-500'} />
                    <div className="truncate flex-1">
                      <p className="text-xs font-bold text-gray-200 truncate">{convo.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {someoneTyping.length > 0 
                          ? `${someoneTyping[0].userName} is typing...`
                          : convo.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[9px] text-gray-500">{formatLastActive(convo.lastMessageTime)}</span>
                    {convo.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-extrabold text-[9px] flex items-center justify-center animate-pulse">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div>
          <span className="px-2 text-[10px] text-gray-500 font-extrabold tracking-wider uppercase flex items-center gap-1 mb-1">
            <Users size={10} /> DIRECT MESSAGES ({filteredConversations.filter(c => c.type === 'direct').length})
          </span>
          <div className="space-y-0.5">
            {filteredConversations.filter(c => c.type === 'direct').map(convo => {
              const isActive = chatState.activeConversationId === convo._id;
              const info = getRecipientInfo(convo);
              
              // Typing status check
              const typingUsers = chatState.typingStatus[convo._id];
              const someoneTyping = typingUsers ? Object.values(typingUsers).filter(t => t.isTyping) : [];

              return (
                <button
                  key={convo._id}
                  onClick={() => handleSelectConvo(convo._id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer ${
                    isActive 
                      ? 'bg-white/5 border border-white/10 text-indigo-400' 
                      : 'text-gray-400 hover:bg-white/2 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    {/* Avatar with Online/Offline indicator */}
                    <div className="relative">
                      {info.avatar ? (
                        <img src={info.avatar} alt={info.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-400 uppercase border border-white/5">
                          {info.name.charAt(0)}
                        </div>
                      )}
                      <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-950 ${info.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
                    </div>

                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-gray-200 truncate">{info.name}</p>
                        <span className="text-[8px] bg-slate-800 border border-white/5 px-1 py-0.2 rounded font-semibold text-gray-400 capitalize">
                          {info.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">
                        {someoneTyping.length > 0
                          ? `typing...`
                          : convo.lastMessage}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[9px] text-gray-500">{formatLastActive(convo.lastMessageTime)}</span>
                    {convo.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-extrabold text-[9px] flex items-center justify-center animate-pulse">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Startup Members DM / Group creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-full max-w-md bg-slate-950 border border-white/10 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white">
                {modalType === 'direct' ? 'New Direct Message' : 'Create Channel / Group'}
              </h3>
              <button 
                onClick={() => { setShowCreateModal(false); setSelectedUserIds([]); }}
                className="p-1 text-gray-500 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {modalType === 'group' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Channel Name (e.g. engineering-sprint)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/2 border border-white/8 rounded-lg text-xs outline-none text-white focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Channel Description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white/2 border border-white/8 rounded-lg text-xs outline-none text-white focus:border-indigo-500"
                />
              </div>
            )}

            {/* Member search grid */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 font-extrabold uppercase">SELECT MEMBERS</span>
              <input
                type="text"
                placeholder="Search team members..."
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-white/2 border border-white/8 rounded-lg text-xs outline-none text-white focus:border-indigo-500"
              />
              
              <div className="max-h-48 overflow-y-auto divide-y divide-white/5 border border-white/5 rounded-lg">
                {userState.users
                  .filter(u => u._id !== auth.user?.id && u.fullName.toLowerCase().includes(searchMemberQuery.toLowerCase()))
                  .map(user => {
                    const isSelected = selectedUserIds.includes(user._id);
                    return (
                      <div 
                        key={user._id}
                        className="flex items-center justify-between p-2 hover:bg-white/2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-indigo-400">
                              {user.fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-200">{user.fullName}</p>
                            <p className="text-[9px] text-indigo-400 font-semibold">{user.role}</p>
                          </div>
                        </div>
                        
                        {modalType === 'direct' ? (
                          <button
                            onClick={() => startDirectChat(user._id)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] transition cursor-pointer"
                          >
                            Chat
                          </button>
                        ) : (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedUserIds(prev => 
                                isSelected ? prev.filter(id => id !== user._id) : [...prev, user._id]
                              );
                            }}
                            className="rounded border-white/10 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {modalType === 'group' && (
              <button
                onClick={startGroupChat}
                disabled={!groupName.trim() || selectedUserIds.length === 0}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-40 transition cursor-pointer"
              >
                Create Channel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
