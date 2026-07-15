import { Request, Response } from 'express';
import Milestone from '../models/Milestone';
import { Task } from '../models/Task';

export const createMilestone = async (req: Request, res: Response) => {
  try {
    const { title, description, dueDate, dependencies, associatedTasks } = req.body;
    const startupId = req.startupId;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and due date are required.' });
    }

    const milestone = new Milestone({
      startupId,
      title,
      description,
      dueDate,
      dependencies: dependencies || [],
      associatedTasks: associatedTasks || [],
      progress: 0,
      riskIndicator: 'Low'
    });

    await milestone.save();
    res.status(201).json({ message: 'Milestone created successfully.', milestone });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create milestone.' });
  }
};

export const getMilestones = async (req: Request, res: Response) => {
  try {
    const milestones = await Milestone.find({ startupId: req.startupId })
      .populate('dependencies', 'title status')
      .populate('associatedTasks', 'title status estimatedHours actualHours')
      .sort({ dueDate: 1 });

    // Dynamically calculate progress based on associated tasks completion
    const updatedMilestones = await Promise.all(milestones.map(async (m) => {
      if (m.associatedTasks && m.associatedTasks.length > 0) {
        const tasks = await Task.find({ _id: { $in: m.associatedTasks } });
        const completed = tasks.filter(t => t.status === 'Done').length;
        m.progress = Math.round((completed / tasks.length) * 100);
        
        // Blocked risk calculation
        const unfinishedDependencies = await Task.find({
          _id: { $in: tasks.flatMap(t => t.dependencies) },
          status: { $ne: 'Done' }
        });
        
        if (unfinishedDependencies.length > 0 && m.status !== 'Completed') {
          m.status = 'Blocked';
          m.riskIndicator = 'High';
        } else {
          m.riskIndicator = m.progress < 30 && new Date(m.dueDate) < new Date(Date.now() + 7 * 24 * 3600 * 1000) ? 'Medium' : 'Low';
        }
        await m.save();
      }
      return m;
    }));

    res.status(200).json({ milestones: updatedMilestones });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve milestones.' });
  }
};

export const updateMilestone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const milestone = await Milestone.findOneAndUpdate(
      { _id: id, startupId: req.startupId },
      { $set: updates },
      { new: true }
    );

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found.' });
    }

    res.status(200).json({ message: 'Milestone updated.', milestone });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update milestone.' });
  }
};

export const deleteMilestone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const milestone = await Milestone.findOneAndDelete({ _id: id, startupId: req.startupId });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found.' });
    }

    res.status(200).json({ message: 'Milestone deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete milestone.' });
  }
};
