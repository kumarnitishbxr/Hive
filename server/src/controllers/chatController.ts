import { Request, Response } from 'express';
import { Conversation } from '../models/Conversation';
import { ConversationParticipant } from '../models/ConversationParticipant';
import { Message } from '../models/Message';
import { MessageStatus } from '../models/MessageStatus';
import { User, Member } from '../models/User';
import { Workspace } from '../models/Workspace';
import mongoose from 'mongoose';

// Helper to auto-create and subscribe members to Default General Chat
const resolveGeneralChat = async (workspaceId: string, startupId: string) => {
  let generalChat = await Conversation.findOne({
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    type: 'group',
    name: 'General'
  });

  if (!generalChat) {
    // Resolve founder/creator
    const workspaceObj = await Workspace.findById(workspaceId);
    const creatorId = workspaceObj?.createdBy || new mongoose.Types.ObjectId();

    generalChat = new Conversation({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      type: 'group',
      private: false,
      group: true,
      announcement: false,
      name: 'General',
      createdBy: creatorId,
      lastMessage: 'Welcome to the General workspace chat!',
      lastActivity: new Date()
    });
    await generalChat.save();
  }

  // Subscribe all active workspace members who aren't yet subscribed
  const members = await Member.find({ startupId, status: 'Active' });
  for (const m of members) {
    const roleMapping = m.role === 'Founder' || m.role === 'Co-Founder'
      ? m.role
      : (m.role === 'Mentor' ? 'Mentor' : 'Team Member');

    await ConversationParticipant.findOneAndUpdate(
      { conversationId: generalChat._id, userId: m.userId },
      {
        $setOnInsert: {
          role: roleMapping,
          joinedAt: m.joinedAt || new Date(),
          isActive: true
        }
      },
      { upsert: true }
    );
  }

  return generalChat;
};

// GET /chat/conversations
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const startupId = req.startupId;

    if (!userId || !startupId) {
      return res.status(401).json({ error: 'User workspace context not resolved' });
    }

    const workspace = await Workspace.findOne({ startupId }).sort({ createdAt: 1 });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Resolve general chat and update membership list dynamically
    await resolveGeneralChat(workspace._id.toString(), startupId);

    // Fetch active conversation IDs for user
    const memberships = await ConversationParticipant.find({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true
    });
    const convoIds = memberships.map(m => m.conversationId);

    // Find all matching conversations in workspace
    const conversations = await Conversation.find({
      _id: { $in: convoIds },
      workspaceId: workspace._id,
      isArchived: false
    }).sort({ lastActivity: -1 });

    const result = [];
    for (const convo of conversations) {
      const convoMembership = memberships.find(m => m.conversationId.toString() === convo._id.toString());
      if (!convoMembership) continue;

      // Fetch participants
      const participants = await ConversationParticipant.find({
        conversationId: convo._id,
        isActive: true
      });
      const participantUserIds = participants.map(p => p.userId);
      const participantUsers = await User.find({ _id: { $in: participantUserIds } }, 'fullName email avatarUrl status');

      const participantDetails = participants.map(p => {
        const u = participantUsers.find(user => user._id.toString() === p.userId.toString());
        return {
          _id: p.userId,
          fullName: u?.fullName || 'Removed User',
          email: u?.email || '',
          avatarUrl: u?.avatarUrl || '',
          status: u?.status || 'Offline',
          role: p.role
        };
      });

      // Calculate unread count
      let unreadQuery: any = {
        conversationId: convo._id,
        senderId: { $ne: new mongoose.Types.ObjectId(userId) }
      };

      if (convoMembership.lastReadMessageId) {
        const lastReadMsg = await Message.findById(convoMembership.lastReadMessageId);
        if (lastReadMsg) {
          unreadQuery.createdAt = { $gt: lastReadMsg.createdAt };
        }
      }

      const unreadCount = await Message.countDocuments(unreadQuery);

      result.push({
        ...convo.toObject(),
        participants: participantDetails,
        unreadCount
      });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Failed to get conversations:', error);
    return res.status(500).json({ error: error.message || 'Failed to get conversations' });
  }
};

