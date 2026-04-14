import api from './api';

export async function createPaymentIntent(payload) {
  const { data } = await api.post('/payments/intent', payload);
  return data;
}

export async function confirmPaymentMock(payload) {
  const { data } = await api.post('/payments/confirm-mock', payload);
  return data;
}

export async function createCashfreePaymentSession(payload) {
  const { data } = await api.post('/payments/cashfree/create-session', payload);
  return data;
}

export async function verifyCashfreePayment(payload) {
  const { data } = await api.post('/payments/cashfree/verify', payload);
  return data;
}
