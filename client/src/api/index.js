import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eco_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eco_token');
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data?.error || 'Something went wrong');
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const actionsAPI = {
  list: (params) => api.get('/actions', { params }),
  stats: () => api.get('/actions/stats'),
  create: (data) => api.post('/actions', data),
  delete: (id) => api.delete(`/actions/${id}`),
};

export const challengesAPI = {
  list: () => api.get('/challenges'),
  join: (id) => api.post(`/challenges/${id}/join`),
  progress: (id) => api.patch(`/challenges/${id}/progress`),
};

export const leaderboardAPI = {
  get: (period) => api.get('/leaderboard', { params: { period } }),
};

export const photosAPI = {
  upload: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post('/photos/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  list: () => api.get('/photos'),
};

export const tipsAPI = {
  list: (category) => api.get('/tips', { params: { category } }),
  daily: () => api.get('/tips/daily'),
};

export default api;