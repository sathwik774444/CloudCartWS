import api from './api';

export async function listProducts(params) {
  const { data } = await api.get('/products', { params });
  return data;
}

export async function getProduct(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function adminCreateProduct(payload) {
  const { data } = await api.post('/products', payload);
  return data;
}

export async function adminUpdateProduct(id, payload) {
  const { data } = await api.put(`/products/${id}`, payload);
  return data;
}

export async function adminDeleteProduct(id) {
  const { data } = await api.delete(`/products/${id}`);
  return data;
}
