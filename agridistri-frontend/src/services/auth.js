// src/services/auth.js
import api from './api';

export const authService = {
  async login(username, password) {
    const response = await api.post('/auth/login/', { username, password });
    
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  async getProfile() {
    const response = await api.get('/auth/me/');
    return response.data;
  }
};