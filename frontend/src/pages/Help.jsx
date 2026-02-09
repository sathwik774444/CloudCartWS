import React, { useState } from 'react';

export default function Help() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  return (
    <div>
      <div className="page-title">
        <h2>Help & Support</h2>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>FAQs</h3>
          <div className="faq">
            <div className="q">How do I track my order?</div>
            <div className="a">Go to Orders. Tracking appears when the order is shipped.</div>
          </div>
          <div className="faq">
            <div className="q">Can I cancel an order?</div>
            <div className="a">Contact support with your order id. Admin can update status.</div>
          </div>
          <div className="faq">
            <div className="q">Is payment secure?</div>
            <div className="a">Stripe PaymentIntents are used. For dev, the app can confirm with a mock step.</div>
          </div>
        </div>

        <div className="panel">
          <h3>Contact</h3>
          {sent ? <div className="alert success">Message captured. Support will respond soon.</div> : null}
          <div className="form">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <textarea
              placeholder="How can we help?"
              rows={5}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
            <button
              className="btn"
              type="button"
              onClick={() => {
                setSent(true);
              }}
              disabled={!form.email || !form.message}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
