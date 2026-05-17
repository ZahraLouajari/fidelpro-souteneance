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
    { icon: Smartphone, title: "Expérience Mobile",              desc: "Une interface fluide conçue pour être utilisée en déplacement." },
    { icon: Zap,        title: "Scan Instantané",                desc: "Validez vos visites en un clin d'œil avec le QR code unique." },
    { icon: Heart,      title: "Favoris",                        desc: "Gardez vos restaurants préférés à portée de main." },
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
              Nos <span className="text-gradient-warm">Fonctionnalités</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez tout ce que FidélitéPro peut faire pour vous, que vous soyez un gourmet ou un restaurateur.
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
