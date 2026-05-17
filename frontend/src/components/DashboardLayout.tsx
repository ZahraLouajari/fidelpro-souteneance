import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import NotificationsDropdown from './NotificationsDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, User, Gift, BarChart3, Users, QrCode,
  Settings, LogOut, Menu, X, UtensilsCrossed, Store, Scan, Star, MessageSquare, Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReviewForm from './ReviewForm';

interface Props {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, onTabChange }: Props) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPlatformReview, setShowPlatformReview] = useState(false);

  const navItems = {
    client: [
      { id: 'dashboard', label: t('dashboard.overview'),     icon: LayoutDashboard },
      { id: 'rewards',   label: t('dashboard.rewards'),      icon: Gift },
      { id: 'myqr',      label: t('dashboard.my_qr'),        icon: QrCode },
      { id: 'profile',   label: t('auth.name'),              icon: User },
    ],
    restaurant: [
      { id: 'dashboard', label: t('dashboard.overview'),     icon: LayoutDashboard },
      { id: 'clients',   label: t('dashboard.clients'),      icon: Users },
      { id: 'scan',      label: t('dashboard.scan'),         icon: Scan },
      { id: 'promos',    label: t('dashboard.promos'),       icon: Tag },
      { id: 'analytics', label: t('dashboard.analytics'),    icon: BarChart3 },
      { id: 'settings',  label: t('dashboard.settings'),     icon: Settings },
    ],
    admin: [
      { id: 'dashboard',   label: t('dashboard.overview'),     icon: LayoutDashboard },
      { id: 'clients',     label: t('dashboard.clients'),      icon: Users },
      { id: 'restaurants', label: t('dashboard.restaurants'),  icon: Store },
      { id: 'moderation',  label: t('admin.moderation_title', 'Modération'), icon: MessageSquare },
      { id: 'analytics',   label: t('dashboard.analytics'),    icon: BarChart3 },
      { id: 'settings',    label: t('dashboard.settings'),     icon: Settings },
    ],
  };

  const items = navItems[user?.role || 'client'];

  const tabTitle: Record<string, string> = {
    dashboard:   t('dashboard.overview'),
    clients:     t('dashboard.clients'),
    restaurants: t('dashboard.restaurants'),
    rewards:     t('dashboard.rewards'),
    myqr:        t('dashboard.my_qr'),
    profile:     t('nav.dashboard'),
    analytics:   t('dashboard.analytics'),
    scan:        t('dashboard.scan'),
    settings:    t('dashboard.settings'),
    promos:      t('dashboard.promos'),
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link to="/" className={`flex items-center gap-3 ${mobile ? 'mb-6' : 'mb-8'} hover:opacity-80 transition-opacity`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-warm-gold flex items-center justify-center">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-lg font-semibold text-foreground">FidélitéPro</span>
      </Link>

      <nav className="flex-1 flex flex-col gap-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => { onTabChange(item.id); if (mobile) setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}

        {/* Rate Platform Button for Client/Restaurant */}
        {(user?.role === 'client' || user?.role === 'restaurant') && (
          <button
            onClick={() => { setShowPlatformReview(true); if (mobile) setSidebarOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-all mt-4 border border-primary/20 border-dashed"
          >
            <Star className="w-5 h-5 fill-primary/10" />
            {t('review.rate_platform', 'Noter FidélitéPro')}
          </button>
        )}
      </nav>

      <div className="border-t border-border pt-4 mt-4">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          {t('dashboard.logout')}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card p-6 gap-2">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-6 z-50 flex flex-col gap-2 lg:hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div /> {/* spacer */}
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-display font-semibold text-foreground capitalize">
              {tabTitle[activeTab] ?? activeTab}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="ghost" />
            <NotificationsDropdown />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showPlatformReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/60 backdrop-blur-sm">
            <ReviewForm
              type="platform"
              onClose={() => setShowPlatformReview(false)}
              onSuccess={() => setShowPlatformReview(false)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
