import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, ArrowRight, UserCheck, ShieldCheck } from '@phosphor-icons/react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { api } from '../services/api';

export const SignInPage: React.FC = () => {
  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotMsg(null);
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to request a reset link.');
      return;
    }
    try {
      const res = await api.forgotPassword(email);
      setForgotMsg(res.message);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2">
          <div className="w-10 h-10 rounded-md bg-[#294D68] text-white flex items-center justify-center font-serif text-2xl font-bold">
            P
          </div>
          <span className="font-heading font-extrabold text-2xl text-[#222D38]">PlanWise</span>
        </Link>
        <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-[#222D38]">
          Sign in to your account
        </h2>
        <p className="mt-1 text-sm text-[#65717A]">
          Collaborate on upcoming events and group decisions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#FBF9F4] py-8 px-6 border border-[#D9D6CD] rounded-xl shadow-sm sm:px-10 space-y-6">
          {error && (
            <div className="p-3 bg-[#A64F49]/10 border border-[#A64F49]/30 rounded-md text-xs font-semibold text-[#A64F49]">
              {error}
            </div>
          )}

          {forgotMsg && (
            <div className="p-3 bg-[#477B62]/10 border border-[#477B62]/30 rounded-md text-xs font-semibold text-[#477B62]">
              {forgotMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-[#294D68] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68] pr-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#65717A] hover:text-[#222D38]"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md bg-[#294D68] text-white text-sm font-heading font-bold hover:bg-[#1e384d] transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="pt-4 border-t border-[#D9D6CD]">
            <div className="text-xs font-bold text-[#65717A] uppercase tracking-wider mb-2">
              Fast Demo Sign In (1-Click)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={async () => {
                    setLoading(true);
                    await quickDemoLogin(acc.email);
                    navigate('/dashboard');
                  }}
                  className="p-2 text-left bg-[#EAE7DF] hover:bg-[#dfdbd1] border border-[#D9D6CD] rounded text-xs transition-colors"
                >
                  <div className="font-bold text-[#222D38] truncate">{acc.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-[#65717A] truncate">{acc.role.split('(')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-[#65717A] pt-2">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-[#294D68] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
