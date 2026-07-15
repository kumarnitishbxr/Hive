import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MentorProfile {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: 'Mentor';
  expertise?: string[];
  experience?: string;
  linkedin?: string;
  feedbackGivenCount?: number;
  meetingsScheduledCount?: number;
}

interface MentorState {
  mentors: MentorProfile[];
  isLoading: boolean;
}

const initialState: MentorState = {
  mentors: [],
  isLoading: false
};

const mentorSlice = createSlice({
  name: 'mentor',
  initialState,
  reducers: {
    setMentors: (state, action: PayloadAction<MentorProfile[]>) => {
      state.mentors = action.payload;
    },
    setMentorLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    }
  }
});

export const { setMentors, setMentorLoading } = mentorSlice.actions;
export default mentorSlice.reducer;
