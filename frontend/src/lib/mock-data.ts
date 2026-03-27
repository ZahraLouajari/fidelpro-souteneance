// Mock data for the loyalty card app

export type UserRole = 'client' | 'restaurant' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  joinedAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  location: string;
  image: string;
  totalVisitsRequired: number;
  reward: string;
  category: string;
}

export interface LoyaltyCard {
  id: string;
  clientId: string;
  restaurantId: string;
  restaurant: Restaurant;
  currentVisits: number;
  totalRequired: number;
  reward: string;
  lastVisit: string;
  status: 'active' | 'completed' | 'expired';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'points' | 'reward' | 'visit' | 'system';
  read: boolean;
  createdAt: string;
}

export interface Visit {
  id: string;
  clientName: string;
  restaurantName: string;
  date: string;
  points: number;
}

export interface Reward {
  id: string;
  clientId: string;
  restaurantName: string;
  reward: string;
  unlockedAt: string;
  redeemed: boolean;
}

export const mockRestaurants: Restaurant[] = [
  { id: '1', name: 'Le Petit Bistro', location: 'Paris, 6th Arr.', image: '', totalVisitsRequired: 10, reward: 'Free dinner for two', category: 'French' },
  { id: '2', name: 'Sakura Garden', location: 'Tokyo, Shibuya', image: '', totalVisitsRequired: 8, reward: 'Free omakase course', category: 'Japanese' },
  { id: '3', name: 'Trattoria Bella', location: 'Rome, Trastevere', image: '', totalVisitsRequired: 12, reward: 'Free pasta & wine', category: 'Italian' },
  { id: '4', name: 'The Golden Fork', location: 'London, Soho', image: '', totalVisitsRequired: 10, reward: 'Free brunch set', category: 'British' },
  { id: '5', name: 'Casa del Mar', location: 'Barcelona, Born', image: '', totalVisitsRequired: 8, reward: 'Free paella', category: 'Spanish' },
  { id: '6', name: 'Dar Zellij', location: 'Marrakech, Medina', image: '', totalVisitsRequired: 6, reward: 'Free tagine royale', category: 'Moroccan' },
  { id: '7', name: 'Burger & Lobster', location: 'New York, Midtown', image: '', totalVisitsRequired: 10, reward: 'Free lobster roll combo', category: 'American' },
  { id: '8', name: 'Naan & Curry', location: 'Mumbai, Bandra', image: '', totalVisitsRequired: 8, reward: 'Free thali platter', category: 'Indian' },
  { id: '9', name: 'El Fogón', location: 'Mexico City, Roma', image: '', totalVisitsRequired: 10, reward: 'Free taco feast', category: 'Mexican' },
  { id: '10', name: 'Seoul Kitchen', location: 'Seoul, Gangnam', image: '', totalVisitsRequired: 8, reward: 'Free BBQ for two', category: 'Korean' },
  { id: '11', name: 'Chez Maurice', location: 'Lyon, Vieux Lyon', image: '', totalVisitsRequired: 10, reward: 'Free dessert tasting', category: 'French' },
  { id: '12', name: 'Olive & Thyme', location: 'Athens, Plaka', image: '', totalVisitsRequired: 8, reward: 'Free mezze platter', category: 'Greek' },
];

export const mockLoyaltyCards: LoyaltyCard[] = [
  { id: '1', clientId: '1', restaurantId: '1', restaurant: mockRestaurants[0], currentVisits: 7, totalRequired: 10, reward: 'Free dinner for two', lastVisit: '2026-03-20', status: 'active' },
  { id: '2', clientId: '1', restaurantId: '2', restaurant: mockRestaurants[1], currentVisits: 5, totalRequired: 8, reward: 'Free omakase course', lastVisit: '2026-03-18', status: 'active' },
  { id: '3', clientId: '1', restaurantId: '3', restaurant: mockRestaurants[2], currentVisits: 12, totalRequired: 12, reward: 'Free pasta & wine', lastVisit: '2026-03-15', status: 'completed' },
  { id: '4', clientId: '1', restaurantId: '4', restaurant: mockRestaurants[3], currentVisits: 3, totalRequired: 10, reward: 'Free brunch set', lastVisit: '2026-03-22', status: 'active' },
  { id: '5', clientId: '1', restaurantId: '5', restaurant: mockRestaurants[4], currentVisits: 8, totalRequired: 8, reward: 'Free paella', lastVisit: '2026-03-10', status: 'completed' },
  { id: '6', clientId: '1', restaurantId: '6', restaurant: mockRestaurants[5], currentVisits: 2, totalRequired: 6, reward: 'Free tagine royale', lastVisit: '2026-03-23', status: 'active' },
];

