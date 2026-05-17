import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/api/endpoints';
import heroBg from '@/assets/hero-bg.jpg';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [error, setError]               = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotMessage('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError(t('auth.error_invalid') ?? 'Invalid email or password.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError(t('auth.error_email_required') ?? 'Please enter your email address');
      return;
    }
    setIsForgotLoading(true);
    setError('');
    setForgotMessage('');
    try {
      const response = await authAPI.forgotPassword(email);
      const resetToken = response.data.token;
      const resetEmail = response.data.email;
      navigate(`/reset-password?token=${resetToken}&email=${encodeURIComponent(resetEmail)}`);
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/20">
      {/* Top-right controls */}
      <div className="absolute top-4 end-4 z-20 flex items-center gap-2">
        <LanguageSwitcher variant="ghost" />
        <ThemeToggle />
      </div>

      <div className="flex min-h-screen">
        {/* Left Side — Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Link
              to="/"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-colors mb-8 inline-flex items-center gap-1"
            >
              {t('auth.back_home')}
            </Link>

            <div className="mb-8">
              <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">
                {t('auth.login_title')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {t('auth.login_sub')}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {forgotMessage && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-sm border border-green-200 dark:border-green-800">
                {forgotMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full ps-10 pe-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-10 pe-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-500"
                  />
                  {t('auth.remember_me')}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isForgotLoading}
                  className="text-amber-500 hover:text-amber-600 hover:underline disabled:opacity-50"
                >
                  {isForgotLoading ? t('auth.sending') : t('auth.forgot_password')}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
              >
                {isLoading ? t('auth.signing_in') : <>{t('auth.signin')} <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-amber-500 hover:text-amber-600 font-medium hover:underline">
                {t('auth.signup')}
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Right Side — Hero Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/50 to-transparent" />
          <div className="absolute bottom-12 start-12 end-12 z-10">
            <h2 className="text-4xl font-display font-bold text-white mb-3">
              {t('auth.login_title')}
            </h2>
            <p className="text-base text-white/80">
              {t('auth.login_sub')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