// GET /chat/:conversationId
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const membership = await ConversationParticipant.findOne({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied: You are not an active participant in this chat.' });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const before = req.query.before as string;

    const query: any = { conversationId: new mongoose.Types.ObjectId(conversationId) };
    if (before) {
      const beforeMsg = await Message.findById(before);
      if (beforeMsg) {
        query.createdAt = { $lt: beforeMsg.createdAt };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'fullName email avatarUrl')
      .populate('replyTo', 'content senderId');

    const result = [];
    for (const msg of messages) {
      // Find read receipts/ticks
      const statuses = await MessageStatus.find({ messageId: msg._id });
      
      let status: 'SENT' | 'DELIVERED' | 'SEEN' = 'SENT';
      const recipientsCount = await ConversationParticipant.countDocuments({
        conversationId: msg.conversationId,
        userId: { $ne: msg.senderId },
        isActive: true
      });

      if (recipientsCount > 0) {
        const seenCount = statuses.filter(s => s.status === 'SEEN').length;
        const deliveredCount = statuses.filter(s => s.status === 'DELIVERED').length;

        if (seenCount >= recipientsCount) {
          status = 'SEEN';
        } else if (deliveredCount >= recipientsCount) {
          status = 'DELIVERED';
        }
      }

      result.push({
        ...msg.toObject(),
        status
      });
    }

    return res.status(200).json(result.reverse());
  } catch (error: any) {
    console.error('Failed to retrieve messages:', error);
    return res.status(500).json({ error: error.message || 'Failed to retrieve messages' });
  }
};

// POST /chat/private
export const createPrivateChat = async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user?.id;
    const startupId = req.startupId;

    if (!userId || !recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required.' });
    }

    const workspace = await Workspace.findOne({ startupId }).sort({ createdAt: 1 });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    // Resolve common direct conversations
    const userConvos = await ConversationParticipant.find({ userId: new mongoose.Types.ObjectId(userId) }).distinct('conversationId');
    const recipientConvos = await ConversationParticipant.find({ userId: new mongoose.Types.ObjectId(recipientId) }).distinct('conversationId');
    const commonIds = userConvos.filter(c => recipientConvos.map(tc => tc.toString()).includes(c.toString()));

    let convo = await Conversation.findOne({
      _id: { $in: commonIds },
      workspaceId: workspace._id,
      type: 'direct'
    });

    if (convo) {
      return res.status(200).json(convo);
    }

    // Create new direct convo
    convo = new Conversation({
      workspaceId: workspace._id,
      type: 'direct',
      private: true,
      group: false,
      announcement: false,
      createdBy: new mongoose.Types.ObjectId(userId),
      lastMessage: 'Direct chat initialized.',
      lastActivity: new Date()
    });
    await convo.save();

    // Map roles
    const userMember = await Member.findOne({ userId, startupId });
    if (!userMember) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this workspace.' });
    }
    const userRole = userMember.role;

    const recMember = await Member.findOne({ userId: recipientId, startupId });
    if (!recMember) {
      return res.status(400).json({ error: 'Recipient is not a member of this workspace.' });
    }
    const recRole = recMember.role;

    await ConversationParticipant.create([
      {
        conversationId: convo._id,
        userId: new mongoose.Types.ObjectId(userId),
        role: userRole,
        isActive: true
      },
      {
        conversationId: convo._id,
        userId: new mongoose.Types.ObjectId(recipientId),
        role: recRole,
        isActive: true
      }
    ]);

    return res.status(201).json(convo);
  } catch (error: any) {
    console.error('Failed to create private chat:', error);
    return res.status(500).json({ error: error.message || 'Failed to create private chat' });
  }
};

