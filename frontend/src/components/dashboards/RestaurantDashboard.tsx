import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UtensilsCrossed, Star, Gift, TrendingUp, Users, 
  MapPin, X, Plus, QrCode, Check, BarChart3, 
  Award, Crown, Gem, Sparkles, Settings, 
  ChevronRight, Search, Clock, Calendar, ChevronDown,
  Ban, Camera, User
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';

import StatCard from '@/components/StatCard';
import { restaurantAPI } from '@/api/endpoints';
import type { LoyaltyCard, Restaurant, Visit } from '@/api/endpoints';
import ProgressBar from '@/components/ProgressBar';

// Level colors for badges
const levelColors: Record<string, string> = {
  bronze: 'bg-amber-600/20 text-amber-600 border-amber-600/30',
  silver: 'bg-gray-400/20 text-gray-400 border-gray-400/30',
  gold: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  vip: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
};

const levelIcons: Record<string, React.ElementType> = {
  bronze: Star,
  silver: Star,
  gold: Award,
  vip: Crown,
};

interface RestaurantDashboardProps {
  tab: string;
  onTabChange?: (tab: string) => void;
}

interface LevelStats {
  bronze: number;
  silver: number;
  gold: number;
  vip: number;
}

// Helper function to safely get numeric value
const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || defaultValue;
  if (typeof value === 'object' && value !== null) {
    // Try to extract common properties
    if ('count' in value) return safeNumber(value.count);
    if ('value' in value) return safeNumber(value.value);
    if ('total' in value) return safeNumber(value.total);
  }
  return defaultValue;
};

