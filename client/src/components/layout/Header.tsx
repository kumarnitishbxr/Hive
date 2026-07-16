import React, { useState, useEffect } from 'react';
import { Search, Terminal } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import NotificationBell from './Notification/NotificationBell';
import ThemeToggle from '../ThemeToggle';

interface HeaderProps {
  onSearchSelect: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchSelect }) => {
  const auth = useSelector((state: RootState) => state.auth);
  const [showPalette, setShowPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { name: 'Go to Chat Room', action: () => { onSearchSelect('chat'); setShowPalette(false); } },
    { name: 'Open Notification Center', action: () => { onSearchSelect('notifications'); setShowPalette(false); } },
    { name: 'Go to Tasks board', action: () => { onSearchSelect('projects'); setShowPalette(false); } },
    { name: 'Go to Business Model Canvas', action: () => { onSearchSelect('profile'); setShowPalette(false); } },
    { name: 'Open Document OCR Locker', action: () => { onSearchSelect('documents'); setShowPalette(false); } },
    { name: 'Ask AI Co-Founder Coach', action: () => { onSearchSelect('ai'); setShowPalette(false); } },
    { name: 'Open Runway Scenario Simulator', action: () => { onSearchSelect('dashboard'); setShowPalette(false); } }
  ];

  const filteredCommands = commands.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="h-[72px] border-b border-border bg-[color:var(--surface-elevated)] backdrop-blur-xl flex items-center justify-between px-6 z-40 flex-shrink-0 transition-all duration-150">
      {/* Command Palette Trigger */}
      <button 
        onClick={() => setShowPalette(true)}
        className="flex items-center gap-3 bg-[color:var(--surface-strong)] border border-border hover:border-primary/25 hover:bg-card px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground transition duration-150 cursor-pointer w-72 focus:outline-none"
      >
        <Search size={14} className="text-muted-foreground" />
        <span className="flex-1 text-left">Search or run command...</span>
        <kbd className="bg-background/70 px-1.5 py-0.5 rounded border border-border text-[9px] text-muted-foreground font-mono">⌘K</kbd>
      </button>
 
      {/* Notifications indicator */}
      <div className="flex items-center gap-4">
        <NotificationBell 
          onNavigateToNotifications={() => onSearchSelect('notifications')}
          onNavigateToChat={(conversationId) => {
            onSearchSelect('chat');
          }}
        />
        
        {/* Central Theme Toggle Switcher */}
        <ThemeToggle />
        
        <div className="h-5 w-[1px] bg-border dark:bg-[rgba(255,255,255,0.08)]" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">WORKSPACE ACTIVE</span>
        </div>
      </div>


      {/* Command Palette Modal */}
      {showPalette && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]">
          <div className="fixed inset-0" onClick={() => setShowPalette(false)} />
          <div className="theme-panel w-full max-w-lg rounded-xl overflow-hidden relative z-10">
            <div className="flex items-center gap-3 p-3 border-b border-border bg-[color:var(--surface-elevated)]">
              <Terminal size={16} className="text-indigo-400" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or shortcut..."
                className="w-full bg-transparent outline-none border-none text-foreground text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                onClick={() => setShowPalette(false)}
                className="text-xs bg-background/60 hover:bg-muted border border-border px-2 py-0.5 rounded text-muted-foreground"
              >
                ESC
              </button>
            </div>
            <div className="p-2 max-h-60 overflow-y-auto space-y-0.5">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={cmd.action}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-blue-600 hover:text-white transition cursor-pointer flex items-center justify-between"
                  >
                    <span>{cmd.name}</span>
                    <span className="text-[10px] text-muted-foreground font-normal uppercase">Action</span>
                  </button>
                ))
              ) : (
                <p className="p-3 text-center text-xs text-muted-foreground">No matching shortcuts found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
export default Header;
