import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  useProjects, 
  useTasks, 
  useMilestones,
  useCreateTask, 
  useCreateSprint, 
  useCreateMilestone,
  useTransitionTaskStatus,
  useTeamData
} from '../../hooks/useReactQueries';
import { Plus, AlertTriangle, Calendar, Search, Filter, Clock, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Skeleton } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import TaskDetail from '../../pages/TaskDetail';

export const ProjectKanban: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const isFounder = auth.role === 'Founder' || auth.role === 'Co-Founder';

  const workspaceId = localStorage.getItem('activeWorkspaceId');

  // Sub-view: board (Kanban) or list (Table)
  const [viewType, setViewType] = useState<'board' | 'list'>('board');
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [sortField, setSortField] = useState('createdAt');

  // Projects & Milestones selection
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects(workspaceId);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0]._id);
    }
  }, [projects, activeProjectId]);

  const { data: milestones = [], isLoading: isMilestonesLoading } = useMilestones();
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>('All');

  // Team data query
  const { data: teamData } = useTeamData();
  const rawMembers = teamData?.members || [];

  // Tasks Query
  const tasksParams = useMemo(() => {
    const q: any = {};
    if (workspaceId) q.workspaceId = workspaceId;
    if (activeProjectId) q.projectId = activeProjectId;
    if (activeMilestoneId !== 'All') q.milestoneId = activeMilestoneId;
    return q;
  }, [workspaceId, activeProjectId, activeMilestoneId]);

  const { data: tasks = [], isLoading: isTasksLoading, isError: isTasksError, refetch: refetchTasks } = useTasks(tasksParams);

  // Mutations
  const createTaskMutation = useCreateTask();
  const createMilestoneMutation = useCreateMilestone();
  const transitionStatusMutation = useTransitionTaskStatus();

  // Add Task Modal parameters
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskEstHours, setTaskEstHours] = useState(6);
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskLabelInput, setTaskLabelInput] = useState('');
  const [taskTagInput, setTaskTagInput] = useState('');
  const [taskDependency, setTaskDependency] = useState('');
  const [taskChecklistInput, setTaskChecklistInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Add Milestone parameters
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');
  const [msDue, setMsDue] = useState('');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !activeProjectId || !taskTitle || !taskDueDate || !taskAssignee) return;

    // Check if target deadline is a past date
    if (new Date(taskDueDate) < new Date(new Date().setHours(0,0,0,0))) {
      setToastMsg('Deadline cannot be set to a past date.');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }

    try {
      const selectedMilestone = activeMilestoneId !== 'All' ? activeMilestoneId : (milestones[0]?._id || undefined);
      if (!selectedMilestone) {
        setToastMsg('A milestone is required to map tasks.');
        setTimeout(() => setToastMsg(''), 4000);
        return;
      }

      await createTaskMutation.mutateAsync({
        workspaceId,
        projectId: activeProjectId,
        milestoneId: selectedMilestone,
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        estimatedHours: taskEstHours,
        dueDate: taskDueDate,
        assignees: [taskAssignee],
        labels: taskLabelInput ? taskLabelInput.split(',').map(l => l.trim()) : [],
        tags: taskTagInput ? taskTagInput.split(',').map(t => t.trim()) : [],
        dependencies: taskDependency ? [taskDependency] : [],
        checklist: taskChecklistInput ? taskChecklistInput.split(',').map(item => ({ item: item.trim(), isCompleted: false })) : []
      });

      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setTaskAssignee('');
      setTaskLabelInput('');
      setTaskTagInput('');
      setTaskDependency('');
      setTaskChecklistInput('');
    } catch (err: any) {
      setToastMsg(err.response?.data?.error || 'Failed to add task');
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const transitionTaskStatus = async (taskId: string, newStatus: string) => {
    setToastMsg('');
    try {
      await transitionStatusMutation.mutateAsync({ id: taskId, status: newStatus });
      if (newStatus === 'Completed' || newStatus === 'Approved') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    } catch (err: any) {
      setToastMsg(err.response?.data?.error || 'Failed to update task status.');
      setTimeout(() => setToastMsg(''), 5000);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle || !msDue) return;

    try {
      await createMilestoneMutation.mutateAsync({
        title: msTitle,
        description: msDesc,
        dueDate: msDue
      });
      setShowMilestoneModal(false);
      setMsTitle('');
      setMsDesc('');
      setMsDue('');
    } catch (err) {
      console.error('Failed to create milestone', err);
    }
  };

  const columns = ['Backlog', 'To Do', 'In Progress', 'Blocked', 'Under Review', 'Completed', 'Approved', 'Rejected'];

  // Filter & Sort Tasks in Memory
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Priority Filter
    if (priorityFilter !== 'All') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    // Assignee Filter
    if (assigneeFilter !== 'All') {
      result = result.filter(t => 
        t.assignees && t.assignees.some((user: any) => user._id === assigneeFilter)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === 'dueDate') {
        return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
      }
      if (sortField === 'priority') {
        const priorityOrder: any = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [tasks, searchQuery, priorityFilter, assigneeFilter, sortField]);

  if (viewingTaskId) {
    return <TaskDetail taskId={viewingTaskId} onBack={() => setViewingTaskId(null)} />;
  }

  if (isProjectsLoading || isMilestonesLoading || isTasksLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (isTasksError) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <ErrorState onRetry={refetchTasks} message="Failed to load project tasks workspace." />
      </div>
    );
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case 'Urgent': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Search Filter Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-white/5 pb-4">
        
        {/* Project Selector & Milestone Pills */}
        <div className="flex items-center gap-4 flex-wrap text-xs select-none">
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Active Project</span>
            <select 
              className="bg-white/2 border border-white/10 rounded-lg px-2.5 py-1.5 font-bold text-white cursor-pointer outline-none"
              value={activeProjectId || ''}
              onChange={(e) => setActiveProjectId(e.target.value)}
            >
              {projects.map((p: any) => <option key={p._id} value={p._id} className="bg-slate-900 text-white">{p.name}</option>)}
            </select>
          </div>

          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Target Milestone</span>
            <select
              className="bg-white/2 border border-white/10 rounded-lg px-2.5 py-1.5 font-bold text-white cursor-pointer outline-none"
              value={activeMilestoneId}
              onChange={(e) => setActiveMilestoneId(e.target.value)}
            >
              <option value="All" className="bg-slate-900 text-white">All Milestones</option>
              {milestones.map((m: any) => <option key={m._id} value={m._id} className="bg-slate-900 text-white">{m.title}</option>)}
            </select>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setViewType('board')}
            className={`px-3 py-1.5 rounded-lg border transition cursor-pointer font-bold outline-none ${
              viewType === 'board' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setViewType('list')}
            className={`px-3 py-1.5 rounded-lg border transition cursor-pointer font-bold outline-none ${
              viewType === 'list' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            List Table
          </button>
          {isFounder && (
            <>
              <button 
                onClick={() => setShowMilestoneModal(true)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-lg font-semibold flex items-center gap-1 cursor-pointer outline-none"
              >
                + Add Milestone
              </button>
              <button 
                onClick={() => setShowTaskModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer outline-none"
              >
                + Create Task
              </button>
            </>
          )}
        </div>

      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
          <input 
            type="text"
            placeholder="Search task title..."
            className="w-full glass-input pl-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Priority Filter */}
        <select 
          className="w-full glass-input text-xs bg-slate-900 border-white/5"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="Low">Low Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="High">High Priority</option>
          <option value="Urgent">Urgent Priority</option>
        </select>

        {/* Assignee Filter */}
        <select 
          className="w-full glass-input text-xs bg-slate-900 border-white/5"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="All">All Assignees</option>
          {rawMembers.map((m: any) => (
            <option key={m.userId._id} value={m.userId._id}>{m.userId.fullName}</option>
          ))}
        </select>

        {/* Sort */}
        <select 
          className="w-full glass-input text-xs bg-slate-900 border-white/5"
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
        >
          <option value="createdAt">Sort: Created Date</option>
          <option value="dueDate">Sort: Target Deadline</option>
          <option value="priority">Sort: Priority Level</option>
        </select>
      </div>

      {/* Safety Validation Error Toast */}
      {toastMsg && (
        <div className="bg-red-950/60 border border-red-500/50 text-red-200 text-xs px-4 py-3 rounded-lg flex items-center gap-2 animate-bounce">
          <AlertTriangle size={15} className="text-red-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewType === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3 overflow-x-auto pb-6">
          {columns.map(col => {
            const colTasks = processedTasks.filter(t => t.status === col);
            return (
              <div key={col} className="board-column min-w-[200px] flex flex-col space-y-3 min-h-[50vh]">
                <div className="flex justify-between items-center px-1 pb-1.5 border-b border-white/5 select-none">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{col}</span>
                  <span className="text-[10px] bg-white/5 px-1.5 py-0.2 rounded text-gray-500">{colTasks.length}</span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[55vh]">
                  {colTasks.map(task => (
                    <div 
                      key={task._id} 
                      onClick={() => setViewingTaskId(task._id)}
                      className="liquid-glass p-3 rounded-lg space-y-3 relative group border border-white/5 bg-slate-950/40 cursor-pointer hover:border-indigo-500/30 transition text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityColor(task.priority)}`} />
                        <span className="text-[9px] text-gray-500 font-bold uppercase">
                          {task.estimatedHours || 0} hrs est
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-white leading-relaxed truncate">{task.title}</h4>

                      {task.checklist && task.checklist.length > 0 && (
                        <div className="flex items-center justify-between text-[9px] text-gray-500 bg-white/2 px-1.5 py-0.5 rounded border border-white/5">
                          <span>Checklist</span>
                          <span>
                            {task.checklist.filter((i: any) => i.isCompleted).length} / {task.checklist.length}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-[9px] text-gray-500 font-mono">#{task._id.substring(18)}</span>
                        {/* Status transition dots */}
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          {columns.filter(c => c !== col).slice(0, 3).map(c => (
                            <button
                              key={c}
                              onClick={() => transitionTaskStatus(task._id, c)}
                              className="text-[8px] bg-white/5 hover:bg-indigo-600 hover:text-white px-1 py-0.2 rounded text-gray-400 transition cursor-pointer outline-none"
                              title={`Move to ${c}`}
                            >
                              {c.charAt(0)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST TABLE VIEW */}
      {viewType === 'list' && (
        <div className="liquid-glass border border-white/5 rounded-xl overflow-hidden bg-slate-950/40">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-300">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 select-none uppercase tracking-wider text-[9px] font-bold">
                  <th className="px-5 py-3">TASK</th>
                  <th className="px-5 py-3">PRIORITY</th>
                  <th className="px-5 py-3">STATUS</th>
                  <th className="px-5 py-3">ASSIGNEES</th>
                  <th className="px-5 py-3">DEADLINE</th>
                  <th className="px-5 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {processedTasks.length > 0 ? (
                  processedTasks.map(task => (
                    <tr key={task._id} className="hover:bg-white/[0.01] cursor-pointer" onClick={() => setViewingTaskId(task._id)}>
                      <td className="px-5 py-4">
                        <div className="font-bold text-white truncate max-w-xs">{task.title}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">#{task._id.substring(18)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${priorityColor(task.priority)} text-white`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-gray-300 font-semibold">{task.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {task.assignees?.map((user: any) => (
                            <span key={user._id} className="bg-white/5 px-2 py-0.5 rounded text-[10px] text-gray-300 font-semibold border border-white/5">
                              {user.fullName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <select
                          className="bg-slate-900 border border-white/10 text-[10px] rounded px-1.5 py-1 text-gray-300 cursor-pointer outline-none"
                          value={task.status}
                          onChange={(e) => transitionTaskStatus(task._id, e.target.value)}
                        >
                          {columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                      No tasks found matching dynamic filter queries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0" onClick={() => setShowTaskModal(false)} />
          <form onSubmit={handleCreateTask} className="w-full max-w-md liquid-glass p-6 rounded-xl relative z-10 space-y-4 border border-white/10 bg-slate-950 font-sans">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Iteration Task</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2">
                <label className="block text-gray-400 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="Connect Stripe webhooks"
                  className="w-full glass-input text-xs"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-gray-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Details..."
                  className="w-full glass-input text-xs resize-none"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Assign User</label>
                <select
                  required
                  className="w-full glass-input text-xs bg-slate-900"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                >
                  <option value="">Select Member</option>
                  {rawMembers.map((m: any) => (
                    <option key={m.userId._id} value={m.userId._id}>{m.userId.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Deadline Date</label>
                <input
                  type="date"
                  required
                  className="w-full glass-input text-xs"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Priority</label>
                <select
                  className="w-full glass-input text-xs bg-slate-900"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Est. Hours</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full glass-input text-xs"
                  value={taskEstHours}
                  onChange={(e) => setTaskEstHours(Number(e.target.value))}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-gray-400 mb-1">Task Checklist (Comma separated subtasks)</label>
                <input
                  type="text"
                  placeholder="Write webhooks, Test locally, Push mock webhooks"
                  className="w-full glass-input text-xs"
                  value={taskChecklistInput}
                  onChange={(e) => setTaskChecklistInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Labels (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Backend, Stripe"
                  className="w-full glass-input text-xs"
                  value={taskLabelInput}
                  onChange={(e) => setTaskLabelInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Billing, V1"
                  className="w-full glass-input text-xs"
                  value={taskTagInput}
                  onChange={(e) => setTaskTagInput(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0" onClick={() => setShowMilestoneModal(false)} />
          <form onSubmit={handleCreateMilestone} className="w-full max-w-sm liquid-glass p-6 rounded-xl relative z-10 space-y-4 border border-white/10 bg-slate-950 font-sans">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Milestone</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Milestone Title</label>
              <input
                type="text"
                required
                placeholder="Product Beta Release"
                className="w-full glass-input text-xs"
                value={msTitle}
                onChange={(e) => setMsTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Core milestone goals..."
                className="w-full glass-input text-xs resize-none"
                value={msDesc}
                onChange={(e) => setMsDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Due Date</label>
              <input
                type="date"
                required
                className="w-full glass-input text-xs"
                value={msDue}
                onChange={(e) => setMsDue(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowMilestoneModal(false)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold cursor-pointer"
              >
                Create Milestone
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProjectKanban;
