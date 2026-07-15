import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Task, TimeLog } from '../models/Task';
import Milestone from '../models/Milestone';
import { Member, User } from '../models/User';
import TaskHistory from '../models/TaskHistory';
import TaskComment from '../models/TaskComment';
import TaskActivity from '../models/TaskActivity';
import Notification from '../models/Notification';
import { getCache, setCache, invalidateCache } from '../services/cache';

// Helper to log task activities
const logActivity = async (taskId: string, userId: string, action: string, details?: string) => {
  try {
    const activity = new TaskActivity({ taskId, userId, action, details });
    await activity.save();
  } catch (err) {
    console.error('Failed to log task activity:', err);
  }
};

// Helper to trigger socket notifications
const triggerSocketNotification = (req: Request, event: string, room: string, data: any) => {
  const io = req.app.get('io');
  if (io) {
    io.to(room).emit(event, data);
  }
};

// Helper to create task notification
const createNotification = async (req: Request, receiverId: string, type: any, title: string, description: string) => {
  try {
    if (!req.user) return;
    const notification = new Notification({
      receiverId,
      senderId: req.user.id,
      type,
      title,
      description,
      isRead: false
    });
    await notification.save();
    
    // Emit real-time notification event via socket
    triggerSocketNotification(req, 'notification-received', `user_${receiverId}`, { notification });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

// ====================================================
// TASK CONTROLLERS
// ====================================================

// 0. Get My Tasks & Activities
export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication context not resolved.' });
    }

    // Find all tasks where this user is assigned
    const tasks = await Task.find({
      assignees: userId
    }).populate('assignees', 'fullName email avatarUrl');

    // Find recent activities for this user
    const activities = await TaskActivity.find({
      userId
    })
      .populate('userId', 'fullName')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      tasks,
      activities
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user tasks.' });
  }
};

// 1. Create Task (Founder / Co-Founder only)
export const createTask = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.startupId) {
      return res.status(401).json({ error: 'Unauthenticated.' });
    }

    // Role checks
    if (req.role !== 'Founder' && req.role !== 'Co-Founder') {
      return res.status(403).json({ error: 'Access Denied: Only Founders and Co-Founders can create tasks.' });
    }

    const { 
      workspaceId, 
      projectId, 
      milestoneId, 
      sprintId, 
      title, 
      description, 
      status, 
      priority, 
      assignees, 
      startDate, 
      dueDate, 
      estimatedHours, 
      labels, 
      tags, 
      dependencies, 
      checklist 
    } = req.body;

    // Field Validations
    if (!workspaceId || !projectId || !milestoneId || !title || !description || !dueDate) {
      return res.status(400).json({ error: 'Task Title, Description, Project, Milestone, and Due Date are required.' });
    }

    // Assignee validation
    if (!assignees || assignees.length === 0) {
      return res.status(400).json({ error: 'At least one assigned member is required.' });
    }

    // Check if deadline is a past date
    if (new Date(dueDate) < new Date(new Date().setHours(0,0,0,0))) {
      return res.status(400).json({ error: 'Deadline cannot be set to a past date.' });
    }

    // Check if Milestone exists and matches this startup
    const milestone = await Milestone.findOne({ _id: milestoneId, startupId: req.startupId });
    if (!milestone) {
      return res.status(404).json({ error: 'Target Milestone not found or does not belong to this startup.' });
    }

    // Verify each assignee is active member of startup
    for (const assigneeId of assignees) {
      const member = await Member.findOne({ userId: assigneeId, startupId: req.startupId });
      if (!member) {
        return res.status(400).json({ error: `Cannot assign removed member (User ID: ${assigneeId}).` });
      }
      
      const user = await User.findById(assigneeId);
      if (!user || user.status === 'Suspended') {
        return res.status(400).json({ error: `Cannot assign inactive or suspended user.` });
      }
    }

    const task = new Task({
      workspaceId,
      projectId,
      milestoneId,
      sprintId,
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      assignees,
      reporter: req.user.id,
      startDate,
      dueDate,
      estimatedHours,
      labels: labels || [],
      tags: tags || [],
      dependencies: dependencies || [],
      checklist: checklist || []
    });

    await task.save();

    // Map task to milestone associatedTasks list
    await Milestone.findByIdAndUpdate(milestoneId, { $addToSet: { associatedTasks: task._id } });

    // Invalidate task cache
    await invalidateCache(`tasks:w:${workspaceId}*`);

    // Log Activity
    await logActivity((task._id as Types.ObjectId).toString(), req.user.id, 'Task Created', `Task was created by ${req.user.fullName}`);

    // Create notifications and send socket events for all assignees
    for (const assigneeId of assignees) {
      await createNotification(
        req, 
        assigneeId, 
        'Task Assigned', 
        'New Task Assigned', 
        `You have been assigned to: "${title}"`
      );
    }

    // Emit live task created update
    triggerSocketNotification(req, 'task-created', workspaceId, { task });

    res.status(201).json({ message: 'Task created successfully.', task });
  } catch (error: any) {
    console.error('Failed to create task:', error);
    res.status(500).json({ error: error.message || 'Failed to create task.' });
  }
};

