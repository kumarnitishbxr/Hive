import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Check, 
  Trash2, 
  Bell, 
  Settings, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';

import { RootState } from '../store';
import { notificationService } from '../services/api';
import { 
  setNotifications, 
  markNotificationReadLocal, 
  markAllNotificationsReadLocal 
} from '../store/slices/notificationSlice';
import { setActiveConversationId } from '../store/slices/chatSlice';
import NotificationCard from '../components/layout/Notification/NotificationCard';

interface NotificationsPageProps {
  onNavigateToChat: (conversationId: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigateToChat }) => {
  const dispatch = useDispatch();
  const notifState = useSelector((state: RootState) => state.notification);
  
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  // Reload notifications on load
  const handleReload = async () => {
    try {
      const res = await notificationService.getNotifications();
      dispatch(setNotifications(res.data));
    } catch (err) {
      console.error('Failed to reload notifications:', err);
    }
  };

  useEffect(() => {
    handleReload();
  }, [dispatch]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      dispatch(markAllNotificationsReadLocal());
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.isRead) {
        await notificationService.markRead(notif._id);
        dispatch(markNotificationReadLocal(notif._id));
      }
      
      // If conversationId exists, open chat
      if (notif.conversationId) {
        dispatch(setActiveConversationId(notif.conversationId));
        onNavigateToChat(notif.conversationId);
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  // Filter helper
  const filterList = (list: any[]) => {
    if (filterUnreadOnly) {
      return list.filter(n => !n.isRead);
    }
    return list;
  };

  const todayList = filterList(notifState.notifications.today || []);
  const yesterdayList = filterList(notifState.notifications.yesterday || []);
  const earlierList = filterList(notifState.notifications.earlier || []);

  const totalFilteredCount = todayList.length + yesterdayList.length + earlierList.length;

  return (
    <div className="flex-grow flex flex-col h-full bg-slate-950/30 overflow-hidden p-6 max-w-4xl w-full mx-auto relative z-10">
      
      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg">
            <Bell size={18} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide uppercase">Notification Center</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              {notifState.unreadCount} Unread Alerts Pending
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notifState.unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-bold text-xs transition cursor-pointer"
            >
              <Check size={14} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 py-4 flex-shrink-0">
        <button
          onClick={() => setFilterUnreadOnly(false)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
            !filterUnreadOnly 
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/35' 
              : 'text-gray-500 hover:text-gray-300 border border-transparent'
          }`}
        >
          All Alerts
        </button>
        <button
          onClick={() => setFilterUnreadOnly(true)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
            filterUnreadOnly 
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/35' 
              : 'text-gray-500 hover:text-gray-300 border border-transparent'
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Notifications Group List */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {totalFilteredCount > 0 ? (
          <>
            {/* Today List */}
            {todayList.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] text-gray-500 font-extrabold tracking-wider uppercase px-2">Today</h3>
                <div className="liquid-glass border border-white/5 rounded-xl overflow-hidden divide-y divide-white/4">
                  {todayList.map((notif) => (
                    <div 
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className="cursor-pointer"
                    >
                      <NotificationCard notification={notif} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday List */}
            {yesterdayList.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] text-gray-500 font-extrabold tracking-wider uppercase px-2">Yesterday</h3>
                <div className="liquid-glass border border-white/5 rounded-xl overflow-hidden divide-y divide-white/4">
                  {yesterdayList.map((notif) => (
                    <div 
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className="cursor-pointer"
                    >
                      <NotificationCard notification={notif} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Earlier List */}
            {earlierList.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] text-gray-500 font-extrabold tracking-wider uppercase px-2">Earlier</h3>
                <div className="liquid-glass border border-white/5 rounded-xl overflow-hidden divide-y divide-white/4">
                  {earlierList.map((notif) => (
                    <div 
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className="cursor-pointer"
                    >
                      <NotificationCard notification={notif} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center bg-white/2 border border-white/5 rounded-2xl p-6">
            <AlertCircle size={24} className="text-gray-500 mb-2" />
            <p className="text-xs text-gray-500">
              {filterUnreadOnly 
                ? "You have no unread notifications right now." 
                : "No notifications found in your account history."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
