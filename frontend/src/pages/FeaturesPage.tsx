import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import { Star, Gift, Shield, Smartphone, Zap, Heart } from 'lucide-react';

export default function FeaturesPage() {
  const { t } = useTranslation();

  const features = [
    { icon: Star,       title: t('landing.feature_points_title'),  desc: t('landing.feature_points_desc')  },
    { icon: Gift,       title: t('landing.feature_rewards_title'), desc: t('landing.feature_rewards_desc') },
    { icon: Shield,     title: t('landing.feature_secure_title'),  desc: t('landing.feature_secure_desc')  },
    { icon: Smartphone, title: t('features_page.feat_mobile'),     desc: t('features_page.feat_mobile_desc') },
    { icon: Zap,        title: t('features_page.feat_scan'),       desc: t('features_page.feat_scan_desc') },
    { icon: Heart,      title: t('features_page.feat_favorites'),  desc: t('features_page.feat_favorites_desc') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
              {t('features_page.title')} <span className="text-gradient-warm">{t('features_page.title_highlight')}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('features_page.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-elegant group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-8 px-6 border-t border-border text-center text-sm text-muted-foreground">
        {t('landing.footer')}
      </footer>
    </div>
  );
}
