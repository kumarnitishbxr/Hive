import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SocketState {
  isConnected: boolean;
}

const initialState: SocketState = {
  isConnected: false
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    }
  }
});

export const { setConnected } = socketSlice.actions;
export default socketSlice.reducer;
