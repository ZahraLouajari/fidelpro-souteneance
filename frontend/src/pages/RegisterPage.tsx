import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [name, setName]                               = useState('');
  const [email, setEmail]                             = useState('');
  const [password, setPassword]                       = useState('');
  const [confirmPassword, setConfirmPassword]         = useState('');
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole]                               = useState('client');
  const [error, setError]                             = useState('');
  const [errors, setErrors]                           = useState<Record<string, string[]>>({});
  const [loading, setLoading]                         = useState(false);
  const navigate = useNavigate();

  const roles = [
    { value: 'client',     label: t('auth.role_client') },
    { value: 'restaurant', label: t('auth.role_restaurant') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    if (!name.trim())                    { setError(t('auth.error_name_required') ?? 'Name is required'); return; }
    if (!email.trim())                   { setError(t('auth.error_email_required') ?? 'Email is required'); return; }
    if (password !== confirmPassword)    { setError(t('auth.error_pw_mismatch')    ?? 'Passwords do not match'); return; }
    if (password.length < 6)            { setError(t('auth.error_pw_short')        ?? 'Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:                  name.trim(),
          email:                 email.trim(),
          password,
          password_confirmation: confirmPassword,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show field-level errors from Laravel validation
        if (data.errors) {
          setErrors(data.errors);
          const allErrors = Object.values(data.errors).flat() as string[];
          setError(allErrors.join(' — '));
        } else {
          setError(data.error || data.message || t('common.error'));
        }
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (field: string) =>
    errors[field] ? (
      <p className="text-xs text-red-500 mt-1">{errors[field][0]}</p>
    ) : null;

  return (
    <div className="min-h-screen flex">
      {/* Top-right controls */}
      <div className="absolute top-4 end-4 z-20 flex items-center gap-2">
        <LanguageSwitcher variant="ghost" />
        <ThemeToggle />
      </div>

      {/* Left side — Hero Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent" />
        <div className="absolute bottom-12 start-12 end-12 z-10">
          <h2 className="text-4xl font-display font-bold text-white mb-3">{t('auth.register_title')}</h2>
          <p className="text-base text-white/80">{t('auth.register_sub')}</p>
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

          <h1 className="text-3xl font-display font-bold text-foreground mb-2">{t('auth.register_title')}</h1>
          <p className="text-muted-foreground mb-8">{t('auth.register_sub')}</p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t('auth.name')}</label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('auth.name')}
                  className={`w-full ps-10 pe-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.name ? 'border-red-400' : 'border-input'}`}
                />
              </div>
              {fieldError('name')}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={`w-full ps-10 pe-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.email ? 'border-red-400' : 'border-input'}`}
                />
              </div>
              {fieldError('email')}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  className={`w-full ps-10 pe-10 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.password ? 'border-red-400' : 'border-input'}`}
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldError('password')}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t('auth.confirm_password')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full ps-10 pe-10 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                  minLength={6}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t('auth.i_am')}</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                      role === r.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                        : 'border-input bg-background text-muted-foreground hover:border-amber-500/30'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? t('auth.signing_up')
                : <>{t('auth.signup')} <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-amber-600 hover:text-amber-500 font-medium">
              {t('auth.signin')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}