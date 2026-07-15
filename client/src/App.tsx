import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { updateStartupContext } from './store/slices/authSlice';
import AuthPages from './features/auth/AuthPages';
import OnboardingForm from './features/onboarding/OnboardingForm';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Feature Modules
import DashboardOverview from './features/dashboard/DashboardOverview';
import ProfileCanvas from './features/profile/ProfileCanvas';
import WorkspaceEditor from './features/workspace/WorkspaceEditor';
import ProjectKanban from './features/projects/ProjectKanban';
import ValidationEngine from './features/validation/ValidationEngine';
import InvestorCRM from './features/investors/InvestorCRM';
import DocumentHub from './features/documents/DocumentHub';
import AiCoach from './features/ai/AiCoach';

export const App: React.FC = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Force rerender trigger when authentication completes
  const [, setTick] = useState(0);
  const forceRerender = () => setTick(t => t + 1);

  const handleOnboardingComplete = (startupId: string) => {
    dispatch(updateStartupContext({ startupId, role: 'Founder' }));
    setActiveTab('dashboard');
    forceRerender();
  };

  // 1. Not Authenticated -> Show Auth Panel (Login / Signup / OTP)
  if (!auth.isAuthenticated) {
    return <AuthPages onVerificationSuccess={forceRerender} />;
  }

  // 2. Authenticated but has not completed startup configuration -> Show Onboarding Form
  if (!auth.startupId) {
    return <OnboardingForm onOnboardingComplete={handleOnboardingComplete} />;
  }

  // 3. Fully Configured -> Render Liquid Glass Dashboard Workspaces
  return (
    <div className="flex h-screen bg-slate-950 relative overflow-hidden text-gray-100">
      {/* Visual Organic Mesh Gradients Floating in Background */}
      <div className="mesh-glow mesh-indigo" />
      <div className="mesh-glow mesh-purple" />
      <div className="mesh-glow mesh-emerald" />

      {/* Workspace Sidebar Drawer */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Workspace Search Header */}
        <Header onSearchSelect={setActiveTab} />

        {/* Workspace Dynamic Main Viewer */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          {activeTab === 'dashboard' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><DashboardOverview /></div>}
          {activeTab === 'profile' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><ProfileCanvas /></div>}
          {activeTab === 'workspace' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><WorkspaceEditor /></div>}
          {activeTab === 'projects' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><ProjectKanban /></div>}
          {activeTab === 'validation' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><ValidationEngine /></div>}
          {activeTab === 'investors' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><InvestorCRM /></div>}
          {activeTab === 'documents' && <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"><DocumentHub /></div>}
          {activeTab === 'ai' && <div className="flex-1 flex flex-col overflow-hidden p-6 max-w-7xl w-full mx-auto h-full min-h-0"><AiCoach /></div>}
        </main>
      </div>
    </div>
  );
};

export default App;