// POST /chat/group
export const createGroupChat = async (req: Request, res: Response) => {
  try {
    const { name, description, participants } = req.body; // participants is array of userIds
    const userId = req.user?.id;
    const startupId = req.startupId;

    if (!userId || !name || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ error: 'Name and participants list are required.' });
    }

    const workspace = await Workspace.findOne({ startupId }).sort({ createdAt: 1 });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    const convo = new Conversation({
      workspaceId: workspace._id,
      type: 'group',
      private: true,
      group: true,
      announcement: false,
      name,
      description,
      createdBy: new mongoose.Types.ObjectId(userId),
      lastMessage: 'Group created.',
      lastActivity: new Date()
    });
    await convo.save();

    // Add creator
    const creatorMember = await Member.findOne({ userId, startupId });
    if (!creatorMember) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this workspace.' });
    }
    const creatorRole = creatorMember.role;

    await ConversationParticipant.create({
      conversationId: convo._id,
      userId: new mongoose.Types.ObjectId(userId),
      role: creatorRole,
      isActive: true
    });

    // Add other participants
    for (const pId of participants) {
      if (pId === userId) continue;
      const m = await Member.findOne({ userId: pId, startupId });
      if (!m) {
        return res.status(400).json({ error: `User ${pId} is not a member of this workspace.` });
      }
      const role = m.role;

      await ConversationParticipant.findOneAndUpdate(
        { conversationId: convo._id, userId: new mongoose.Types.ObjectId(pId) },
        {
          $set: {
            role,
            isActive: true,
            joinedAt: new Date()
          }
        },
        { upsert: true }
      );
    }

    return res.status(201).json(convo);
  } catch (error: any) {
    console.error('Failed to create group chat:', error);
    return res.status(500).json({ error: error.message || 'Failed to create group chat' });
  }
};

// POST /chat/message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId, content, messageType, text, image, file, voice, replyTo } = req.body;
    const userId = req.user?.id;

    if (!userId || !conversationId || !content) {
      return res.status(400).json({ error: 'Conversation ID and message content are required.' });
    }

    const convo = await Conversation.findById(conversationId);
    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Verify membership
    const membership = await ConversationParticipant.findOne({
      conversationId: convo._id,
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true
    });
    if (!membership) {
      return res.status(403).json({ error: 'Access denied: You are not a participant in this conversation.' });
    }

    const msg = new Message({
      conversationId: convo._id,
      senderId: new mongoose.Types.ObjectId(userId),
      content,
      messageType: messageType || 'text',
      text,
      image,
      file,
      voice,
      replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : undefined
    });
    await msg.save();

    // Update conversation last activity
    convo.lastMessage = content.length > 60 ? content.substring(0, 57) + '...' : content;
    convo.lastActivity = new Date();
    await convo.save();

    // Update lastReadMessageId for sender
    membership.lastReadMessageId = msg._id;
    await membership.save();

    // Populate sender info for Socket.io emit
    const populated = await Message.findById(msg._id)
      .populate('senderId', 'fullName email avatarUrl')
      .populate('replyTo', 'content senderId');

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId.toString()).emit('receive-message', populated);
    }

    return res.status(201).json(populated);
  } catch (error: any) {
    console.error('Failed to send message:', error);
    return res.status(500).json({ error: error.message || 'Failed to send message' });
  }
};

