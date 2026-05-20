import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('contact.toast_success'));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
              {t('contact.title')} <span className="text-gradient-warm">{t('contact.title_highlight')}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info Cards */}
            <div className="space-y-6">
              <div className="card-elegant flex items-center gap-6 p-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t('contact.info_email')}</h3>
                  <p className="text-muted-foreground">contact@fidelitepro.com</p>
                </div>
              </div>

              <div className="card-elegant flex items-center gap-6 p-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t('contact.info_phone')}</h3>
                  <p className="text-muted-foreground">+33 1 23 45 67 89</p>
                </div>
              </div>

              <div className="card-elegant flex items-center gap-6 p-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t('contact.info_office')}</h3>
                  <p className="text-muted-foreground">75001 Paris, France</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="card-elegant p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('contact.form_name')}</label>
                    <input required type="text" className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('contact.form_email')}</label>
                    <input required type="email" className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('contact.form_subject')}</label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('contact.form_message')}</label>
                  <textarea required rows={5} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <button type="submit" className="btn-warm w-full py-4 flex items-center justify-center gap-2">
                  {t('contact.form_send')} <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 px-6 border-t border-border text-center text-sm text-muted-foreground">
        {t('landing.footer')}
      </footer>
    </div>
  );
}
