import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Users, Store, TrendingUp, BarChart3, Plus, Ban, Trash2, ChevronRight, Sparkles, Search, MessageSquare, Star, MapPin
} from 'lucide-react';
import MapPicker from '../MapPicker';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { toast } from 'sonner';

import StatCard from '@/components/StatCard';
import { adminAPI } from '@/api/endpoints';
import type { User, Restaurant, CreateRestaurantData } from '@/api/endpoints';

const levelColors: Record<string, string> = {
  bronze: 'bg-amber-600/20 text-amber-600',
  silver: 'bg-gray-400/20 text-gray-400',
  gold:   'bg-yellow-500/20 text-yellow-500',
  vip:    'bg-purple-500/20 text-purple-500',
};

export default function AdminDashboard({ tab }: { tab: string }) {
  const { t } = useTranslation();

  const [loading, setLoading]                         = useState(true);
  const [stats, setStats]                             = useState<any>(null);
  const [clients, setClients]                         = useState<User[]>([]);
  const [restaurants, setRestaurants]                 = useState<Restaurant[]>([]);
  const [monthlyGrowth, setMonthlyGrowth]             = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [topClients, setTopClients]                   = useState<any[]>([]);
  const [owners, setOwners]                           = useState<{ id: number; name: string }[]>([]);
  const [pendingReviews, setPendingReviews]           = useState<any[]>([]);
  const [clientsPage, setClientsPage]                 = useState(1);
  const [restaurantsPage, setRestaurantsPage]         = useState(1);
  const [reviewsPage, setReviewsPage]                 = useState(1);
  const [searchTerm, setSearchTerm]                   = useState('');
  const [showAddResto, setShowAddResto]               = useState(false);
  const [newResto, setNewResto]                       = useState<any>({
    name: '', location: '', category: '', visits_required: 10, reward_description: '', owner_id: 0,
    latitude: 33.5731, longitude: -7.5898
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, clientsRes, restosRes, growthRes, catsRes, topRes, ownersRes, reviewsRes] = await Promise.all([
          adminAPI.dashboard(),
          adminAPI.clients(clientsPage),
          adminAPI.restaurants(restaurantsPage),
          adminAPI.monthlyGrowth(),
          adminAPI.categoryDistribution(),
          adminAPI.topClients(),
          adminAPI.restaurantOwners(),
          adminAPI.pendingReviews(reviewsPage),
        ]);
        setStats(statsRes.data.stats);
        setClients(clientsRes.data.data);
        setRestaurants(restosRes.data.data);
        setMonthlyGrowth(growthRes.data);
        setCategoryDistribution(catsRes.data);
        setTopClients(topRes.data);
        setOwners(ownersRes.data);
        setPendingReviews(reviewsRes.data.data);
      } catch {
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientsPage, restaurantsPage]);

  const handleToggleBlock = async (userId: number) => {
    try {
      await adminAPI.toggleBlockUser(userId);
      toast.success(t('common.success'));
      const res = await adminAPI.clients(clientsPage);
      setClients(res.data.data);
    } catch { toast.error(t('common.error')); }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t('admin.confirm_delete_user') ?? 'Delete this user?')) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success(t('common.success'));
      const res = await adminAPI.clients(clientsPage);
      setClients(res.data.data);
    } catch { toast.error(t('common.error')); }
  };

  const handleDeleteRestaurant = async (restaurantId: number) => {
    if (!confirm(t('admin.confirm_delete_resto') ?? 'Delete this restaurant?')) return;
    try {
      await adminAPI.deleteRestaurant(restaurantId);
      toast.success(t('common.success'));
      const res = await adminAPI.restaurants(restaurantsPage);
      setRestaurants(res.data.data);
    } catch { toast.error(t('common.error')); }
  };

  const handleAddRestaurant = async () => {
    if (!newResto.name || !newResto.location || !newResto.owner_id || !newResto.reward_description) {
      toast.error(t('admin.fill_all_fields') ?? 'Veuillez remplir tous les champs obligatoires (Nom, Ville, Propriétaire, Récompense).');
      return;
    }
    try {
      await adminAPI.addRestaurant(newResto);
      toast.success(t('common.success'));
      setNewResto({ name: '', location: '', category: '', visits_required: 10, reward_description: '', owner_id: 0 });
      setShowAddResto(false);
      const res = await adminAPI.restaurants(restaurantsPage);
      setRestaurants(res.data.data);
    } catch (err: any) { 
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0] as string[];
        toast.error(firstError[0] || t('common.error'));
      } else {
        toast.error(t('common.error')); 
      }
    }
  };

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const levelData = [
    { name: t('client.level_bronze'), value: stats?.bronze_clients || 0, fill: 'hsl(28, 80%, 52%)' },
    { name: t('client.level_silver'), value: stats?.silver_clients || 0, fill: 'hsl(0, 0%, 60%)'   },
    { name: t('client.level_gold'),   value: stats?.gold_clients   || 0, fill: 'hsl(45, 100%, 55%)' },
    { name: t('client.level_vip'),    value: stats?.vip_clients    || 0, fill: 'hsl(270, 70%, 60%)' },
  ];

  // ==================== CLIENTS TAB ====================
  if (tab === 'clients') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-foreground">{t('dashboard.clients')}</h2>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('admin.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-9 pe-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
            />
          </div>
        </div>
        <div className="space-y-3">
          {filteredClients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('common.no_data')}</p>
          ) : (
            filteredClients.map((c) => (
              <div key={c.id} className="card-elegant flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${levelColors[(c as any).loyalty_level || 'bronze']}`}>
                      {t(`client.level_${(c as any).loyalty_level || 'bronze'}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleBlock(c.id)}
                  className={`transition-colors ${c.is_blocked ? 'text-primary' : 'text-muted-foreground hover:text-destructive'}`}
                  title={c.is_blocked ? t('admin.unblock') : t('admin.block')}
                >
                  <Ban className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(c.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title={t('admin.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ==================== RESTAURANTS TAB ====================
  if (tab === 'restaurants') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-foreground">{t('dashboard.restaurants')}</h2>
          <button onClick={() => setShowAddResto(!showAddResto)} className="btn-warm text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('admin.add_restaurant')}
          </button>
        </div>

        <AnimatePresence>
          {showAddResto && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
              <div className="card-elegant">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={newResto.name}     onChange={(e) => setNewResto({ ...newResto, name: e.target.value })}               placeholder={t('restaurant.restaurant_name')} className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
                  <input value={newResto.category} onChange={(e) => setNewResto({ ...newResto, category: e.target.value })}           placeholder={t('restaurant.category')}          className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
                  <input type="number" value={newResto.visits_required} onChange={(e) => setNewResto({ ...newResto, visits_required: parseInt(e.target.value) })} placeholder={t('restaurant.visits_required')} className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
                  <select 
                    value={newResto.owner_id} 
                    onChange={(e) => setNewResto({ ...newResto, owner_id: parseInt(e.target.value) })}
                    className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
                  >
                    <option value={0}>{t('admin.select_owner', 'Select Owner')}</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  <textarea value={newResto.reward_description} onChange={(e) => setNewResto({ ...newResto, reward_description: e.target.value })} placeholder={t('restaurant.reward_desc')} rows={2} className="col-span-2 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
                </div>
                
                <div className="mt-4 space-y-3">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> {t('restaurant.location')} *
                  </label>
                  <MapPicker 
                    onLocationSelect={(lat, lng) => setNewResto({ ...newResto, latitude: lat, longitude: lng })} 
                    onAddressSelect={(address) => setNewResto({ ...newResto, location: address })}
                    initialAddress={newResto.location}
                    initialPosition={[newResto.latitude, newResto.longitude]}
                    placeholder={t('restaurant.location_placeholder', 'Rechercher l\'adresse du restaurant...')}
                  />
                  <div className="flex justify-between px-1">
                    <p className="text-[10px] text-muted-foreground italic">
                      L'adresse sera automatiquement mise à jour via la recherche ou le clic sur la carte.
                    </p>
                    <p className="text-[10px] font-mono text-primary/70">
                      {newResto.latitude.toFixed(4)}, {newResto.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowAddResto(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-muted">{t('common.cancel')}</button>
                  <button onClick={handleAddRestaurant} className="btn-warm">{t('common.confirm')}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {restaurants.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('common.no_data')}</p>
          ) : (
            restaurants.map((r) => (
              <div key={r.id} className="card-elegant flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.location} · {r.category}</p>
                  <p className="text-xs text-muted-foreground">🎁 {r.reward_description} · {r.visits_required} {t('common.visits')}</p>
                </div>
                <button onClick={() => handleDeleteRestaurant(r.id)} className="text-muted-foreground hover:text-destructive transition-colors" title={t('admin.delete')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ==================== ANALYTICS TAB ====================
  if (tab === 'analytics') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-foreground">{t('dashboard.analytics')}</h2>

        {/* Level Distribution */}
        <div className="card-elegant">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-foreground">{t('admin.loyalty_levels')}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>Bronze → Silver → Gold → VIP</span>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={levelData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label>
                    {levelData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {levelData.map((level) => (
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

        {/* Monthly Growth */}
        {monthlyGrowth.length > 0 && (
          <div className="card-elegant">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('admin.monthly_growth')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="clients" stroke="hsl(var(--primary))"    strokeWidth={2.5} />
                <Line type="monotone" dataKey="visits"  stroke="hsl(38, 90%, 55%)" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Distribution */}
        {categoryDistribution.length > 0 && (
          <div className="card-elegant">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('admin.restaurant_categories')}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label>
                  {categoryDistribution.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Clients */}
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('admin.top_clients')}</h3>
          <div className="space-y-3">
            {topClients.map((c, i) => (
              <div key={c.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.restaurants} {t('client.stats_restaurants').toLowerCase()}</p>
                </div>
                <span className="text-sm font-semibold text-primary">{c.visits} {t('common.visits')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== SETTINGS TAB ====================
  if (tab === 'settings') {
    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">{t('dashboard.settings')}</h2>
        <div className="card-elegant space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">{t('admin.platform_name')}</label>
            <input defaultValue="FidélitéPro" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">{t('admin.support_email')}</label>
            <input defaultValue="support@fidelitepro.com" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">{t('admin.default_visits')}</label>
            <input type="number" defaultValue={10} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
          </div>
          <button className="btn-warm text-sm w-full">{t('admin.save_changes')}</button>
        </div>
      </div>
    );
  }

  // ==================== MODERATION TAB ====================
  if (tab === 'moderation') {
    const handleApproveReview = async (id: number) => {
      try {
        await adminAPI.approveReview(id);
        toast.success(t('common.success'));
        const res = await adminAPI.pendingReviews(reviewsPage);
        setPendingReviews(res.data.data);
      } catch { toast.error(t('common.error')); }
    };

    const handleDeleteReview = async (id: number) => {
      if (!confirm(t('common.confirm'))) return;
      try {
        await adminAPI.deleteReview(id);
        toast.success(t('common.success'));
        const res = await adminAPI.pendingReviews(reviewsPage);
        setPendingReviews(res.data.data);
      } catch { toast.error(t('common.error')); }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">{t('admin.moderation_title', 'Modération des avis')}</h2>
        
        <div className="space-y-4">
          {pendingReviews.length === 0 ? (
            <div className="card-elegant py-12 text-center text-muted-foreground">
              {t('admin.no_pending_reviews', 'Aucun avis en attente.')}
            </div>
          ) : (
            pendingReviews.map((review) => (
              <div key={review.id} className="card-elegant border-l-4 border-l-primary">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {review.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{review.user?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {review.type === 'restaurant' ? `Avis sur: ${review.restaurant?.name}` : 'Avis plateforme'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < review.rating ? "fill-current" : "opacity-30"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground italic mb-4">"{review.comment}"</p>
                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button onClick={() => handleDeleteReview(review.id)} className="px-4 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors">
                    {t('admin.delete')}
                  </button>
                  <button onClick={() => handleApproveReview(review.id)} className="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors">
                    {t('admin.approve', 'Approuver')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ==================== MAIN DASHBOARD ====================
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
        <StatCard title={t('admin.total_clients')}      value={stats?.total_clients      || 0}    icon={Users}     delay={0}   />
        <StatCard title={t('admin.total_restaurants')}  value={stats?.total_restaurants  || 0}    icon={Store}     delay={0.1} />
        <StatCard title={t('admin.total_visits')}       value={stats?.total_visits       || 0}    icon={BarChart3} delay={0.2} />
        <StatCard title={t('admin.growth')}             value={stats?.growth             || '+0%'} icon={TrendingUp} delay={0.3} subtitle="vs last month" />
      </div>

      {/* Level boxes */}
      <div className="card-elegant">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">{t('admin.loyalty_levels')}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>Bronze → Silver → Gold → VIP</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: 'bronze', stat: stats?.bronze_clients, color: 'text-amber-600',   bg: 'bg-amber-600/10'  },
            { key: 'silver', stat: stats?.silver_clients, color: 'text-gray-400',    bg: 'bg-gray-400/10'   },
            { key: 'gold',   stat: stats?.gold_clients,   color: 'text-yellow-500',  bg: 'bg-yellow-500/10' },
            { key: 'vip',    stat: stats?.vip_clients,    color: 'text-purple-500',  bg: 'bg-purple-500/10' },
          ].map(({ key, stat, color, bg }) => (
            <div key={key} className={`text-center p-3 rounded-lg ${bg}`}>
              <p className={`text-2xl font-bold ${color}`}>{stat || 0}</p>
              <p className="text-xs text-muted-foreground">{t(`client.level_${key}`)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Growth chart */}
      {monthlyGrowth.length > 0 && (
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('admin.monthly_growth')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="clients" stroke="hsl(var(--primary))"    strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="visits"  stroke="hsl(38, 90%, 55%)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Clients */}
      <div className="card-elegant">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">{t('admin.top_clients')}</h3>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            {t('restaurant.see_all')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {topClients.slice(0, 5).map((c, i) => (
            <div key={c.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.restaurants} {t('client.stats_restaurants').toLowerCase()}</p>
              </div>
              <span className="text-sm font-semibold text-primary">{c.visits} {t('common.visits')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}