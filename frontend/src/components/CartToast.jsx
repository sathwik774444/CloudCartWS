import React from 'react';

import { useCart } from '../context/CartContext.jsx';

export default function CartToast() {
  const { toast } = useCart();

  if (!toast?.message) return null;

  return (
    <div className={`toast toast-${toast.type || 'success'}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}
