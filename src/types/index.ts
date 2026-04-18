export type UserRole = 'freelancer' | 'client' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  bio?: string;
  skills?: string[];
  rating?: number;
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

export interface Job {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  client_id: string;
  client_name: string;
  client_avatar?: string;
  created_at: string;
  is_featured: boolean;
}

export interface Application {
  id: string;
  job_id: string;
  freelancer_id: string;
  message: string;
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
