import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
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
          Create your account
        </h2>
        <p className="mt-1 text-sm text-[#65717A]">
          Join your friends in making collaborative group decisions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#FBF9F4] py-8 px-6 border border-[#D9D6CD] rounded-xl shadow-sm sm:px-10 space-y-5">
          {error && (
            <div className="p-3 bg-[#A64F49]/10 border border-[#A64F49]/30 rounded-md text-xs font-semibold text-[#A64F49]">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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

            <div>
              <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md bg-[#294D68] text-white text-sm font-heading font-bold hover:bg-[#1e384d] transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center text-xs text-[#65717A] pt-3 border-t border-[#D9D6CD]">
            Already have an account?{' '}
            <Link to="/signin" className="font-bold text-[#294D68] hover:underline">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
