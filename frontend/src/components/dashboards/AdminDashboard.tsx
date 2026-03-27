import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Store, TrendingUp, Gift, BarChart3, 
  Plus, Ban, Trash2, X, ChevronDown, ChevronRight,
  Award, Crown, Gem, Sparkles, Settings, Search,
  Calendar, Clock, PieChart as PieChartIcon
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

import StatCard from '@/components/StatCard';
import { adminAPI } from '@/api/endpoints';
import type { User, Restaurant, CreateRestaurantData } from '@/api/endpoints';

// Level colors
const levelColors: Record<string, string> = {
  bronze: 'bg-amber-600/20 text-amber-600',
  silver: 'bg-gray-400/20 text-gray-400',
  gold: 'bg-yellow-500/20 text-yellow-500',
  vip: 'bg-purple-500/20 text-purple-500',
};

const levelIcons: Record<string, React.ElementType> = {
  bronze: Award,
  silver: Award,
  gold: Crown,
  vip: Gem,
};

export default function AdminDashboard({ tab }: { tab: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [clients, setClients] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [clientsPage, setClientsPage] = useState(1);
  const [restaurantsPage, setRestaurantsPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddResto, setShowAddResto] = useState(false);
  const [newResto, setNewResto] = useState<CreateRestaurantData>({
    name: '',
    location: '',
    category: '',
    visits_required: 10,
    reward_description: '',
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Dashboard stats
        const statsRes = await adminAPI.dashboard();
        setStats(statsRes.data.stats);
        
        // Clients
        const clientsRes = await adminAPI.clients(clientsPage);
        setClients(clientsRes.data.data);
        
        // Restaurants
        const restaurantsRes = await adminAPI.restaurants(restaurantsPage);
        setRestaurants(restaurantsRes.data.data);
        
        // Analytics
        const growthRes = await adminAPI.monthlyGrowth();
        setMonthlyGrowth(growthRes.data);
        
        const categoriesRes = await adminAPI.categoryDistribution();
        setCategoryDistribution(categoriesRes.data);
        
        const topClientsRes = await adminAPI.topClients();
        setTopClients(topClientsRes.data);
        
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientsPage, restaurantsPage]);

  const handleToggleBlock = async (userId: number) => {
    try {
      await adminAPI.toggleBlockUser(userId);
      toast.success('User status updated');
      // Refresh clients
      const clientsRes = await adminAPI.clients(clientsPage);
      setClients(clientsRes.data.data);
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await adminAPI.deleteUser(userId);
        toast.success('User deleted');
        const clientsRes = await adminAPI.clients(clientsPage);
        setClients(clientsRes.data.data);
      } catch (err) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleDeleteRestaurant = async (restaurantId: number) => {
    if (confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await adminAPI.deleteRestaurant(restaurantId);
        toast.success('Restaurant deleted');
        const restaurantsRes = await adminAPI.restaurants(restaurantsPage);
        setRestaurants(restaurantsRes.data.data);
      } catch (err) {
        toast.error('Failed to delete restaurant');
      }
    }
  };

  const handleAddRestaurant = async () => {
    if (!newResto.name || !newResto.location) return;
    try {
      await adminAPI.addRestaurant(newResto);
      toast.success('Restaurant added');
      setNewResto({
        name: '',
        location: '',
        category: '',
        visits_required: 10,
        reward_description: '',
      });
      setShowAddResto(false);
      const restaurantsRes = await adminAPI.restaurants(restaurantsPage);
      setRestaurants(restaurantsRes.data.data);
    } catch (err) {
      toast.error('Failed to add restaurant');
    }
  };

  // Filter clients by search
  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Level distribution data
  const levelData = [
    { name: 'Bronze', value: stats?.bronze_clients || 0, fill: 'hsl(28, 80%, 52%)' },
    { name: 'Silver', value: stats?.silver_clients || 0, fill: 'hsl(0, 0%, 60%)' },
    { name: 'Gold', value: stats?.gold_clients || 0, fill: 'hsl(45, 100%, 55%)' },
    { name: 'VIP', value: stats?.vip_clients || 0, fill: 'hsl(270, 70%, 60%)' },
  ];

  // ==================== CLIENTS TAB ====================
  if (tab === 'clients') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-foreground">Manage Clients</h2>
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
        </div>
        <div className="space-y-3">
          {filteredClients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No clients found</p>
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
                      {((c as any).loyalty_level || 'bronze').toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Joined {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleBlock(c.id)}
                  className={`transition-colors ${c.is_blocked ? 'text-primary' : 'text-muted-foreground hover:text-destructive'}`}
                  title={c.is_blocked ? 'Unblock' : 'Block'}
                >
                  <Ban className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(c.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
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
          <h2 className="text-2xl font-display font-bold text-foreground">Manage Restaurants</h2>
          <button onClick={() => setShowAddResto(!showAddResto)} className="btn-warm text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Restaurant
          </button>
        </div>

        <AnimatePresence>
          {showAddResto && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
              <div className="card-elegant">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    value={newResto.name}
                    onChange={(e) => setNewResto({ ...newResto, name: e.target.value })}
                    placeholder="Restaurant name"
                    className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
                  />
                  <input
                    value={newResto.location}
                    onChange={(e) => setNewResto({ ...newResto, location: e.target.value })}
                    placeholder="Location"
                    className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
                  />
                  <input
                    value={newResto.category}
                    onChange={(e) => setNewResto({ ...newResto, category: e.target.value })}
                    placeholder="Category"
                    className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
                  />
                  <input
                    type="number"
                    value={newResto.visits_required}
                    onChange={(e) => setNewResto({ ...newResto, visits_required: parseInt(e.target.value) })}
                    placeholder="Visits required"
                    className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
                  />
                  <textarea
                    value={newResto.reward_description}
                    onChange={(e) => setNewResto({ ...newResto, reward_description: e.target.value })}
                    placeholder="Reward description"
                    rows={2}
                    className="col-span-2 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowAddResto(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-muted">Cancel</button>
                  <button onClick={handleAddRestaurant} className="btn-warm">Add</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {restaurants.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No restaurants found</p>
          ) : (
            restaurants.map((r) => (
              <div key={r.id} className="card-elegant flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.location} · {r.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">🎁 {r.reward_description}</span>
                    <span className="text-xs text-muted-foreground">· {r.visits_required} visits</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRestaurant(r.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
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

  // ==================== ANALYTICS TAB ====================
  if (tab === 'analytics') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-foreground">Analytics</h2>
        
        {/* Level Distribution */}
        <div className="card-elegant">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Client Loyalty Levels</h3>
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
                    {levelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
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

        {/* Monthly Growth Chart */}
        {monthlyGrowth.length > 0 && (
          <div className="card-elegant">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Monthly Growth</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="clients" stroke="hsl(var(--primary))" strokeWidth={2.5} />
                <Line type="monotone" dataKey="visits" stroke="hsl(38, 90%, 55%)" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Distribution */}
        {categoryDistribution.length > 0 && (
          <div className="card-elegant">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Restaurant Categories</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label>
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Clients */}
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Top Clients</h3>
          <div className="space-y-3">
            {topClients.map((c, i) => (
              <div key={c.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.restaurants} restaurants visited</p>
                </div>
                <span className="text-sm font-semibold text-primary">{c.visits} visits</span>
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
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">Settings</h2>
        <div className="card-elegant space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Platform Name</label>
            <input defaultValue="FidélitéPro" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Support Email</label>
            <input defaultValue="support@fidelitepro.com" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Default Visits Required</label>
            <input type="number" defaultValue={10} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
          </div>
          <button className="btn-warm text-sm w-full">Save Changes</button>
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={stats?.total_clients || 0} icon={Users} delay={0} />
        <StatCard title="Restaurants" value={stats?.total_restaurants || 0} icon={Store} delay={0.1} />
        <StatCard title="Total Visits" value={stats?.total_visits || 0} icon={BarChart3} delay={0.2} />
        <StatCard title="Growth" value={stats?.growth || '+0%'} subtitle="vs last month" icon={TrendingUp} delay={0.3} />
      </div>

      {/* Level Distribution */}
      <div className="card-elegant">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">Client Loyalty Levels</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>Bronze → Silver → Gold → VIP</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-amber-600/10">
            <p className="text-2xl font-bold text-amber-600">{stats?.bronze_clients || 0}</p>
            <p className="text-xs text-muted-foreground">Bronze</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-400/10">
            <p className="text-2xl font-bold text-gray-400">{stats?.silver_clients || 0}</p>
            <p className="text-xs text-muted-foreground">Silver</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10">
            <p className="text-2xl font-bold text-yellow-500">{stats?.gold_clients || 0}</p>
            <p className="text-xs text-muted-foreground">Gold</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-500/10">
            <p className="text-2xl font-bold text-purple-500">{stats?.vip_clients || 0}</p>
            <p className="text-xs text-muted-foreground">VIP</p>
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      {monthlyGrowth.length > 0 && (
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Growth Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="clients" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="visits" stroke="hsl(38, 90%, 55%)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Distribution */}
      {categoryDistribution.length > 0 && (
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Restaurant Categories</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Clients */}
      <div className="card-elegant">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">Top Clients</h3>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {topClients.slice(0, 5).map((c, i) => (
            <div key={c.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.restaurants} restaurants visited</p>
              </div>
              <span className="text-sm font-semibold text-primary">{c.visits} visits</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}