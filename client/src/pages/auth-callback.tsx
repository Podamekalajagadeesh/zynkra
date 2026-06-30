import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken } from '../lib/api';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract token from URL fragment (everything after #)
        const fragment = window.location.hash.substring(1);
        const params = new URLSearchParams(fragment);
        const token = params.get('token');

        if (!token) {
          console.warn('No token found in OAuth callback URL');
          navigate('/login');
          return;
        }

        // Store token in localStorage
        localStorage.setItem('access_token', token);
        // Update axios default header
        setAuthToken(token);
        // Dispatch auth change event so App component updates state
        window.dispatchEvent(new Event('authchange'));
        // Clear old httpOnly cookie if it exists
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // Clean URL by removing fragment
        window.history.replaceState({}, '', window.location.pathname);

        // Wait a tick to ensure all state updates are processed
        await new Promise(resolve => setTimeout(resolve, 50));

        // Navigate to home
        navigate('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-lg shadow-primary-500/20" />
        <div className="space-y-2">
          <p className="section-title text-2xl">Finishing sign-in</p>
          <p className="section-subtitle">We’re securing your session and returning you to the app.</p>
        </div>
      </div>
    </div>
  );
}