import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getMe } from '../api/auth.api';
import { setStoredTokens } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      navigate('/login?error=oauth_failed');
      return;
    }

    setStoredTokens({ access: accessToken, refresh: refreshToken });

    getMe()
      .then((user) => {
        login({ access: accessToken, refresh: refreshToken }, user);
        navigate('/jobs');
      })
      .catch(() => navigate('/login?error=oauth_failed'));
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}
