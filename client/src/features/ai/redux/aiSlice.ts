import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IConversation } from '../types';

interface AIState {
  activeConversationId: string | null;
  conversations: IConversation[];
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const initialState: AIState = {
  activeConversationId: null,
  conversations: [],
  isLeftSidebarOpen: true,
  isRightSidebarOpen: true,
  theme: 'dark'
};

const aiSlice = createSlice({
  name: 'aiCopilot',
  initialState,
  reducers: {
    setActiveConversationId: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
    },
    setConversations: (state, action: PayloadAction<IConversation[]>) => {
      state.conversations = action.payload;
    },
    toggleLeftSidebar: (state) => {
      state.isLeftSidebarOpen = !state.isLeftSidebarOpen;
    },
    toggleRightSidebar: (state) => {
      state.isRightSidebarOpen = !state.isRightSidebarOpen;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    }
  }
});

export const {
  setActiveConversationId,
  setConversations,
  toggleLeftSidebar,
  toggleRightSidebar,
  toggleTheme
} = aiSlice.actions;

export default aiSlice.reducer;
