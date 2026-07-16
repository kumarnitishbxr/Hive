import React, { useState, useEffect, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { updateStartupContext, logout, setCredentials } from './store/slices/authSlice';
import { resetWorkspaceState, setWorkspaces } from './store/slices/workspaceSlice';
import AuthPages from './features/auth/AuthPages';
import OnboardingForm from './features/onboarding/OnboardingForm';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { Mail, Loader2, Sparkles } from 'lucide-react';
import { teamManagementService, workspaceService, authService } from './services/api';
import useSocket from './hooks/useSocket';
import ErrorBoundary from './components/ErrorBoundary';
import { Skeleton } from './components/Skeleton';

// Code Splitting / Lazy Loading Features
const DashboardOverview = React.lazy(() => import('./features/dashboard/DashboardOverview'));
const ProfileCanvas = React.lazy(() => import('./features/profile/ProfileCanvas'));
const WorkspaceEditor = React.lazy(() => import('./features/workspace/WorkspaceEditor'));
const ProjectKanban = React.lazy(() => import('./features/projects/ProjectKanban'));
const ValidationEngine = React.lazy(() => import('./features/validation/ValidationEngine'));
const InvestorCRM = React.lazy(() => import('./features/investors/InvestorCRM'));
const DocumentHub = React.lazy(() => import('./features/documents/DocumentHub'));
const AiCoach = React.lazy(() => import('./features/ai/AiCoach'));
const AICopilotModal = React.lazy(() => import('./features/ai/components/AICopilotModal'));
const ChatPage = React.lazy(() => import('./pages/Chat'));
const NotificationsPage = React.lazy(() => import('./pages/Notifications'));
const ChangePassword = React.lazy(() => import('./pages/ChangePassword'));
const Team = React.lazy(() => import('./pages/Team'));
const MemberProfile = React.lazy(() => import('./pages/MemberProfile'));
const WorkforceTasks = React.lazy(() => import('./pages/WorkforceTasks'));

// Shimmer Loader Fallback for Lazy-Loaded Sections
const LazyFallback: React.FC = () => (
  <div className="space-y-4 p-6 w-full max-w-7xl mx-auto">
    <Skeleton className="h-8 w-1/4" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);

export const App: React.FC = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const [showFloatingAi, setShowFloatingAi] = useState(false);

  const isFounder = auth.role === 'Founder' || auth.role === 'Co-Founder';

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState(isFounder ? 'dashboard' : 'workforce-tasks');

  const [pendingInvitation, setPendingInvitation] = useState<any>(null);
  const [invitationLoading, setInvitationLoading] = useState(false);

  const checkPendingInvitation = async () => {
    if (auth.isAuthenticated && auth.startupId) {
      try {
        const res = await teamManagementService.getMyPendingInvitation();
        setPendingInvitation(res.data.invitation || null);
      } catch (err) {
        console.error('Error checking pending invitation:', err);
      }
    }
  };

  const loadWorkspacesGlobally = async () => {
    if (auth.isAuthenticated && auth.startupId) {
      try {
        const res = await workspaceService.getWorkspaces();
        dispatch(setWorkspaces(res.data.workspaces || []));
      } catch (err) {
        console.error('Error loading workspaces globally:', err);
      }
    }
  };

  useEffect(() => {
    const syncUserProfile = async () => {
      if (auth.isAuthenticated) {
        try {
          const res = await authService.getMe();
          const { user, membership } = res.data.data;
          dispatch(setCredentials({
            token: auth.token || '',
            user: {
              id: user._id,
              email: user.email,
              fullName: user.fullName,
              isVerified: user.isVerified,
              firstLogin: user.firstLogin || false,
              status: user.status,
              invitationAccepted: user.invitationAccepted || false
            },
            startupId: membership ? membership.startupId : null,
            role: membership ? membership.role : null
          }));
        } catch (err: any) {
          console.error('Failed to sync user profile:', err);
          if (err.response?.status === 401) {
            dispatch(logout());
          }
        }
      }
    };
    syncUserProfile();
  }, [auth.isAuthenticated, dispatch]);

  useEffect(() => {
    checkPendingInvitation();
    loadWorkspacesGlobally();
  }, [auth.isAuthenticated, auth.startupId]);

  useEffect(() => {
    if (!auth.startupId) {
      dispatch(resetWorkspaceState());
    }
  }, [auth.startupId, dispatch]);

  const handleAcceptInvitation = async () => {
    setInvitationLoading(true);
    try {
      await teamManagementService.acceptInvite();
      setPendingInvitation(null);
      window.location.reload();
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      alert(err.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!window.confirm('Are you sure you want to decline this invitation? You will lose access to this workspace.')) {
      return;
    }
    setInvitationLoading(true);
    try {
      await teamManagementService.declineInvite();
      setPendingInvitation(null);
      dispatch(logout());
      window.location.reload();
    } catch (err: any) {
      console.error('Failed to decline invitation:', err);
      alert(err.response?.data?.error || 'Failed to decline invitation');
    } finally {
      setInvitationLoading(false);
    }
  };

  // Redirect to correct default landing tab if role changes or if they are on a restricted tab
  useEffect(() => {
    if (auth.isAuthenticated) {
      const isCurrentFounder = auth.role === 'Founder' || auth.role === 'Co-Founder';
      if (!isCurrentFounder && ['dashboard', 'validation', 'investors', 'documents'].includes(activeTab)) {
        setActiveTab('workforce-tasks');
      }
    }
  }, [auth.role, auth.isAuthenticated, activeTab]);

  // Member profile drill-down state
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);

  // Force rerender trigger when authentication completes
  const [, setTick] = useState(0);
  const forceRerender = () => setTick(t => t + 1);

  // Initialize Socket.io real-time engine globally when authenticated
  useSocket();

  const handleOnboardingComplete = (startupId: string) => {
    dispatch(updateStartupContext({ startupId, role: 'Founder' }));
    setActiveTab('dashboard');
    forceRerender();
  };

  // 1. Not Authenticated -> Show Auth Panel (Login / Signup / OTP)
  if (!auth.isAuthenticated) {
    return <AuthPages onVerificationSuccess={forceRerender} />;
  }

  // 2. First Login -> Force password change (for invited members)
  if (auth.user?.firstLogin) {
    return <ChangePassword onPasswordChanged={() => {
      forceRerender();
      window.location.reload();
    }} />;
  }

  // 3. Authenticated but has not completed startup configuration -> Show Onboarding Form
  if (!auth.startupId) {
    return <OnboardingForm onOnboardingComplete={handleOnboardingComplete} />;
  }

  // Handle member profile navigation
  const handleViewMember = (memberId: string) => {
    setViewingMemberId(memberId);
    setActiveTab('member-profile');
  };

  const handleBackFromProfile = () => {
    setViewingMemberId(null);
    setActiveTab('team');
  };

  // 4. Fully Configured -> Render Liquid Glass Dashboard Workspaces
  return (
    <div className="flex h-screen bg-background relative overflow-hidden text-foreground font-sans transition-colors duration-200">
      {/* Visual Organic Mesh Gradients Floating in Background */}
      <div className="mesh-glow mesh-indigo" />
      <div className="mesh-glow mesh-purple" />
      <div className="mesh-glow mesh-emerald" />

      {/* Workspace Sidebar Drawer */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-secondary/65 transition-colors duration-150">
        {/* Workspace Search Header */}
        <Header onSearchSelect={setActiveTab} />

        {/* Pending Invitation Banner */}
        {pendingInvitation && (
          <div className="mx-6 mt-4 p-4 rounded-xl liquid-glass border border-amber-500/30 bg-amber-500/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Pending Workspace Invitation</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  You have been invited to join this startup workspace as a <span className="text-amber-300 font-semibold">{pendingInvitation.role}</span>. Please accept to activate your status.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDeclineInvitation}
                disabled={invitationLoading}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-background/50 hover:bg-muted border border-border rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptInvitation}
                disabled={invitationLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {invitationLoading && <Loader2 size={12} className="animate-spin" />}
                Accept Invitation
              </button>
            </div>
          </div>
        )}

        {/* Workspace Dynamic Main Viewer */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <ErrorBoundary>
            <Suspense fallback={<LazyFallback />}>
              {activeTab === 'dashboard' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><DashboardOverview /></div>}
              {activeTab === 'profile' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><ProfileCanvas /></div>}
              {activeTab === 'workspace' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><WorkspaceEditor /></div>}
              {activeTab === 'projects' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><ProjectKanban /></div>}
              {activeTab === 'validation' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><ValidationEngine /></div>}
              {activeTab === 'investors' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><InvestorCRM /></div>}
              {activeTab === 'documents' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><DocumentHub /></div>}
              {activeTab === 'team' && <Team onViewMember={handleViewMember} />}
              {activeTab === 'member-profile' && viewingMemberId && <MemberProfile memberId={viewingMemberId} onBack={handleBackFromProfile} />}
              {activeTab === 'workforce-tasks' && <WorkforceTasks />}
              {activeTab === 'ai' && <div className="flex-1 flex flex-col overflow-hidden p-6 max-w-7xl w-full mx-auto h-full min-h-0"><AiCoach /></div>}
              {activeTab === 'chat' && <div className="flex-1 flex flex-col overflow-hidden h-full min-h-0"><ChatPage /></div>}
              {activeTab === 'notifications' && <div className="flex-1 overflow-y-auto h-full min-h-0"><NotificationsPage onNavigateToChat={() => setActiveTab('chat')} /></div>}
            </Suspense>
          </ErrorBoundary>
        </main>
        {/* Floating AI Agent FAB and Panel */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none">
          <Suspense fallback={null}>
            <AICopilotModal isOpen={showFloatingAi} onClose={() => setShowFloatingAi(false)} />
          </Suspense>
          <button
            onClick={() => setShowFloatingAi(prev => !prev)}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 transition-transform duration-300 hover:scale-105 cursor-pointer bg-linear-to-tr from-indigo-500 via-purple-500 to-emerald-500 relative`}
            title="Ask AI Co-Founder"
          >
            <Sparkles size={20} className={showFloatingAi ? 'rotate-12' : 'animate-pulse'} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