export const mockRewards: Reward[] = [
  // Original rewards
  { id: '1', clientId: '1', restaurantName: 'Trattoria Bella', reward: 'Free pasta & wine', unlockedAt: '2026-03-15', redeemed: false },
  { id: '2', clientId: '1', restaurantName: 'Casa del Mar', reward: 'Free paella', unlockedAt: '2026-03-10', redeemed: true },
  { id: '3', clientId: '2', restaurantName: 'Le Petit Bistro', reward: 'Free dinner for two', unlockedAt: '2026-03-12', redeemed: false },
  { id: '4', clientId: '3', restaurantName: 'Sakura Garden', reward: 'Free omakase course', unlockedAt: '2026-03-08', redeemed: false },
  { id: '5', clientId: '1', restaurantName: 'Burger & Lobster', reward: 'Free lobster roll combo', unlockedAt: '2026-02-28', redeemed: true },
  
  // Additional rewards for client 1 (Alice Martin)
  { id: '6', clientId: '1', restaurantName: 'Le Petit Bistro', reward: 'Free dinner for two', unlockedAt: '2026-03-25', redeemed: false },
  { id: '7', clientId: '1', restaurantName: 'Sakura Garden', reward: 'Free omakase course', unlockedAt: '2026-03-24', redeemed: false },
  { id: '8', clientId: '1', restaurantName: 'The Golden Fork', reward: 'Free brunch set', unlockedAt: '2026-03-22', redeemed: false },
  { id: '9', clientId: '1', restaurantName: 'Dar Zellij', reward: 'Free tagine royale', unlockedAt: '2026-03-21', redeemed: false },
  { id: '10', clientId: '1', restaurantName: 'Naan & Curry', reward: 'Free thali platter', unlockedAt: '2026-03-20', redeemed: false },
  { id: '11', clientId: '1', restaurantName: 'El Fogón', reward: 'Free taco feast', unlockedAt: '2026-03-19', redeemed: false },
  { id: '12', clientId: '1', restaurantName: 'Seoul Kitchen', reward: 'Free BBQ for two', unlockedAt: '2026-03-18', redeemed: false },
  { id: '13', clientId: '1', restaurantName: 'Chez Maurice', reward: 'Free dessert tasting', unlockedAt: '2026-03-17', redeemed: false },
  { id: '14', clientId: '1', restaurantName: 'Olive & Thyme', reward: 'Free mezze platter', unlockedAt: '2026-03-16', redeemed: false },
];

export const mockNotifications: Notification[] = [
  { id: '1', title: 'Points Added!', message: 'You earned 1 visit point at Le Petit Bistro', type: 'points', read: false, createdAt: '2026-03-25T10:00:00' },
  { id: '2', title: 'Reward Unlocked! 🎉', message: 'Congratulations! You unlocked a free pasta & wine at Trattoria Bella', type: 'reward', read: false, createdAt: '2026-03-24T15:30:00' },
  { id: '3', title: 'New Visit Recorded', message: 'Your visit at Sakura Garden has been recorded', type: 'visit', read: true, createdAt: '2026-03-23T12:00:00' },
  { id: '4', title: 'Welcome Bonus', message: 'You received 2 bonus points for joining!', type: 'system', read: true, createdAt: '2026-03-20T09:00:00' },
  { id: '5', title: 'New Reward Available', message: 'Free paella at Casa del Mar is waiting for you!', type: 'reward', read: false, createdAt: '2026-03-19T14:00:00' },
];

