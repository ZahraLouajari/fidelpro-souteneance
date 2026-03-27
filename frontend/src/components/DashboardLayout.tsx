import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ThemeToggle from './ThemeToggle';
import NotificationsDropdown from './NotificationsDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, User, Gift, BarChart3, Users, QrCode,
  Settings, LogOut, Menu, X, UtensilsCrossed, Store, Award, Scan
} from 'lucide-react';

interface Props {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = {
  client: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'myqr', label: 'My QR Code', icon: QrCode },
    { id: 'profile', label: 'Profile', icon: User },
  ],
  restaurant: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'scan', label: 'Scan QR', icon: Scan },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'restaurants', label: 'Restaurants', icon: Store },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
};

export default function DashboardLayout({ children, activeTab, onTabChange }: Props) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = navItems[user?.role || 'client'];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card p-6 gap-2">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-warm-gold flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">FidélitéPro</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
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
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-warm-gold flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-display text-lg font-semibold">FidélitéPro</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <nav className="flex-1 flex flex-col gap-1">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { onTabChange(item.id); setSidebarOpen(false); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
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
              {activeTab === 'dashboard' ? 'Dashboard' : 
               activeTab === 'clients' ? 'Clients Management' :
               activeTab === 'restaurants' ? 'Restaurants Management' :
               activeTab === 'rewards' ? 'My Rewards' :
               activeTab === 'myqr' ? 'My QR Code' :
               activeTab === 'profile' ? 'Profile' :
               activeTab === 'analytics' ? 'Analytics' :
               activeTab === 'scan' ? 'Scan QR Code' :
               activeTab === 'settings' ? 'Settings' :
               activeTab}
            </h1>
          </div>
          <div className="flex items-center gap-3">
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
    </div>
  );
}