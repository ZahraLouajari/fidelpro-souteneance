import { motion } from 'framer-motion';
import { ArrowRight, Shield, Star, Gift, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBg from '@/assets/hero-bg.jpg';
import ThemeToggle from '@/components/ThemeToggle';

const features = [
  { icon: Star, title: 'Earn Points', desc: 'Collect loyalty points with every visit to your favorite restaurants.' },
  { icon: Gift, title: 'Unlock Rewards', desc: 'Redeem your points for exclusive dining experiences and free meals.' },
  { icon: Shield, title: 'Secure & Simple', desc: 'Your data is protected with enterprise-grade security standards.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <img
          src={heroBg}
          alt="Elegant restaurant ambiance"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />

        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-display font-bold text-primary-foreground mb-6 leading-tight"
            style={{ color: 'hsl(30, 25%, 95%)' }}
          >
            Dining Loyalty,{' '}
            <span className="text-gradient-warm">Reimagined</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl mb-10 max-w-xl mx-auto"
            style={{ color: 'hsl(30, 15%, 75%)' }}
          >
            The premium loyalty platform for restaurants and their guests.
            Earn rewards, build relationships, grow your business.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => navigate('/login')}
              className="btn-warm text-base px-8 py-4 flex items-center justify-center gap-2"
            >
              Sign In <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-lg text-base font-medium border transition-all duration-300 hover:bg-primary-foreground/10"
              style={{ color: 'hsl(30, 25%, 90%)', borderColor: 'hsla(30, 25%, 90%, 0.3)' }}
            >
              Create Account
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 animate-bounce" style={{ color: 'hsl(30, 25%, 70%)' }} />
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Why <span className="text-gradient-warm">FidélitéPro</span>?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              A complete loyalty ecosystem designed for the modern dining experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="card-elegant text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <f.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-secondary">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">
            Ready to elevate your dining loyalty?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of restaurants already using FidélitéPro.
          </p>
          <button onClick={() => navigate('/register')} className="btn-warm text-base px-8 py-4">
            Get Started Free
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-background">
        <p className="text-center text-sm text-muted-foreground">
          © 2026 FidélitéPro. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