// 2. Fetch Tasks (All roles can query)
export const getTasks = async (req: Request, res: Response) => {
  try {
    const { workspaceId, projectId, milestoneId, sprintId, assigneeId, status, search, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (workspaceId) filter.workspaceId = workspaceId;
    if (projectId) filter.projectId = projectId;
    if (milestoneId) filter.milestoneId = milestoneId;
    if (sprintId) filter.sprintId = sprintId;
    if (assigneeId) filter.assignees = assigneeId;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Dynamic Redis Caching for performance
    const cacheKey = `tasks_filter:${JSON.stringify(filter)}_p:${pageNum}_l:${limitNum}`;
    const cachedTasks = await getCache(cacheKey);
    if (cachedTasks) {
      return res.status(200).json({ ...cachedTasks, fromCache: true });
    }

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('assignees', 'fullName email avatarUrl')
      .populate('reporter', 'fullName email avatarUrl')
      .populate('milestoneId', 'title status dueDate')
      .populate('dependencies', 'title status')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const response = {
      tasks,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    };

    await setCache(cacheKey, response, 120); // cache filters for 2 minutes

    res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve tasks.' });
  }
};

// 3. Get Task By ID (joins comments, history log, activities)
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate('assignees', 'fullName email avatarUrl')
      .populate('reporter', 'fullName email avatarUrl')
      .populate('milestoneId', 'title status dueDate')
      .populate('dependencies', 'title status');

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Retrieve comments
    const comments = await TaskComment.find({ taskId: id })
      .populate('author', 'fullName email avatarUrl')
      .populate('replies.author', 'fullName email avatarUrl')
      .sort({ createdAt: 1 });

    // Retrieve historical changes
    const history = await TaskHistory.find({ taskId: id })
      .populate('changedBy', 'fullName email avatarUrl')
      .sort({ createdAt: -1 });

    // Retrieve activity logs
    const activities = await TaskActivity.find({ taskId: id })
      .populate('userId', 'fullName email avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      task,
      comments,
      history,
      activities
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve task details.' });
  }
};

