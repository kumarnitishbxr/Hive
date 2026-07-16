import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  user: {
    id: string;
    email: string;
    fullName: string;
    firstLogin?: boolean;
    invitationAccepted?: boolean;
  } | null;
  startupId: string | null;
  role: string | null;
  isAuthenticated: boolean;
}

const clearWorkspaceStorage = () => {
  localStorage.removeItem('startupId');
  localStorage.removeItem('role');
  localStorage.removeItem('activeWorkspaceId');
  localStorage.removeItem('activeWorkspaceName');
};

const getSafeLocalStorageItem = (key: string): string | null => {
  try {
    const value = localStorage.getItem(key);
    return (value === 'undefined' || value === 'null') ? null : value;
  } catch {
    return null;
  }
};

const getUserFromStorage = (): any => {
  try {
    const user = localStorage.getItem('user');
    if (!user || user === 'undefined' || user === 'null') return null;
    return JSON.parse(user);
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
    return null;
  }
};

const initialState: AuthState = {
  token: getSafeLocalStorageItem('token'),
  user: getUserFromStorage(),
  startupId: getSafeLocalStorageItem('startupId'),
  role: getSafeLocalStorageItem('role'),
  isAuthenticated: !!getSafeLocalStorageItem('token')
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
      state.token = token || null;
      state.user = user || null;
      state.startupId = startupId || null;
      state.role = role || null;
      state.isAuthenticated = !!token;

      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }

      if (startupId) {
        localStorage.setItem('startupId', startupId);
      } else {
        clearWorkspaceStorage();
      }

      if (role) {
        localStorage.setItem('role', role);
      } else {
        localStorage.removeItem('role');
      }
    },
    updateStartupContext: (state, action: PayloadAction<{ startupId: string; role: string }>) => {
      const { startupId, role } = action.payload;
      state.startupId = startupId || null;
      state.role = role || null;
      if (startupId) {
        localStorage.setItem('startupId', startupId);
      } else {
        localStorage.removeItem('startupId');
      }
      if (role) {
        localStorage.setItem('role', role);
      } else {
        localStorage.removeItem('role');
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.startupId = null;
      state.role = null;
      state.isAuthenticated = false;

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      clearWorkspaceStorage();
    }
  }
});

export const { setCredentials, updateStartupContext, logout } = authSlice.actions;
export default authSlice.reducer;
