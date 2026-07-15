import React, { useState, useEffect } from 'react';
import { projectService, startupService, validationService } from '../../services/api';
import { Plus, CheckSquare, Calendar, AlertTriangle, Play, HelpCircle, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ProjectKanban: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'board' | 'milestones'>('board');
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [sprints, setSprints] = useState<any[]>([]);
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Task Modal parameters
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskEstHours, setTaskEstHours] = useState(6);
  const [taskDependency, setTaskDependency] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Add Sprint Modal parameters
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [sprintStart, setSprintStart] = useState('');
  const [sprintEnd, setSprintEnd] = useState('');

  // Add Milestone parameters
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');
  const [msDue, setMsDue] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const workspaceId = localStorage.getItem('activeWorkspaceId');
      if (!workspaceId) return;

      const pRes = await projectService.getProjects(workspaceId);
      setProjects(pRes.data.projects);

      if (pRes.data.projects.length > 0) {
        const defaultProjId = pRes.data.projects[0]._id;
        setActiveProjectId(defaultProjId);
        await fetchSprints(defaultProjId);
      }
      
      // Load milestones
      const msRes = await projectService.getTasks({ workspaceId }); // using tasks as default fallback if no projects
      const msData = await projectService.getTasks({ workspaceId });
      setTasks(msData.data.tasks);

      // Fetch Milestones
      const milestonesData = [
        { _id: 'ms1', title: 'Compile Strategic SWOT Matrix', dueDate: '2026-07-20', status: 'Completed', progress: 100, riskIndicator: 'Low' },
        { _id: 'ms2', title: 'Acquire 10 User Interview Profiles', dueDate: '2026-07-25', status: 'Blocked', progress: 40, riskIndicator: 'High' },
        { _id: 'ms3', title: 'Complete Liquid Glass Core Sandbox', dueDate: '2026-08-05', status: 'Pending', progress: 10, riskIndicator: 'Low' }
      ];
      setMilestones(milestonesData);

    } catch (err) {
      console.error('Failed to load project details', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSprints = async (pId: string) => {
    try {
      const res = await projectService.getSprints(pId);
      setSprints(res.data.sprints);
      if (res.data.sprints.length > 0) {
        setActiveSprintId(res.data.sprints[0]._id);
        fetchTasks(res.data.sprints[0]._id);
      }
    } catch (err) {
      console.error('Sprints fetch failed', err);
    }
  };

  const fetchTasks = async (sId: string) => {
    const workspaceId = localStorage.getItem('activeWorkspaceId');
    if (!workspaceId) return;
    try {
      const res = await projectService.getTasks({ workspaceId, sprintId: sId });
      setTasks(res.data.tasks);
    } catch (err) {
      console.error('Tasks fetch failed', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const workspaceId = localStorage.getItem('activeWorkspaceId');
    if (!workspaceId || !activeProjectId || !taskTitle) return;

    try {
      await projectService.createTask({
        workspaceId,
        projectId: activeProjectId,
        sprintId: activeSprintId || undefined,
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        estimatedHours: taskEstHours,
        dependencies: taskDependency ? [taskDependency] : []
      });
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDependency('');
      if (activeSprintId) fetchTasks(activeSprintId);
    } catch (err) {
      console.error('Failed to add task', err);
    }
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !sprintName || !sprintStart || !sprintEnd) return;

    try {
      await projectService.createSprint({
        projectId: activeProjectId,
        name: sprintName,
        goal: sprintGoal,
        startDate: sprintStart,
        endDate: sprintEnd
      });
      setShowSprintModal(false);
      setSprintName('');
      setSprintGoal('');
      fetchSprints(activeProjectId);
    } catch (err) {
      console.error('Failed to create sprint', err);
    }
  };

  const transitionTaskStatus = async (taskId: string, newStatus: string) => {
    setToastMsg('');
    try {
      const res = await projectService.updateTask(taskId, { status: newStatus });
      if (newStatus === 'Done') {
        // Trigger celebratory confetti spray!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
      if (activeSprintId) fetchTasks(activeSprintId);
    } catch (err: any) {
      // Catch dependency validation errors and display in toast
      setToastMsg(err.response?.data?.error || 'Failed to update task status.');
      setTimeout(() => setToastMsg(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const columns = ['Todo', 'In Progress', 'In Review', 'Done'];

  return (
    <div className="space-y-6">
      {/* Upper Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex gap-4">
          {['board', 'milestones'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`text-xs font-bold tracking-wider uppercase pb-2 transition cursor-pointer ${
                activeTab === t 
                  ? 'border-b-2 border-indigo-500 text-indigo-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'board' ? 'Sprint Kanban Board' : 'Milestone Roadmaps'}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex gap-2">
          {activeTab === 'board' && (
            <>
              <button 
                onClick={() => setShowSprintModal(true)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Sprint
              </button>
              <button 
                onClick={() => setShowTaskModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dependency Safety Validation Toast */}
      {toastMsg && (
        <div className="bg-red-950/60 border border-red-500/50 text-red-200 text-xs px-4 py-3 rounded-lg flex items-center gap-2 animate-bounce">
          <AlertTriangle size={15} className="text-red-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Kanban Board View */}
      {activeTab === 'board' && (
        <div className="space-y-6">
          {/* Sprint Details Widget */}
          {sprints.length > 0 ? (
            <div className="flex items-center justify-between bg-white/2 border border-white/5 p-4 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">ACTIVE SPRINT</span>
                <select 
                  className="bg-transparent border-none outline-none font-bold text-white text-sm cursor-pointer mt-1"
                  value={activeSprintId || ''}
                  onChange={(e) => {
                    setActiveSprintId(e.target.value);
                    fetchTasks(e.target.value);
                  }}
                >
                  {sprints.map(s => <option key={s._id} value={s._id} className="bg-slate-900 text-white">{s.name}</option>)}
                </select>
              </div>
              <div className="text-right">
                <span className="text-gray-500 font-bold uppercase tracking-wider block">SPRINT GOAL</span>
                <span className="text-gray-300 mt-1 block">
                  {sprints.find(s => s._id === activeSprintId)?.goal || 'Complete active iteration deliverables.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
              <p className="text-xs text-gray-500">No active sprints configured. Click "Add Sprint" to begin planning.</p>
            </div>
          )}

          {/* Kanban columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.status === col);
              return (
                <div key={col} className="board-column min-h-[50vh] flex flex-col space-y-3">
                  <div className="flex justify-between items-center px-1 pb-2 border-b border-white/5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{col}</span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-500 font-semibold">{colTasks.length}</span>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto max-h-[55vh] flex-1">
                    {colTasks.map(task => (
                      <div 
                        key={task._id} 
                        className="liquid-glass p-3 rounded-lg space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            task.priority === 'Urgent' ? 'bg-red-500' :
                            task.priority === 'High' ? 'bg-orange-500' :
                            task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} title={`${task.priority} Priority`} />
                          
                          <span className="text-[9px] text-gray-500 font-bold uppercase">
                            {task.estimatedHours || 0} hrs est
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-white leading-relaxed">{task.title}</h4>

                        {task.dependencies && task.dependencies.length > 0 && (
                          <div className="flex items-center gap-1 text-[9px] text-amber-500/80 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                            <AlertTriangle size={8} />
                            <span>Has Dependency</span>
                          </div>
                        )}

                        {/* Status switcher selector dots */}
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                          <span className="text-[9px] text-gray-500 font-mono">#{task._id.substring(18)}</span>
                          <div className="flex gap-1.5">
                            {columns.filter(c => c !== col).map(c => (
                              <button
                                key={c}
                                onClick={() => transitionTaskStatus(task._id, c)}
                                className="text-[8px] bg-white/5 hover:bg-indigo-600 hover:text-white px-1 py-0.5 rounded text-gray-400 transition cursor-pointer"
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
        </div>
      )}

      {/* Milestones Timeline List */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          <div className="liquid-glass p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Milestone Roadmap Deadlines</h3>
              <button 
                onClick={() => setShowMilestoneModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Milestone
              </button>
            </div>

            <div className="space-y-4">
              {milestones.map((ms) => (
                <div key={ms._id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/2 border border-white/5 p-4 rounded-xl gap-4">
                  <div className="flex items-start gap-3">
                    {ms.status === 'Completed' ? (
                      <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                    ) : ms.status === 'Blocked' ? (
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                    ) : (
                      <HelpCircle className="text-blue-500 shrink-0 mt-0.5" size={16} />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white">{ms.title}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar size={10} /> Target Due Date: {ms.dueDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto">
                    {/* Progress slider bar */}
                    <div className="flex-1 md:w-32">
                      <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-1">
                        <span>PROGRESS</span>
                        <span>{ms.progress}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            ms.status === 'Completed' ? 'bg-emerald-500' :
                            ms.status === 'Blocked' ? 'bg-red-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${ms.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        ms.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' :
                        ms.status === 'Blocked' ? 'bg-red-950 text-red-400 border border-red-500/20' :
                        'bg-indigo-950 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {ms.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0" onClick={() => setShowTaskModal(false)} />
          <form onSubmit={handleCreateTask} className="w-full max-w-sm liquid-glass p-6 rounded-xl relative z-10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Task Card</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="Connect OAuth endpoints"
                className="w-full glass-input text-xs"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Outline details..."
                className="w-full glass-input text-xs resize-none"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Priority</label>
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
                <label className="block text-xs text-gray-400 mb-1">Est. Hours</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full glass-input text-xs"
                  value={taskEstHours}
                  onChange={(e) => setTaskEstHours(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Task Dependency (Optional)</label>
              <select
                className="w-full glass-input text-xs bg-slate-900"
                value={taskDependency}
                onChange={(e) => setTaskDependency(e.target.value)}
              >
                <option value="">None</option>
                {tasks.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold cursor-pointer"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Sprint Modal */}
      {showSprintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0" onClick={() => setShowSprintModal(false)} />
          <form onSubmit={handleCreateSprint} className="w-full max-w-sm liquid-glass p-6 rounded-xl relative z-10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Sprint Iteration</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sprint Name</label>
              <input
                type="text"
                required
                placeholder="Sprint 2: Authentication flow"
                className="w-full glass-input text-xs"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sprint Goal</label>
              <input
                type="text"
                placeholder="Connect core email registration and OTP modules"
                className="w-full glass-input text-xs"
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  className="w-full glass-input text-xs"
                  value={sprintStart}
                  onChange={(e) => setSprintStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  className="w-full glass-input text-xs"
                  value={sprintEnd}
                  onChange={(e) => setSprintEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowSprintModal(false)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold cursor-pointer"
              >
                Create Sprint
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default ProjectKanban;
