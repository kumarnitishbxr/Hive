import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { User } from '../models/User';

// POST /notification/create
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { receiverId, conversationId, messageId, type, title, description } = req.body;
    const senderId = req.user?.id;

    if (!senderId || !receiverId || !type || !title || !description) {
      return res.status(400).json({ error: 'sender, receiver, type, title, and description are required' });
    }

    const notification = new Notification({
      receiverId,
      senderId,
      conversationId,
      messageId,
      type,
      title,
      description,
      isRead: false
    });

    await notification.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId.toString()}`).emit('notification', notification);
    }

    return res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ error: 'Internal Server Error creating notification' });
  }
};

// GET /notification
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User context not found' });
    }

    // Load recent notifications
    const notifications = await Notification.find({ receiverId: userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate({ path: 'senderId', select: 'fullName email avatarUrl' });

    // Separate into Today, Yesterday, and Earlier
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    const categorized = {
      today: [] as any[],
      yesterday: [] as any[],
      earlier: [] as any[]
    };

    for (const notif of notifications) {
      const createdTime = new Date(notif.createdAt).getTime();
      if (createdTime >= startOfToday.getTime()) {
        categorized.today.push(notif);
      } else if (createdTime >= startOfYesterday.getTime()) {
        categorized.yesterday.push(notif);
      } else {
        categorized.earlier.push(notif);
      }
    }

    const unreadCount = await Notification.countDocuments({ receiverId: userId, isRead: false });

    return res.status(200).json({
      notifications: categorized,
      unreadCount
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json({ error: 'Internal Server Error getting notifications' });
  }
};

// PATCH /notification/read/:id
export const markRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User context not found' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, receiverId: userId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }

    return res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Internal Server Error marking notification read' });
  }
};

// PATCH /notification/read-all
export const markAllRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User context not found' });
    }

    await Notification.updateMany(
      { receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return res.status(500).json({ error: 'Internal Server Error marking all read' });
  }
};