// 4. Edit Task Details (Founder / Co-Founder only)
export const updateTask = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.startupId) {
      return res.status(401).json({ error: 'Unauthenticated.' });
    }

    if (req.role !== 'Founder' && req.role !== 'Co-Founder') {
      return res.status(403).json({ error: 'Access Denied: Only Founders and Co-Founders can edit tasks.' });
    }

    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Validate deadline if updated
    if (updates.dueDate && new Date(updates.dueDate) < new Date(new Date().setHours(0,0,0,0))) {
      return res.status(400).json({ error: 'Deadline cannot be set to a past date.' });
    }

    // Record change history entries
    for (const key of Object.keys(updates)) {
      const oldVal = (task as any)[key];
      const newVal = updates[key];
      
      // Basic difference capture
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        const historyEntry = new TaskHistory({
          taskId: id,
          changedBy: req.user.id,
          field: key,
          oldValue: typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal || ''),
          newValue: typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal || '')
        });
        await historyEntry.save();
      }
    }

    // Handle assignee notifications
    if (updates.assignees && JSON.stringify(task.assignees) !== JSON.stringify(updates.assignees)) {
      for (const newAssigneeId of updates.assignees) {
        if (!task.assignees.includes(newAssigneeId)) {
          await createNotification(
            req, 
            newAssigneeId, 
            'Task Assigned', 
            'Task Reassigned', 
            `You have been newly assigned to task: "${task.title}"`
          );
        }
      }
    }

    // Invalidate caches
    await invalidateCache(`tasks:w:${task.workspaceId}*`);

    const updatedTask = await Task.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('assignees', 'fullName email avatarUrl')
      .populate('dependencies', 'title status');

    await logActivity(id, req.user.id, 'Task Edited', `Task properties were updated by ${req.user.fullName}`);

    // Trigger update socket
    triggerSocketNotification(req, 'task-updated', task.workspaceId.toString(), { task: updatedTask });

    res.status(200).json({ message: 'Task updated successfully.', task: updatedTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update task.' });
  }
};

// 5. Transition Task Status (Founder/Co-Founder, or Team Member if assigned)
export const transitionStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated.' });
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'Status is required.' });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    // Validate that intermediate transitions for Team Members only apply to tasks assigned to them
    const isAssigned = task.assignees.some((uid: any) => uid.toString() === req.user?.id);
    const isOwner = req.role === 'Founder' || req.role === 'Co-Founder';

    if (!isOwner && !isAssigned) {
      return res.status(403).json({ error: 'Forbidden: You can only transition status for tasks assigned to you.' });
    }

    // Prevent moving task to Under Review or Completed if dependency tasks are not finished yet
    if ((status === 'Completed' || status === 'Under Review' || status === 'Done') && task.dependencies.length > 0) {
      const unfinishedDeps = await Task.find({
        _id: { $in: task.dependencies },
        status: { $nin: ['Completed', 'Approved', 'Done'] }
      });
      if (unfinishedDeps.length > 0) {
        const titles = unfinishedDeps.map(t => `"${t.title}"`).join(', ');
        return res.status(400).json({ error: `Cannot transition task. It depends on unfinished task(s): ${titles}` });
      }
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    await logActivity(id, req.user.id, 'Status Changed', `Status updated from ${oldStatus} to ${status}`);

    // Record in History
    const historyEntry = new TaskHistory({
      taskId: id,
      changedBy: req.user.id,
      field: 'status',
      oldValue: oldStatus,
      newValue: status
    });
    await historyEntry.save();

    // Trigger Notification for Founder when assignee submits it for Review/Completion
    if ((status === 'Completed' || status === 'Under Review') && isAssigned) {
      // Find workspace founders
      const founders = await Member.find({ startupId: task.workspaceId, role: 'Founder' });
      for (const f of founders) {
        await createNotification(
          req, 
          f.userId.toString(), 
          'Task Updated', 
          'Task Needs Approval', 
          `Task "${task.title}" has been set to ${status} and is ready for review.`
        );
      }
    }

    // Invalidate caches
    await invalidateCache(`tasks:w:${task.workspaceId}*`);

    // Emit live updates
    triggerSocketNotification(req, 'task-status-changed', task.workspaceId.toString(), { taskId: id, status, oldStatus });

    res.status(200).json({ message: 'Task status updated.', task });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to transition task status.' });
  }
};

