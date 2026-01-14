'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Login successful - redirect to admin dashboard
      router.push('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#FFF9F4' }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="font-inter font-semibold"
            style={{
              fontSize: '32px',
              color: '#000000',
              marginBottom: '8px',
            }}
          >
            Attendly
          </h1>
          <p
            className="font-inter font-normal"
            style={{
              fontSize: '16px',
              color: '#666666',
            }}
          >
            Admin Dashboard
          </p>
        </div>

        {/* Login Form */}
        <div
          className="rounded-lg p-6"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            className="font-inter font-bold mb-6"
            style={{
              fontSize: '24px',
              color: '#000000',
            }}
          >
            Login
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Password Input */}
            <div className="mb-4">
              <label
                htmlFor="password"
                className="font-inter font-medium mb-2 block"
                style={{
                  fontSize: '14px',
                  color: '#333333',
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                className="w-full rounded-lg border px-4 py-2 font-inter focus:outline-none focus:ring-2"
                style={{
                  borderColor: '#E0E0E0',
                  fontSize: '14px',
                  color: '#333333',
                }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="mb-4 rounded-lg p-3 font-inter"
                style={{
                  backgroundColor: '#FFE5E5',
                  color: '#D32F2F',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-lg px-4 py-2 font-inter font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: '#C07A54',
                fontSize: '16px',
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <p
          className="font-inter text-center mt-6"
          style={{
            fontSize: '12px',
            color: '#999999',
          }}
        >
          Use your admin credentials to access the dashboard
        </p>
      </div>
    </main>
  );
}
