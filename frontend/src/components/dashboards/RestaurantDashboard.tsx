import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UtensilsCrossed, Star, Gift, TrendingUp, Users, 
  MapPin, X, Plus, QrCode, Check, BarChart3, 
  Award, Crown, Gem, Sparkles, Settings, 
  ChevronRight, Search, Clock, Calendar, ChevronDown,
  Ban, Camera, User, ArrowRight, Tag, Menu, Trash2, ToggleLeft, ToggleRight, Copy
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';

import StatCard from '@/components/StatCard';
import QRScannerTab from '@/components/QRScanner';
import { restaurantAPI, reviewAPI } from '@/api/endpoints';
import type { LoyaltyCard, Restaurant, Visit, PromoCode } from '@/api/endpoints';
import ProgressBar from '@/components/ProgressBar';
import MapPicker from '@/components/MapPicker';

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
    if ('count' in value) return safeNumber(value.count);
    if ('value' in value) return safeNumber(value.value);
    if ('total' in value) return safeNumber(value.total);
  }
  return defaultValue;
};

// Composant pour créer un restaurant
const CATEGORIES = [
  { value: 'moroccan',    emoji: '🇲🇦', label: { fr: 'Marocain',   en: 'Moroccan',  ar: 'مغربي'    } },
  { value: 'french',      emoji: '🇫🇷', label: { fr: 'Français',   en: 'French',    ar: 'فرنسي'    } },
  { value: 'italian',     emoji: '🇮🇹', label: { fr: 'Italien',    en: 'Italian',   ar: 'إيطالي'   } },
  { value: 'japanese',    emoji: '🇯🇵', label: { fr: 'Japonais',   en: 'Japanese',  ar: 'ياباني'   } },
  { value: 'mexican',     emoji: '🇲🇽', label: { fr: 'Mexicain',   en: 'Mexican',   ar: 'مكسيكي'   } },
  { value: 'american',    emoji: '🇺🇸', label: { fr: 'Américain',  en: 'American',  ar: 'أمريكي'   } },
  { value: 'chinese',     emoji: '🇨🇳', label: { fr: 'Chinois',    en: 'Chinese',   ar: 'صيني'     } },
  { value: 'indian',      emoji: '🇮🇳', label: { fr: 'Indien',     en: 'Indian',    ar: 'هندي'     } },
  { value: 'mediterranean', emoji: '🫒', label: { fr: 'Méditerranéen', en: 'Mediterranean', ar: 'متوسطي' } },
  { value: 'seafood',     emoji: '🦞', label: { fr: 'Fruits de mer', en: 'Seafood', ar: 'مأكولات بحرية' } },
  { value: 'pizza',       emoji: '🍕', label: { fr: 'Pizza',       en: 'Pizza',     ar: 'بيتزا'    } },
  { value: 'burger',      emoji: '🍔', label: { fr: 'Burger',      en: 'Burger',    ar: 'برغر'     } },
  { value: 'sushi',       emoji: '🍱', label: { fr: 'Sushi',       en: 'Sushi',     ar: 'سوشي'     } },
  { value: 'grill',       emoji: '🥩', label: { fr: 'Grill',       en: 'Grill',     ar: 'مشويات'   } },
  { value: 'vegetarian',  emoji: '🥗', label: { fr: 'Végétarien',  en: 'Vegetarian',ar: 'نباتي'    } },
  { value: 'general',     emoji: '🍽️', label: { fr: 'Général',    en: 'General',   ar: 'عام'      } },
];

const REWARD_SUGGESTIONS = {
  fr: [
    'Repas gratuit pour deux',
    '20% de réduction sur l\'addition',
    'Dessert offert',
    'Entrée gratuite',
    'Boisson offerte',
    'Menu dégustation gratuit',
  ],
  en: [
    'Free meal for two',
    '20% discount on the bill',
    'Free dessert',
    'Free starter',
    'Free drink',
    'Free tasting menu',
  ],
  ar: [
    'وجبة مجانية لشخصين',
    'خصم 20% على الفاتورة',
    'حلوى مجانية',
    'مقبلات مجانية',
    'مشروب مجاني',
    'قائمة تذوق مجانية',
  ],
};

interface Props {
  onSuccess: () => void;
}

