import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Participant {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

export interface Attachment {
  name: string;
  url: string;
  fileType: string;
}

export interface MessageType {
  _id: string;
  conversationId: string;
  senderId: Participant | string;
  message: string;
  attachments: Attachment[];
  replyTo?: {
    _id: string;
    message: string;
    senderId: string;
  };
  seenBy: string[];
  deliveredTo: string[];
  edited: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationType {
  _id: string;
  workspaceId: string;
  participants: Participant[];
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  createdBy: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  conversations: ConversationType[];
  activeConversationId: string | null;
  messages: Record<string, MessageType[]>; // conversationId -> messages
  typingStatus: Record<string, Record<string, { userName: string; isTyping: boolean }>>; // conversationId -> userId -> typingState
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingStatus: {},
  isLoading: false,
  error: null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<ConversationType[]>) => {
      state.conversations = action.payload;
    },
    updateConversationLastMessage: (
      state,
      action: PayloadAction<{ conversationId: string; lastMessage: string; lastMessageTime: string }>
    ) => {
      const { conversationId, lastMessage, lastMessageTime } = action.payload;
      const convo = state.conversations.find((c) => c._id === conversationId);
      if (convo) {
        convo.lastMessage = lastMessage;
        convo.lastMessageTime = lastMessageTime;
      }
      // Re-sort conversations by lastMessageTime descending
      state.conversations.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
    },
    setActiveConversationId: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
      // Reset unread count for active conversation
      if (action.payload) {
        const convo = state.conversations.find((c) => c._id === action.payload);
        if (convo) {
          convo.unreadCount = 0;
        }
      }
    },
    setMessagesForConversation: (
      state,
      action: PayloadAction<{ conversationId: string; messages: MessageType[] }>
    ) => {
      const { conversationId, messages } = action.payload;
      state.messages[conversationId] = messages;
    },
    addMessageToConversation: (state, action: PayloadAction<MessageType>) => {
      const msg = action.payload;
      const convoId = msg.conversationId;
      if (!state.messages[convoId]) {
        state.messages[convoId] = [];
      }
      // Avoid duplicate rendering
      if (!state.messages[convoId].some((m) => m._id === msg._id)) {
        state.messages[convoId].push(msg);
      }
      
      // Update unread count if it's not the active conversation and not sent by current user
      const currentUserId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : null;
      const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;

      if (convoId !== state.activeConversationId && senderId !== currentUserId) {
        const convo = state.conversations.find((c) => c._id === convoId);
        if (convo) {
          convo.unreadCount += 1;
        }
      }
    },
    updateMessageStatus: (state, action: PayloadAction<MessageType>) => {
      const msg = action.payload;
      const convoId = msg.conversationId;
      if (state.messages[convoId]) {
        const idx = state.messages[convoId].findIndex((m) => m._id === msg._id);
        if (idx !== -1) {
          state.messages[convoId][idx] = msg;
        }
      }
    },
    setTypingIndicator: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string; userName: string; isTyping: boolean }>
    ) => {
      const { conversationId, userId, userName, isTyping } = action.payload;
      if (!state.typingStatus[conversationId]) {
        state.typingStatus[conversationId] = {};
      }
      if (isTyping) {
        state.typingStatus[conversationId][userId] = { userName, isTyping };
      } else {
        delete state.typingStatus[conversationId][userId];
      }
    },
    markMessagesAsSeenLocally: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string }>
    ) => {
      const { conversationId, userId } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].map((msg) => {
          if (!msg.seenBy.includes(userId)) {
            return { ...msg, seenBy: [...msg.seenBy, userId] };
          }
          return msg;
        });
      }
    },
    setChatLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setChatError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  }
});

export const {
  setConversations,
  updateConversationLastMessage,
  setActiveConversationId,
  setMessagesForConversation,
  addMessageToConversation,
  updateMessageStatus,
  setTypingIndicator,
  markMessagesAsSeenLocally,
  setChatLoading,
  setChatError
} = chatSlice.actions;

export default chatSlice.reducer;
