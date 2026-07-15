import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5100/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto-inject JWT token and active Startup ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const startupId = localStorage.getItem('startupId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (startupId) {
    config.headers['x-startup-id'] = startupId;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth API
export const authService = {
  register: (payload: any) => api.post('/auth/register', payload),
  verifyOtp: (payload: any) => api.post('/auth/verify-otp', payload),
  login: (payload: any) => api.post('/auth/login', payload),
  getMe: () => api.get('/auth/me'),
  inviteTeam: (payload: any) => api.post('/auth/invite', payload)
};

// Onboarding & Profile API
export const startupService = {
  bootstrap: (payload: any) => api.post('/startup/onboarding/bootstrap', payload),
  getProfile: () => api.get('/startup/profile'),
  updateCanvas: (canvas: any) => api.patch('/startup/profile/canvas', { canvas }),
  updateSwot: (swot: any) => api.patch('/startup/profile/swot', { swot }),
  addCompetitor: (competitor: any) => api.post('/startup/profile/competitors', competitor)
};

// Workspace Document Wiki API
export const workspaceService = {
  getWorkspaces: () => api.get('/workspace/workspaces'),
  getPages: (workspaceId: string) => api.get(`/workspace/pages?workspaceId=${workspaceId}`),
  getPage: (id: string) => api.get(`/workspace/pages/${id}`),
  createPage: (payload: any) => api.post('/workspace/pages', payload),
  updatePage: (id: string, payload: any) => api.patch(`/workspace/pages/${id}`, payload),
  deletePage: (id: string) => api.delete(`/workspace/pages/${id}`)
};

// Projects & Tasks API
export const projectService = {
  getProjects: (workspaceId: string) => api.get(`/projects?workspaceId=${workspaceId}`),
  createProject: (payload: any) => api.post('/projects', payload),
  getSprints: (projectId: string) => api.get(`/projects/sprints/${projectId}`),
  createSprint: (payload: any) => api.post('/projects/sprints', payload),
  getSprintBurndown: (sprintId: string) => api.get(`/projects/sprints/${sprintId}/burndown`),
  
  getTasks: (query: { workspaceId?: string; projectId?: string; sprintId?: string }) => {
    const params = new URLSearchParams(query as any).toString();
    return api.get(`/projects/tasks?${params}`);
  },
  createTask: (payload: any) => api.post('/projects/tasks', payload),
  updateTask: (id: string, payload: any) => api.patch(`/projects/tasks/${id}`, payload),
  logTime: (payload: { taskId: string; hoursSpent: number; description?: string }) => api.post('/projects/tasks/log-time', payload)
};

// Customer Validation & Sentiment Feedback API
export const validationService = {
  getSurveys: () => api.get('/validation/surveys'),
  createSurvey: (payload: any) => api.post('/validation/surveys', payload),
  getSurveyAnalytics: (id: string) => api.get(`/validation/surveys/${id}/analytics`),
  submitSurveyResponse: (payload: any) => api.post('/validation/surveys/respond', payload),
  
  getInterviews: () => api.get('/validation/interviews'),
  logInterview: (payload: any) => api.post('/validation/interviews', payload),
  
  getFeedbacks: () => api.get('/validation/feedback'),
  submitFeedback: (payload: any) => api.post('/validation/feedback', payload),
  submitFeedbackPublic: (payload: any) => api.post('/validation/feedback/submit-public', payload),
  
  getIdeaScore: () => api.get('/validation/idea-score')
};

// Investor Relations CRM API
export const crmService = {
  getInvestors: () => api.get('/investors'),
  createInvestor: (payload: any) => api.post('/investors', payload),
  updateInvestor: (id: string, payload: any) => api.patch(`/investors/${id}`, payload),
  addMeetingNote: (id: string, payload: any) => api.post(`/investors/${id}/meetings`, payload),
  
  generateShareLink: () => api.post('/investors/share-link'),
  submitTelemetry: (payload: any) => api.post('/investors/telemetry/submit', payload),
  getTelemetryReport: () => api.get('/investors/telemetry/report')
};

// Documents (Legal, Invoices, OCR PDF search)
export const documentService = {
  getDocuments: (query?: { category?: string; search?: string }) => {
    const params = new URLSearchParams(query as any).toString();
    return api.get(`/documents?${params}`);
  },
  uploadDocument: (payload: any) => api.post('/documents', payload),
  deleteDocument: (id: string) => api.delete(`/documents/${id}`)
};

// AI Co-Founder Dashboard API
export const aiService = {
  getHealthReport: () => api.get('/ai/health'),
  // Standard non-stream chat trigger
  chat: (payload: { prompt: string; topic?: string }) => api.post('/ai/chat', payload)
};

// Workspace Chat & Communications API
export const chatService = {
  getConversations: () => api.get('/chat/conversations'),
  getMembers: () => api.get('/chat/members'),
  getMessages: (conversationId: string, limit?: number, before?: string) => {
    let url = `/chat/messages/${conversationId}`;
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before);
    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;
    return api.get(url);
  },
  sendMessage: (payload: { conversationId?: string; recipientId?: string; message: string; attachments?: any[]; replyTo?: string }) => 
    api.post('/chat/send', payload),
  markSeen: (conversationId: string) => api.patch('/chat/seen', { conversationId }),
  deleteMessage: (messageId: string) => api.delete('/chat/message', { data: { messageId } })
};


// Notification Center API
export const notificationService = {
  getNotifications: () => api.get('/notification'),
  markRead: (id: string) => api.patch(`/notification/read/${id}`),
  markAllRead: () => api.patch('/notification/read-all'),
  createNotification: (payload: { receiverId: string; type: string; title: string; description: string; conversationId?: string; messageId?: string }) =>
    api.post('/notification/create', payload)
};

export default api;

