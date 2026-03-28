import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const user = searchParams.get('user');

    if (token && user) {
      try {
        const userData = JSON.parse(decodeURIComponent(user));
        localStorage.setItem('token', token);
        setUser(userData);
        navigate('/');
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div className="auth">
      <div className="auth-shell">
        <div className="panel auth-card">
          <div className="auth-card-head">
            <h2>Authenticating...</h2>
            <div className="muted small">Please wait while we complete your login.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
