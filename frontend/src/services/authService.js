import api from './api';

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/users/me');
  return data;
}

export async function updateMe(payload) {
  const { data } = await api.put('/users/me', payload);
  return data;
}