export const mockClients: User[] = [
  { id: '1', name: 'Alice Martin', email: 'alice@example.com', role: 'client', phone: '+33 6 12 34 56 78', joinedAt: '2026-01-15' },
  { id: '2', name: 'James Wilson', email: 'james@example.com', role: 'client', phone: '+44 7 911 123 456', joinedAt: '2026-02-03' },
  { id: '3', name: 'Sophie Dubois', email: 'sophie@example.com', role: 'client', phone: '+33 6 98 76 54 32', joinedAt: '2026-01-28' },
  { id: '4', name: 'Marco Rossi', email: 'marco@example.com', role: 'client', phone: '+39 3 456 789 012', joinedAt: '2026-03-01' },
  { id: '5', name: 'Emma Chen', email: 'emma@example.com', role: 'client', phone: '+86 138 0013 8000', joinedAt: '2026-02-20' },
  { id: '6', name: 'Youssef El Amrani', email: 'youssef@example.com', role: 'client', phone: '+212 6 61 23 45 67', joinedAt: '2026-02-10' },
  { id: '7', name: 'Fatima Zahra', email: 'fatima@example.com', role: 'client', phone: '+212 6 72 34 56 78', joinedAt: '2026-01-20' },
  { id: '8', name: 'Liam O\'Brien', email: 'liam@example.com', role: 'client', phone: '+353 85 123 4567', joinedAt: '2026-03-05' },
  { id: '9', name: 'Hana Tanaka', email: 'hana@example.com', role: 'client', phone: '+81 90 1234 5678', joinedAt: '2026-02-15' },
  { id: '10', name: 'Carlos Mendez', email: 'carlos@example.com', role: 'client', phone: '+34 612 345 678', joinedAt: '2026-03-10' },
  { id: '11', name: 'Amina Benali', email: 'amina@example.com', role: 'client', phone: '+212 6 55 67 89 01', joinedAt: '2026-01-05' },
  { id: '12', name: 'David Kim', email: 'david@example.com', role: 'client', phone: '+82 10 1234 5678', joinedAt: '2026-02-25' },
];

export const mockVisitHistory: Visit[] = [
  { id: '1', clientName: 'Alice Martin', restaurantName: 'Le Petit Bistro', date: '2026-03-25', points: 1 },
  { id: '2', clientName: 'James Wilson', restaurantName: 'The Golden Fork', date: '2026-03-24', points: 1 },
  { id: '3', clientName: 'Sophie Dubois', restaurantName: 'Le Petit Bistro', date: '2026-03-24', points: 1 },
  { id: '4', clientName: 'Marco Rossi', restaurantName: 'Trattoria Bella', date: '2026-03-23', points: 1 },
  { id: '5', clientName: 'Emma Chen', restaurantName: 'Sakura Garden', date: '2026-03-23', points: 1 },
  { id: '6', clientName: 'Youssef El Amrani', restaurantName: 'Dar Zellij', date: '2026-03-22', points: 1 },
  { id: '7', clientName: 'Fatima Zahra', restaurantName: 'Naan & Curry', date: '2026-03-22', points: 1 },
  { id: '8', clientName: 'Liam O\'Brien', restaurantName: 'Burger & Lobster', date: '2026-03-21', points: 1 },
  { id: '9', clientName: 'Hana Tanaka', restaurantName: 'Seoul Kitchen', date: '2026-03-21', points: 1 },
  { id: '10', clientName: 'Carlos Mendez', restaurantName: 'El Fogón', date: '2026-03-20', points: 1 },
];

// Chart data
export const weeklyVisitsData = [
  { day: 'Mon', visits: 12 },
  { day: 'Tue', visits: 19 },
  { day: 'Wed', visits: 15 },
  { day: 'Thu', visits: 22 },
  { day: 'Fri', visits: 30 },
  { day: 'Sat', visits: 35 },
  { day: 'Sun', visits: 28 },
];

export const monthlyGrowthData = [
  { month: 'Jan', clients: 45, visits: 120 },
  { month: 'Feb', clients: 72, visits: 210 },
  { month: 'Mar', clients: 110, visits: 340 },
];

export const categoryDistribution = [
  { name: 'French', value: 30, fill: 'hsl(28, 80%, 52%)' },
  { name: 'Japanese', value: 15, fill: 'hsl(38, 90%, 55%)' },
  { name: 'Italian', value: 15, fill: 'hsl(25, 30%, 40%)' },
  { name: 'Moroccan', value: 12, fill: 'hsl(15, 70%, 50%)' },
  { name: 'American', value: 8, fill: 'hsl(30, 15%, 65%)' },
  { name: 'Indian', value: 7, fill: 'hsl(35, 60%, 70%)' },
  { name: 'Korean', value: 6, fill: 'hsl(20, 50%, 45%)' },
  { name: 'Other', value: 7, fill: 'hsl(40, 30%, 60%)' },
];

export const topClients = [
  { name: 'Alice Martin', visits: 37, restaurants: 6 },
  { name: 'Sophie Dubois', visits: 24, restaurants: 4 },
  { name: 'Youssef El Amrani', visits: 22, restaurants: 5 },
  { name: 'James Wilson', visits: 18, restaurants: 3 },
  { name: 'Fatima Zahra', visits: 16, restaurants: 4 },
  { name: 'Emma Chen', visits: 14, restaurants: 3 },
  { name: 'Marco Rossi', visits: 12, restaurants: 2 },
  { name: 'Hana Tanaka', visits: 10, restaurants: 3 },
];