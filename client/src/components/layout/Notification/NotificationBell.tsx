import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell } from 'lucide-react';
import { RootState } from '../../../store';
import { notificationService } from '../../../services/api';
import { setNotifications } from '../../../store/slices/notificationSlice';
import NotificationDropdown from './NotificationDropdown';

interface NotificationBellProps {
  onNavigateToNotifications: () => void;
  onNavigateToChat: (conversationId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNavigateToNotifications,
  onNavigateToChat
}) => {
  const dispatch = useDispatch();
  const unreadCount = useSelector((state: RootState) => state.notification.unreadCount);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Load initial notifications on mount
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await notificationService.getNotifications();
        dispatch(setNotifications(res.data));
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifs();
  }, [dispatch]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={bellRef}>
      <button 
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative p-1.5 rounded-lg border transition cursor-pointer ${
          isOpen 
            ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' 
            : 'border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/10'
        }`}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-red-500 text-white font-extrabold text-[9px] px-1 flex items-center justify-center border border-slate-950 animate-pulse shadow-md shadow-red-500/20">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropping Panel */}
      {isOpen && (
        <NotificationDropdown 
          onClose={() => setIsOpen(false)}
          onNavigateToNotifications={onNavigateToNotifications}
          onNavigateToChat={onNavigateToChat}
        />
      )}
    </div>
  );
};

export default NotificationBell;
