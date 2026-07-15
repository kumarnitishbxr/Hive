import React from 'react';
import { NotificationType } from '../../../store/slices/notificationSlice';
import { 
  MessageSquare, 
  Flag, 
  CheckSquare, 
  HelpCircle, 
  Star, 
  Zap, 
  TrendingUp, 
  UserPlus, 
  Bell 
} from 'lucide-react';

interface NotificationCardProps {
  notification: NotificationType;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification }) => {
  const sender = notification.senderId;
  const senderName = sender?.fullName || 'System Ops';
  const senderAvatar = sender?.avatarUrl;

  // Format relative timestamp
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Resolve type icon and color mapping
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'New Message':
      case 'Mention':
        return { icon: MessageSquare, color: 'text-indigo-400 bg-indigo-500/10' };
      case 'Task Assigned':
      case 'Task Updated':
        return { icon: CheckSquare, color: 'text-emerald-400 bg-emerald-500/10' };
      case 'Milestone Completed':
        return { icon: Flag, color: 'text-blue-400 bg-blue-500/10' };
      case 'Feedback Received':
      case 'Investor Comment':
        return { icon: Star, color: 'text-amber-400 bg-amber-500/10' };
      case 'Idea Approved':
        return { icon: TrendingUp, color: 'text-purple-400 bg-purple-500/10' };
      case 'Announcement':
        return { icon: Zap, color: 'text-pink-400 bg-pink-500/10' };
      default:
        return { icon: Bell, color: 'text-gray-400 bg-gray-500/10' };
    }
  };

  const config = getTypeConfig(notification.type);
  const IconComponent = config.icon;

  return (
    <div 
      className={`p-3 flex items-start gap-3 transition-all relative ${
        notification.isRead 
          ? 'bg-transparent text-gray-400' 
          : 'bg-white/3 text-gray-200 border-l-2 border-indigo-500'
      }`}
    >
      {/* Sender profile / Icon type */}
      <div className="relative flex-shrink-0">
        {senderAvatar ? (
          <img 
            src={senderAvatar} 
            alt={senderName} 
            className="w-8 h-8 rounded-full object-cover border border-white/10"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-indigo-400 uppercase">
            {senderName.charAt(0)}
          </div>
        )}
        <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border border-slate-950 ${config.color}`}>
          <IconComponent size={8} />
        </div>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-gray-200 truncate">{notification.title}</p>
          <span className="text-[9px] text-gray-500 font-semibold flex-shrink-0">{formatTime(notification.createdAt)}</span>
        </div>
        <p className="text-[10px] text-gray-400 leading-snug truncate-2-lines">
          {notification.description}
        </p>
      </div>

      {/* Unread indicator dot */}
      {!notification.isRead && (
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0 animate-pulse" />
      )}
    </div>
  );
};

export default NotificationCard;
