import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UtensilsCrossed, Star, Gift, TrendingUp, MapPin, 
  X, Plus, QrCode, Check, Calendar, Clock, Award, Crown, Gem 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import { clientAPI } from '@/api/endpoints';
import type { ExtendedLoyaltyCard, AvailableRestaurant, DashboardResponse } from '@/api/endpoints';

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

export default function ClientDashboard({ tab }: { tab: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardResponse['stats'] | null>(null);
  const [cards, setCards] = useState<ExtendedLoyaltyCard[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; visits: number }[]>([]);
  const [showAddResto, setShowAddResto] = useState(false);
  const [availableRestos, setAvailableRestos] = useState<AvailableRestaurant[]>([]);
  const [addingResto, setAddingResto] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await clientAPI.dashboard();
        setStats(res.data.stats);
        setCards(res.data.loyalty_cards);
        
        if (res.data.available_restaurants) {
          setAvailableRestos(res.data.available_restaurants);
        }

        const rewardsRes = await clientAPI.rewards();
        const rewardsData = Array.isArray(rewardsRes.data) ? rewardsRes.data : [];
        setRewards(rewardsData);
        
        if (res.data.weekly_visits) {
          setWeeklyData(res.data.weekly_visits);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddRestaurant = async (restaurantId: number, restaurantName: string) => {
    try {
      setAddingResto(restaurantId);
      await clientAPI.joinRestaurant(restaurantId);
      
      const res = await clientAPI.dashboard();
      setStats(res.data.stats);
      setCards(res.data.loyalty_cards);
      if (res.data.available_restaurants) {
        setAvailableRestos(res.data.available_restaurants);
      }
      
      toast.success(`Successfully joined ${restaurantName}! 🎉`);
      setShowAddResto(false);
    } catch (err: any) {
      console.error('Failed to join restaurant:', err);
      toast.error(err.response?.data?.error || 'Failed to join restaurant. Please try again.');
    } finally {
      setAddingResto(null);
    }
  };

  const getProgressTowardNext = (card: ExtendedLoyaltyCard) => {
    const visits = card.current_visits;
    if (card.level === 'bronze') return { current: visits, total: 5 };
    if (card.level === 'silver') return { current: visits - 5, total: 5 };
    if (card.level === 'gold') return { current: visits - 10, total: 10 };
    return { current: 0, total: 1 };
  };

  // ==================== QR CODE TAB ====================
  if (tab === 'myqr') {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">My QR Code</h2>
        <p className="text-sm text-muted-foreground mb-6">Show this to the restaurant to scan your visit.</p>
        <div className="card-elegant inline-flex flex-col items-center gap-4 p-8">
          <div className="p-4 bg-background rounded-2xl border border-border">
            <QRCodeSVG
              value={`fidelitepro://client/${user?.id || '1'}`}
              size={200}
              fgColor="hsl(25, 20%, 15%)"
              bgColor="transparent"
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="font-display font-semibold text-foreground">{user?.name || 'Client'}</p>
          <p className="text-xs text-muted-foreground">Client ID: #{user?.id || '0001'}</p>
        </div>
      </div>
    );
  }

  // ==================== REWARDS TAB ====================
  if (tab === 'rewards') {
    const handleRedeem = async (rewardId: number, rewardName: string) => {
      try {
        await clientAPI.redeemReward(rewardId);
        const rewardsRes = await clientAPI.rewards();
        setRewards(Array.isArray(rewardsRes.data) ? rewardsRes.data : []);
        toast.success(`${rewardName} redeemed successfully! 🎉`);
      } catch (err) {
        console.error('Failed to redeem reward:', err);
        toast.error('Failed to redeem reward. Please try again.');
      }
    };

    const rewardsList = Array.isArray(rewards) ? rewards : [];

    return (
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">Your Rewards</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {rewardsList.length === 0 ? (
            <p className="text-muted-foreground col-span-2">No rewards yet. Keep visiting!</p>
          ) : (
            rewardsList.map((r: any) => (
              <motion.div
                key={r.id}
                className="card-elegant flex items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{r.reward || r.description}</p>
                  <p className="text-sm text-muted-foreground">{r.restaurant?.name || r.restaurantName}</p>
                  <p className="text-xs text-muted-foreground">
                    Unlocked {new Date(r.unlockedAt || r.created_at).toLocaleDateString()}
                  </p>
                </div>
                {r.redeemed ? (
                  <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Used
                  </span>
                ) : (
                  <button
                    onClick={() => handleRedeem(r.id, r.reward || r.description)}
                    className="btn-warm text-xs px-3 py-1.5"
                  >
                    Redeem
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ==================== PROFILE TAB ====================
  if (tab === 'profile') {
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');

    const handleSaveProfile = async () => {
      try {
        await clientAPI.updateProfile({ name, phone });
        const updatedUser = { ...user, name, phone };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success('Profile updated successfully! 🎉');
      } catch (err) {
        console.error('Failed to update profile:', err);
        toast.error('Failed to update profile. Please try again.');
      }
    };

    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">Profile</h2>
        <div className="card-elegant space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-display font-bold text-primary">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-muted text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
            />
          </div>
          <button onClick={handleSaveProfile} className="btn-warm text-sm">
            Save Changes
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
        <StatCard title="Restaurants" value={stats?.restaurants_visited || 0} icon={UtensilsCrossed} delay={0} />
        <StatCard title="Total Visits" value={stats?.total_visits || 0} icon={Star} delay={0.1} />
        <StatCard title="Points" value={stats?.points || 0} icon={TrendingUp} delay={0.2} />
        <StatCard title="Rewards" value={stats?.rewards_earned || 0} icon={Gift} delay={0.3} />
      </div>

      {weeklyData.length > 0 && (
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Your Visit Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">Loyalty Cards</h3>
          <button onClick={() => setShowAddResto(!showAddResto)} className="btn-warm text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Restaurant
          </button>
        </div>

        <AnimatePresence>
          {showAddResto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="card-elegant">
                <p className="text-sm font-medium text-foreground mb-3">
                  {availableRestos.length === 0 
                    ? "You've joined all available restaurants!" 
                    : "Choose a restaurant to join:"}
                </p>
                {availableRestos.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {availableRestos.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleAddRestaurant(r.id, r.name)}
                        disabled={addingResto === r.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UtensilsCrossed className="w-5 h-5 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.location} · {r.visits_required} visits → 🎁 {r.reward_description}
                          </p>
                        </div>
                        {addingResto === r.id && (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((card, i) => {
            const LevelIcon = levelIcons[card.level] || Star;
            const progress = getProgressTowardNext(card);
            return (
              <motion.div
                key={card.id}
                className="card-elegant"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-display font-semibold text-foreground">{card.restaurant.name}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {card.restaurant.location}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${levelColors[card.level]}`}>
                    {card.level.toUpperCase()}
                  </div>
                </div>

                <ProgressBar current={card.current_visits} total={card.total_required} className="mb-2" />

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {card.current_visits}/{card.total_required} visits
                  </p>
                  {card.status === 'active' && card.current_visits > 0 && (
                    <button
                      onClick={() => {
                        clientAPI.cancelVisit(card.id).then(() => {
                          toast.success('Visit cancelled successfully!');
                          window.location.reload();
                        }).catch(() => {
                          toast.error('Failed to cancel visit.');
                        });
                      }}
                      className="text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Cancel last
                    </button>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <LevelIcon className="w-4 h-4 text-primary" />
                      <span className="font-medium">Level: {card.level.toUpperCase()}</span>
                    </div>
                    {card.visits_to_next > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {card.visits_to_next} visits to {card.next_level}
                      </span>
                    )}
                  </div>
                  {card.visits_to_next > 0 && (
                    <div className="mt-2">
                      <ProgressBar
                        current={progress.current}
                        total={progress.total}
                        className="h-1.5"
                      />
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-2">🎁 {card.reward}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}