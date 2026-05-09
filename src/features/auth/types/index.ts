export type UserRole = 'consumer' | 'seller';
export type SellerPlan = 'free' | 'basic' | 'pro';

export interface SellerProfile {
  companyName?: string;
  reraId?: string;
  plan: SellerPlan;
  planExpiresAt?: string;
  listingQuotaUsed: number;
  listingQuotaTotal: number;
  totalLeads: number;
  rating: number;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  city?: string;
  role: UserRole;
  preferences?: UserPreferences;
  seller?: SellerProfile;
  createdAt: string;
}

export interface UserPreferences {
  budgetMin: number;
  budgetMax: number;
  preferredCities: string[];
  preferredTypes: string[];
  preferredConfigs: string[];
  notificationsEnabled: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
