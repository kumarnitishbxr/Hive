import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WorkspaceState {
  workspaces: any[];
  activeWorkspaceId: string | null;
  activeWorkspaceName: string | null;
  pages: any[];
  activePageId: string | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  activeWorkspaceId: localStorage.getItem('activeWorkspaceId'),
  activeWorkspaceName: localStorage.getItem('activeWorkspaceName'),
  pages: [],
  activePageId: null
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setWorkspaces: (state, action: PayloadAction<any[]>) => {
      state.workspaces = action.payload;
      if (action.payload.length > 0 && !state.activeWorkspaceId) {
        state.activeWorkspaceId = action.payload[0]._id;
        state.activeWorkspaceName = action.payload[0].name;
        localStorage.setItem('activeWorkspaceId', action.payload[0]._id);
        localStorage.setItem('activeWorkspaceName', action.payload[0].name);
      }
    },
    setActiveWorkspace: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.activeWorkspaceId = action.payload.id;
      state.activeWorkspaceName = action.payload.name;
      localStorage.setItem('activeWorkspaceId', action.payload.id);
      localStorage.setItem('activeWorkspaceName', action.payload.name);
    },
    setPages: (state, action: PayloadAction<any[]>) => {
      state.pages = action.payload;
    },
    setActivePageId: (state, action: PayloadAction<string | null>) => {
      state.activePageId = action.payload;
    }
  }
});

export const { setWorkspaces, setActiveWorkspace, setPages, setActivePageId } = workspaceSlice.actions;
export default workspaceSlice.reducer;
