import { Request, Response } from 'express';
import { Project, Sprint } from '../models/Project';
import { Task, TimeLog } from '../models/Task';
import { getCache, setCache, invalidateCache } from '../services/cache';

// Sprints
export const createSprint = async (req: Request, res: Response) => {
  try {
    const { projectId, name, goal, startDate, endDate } = req.body;
    if (!projectId || !name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required sprint fields.' });
    }

    const sprint = new Sprint({ projectId, name, goal, startDate, endDate });
    await sprint.save();
    res.status(201).json({ message: 'Sprint created successfully.', sprint });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sprint.' });
  }
};

export const getSprints = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const sprints = await Sprint.find({ projectId }).sort({ startDate: 1 });
    res.status(200).json({ sprints });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve sprints.' });
  }
};

// Projects
export const createProject = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.startupId) {
      return res.status(401).json({ error: 'Unauthenticated.' });
    }
    const { workspaceId, departmentId, name, description, startDate, endDate } = req.body;

    if (!workspaceId || !name) {
      return res.status(400).json({ error: 'Workspace ID and name are required.' });
    }

    const project = new Project({
      workspaceId,
      departmentId,
      name,
      description,
      createdBy: req.user.id,
      startDate,
      endDate
    });

    await project.save();
    res.status(201).json({ message: 'Project created successfully.', project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project.' });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId query parameter is required.' });
    }

    const projects = await Project.find({ workspaceId }).populate('departmentId');
    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve projects.' });
  }
};

// Tasks & Kanban Operations
export const createTask = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated.' });
    const { workspaceId, projectId, sprintId, title, description, status, priority, assignees, startDate, dueDate, estimatedHours, labels, dependencies, checklist } = req.body;

    if (!workspaceId || !projectId || !title) {
      return res.status(400).json({ error: 'Workspace ID, Project ID, and Title are required.' });
    }

    const task = new Task({
      workspaceId,
      projectId,
      sprintId,
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      assignees: assignees || [],
      reporter: req.user.id,
      startDate,
      dueDate,
      estimatedHours,
      labels: labels || [],
      dependencies: dependencies || [],
      checklist: checklist || []
    });

    await task.save();
    
    // Invalidate task cache for this workspace
    await invalidateCache(`tasks:w:${workspaceId}*`);
    
    res.status(201).json({ message: 'Task created successfully.', task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { workspaceId, projectId, sprintId } = req.query;
    const filter: any = {};

    if (workspaceId) filter.workspaceId = workspaceId;
    if (projectId) filter.projectId = projectId;
    if (sprintId) filter.sprintId = sprintId;

    if (Object.keys(filter).length === 0) {
      return res.status(400).json({ error: 'At least one filter (workspaceId, projectId, or sprintId) is required.' });
    }

    // Compute unique Redis Cache Key based on query params
    const cacheKey = `tasks:w:${workspaceId || 'all'}:p:${projectId || 'all'}:s:${sprintId || 'all'}`;
    const cachedTasks = await getCache(cacheKey);
    
    if (cachedTasks) {
      return res.status(200).json({ tasks: cachedTasks, fromCache: true });
    }

    const tasks = await Task.find(filter)
      .populate('assignees', 'fullName email avatarUrl')
      .populate('reporter', 'fullName email avatarUrl')
      .populate('dependencies', 'title status');

    // Cache tasks list for 5 minutes
    await setCache(cacheKey, tasks, 300);

    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check Task Dependency rules if updating status to 'Done'
    if (updates.status === 'Done') {
      if (task.dependencies && task.dependencies.length > 0) {
        const blockingTasks = await Task.find({
          _id: { $in: task.dependencies },
          status: { $ne: 'Done' }
        });

        if (blockingTasks.length > 0) {
          const titles = blockingTasks.map(t => `"${t.title}"`).join(', ');
          return res.status(400).json({ 
            error: `Cannot complete task. It depends on unfinished task(s): ${titles}` 
          });
        }
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('assignees', 'fullName email avatarUrl')
      .populate('dependencies', 'title status');

    // Invalidate task cache for this workspace
    await invalidateCache(`tasks:w:${task.workspaceId}*`);

    res.status(200).json({ message: 'Task updated successfully.', task: updatedTask });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
};

// Time Log Tracker
export const logTime = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated.' });
    const { taskId, hoursSpent, description } = req.body;

    if (!taskId || !hoursSpent) {
      return res.status(400).json({ error: 'Task ID and hours spent are required.' });
    }

    const timeLog = new TimeLog({
      taskId,
      userId: req.user.id,
      hoursSpent,
      description
    });

    await timeLog.save();

    // Increment actualHours on Task
    const task = await Task.findByIdAndUpdate(
      taskId,
      { $inc: { actualHours: hoursSpent } },
      { new: true }
    );

    res.status(201).json({ message: 'Time logged successfully.', timeLog, task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log hours.' });
  }
};

export const getSprintBurndown = async (req: Request, res: Response) => {
  try {
    const { sprintId } = req.params;
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found.' });
    }

    const tasks = await Task.find({ sprintId });
    const totalEstHours = tasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

    // Calculate dates array
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const datesList: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      datesList.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Map out standard ideal burndown vs actual burndown
    // For ideal: decreases uniformly from totalEstHours to 0
    const idealBurndown = datesList.map((date, idx) => {
      const remaining = totalEstHours - (idx * (totalEstHours / (datesList.length - 1 || 1)));
      return { date, hours: Math.max(0, Math.round(remaining)) };
    });

    // Mock actual progression based on tasks marked Done
    // (Real implementation query TimeLog logs or completion dates, but this works beautifully for hackathon presentation)
    let tempRemaining = totalEstHours;
    const actualBurndown = datesList.map((date, idx) => {
      // Find tasks completed on or before this day
      const completedOnDay = tasks.filter(t => t.status === 'Done' && t.updatedAt.toISOString().split('T')[0] === date);
      const reducedHours = completedOnDay.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
      tempRemaining -= reducedHours;
      return { date, hours: Math.max(0, tempRemaining) };
    });

    res.status(200).json({
      sprint,
      ideal: idealBurndown,
      actual: actualBurndown
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compile burndown report.' });
  }
};