// 6. Approve Task (Founder / Co-Founder only)
export const approveTask = async (req: Request, res: Response) => {
  try {
    if (!req.user || (req.role !== 'Founder' && req.role !== 'Co-Founder')) {
      return res.status(403).json({ error: 'Access Denied: Only founders can approve tasks.' });
    }

    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const oldStatus = task.status;
    task.status = 'Approved';
    await task.save();

    await logActivity(id, req.user.id, 'Task Approved', `Task was approved by founder: ${req.user.fullName}`);
    
    // Notify assignees
    for (const assigneeId of task.assignees) {
      await createNotification(
        req, 
        assigneeId.toString(), 
        'Idea Approved', // maps to existing enum in Notification.ts
        'Task Approved', 
        `Your task "${task.title}" has been approved by the founder!`
      );
    }

    await invalidateCache(`tasks:w:${task.workspaceId}*`);
    triggerSocketNotification(req, 'task-approved', task.workspaceId.toString(), { taskId: id });

    res.status(200).json({ message: 'Task approved successfully.', task });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Approval failed.' });
  }
};

// 7. Reject / Request changes for Task (Founder / Co-Founder only)
export const rejectTask = async (req: Request, res: Response) => {
  try {
    if (!req.user || (req.role !== 'Founder' && req.role !== 'Co-Founder')) {
      return res.status(403).json({ error: 'Access Denied: Only founders can request task changes.' });
    }

    const { id } = req.params;
    const { comments } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const oldStatus = task.status;
    task.status = 'Rejected';
    await task.save();

    await logActivity(id, req.user.id, 'Task Rejected', `Task changes requested: ${comments || 'No comment provided'}`);

    // Create comments context
    if (comments) {
      const comment = new TaskComment({
        taskId: id,
        author: req.user.id,
        content: `Changes Requested: ${comments}`,
        replies: []
      });
      await comment.save();
    }

    // Notify assignees
    for (const assigneeId of task.assignees) {
      await createNotification(
        req, 
        assigneeId.toString(), 
        'Task Updated', 
        'Changes Requested on Task', 
        `Founder requested modifications for: "${task.title}"`
      );
    }

    await invalidateCache(`tasks:w:${task.workspaceId}*`);
    triggerSocketNotification(req, 'task-rejected', task.workspaceId.toString(), { taskId: id, comment: comments });

    res.status(200).json({ message: 'Task set to changes requested.', task });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Rejection failed.' });
  }
};

// 8. Delete Task (Founder / Co-Founder only)
export const deleteTask = async (req: Request, res: Response) => {
  try {
    if (!req.user || (req.role !== 'Founder' && req.role !== 'Co-Founder')) {
      return res.status(403).json({ error: 'Access Denied: Only founders can delete tasks.' });
    }

    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    // Clean references
    await Task.findByIdAndDelete(id);
    await TaskComment.deleteMany({ taskId: id });
    await TaskActivity.deleteMany({ taskId: id });
    await TaskHistory.deleteMany({ taskId: id });
    await TimeLog.deleteMany({ taskId: id });

    // Remove from milestones lists
    if (task.milestoneId) {
      await Milestone.findByIdAndUpdate(task.milestoneId, { $pull: { associatedTasks: id } });
    }

    await invalidateCache(`tasks:w:${task.workspaceId}*`);

    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Deletion failed.' });
  }
};

// 9. Add Task Comment & Replies (Founder/Co-Founder, Mentor, Assigned Member)
export const addComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated.' });
    const { id } = req.params; // taskId
    const { content, replyToId, attachments } = req.body;

    if (!content) return res.status(400).json({ error: 'Comment body cannot be empty.' });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const isAssigned = task.assignees.some((uid: any) => uid.toString() === req.user?.id);
    const isOwner = req.role === 'Founder' || req.role === 'Co-Founder';
    const isMentor = req.role === 'Mentor';

    if (!isOwner && !isAssigned && !isMentor) {
      return res.status(403).json({ error: 'Forbidden: You do not have permissions to comment on this task.' });
    }

    if (replyToId) {
      // Find comment and push to replies array
      const comment = await TaskComment.findById(replyToId);
      if (!comment) return res.status(404).json({ error: 'Parent comment thread not found.' });

      comment.replies.push({
        _id: new Types.ObjectId() as any,
        author: req.user.id as any,
        content,
        createdAt: new Date()
      });

      await comment.save();

      // Notify parent comment author if it's someone else
      if (comment.author.toString() !== req.user.id) {
        await createNotification(
          req,
          comment.author.toString(),
          'Mention',
          'New Reply on Task Comment',
          `User ${req.user.fullName} replied to your thread in: "${task.title}"`
        );
      }

      await logActivity(id, req.user.id, 'Comment Added', `Replied to comment thread`);
      res.status(201).json({ message: 'Reply posted.', comment });
    } else {
      const comment = new TaskComment({
        taskId: id,
        author: req.user.id,
        content,
        attachments: attachments || [],
        replies: []
      });

      await comment.save();

      // Scan content for @Mentions to send notification
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      while ((match = mentionRegex.exec(content)) !== null) {
        const mentionedUserId = match[2];
        if (mentionedUserId !== req.user.id) {
          await createNotification(
            req,
            mentionedUserId,
            'Mention',
            'Mentioned in Task Comment',
            `You were mentioned by ${req.user.fullName} on: "${task.title}"`
          );
        }
      }

      await logActivity(id, req.user.id, 'Comment Added', `Added a new task discussion comment`);
      res.status(201).json({ message: 'Comment posted.', comment });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Comment failed.' });
  }
};

