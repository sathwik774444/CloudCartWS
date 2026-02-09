import React, { useEffect, useMemo, useState } from 'react';

import Loader from '../components/Loader.jsx';
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminUpdateProduct,
  listProducts,
} from '../services/productService';
import { adminListOrders, adminUpdateOrderStatus } from '../services/orderService';

export default function AdminDashboard() {
  const [tab, setTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    price: 999,
    countInStock: 10,
    images: ['https://via.placeholder.com/600x400?text=New+Product'],
  });

  const canCreate = useMemo(() => form.title && form.description && Number(form.price) >= 0, [form]);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [p, o] = await Promise.all([listProducts({ page: 1, limit: 50 }), adminListOrders({ page: 1, limit: 50 })]);
      setProducts(p.items || []);
      setOrders(o.items || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-title">
        <h2>Admin Dashboard</h2>
        <div className="row gap">
          <button className={tab === 'products' ? 'btn' : 'btn btn-ghost'} type="button" onClick={() => setTab('products')}>
            Products
          </button>
          <button className={tab === 'orders' ? 'btn' : 'btn btn-ghost'} type="button" onClick={() => setTab('orders')}>
            Orders
          </button>
          <button className="btn btn-ghost" type="button" onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      {tab === 'products' ? (
        <div className="grid-2">
          <div className="panel">
            <h3>Create product</h3>
            <div className="form">
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" />
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description"
                rows={4}
              />
              <div className="row gap">
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                </select>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  placeholder="Price"
                />
              </div>
              <div className="row gap">
                <input
                  type="number"
                  value={form.countInStock}
                  onChange={(e) => setForm((f) => ({ ...f, countInStock: Number(e.target.value) }))}
                  placeholder="Stock"
                />
                <input
                  value={(form.images && form.images[0]) || ''}
                  onChange={(e) => setForm((f) => ({ ...f, images: [e.target.value] }))}
                  placeholder="Image URL"
                />
              </div>
              <button
                className="btn"
                type="button"
                disabled={!canCreate}
                onClick={async () => {
                  setError('');
                  try {
                    await adminCreateProduct(form);
                    await refresh();
                    setForm((f) => ({ ...f, title: '', description: '' }));
                  } catch (e) {
                    setError(e?.response?.data?.message || e.message || 'Create failed');
                  }
                }}
              >
                Create
              </button>
            </div>
          </div>

          <div className="panel">
            <h3>Products</h3>
            <div className="table">
              <div className="thead">
                <div>Title</div>
                <div>Price</div>
                <div>Stock</div>
                <div></div>
              </div>
              {products.map((p) => (
                <div className="trow" key={p._id}>
                  <div>{p.title}</div>
                  <div>₹{p.price}</div>
                  <div>{p.countInStock}</div>
                  <div className="row gap">
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={async () => {
                        const next = window.prompt('New price', String(p.price));
                        if (!next) return;
                        await adminUpdateProduct(p._id, { price: Number(next) });
                        await refresh();
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={async () => {
                        if (!window.confirm('Delete product?')) return;
                        await adminDeleteProduct(p._id);
                        await refresh();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'orders' ? (
        <div className="panel">
          <h3>Orders</h3>
          <div className="table">
            <div className="thead">
              <div>Order</div>
              <div>User</div>
              <div>Status</div>
              <div>Total</div>
              <div></div>
            </div>
            {orders.map((o) => (
              <div className="trow" key={o._id}>
                <div className="mono">{o._id}</div>
                <div className="muted">{o.user?.email || '—'}</div>
                <div>{o.status}</div>
                <div>₹{o.total}</div>
                <div>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={async () => {
                      const next = window.prompt(
                        'Update status (pending, paid, processing, shipped, delivered, cancelled, refunded)',
                        o.status
                      );
                      if (!next) return;
                      await adminUpdateOrderStatus(o._id, { status: next });
                      await refresh();
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
