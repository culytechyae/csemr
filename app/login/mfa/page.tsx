'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MFAVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const loginToken = searchParams.get('token');

  useEffect(() => {
    if (!loginToken) {
      router.push('/login');
    }
  }, [loginToken, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.match(/^\d{6}$/)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, loginToken }),
      });

      if (response.ok) {
        // MFA verified - redirect to dashboard
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid verification code');
        setCode('');
      }
    } catch (error) {
      setError('An error occurred while verifying MFA code');
    } finally {
      setVerifying(false);
    }
  };

  if (!loginToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Taaleem Clinic Management
        </h1>
        <h2 className="text-xl font-semibold text-center mb-6 text-gray-600">
          MFA Verification Required
        </h2>

        <p className="text-sm text-gray-600 text-center mb-6">
          Please enter the 6-digit code from your authenticator app to complete login.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MFAVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MFAVerificationForm />
    </Suspense>
  );
}

