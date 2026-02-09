import React, { useEffect, useState } from 'react';

import Loader from '../components/Loader.jsx';
import { listMyOrders } from '../services/orderService';

export default function Orders() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await listMyOrders({ page: 1, limit: 20 });
        setData(res);
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-title">
        <h2>Orders</h2>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="table">
        <div className="thead">
          <div>Order</div>
          <div>Status</div>
          <div>Total</div>
          <div>Created</div>
        </div>
        {(data?.items || []).map((o) => (
          <div className="trow" key={o._id}>
            <div className="mono">{o._id}</div>
            <div>{o.status}</div>
            <div>₹{o.total}</div>
            <div className="muted">{new Date(o.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
