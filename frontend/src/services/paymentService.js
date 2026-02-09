import api from './api';

export async function createPaymentIntent(payload) {
  const { data } = await api.post('/payments/intent', payload);
  return data;
}

export async function confirmPaymentMock(payload) {
  const { data } = await api.post('/payments/confirm-mock', payload);
  return data;
}
