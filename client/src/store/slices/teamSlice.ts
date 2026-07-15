import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TeamMember {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: 'Founder' | 'Co-Founder' | 'Admin' | 'Team Member' | 'Mentor' | 'Investor' | 'Guest';
  departmentId?: string;
  designation?: string;
  phone?: string;
  joiningDate?: string;
  skills: string[];
  employmentType?: string;
  bio?: string;
  assignedTasks: number;
  completedTasks: number;
  performanceScore: number;
  isOnline: boolean;
}

interface TeamState {
  members: TeamMember[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TeamState = {
  members: [],
  isLoading: false,
  error: null
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setMembers: (state, action: PayloadAction<TeamMember[]>) => {
      state.members = action.payload;
    },
    updateMemberRoleLocal: (state, action: PayloadAction<{ memberId: string; role: any }>) => {
      const { memberId, role } = action.payload;
      const mem = state.members.find((m) => m._id === memberId);
      if (mem) {
        mem.role = role;
      }
    },
    removeMemberLocal: (state, action: PayloadAction<string>) => {
      state.members = state.members.filter((m) => m._id !== action.payload);
    },
    setTeamLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTeamError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  }
});

export const { setMembers, updateMemberRoleLocal, removeMemberLocal, setTeamLoading, setTeamError } = teamSlice.actions;
export default teamSlice.reducer;