// PATCH /chat/message/:id
export const editMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;
    const startupId = req.startupId;

    if (!userId || !content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const msg = await Message.findById(id);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    const convo = await Conversation.findById(msg.conversationId);
    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Verify conversation workspace belongs to the user's active startup tenant
    const workspace = await Workspace.findOne({ _id: convo.workspaceId, startupId });
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied: Message is not in your startup workspace.' });
    }

    const minutesElapsed = (Date.now() - msg.createdAt.getTime()) / 60000;
    const actorMember = await Member.findOne({ userId, startupId });

    const isFounder = actorMember?.role === 'Founder' || actorMember?.role === 'Co-Founder';
    const isSender = msg.senderId.toString() === userId.toString();

    if (!isSender && !isFounder) {
      return res.status(403).json({ error: 'Permission denied.' });
    }

    if (!isFounder && minutesElapsed > 15) {
      return res.status(403).json({ error: 'Edit time limit (15 minutes) exceeded.' });
    }

    msg.content = content;
    msg.edited = true;
    await msg.save();

    const populated = await Message.findById(msg._id)
      .populate('senderId', 'fullName email avatarUrl')
      .populate('replyTo', 'content senderId');

    const io = req.app.get('io');
    if (io) {
      io.to(msg.conversationId.toString()).emit('message-edited', populated);
    }

    return res.status(200).json(populated);
  } catch (error: any) {
    console.error('Failed to edit message:', error);
    return res.status(500).json({ error: error.message || 'Failed to edit message' });
  }
};

// DELETE /chat/message/:id
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mode } = req.body; // 'everyone' or 'me'
    const userId = req.user?.id;
    const startupId = req.startupId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const msg = await Message.findById(id);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    const convo = await Conversation.findById(msg.conversationId);
    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Verify conversation workspace belongs to the user's active startup tenant
    const workspace = await Workspace.findOne({ _id: convo.workspaceId, startupId });
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied: Message is not in your startup workspace.' });
    }

    if (mode === 'everyone') {
      const minutesElapsed = (Date.now() - msg.createdAt.getTime()) / 60000;
      const actorMember = await Member.findOne({ userId, startupId });
      const isFounder = actorMember?.role === 'Founder' || actorMember?.role === 'Co-Founder';
      const isSender = msg.senderId.toString() === userId.toString();

      if (!isSender && !isFounder) {
        return res.status(403).json({ error: 'Permission denied to delete for everyone.' });
      }

      if (!isFounder && minutesElapsed > 15) {
        return res.status(403).json({ error: 'Delete time limit (15 minutes) exceeded.' });
      }

      msg.content = 'This message was deleted.';
      msg.deleted = true;
      await msg.save();

      const io = req.app.get('io');
      if (io) {
        io.to(msg.conversationId.toString()).emit('message-deleted', { messageId: msg._id, conversationId: msg.conversationId });
      }

      return res.status(200).json(msg);
    } else {
      // Delete for Me: track in MessageStatus as DELETED or simply hidden
      await MessageStatus.findOneAndUpdate(
        { messageId: msg._id, userId: new mongoose.Types.ObjectId(userId) },
        { status: 'SEEN', timestamp: new Date() }, // Just update receipt or a custom list if needed
        { upsert: true }
      );
      return res.status(200).json({ success: true, message: 'Message hidden for user.' });
    }
  } catch (error: any) {
    console.error('Failed to delete message:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete message' });
  }
};

// DELETE /chat/conversation/:id
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const startupId = req.startupId;

    if (!userId || !startupId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const convo = await Conversation.findById(id);
    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Verify conversation belongs to current startup workspace
    const workspace = await Workspace.findOne({ _id: convo.workspaceId, startupId });
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied: Conversation is not in your startup workspace.' });
    }

    const actorMember = await Member.findOne({ userId, startupId });
    const isFounder = actorMember?.role === 'Founder' || actorMember?.role === 'Co-Founder';

    if (!isFounder) {
      return res.status(403).json({ error: 'Only founders or administrators can delete conversations.' });
    }

    // Soft delete conversation
    convo.isArchived = true;
    await convo.save();

    // Deactivate participants
    await ConversationParticipant.updateMany(
      { conversationId: convo._id },
      { $set: { isActive: false, leftAt: new Date() } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(convo._id.toString()).emit('conversation-updated', convo);
    }

    return res.status(200).json({ success: true, message: 'Conversation deleted.' });
  } catch (error: any) {
    console.error('Failed to delete conversation:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete conversation' });
  }
};

