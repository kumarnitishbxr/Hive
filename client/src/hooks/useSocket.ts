import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { RootState } from '../store';
import { setConnected } from '../store/slices/socketSlice';
import { setTypingIndicator } from '../store/slices/chatSlice';
import { addNotification } from '../store/slices/notificationSlice';

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
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5100';
      socket = io(socketUrl, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        autoConnect: true
      });

      socket.on('connect', () => {
        dispatch(setConnected(true));
        console.log('Socket.io connected successfully');
        if (auth.user) {
          socket?.emit('register-user', auth.user.id);
        }
        if (workspaceId) {
          socket?.emit('join_workspace', workspaceId);
        }
      });

      socket.on('disconnect', () => {
        dispatch(setConnected(false));
        console.log('Socket.io disconnected');
      });

      socket.on('receive-message', (message: any) => {
        // Update messages query cache
        queryClient.setQueryData(['messages', message.conversationId], (oldMessages: any) => {
          if (!oldMessages) return [message];
          if (oldMessages.some((m: any) => m._id === message._id)) return oldMessages;
          return [...oldMessages, message];
        });

        // Invalidate conversations list so it shows updated lastMessage
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });

      socket.on('typing', (data: any) => {
        dispatch(setTypingIndicator(data));
      });

      socket.on('message-seen', (data: any) => {
        queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
      });

      socket.on('notification', (data: any) => {
        dispatch(addNotification(data));
      });
    }

    return () => {
      // Maintain persistent connection across component transitions
    };
  }, [auth.isAuthenticated, auth.user, workspaceId, dispatch, queryClient]);

  // Join the active conversation's websocket room
  useEffect(() => {
    if (socket && activeConversationId) {
      socket.emit('join-conversation', activeConversationId);
    }
  }, [activeConversationId]);

  const sendTyping = (conversationId: string, isTyping: boolean) => {
    if (socket && auth.user) {
      socket.emit('typing', {
        conversationId,
        userId: auth.user.id,
        userName: auth.user.fullName,
        isTyping
      });
    }
  };

  const sendSeen = (conversationId: string) => {
    if (socket && auth.user) {
      socket.emit('message-seen', {
        conversationId,
        userId: auth.user.id
      });
    }
  };

  return {
    socket,
    sendTyping,
    sendSeen
  };
};

export default useSocket;
