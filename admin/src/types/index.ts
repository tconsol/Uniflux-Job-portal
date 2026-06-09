export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  razorpayCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  _id: string;
  slug: 'basic' | 'standard' | 'premium' | 'elite';
  name: string;
  jobLimit: number;
  priceMonthly: number;
  priceYearly: number;
  razorpayPlanIdMonthly?: string;
  razorpayPlanIdYearly?: string;
  isActive: boolean;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  userId: string;
  planSlug: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: 'active' | 'expired' | 'inactive';
  planActivatedAt?: string;
  planExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetail {
  user: AdminUser;
  subscription: Subscription | null;
  plan: Plan | null;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlanBreakdown {
  planSlug: string;
  count: number;
  mrr: number;
}

export interface RecentUser {
  _id: string;
  name: string;
  email: string;
  planSlug: string | null;
  createdAt: string;
}

export interface RevenueSummary {
  totalUsers: number;
  activeSubscriptions: number;
  planBreakdown: PlanBreakdown[];
  estimatedMRR: number;
  recentUsers: RecentUser[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
