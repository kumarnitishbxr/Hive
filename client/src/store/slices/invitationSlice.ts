import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface InvitationType {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: 'Pending' | 'Accepted' | 'Expired' | 'Rejected';
  sentDate: string;
  expiresAt: string;
  createdAt: string;
}

interface InvitationState {
  invitations: InvitationType[];
  isLoading: boolean;
}

const initialState: InvitationState = {
  invitations: [],
  isLoading: false
};

const invitationSlice = createSlice({
  name: 'invitation',
  initialState,
  reducers: {
    setInvitations: (state, action: PayloadAction<InvitationType[]>) => {
      state.invitations = action.payload;
    },
    addInvitationLocal: (state, action: PayloadAction<InvitationType>) => {
      // Avoid duplicate listing
      if (!state.invitations.some(i => i._id === action.payload._id)) {
        state.invitations.unshift(action.payload);
      }
    },
    updateInvitationStatusLocal: (state, action: PayloadAction<{ id: string; status: any }>) => {
      const { id, status } = action.payload;
      const invite = state.invitations.find(i => i._id === id);
      if (invite) {
        invite.status = status;
      }
    },
    removeInvitationLocal: (state, action: PayloadAction<string>) => {
      state.invitations = state.invitations.filter(i => i._id !== action.payload);
    },
    setInvitationLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    }
  }
});

export const { 
  setInvitations, 
  addInvitationLocal, 
  updateInvitationStatusLocal, 
  removeInvitationLocal,
  setInvitationLoading 
} = invitationSlice.actions;

export default invitationSlice.reducer;
