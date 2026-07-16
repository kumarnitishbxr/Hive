import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  useMyTasks, 
  useTransitionTaskStatus, 
  useApproveTask, 
  useRejectTask 
} from '../hooks/useReactQueries';
import {
  ListTodo, CheckCircle2, Clock, AlertTriangle, Loader2,
  Calendar, Zap, CircleDot, AlertCircle, CheckCheck,
  XCircle, HelpCircle, Pause, Eye
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import TaskDetail from './TaskDetail';

const WorkforceTasks: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);

  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Queries & Mutations
  const { data, isLoading, isError, refetch } = useMyTasks();
  const myTasks = data?.tasks || [];
  const activities = data?.activities || [];

  const transitionStatusMutation = useTransitionTaskStatus();
  const approveTaskMutation = useApproveTask();
  const rejectTaskMutation = useRejectTask();

  const isMutationLoading = 
    transitionStatusMutation.isPending || 
    approveTaskMutation.isPending || 
    rejectTaskMutation.isPending;

  const showToastMsg = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Update status transition
  const handleStatusUpdate = async (taskId: string, status: string) => {
    try {
      await transitionStatusMutation.mutateAsync({ id: taskId, status });
      showToastMsg(`Status updated to ${status}`, 'success');
      refetch();
    } catch (err: any) {
      showToastMsg(err?.response?.data?.error || 'Failed to update status', 'error');
    }
  };

  // Status config
  const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    'Backlog': { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: <CircleDot size={12} /> },
    'Todo': { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: <CircleDot size={12} /> },
    'To Do': { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: <CircleDot size={12} /> },
    'In Progress': { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: <Zap size={12} /> },
    'In Review': { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: <Eye size={12} /> },
    'Under Review': { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: <Eye size={12} /> },
    'Done': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <CheckCircle2 size={12} /> },
    'Completed': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <CheckCheck size={12} /> },
    'Approved': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <CheckCheck size={12} /> },
    'Rejected': { color: 'text-red-400', bg: 'bg-red-500/10', icon: <XCircle size={12} /> },
    'Blocked': { color: 'text-red-400', bg: 'bg-red-500/10', icon: <Pause size={12} /> }
  };

  const priorityConfig: Record<string, { color: string; bg: string }> = {
    'Low': { color: 'text-gray-400', bg: 'bg-gray-500/10' },
    'Medium': { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    'High': { color: 'text-amber-400', bg: 'bg-amber-500/10' },
    'Urgent': { color: 'text-red-400', bg: 'bg-red-500/10' }
  };

  // Memoize Filtered Deadlines
  const todayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return myTasks.filter((t: any) => t.dueDate && t.dueDate.split('T')[0] === todayStr);
  }, [myTasks]);

  const upcomingTasks = useMemo(() => {
    return [...myTasks]
      .filter((t: any) => !['Completed', 'Done', 'Approved'].includes(t.status))
      .sort((a: any, b: any) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
  }, [myTasks]);

  // Stats
  const assignedCount = myTasks.length;
  const completedCount = myTasks.filter((t: any) => ['Completed', 'Approved', 'Done'].includes(t.status)).length;
  const pendingCount = myTasks.filter((t: any) => !['Completed', 'Approved', 'Done'].includes(t.status)).length;
  const overdueCount = myTasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && !['Completed', 'Approved', 'Done'].includes(t.status)).length;

  if (viewingTaskId) {
    return <TaskDetail taskId={viewingTaskId} onBack={() => setViewingTaskId(null)} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <ErrorState onRetry={refetch} message="Failed to retrieve task board data." />
      </div>
    );
  }

  const columns = ['Backlog', 'To Do', 'In Progress', 'Blocked', 'Under Review', 'Completed', 'Approved', 'Rejected'];

  return (
    <div className="grow flex flex-col h-full bg-slate-950/30 overflow-hidden p-6 max-w-7xl w-full mx-auto relative z-10 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ListTodo className="text-indigo-400" /> My Workspace Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">Track and manage assignments allocated to your target milestone checklist.</p>
        </div>
        {isMutationLoading && <Loader2 size={16} className="text-indigo-400 animate-spin" />}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0 select-none">
        {[
          { label: 'Assigned Tasks', value: assignedCount, icon: ListTodo, color: 'indigo' },
          { label: 'Pending Iterations', value: pendingCount, icon: Clock, color: 'blue' },
          { label: 'Completed Tasks', value: completedCount, icon: CheckCircle2, color: 'emerald' },
          { label: 'Overdue Deadline', value: overdueCount, icon: AlertTriangle, color: overdueCount > 0 ? 'red' : 'gray' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="liquid-glass p-4 rounded-xl border border-white/5 bg-slate-950/40">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</span>
                <Icon size={14} className={`text-${stat.color}-400`} />
              </div>
              <p className="text-2xl font-black text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main double column split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Column: Assigned Tasks List */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned Task Cards</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {myTasks.length > 0 ? (
              myTasks.map((task: any) => {
                const statusInfo = statusConfig[task.status] || { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: <CircleDot size={12} /> };
                const priorityInfo = priorityConfig[task.priority] || { color: 'text-gray-400', bg: 'bg-gray-500/10' };

                return (
                  <div 
                    key={task._id}
                    onClick={() => setViewingTaskId(task._id)}
                    className="liquid-glass p-4 rounded-xl flex items-center justify-between gap-4 border border-white/5 bg-slate-950/45 hover:border-white/10 transition cursor-pointer"
                  >
                    <div className="truncate flex-1 space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${priorityInfo.bg} ${priorityInfo.color}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${statusInfo.bg} ${statusInfo.color}`}>
                          {task.status.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate">{task.title}</h4>
                      <p className="text-[10px] text-gray-500 font-mono">#{task._id.substring(18)}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-gray-500 hidden sm:inline">Change Status:</span>
                      <select
                        className="bg-slate-900 border border-white/10 text-[10px] rounded px-1.5 py-1 text-gray-300 cursor-pointer outline-none font-bold"
                        value={task.status}
                        onChange={(e) => handleStatusUpdate(task._id, e.target.value)}
                      >
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-white/2 border border-white/5 rounded-2xl p-6">
                <AlertCircle size={20} className="text-gray-500 mb-2" />
                <p className="text-xs text-gray-500">You are not assigned to any tasks in this workspace.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines & Activity Feed */}
        <div className="space-y-6 flex flex-col min-h-0 overflow-y-auto">
          {/* Today's Tasks */}
          <div className="liquid-glass p-4 rounded-xl border border-white/5 bg-slate-950/40 text-xs">
            <h3 className="font-extrabold text-white border-b border-white/5 pb-2 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar size={13} className="text-indigo-400 animate-pulse" /> Today's Deliverables
            </h3>
            <div className="mt-3 space-y-2">
              {todayTasks.length > 0 ? (
                todayTasks.map((t: any) => (
                  <div key={t._id} onClick={() => setViewingTaskId(t._id)} className="p-2 rounded bg-white/2 hover:bg-white/5 transition cursor-pointer border border-white/5 truncate font-semibold text-gray-300">
                    {t.title}
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-gray-500 py-3 text-center">No tasks scheduled for deadline today.</p>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="liquid-glass p-4 rounded-xl border border-white/5 bg-slate-950/40 text-xs flex-1 flex flex-col min-h-0">
            <h3 className="font-extrabold text-white border-b border-white/5 pb-2 uppercase tracking-wide flex items-center gap-1.5">
              <Clock size={13} className="text-indigo-400" /> Upcoming Deadlines
            </h3>
            <div className="mt-3 space-y-2 overflow-y-auto flex-1 pr-1">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.slice(0, 5).map((t: any) => (
                  <div key={t._id} onClick={() => setViewingTaskId(t._id)} className="p-2 rounded bg-white/2 hover:bg-white/5 transition cursor-pointer border border-white/5 flex justify-between items-center gap-2">
                    <span className="font-semibold text-gray-300 truncate">{t.title}</span>
                    <span className="text-[9px] text-indigo-400 font-bold shrink-0">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'}</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-gray-500 py-3 text-center">No upcoming deadlines.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Toast Alert popup overlay */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl border text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' 
            : 'bg-red-950/80 border-red-500/50 text-red-200'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default WorkforceTasks;