export default function RestaurantDashboard({ tab, onTabChange }: RestaurantDashboardProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [levelStats, setLevelStats] = useState<LevelStats | null>(null);
  const [clients, setClients] = useState<LoyaltyCard[]>([]);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [showAddClient, setShowAddClient] = useState<boolean>(false);
  const [newClientEmail, setNewClientEmail] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAllVisits, setShowAllVisits] = useState<boolean>(false);
  const [showAllClients, setShowAllClients] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [manualClientId, setManualClientId] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const res = await restaurantAPI.dashboard();
        setRestaurant(res.data.restaurant);
        setStats(res.data.stats);
        setLevelStats(res.data.level_stats || null);
        setRecentVisits(res.data.recent_visits || []);

        const clientsRes = await restaurantAPI.clients();
        setClients(clientsRes.data);

        const weeklyRes = await restaurantAPI.weeklyStats();
        setWeeklyData(weeklyRes.data);
        
        // Debug: log the stats to see what's coming from the API
       // console.log('Stats from API:', res.data.stats);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddClient = async (): Promise<void> => {
    if (!newClientEmail) return;
    try {
      await restaurantAPI.addClient({ email: newClientEmail });
      toast.success('Client added successfully!');
      setNewClientEmail('');
      setShowAddClient(false);
      const clientsRes = await restaurantAPI.clients();
      setClients(clientsRes.data);
    } catch (err) {
      toast.error('Failed to add client');
    }
  };

  const handleRecordVisit = async (clientId: number): Promise<void> => {
    try {
      await restaurantAPI.addVisit(clientId);
      toast.success('Visit recorded successfully!');
      const dashboardRes = await restaurantAPI.dashboard();
      setStats(dashboardRes.data.stats);
      setLevelStats(dashboardRes.data.level_stats || null);
      setRecentVisits(dashboardRes.data.recent_visits || []);
      const clientsRes = await restaurantAPI.clients();
      setClients(clientsRes.data);
    } catch (err) {
      toast.error('Failed to record visit');
    }
  };

  const handleManualRecord = async (): Promise<void> => {
    if (!manualClientId) {
      toast.error('Please enter a client ID');
      return;
    }
    
    setIsRecording(true);
    try {
      await restaurantAPI.addVisit(parseInt(manualClientId));
      toast.success(`Visit recorded for client #${manualClientId}! 🎉`);
      setManualClientId('');
      
      const dashboardRes = await restaurantAPI.dashboard();
      setStats(dashboardRes.data.stats);
      setLevelStats(dashboardRes.data.level_stats || null);
      setRecentVisits(dashboardRes.data.recent_visits || []);
      const clientsRes = await restaurantAPI.clients();
      setClients(clientsRes.data);
    } catch (err) {
      toast.error('Failed to record visit. Client ID may not exist.');
    } finally {
      setIsRecording(false);
    }
  };

  const handleBlockClient = async (clientId: number): Promise<void> => {
    try {
      await restaurantAPI.blockClient(clientId);
      toast.success('Client blocked successfully');
      const clientsRes = await restaurantAPI.clients();
      setClients(clientsRes.data);
    } catch (err) {
      toast.error('Failed to block client');
    }
  };

  const handleUpdateSettings = async (settings: Partial<Restaurant>): Promise<void> => {
    setIsSaving(true);
    try {
      await restaurantAPI.updateSettings(settings);
      toast.success('Settings updated successfully!');
      setRestaurant(prev => prev ? { ...prev, ...settings } : null);
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      // Ensure error message is a string
      let errorMessage = 'Failed to update settings';
      if (err.response?.data?.errors) {
        if (typeof err.response.data.errors === 'object') {
          errorMessage = Object.values(err.response.data.errors).flat().join(', ');
        } else {
          errorMessage = String(err.response.data.errors);
        }
      } else if (err.response?.data?.message) {
        errorMessage = String(err.response.data.message);
      } else if (err.message) {
        errorMessage = String(err.message);
      }
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = clients.filter(card => 
    card.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.client?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedClients = showAllClients ? filteredClients : filteredClients.slice(0, 5);
  const displayedVisits = showAllVisits ? recentVisits : recentVisits.slice(0, 5);

  const levelChartData = levelStats ? [
    { name: 'Bronze', value: safeNumber(levelStats.bronze), fill: 'hsl(28, 80%, 52%)' },
    { name: 'Silver', value: safeNumber(levelStats.silver), fill: 'hsl(0, 0%, 60%)' },
    { name: 'Gold', value: safeNumber(levelStats.gold), fill: 'hsl(45, 100%, 55%)' },
    { name: 'VIP', value: safeNumber(levelStats.vip), fill: 'hsl(270, 70%, 60%)' },
  ] : [];

  const getProgressTowardNext = (card: LoyaltyCard): { current: number; total: number } => {
    const visits = card.current_visits;
    const level = card.loyalty_level || 'bronze';
    if (level === 'bronze') return { current: visits, total: 5 };
    if (level === 'silver') return { current: visits - 5, total: 5 };
    if (level === 'gold') return { current: visits - 10, total: 10 };
    return { current: 0, total: 1 };
  };

  // ==================== CLIENTS TAB ====================
  if (tab === 'clients') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-foreground">Client Management</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
              />
            </div>
            <button onClick={() => setShowAddClient(!showAddClient)} className="btn-warm text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Client
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showAddClient && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
              <div className="card-elegant">
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="client@email.com"
                    className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                  />
                  <button onClick={handleAddClient} className="btn-warm">Add</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {filteredClients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No clients found</p>
          ) : (
            <>
              {displayedClients.map((card) => {
                const progress = getProgressTowardNext(card);
                return (
                  <div key={card.id} className="card-elegant flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {card.client?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{card.client?.name || 'Client'}</p>
                      <p className="text-xs text-muted-foreground">{card.client?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${levelColors[card.loyalty_level || 'bronze']}`}>
                          {(card.loyalty_level || 'bronze').toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {card.current_visits} visits
                        </span>
                      </div>
                      {progress.total > 0 && (
                        <div className="mt-2">
                          <ProgressBar current={progress.current} total={progress.total} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {progress.total - progress.current} visits to next level
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRecordVisit(card.client_id)}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                      >
                        Record Visit
                      </button>
                      <button
                        onClick={() => handleBlockClient(card.client_id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Block"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredClients.length > 5 && (
                <button
                  onClick={() => setShowAllClients(!showAllClients)}
                  className="w-full text-center text-sm text-primary hover:underline py-2 flex items-center justify-center gap-1"
                >
                  {showAllClients ? 'Show less' : `View all ${filteredClients.length} clients`}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAllClients ? 'rotate-180' : ''}`} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ==================== SCAN TAB (MANUAL ENTRY) ====================
  if (tab === 'scan') {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Record Visit</h2>
          <p className="text-sm text-muted-foreground">Enter client ID to record a visit instantly</p>
        </div>
        
        <div className="card-elegant p-6">
          <div className="bg-primary/10 rounded-xl p-6 mb-6 text-center">
            <User className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Enter the client ID from their profile or QR code
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="number"
                value={manualClientId}
                onChange={(e) => setManualClientId(e.target.value)}
                placeholder="Client ID (e.g., 1, 2, 3...)"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground text-center text-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualRecord();
                  }
                }}
              />
            </div>
            
            <button
              onClick={handleManualRecord}
              disabled={isRecording}
              className="btn-warm w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <QrCode className="w-5 h-5" />
              {isRecording ? 'Recording...' : 'Record Visit'}
            </button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              💡 Tip: Client ID can be found in the client's profile or QR code
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Example IDs: 1, 2, 3, 4, 5...
            </p>
          </div>
        </div>
        
        <div className="mt-6">
          <p className="text-sm text-muted-foreground text-center mb-3">Quick demo clients:</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {[1, 2, 3, 4, 5].map((id) => (
              <button
                key={id}
                onClick={() => {
                  setManualClientId(id.toString());
                  setTimeout(() => handleManualRecord(), 100);
                }}
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-primary/20 transition-colors"
              >
                Client #{id}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== ANALYTICS TAB ====================
  if (tab === 'analytics') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-foreground">Analytics</h2>
        
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Client Loyalty Levels</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={levelChartData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label>
                    {levelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {levelChartData.map((level) => (
                <div key={level.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level.fill }} />
                    <span className="text-sm text-foreground">{level.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{level.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {weeklyData.length > 0 && (
          <div className="card-elegant">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Weekly Visits</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentVisits.slice(0, 5).map((visit) => (
              <div key={visit.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{visit.client?.name || 'Client'}</p>
                  <p className="text-xs text-muted-foreground">Visit recorded</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{new Date(visit.created_at).toLocaleDateString()}</p>
                  <p className="text-xs font-medium text-primary">+1 pt</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== SETTINGS TAB ====================
  if (tab === 'settings') {
    const [settings, setSettings] = useState({
      name: restaurant?.name || '',
      location: restaurant?.location || '',
      category: restaurant?.category || '',
      visits_required: restaurant?.visits_required || 10,
      reward_description: restaurant?.reward_description || '',
    });

    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">Restaurant Settings</h2>
        <div className="card-elegant space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Restaurant Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Location</label>
            <input
              type="text"
              value={settings.location}
              onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
            <input
              type="text"
              value={settings.category}
              onChange={(e) => setSettings({ ...settings, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Visits Required</label>
            <input
              type="number"
              value={settings.visits_required}
              onChange={(e) => setSettings({ ...settings, visits_required: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Reward Description</label>
            <textarea
              value={settings.reward_description}
              onChange={(e) => setSettings({ ...settings, reward_description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
            />
          </div>
          <button 
            onClick={() => handleUpdateSettings(settings)} 
            disabled={isSaving}
            className="btn-warm text-sm w-full disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  // ==================== DASHBOARD (MAIN) ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Clients" 
          value={safeNumber(stats?.total_clients)} 
          icon={Users} 
          delay={0} 
        />
        <StatCard 
          title="Visits Today" 
          value={safeNumber(stats?.visits_today)} 
          icon={Star} 
          delay={0.1} 
        />
        <StatCard 
          title="This Week" 
          value={safeNumber(stats?.visits_week)} 
          icon={BarChart3} 
          delay={0.2} 
        />
        <StatCard 
          title="Rewards Given" 
          value={safeNumber(stats?.rewards_given)} 
          icon={Gift} 
          delay={0.3} 
        />
      </div>

      <div className="card-elegant">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">Client Loyalty Levels</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>Bronze → Silver → Gold → VIP</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-amber-600/10">
            <p className="text-2xl font-bold text-amber-600">{safeNumber(levelStats?.bronze)}</p>
            <p className="text-xs text-muted-foreground">Bronze</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-400/10">
            <p className="text-2xl font-bold text-gray-400">{safeNumber(levelStats?.silver)}</p>
            <p className="text-xs text-muted-foreground">Silver</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10">
            <p className="text-2xl font-bold text-yellow-500">{safeNumber(levelStats?.gold)}</p>
            <p className="text-xs text-muted-foreground">Gold</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-500/10">
            <p className="text-2xl font-bold text-purple-500">{safeNumber(levelStats?.vip)}</p>
            <p className="text-xs text-muted-foreground">VIP</p>
          </div>
        </div>
      </div>

      {weeklyData.length > 0 && (
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Weekly Visits</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">Recent Visits</h3>
          <button onClick={() => setShowAllVisits(!showAllVisits)} className="text-sm text-primary hover:underline flex items-center gap-1">
            {showAllVisits ? 'Show less' : 'View all'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAllVisits ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="space-y-2">
          {displayedVisits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No visits recorded yet</p>
          ) : (
            displayedVisits.map((v) => (
              <div key={v.id} className="card-elegant flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{v.client?.name || 'Client'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-primary">+1 pt</span>
              </div>
            ))
          )}
          {recentVisits.length > 5 && !showAllVisits && (
            <button onClick={() => setShowAllVisits(true)} className="w-full text-center text-sm text-primary hover:underline py-2">
              View all {recentVisits.length} visits
            </button>
          )}
        </div>
      </div>
    </div>
  );
}