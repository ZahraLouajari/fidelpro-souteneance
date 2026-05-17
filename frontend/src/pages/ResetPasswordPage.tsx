import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Eye, EyeOff, Mail } from 'lucide-react';
import { authAPI } from '@/api/endpoints';
import heroBg from '@/assets/hero-bg.jpg';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  const [verificationCode, setVerificationCode]       = useState('');
  const [password, setPassword]                       = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPw, setShowPw]                           = useState(false);
  const [showPwConfirm, setShowPwConfirm]             = useState(false);
  const [loading, setLoading]                         = useState(false);
  const [error, setError]                             = useState('');
  const [success, setSuccess]                         = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      setError(t('auth.error_invalid_link') ?? 'Invalid reset link. Please request a new password reset.');
    }
  }, [email, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificationCode) { setError(t('auth.error_code_required') ?? 'Please enter the verification code'); return; }
    if (verificationCode.length !== 6) { setError(t('auth.error_code_length') ?? 'Code must be 6 digits'); return; }
    if (password !== passwordConfirmation) { setError(t('auth.error_pw_mismatch') ?? 'Passwords do not match'); return; }
    if (password.length < 6) { setError(t('auth.error_pw_short') ?? 'Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      await authAPI.resetPassword({
        email: email!,
        code: verificationCode,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(t('auth.reset_success') ?? 'Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Top-right controls */}
      <div className="absolute top-4 end-4 z-20 flex items-center gap-2">
        <LanguageSwitcher variant="ghost" />
        <ThemeToggle />
      </div>

      {/* Left side — Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent" />
        <div className="absolute bottom-12 start-12 end-12 z-10">
          <h2 className="text-4xl font-display font-bold text-white mb-3">
            {t('auth.reset_title')}
          </h2>
          <p className="text-base text-white/80">{t('auth.reset_sub')}</p>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors mb-8 inline-block">
            {t('auth.back_home')}
          </Link>

          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t('auth.reset_title')}
          </h1>
          <p className="text-muted-foreground mb-8">{t('auth.reset_sub')}</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-sm border border-green-200 dark:border-green-800">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email (disabled) */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email || ''}
                  disabled
                  className="w-full ps-10 pe-4 py-3 rounded-xl border border-border bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            {/* Verification Code */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {t('auth.verification_code')}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  className="w-full ps-10 pe-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all tracking-widest text-center text-lg font-mono"
                  required
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {t('auth.new_password')}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full ps-10 pe-10 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {t('auth.confirm_password')}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPwConfirm ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="••••••••"
                  className="w-full ps-10 pe-10 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwConfirm(!showPwConfirm)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-warm-gold text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
            >
              {loading
                ? t('auth.resetting')
                : <>{t('auth.reset_btn')} <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t('auth.remember_password')}{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              {t('auth.signin')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
