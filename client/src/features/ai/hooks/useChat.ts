import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { setActiveConversationId } from '../redux/aiSlice';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { getApiBaseUrl } from '../../../lib/env';
import { IConversation } from '../types';

const API_BASE_URL = getApiBaseUrl();

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'x-startup-id': localStorage.getItem('startupId') || '',
  'x-workspace-id': localStorage.getItem('activeWorkspaceId') || ''
});

const EMPTY_CONVERSATIONS: IConversation[] = [];

export const useChat = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const activeConversationId = useSelector((state: RootState) => state.aiCopilot.activeConversationId);

  const mapConversation = (conversation: any): IConversation => ({
    _id: conversation._id,
    title: conversation.title,
    workspaceId: conversation.workspaceId,
    isPinned: Boolean(conversation.isPinned),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: (conversation.messages || []).map((message: any, index: number) => ({
      _id: message._id || `${conversation._id}-${index}`,
      sender: message.role === 'assistant' ? 'ai' : 'user',
      text: message.content,
      citations: message.citations || [],
      suggestedFollowups: message.suggestedFollowups || [],
      createdAt: message.createdAt
    }))
  });

  // 1. Fetch AI Conversations History
  const { data, isLoading } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/ai/conversations`, { headers: getHeaders() });
      return (res.data?.data?.conversations || []).map(mapConversation);
    },
  });

  const conversations = data || EMPTY_CONVERSATIONS;

  // 2. Select conversation
  const selectConversation = (id: string | null) => {
    dispatch(setActiveConversationId(id));
  };

  // 3. Delete conversation mutation
  const deleteConvoMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_BASE_URL}/ai/conversations/${id}`, { headers: getHeaders() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      if (activeConversationId) selectConversation(null);
    }
  });

  return {
    conversations,
    activeConversationId,
    selectConversation,
    isLoading,
    deleteConversation: deleteConvoMutation.mutate
  };
};
export default useChat;
