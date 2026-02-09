import api from './api';

export async function getMyCart() {
  const { data } = await api.get('/cart');
  return data;
}

export async function addToCart(payload) {
  const { data } = await api.post('/cart/add', payload);
  return data;
}

export async function updateCart(payload) {
  const { data } = await api.put('/cart/update', payload);
  return data;
}

export async function removeFromCart(payload) {
  const { data } = await api.post('/cart/remove', payload);
  return data;
}

export async function clearCart() {
  const { data } = await api.post('/cart/clear');
  return data;
}
