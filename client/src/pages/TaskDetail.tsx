import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  useTaskDetail,
  useUpdateTask,
  useTransitionTaskStatus,
  useApproveTask,
  useRejectTask,
  useAddTaskComment,
  useAddTaskAttachment,
  useToggleChecklist,
  useTeamData
} from '../hooks/useReactQueries';
import { 
  ArrowLeft, Calendar, User, Clock, FileText, CheckSquare, 
  MessageSquare, Paperclip, Check, X, Send, AlertTriangle, 
  Trash2, ShieldCheck, Database, Plus, Sparkles, Loader2 
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

interface TaskDetailProps {
  taskId: string;
  onBack: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, onBack }) => {
  const auth = useSelector((state: RootState) => state.auth);
  const isFounder = auth.role === 'Founder' || auth.role === 'Co-Founder';

  // React Query Hooks
  const { data: detail, isLoading, isError, refetch } = useTaskDetail(taskId);
  const { data: teamData } = useTeamData();

  // Mutations
  const updateTaskMutation = useUpdateTask();
  const transitionStatusMutation = useTransitionTaskStatus();
  const approveTaskMutation = useApproveTask();
  const rejectTaskMutation = useRejectTask();
  const addCommentMutation = useAddTaskComment();
  const addAttachmentMutation = useAddTaskAttachment();
  const toggleChecklistMutation = useToggleChecklist();

  // Tabs state
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'comments' | 'activity' | 'attachments' | 'history'>('overview');

  // Input states
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  
  // Attachments form
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [showFileForm, setShowFileForm] = useState(false);

  // Rejection comments form
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectComments, setRejectComments] = useState('');

  // Checklist adding form
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const task = detail?.task;
  const comments = detail?.comments || [];
  const history = detail?.history || [];
  const activities = detail?.activities || [];

  // Computed Checklist Progress
  const checklistProgress = useMemo(() => {
    if (!task?.checklist || task.checklist.length === 0) return 0;
    const completedCount = task.checklist.filter((item: any) => item.isCompleted).length;
    return Math.round((completedCount / task.checklist.length) * 100);
  }, [task?.checklist]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        id: taskId,
        payload: {
          content: newComment,
          replyToId: replyToId || undefined
        }
      });
      setNewComment('');
      setReplyToId(null);
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileUrl) return;

    try {
      await addAttachmentMutation.mutateAsync({
        id: taskId,
        payload: { name: fileName, url: fileUrl }
      });
      setFileName('');
      setFileUrl('');
      setShowFileForm(false);
    } catch (err) {
      console.error('Failed to upload file', err);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim() || !task) return;

    try {
      const updatedChecklist = [...task.checklist, { item: newChecklistItem, isCompleted: false }];
      await updateTaskMutation.mutateAsync({
        id: taskId,
        payload: { checklist: updatedChecklist }
      });
      setNewChecklistItem('');
      setShowChecklistForm(false);
    } catch (err) {
      console.error('Failed to append checklist item', err);
    }
  };

  const handleToggleChecklist = async (itemId: string, isCompleted: boolean) => {
    try {
      await toggleChecklistMutation.mutateAsync({
        id: taskId,
        payload: { checklistItemId: itemId, isCompleted }
      });
    } catch (err) {
      console.error('Toggle failed', err);
    }
  };

  const handleTransitionStatus = async (newStatus: string) => {
    try {
      await transitionStatusMutation.mutateAsync({ id: taskId, status: newStatus });
    } catch (err) {
      console.error('Status transition failed', err);
    }
  };

  const handleApprove = async () => {
    try {
      await approveTaskMutation.mutateAsync(taskId);
    } catch (err) {
      console.error('Approval failed', err);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectComments.trim()) return;

    try {
      await rejectTaskMutation.mutateAsync({ id: taskId, comments: rejectComments });
      setShowRejectForm(false);
      setRejectComments('');
    } catch (err) {
      console.error('Rejection failed', err);
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'Urgent': return 'bg-red-950 text-red-400 border-red-500/30';
      case 'High': return 'bg-orange-950 text-orange-400 border-orange-500/30';
      case 'Medium': return 'bg-yellow-950 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-950 text-blue-400 border-blue-500/30';
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'Approved': case 'Completed': return 'bg-emerald-950 text-emerald-400 border-emerald-500/30';
      case 'Rejected': return 'bg-red-950 text-red-400 border-red-500/30';
      case 'Blocked': return 'bg-amber-950 text-amber-500 border-amber-500/30';
      case 'Under Review': case 'In Review': return 'bg-purple-950 text-purple-400 border-purple-500/30';
      case 'In Progress': return 'bg-blue-950 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-900 text-gray-400 border-white/5';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-2/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <ErrorState onRetry={refetch} message="Failed to load enterprise task card details." />
      </div>
    );
  }

  const columns = ['Backlog', 'To Do', 'In Progress', 'Blocked', 'Under Review', 'Completed', 'Approved', 'Rejected'];

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto font-sans relative z-10">
      {/* Header breadcrumb */}
      <button 
        onClick={onBack} 
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer mb-6 border border-white/5 bg-white/2 px-3 py-1.5 rounded-lg outline-none"
      >
        <ArrowLeft size={14} /> Back to Board
      </button>

      {/* Main split details workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side Tab Layout */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header titles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priorityColor(task.priority)}`}>
                {task.priority.toUpperCase()} PRIORITY
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor(task.status)}`}>
                {task.status.toUpperCase()}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">#{task._id.substring(18)}</span>
            </div>

            <h1 className="text-xl font-extrabold text-white leading-snug">{task.title}</h1>
            
            {/* Owner action controls */}
            {isFounder && (
              <div className="flex gap-2 items-center border-t border-white/5 pt-4">
                {task.status === 'Completed' || task.status === 'Under Review' ? (
                  <>
                    <button
                      onClick={handleApprove}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-md shadow-emerald-500/10"
                    >
                      <Check size={14} /> Approve Deliverables
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-md shadow-red-500/10"
                    >
                      <X size={14} /> Request Changes
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* Tabs header list */}
          <div className="flex border-b border-white/5 pb-2 gap-4 text-xs font-semibold select-none">
            {['overview', 'checklist', 'comments', 'activity', 'attachments', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-2 capitalize transition cursor-pointer outline-none ${
                  activeTab === tab 
                    ? 'border-b-2 border-indigo-500 text-indigo-400 font-bold' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content renders */}
          <div className="space-y-4 min-h-[30vh]">
            
            {/* Overview tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="liquid-glass p-5 rounded-xl border border-white/5 bg-slate-950/20">
                  <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="liquid-glass p-4 rounded-xl border border-white/5 bg-slate-950/20">
                    <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Labels</h4>
                    <div className="flex gap-1.5 flex-wrap">
                      {task.labels && task.labels.length > 0 ? (
                        task.labels.map((l: string, idx: number) => (
                          <span key={idx} className="bg-white/5 border border-white/10 text-gray-400 text-[10px] px-2 py-0.5 rounded font-semibold">{l}</span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-600">No labels specified.</span>
                      )}
                    </div>
                  </div>

                  <div className="liquid-glass p-4 rounded-xl border border-white/5 bg-slate-950/20">
                    <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Tags</h4>
                    <div className="flex gap-1.5 flex-wrap">
                      {task.tags && task.tags.length > 0 ? (
                        task.tags.map((t: string, idx: number) => (
                          <span key={idx} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded font-semibold">{t}</span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-600">No tags configured.</span>
                      )}
                    </div>
                  </div>
                </div>

                {task.dependencies && task.dependencies.length > 0 && (
                  <div className="liquid-glass p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-2">
                    <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle size={10} /> Blocking Dependencies ({task.dependencies.length})
                    </h4>
                    <div className="space-y-1.5 text-xs text-gray-300">
                      {task.dependencies.map((dep: any) => (
                        <div key={dep._id} className="flex justify-between items-center bg-white/2 p-2 rounded border border-white/5">
                          <span>{dep.title}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${statusColor(dep.status)}`}>
                            {dep.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Checklist Tab */}
            {activeTab === 'checklist' && (
              <div className="space-y-4">
                {/* Checklist header and progress bar */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                      <span>CHECKLIST COMPLETION PROGRESS</span>
                      <span>{checklistProgress}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${checklistProgress}%` }} />
                    </div>
                  </div>

                  {isFounder && (
                    <button
                      onClick={() => setShowChecklistForm(true)}
                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-semibold text-gray-300 flex items-center gap-1 cursor-pointer outline-none"
                    >
                      <Plus size={12} /> Add Item
                    </button>
                  )}
                </div>

                {/* Add checklist item form inline */}
                {showChecklistForm && (
                  <form onSubmit={handleAddChecklistItem} className="flex gap-2 text-xs">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Verify Stripe webhook secrets in Env"
                      className="w-full glass-input text-xs"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                    />
                    <button type="submit" className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
                      Add
                    </button>
                  </form>
                )}

                {/* Checklist item list */}
                <div className="space-y-1.5">
                  {task.checklist && task.checklist.length > 0 ? (
                    task.checklist.map((item: any) => (
                      <div key={item._id} className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5 text-xs text-gray-300">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-indigo-600 rounded bg-slate-900 border-white/10"
                            checked={item.isCompleted}
                            onChange={(e) => handleToggleChecklist(item._id, e.target.checked)}
                          />
                          <span className={item.isCompleted ? 'line-through text-gray-500' : ''}>{item.item}</span>
                        </label>
                        {item.isCompleted && item.completedBy && (
                          <span className="text-[9px] text-gray-500 font-mono">
                            Marked done by {item.completedBy.fullName || 'Member'}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs text-gray-500 py-12">No checklist subtasks registered.</p>
                  )}
                </div>
              </div>
            )}

            {/* Comments tab */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Comments loop */}
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                  {comments.length > 0 ? (
                    comments.map((c: any) => (
                      <div key={c._id} className="bg-white/2 border border-white/5 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-900/30 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-400 uppercase">
                              {c.author?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <h5 className="font-bold text-white">{c.author?.fullName}</h5>
                              <span className="text-[8px] text-gray-500 font-mono block mt-0.5">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setReplyToId(replyToId === c._id ? null : c._id)}
                            className="text-[10px] text-indigo-400 hover:underline outline-none"
                          >
                            Reply Thread
                          </button>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed font-sans">{c.content}</p>

                        {/* Nested Replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="ml-6 pl-4 border-l border-white/5 space-y-3 mt-3">
                            {c.replies.map((reply: any, rIdx: number) => (
                              <div key={rIdx} className="space-y-1 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-white">
                                  <span>{reply.author?.fullName || 'Member'}</span>
                                  <span className="text-[8px] text-gray-500 font-mono font-normal">
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-gray-400 leading-relaxed">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs text-gray-500 py-12">No discussion comments recorded.</p>
                  )}
                </div>

                {/* Post Comment Input */}
                <form onSubmit={handlePostComment} className="border-t border-white/5 pt-4 space-y-3">
                  {replyToId && (
                    <div className="flex justify-between items-center bg-indigo-500/5 px-2.5 py-1.5 rounded text-[10px] text-indigo-300">
                      <span>Replying to comment thread...</span>
                      <button onClick={() => setReplyToId(null)} className="font-bold text-gray-400">Cancel</button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Comment text..."
                      className="w-full glass-input text-xs font-sans"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shrink-0 cursor-pointer flex items-center justify-center">
                      <Send size={12} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Activity tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                {activities.length > 0 ? (
                  <div className="relative border-l border-white/5 ml-3 pl-6 space-y-6 py-2">
                    {activities.map((a: any) => (
                      <div key={a._id} className="relative text-xs">
                        {/* Dot indicator */}
                        <div className="absolute -left-7.5 top-0.5 w-2 h-2 rounded-full bg-indigo-500 border border-slate-950 ring-4 ring-indigo-500/20" />
                        
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mb-1">
                          <span>{new Date(a.createdAt).toLocaleString()}</span>
                          <span>By {a.userId?.fullName || 'System'}</span>
                        </div>
                        <h5 className="font-bold text-white">{a.action}</h5>
                        {a.details && <p className="text-gray-400 mt-1 leading-normal text-[11px]">{a.details}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-gray-500 py-12">No activity events recorded.</p>
                )}
              </div>
            )}

            {/* Attachments tab */}
            {activeTab === 'attachments' && (
              <div className="space-y-4">
                <div className="flex justify-end select-none">
                  <button
                    onClick={() => setShowFileForm(!showFileForm)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-gray-300 flex items-center gap-1 cursor-pointer outline-none"
                  >
                    <Paperclip size={12} /> Upload File Attachment
                  </button>
                </div>

                {showFileForm && (
                  <form onSubmit={handleAddAttachment} className="liquid-glass p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-gray-400 mb-1">Display Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Figma Prototype Screen"
                          className="w-full glass-input text-xs"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">File URL</label>
                        <input
                          type="text"
                          required
                          placeholder="https://cloudinary.com/..."
                          className="w-full glass-input text-xs"
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold">
                      Add File link
                    </button>
                  </form>
                )}

                <div className="space-y-2">
                  {task.attachments && task.attachments.length > 0 ? (
                    task.attachments.map((file: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-white/2 border border-white/5 text-xs text-gray-300">
                        <div className="flex items-center gap-2">
                          <Paperclip size={14} className="text-gray-500" />
                          <a href={file.url} target="_blank" rel="noreferrer" className="font-semibold text-indigo-400 hover:underline">{file.name}</a>
                        </div>
                        <span className="text-[9px] text-gray-500 font-mono">
                          Uploaded {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs text-gray-500 py-12">No files attached to task cards.</p>
                  )}
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((h: any) => (
                      <div key={h._id} className="p-3 rounded-lg bg-white/2 border border-white/5 text-xs text-gray-300 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                          <span>{new Date(h.createdAt).toLocaleString()}</span>
                          <span>By {h.changedBy?.fullName || 'User'}</span>
                        </div>
                        <p className="leading-relaxed">
                          Updated field <span className="font-bold text-indigo-400">"{h.field}"</span>:
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-1 bg-white/2 p-2 rounded text-[10px] font-mono leading-normal">
                          <div className="border-r border-white/5 pr-2">
                            <span className="text-red-400 block mb-0.5">BEFORE:</span>
                            <span className="truncate block max-w-xs">{h.oldValue || '(empty)'}</span>
                          </div>
                          <div className="pl-2">
                            <span className="text-emerald-400 block mb-0.5">AFTER:</span>
                            <span className="truncate block max-w-xs">{h.newValue || '(empty)'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-gray-500 py-12">No historical edits recorded.</p>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Side Metadata Panel */}
        <div className="space-y-6">
          {/* Main Info Box */}
          <div className="liquid-glass p-5 rounded-xl border border-white/5 bg-slate-950/40 space-y-4 text-xs font-sans">
            <h3 className="font-extrabold text-white border-b border-white/5 pb-2 uppercase tracking-wide">Metadata Properties</h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-gray-500 font-bold uppercase tracking-wider block mb-1">Project</span>
                <span className="text-white font-semibold">{task.projectId?.name || 'Workspace Project'}</span>
              </div>

              <div>
                <span className="text-gray-500 font-bold uppercase tracking-wider block mb-1">Milestone</span>
                <span className="text-white font-semibold">{task.milestoneId?.title || 'Iteration Goal'}</span>
              </div>

              <div>
                <span className="text-gray-500 font-bold uppercase tracking-wider block mb-1">Assigned By</span>
                <span className="text-white font-semibold">{task.reporter?.fullName || 'Founder'}</span>
              </div>

              <div>
                <span className="text-gray-500 font-bold uppercase tracking-wider block mb-1">Assigned Members</span>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {task.assignees && task.assignees.length > 0 ? (
                    task.assignees.map((user: any) => (
                      <div key={user._id} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                        <div className="w-5 h-5 rounded-full bg-indigo-900 border border-indigo-500 flex items-center justify-center text-[8px] font-bold text-white uppercase">
                          {user.fullName.charAt(0)}
                        </div>
                        <span className="text-[10px] text-gray-300 font-semibold">{user.fullName}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-600">Unassigned</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-gray-500 font-bold uppercase tracking-wider block mb-1">Deadline Date</span>
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <Calendar size={13} className="text-indigo-400" />
                  <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 font-bold uppercase tracking-wider block mb-1">Estimated Hours</span>
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <Clock size={13} className="text-indigo-400" />
                  <span>{task.estimatedHours || 0} hrs</span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 font-bold uppercase tracking-wider block mb-1">Status Transitions</span>
                <select 
                  className="w-full glass-input text-xs bg-slate-950 border-white/5 font-semibold mt-1"
                  value={task.status}
                  onChange={(e) => handleTransitionStatus(e.target.value)}
                >
                  {columns.map(col => <option key={col} value={col} className="bg-slate-900 text-white">{col.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Reject changes modal overlay */}
      {showRejectForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0" onClick={() => setShowRejectForm(false)} />
          <form onSubmit={handleReject} className="w-full max-w-sm liquid-glass p-6 rounded-xl relative z-10 space-y-4 border border-white/10 bg-slate-950">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Request Task Modifications</h3>
            <p className="text-[10px] text-gray-500">Provide instructions on what needs to be changed before approval.</p>
            <div>
              <textarea
                rows={4}
                required
                placeholder="Details of required edits..."
                className="w-full glass-input text-xs resize-none"
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold cursor-pointer"
              >
                Submit Comments
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