// PATCH /chat/read
export const markRead = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user?.id;

    if (!userId || !conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required.' });
    }

    // Ensure requesting user is an active participant in this conversation
    const membership = await ConversationParticipant.findOne({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true
    });
    if (!membership) {
      return res.status(403).json({ error: 'Access denied: You are not an active participant in this conversation.' });
    }

    const latestMsg = await Message.findOne({ conversationId: new mongoose.Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 });

    if (latestMsg) {
      await ConversationParticipant.findOneAndUpdate(
        { conversationId: new mongoose.Types.ObjectId(conversationId), userId: new mongoose.Types.ObjectId(userId) },
        { $set: { lastReadMessageId: latestMsg._id } }
      );

      // Create seen statuses for all unread messages
      const unreadMessages = await Message.find({
        conversationId: new mongoose.Types.ObjectId(conversationId),
        senderId: { $ne: new mongoose.Types.ObjectId(userId) }
      });

      for (const msg of unreadMessages) {
        await MessageStatus.findOneAndUpdate(
          { messageId: msg._id, userId: new mongoose.Types.ObjectId(userId) },
          { $set: { status: 'SEEN', timestamp: new Date() } },
          { upsert: true }
        );
      }

      const io = req.app.get('io');
      if (io) {
        io.to(conversationId.toString()).emit('message-seen', { conversationId, userId });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to mark read:', error);
    return res.status(500).json({ error: error.message || 'Failed to mark read' });
  }
};

// PATCH /chat/archive
export const archiveConversation = async (req: Request, res: Response) => {
  try {
    const { conversationId, isArchived } = req.body;
    const userId = req.user?.id;
    const startupId = req.startupId;

    if (!userId || !conversationId) {
      return res.status(400).json({ error: 'Conversation ID and isArchived state are required.' });
    }

    const convo = await Conversation.findById(conversationId);
    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Verify conversation belongs to current startup workspace
    const workspace = await Workspace.findOne({ _id: convo.workspaceId, startupId });
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied: Conversation is not in your startup workspace.' });
    }

    // Ensure requesting user is an active participant in this conversation
    const membership = await ConversationParticipant.findOne({
      conversationId: convo._id,
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true
    });
    if (!membership) {
      return res.status(403).json({ error: 'Access denied: You are not an active participant in this conversation.' });
    }

    convo.isArchived = !!isArchived;
    await convo.save();

    return res.status(200).json(convo);
  } catch (error: any) {
    console.error('Failed to archive conversation:', error);
    return res.status(500).json({ error: error.message || 'Failed to archive conversation' });
  }
};

// PATCH /chat/remove-member
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { conversationId, targetUserId } = req.body;
    const userId = req.user?.id;
    const startupId = req.startupId;

    if (!userId || !conversationId || !targetUserId) {
      return res.status(400).json({ error: 'Conversation ID and Target User ID are required.' });
    }

    const convo = await Conversation.findById(conversationId);
    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Verify conversation workspace belongs to the user's active startup tenant
    const workspace = await Workspace.findOne({ _id: convo.workspaceId, startupId });
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied: Conversation is not in your startup workspace.' });
    }

    const actorMember = await Member.findOne({ userId, startupId });
    const isFounder = actorMember?.role === 'Founder' || actorMember?.role === 'Co-Founder';

    if (!isFounder) {
      return res.status(403).json({ error: 'Only founders or admins can remove group members.' });
    }

    const participant = await ConversationParticipant.findOne({ conversationId, userId: targetUserId, isActive: true });
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found or already left.' });
    }

    participant.isActive = false;
    participant.leftAt = new Date();
    await participant.save();

    // Create leave message
    const targetUserObj = await User.findById(targetUserId);
    const leaveMsg = new Message({
      conversationId,
      senderId: new mongoose.Types.ObjectId(userId),
      content: `${targetUserObj?.fullName || 'Member'} was removed from the channel.`,
      messageType: 'text'
    });
    await leaveMsg.save();

    if (convo) {
      convo.lastMessage = `${targetUserObj?.fullName || 'Member'} was removed from the channel.`;
      convo.lastActivity = new Date();
      await convo.save();
    }

    const io = req.app.get('io');
    if (io) {
      const populatedMsg = await Message.findById(leaveMsg._id).populate('senderId', 'fullName email avatarUrl');
      io.to(conversationId).emit('receive-message', populatedMsg);
    }

    return res.status(200).json({ success: true, message: 'Member removed.' });
  } catch (error: any) {
    console.error('Failed to remove member from chat:', error);
    return res.status(500).json({ error: error.message || 'Failed to remove member' });
  }
};

