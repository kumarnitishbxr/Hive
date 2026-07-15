import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: 'Founder' | 'Co-Founder' | 'Admin' | 'Team Member' | 'Mentor' | 'Investor' | 'Guest';
}

interface UserState {
  users: UserProfile[];
  onlineUserIds: string[];
  isLoading: boolean;
}

const initialState: UserState = {
  users: [],
  onlineUserIds: [],
  isLoading: false
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<UserProfile[]>) => {
      state.users = action.payload;
    },
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUserIds = action.payload;
    },
    addUserOnline: (state, action: PayloadAction<string>) => {
      if (!state.onlineUserIds.includes(action.payload)) {
        state.onlineUserIds.push(action.payload);
      }
    },
    removeUserOffline: (state, action: PayloadAction<string>) => {
      state.onlineUserIds = state.onlineUserIds.filter((id) => id !== action.payload);
    },
    setUserLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    }
  }
});

export const { setUsers, setOnlineUsers, addUserOnline, removeUserOffline, setUserLoading } = userSlice.actions;
export default userSlice.reducer;
