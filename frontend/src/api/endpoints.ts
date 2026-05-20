import axios from './axios';

// ==================== TYPES ====================

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'client' | 'restaurant' | 'admin';
  phone?: string;
  avatar?: string;
  is_blocked: boolean;
  email_verified_at?: string;
  created_at: string;
}

export interface ClientUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  is_blocked?: boolean;
  loyalty_level?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'client' | 'restaurant';
  phone?: string;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

export interface LoyaltyCard {
  id: number;
  client_id: number;
  client?: ClientUser;
  restaurant_id: number;
  current_visits: number;
  status: 'active' | 'completed' | 'expired';
  last_visit_at: string;
  loyalty_level?: string;
  restaurant: {
    id: number;
    name: string;
    location: string;
    category: string;
    visits_required: number;
    reward_description: string;
  };
}

export interface ExtendedLoyaltyCard extends LoyaltyCard {
  level: string;
  next_level: string;
  visits_to_next: number;
  reward: string;
  total_required: number;
  last_visit: string;
}

export interface AvailableRestaurant {
  id: number;
  name: string;
  location: string;
  category?: string;
  reward_description: string;
  visits_required: number;
}

export interface WeeklyVisit {
  day: string;
  visits: number;
}

export interface Visit {
  id: number;
  client_id: number;
  client?: ClientUser;
  restaurant_id: number;
  loyalty_card_id: number;
  points: number;
  note?: string;
  is_cancelled: boolean;
  created_at: string;
  restaurant?: Restaurant;
}

export interface Restaurant {
  id: number;
  owner_id: number;
  name: string;
  location: string;
  category?: string;
  image?: string;
  visits_required: number;
  reward_description: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
  owner?: User;
}

export interface CreateRestaurantData {
  name: string;
  location: string;
  category?: string;
  image?: string;
  visits_required: number;
  reward_description: string;
  owner_id?: number;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}

export interface Reward {
  id: number;
  client_id: number;
  client?: ClientUser;
  restaurant_id: number;
  loyalty_card_id: number;
  description: string;
  status: 'available' | 'redeemed' | 'expired';
  redeemed_at?: string;
  restaurant: Restaurant;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'points' | 'reward' | 'visit' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    avatar?: string;
    role?: string;
  };
  restaurant_id?: number;
  rating: number;
  comment: string;
  type: 'platform' | 'restaurant';
  created_at: string;
}

export interface PromoCode {
  id: number;
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_item';
  value: number;
  formatted_value: string;
  max_uses: number | null;
  used_count: number;
  usages_count?: number;
  expires_at: string | null;
  is_active: boolean;
  is_expired: boolean;
  is_valid: boolean;
  created_at: string;
  restaurant?: string;
}

