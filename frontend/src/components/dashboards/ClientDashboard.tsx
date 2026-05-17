import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  UtensilsCrossed, Star, Gift, TrendingUp, MapPin,
  X, Plus, QrCode, Check, Award, Crown, Download,
  Shield, Smartphone, Users, Copy, Tag, CheckCircle, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import { clientAPI, reviewAPI } from '@/api/endpoints';
import type { ExtendedLoyaltyCard, AvailableRestaurant, DashboardResponse, PromoCodeUsage } from '@/api/endpoints';
import ReviewForm from '@/components/ReviewForm';

const levelColors: Record<string, string> = {
  bronze: 'bg-amber-600/20 text-amber-600 border-amber-600/30',
  silver: 'bg-gray-400/20 text-gray-400 border-gray-400/30',
  gold:   'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  vip:    'bg-purple-500/20 text-purple-500 border-purple-500/30',
};

const levelIcons: Record<string, React.ElementType> = {
  bronze: Star,
  silver: Star,
  gold:   Award,
  vip:    Crown,
};

// ── QR Page labels ───────────────────────────────────────────
const QR_LABELS = {
  title:      { fr: 'Mon QR Code',              en: 'My QR Code',               ar: 'رمز QR الخاص بي'        },
  subtitle:   { fr: 'Présentez ce code au restaurant pour enregistrer votre visite',
                en: 'Show this code at the restaurant to record your visit',
                ar: 'أرِ هذا الرمز للمطعم لتسجيل زيارتك'                                                      },
  clientId:   { fr: 'ID Client',                en: 'Client ID',                ar: 'رقم العميل'              },
  member:     { fr: 'Membre FidélitéPro',       en: 'FidélitéPro Member',       ar: 'عضو FidélitéPro'        },
  totalVisits:{ fr: 'Visites totales',           en: 'Total visits',             ar: 'إجمالي الزيارات'         },
  restaurants:{ fr: 'Restaurants',              en: 'Restaurants',              ar: 'المطاعم'                  },
  rewards:    { fr: 'Récompenses',              en: 'Rewards',                  ar: 'المكافآت'                 },
  tip1:       { fr: '📱 Laissez le restaurant scanner votre écran',
                en: '📱 Let the restaurant scan your screen',
                ar: '📱 اسمح للمطعم بمسح شاشتك'                                                               },
  tip2:       { fr: '🔒 Votre code est unique et sécurisé',
                en: '🔒 Your code is unique and secure',
                ar: '🔒 رمزك فريد ومحمي'                                                                        },
  tip3:       { fr: '✅ Chaque scan enregistre automatiquement votre visite',
                en: '✅ Each scan automatically records your visit',
                ar: '✅ كل مسح يسجل زيارتك تلقائياً'                                                           },
  levelBronze:{ fr: 'Bronze',                   en: 'Bronze',                   ar: 'برونز'                   },
  levelSilver:{ fr: 'Argent',                   en: 'Silver',                   ar: 'فضي'                     },
  levelGold:  { fr: 'Or',                       en: 'Gold',                     ar: 'ذهبي'                    },
  levelVip:   { fr: 'VIP',                      en: 'VIP',                      ar: 'VIP'                     },
  myLevel:    { fr: 'Mon niveau',               en: 'My level',                 ar: 'مستواي'                  },
};

