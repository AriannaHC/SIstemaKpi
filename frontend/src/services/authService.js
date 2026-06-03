import apiClient from './apiClient';

export const loginService = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data; // Retorna { token: {...}, user: {...} }
};