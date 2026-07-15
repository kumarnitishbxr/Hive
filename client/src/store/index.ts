import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import workspaceReducer from './slices/workspaceSlice';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';
import socketReducer from './slices/socketSlice';
import userReducer from './slices/userSlice';
import teamReducer from './slices/teamSlice';
import mentorReducer from './slices/mentorSlice';
import invitationReducer from './slices/invitationSlice';
import taskReducer from './slices/taskSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    chat: chatReducer,
    notification: notificationReducer,
    socket: socketReducer,
    user: userReducer,
    team: teamReducer,
    mentor: mentorReducer,
    invitation: invitationReducer,
    task: taskReducer
  }
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

