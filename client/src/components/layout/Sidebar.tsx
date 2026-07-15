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
  Bell
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
  
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Strategic Canvas', icon: Layers },
    { id: 'workspace', label: 'Notion Workspace', icon: BookOpen },
    { id: 'projects', label: 'Sprints & Kanban', icon: FolderGit2 },
    { id: 'validation', label: 'Idea Validation', icon: TrendingUp },
    { id: 'investors', label: 'Investor CRM', icon: Briefcase },
    { id: 'documents', label: 'Document OCR', icon: FileText },
    { id: 'chat', label: 'Workspace Chat', icon: MessageSquare, badge: chatUnreadCount },
    { id: 'notifications', label: 'Alerts & Notifications', icon: Bell, badge: notifUnreadCount },
    { id: 'ai', label: 'AI Co-Founder', icon: Sparkles }
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between h-full">
      <div className="flex flex-col">
        {/* Brand header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-indigo-500/20">
              S
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-white">StartupOps</h2>
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">WORKSPACE HUB</span>
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer text-left ${
                  isActive 
                    ? 'bg-white/5 border border-white/10 text-indigo-400 shadow-md shadow-indigo-500/5' 
                    : 'text-gray-400 border border-transparent hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? 'text-indigo-400' : 'text-gray-400'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold text-white rounded-full bg-indigo-600 animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-900 border border-indigo-500 flex items-center justify-center text-xs font-bold text-white uppercase">
              {auth.user?.fullName.charAt(0) || 'U'}
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white truncate max-w-[120px]">{auth.user?.fullName}</h4>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <UserCheck size={8} /> {auth.role || 'MEMBER'}
              </span>
            </div>
          </div>
          <button
            onClick={() => dispatch(logout())}
            title="Log Out"
            className="p-1.5 rounded-lg border border-white/5 hover:border-red-500/30 hover:bg-red-950/20 text-gray-500 hover:text-red-400 transition cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