export default function ClientDashboard({ tab }: { tab: string }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : i18n.language?.startsWith('en') ? 'en' : 'fr';
  const lbl  = (key: keyof typeof QR_LABELS) => QR_LABELS[key][lang];

  const [loading, setLoading]             = useState(true);
  const [stats, setStats]                 = useState<DashboardResponse['stats'] | null>(null);
  const [cards, setCards]                 = useState<ExtendedLoyaltyCard[]>([]);
  const [rewards, setRewards]             = useState<any[]>([]);
  const [weeklyData, setWeeklyData]       = useState<{ day: string; visits: number }[]>([]);
  const [showAddResto, setShowAddResto]   = useState(false);
  const [availableRestos, setAvailableRestos] = useState<AvailableRestaurant[]>([]);
  const [addingResto, setAddingResto]     = useState<number | null>(null);
  const [user, setUser]                   = useState<any>(null);
  const [activeReviewResto, setActiveReviewResto] = useState<{id: number, name: string} | null>(null);
  const [referralData, setReferralData]   = useState<{referral_code: string, total_points: number} | null>(null);
  const [promoInput, setPromoInput]       = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoSuccess, setPromoSuccess]   = useState<{code: string, description: string, restaurant: string} | null>(null);
  const [promoHistory, setPromoHistory]   = useState<PromoCodeUsage[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await clientAPI.dashboard();
        setStats(res.data.stats);
        setCards(res.data.loyalty_cards);
        if (res.data.available_restaurants) setAvailableRestos(res.data.available_restaurants);
        const rewardsRes = await clientAPI.rewards();
        setRewards(Array.isArray(rewardsRes.data) ? rewardsRes.data : []);
        if (res.data.weekly_visits) setWeeklyData(res.data.weekly_visits);

        // Fetch referral stats
        try {
          const refRes = await clientAPI.referralStats();
          if (refRes.data) {
            setReferralData(refRes.data);
          }
        } catch (refErr) {
          console.error("Could not load referral stats", refErr);
        }

        // Fetch promo history
        try {
          const promoRes = await clientAPI.promoHistory();
          if (Array.isArray(promoRes.data)) setPromoHistory(promoRes.data);
        } catch (promoErr) {
          console.error("Could not load promo history", promoErr);
        }
      } catch {
        toast.error(t('common.error'));
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
      if (res.data.available_restaurants) setAvailableRestos(res.data.available_restaurants);
      toast.success(`${restaurantName} 🎉`);
      setShowAddResto(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally {
      setAddingResto(null);
    }
  };

  const getProgressTowardNext = (card: ExtendedLoyaltyCard) => {
    const visits = card.current_visits;
    if (card.level === 'bronze') return { current: visits,      total: 5  };
    if (card.level === 'silver') return { current: visits - 5,  total: 5  };
    if (card.level === 'gold')   return { current: visits - 10, total: 10 };
    return { current: 0, total: 1 };
  };

  // ══════════════════════════════════════════════════════════
  // QR CODE TAB — version améliorée
  // ══════════════════════════════════════════════════════════
  if (tab === 'myqr') {
    // Meilleur niveau du client
    const bestLevel = cards.length > 0
      ? cards.reduce((best, card) => {
          const order = ['bronze','silver','gold','vip'];
          return order.indexOf(card.level) > order.indexOf(best) ? card.level : best;
        }, 'bronze')
      : 'bronze';

    const levelLabel: Record<string, string> = {
      bronze: lbl('levelBronze'),
      silver: lbl('levelSilver'),
      gold:   lbl('levelGold'),
      vip:    lbl('levelVip'),
    };

    const levelGradient: Record<string, string> = {
      bronze: 'from-amber-600/20 to-amber-500/5',
      silver: 'from-gray-400/20 to-gray-300/5',
      gold:   'from-yellow-500/20 to-yellow-400/5',
      vip:    'from-purple-500/20 to-purple-400/5',
    };

    const levelRing: Record<string, string> = {
      bronze: 'ring-amber-500/40',
      silver: 'ring-gray-400/40',
      gold:   'ring-yellow-500/40',
      vip:    'ring-purple-500/40',
    };

    const totalVisits = stats?.total_visits || 0;
    const totalRestos = stats?.restaurants_visited || 0;
    const totalRewards = stats?.rewards_earned || 0;

    return (
      <div className="max-w-sm mx-auto space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} className="text-center">
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">{lbl('title')}</h2>
          <p className="text-sm text-muted-foreground">{lbl('subtitle')}</p>
        </motion.div>

        {/* ── QR Card ── */}
        <motion.div
          initial={{ opacity:0, scale:0.95 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ delay:0.1 }}
          className={`card-elegant p-6 bg-gradient-to-br ${levelGradient[bestLevel]}`}
        >
          {/* Top — nom + level */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-display font-bold text-foreground text-lg leading-tight">
                {user?.name || 'Client'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lbl('clientId')} #{user?.id || '—'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${levelColors[bestLevel]}`}>
              {levelLabel[bestLevel]}
            </span>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-5">
            <div className={`p-4 bg-white rounded-2xl ring-4 ${levelRing[bestLevel]} shadow-lg`}>
              <QRCodeSVG
                value={`${user?.id || '1'}`}
                size={180}
                fgColor="#1a1a1a"
                bgColor="transparent"
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Member badge */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-medium text-primary">{lbl('member')}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: lbl('totalVisits'), value: totalVisits,  icon: '⭐' },
              { label: lbl('restaurants'), value: totalRestos,  icon: '🍽️' },
              { label: lbl('rewards'),     value: totalRewards, icon: '🎁' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity:0, y:8 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: 0.2 + i*0.07 }}
                className="text-center p-2.5 rounded-xl bg-background/60 backdrop-blur-sm"
              >
                <p className="text-base mb-0.5">{s.icon}</p>
                <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Mon niveau + progression ── */}
        {cards.length > 0 && (
          <motion.div
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.25 }}
            className="card-elegant p-4 space-y-3"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {lbl('myLevel')}
            </p>
            {cards.slice(0, 3).map((card, i) => {
              const LevelIcon = levelIcons[card.level] || Star;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${levelColors[card.level]}`}>
                    <LevelIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{card.restaurant.name}</p>
                    <div className="mt-1">
                      <ProgressBar current={card.current_visits} total={card.total_required} className="h-1.5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {card.current_visits}/{card.total_required}
                  </p>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── Tips ── */}
        <motion.div
          initial={{ opacity:0, y:12 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.35 }}
          className="card-elegant p-4 space-y-2.5"
        >
          {[lbl('tip1'), lbl('tip2'), lbl('tip3')].map((tip, i) => (
            <p key={i} className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
          ))}
        </motion.div>

      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // REWARDS TAB
  // ══════════════════════════════════════════════════════════
  if (tab === 'rewards') {
    const handleRedeem = async (rewardId: number, rewardName: string) => {
      try {
        await clientAPI.redeemReward(rewardId);
        const rewardsRes = await clientAPI.rewards();
        setRewards(Array.isArray(rewardsRes.data) ? rewardsRes.data : []);
        toast.success(`${rewardName} 🎉`);
      } catch {
        toast.error(t('common.error'));
      }
    };

    const rewardsList = Array.isArray(rewards) ? rewards : [];

    return (
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">{t('client.rewards_title')}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {rewardsList.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('client.no_rewards')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('client.no_rewards_sub')}</p>
            </div>
          ) : (
            rewardsList.map((r: any) => (
              <motion.div key={r.id} className="card-elegant flex items-center gap-4" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{r.reward || r.description}</p>
                  <p className="text-sm text-muted-foreground">{r.restaurant?.name || r.restaurantName}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.unlockedAt || r.created_at).toLocaleDateString()}</p>
                </div>
                {r.redeemed ? (
                  <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> {t('client.redeemed')}
                  </span>
                ) : (
                  <button onClick={() => handleRedeem(r.id, r.reward || r.description)} className="btn-warm text-xs px-3 py-1.5">
                    {t('client.redeem')}
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // PROFILE TAB
  // ══════════════════════════════════════════════════════════
  if (tab === 'profile') {
    const [name, setName]   = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');

    const handleSaveProfile = async () => {
      try {
        await clientAPI.updateProfile({ name, phone });
        const updatedUser = { ...user, name, phone };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success(t('common.success'));
      } catch {
        toast.error(t('common.error'));
      }
    };

    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">{t('nav.dashboard')}</h2>
        <div className="card-elegant space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-display font-bold text-primary">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">{t('auth.name')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">{t('auth.email')}</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-muted text-muted-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">{t('auth.phone')}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground" />
          </div>
          <button onClick={handleSaveProfile} className="btn-warm text-sm">{t('restaurant.save')}</button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // DASHBOARD (MAIN)
  // ══════════════════════════════════════════════════════════
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
        <StatCard title={t('client.stats_restaurants')} value={stats?.restaurants_visited || 0} icon={UtensilsCrossed} delay={0} />
        <StatCard title={t('client.stats_visits')}      value={stats?.total_visits || 0}        icon={Star}            delay={0.1} />
        <StatCard title={t('common.points')}            value={referralData ? referralData.total_points : (stats?.points || 0)}              icon={TrendingUp}      delay={0.2} />
        <StatCard title={t('client.stats_rewards')}     value={stats?.rewards_earned || 0}      icon={Gift}            delay={0.3} />
      </div>

      {weeklyData.length > 0 && (
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('client.weekly_visits')}</h3>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne gauche (Cartes de fidélité) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-foreground">{t('client.my_cards')}</h3>
            <button onClick={() => setShowAddResto(!showAddResto)} className="btn-warm text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t('client.add_restaurant')}
            </button>
          </div>

        <AnimatePresence>
          {showAddResto && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
              exit={{ height:0, opacity:0 }} className="overflow-hidden mb-4">
              <div className="card-elegant">
                <p className="text-sm font-medium text-foreground mb-3">
                  {availableRestos.length === 0 ? t('client.no_cards_sub') : t('client.available_restaurants')}
                </p>
                {availableRestos.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {availableRestos.map((r) => (
                      <button key={r.id} onClick={() => handleAddRestaurant(r.id, r.name)}
                        disabled={addingResto === r.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-start disabled:opacity-50">
                        <UtensilsCrossed className="w-5 h-5 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground">
                              {r.location} · {r.visits_required} {t('common.visits')} → 🎁 {r.reward_description}
                            </p>
                            {r.reviews_count > 0 && (
                              <span className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded font-bold">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                {Number(r.reviews_avg_rating).toFixed(1)} ({r.reviews_count})
                              </span>
                            )}
                          </div>
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

        {cards.length === 0 ? (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('client.no_cards')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('client.no_cards_sub')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {cards.map((card, i) => {
              const LevelIcon = levelIcons[card.level] || Star;
              const progress  = getProgressTowardNext(card);
              return (
                <motion.div key={card.id} className="card-elegant"
                  initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.1 }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-display font-semibold text-foreground">{card.restaurant.name}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {card.restaurant.location}
                      </p>
                      {card.restaurant.reviews_count > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-yellow-600 font-bold">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          {Number(card.restaurant.reviews_avg_rating).toFixed(1)} ({card.restaurant.reviews_count} avis)
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${levelColors[card.level]}`}>
                        {t(`client.level_${card.level}`)}
                      </div>
                      <button 
                        onClick={() => setActiveReviewResto({ id: card.restaurant_id, name: card.restaurant.name })}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" /> {t('client.rate', 'Noter')}
                      </button>
                    </div>
                  </div>
                  <ProgressBar current={card.current_visits} total={card.total_required} className="mb-2" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {card.current_visits}/{card.total_required} {t('common.visits')}
                    </p>
                    {card.status === 'active' && card.current_visits > 0 && (
                      <button onClick={() => {
                        clientAPI.cancelVisit(card.id).then(() => {
                          toast.success(t('common.success'));
                          window.location.reload();
                        }).catch(() => toast.error(t('common.error')));
                      }} className="text-xs text-destructive hover:underline flex items-center gap-1">
                        <X className="w-3 h-3" /> {t('common.cancel')}
                      </button>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <LevelIcon className="w-4 h-4 text-primary" />
                        <span className="font-medium">{t(`client.level_${card.level}`)}</span>
                      </div>
                      {card.visits_to_next > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {card.visits_to_next} {t('client.visits_to_next')} {card.next_level}
                        </span>
                      )}
                    </div>
                    {card.visits_to_next > 0 && (
                      <div className="mt-2">
                        <ProgressBar current={progress.current} total={progress.total} className="h-1.5" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">🎁 {card.reward}</p>
                </motion.div>
              );
            })}
          </div>
        )}
        </div>

        {/* Colonne droite (Parrainage + Code Promo) */}
        <div className="space-y-6">
          {/* Referral Card */}
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('common.points', 'Parrainage')}</h3>
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/20" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -ml-12 -mb-12 transition-all group-hover:bg-primary/20" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                
                <h4 className="text-xl font-display font-bold text-foreground mb-2">
                  {t('client.invite_friends', 'Invitez vos amis !')}
                </h4>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  {t('client.invite_desc', 'Partagez votre code et gagnez des points pour chaque ami qui s\'inscrit et enregistre une visite.')}
                </p>

                {referralData?.referral_code ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">{t('client.your_code', 'Votre code unique')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background/80 backdrop-blur border border-input rounded-xl px-4 py-3 flex items-center justify-center font-mono font-bold text-lg text-primary tracking-widest shadow-inner">
                        {referralData.referral_code}
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(referralData.referral_code);
                          toast.success(t('common.copied', 'Code copié !'));
                        }}
                        className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors shadow-md flex-shrink-0"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-background/50 border border-input text-center">
                    <span className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Promo Code Card */}
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('promo.apply_title')}</h3>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-3xl -mr-14 -mt-14 transition-all group-hover:bg-amber-500/20" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                  <Tag className="w-6 h-6 text-white" />
                </div>

                <h4 className="text-xl font-display font-bold text-foreground mb-2">
                  {t('promo.apply_title')}
                </h4>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  {t('promo.apply_desc', 'Entrez un code promo reçu d\'un restaurant pour bénéficier d\'une offre spéciale.')}
                </p>

                {/* Promo Success */}
                {promoSuccess ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-600">{t('promo.applied')}</span>
                    </div>
                    <p className="text-sm text-foreground font-medium">{promoSuccess.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">🍽️ {promoSuccess.restaurant}</p>
                    <button
                      onClick={() => setPromoSuccess(null)}
                      className="text-xs text-primary mt-2 hover:underline"
                    >
                      {t('common.close')}
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder={t('promo.apply_placeholder')}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background/80 backdrop-blur text-foreground font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && promoInput.trim()) {
                            setApplyingPromo(true);
                            clientAPI.applyPromoCode(promoInput.trim())
                              .then((res) => {
                                setPromoSuccess({
                                  code: res.data.promo_code.code,
                                  description: res.data.promo_code.description,
                                  restaurant: res.data.promo_code.restaurant || '',
                                });
                                setPromoInput('');
                                clientAPI.promoHistory().then(r => setPromoHistory(Array.isArray(r.data) ? r.data : []));
                              })
                              .catch((err) => {
                                toast.error(err.response?.data?.error || t('common.error'));
                              })
                              .finally(() => setApplyingPromo(false));
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!promoInput.trim()) return;
                        setApplyingPromo(true);
                        clientAPI.applyPromoCode(promoInput.trim())
                          .then((res) => {
                            setPromoSuccess({
                              code: res.data.promo_code.code,
                              description: res.data.promo_code.description,
                              restaurant: res.data.promo_code.restaurant || '',
                            });
                            setPromoInput('');
                            clientAPI.promoHistory().then(r => setPromoHistory(Array.isArray(r.data) ? r.data : []));
                          })
                          .catch((err) => {
                            toast.error(err.response?.data?.error || t('common.error'));
                          })
                          .finally(() => setApplyingPromo(false));
                      }}
                      disabled={applyingPromo || !promoInput.trim()}
                      className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-40 flex-shrink-0"
                    >
                      {applyingPromo ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Promo History */}
                {promoHistory.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-border/30">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {t('promo.history_title')}
                    </p>
                    <div className="space-y-2">
                      {promoHistory.slice(0, 3).map((usage) => (
                        <div key={usage.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-background/60">
                          <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                            <Tag className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-foreground">{usage.code}</span>
                              <span className="text-xs text-muted-foreground">— {usage.formatted_value}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{usage.restaurant}</p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {new Date(usage.used_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {activeReviewResto && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-background/60 backdrop-blur-sm">
            <ReviewForm
              restaurantId={activeReviewResto.id}
              restaurantName={activeReviewResto.name}
              type="restaurant"
              onClose={() => setActiveReviewResto(null)}
              onSuccess={() => setActiveReviewResto(null)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}