// PATCH /chat/add-member
export const addMember = async (req: Request, res: Response) => {
  try {
    const { conversationId, targetUserId } = req.body;
    const userId = req.user?.id;
    const startupId = req.startupId;

    if (!userId || !conversationId || !targetUserId) {
      return res.status(400).json({ error: 'Conversation ID and Target User ID are required.' });
    }

    const convo = await Conversation.findById(conversationId);
    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Verify conversation workspace belongs to the user's active startup tenant
    const workspace = await Workspace.findOne({ _id: convo.workspaceId, startupId });
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied: Conversation is not in your startup workspace.' });
    }

    const targetMember = await Member.findOne({ userId: targetUserId, startupId });
    if (!targetMember) {
      return res.status(404).json({ error: 'Target user is not a member of the workspace.' });
    }

    const roleMapping = targetMember.role === 'Founder' || targetMember.role === 'Co-Founder'
      ? targetMember.role
      : (targetMember.role === 'Mentor' ? 'Mentor' : 'Team Member');

    await ConversationParticipant.findOneAndUpdate(
      { conversationId: new mongoose.Types.ObjectId(conversationId), userId: new mongoose.Types.ObjectId(targetUserId) },
      {
        $set: {
          role: roleMapping,
          isActive: true,
          joinedAt: new Date()
        }
      },
      { upsert: true }
    );

    // Create join message
    const targetUserObj = await User.findById(targetUserId);
    const joinMsg = new Message({
      conversationId,
      senderId: new mongoose.Types.ObjectId(targetUserId),
      content: `${targetUserObj?.fullName || 'Member'} joined the channel.`,
      messageType: 'text'
    });
    await joinMsg.save();

    if (convo) {
      convo.lastMessage = `${targetUserObj?.fullName || 'Member'} joined the channel.`;
      convo.lastActivity = new Date();
      await convo.save();
    }

    const io = req.app.get('io');
    if (io) {
      const populatedMsg = await Message.findById(joinMsg._id).populate('senderId', 'fullName email avatarUrl');
      io.to(conversationId).emit('receive-message', populatedMsg);
    }

    return res.status(200).json({ success: true, message: 'Member added.' });
  } catch (error: any) {
    console.error('Failed to add member to chat:', error);
    return res.status(500).json({ error: error.message || 'Failed to add member' });
  }
};

// GET /chat/search
export const searchChat = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const userId = req.user?.id;
    const startupId = req.startupId;

    if (!userId || !startupId || !query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const workspace = await Workspace.findOne({ startupId }).sort({ createdAt: 1 });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    // Find user's active conversations
    const memberships = await ConversationParticipant.find({ userId: new mongoose.Types.ObjectId(userId), isActive: true });
    const convoIds = memberships.map(m => m.conversationId);

    // Search messages content
    const messages = await Message.find({
      conversationId: { $in: convoIds },
      content: { $regex: query as string, $options: 'i' },
      deleted: false
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'fullName email avatarUrl')
      .limit(100);

    return res.status(200).json(messages);
  } catch (error: any) {
    console.error('Failed to search chat:', error);
    return res.status(500).json({ error: error.message || 'Failed to search chat' });
  }
};
