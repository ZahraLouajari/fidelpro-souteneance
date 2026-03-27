import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import type { UserRole } from '@/lib/mock-data';
import heroBg from '@/assets/hero-bg.jpg';

const roles: { value: UserRole; label: string }[] = [
  { value: 'client', label: 'Guest / Client' },
  { value: 'restaurant', label: 'Restaurant Owner' },
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(name, email, password, role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <h2 className="text-4xl font-display font-bold mb-3" style={{ color: 'hsl(30, 25%, 95%)' }}>
            Join FidélitéPro
          </h2>
          <p className="text-base" style={{ color: 'hsl(30, 15%, 70%)' }}>
            Create your account and start earning rewards today.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors mb-8 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground mb-8">Join the premium dining loyalty platform</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  required
                  minLength={4}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                      role === r.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input bg-background text-muted-foreground hover:border-foreground/20'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-warm w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? 'Creating...' : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
