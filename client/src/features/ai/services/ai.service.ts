import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5100/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const startupId = localStorage.getItem('startupId');
  const workspaceId = localStorage.getItem('activeWorkspaceId');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-startup-id': startupId || '',
    'x-workspace-id': workspaceId || ''
  };
};

export const aiApiService = {
  getHealthReport: () => axios.get(`${API_BASE_URL}/ai/health`, { headers: getHeaders() }),
  getRecommendations: () => axios.post(`${API_BASE_URL}/ai/recommendations`, {}, { headers: getHeaders() }),
  summarizeWorkspace: () => axios.post(`${API_BASE_URL}/ai/summarize`, {}, { headers: getHeaders() }),
  generateSprint: () => axios.post(`${API_BASE_URL}/ai/sprint`, {}, { headers: getHeaders() }),
  generatePitch: () => axios.post(`${API_BASE_URL}/ai/pitch`, {}, { headers: getHeaders() }),
  searchWorkspace: (query: string) => axios.post(`${API_BASE_URL}/ai/search`, { query }, { headers: getHeaders() })
};
