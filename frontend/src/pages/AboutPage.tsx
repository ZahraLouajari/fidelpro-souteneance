import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import { Users, Award, TrendingUp } from 'lucide-react';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
              {t('about.title')} <span className="text-gradient-warm">FidélitéPro</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('about.subtitle')}
            </p>
          </motion.div>

          <div className="prose prose-invert max-w-none mb-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">{t('about.mission_title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('about.mission_desc')}
                </p>
              </div>
              <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary mb-1">500+</p>
                    <p className="text-xs text-muted-foreground">{t('about.stats_restaurants')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary mb-1">10k+</p>
                    <p className="text-xs text-muted-foreground">{t('about.stats_users')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary mb-1">50k+</p>
                    <p className="text-xs text-muted-foreground">{t('about.stats_visits')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary mb-1">4.9/5</p>
                    <p className="text-xs text-muted-foreground">{t('about.stats_rating')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: t('about.val_community'), desc: t('about.val_community_desc') },
              { icon: Award, title: t('about.val_excellence'), desc: t('about.val_excellence_desc') },
              { icon: TrendingUp, title: t('about.val_innovation'), desc: t('about.val_innovation_desc') },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
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
