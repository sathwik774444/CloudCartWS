import api from './api';

export async function createOrderFromCart(payload) {
  const { data } = await api.post('/orders', payload);
  return data;
}

export async function listMyOrders(params) {
  const { data } = await api.get('/orders/mine', { params });
  return data;
}

export async function getOrder(id) {
  const { data } = await api.get(`/orders/${id}`);
  return data;
}

export async function adminListOrders(params) {
  const { data } = await api.get('/orders', { params });
  return data;
}

export async function adminUpdateOrderStatus(id, payload) {
  const { data } = await api.put(`/orders/${id}/status`, payload);
  return data;
}
