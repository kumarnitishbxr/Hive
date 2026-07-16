import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { 
  LayoutDashboard, 
  Sparkles, 
  BookOpen, 
  FolderGit2, 
  TrendingUp, 
  Briefcase, 
  FileText, 
  LogOut,
  Layers,
  UserCheck,
  MessageSquare,
  Bell,
  Users,
  ListTodo
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  
  // Read unread counts from Redux store
  const notifUnreadCount = useSelector((state: RootState) => state.notification.unreadCount);
  const conversations = useSelector((state: RootState) => state.chat.conversations);
  const chatUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  
  const isFounder = auth.role === 'Founder' || auth.role === 'Co-Founder';
  
  const navItems = [
    ...(isFounder ? [{ id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard }] : []),
    { id: 'profile', label: 'Strategic Canvas', icon: Layers },
    { id: 'workspace', label: 'Notion Workspace', icon: BookOpen },
    { id: 'projects', label: 'Sprints & Kanban', icon: FolderGit2 },
    ...(isFounder ? [{ id: 'validation', label: 'Idea Validation', icon: TrendingUp }] : []),
    ...(isFounder ? [{ id: 'investors', label: 'Investor CRM', icon: Briefcase }] : []),
    ...(isFounder ? [{ id: 'documents', label: 'Document OCR', icon: FileText }] : []),
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'workforce-tasks', label: 'Workforce Tasks', icon: ListTodo },
    { id: 'chat', label: 'Workspace Chat', icon: MessageSquare, badge: chatUnreadCount },
    { id: 'notifications', label: 'Alerts & Notifications', icon: Bell, badge: notifUnreadCount },
    { id: 'ai', label: 'AI Co-Founder', icon: Sparkles }
  ];

  return (
    <aside className="w-64 border-r border-border bg-(--surface-elevated) flex flex-col justify-between h-full backdrop-blur-xl transition-colors duration-150">
      <div className="flex flex-col">
        {/* Brand header */}
        <div className="p-6 border-b border-border dark:border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-blue-500/15">
              H
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-gray-900 dark:text-white">Hive</h2>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold tracking-wider uppercase">WORKSPACE HUB</span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer text-left relative border-l-2 ${
                  isActive 
                    ? 'bg-[#EFF6FF] dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-500' 
                    : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/2 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold text-white rounded-full bg-blue-600 animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-border dark:border-[rgba(255,255,255,0.06)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-500 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-white uppercase">
              {auth.user?.fullName.charAt(0) || 'U'}
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-gray-800 dark:text-white truncate max-w-30">{auth.user?.fullName}</h4>
              <span className="text-[9px] text-blue-600 dark:text-blue-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <UserCheck size={8} /> {auth.role || 'MEMBER'}
              </span>
            </div>
          </div>
          <button
            onClick={() => dispatch(logout())}
            title="Log Out"
            className="p-1.5 rounded-lg border border-border dark:border-[rgba(255,255,255,0.06)] hover:border-red-300 dark:hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all duration-150 cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
