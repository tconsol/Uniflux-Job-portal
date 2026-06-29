export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
}

export interface Experience {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  resumeUrl?: string | null;
  skills: string[];
  phone?: string | null;
  location?: string | null;
  linkedIn?: string | null;
  portfolio?: string | null;
  github?: string | null;
  title?: string | null;
  bio?: string | null;
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  coverLetter?: string | null;
  preferences: {
    locations: string[];
    jobTypes: string[];
    salaryMin?: number | null;
  };
}

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
  profile: UserProfile;
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
  totalPages: number;
  hasMore: boolean;
  planSlug: string;
  applyLimit: number;
  appliesUsed: number;
  appliedJobIds: string[];
}

export interface CountsResponse {
  total: number;
  by_site: Record<string, number>;
  by_job_type: Record<string, number>;
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
