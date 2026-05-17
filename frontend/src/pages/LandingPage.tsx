import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Shield, Star, Gift, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import heroBg from '@/assets/hero-bg.jpg';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Navbar from '@/components/Navbar';
import ReviewsSection from '@/components/ReviewsSection';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 500], [0, 150]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const features = [
    { icon: Star,   title: t('landing.feature_points_title'),  desc: t('landing.feature_points_desc')  },
    { icon: Gift,   title: t('landing.feature_rewards_title'), desc: t('landing.feature_rewards_desc') },
    { icon: Shield, title: t('landing.feature_secure_title'),  desc: t('landing.feature_secure_desc')  },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.img
          src={heroBg}
          alt="Elegant restaurant ambiance"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ y: yHero }}
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />


        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight"
            style={{ color: 'hsl(30, 25%, 95%)', opacity: opacityHero }}
          >
            {t('landing.hero_title').split(' ').map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                className="inline-block mr-3"
              >
                {word}
              </motion.span>
            ))}
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-gradient-warm block md:inline"
            >
              {t('landing.hero_highlight')}
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl mb-10 max-w-xl mx-auto"
            style={{ color: 'hsl(30, 15%, 75%)' }}
          >
            {t('landing.hero_subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
              {user ? (
                <button onClick={() => navigate('/dashboard')} className="btn-warm text-base px-8 py-4">
                  {t('nav.dashboard')}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-warm text-base px-8 py-4 flex items-center justify-center gap-2"
                  >
                    {t('landing.cta_signin')} <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-8 py-4 rounded-lg text-base font-medium border transition-all duration-300 hover:bg-primary-foreground/10"
                    style={{ color: 'hsl(30, 25%, 90%)', borderColor: 'hsla(30, 25%, 90%, 0.3)' }}
                  >
                    {t('landing.cta_register')}
                  </button>
                </>
              )}
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
              {t('landing.features_title')} <span className="text-gradient-warm">FidélitéPro</span>?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t('landing.features_subtitle')}
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ 
                  y: -10, 
                  transition: { duration: 0.3 },
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }}
                className="card-elegant text-center group"
              >
                <motion.div 
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors"
                >
                  <f.icon className="w-7 h-7 text-primary" />
                </motion.div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Reviews */}
      <ReviewsSection />

      {/* CTA */}
      <section className="py-20 px-6 bg-secondary">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">
            {t('landing.cta_section_title')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t('landing.cta_section_sub')}
          </p>
          <button 
            onClick={() => navigate(user ? '/dashboard' : '/register')} 
            className="btn-warm text-base px-8 py-4"
          >
            {user ? t('nav.dashboard') : t('landing.cta_start')}
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-background">
        <p className="text-center text-sm text-muted-foreground">
          {t('landing.footer')}
        </p>
      </footer>
    </div>
  );
}
