import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import { authService } from '../../services/api';

export const AuthPages: React.FC<{ onVerificationSuccess: () => void }> = ({ onVerificationSuccess }) => {
  const dispatch = useDispatch();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Invitation info
  const [inviteInfo, setInviteInfo] = useState<{
    fullName: string;
    email: string;
    role: string;
  } | null>(null);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('inviteToken') || params.get('token');
    if (token) {
      setLoading(true);
      authService.verifyInvitation(token)
        .then((res) => {
          const info = res.data.data.invitation;
          setInviteInfo(info);
          setEmail(info.email);
          setIsLogin(true); // force login mode for invited users
        })
        .catch((err) => {
          setInviteError(err.response?.data?.error || err.message || 'Invalid or expired invitation token.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await authService.login({ email, password });
        const { token, user, startupId, role } = res.data.data;
        dispatch(setCredentials({ token, user, startupId, role }));
        onVerificationSuccess();
      } else {
        await authService.register({ email, password, fullName });
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.verifyOtp({ email, otp });
      const { token, user } = res.data.data;
      dispatch(setCredentials({ token, user, startupId: null, role: null }));
      onVerificationSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Floating Animated Mesh Gradients */}
      <div className="mesh-glow mesh-indigo" />
      <div className="mesh-glow mesh-purple" />
      <div className="mesh-glow mesh-emerald" />

      <div className="w-full max-w-md liquid-glass p-8 rounded-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Hive
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {step === 'form'
              ? (isLogin ? 'Sign in to access your digital workspace' : 'Register your founder account')
              : 'Enter verification code to secure your session'
            }
          </p>
        </div>

        {inviteInfo && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-gray-200 space-y-1">
            <p className="font-bold text-indigo-400">Workspace Invitation</p>
            <p>
              Hello <strong>{inviteInfo.fullName}</strong>! You have been invited to join the startup workspace as a <strong>{inviteInfo.role}</strong>.
            </p>
            <p className="text-gray-400 mt-1">
              Please sign in with your email (<strong>{inviteInfo.email}</strong>) and the temporary password sent in the invitation email to accept.
            </p>
          </div>
        )}

        {inviteError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-xs">
            {inviteError}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-xs">
            {error}
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">FULL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="Erlich Bachman"
                  className="w-full glass-input text-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">EMAIL ADDRESS</label>
              <input
                type="email"
                required
                placeholder="founder@hive.co"
                className="w-full glass-input text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">PASSWORD</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full glass-input text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 rounded-lg bg-linear-to-r from-indigo-500 via-purple-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
            </button>

            {!inviteInfo && (
              <div className="text-center mt-6">
                <button
                  type="button"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium transition cursor-pointer"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                >
                  {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">ENTER 6-DIGIT OTP</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="000000"
                className="w-full glass-input text-center tracking-widest text-lg font-bold"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <p className="text-muted-foreground text-[10px] mt-1 text-center">Check your terminal log for the OTP code.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
                onClick={() => setStep('form')}
              >
                Back to Registration
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default AuthPages;
