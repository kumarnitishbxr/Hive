import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setMyTasksAndActivities, updateTaskLocal, setTaskLoading } from '../store/slices/taskSlice';
import { workforceTaskService } from '../services/api';
import {
  ListTodo, CheckCircle2, Clock, AlertTriangle, BarChart3, Loader2,
  ChevronDown, X, Send, Paperclip, MessageSquare, Eye, ArrowRight,
  FileText, Calendar, Flag, Zap, CircleDot, AlertCircle, CheckCheck,
  XCircle, HelpCircle, Pause, ThumbsUp, ThumbsDown, RotateCcw
} from 'lucide-react';

const WorkforceTasks: React.FC = () => {
  const dispatch = useDispatch();
  const { myTasks, activities, isLoading } = useSelector((state: RootState) => state.task);
  const auth = useSelector((state: RootState) => state.auth);

  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadMyTasks();
  }, []);

  const loadMyTasks = async () => {
    dispatch(setTaskLoading(true));
    try {
      const res = await workforceTaskService.getMyTasks();
      dispatch(setMyTasksAndActivities({
        tasks: res.data.tasks || [],
        activities: res.data.activities || []
      }));
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      dispatch(setTaskLoading(false));
    }
  };

  const showToastMsg = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Update status
  const handleStatusUpdate = async (taskId: string, status: string) => {
    setStatusUpdateLoading(true);
    try {
      const res = await workforceTaskService.updateStatus({ taskId, status, comment: statusComment });
      dispatch(updateTaskLocal(res.data.task));
      showToastMsg(`Status updated to ${status}`, 'success');
      setShowStatusModal(null);
      setStatusComment('');
    } catch (err: any) {
      showToastMsg(err?.response?.data?.error || 'Failed to update status', 'error');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Complete task
  const handleCompleteTask = async (taskId: string) => {
    setStatusUpdateLoading(true);
    try {
      const res = await workforceTaskService.completeTask({ taskId, comment: statusComment });
      dispatch(updateTaskLocal(res.data.task));
      showToastMsg('Task submitted for review!', 'success');
      setShowStatusModal(null);
      setStatusComment('');
    } catch (err: any) {
      showToastMsg(err?.response?.data?.error || 'Failed to submit task', 'error');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Approve task (Founder)
  const handleApproveTask = async (taskId: string) => {
    setStatusUpdateLoading(true);
    try {
      const res = await workforceTaskService.approveTask({ taskId, feedback: reviewFeedback });
      dispatch(updateTaskLocal(res.data.task));
      showToastMsg('Task approved!', 'success');
      setShowReviewModal(null);
      setReviewFeedback('');
    } catch (err: any) {
      showToastMsg(err?.response?.data?.error || 'Failed to approve', 'error');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Reject task (Founder)
  const handleRejectTask = async (taskId: string) => {
    if (!reviewFeedback) {
      showToastMsg('Please provide feedback before rejecting', 'error');
      return;
    }
    setStatusUpdateLoading(true);
    try {
      const res = await workforceTaskService.rejectTask({ taskId, feedback: reviewFeedback });
      dispatch(updateTaskLocal(res.data.task));
      showToastMsg('Changes requested', 'success');
      setShowReviewModal(null);
      setReviewFeedback('');
    } catch (err: any) {
      showToastMsg(err?.response?.data?.error || 'Failed to reject', 'error');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Status config
  const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    'Backlog': { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: <CircleDot size={12} /> },
    'Todo': { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: <CircleDot size={12} /> },
    'Not Started': { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: <CircleDot size={12} /> },
    'In Progress': { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: <Zap size={12} /> },
    'In Review': { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: <Eye size={12} /> },
    'Under Review': { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: <Eye size={12} /> },
    'Done': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <CheckCircle2 size={12} /> },
    'Completed': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <CheckCheck size={12} /> },
    'Rejected': { color: 'text-red-400', bg: 'bg-red-500/10', icon: <XCircle size={12} /> },
    'Blocked': { color: 'text-red-400', bg: 'bg-red-500/10', icon: <Pause size={12} /> },
    'Need Help': { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: <HelpCircle size={12} /> },
  };

  const priorityConfig: Record<string, { color: string; bg: string }> = {
    'Low': { color: 'text-gray-400', bg: 'bg-gray-500/10' },
    'Medium': { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    'High': { color: 'text-amber-400', bg: 'bg-amber-500/10' },
    'Urgent': { color: 'text-red-400', bg: 'bg-red-500/10' }
  };

  // Stats
  const assignedCount = myTasks.length;
  const completedCount = myTasks.filter(t => t.status === 'Completed' || t.status === 'Done').length;
  const pendingCount = myTasks.filter(t => !['Completed', 'Done'].includes(t.status)).length;
  const overdueCount = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !['Completed', 'Done'].includes(t.status)).length;

  const isFounder = auth.role === 'Founder' || auth.role === 'Co-Founder';

  // Selected task data
  const taskDetail = selectedTask ? myTasks.find(t => t._id === selectedTask) : null;
  const taskActivities = selectedTask ? (activities[selectedTask] || []) : [];

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">
            {isFounder ? 'Workforce Tasks' : 'My Tasks'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isFounder ? 'Review and manage team task assignments' : 'Track and update your assigned work'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Assigned', value: assignedCount, icon: ListTodo, color: 'indigo' },
          { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'emerald' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'amber' },
          { label: 'Overdue', value: overdueCount, icon: AlertTriangle, color: 'red' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-slate-900/50 border border-white/5 rounded-xl p-5 hover:border-white/10 transition">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                  <Icon size={18} className={`text-${stat.color}-400`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tasks Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 size={24} className="text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading tasks...</p>
          </div>
        ) : myTasks.length === 0 ? (
          <div className="p-12 text-center">
            <ListTodo size={32} className="text-gray-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-400">No tasks assigned</h3>
            <p className="text-xs text-gray-500 mt-1">Tasks will appear here once they are assigned to you.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Task</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">Project</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Priority</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Deadline</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Assigned By</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {myTasks.map(task => {
                  const sc = statusConfig[task.status] || statusConfig['Todo'];
                  const pc = priorityConfig[task.priority] || priorityConfig['Medium'];
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !['Completed', 'Done'].includes(task.status);

                  return (
                    <tr key={task._id} className="hover:bg-white/[0.02] transition group">
                      <td className="px-5 py-3.5">
                        <button onClick={() => setSelectedTask(task._id)} className="text-left group-hover:text-indigo-300 transition">
                          <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">{task.title}</p>
                          {task.description && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 hidden md:table-cell">
                        {task.projectId?.name || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${pc.color} ${pc.bg}`}>
                          <Flag size={9} /> {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {task.dueDate ? (
                          <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                            <Calendar size={11} />
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {isOverdue && <AlertCircle size={11} className="text-red-400" />}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">No deadline</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${sc.color} ${sc.bg}`}>
                          {sc.icon} {task.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          {task.assignedBy?.avatarUrl ? (
                            <img src={task.assignedBy.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-gray-400">
                              {task.assignedBy?.fullName?.charAt(0) || '?'}
                            </div>
                          )}
                          <span className="text-xs text-gray-400">{task.assignedBy?.fullName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedTask(task._id)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-indigo-400 transition" title="View Details">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => setShowStatusModal(task._id)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-blue-400 transition" title="Update Status">
                            <BarChart3 size={14} />
                          </button>
                          {isFounder && (task.status === 'Under Review' || task.status === 'In Review') && (
                            <button onClick={() => setShowReviewModal(task._id)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-emerald-400 transition" title="Review Task">
                              <ThumbsUp size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Status Update Modal ─────────────────── */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowStatusModal(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Update Task Status</h3>
              <button onClick={() => setShowStatusModal(null)} className="p-1.5 hover:bg-white/5 rounded-lg transition text-gray-500"><X size={14} /></button>
            </div>

            <div className="space-y-2 mb-5">
              {['Not Started', 'In Progress', 'Under Review', 'Completed', 'Blocked', 'Need Help'].map(status => {
                const sc = statusConfig[status] || statusConfig['Todo'];
                return (
                  <button key={status}
                    onClick={() => {
                      if (status === 'Completed') {
                        handleCompleteTask(showStatusModal);
                      } else {
                        handleStatusUpdate(showStatusModal, status);
                      }
                    }}
                    disabled={statusUpdateLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition text-left disabled:opacity-40">
                    <span className={`${sc.color}`}>{sc.icon}</span>
                    <span className="text-sm text-gray-300 font-medium">{status}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Comment (optional)</label>
              <textarea value={statusComment} onChange={e => setStatusComment(e.target.value)} rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30 resize-none"
                placeholder="Add a comment about this update..." />
            </div>
          </div>
        </div>
      )}

      {/* ─── Founder Review Modal ────────────────── */}
      {showReviewModal && (() => {
        const task = myTasks.find(t => t._id === showReviewModal);
        if (!task) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowReviewModal(null)}>
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">Review: {task.title}</h3>
                <p className="text-[10px] text-gray-500 mt-1">Task submitted for review. Approve or request changes.</p>
              </div>
              <div className="p-6 space-y-4">
                {task.description && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                    <p className="text-sm text-gray-300 bg-slate-800/40 rounded-xl p-3">{task.description}</p>
                  </div>
                )}

                {task.attachments && task.attachments.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Attachments</label>
                    <div className="space-y-1">
                      {task.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 rounded-lg px-3 py-2">
                          <Paperclip size={12} />
                          <span>{att.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Review Feedback</label>
                  <textarea value={reviewFeedback} onChange={e => setReviewFeedback(e.target.value)} rows={3}
                    className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30 resize-none"
                    placeholder="Provide feedback for the team member..." />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleApproveTask(showReviewModal)} disabled={statusUpdateLoading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-40 shadow-lg shadow-emerald-500/20">
                    {statusUpdateLoading ? <Loader2 size={14} className="animate-spin" /> : <><ThumbsUp size={14} /> Approve</>}
                  </button>
                  <button onClick={() => handleRejectTask(showReviewModal)} disabled={statusUpdateLoading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-40 shadow-lg shadow-red-500/20">
                    {statusUpdateLoading ? <Loader2 size={14} className="animate-spin" /> : <><RotateCcw size={14} /> Request Changes</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Task Detail Drawer ──────────────────── */}
      {selectedTask && taskDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div className="w-full max-w-xl bg-slate-900 border-l border-white/10 h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/5 p-5 flex items-center justify-between z-10">
              <h3 className="text-sm font-bold text-white truncate pr-4">{taskDetail.title}</h3>
              <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/5 rounded-lg transition text-gray-500 hover:text-gray-300">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Status & Priority */}
              <div className="flex items-center gap-3">
                {(() => {
                  const sc = statusConfig[taskDetail.status] || statusConfig['Todo'];
                  const pc = priorityConfig[taskDetail.priority] || priorityConfig['Medium'];
                  return (
                    <>
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg ${sc.color} ${sc.bg}`}>
                        {sc.icon} {taskDetail.status}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg ${pc.color} ${pc.bg}`}>
                        <Flag size={9} /> {taskDetail.priority}
                      </span>
                    </>
                  );
                })()}
              </div>

              {/* Description */}
              {taskDetail.description && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{taskDetail.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Assigned By</p>
                  <p className="text-xs text-white mt-1">{taskDetail.assignedBy?.fullName || '—'}</p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Project</p>
                  <p className="text-xs text-white mt-1">{taskDetail.projectId?.name || '—'}</p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Deadline</p>
                  <p className="text-xs text-white mt-1">{taskDetail.dueDate ? new Date(taskDetail.dueDate).toLocaleDateString() : 'No deadline'}</p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Est. Hours</p>
                  <p className="text-xs text-white mt-1">{taskDetail.estimatedHours || '—'}h</p>
                </div>
              </div>

              {/* Attachments */}
              {taskDetail.attachments && taskDetail.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Attachments</h4>
                  <div className="space-y-1.5">
                    {taskDetail.attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 rounded-lg px-3 py-2 border border-indigo-500/10">
                        <Paperclip size={12} />
                        <span>{att.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Feedback */}
              {taskDetail.reviewFeedback && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Review Feedback</h4>
                  <p className="text-sm text-amber-200">{taskDetail.reviewFeedback}</p>
                </div>
              )}

              {/* Activity Timeline */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Activity Timeline</h4>
                {taskActivities.length === 0 ? (
                  <p className="text-xs text-gray-600">No activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {taskActivities.map((act, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${
                            act.actionType === 'Approval' ? 'bg-emerald-500' :
                            act.actionType === 'Rejection' ? 'bg-red-500' :
                            act.actionType === 'StatusChange' ? 'bg-blue-500' : 'bg-gray-500'
                          }`} />
                          {i < taskActivities.length - 1 && <div className="w-px flex-1 bg-white/5 mt-1" />}
                        </div>
                        <div className="pb-3 min-w-0">
                          <p className="text-xs text-gray-300">{act.details || act.actionType}</p>
                          {act.comment && <p className="text-[10px] text-gray-500 mt-0.5">"{act.comment}"</p>}
                          <p className="text-[9px] text-gray-600 mt-0.5">
                            {act.userId?.fullName} · {new Date(act.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <button onClick={() => setShowStatusModal(taskDetail._id)}
                  className="flex-1 py-2.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl flex items-center justify-center gap-2 transition">
                  <BarChart3 size={14} /> Update Status
                </button>
                {isFounder && (taskDetail.status === 'Under Review' || taskDetail.status === 'In Review') && (
                  <button onClick={() => setShowReviewModal(taskDetail._id)}
                    className="flex-1 py-2.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 transition">
                    <ThumbsUp size={14} /> Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl border text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkforceTasks;
