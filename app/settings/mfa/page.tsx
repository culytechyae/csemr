'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';

export default function MFASettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMFASatus();
  }, []);

  const fetchMFASatus = async () => {
    try {
      const response = await fetch('/api/auth/mfa/status');
      if (response.ok) {
        const data = await response.json();
        setMfaEnabled(data.mfaEnabled);
      }
    } catch (error) {
      console.error('Failed to fetch MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupMFA = async () => {
    setSettingUp(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setSuccess(data.message);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        const errorMessage = errorData.error || 'Failed to setup MFA';
        setError(errorMessage);
        console.error('MFA setup error:', errorMessage);
      }
    } catch (error) {
      setError('An error occurred while setting up MFA');
    } finally {
      setSettingUp(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode.match(/^\d{6}$/)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode, enableMFA: true }),
      });

      if (response.ok) {
        setSuccess('MFA enabled successfully!');
        setMfaEnabled(true);
        setQrCode(null);
        setSecret(null);
        setVerificationCode('');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('An error occurred while verifying MFA code');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!password) {
      setError('Password is required to disable MFA');
      return;
    }

    setDisabling(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setSuccess('MFA disabled successfully');
        setMfaEnabled(false);
        setPassword('');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disable MFA');
      }
    } catch (error) {
      setError('An error occurred while disabling MFA');
    } finally {
      setDisabling(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'MFA Settings' },
          ]}
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Multi-Factor Authentication</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          {!mfaEnabled ? (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Enable MFA</h2>
                <p className="text-gray-600 mb-4">
                  Multi-factor authentication adds an extra layer of security to your account.
                  You'll need to enter a code from your authenticator app when logging in.
                </p>

                {!qrCode ? (
                  <button
                    onClick={handleSetupMFA}
                    disabled={settingUp}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {settingUp ? 'Setting up...' : 'Enable MFA'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                      </p>
                      <div className="flex justify-center mb-4">
                        <img src={qrCode} alt="MFA QR Code" className="border border-gray-300 rounded" />
                      </div>
                      {secret && (
                        <div className="bg-gray-50 p-3 rounded mb-4">
                          <p className="text-xs text-gray-600 mb-1">Manual Entry Secret:</p>
                          <code className="text-sm font-mono">{secret}</code>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter the 6-digit code from your authenticator app:
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleVerifyAndEnable}
                        disabled={verifying || verificationCode.length !== 6}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {verifying ? 'Verifying...' : 'Verify and Enable'}
                      </button>
                      <button
                        onClick={() => {
                          setQrCode(null);
                          setSecret(null);
                          setVerificationCode('');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-800 font-medium">MFA is enabled for your account</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Disable MFA</h2>
                <p className="text-gray-600 mb-4">
                  To disable MFA, please enter your password to confirm.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleDisableMFA}
                    disabled={disabling || !password}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {disabling ? 'Disabling...' : 'Disable MFA'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

