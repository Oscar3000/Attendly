'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function InvitePinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('/invite');

  useEffect(() => {
    // Get the redirect URL from query params
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/invite/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'PIN verification failed');
        setLoading(false);
        return;
      }

      // PIN verified - redirect to the original invitation URL
      router.push(redirectUrl);
    } catch (err) {
      console.error('PIN verification error:', err);
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
            className="font-inter font-semibold text-2xl sm:text-3xl mb-2"
            style={{ color: '#000000' }}
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
            Invitation Access
          </p>
        </div>

        {/* PIN Form */}
        <div
          className="rounded-lg p-6"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            className="font-inter font-bold mb-6 text-xl sm:text-2xl"
            style={{ color: '#000000' }}
          >
            Enter Access PIN
          </h2>

          <form onSubmit={handleSubmit}>
            {/* PIN Input */}
            <div className="mb-4">
              <label
                htmlFor="pin"
                className="font-inter font-medium mb-2 block"
                style={{
                  fontSize: '14px',
                  color: '#333333',
                }}
              >
                PIN Code
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                disabled={loading}
                maxLength={6}
                className="w-full rounded-lg border px-4 py-2 font-inter text-center text-2xl letter-spacing tracking-widest focus:outline-none focus:ring-2"
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
              disabled={loading || !pin}
              className="w-full rounded-lg px-4 py-2 font-inter font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: '#C07A54',
                fontSize: '16px',
              }}
            >
              {loading ? 'Verifying...' : 'Verify PIN'}
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
          Enter the PIN code from your invitation to continue
        </p>
      </div>
    </main>
  );
}
