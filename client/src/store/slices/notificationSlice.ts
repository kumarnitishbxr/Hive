import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationType {
  _id: string;
  receiverId: string;
  senderId: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  conversationId?: string;
  messageId?: string;
  type: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationState {
  notifications: {
    today: NotificationType[];
    yesterday: NotificationType[];
    earlier: NotificationType[];
  };
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: {
    today: [],
    yesterday: [],
    earlier: []
  },
  unreadCount: 0,
  isLoading: false,
  error: null
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications: (
      state,
      action: PayloadAction<{
        notifications: { today: NotificationType[]; yesterday: NotificationType[]; earlier: NotificationType[] };
        unreadCount: number;
      }>
    ) => {
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
    },
    addNotification: (state, action: PayloadAction<NotificationType>) => {
      // Prepend to today
      const exists = [
        ...state.notifications.today,
        ...state.notifications.yesterday,
        ...state.notifications.earlier
      ].some((n) => n._id === action.payload._id);

      if (!exists) {
        state.notifications.today.unshift(action.payload);
        state.unreadCount += 1;
      }
    },
    markNotificationReadLocal: (state, action: PayloadAction<string>) => {
      const notifId = action.payload;

      // Find in Today
      let found = false;
      const todayIdx = state.notifications.today.findIndex((n) => n._id === notifId);
      if (todayIdx !== -1) {
        if (!state.notifications.today[todayIdx].isRead) {
          state.notifications.today[todayIdx].isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        found = true;
      }

      // Find in Yesterday
      if (!found) {
        const yesterdayIdx = state.notifications.yesterday.findIndex((n) => n._id === notifId);
        if (yesterdayIdx !== -1) {
          if (!state.notifications.yesterday[yesterdayIdx].isRead) {
            state.notifications.yesterday[yesterdayIdx].isRead = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          found = true;
        }
      }

      // Find in Earlier
      if (!found) {
        const earlierIdx = state.notifications.earlier.findIndex((n) => n._id === notifId);
        if (earlierIdx !== -1) {
          if (!state.notifications.earlier[earlierIdx].isRead) {
            state.notifications.earlier[earlierIdx].isRead = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      }
    },
    markAllNotificationsReadLocal: (state) => {
      state.notifications.today = state.notifications.today.map((n) => ({ ...n, isRead: true }));
      state.notifications.yesterday = state.notifications.yesterday.map((n) => ({ ...n, isRead: true }));
      state.notifications.earlier = state.notifications.earlier.map((n) => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    },
    setNotificationLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setNotificationError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  }
});

export const {
  setNotifications,
  addNotification,
  markNotificationReadLocal,
  markAllNotificationsReadLocal,
  setNotificationLoading,
  setNotificationError
} = notificationSlice.actions;

export default notificationSlice.reducer;
