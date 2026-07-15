import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Check, ArrowRight, Eye } from 'lucide-react';
import { RootState } from '../../../store';
import { notificationService } from '../../../services/api';
import { 
  markAllNotificationsReadLocal, 
  markNotificationReadLocal 
} from '../../../store/slices/notificationSlice';
import NotificationCard from './NotificationCard';

interface NotificationDropdownProps {
  onClose: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToChat: (conversationId: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose,
  onNavigateToNotifications,
  onNavigateToChat
}) => {
  const dispatch = useDispatch();
  const notifState = useSelector((state: RootState) => state.notification);
  
  // Combine all categories to find the 5 latest notifications
  const allNotifications = [
    ...notifState.notifications.today,
    ...notifState.notifications.yesterday,
    ...notifState.notifications.earlier
  ].slice(0, 5);

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
      
      onClose();
      
      // If it's linked to a chat conversation, redirect
      if (notif.conversationId) {
        onNavigateToChat(notif.conversationId);
      } else {
        onNavigateToNotifications();
      }
    } catch (err) {
      console.error('Failed to handle notification click:', err);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-slate-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-slide-up">
      {/* Dropdown Header */}
      <div className="p-3 bg-white/2 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs font-extrabold text-white uppercase tracking-wider">Recent Alerts</span>
        {notifState.unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Check size={12} /> Mark All Read
          </button>
        )}
      </div>

      {/* Notifications Cards Container */}
      <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
        {allNotifications.length > 0 ? (
          allNotifications.map((notif) => (
            <div 
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className="cursor-pointer hover:bg-white/2 transition"
            >
              <NotificationCard notification={notif} />
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-gray-500 italic">
            You have no recent notifications.
          </div>
        )}
      </div>

      {/* Dropdown Footer */}
      <div className="p-2 border-t border-white/5 bg-slate-950/80 flex justify-center">
        <button
          onClick={() => { onClose(); onNavigateToNotifications(); }}
          className="text-[10px] font-extrabold text-gray-400 hover:text-white flex items-center gap-1.5 transition uppercase tracking-wider py-1 cursor-pointer"
        >
          See All Alerts <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
