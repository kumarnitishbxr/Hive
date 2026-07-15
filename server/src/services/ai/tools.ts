import { Project, Sprint } from '../../models/Project';
import Milestone from '../../models/Milestone';
import { Task, TimeLog } from '../../models/Task';
import { Member, User } from '../../models/User';
import TaskHistory from '../../models/TaskHistory';
import TaskComment from '../../models/TaskComment';
import TaskActivity from '../../models/TaskActivity';
import { Types } from 'mongoose';

// 1. Get Projects
export const getProjects = async (workspaceId: string) => {
  const projects = await Project.find({ workspaceId }).select('name description status startDate endDate');
  return projects;
};

// 2. Get Milestones
export const getMilestones = async (workspaceId: string) => {
  const milestones = await Milestone.find({ startupId: workspaceId }).select('title description status dueDate associatedTasks');
  return milestones;
};

// 3. Get Tasks
export const getTasks = async (workspaceId: string) => {
  const tasks = await Task.find({ workspaceId })
    .populate('assignees', 'fullName email')
    .populate('reporter', 'fullName email')
    .select('title description status priority assignees reporter dueDate estimatedHours actualHours dependencies parentTaskId');
  return tasks;
};

// 4. Get Task History Diffs
export const getTaskHistory = async (taskId: string) => {
  const history = await TaskHistory.find({ taskId })
    .populate('changedBy', 'fullName')
    .sort({ createdAt: -1 });
  return history;
};

// 5. Get Members
export const getMembers = async (workspaceId: string) => {
  const members = await Member.find({ startupId: workspaceId })
    .populate('userId', 'fullName email status')
    .select('userId role joinedAt');
  return members;
};

// 6. Get Workspace Activity & Analytics Telemetry
export const getAnalytics = async (workspaceId: string) => {
  const tasks = await Task.find({ workspaceId });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => ['Completed', 'Approved', 'Done'].includes(t.status)).length;
  const blockedTasks = tasks.filter(t => t.status === 'Blocked').length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !['Completed', 'Approved', 'Done'].includes(t.status)).length;

  const totalEstHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

  return {
    totalTasks,
    completedTasks,
    blockedTasks,
    overdueTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    estimatedHoursTotal: totalEstHours,
    actualHoursTotal: totalActualHours,
    hoursVariance: totalEstHours - totalActualHours
  };
};

// 7. Write Task Suggestion directly from Agent Planner
export const createTaskSuggestion = async (workspaceId: string, payload: {
  projectId: string;
  milestoneId: string;
  title: string;
  description: string;
  assignees: string[];
  dueDate: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  estimatedHours?: number;
  reporterId: string;
}) => {
  const task = new Task({
    workspaceId,
    projectId: new Types.ObjectId(payload.projectId),
    milestoneId: new Types.ObjectId(payload.milestoneId),
    title: payload.title,
    description: payload.description,
    status: 'Todo',
    priority: payload.priority || 'Medium',
    assignees: payload.assignees.map(id => new Types.ObjectId(id)),
    reporter: new Types.ObjectId(payload.reporterId),
    dueDate: new Date(payload.dueDate),
    estimatedHours: payload.estimatedHours || 4
  });
  await task.save();
  return task;
};

// 8. Assign Task
export const assignTask = async (taskId: string, userId: string) => {
  const task = await Task.findByIdAndUpdate(
    taskId,
    { $addToSet: { assignees: new Types.ObjectId(userId) } },
    { new: true }
  );
  return task;
};