// 10. Add Task Attachment
export const addAttachment = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated.' });
    const { id } = req.params;
    const { name, url } = req.body;

    if (!name || !url) return res.status(400).json({ error: 'Attachment name and URL are required.' });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const isAssigned = task.assignees.some((uid: any) => uid.toString() === req.user?.id);
    const isOwner = req.role === 'Founder' || req.role === 'Co-Founder';

    if (!isOwner && !isAssigned) {
      return res.status(403).json({ error: 'Forbidden: You can only upload files to tasks you own or are assigned to.' });
    }

    const attachmentItem = {
      name,
      url,
      uploadedBy: req.user.id as any,
      createdAt: new Date()
    };

    task.attachments.push(attachmentItem);
    await task.save();

    await logActivity(id, req.user.id, 'Attachment Uploaded', `File attachment: "${name}" was uploaded`);
    await invalidateCache(`tasks:w:${task.workspaceId}*`);

    res.status(201).json({ message: 'Attachment added.', attachments: task.attachments });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Upload failed.' });
  }
};

// 11. Update Checklist Progress
export const toggleChecklistItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated.' });
    const { id } = req.params; // taskId
    const { checklistItemId, isCompleted } = req.body;

    if (!checklistItemId) return res.status(400).json({ error: 'checklistitem id is required.' });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const isAssigned = task.assignees.some((uid: any) => uid.toString() === req.user?.id);
    const isOwner = req.role === 'Founder' || req.role === 'Co-Founder';

    if (!isOwner && !isAssigned) {
      return res.status(403).json({ error: 'Forbidden: You do not have permissions to toggle checklists on this task.' });
    }

    const checklistItem = task.checklist.find(item => (item as any)._id.toString() === checklistItemId);
    if (!checklistItem) {
      return res.status(404).json({ error: 'Checklist item not found.' });
    }

    checklistItem.isCompleted = isCompleted;
    checklistItem.completedBy = isCompleted ? (req.user.id as any) : undefined;
    checklistItem.completedAt = isCompleted ? new Date() : undefined;

    await task.save();

    await logActivity(
      id, 
      req.user.id, 
      'Checklist Completed', 
      `Checklist item "${checklistItem.item}" marked ${isCompleted ? 'complete' : 'incomplete'}`
    );

    // Notify founders if checklist completed
    const allCompleted = task.checklist.every(item => item.isCompleted);
    if (allCompleted && isCompleted) {
      const founders = await Member.find({ startupId: task.workspaceId, role: 'Founder' });
      for (const f of founders) {
        await createNotification(
          req,
          f.userId.toString(),
          'Task Updated',
          'Task Checklist Completed',
          `All checklist items are completed on task: "${task.title}"`
        );
      }
    }

    await invalidateCache(`tasks:w:${task.workspaceId}*`);

    res.status(200).json({ message: 'Checklist status updated.', task });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Checklist update failed.' });
  }
};
