import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  workspaceService,
  projectService,
  teamManagementService,
  aiService,
  chatService,
  documentService,
  workforceTaskService,
  validationService,
  milestoneService,
  startupService,
  crmService,
  taskService
} from '../services/api';

// ==========================================
// WORKSPACE QUERIES & MUTATIONS
// ==========================================
export const useWorkspaces = () => {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await workspaceService.getWorkspaces();
      return res.data.workspaces || [];
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useWorkspacePages = (workspaceId: string | null) => {
  return useQuery({
    queryKey: ['workspace-pages', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await workspaceService.getPages(workspaceId);
      return res.data.pages || [];
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useWorkspacePage = (pageId: string | null) => {
  return useQuery({
    queryKey: ['workspace-page', pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const res = await workspaceService.getPage(pageId);
      return res.data.page || null;
    },
    enabled: !!pageId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreatePage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => workspaceService.createPage(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-pages', variables.workspaceId] });
    }
  });
};

export const useUpdatePage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      workspaceService.updatePage(id, payload),
    onSuccess: (res) => {
      const page = res.data.page;
      queryClient.invalidateQueries({ queryKey: ['workspace-page', page._id] });
      queryClient.invalidateQueries({ queryKey: ['workspace-pages', page.workspaceId] });
    }
  });
};

export const useDeletePage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; workspaceId: string }) =>
      workspaceService.deletePage(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-pages', variables.workspaceId] });
    }
  });
};

// ==========================================
// PROJECTS & SPRINTS
// ==========================================
export const useProjects = (workspaceId: string | null) => {
  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await projectService.getProjects(workspaceId);
      return res.data.projects || [];
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => projectService.createProject(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.workspaceId] });
    }
  });
};

export const useSprints = (projectId: string | null) => {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await projectService.getSprints(projectId);
      return res.data.sprints || [];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateSprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => projectService.createSprint(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', variables.projectId] });
    }
  });
};

export const useSprintBurndown = (sprintId: string | null) => {
  return useQuery({
    queryKey: ['burndown', sprintId],
    queryFn: async () => {
      if (!sprintId) return [];
      const res = await projectService.getSprintBurndown(sprintId);
      const ideal = res.data.ideal || [];
      const actual = res.data.actual || [];

      return ideal.map((point: any, index: number) => ({
        date: point.date,
        ideal: point.hours,
        actual: actual[index]?.hours ?? point.hours
      }));
    },
    enabled: !!sprintId,
    staleTime: 1000 * 60 * 5,
  });
};

// ==========================================
// TASKS & WORKFORCE TASKS
// ==========================================
export const useTasks = (query?: { workspaceId?: string; projectId?: string; milestoneId?: string; sprintId?: string; assigneeId?: string; status?: string; search?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['tasks', query],
    queryFn: async () => {
      const res = await taskService.getTasks(query);
      return res.data.tasks || [];
    },
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

export const useTaskDetail = (id: string | null) => {
  return useQuery({
    queryKey: ['task-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await taskService.getTaskById(id);
      return res.data || null;
    },
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useMyTasks = () => {
  return useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const res = await workforceTaskService.getMyTasks();
      return {
        tasks: res.data.tasks || [],
        activities: res.data.activities || []
      };
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => taskService.createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    }
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => taskService.updateTask(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    }
  });
};

export const useTransitionTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => taskService.updateStatus(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    }
  });
};

export const useApproveTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskService.approveTask(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    }
  });
};

export const useRejectTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) => taskService.rejectTask(id, { comments }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    }
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    }
  });
};

export const useAddTaskComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { content: string; replyToId?: string; attachments?: string[] } }) => 
      taskService.addComment(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', variables.id] });
    }
  });
};

export const useAddTaskAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; url: string } }) => 
      taskService.addAttachment(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
};

export const useToggleChecklist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { checklistItemId: string; isCompleted: boolean } }) => 
      taskService.toggleChecklist(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
};

// ==========================================
// TEAM MEMBERS & INVITATIONS
// ==========================================
export const useTeamData = () => {
  return useQuery({
    queryKey: ['team-data'],
    queryFn: async () => {
      const res = await teamManagementService.getMembers();
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useInviteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => teamManagementService.inviteMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-data'] });
    }
  });
};

export const useChangeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { memberId: string; role: string }) =>
      teamManagementService.changeRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-data'] });
    }
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => teamManagementService.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-data'] });
    }
  });
};