function CreateRestaurantForm({ onSuccess }: Props) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'fr') as 'fr' | 'en' | 'ar';

  const [step, setStep] = useState(1); // 3 steps
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name:               '',
    location:           '',
    category:           '',
    visits_required:    10,
    reward_description: '',
    latitude:           33.5731,
    longitude:          -7.5898,
  });

  const steps = [
    { num: 1, icon: UtensilsCrossed, label: t('restaurant.restaurant_name') },
    { num: 2, icon: MapPin,          label: t('restaurant.location')         },
    { num: 3, icon: Gift,            label: t('restaurant.reward_desc')      },
  ];

  const isStep1Valid = formData.name.trim().length >= 2 && formData.category !== '';
  const isStep2Valid = formData.location.trim().length >= 2;
  const isStep3Valid = formData.reward_description.trim().length >= 2 && formData.visits_required >= 1;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/restaurant/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('common.error'));
      toast.success(t('common.success'));
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            {t('restaurant.settings_title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' ? 'أكمل معلومات مطعمك للبدء' :
             lang === 'en' ? 'Complete your restaurant profile to get started' :
             'Complétez le profil de votre restaurant pour commencer'}
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.num  ? 'bg-primary text-white' :
                step === s.num ? 'bg-primary/20 text-primary border-2 border-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 transition-all ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="card-elegant p-6">

          {/* ── STEP 1: Nom + Catégorie ── */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {t('restaurant.restaurant_name')} *
                </label>
                <div className="relative">
                  <UtensilsCrossed className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={lang === 'ar' ? 'مطعم الأصيل' : lang === 'en' ? 'My Restaurant' : 'Le Petit Bistro'}
                    className="w-full ps-10 pe-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t('restaurant.category')} *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.label[lang] || cat.label.fr })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${
                        formData.category === (cat.label[lang] || cat.label.fr)
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border hover:border-primary/40 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="leading-tight text-center">{cat.label[lang] || cat.label.fr}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                className="w-full btn-warm py-3 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {lang === 'ar' ? 'التالي' : lang === 'en' ? 'Next' : 'Suivant'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

           {/* ── STEP 2: Localisation ── */}
           {step === 2 && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
               <div>
                 <label className="text-sm font-medium text-foreground mb-3 block">
                   {t('restaurant.location')} *
                 </label>
                 
                 <div className="space-y-4">
                   <MapPicker 
                     onLocationSelect={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })} 
                     onAddressSelect={(address) => setFormData({ ...formData, location: address })}
                     initialPosition={[formData.latitude, formData.longitude]}
                     initialAddress={formData.location}
                     placeholder={t('restaurant.location_placeholder', 'Tapez l\'adresse du restaurant...')}
                   />
                   
                   <div className="flex items-center justify-between px-1">
                     <p className="text-[10px] text-muted-foreground">
                       {lang === 'ar' ? 'مثال: مراكش، شارع محمد الخامس' :
                        lang === 'en' ? 'e.g. Marrakech, Gueliz District' :
                        'Ex: Marrakech, Quartier Guéliz'}
                     </p>
                     <p className="text-[10px] font-mono text-primary/70">
                       {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                     </p>
                   </div>
                 </div>
               </div>

              {/* Résumé step 1 */}
              <div className="p-3 rounded-xl bg-muted/40 flex items-center gap-3">
                <span className="text-2xl">
                  {CATEGORIES.find(c => (c.label[lang] || c.label.fr) === formData.category)?.emoji || '🍽️'}
                </span>
                <div>
                  <p className="font-semibold text-foreground text-sm">{formData.name}</p>
                  <p className="text-xs text-muted-foreground">{formData.category}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!isStep2Valid}
                  className="flex-1 btn-warm py-3 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {lang === 'ar' ? 'التالي' : lang === 'en' ? 'Next' : 'Suivant'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Visites + Récompense ── */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">

              {/* Slider visites */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {t('restaurant.visits_required')} *
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={3}
                    max={30}
                    value={formData.visits_required}
                    onChange={(e) => setFormData({ ...formData, visits_required: parseInt(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <div className="w-14 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{formData.visits_required}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>3</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-primary" />
                    <span>
                      {formData.visits_required}{' '}
                      {lang === 'ar' ? 'زيارات' : lang === 'en' ? 'visits' : 'visites'}
                      {' → '}
                      {lang === 'ar' ? 'مكافأة!' : lang === 'en' ? 'reward!' : 'récompense!'}
                    </span>
                  </div>
                  <span>30</span>
                </div>
              </div>

              {/* Reward description */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {t('restaurant.reward_desc')} *
                </label>
                <div className="relative">
                  <Gift className="absolute start-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea
                    value={formData.reward_description}
                    onChange={(e) => setFormData({ ...formData, reward_description: e.target.value })}
                    placeholder={
                      lang === 'ar' ? 'وجبة مجانية لشخصين...' :
                      lang === 'en' ? 'Free meal for two...' :
                      'Repas gratuit pour deux...'
                    }
                    rows={2}
                    className="w-full ps-10 pe-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Suggestions */}
                <p className="text-xs text-muted-foreground mt-2 mb-1.5">
                  {lang === 'ar' ? 'اقتراحات:' : lang === 'en' ? 'Suggestions:' : 'Suggestions :'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(REWARD_SUGGESTIONS[lang] || REWARD_SUGGESTIONS.fr).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setFormData({ ...formData, reward_description: suggestion })}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        formData.reward_description === suggestion
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Résumé final */}
              <div className="p-4 rounded-xl bg-muted/40 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {CATEGORIES.find(c => (c.label[lang] || c.label.fr) === formData.category)?.emoji || '🍽️'}
                  </span>
                  <span className="font-semibold text-foreground">{formData.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" /> {formData.location}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Star className="w-3.5 h-3.5 text-primary" />
                  {formData.visits_required} {lang === 'ar' ? 'زيارات' : lang === 'en' ? 'visits' : 'visites'}
                </div>
                {formData.reward_description && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Gift className="w-3.5 h-3.5 text-primary" /> {formData.reward_description}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isStep3Valid || loading}
                  className="flex-1 btn-warm py-3 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {loading
                    ? t('common.loading')
                    : lang === 'ar' ? '🚀 إنشاء المطعم'
                    : lang === 'en' ? '🚀 Create Restaurant'
                    : '🚀 Créer le restaurant'
                  }
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}


export default function RestaurantDashboard({ tab, onTabChange }: RestaurantDashboardProps) {
  const { t, i18n } = useTranslation();
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
  const [settings, setSettings] = useState({
    name: '',
    location: '',
    category: '',
    visits_required: 10,
    reward_description: '',
  });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const dashRes = await restaurantAPI.dashboard();
      setRestaurant(dashRes.data.restaurant);
      setStats(dashRes.data.stats);
      setLevelStats(dashRes.data.level_stats || null);
      setRecentVisits(dashRes.data.recent_visits || []);

      // Clients & Weekly uniquement si restaurant existe
      try { const r = await restaurantAPI.clients();    setClients(r.data);    } catch {}
      try { const r = await restaurantAPI.weeklyStats(); setWeeklyData(r.data); } catch {}

    } catch (err: any) {
      if (err.response?.status === 404) {
        setRestaurant(null); // → affiche CreateRestaurantForm
      } else {
        toast.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false); // toujours appelé → loading = false → form s'affiche
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboard();
  }, []);

  // Sync settings when restaurant loads
  useEffect(() => {
    if (restaurant) {
      setSettings({
        name:               restaurant.name               || '',
        location:           restaurant.location           || '',
        category:           restaurant.category           || '',
        visits_required:    restaurant.visits_required    || 10,
        reward_description: restaurant.reward_description || '',
      });
    }
  }, [restaurant]);

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
      toast.success(`${t('restaurant.record_visit')} successfully!`);
      await fetchDashboard();
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
      toast.success(`${t('restaurant.record_visit')} for client #${manualClientId}! 🎉`);
      setManualClientId('');
      await fetchDashboard();
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

  // Si pas de restaurant, afficher le formulaire de création
  if (!loading && !restaurant) {
    return <CreateRestaurantForm onSuccess={fetchDashboard} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ==================== CLIENTS TAB ====================
  if (tab === 'clients') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-foreground">{t('dashboard.clients')}</h2>
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
              <Plus className="w-4 h-4" /> {t('restaurant.add_client')}
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
            <p className="text-center text-muted-foreground py-8">{t('common.no_data')}</p>
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
                          {card.current_visits} {t('common.visits')}
                        </span>
                      </div>
                      {progress.total > 0 && (
                        <div className="mt-2">
                          <ProgressBar current={progress.current} total={progress.total} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {progress.total - progress.current} {t('client.visits_to_next')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRecordVisit(card.client_id)}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                      >
                        {t('restaurant.record_visit')}
                      </button>
                      <button
                        onClick={() => handleBlockClient(card.client_id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title={t('restaurant.block')}
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
                  {showAllClients ? t('restaurant.see_less') : `${t('restaurant.see_all')} (${filteredClients.length})`}
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
  if (tab === 'scan') return (
    <QRScannerTab onVisitRecorded={fetchDashboard} />
  );

  if (tab === 'analytics') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-foreground">{t('dashboard.analytics')}</h2>
        
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('restaurant.loyalty_levels')}</h3>
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
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('restaurant.weekly_stats')}</h3>
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
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('restaurant.recent_visits')}</h3>
          <div className="space-y-3">
            {recentVisits.slice(0, 5).map((visit) => (
              <div key={visit.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{visit.client?.name || 'Client'}</p>
                  <p className="text-xs text-muted-foreground">{t('restaurant.record_visit')}</p>
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

  // ==================== PROMOS TAB ====================
  if (tab === 'promos') {
    const [promos, setPromos] = useState<PromoCode[]>([]);
    const [promosLoading, setPromosLoading] = useState(true);
    const [showCreatePromo, setShowCreatePromo] = useState(false);
    const [promoForm, setPromoForm] = useState({
      code: '',
      description: '',
      type: 'percentage' as 'percentage' | 'fixed' | 'free_item',
      value: 10,
      max_uses: '',
      expires_at: '',
    });
    const [creating, setCreating] = useState(false);

    const fetchPromos = async () => {
      setPromosLoading(true);
      try {
        const res = await restaurantAPI.getPromoCodes();
        setPromos(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.error(t('common.error'));
      } finally {
        setPromosLoading(false);
      }
    };

    useEffect(() => { fetchPromos(); }, []);

    const handleCreatePromo = async () => {
      if (!promoForm.description.trim()) return;
      setCreating(true);
      try {
        await restaurantAPI.createPromoCode({
          code: promoForm.code || undefined,
          description: promoForm.description,
          type: promoForm.type,
          value: promoForm.type === 'free_item' ? 0 : promoForm.value,
          max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : undefined,
          expires_at: promoForm.expires_at || undefined,
        });
        toast.success(t('promo.created'));
        setShowCreatePromo(false);
        setPromoForm({ code: '', description: '', type: 'percentage', value: 10, max_uses: '', expires_at: '' });
        fetchPromos();
      } catch (err: any) {
        const msg = err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : err.response?.data?.error || t('common.error');
        toast.error(msg);
      } finally {
        setCreating(false);
      }
    };

    const handleToggle = async (id: number) => {
      try {
        await restaurantAPI.togglePromoCode(id);
        toast.success(t('promo.toggled'));
        fetchPromos();
      } catch {
        toast.error(t('common.error'));
      }
    };

    const handleDelete = async (id: number) => {
      if (!confirm(t('promo.confirm_delete'))) return;
      try {
        await restaurantAPI.deletePromoCode(id);
        toast.success(t('promo.deleted'));
        fetchPromos();
      } catch {
        toast.error(t('common.error'));
      }
    };

    const typeEmoji: Record<string, string> = { percentage: '💯', fixed: '💰', free_item: '🎁' };
    const typeColor: Record<string, string> = {
      percentage: 'from-blue-500/20 to-blue-400/5 border-blue-500/20',
      fixed: 'from-emerald-500/20 to-emerald-400/5 border-emerald-500/20',
      free_item: 'from-purple-500/20 to-purple-400/5 border-purple-500/20',
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold text-foreground">{t('promo.title')}</h2>
          <button
            onClick={() => setShowCreatePromo(!showCreatePromo)}
            className="btn-warm text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('promo.create')}
          </button>
        </div>

        {/* Create Promo Form */}
        <AnimatePresence>
          {showCreatePromo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="card-elegant space-y-4">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  {t('promo.create')}
                </h3>

                {/* Code */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t('promo.code')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER2026"
                      maxLength={20}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground font-mono uppercase tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setPromoForm({ ...promoForm, code: '' })}
                      className="px-3 py-2 rounded-lg text-xs bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title={t('promo.auto_generate')}
                    >
                      🎲 {t('promo.auto_generate')}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t('promo.auto_generate')}</p>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t('promo.description')}</label>
                  <input
                    type="text"
                    value={promoForm.description}
                    onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                    placeholder="20% de réduction sur le menu"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
                  />
                </div>

                {/* Type + Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t('promo.type')}</label>
                    <select
                      value={promoForm.type}
                      onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
                    >
                      <option value="percentage">{t('promo.type_percentage')}</option>
                      <option value="fixed">{t('promo.type_fixed')}</option>
                      <option value="free_item">{t('promo.type_free_item')}</option>
                    </select>
                  </div>
                  {promoForm.type !== 'free_item' && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">{t('promo.value')}</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={promoForm.value}
                          onChange={(e) => setPromoForm({ ...promoForm, value: parseFloat(e.target.value) || 0 })}
                          min={0}
                          max={promoForm.type === 'percentage' ? 100 : 99999}
                          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {promoForm.type === 'percentage' ? '%' : 'MAD'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Max uses + Expiration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t('promo.max_uses')}</label>
                    <input
                      type="number"
                      value={promoForm.max_uses}
                      onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                      placeholder={t('promo.unlimited')}
                      min={1}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('promo.max_uses_hint')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t('promo.expires_at')}</label>
                    <input
                      type="datetime-local"
                      value={promoForm.expires_at}
                      onChange={(e) => setPromoForm({ ...promoForm, expires_at: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('promo.expires_hint')}</p>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCreatePromo(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleCreatePromo}
                    disabled={creating || !promoForm.description.trim()}
                    className="flex-1 btn-warm py-2.5 disabled:opacity-40"
                  >
                    {creating ? t('common.loading') : `🏷️ ${t('promo.create')}`}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Promos List */}
        {promosLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-medium mb-1">{t('promo.no_promos')}</p>
            <p className="text-sm text-muted-foreground">{t('promo.no_promos_sub')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {promos.map((promo, i) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative p-5 rounded-2xl border bg-gradient-to-br ${typeColor[promo.type]} overflow-hidden group`}
              >
                {/* Status badge */}
                <div className="absolute top-4 right-4">
                  {promo.is_expired ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-500 border border-red-500/30">
                      {t('promo.expired')}
                    </span>
                  ) : promo.is_active ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                      {t('promo.active')}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                      {t('promo.inactive')}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{typeEmoji[promo.type]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-foreground tracking-wider text-sm">{promo.code}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(promo.code); toast.success('Copié!'); }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-foreground font-medium">{promo.description}</p>
                  </div>
                </div>

                {/* Value */}
                <div className="mb-3">
                  <span className="text-2xl font-display font-bold text-foreground">
                    {promo.formatted_value}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {t(`promo.type_${promo.type}`)}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    👥 {promo.used_count}{promo.max_uses !== null ? `/${promo.max_uses}` : ''} {t('promo.uses')}
                  </span>
                  {promo.expires_at && (
                    <span className="flex items-center gap-1">
                      📅 {new Date(promo.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(promo.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      promo.is_active
                        ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                    }`}
                  >
                    {promo.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {promo.is_active ? t('promo.inactive') : t('promo.active')}
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('admin.delete')}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==================== SETTINGS TAB ====================
  if (tab === 'settings') {
    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">{t('restaurant.settings_title')}</h2>
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
            {isSaving ? t('restaurant.saving') : t('restaurant.save')}
          </button>
        </div>
      </div>
    );
  }

  // ==================== DASHBOARD (MAIN) ====================
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t('restaurant.total_clients')} 
          value={safeNumber(stats?.total_clients)} 
          icon={Users} 
          delay={0} 
        />
        <StatCard 
          title={t('restaurant.visits_today')} 
          value={safeNumber(stats?.visits_today)} 
          icon={Star} 
          delay={0.1} 
        />
        <StatCard 
          title={t('restaurant.visits_week')} 
          value={safeNumber(stats?.visits_week)} 
          icon={BarChart3} 
          delay={0.2} 
        />
        <StatCard 
          title={t('restaurant.rewards_given')} 
          value={safeNumber(stats?.rewards_given)} 
          icon={Gift} 
          delay={0.3} 
        />
      </div>

      <div className="card-elegant">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">{t('restaurant.loyalty_levels')}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>Bronze → Silver → Gold → VIP</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-amber-600/10">
            <p className="text-2xl font-bold text-amber-600">{safeNumber(levelStats?.bronze)}</p>
            <p className="text-xs text-muted-foreground">{t('client.level_bronze')}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-400/10">
            <p className="text-2xl font-bold text-gray-400">{safeNumber(levelStats?.silver)}</p>
            <p className="text-xs text-muted-foreground">{t('client.level_silver')}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10">
            <p className="text-2xl font-bold text-yellow-500">{safeNumber(levelStats?.gold)}</p>
            <p className="text-xs text-muted-foreground">{t('client.level_gold')}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-500/10">
            <p className="text-2xl font-bold text-purple-500">{safeNumber(levelStats?.vip)}</p>
            <p className="text-xs text-muted-foreground">{t('client.level_vip')}</p>
          </div>
        </div>
      </div>

      {weeklyData.length > 0 && (
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('restaurant.weekly_stats')}</h3>
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
          <h3 className="font-display text-lg font-semibold text-foreground">{t('restaurant.recent_visits')}</h3>
          <button onClick={() => setShowAllVisits(!showAllVisits)} className="text-sm text-primary hover:underline flex items-center gap-1">
            {showAllVisits ? t('restaurant.see_less') : t('restaurant.see_all')}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAllVisits ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="space-y-2">
          {displayedVisits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('restaurant.no_visits')}</p>
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
              {t('restaurant.see_all')} ({recentVisits.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}