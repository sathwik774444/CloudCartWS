import React, { useState } from 'react';

import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  const onSave = async () => {
    setSaved('');
    setError('');
    try {
      await updateProfile({ name, phone });
      setSaved('Profile updated');
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="page-title">
        <h2>Profile</h2>
      </div>

      {saved ? <div className="alert success">{saved}</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      <div className="panel form">
        <label className="muted">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label className="muted">Email</label>
        <input value={user?.email || ''} disabled />

        <label className="muted">Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />

        <button className="btn" type="button" onClick={onSave}>
          Save
        </button>
      </div>
    </div>
  );
}
