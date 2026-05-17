import { useState, useEffect } from 'react';
import { Bell, Gift, Star, MapPin, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { notificationAPI } from '@/api/endpoints';
import type { Notification } from '@/api/endpoints';

const iconMap: Record<string, React.ElementType> = {
  points: Star,
  reward: Gift,
  visit:  MapPin,
  system: Info,
  info:   Info,
  success: Gift,
  warning: Star,
};

// ─── Traductions des notifications par type ───────────────────────────────────
// Le backend stocke en français — on traduit côté frontend selon le type
const NOTIF_TRANSLATIONS: Record<string, Record<string, { title: string; message: string }>> = {
  visit: {
    fr: { title: 'Visite enregistrée! ⭐',          message: 'Votre visite a été validée. Continuez comme ça!' },
    en: { title: 'Visit recorded! ⭐',               message: 'Your visit has been validated. Keep it up!' },
    ar: { title: 'تم تسجيل الزيارة! ⭐',            message: 'تم التحقق من زيارتك. واصل!' },
  },
  reward: {
    fr: { title: 'Récompense débloquée! 🎁',         message: 'Vous avez gagné une récompense!' },
    en: { title: 'Reward unlocked! 🎁',              message: 'You have earned a reward!' },
    ar: { title: 'تم فتح المكافأة! 🎁',             message: 'لقد حصلت على مكافأة!' },
  },
  points: {
    fr: { title: 'Points gagnés! ⭐',               message: 'Vous avez gagné des points.' },
    en: { title: 'Points earned! ⭐',               message: 'You have earned points.' },
    ar: { title: 'تم اكتساب النقاط! ⭐',           message: 'لقد اكتسبت نقاطاً.' },
  },
  system: {
    fr: { title: 'Notification système',             message: 'Vous avez reçu un message.' },
    en: { title: 'System notification',             message: 'You have received a message.' },
    ar: { title: 'إشعار النظام',                   message: 'لقد تلقيت رسالة.' },
  },
};

// Parse JSON multilingue ou retourne le texte tel quel
function parseLang(raw: string, lang: string): string {
  try {
    const obj = JSON.parse(raw);
    if (typeof obj === 'object' && obj !== null) {
      const l = lang.startsWith('ar') ? 'ar' : lang.startsWith('en') ? 'en' : 'fr';
      return obj[l] || obj['fr'] || raw;
    }
  } catch {}
  return raw;
}

// Retourne le title/message traduit
function getTranslated(
  n: Notification,
  lang: string
): { title: string; message: string } {
  const l = lang.startsWith('ar') ? 'ar' : lang.startsWith('en') ? 'en' : 'fr';

  // 1 — Essai JSON multilingue (nouveau format backend)
  let title   = parseLang(n.title,   lang);
  let message = parseLang(n.message, lang);

  // 2 — Fallback: table statique par type (ancien format FR)
  if (title === n.title && l !== 'fr') {
    const map = NOTIF_TRANSLATIONS[n.type];
    if (map && map[l]) {
      title   = map[l].title;
      // message reste FR (contient les noms dynamiques)
    }
  }

  return { title, message };
}

export default function NotificationsDropdown() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'fr';

  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState<number>(0);
  const [loading, setLoading]             = useState<boolean>(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll();
      const data = response.data;
      if (data && typeof data === 'object' && 'notifications' in data) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      } else if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      const wasUnread = notifications.find(n => n.id === id)?.is_read === false;
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && notifications.length === 0) {
    return (
      <button className="relative w-10 h-10 rounded-full flex items-center justify-center bg-secondary">
        <Bell className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute end-0 top-12 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-display font-semibold text-foreground">
                  {t('notifications.title')}
                </h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                    {t('notifications.mark_all_read')}
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {t('notifications.no_notifications')}
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = iconMap[n.type] || Info;
                    const { title, message } = getTranslated(n, lang);
                    return (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`group flex items-start gap-3 p-4 border-b border-border/50 transition-colors cursor-pointer ${
                          !n.is_read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {new Date(n.created_at).toLocaleDateString(
                              lang.startsWith('ar') ? 'ar-MA' : lang.startsWith('en') ? 'en-GB' : 'fr-FR'
                            )}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteNotification(n.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}