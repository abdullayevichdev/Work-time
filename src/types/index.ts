export type UserRole = 'freelancer' | 'client' | 'admin';

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  project_url?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  photo_url?: string;
  phone?: string;
  role: UserRole;
  bio?: string;
  skills?: string[];
  rating?: number;
  hourly_rate?: number;
  location?: string;
  socials?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
  stats?: {
    rating: number;
    completed_jobs: number;
    total_earned: number;
  };
  portfolio?: PortfolioItem[];
  is_premium: boolean;
  is_admin?: boolean;
  created_at: string;
}

export interface PremiumRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'message' | 'application' | 'job_update' | 'premium_update';
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  job_id: string;
  job_title: string;
  from_user_id: string;
  from_user_name: string;
  from_user_avatar?: string;
  to_user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  budget_type: 'fixed' | 'hourly';
  category: string;
  experience_level: 'entry' | 'intermediate' | 'expert';
  skills_required: string[];
  client_id: string;
  client_name: string;
  client_avatar?: string;
  status: 'open' | 'closed' | 'completed';
  hired_freelancer_id?: string;
  hired_freelancer_name?: string;
  created_at: string;
  is_featured: boolean;
}

export interface Proposal {
  id: string;
  job_id: string;
  job_title: string;
  client_id: string;
  freelancer_id: string;
  freelancer_name: string;
  freelancer_avatar: string;
  bid_amount: number;
  estimated_days: number;
  cover_letter: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}
