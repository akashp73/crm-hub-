import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      try {
        const { data } = await api.post('/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password, subdomain) => api.post('/auth/login', { email, password, subdomain }),
  logout: () => api.post('/auth/logout')
};

export const leadsAPI = {
  getLeads: (params) => api.get('/leads', { params }),
  getLead: (id) => api.get(`/leads/${id}`),
  createLead: (data) => api.post('/leads', data),
  updateLead: (id, data) => api.put(`/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  assignLead: (id, assignedToId) => api.put(`/leads/${id}/assign`, { assignedToId }),
  bulkImport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/leads/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const tasksAPI = {
  getMyTasks: () => api.get('/tasks/my-tasks'),
  createTask: (data) => api.post('/tasks', data),
  completeTask: (id) => api.put(`/tasks/${id}/complete`)
};

export const scoreAPI = {
  getScoreRules: () => api.get('/score-rules'),
  createScoreRule: (data) => api.post('/score-rules', data),
  updateScoreRule: (id, data) => api.put(`/score-rules/${id}`, data)
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getHotLeads: (limit = 10) => api.get('/dashboard/hot-leads', { params: { limit } })
};

export default api;