export const useResendInvite = () => {
  return useMutation({
    mutationFn: (invitationId: string) => teamManagementService.resendInvite(invitationId)
  });
};

// ==========================================
// AI & ANALYTICS
// ==========================================
export const useAiHealthReport = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['ai-health'],
    queryFn: async () => {
      const res = await aiService.getHealthReport();
      return res.data;
    },
    enabled,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAiRecommendations = () => {
  return useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      const res = await aiService.getRecommendations();
      return res.data.recommendations || [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useAiSummarize = () => {
  return useMutation({
    mutationFn: () => aiService.summarizeWorkspace()
  });
};

export const useAiSprint = () => {
  return useMutation({
    mutationFn: () => aiService.generateSprint()
  });
};

export const useAiPitch = () => {
  return useMutation({
    mutationFn: () => aiService.generatePitch()
  });
};

export const useAiSearch = () => {
  return useMutation({
    mutationFn: (query: string) => aiService.searchWorkspace(query)
  });
};

export const useIdeaScore = () => {
  return useQuery({
    queryKey: ['idea-score'],
    queryFn: async () => {
      const res = await validationService.getIdeaScore();
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useSurveys = () => {
  return useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const res = await validationService.getSurveys();
      return res.data.surveys || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useInterviews = () => {
  return useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const res = await validationService.getInterviews();
      return res.data.interviews || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useFeedbacks = () => {
  return useQuery({
    queryKey: ['feedbacks'],
    queryFn: async () => {
      const res = await validationService.getFeedbacks();
      return res.data.feedbacks || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useLogInterview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => validationService.logInterview(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['idea-score'] });
    }
  });
};

export const useCreateSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => validationService.createSurvey(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      queryClient.invalidateQueries({ queryKey: ['idea-score'] });
    }
  });
};

// ==========================================
// DOCUMENTS
// ==========================================
export const useDocuments = (query?: { category?: string; search?: string }) => {
  return useQuery({
    queryKey: ['documents', query],
    queryFn: async () => {
      const res = await documentService.getDocuments(query);
      return res.data.documents || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => documentService.uploadDocument(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });
};

// ==========================================
// CHAT / MESSAGING
// ==========================================
export const useConversations = (workspaceId: string | null) => {
  return useQuery({
    queryKey: ['conversations', workspaceId],
    queryFn: async () => {
      const res = await chatService.getConversations(workspaceId);
      return res.data || [];
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await chatService.getMessages(conversationId);
      return res.data || [];
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { conversationId?: string; recipientId?: string; message: string; attachments?: any[]; replyTo?: string }) =>
      chatService.sendMessage(payload),
    onSuccess: (res, variables) => {
      const conversationId = variables.conversationId || res.data.conversationId || res.data.message?.conversationId;
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
};

// ==========================================
// MILESTONES
// ==========================================
export const useMilestones = () => {
  return useQuery({
    queryKey: ['milestones'],
    queryFn: async () => {
      const res = await milestoneService.getMilestones();
      return res.data.milestones || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateMilestone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => milestoneService.createMilestone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    }
  });
};

// ==========================================
// STARTUP STRATEGIC PROFILE / CANVAS
// ==========================================
export const useStartupProfile = () => {
  return useQuery({
    queryKey: ['startup-profile'],
    queryFn: async () => {
      const res = await startupService.getProfile();
      return res.data.startup;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateCanvas = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (canvas: any) => startupService.updateCanvas(canvas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-profile'] });
    }
  });
};

export const useUpdateSwot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (swot: any) => startupService.updateSwot(swot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-profile'] });
    }
  });
};

export const useAddCompetitor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (competitor: any) => startupService.addCompetitor(competitor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-profile'] });
    }
  });
};

// ==========================================
// INVESTOR CRM
// ==========================================
export const useInvestors = () => {
  return useQuery({
    queryKey: ['investors'],
    queryFn: async () => {
      const res = await crmService.getInvestors();
      return res.data.investors || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useTelemetryReport = () => {
  return useQuery({
    queryKey: ['telemetry-report'],
    queryFn: async () => {
      const res = await crmService.getTelemetryReport();
      return res.data.telemetry || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateInvestor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => crmService.createInvestor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    }
  });
};

export const useUpdateInvestor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => crmService.updateInvestor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    }
  });
};
