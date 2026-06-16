export interface User {
  _id: string;
  name: string;
  email: string;
  googleId?: string;
  isAdmin: boolean;
  isActive: boolean;
  agreedToTerms: boolean;
  agreedToTermsAt?: string;
  razorpayCustomerId?: string;
  profile: {
    resumeUrl?: string;
    skills: string[];
    preferences: {
      locations: string[];
      jobTypes: string[];
      salaryMin?: number;
    };
  };
  createdAt: string;
}

export interface Plan {
  _id: string;
  slug: 'free' | 'standard' | 'premium' | 'elite';
  name: string;
  jobLimit: number;
  applyLimit: number;
  priceMonthly: number;
  priceYearly?: number;
  razorpayPlanIdMonthly?: string;
  features: string[];
  isActive: boolean;
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
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  skills: string[];
  description: string;
  applyUrl: string;
  postedAt: string;
  source: string;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  planSlug: string;
  applyLimit: number;
  appliesUsed: number;
  appliedJobIds: string[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface JobFilters {
  keyword?:  string;
  location?: string;
  jobType?:  string;
  page?:     number;
}
