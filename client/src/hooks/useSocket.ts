import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { RootState } from '../store';
import { setConnected } from '../store/slices/socketSlice';
import { setTypingIndicator } from '../store/slices/chatSlice';
import { addNotification } from '../store/slices/notificationSlice';
import { setOnlineUsers, addUserOnline, removeUserOffline } from '../store/slices/userSlice';
import { getSocketUrl } from '../lib/env';

let socket: Socket | null = null;

export const useSocket = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const auth = useSelector((state: RootState) => state.auth);
  const activeConversationId = useSelector((state: RootState) => state.chat.activeConversationId);
  const workspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      if (socket) {
        socket.disconnect();
        socket = null;
        dispatch(setConnected(false));
      }
      return;
    }

    if (!socket) {
      const socketUrl = getSocketUrl();
      const token = localStorage.getItem('token') || '';
      socket = io(socketUrl, {
        auth: {
          token
        },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        autoConnect: true
      });
    }

    if (socket && !socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      dispatch(setConnected(true));
      console.log('Socket.io connected successfully');
    };

    const handleDisconnect = () => {
      dispatch(setConnected(false));
      console.log('Socket.io disconnected');
    };

    const handleNewMessage = (message: any) => {
      // Update messages query cache
      queryClient.setQueryData(['messages', message.conversationId], (oldMessages: any) => {
        if (!oldMessages) return [message];
        if (oldMessages.some((m: any) => m._id === message._id)) return oldMessages;
        return [...oldMessages, message];
      });

      // Invalidate conversations list so it shows updated lastMessage
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleMessageEdited = (message: any) => {
      queryClient.setQueryData(['messages', message.conversationId], (oldMessages: any) => {
        if (!oldMessages) return [];
        return oldMessages.map((m: any) => m._id === message._id ? message : m);
      });
    };

    const handleMessageDeleted = (data: any) => {
      queryClient.setQueryData(['messages', data.conversationId], (oldMessages: any) => {
        if (!oldMessages) return [];
        return oldMessages.map((m: any) =>
          m._id === data.messageId ? { ...m, content: 'This message was deleted.', deleted: true } : m
        );
      });
    };

    const handleTyping = (data: any) => {
      dispatch(setTypingIndicator(data));
    };

    const handleTypingStart = (data: any) => {
      dispatch(setTypingIndicator({
        conversationId: data.conversationId,
        userId: data.userId,
        userName: data.userName,
        isTyping: true
      }));
    };

    const handleTypingStop = (data: any) => {
      dispatch(setTypingIndicator({
        conversationId: data.conversationId,
        userId: data.userId,
        userName: data.userName,
        isTyping: false
      }));
    };

    const handleMessageSeen = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
    };

    const handleUserOnline = (data: any) => {
      if (data?.userId) {
        dispatch(addUserOnline(data.userId));
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleUserOffline = (data: any) => {
      if (data?.userId) {
        dispatch(removeUserOffline(data.userId));
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleOnlineUsersList = (userIds: string[]) => {
      dispatch(setOnlineUsers(userIds));
    };

    const handleNotification = (data: any) => {
      dispatch(addNotification(data));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receive-message', handleNewMessage);
    socket.on('newMessage', handleNewMessage);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('typing', handleTyping);
    socket.on('typingStart', handleTypingStart);
    socket.on('typingStop', handleTypingStop);
    socket.on('message-seen', handleMessageSeen);
    socket.on('messageSeen', handleMessageSeen);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('onlineUsersList', handleOnlineUsersList);
    socket.on('notification', handleNotification);

    return () => {
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('receive-message', handleNewMessage);
        socket.off('newMessage', handleNewMessage);
        socket.off('messageEdited', handleMessageEdited);
        socket.off('messageDeleted', handleMessageDeleted);
        socket.off('typing', handleTyping);
        socket.off('typingStart', handleTypingStart);
        socket.off('typingStop', handleTypingStop);
        socket.off('message-seen', handleMessageSeen);
        socket.off('messageSeen', handleMessageSeen);
        socket.off('userOnline', handleUserOnline);
        socket.off('userOffline', handleUserOffline);
        socket.off('onlineUsersList', handleOnlineUsersList);
        socket.off('notification', handleNotification);
      }
    };
  }, [auth.isAuthenticated, auth.user, dispatch, queryClient]);

  // Register user when authenticated or socket reconnects
  useEffect(() => {
    if (!socket || !auth.user?.id) return;

    const registerUser = () => {
      socket?.emit('register-user', auth.user?.id);
      console.log(`[Socket] Registered user: ${auth.user?.id}`);
    };

    if (socket.connected) {
      registerUser();
    }

    socket.on('connect', registerUser);
    return () => {
      socket?.off('connect', registerUser);
    };
  }, [auth.user?.id]);

  // Join the active workspace room when it changes or socket reconnects
  useEffect(() => {
    if (!socket || !workspaceId) return;

    const joinWorkspace = () => {
      socket?.emit('join_workspace', workspaceId);
      console.log(`[Socket] Joined workspace room: ${workspaceId}`);
    };

    if (socket.connected) {
      joinWorkspace();
    }

    socket.on('connect', joinWorkspace);
    return () => {
      socket?.off('connect', joinWorkspace);
    };
  }, [workspaceId]);

  // Join the active conversation's websocket room
  useEffect(() => {
    if (socket && activeConversationId) {
      socket.emit('joinConversation', activeConversationId);
      socket.emit('join-conversation', activeConversationId);
    }
    return () => {
      if (socket && activeConversationId) {
        socket.emit('leaveConversation', activeConversationId);
      }
    };
  }, [activeConversationId]);

  const joinConversation = (conversationId: string) => {
    if (socket) {
      socket.emit('joinConversation', conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socket) {
      socket.emit('leaveConversation', conversationId);
    }
  };

  const startTyping = (conversationId: string) => {
    if (socket && auth.user) {
      socket.emit('typingStart', {
        conversationId,
        userId: auth.user.id,
        userName: auth.user.fullName
      });
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socket && auth.user) {
      socket.emit('typingStop', {
        conversationId,
        userId: auth.user.id,
        userName: auth.user.fullName
      });
    }
  };

  const emitMessageSeen = (conversationId: string) => {
    if (socket && auth.user) {
      socket.emit('messageSeen', {
        conversationId,
        userId: auth.user.id
      });
    }
  };

  const sendTyping = (conversationId: string, isTyping: boolean) => {
    if (isTyping) {
      startTyping(conversationId);
    } else {
      stopTyping(conversationId);
    }
  };

  const sendSeen = (conversationId: string) => {
    emitMessageSeen(conversationId);
  };

  return {
    socket,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    emitMessageSeen,
    sendTyping,
    sendSeen
  };
};

export default useSocket;