export interface PromoCodeUsage {
  id: number;
  code: string;
  description: string;
  type: string;
  value: number;
  formatted_value: string;
  restaurant: string;
  used_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

export interface DashboardStats {
  restaurants_visited: number;
  total_visits: number;
  points: number;
  rewards_earned: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  loyalty_cards: ExtendedLoyaltyCard[];
  available_restaurants?: AvailableRestaurant[];
  weekly_visits?: WeeklyVisit[];
}

export interface RestaurantDashboardResponse {
  restaurant: Restaurant;
  stats: {
    total_clients: number;
    visits_today: number;
    visits_week: number;
    rewards_given: number;
  };
  level_stats?: {
    bronze: number;
    silver: number;
    gold: number;
    vip: number;
  };
  recent_visits: Visit[];
}

export interface AdminDashboardResponse {
  stats: {
    total_clients: number;
    total_restaurants: number;
    total_visits: number;
    growth: string;
    bronze_clients?: number;
    silver_clients?: number;
    gold_clients?: number;
    vip_clients?: number;
  };
}

// ==================== AUTH ENDPOINTS ====================

export const authAPI = {
  login: (credentials: LoginCredentials) =>
    axios.post<{ user: User; token: string; token_type: string; expires_in: number }>(
      '/auth/login',
      credentials
    ),

  register: (data: RegisterData) =>
    axios.post<{ user: User; token: string; message: string }>('/auth/register', data),

  logout: () => axios.post('/auth/logout'),

  me: () => axios.get<{ user: User }>('/auth/me'),

  refresh: () => axios.post<{ token: string }>('/auth/refresh'),

  updateProfile: (data: { name?: string; phone?: string; avatar?: File }) => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.phone) formData.append('phone', data.phone);
    if (data.avatar) formData.append('avatar', data.avatar);
    return axios.put('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  forgotPassword: (email: string) => axios.post('/auth/forgot-password', { email }),
  
  resetPassword: (data: ResetPasswordData) =>
    axios.post('/auth/reset-password', data),
};

// ==================== CLIENT ENDPOINTS ====================

export const clientAPI = {
  dashboard: () => axios.get<DashboardResponse>('/client/dashboard'),

  loyaltyCards: () => axios.get<LoyaltyCard[]>('/client/loyalty-cards'),

  cancelVisit: (cardId: number) =>
    axios.post(`/client/loyalty-cards/${cardId}/cancel-visit`),

  rewards: () => axios.get<Reward[]>('/client/rewards'),

  redeemReward: (rewardId: number) =>
    axios.post(`/client/rewards/${rewardId}/redeem`),

  updateProfile: (data: { name?: string; phone?: string; avatar?: File }) => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.phone) formData.append('phone', data.phone);
    if (data.avatar) formData.append('avatar', data.avatar);
    return axios.put('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Add this method
  joinRestaurant: (restaurantId: number) =>
    axios.post('/client/join-restaurant', { restaurant_id: restaurantId }),

  referralStats: () =>
    axios.get<{referral_code: string, total_points: number}>('/client/referral-stats'),

  // Promo Codes
  applyPromoCode: (code: string) =>
    axios.post<{ message: string; promo_code: PromoCode }>('/client/promo-codes/apply', { code }),

  promoHistory: () =>
    axios.get<PromoCodeUsage[]>('/client/promo-codes/history'),
};

// ==================== RESTAURANT ENDPOINTS ====================

export const restaurantAPI = {
  dashboard: () => axios.get<RestaurantDashboardResponse>('/restaurant/dashboard'),

  createRestaurant: (data: CreateRestaurantData) =>
    axios.post<{ message: string; restaurant: Restaurant }>('/restaurant/create', data),

  clients: () => axios.get<LoyaltyCard[]>('/restaurant/clients'),

  addClient: (data: { client_id?: number; email?: string }) =>
    axios.post('/restaurant/clients/add', data),

  addVisit: (clientId: number) =>
    axios.post('/restaurant/visits/add', { client_id: clientId }),

  blockClient: (clientId: number) =>
    axios.post(`/restaurant/clients/${clientId}/block`),

  updateSettings: (data: Partial<Restaurant>) =>
    axios.put('/restaurant/settings', data),

  weeklyStats: () => axios.get<{ day: string; visits: number }[]>('/restaurant/stats/weekly'),

  getClientInfo: (clientId: number) =>
    axios.get(`/restaurant/clients/${clientId}/info`),

  // Promo Codes
  getPromoCodes: () =>
    axios.get<PromoCode[]>('/restaurant/promo-codes'),

  createPromoCode: (data: { code?: string; description: string; type: string; value: number; max_uses?: number; expires_at?: string }) =>
    axios.post<{ message: string; promo_code: PromoCode }>('/restaurant/promo-codes', data),

  togglePromoCode: (id: number) =>
    axios.put<{ message: string; promo_code: PromoCode }>(`/restaurant/promo-codes/${id}`),

  deletePromoCode: (id: number) =>
    axios.delete(`/restaurant/promo-codes/${id}`),
};

// ==================== ADMIN ENDPOINTS ====================

export const adminAPI = {
  dashboard: () => axios.get<AdminDashboardResponse>('/admin/dashboard'),

  clients: (page = 1) =>
    axios.get<{ data: User[]; current_page: number; last_page: number; total: number }>(
      `/admin/clients?page=${page}`
    ),

  restaurants: (page = 1) =>
    axios.get<{ data: Restaurant[]; current_page: number; last_page: number; total: number }>(
      `/admin/restaurants?page=${page}`
    ),

  toggleBlockUser: (userId: number) =>
    axios.post(`/admin/users/${userId}/toggle-block`),

  deleteUser: (userId: number) => axios.delete(`/admin/users/${userId}`),

  addRestaurant: (data: CreateRestaurantData) =>
    axios.post('/admin/restaurants', data),

  deleteRestaurant: (restaurantId: number) =>
    axios.delete(`/admin/restaurants/${restaurantId}`),

  monthlyGrowth: () =>
    axios.get<{ month: string; clients: number; visits: number }[]>('/admin/analytics/monthly-growth'),

  categoryDistribution: () =>
    axios.get<{ category: string; value: number }[]>('/admin/analytics/categories'),

  topClients: () =>
    axios.get<{ name: string; visits: number; restaurants: number }[]>('/admin/analytics/top-clients'),

  restaurantOwners: () =>
    axios.get<{ id: number; name: string; email: string }[]>('/admin/analytics/owners'),

  pendingReviews: (page: number = 1) =>
    axios.get<{ data: Review[]; total: number }>(`/admin/reviews/pending?page=${page}`),
  
  approveReview: (reviewId: number) =>
    axios.post(`/admin/reviews/${reviewId}/approve`),

  deleteReview: (reviewId: number) =>
    axios.delete(`/admin/reviews/${reviewId}`),
};

// ==================== NOTIFICATION ENDPOINTS ====================

export const notificationAPI = {
  getAll: () => axios.get<NotificationsResponse>('/notifications'),
  unreadCount: () => axios.get<{ count: number }>('/notifications/unread-count'),
  markAllRead: () => axios.put('/notifications/read-all'),
  markRead: (id: number) => axios.put(`/notifications/${id}/read`),
  delete: (id: number) => axios.delete(`/notifications/${id}`),
};

// ==================== REVIEW ENDPOINTS ====================
export const reviewAPI = {
  platform: () => axios.get<Review[]>('/reviews/platform'),
  restaurant: (id: number) => axios.get<any>(`/reviews/restaurant/${id}`),
  store: (data: { restaurant_id?: number; rating: number; comment: string; type: 'platform' | 'restaurant' }) =>
    axios.post('/reviews', data),
};