import { Request, Response } from 'express';
import { Project, Sprint } from '../models/Project';
import { Task } from '../models/Task';
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
