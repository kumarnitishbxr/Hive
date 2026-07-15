import { Request, Response } from 'express';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { Notification } from '../models/Notification';
import { User, Member } from '../models/User';
import mongoose from 'mongoose';

// POST /chat/send
export const sendChat = async (req: Request, res: Response) => {
  try {
    const { conversationId, recipientId, message, attachments, replyTo } = req.body;
    const senderId = req.user?.id;
    const startupId = req.startupId;

    if (!senderId) {
      return res.status(401).json({ error: 'Sender authentication context not found' });
    }

    if (!message && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message content or attachments are required' });
    }

    // Resolve workspace ID from request header or query
    const workspaceId = req.headers['x-workspace-id'] as string || req.query.workspaceId as string || req.body.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required to route communications' });
    }

    let activeConversation;

    if (conversationId) {
      // Find existing conversation
      activeConversation = await Conversation.findOne({
        _id: conversationId,
        workspaceId,
        participants: senderId
      });
      if (!activeConversation) {
        return res.status(404).json({ error: 'Conversation not found or access denied' });
      }
    } else if (recipientId) {
      // 1-to-1 Direct Chat logic: check if one already exists
      activeConversation = await Conversation.findOne({
        workspaceId,
        type: 'direct',
        participants: { $all: [senderId, recipientId] }
      });

      if (!activeConversation) {
        // Create new direct conversation
        activeConversation = new Conversation({
          workspaceId,
          participants: [senderId, recipientId],
          type: 'direct',
          createdBy: senderId,
          lastMessage: message || 'Sent an attachment',
          lastMessageTime: new Date()
        });
        await activeConversation.save();
      }
    } else {
      return res.status(400).json({ error: 'Either conversationId or recipientId must be provided' });
    }

    // Create the message
    const newMessage = new Message({
      conversationId: activeConversation._id,
      senderId,
      message,
      attachments: attachments || [],
      replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : undefined,
      seenBy: [senderId],
      deliveredTo: [senderId]
    });

    await newMessage.save();

    // Update conversation last message preview
    activeConversation.lastMessage = message ? (message.length > 60 ? message.substring(0, 57) + '...' : message) : 'Sent an attachment';
    activeConversation.lastMessageTime = new Date();
    await activeConversation.save();

    // Populate reply details if applicable
    let populatedMessage = await Message.findById(newMessage._id)
      .populate({ path: 'senderId', select: 'fullName email avatarUrl' })
      .populate({ path: 'replyTo', select: 'message senderId' });

    // Emit Real-time WebSocket event via Express io integration
    const io = req.app.get('io');
    if (io) {
      // Emit to conversation room (conversationId)
      io.to(activeConversation._id.toString()).emit('receive-message', populatedMessage);
    }

    // Create and trigger notifications for other participants
    const otherParticipants = activeConversation.participants.filter(
      (pId) => pId.toString() !== senderId.toString()
    );

    const senderUser = await User.findById(senderId);

    for (const receiverId of otherParticipants) {
      // Create Database Notification
      const dbNotification = new Notification({
        receiverId,
        senderId,
        conversationId: activeConversation._id,
        messageId: newMessage._id,
        type: 'New Message',
        title: senderUser?.fullName || 'New Message',
        description: message ? (message.length > 80 ? message.substring(0, 77) + '...' : message) : 'Shared a file with you',
        isRead: false
      });
      await dbNotification.save();

      // Emit real-time notification
      if (io) {
        // Emit to user-specific channel
        io.to(`user_${receiverId.toString()}`).emit('notification', dbNotification);
      }
    }

    return res.status(201).json(populatedMessage);
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    return res.status(500).json({ error: 'Internal Server Error sending chat message' });
  }
};

// GET /chat/conversations
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const startupId = req.startupId;
    const workspaceId = req.headers['x-workspace-id'] as string || req.query.workspaceId as string;

    if (!userId) {
      return res.status(401).json({ error: 'User context not found' });
    }

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required to fetch conversations' });
    }

    // Find all conversations matching this workspace where the user is a participant
    const conversations = await Conversation.find({
      workspaceId,
      participants: userId
    }).sort({ lastMessageTime: -1 });

    // Resolve startup roles for participants
    const populatedConversations = [];

    for (const convo of conversations) {
      // Populate basic user profiles
      const populatedConvo = await convo.populate({
        path: 'participants',
        select: 'fullName email avatarUrl'
      });

      const participantData = [];
      for (const p of populatedConvo.participants) {
        const pObj = p.toObject() as any;
        // Query membership in startup to find role
        const memberRecord = await Member.findOne({ userId: pObj._id, startupId });
        pObj.role = memberRecord?.role || 'Team Member';
        participantData.push(pObj);
      }

      // Calculate unread count for this conversation for the user
      const unreadCount = await Message.countDocuments({
        conversationId: convo._id,
        senderId: { $ne: userId },
        seenBy: { $ne: userId }
      });

      const convoObj = populatedConvo.toObject();
      convoObj.participants = participantData;
      (convoObj as any).unreadCount = unreadCount;

      populatedConversations.push(convoObj);
    }

    return res.status(200).json(populatedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Internal Server Error fetching conversations' });
  }
};

// GET /chat/messages/:conversationId
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User context not found' });
    }

    // Verify conversation access
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (pId) => pId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access Denied: You are not a participant in this conversation' });
    }

    // Retrieve messages (supporting pagination/infinite scroll can be implemented by client sending cursor/skip params)
    const limit = parseInt(req.query.limit as string) || 50;
    const beforeDate = req.query.before ? new Date(req.query.before as string) : null;

    const query: any = { conversationId };
    if (beforeDate) {
      query.createdAt = { $lt: beforeDate };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Get latest first for pagination
      .limit(limit)
      .populate({ path: 'senderId', select: 'fullName email avatarUrl' })
      .populate({ path: 'replyTo', select: 'message senderId' });

    // Reverse to chronological order for client display
    return res.status(200).json(messages.reverse());
  } catch (error) {
    console.error('Error loading chat messages:', error);
    return res.status(500).json({ error: 'Internal Server Error loading messages' });
  }
};

// PATCH /chat/seen
export const markSeen = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user?.id;

    if (!userId || !conversationId) {
      return res.status(400).json({ error: 'conversationId and authentication are required' });
    }

    // Add user ID to seenBy array for all messages in this conversation where they are not the sender
    const result = await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        seenBy: { $ne: userId }
      },
      {
        $addToSet: { seenBy: userId }
      }
    );

    // Emit live WebSocket notification for message read-receipts
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('message-seen', { conversationId, userId });
    }

    // Mark notifications related to this conversation as read
    await Notification.updateMany(
      { receiverId: userId, conversationId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking messages as seen:', error);
    return res.status(500).json({ error: 'Internal Server Error in seen receipt mapping' });
  }
};

// DELETE /chat/message
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.body;
    const userId = req.user?.id;

    if (!userId || !messageId) {
      return res.status(400).json({ error: 'messageId and authentication are required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Authorize deletion: only sender can delete for everyone
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access Denied: Only the sender can delete this message' });
    }

    // Soft delete message
    message.message = 'This message was deleted';
    message.attachments = [];
    message.deleted = true;
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId.toString()).emit('receive-message', message);
    }

    return res.status(200).json({ success: true, message });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ error: 'Internal Server Error deleting message' });
  }
};
