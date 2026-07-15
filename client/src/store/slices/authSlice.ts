import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  user: {
    id: string;
    email: string;
    fullName: string;
  } | null;
  startupId: string | null;
  role: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  startupId: localStorage.getItem('startupId'),
  role: localStorage.getItem('role'),
  isAuthenticated: !!localStorage.getItem('token')
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: any; startupId: string | null; role: string | null }>
    ) => {
      const { token, user, startupId, role } = action.payload;
      state.token = token;
      state.user = user;
      state.startupId = startupId;
      state.role = role;
      state.isAuthenticated = true;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (startupId) localStorage.setItem('startupId', startupId);
      if (role) localStorage.setItem('role', role);
    },
    updateStartupContext: (state, action: PayloadAction<{ startupId: string; role: string }>) => {
      const { startupId, role } = action.payload;
      state.startupId = startupId;
      state.role = role;
      localStorage.setItem('startupId', startupId);
      localStorage.setItem('role', role);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.startupId = null;
      state.role = null;
      state.isAuthenticated = false;

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('startupId');
      localStorage.removeItem('role');
    }
  }
});

export const { setCredentials, updateStartupContext, logout } = authSlice.actions;
export default authSlice.reducer;
