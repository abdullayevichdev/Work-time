export type UserRole = 'freelancer' | 'client' | 'admin' | 'user' | 'owner';

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  project_url?: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  desc?: string;
}

export interface CertificateItem {
  title: string;
  issuer: string;
  date: string;
}

export interface UserProfile {
  id: string; // matches document uid
  uid?: string; // backup key
  email: string;
  displayName?: string; // New field
  full_name: string; // Legacy field for UI compatibility
  photoURL?: string; // New field
  photo_url?: string; // Legacy field for UI compatibility
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
    telegram?: string;
    instagram?: string;
  };
  stats?: {
    rating: number;
    completed_jobs: number;
    total_earned: number;
  };
  portfolio?: PortfolioItem[];
  experience?: ExperienceItem[];
  certificates?: CertificateItem[];
  membership?: 'free' | 'premium'; // New field
  is_premium: boolean; // Legacy field for UI compatibility
  is_admin?: boolean;
  premiumExpiresAt?: any | null; // Firestore Timestamp
  profileCompleteness?: number; // 0 to 100
  created_at: string | any; // Supports string and Timestamp
  createdAt?: any; // Firestore Timestamp
  
  // Real-time Peer system extensions
  profileViews?: number;
  acceptedRequests?: number;
  responseRate?: number;
  responseTimeHours?: number;
  dailyRequestsSent?: number;
  blockedUsers?: string[];
  lastRequestSentAt?: any;
  lastSeen?: any;
}

export interface PremiumRequest {
  id: string;
  user_id: string;
  userId?: string;
  user_name: string;
  user_email: string;
  proof_url?: string;
  screenshotUrl?: string; // New field
  amount?: number; // 3
  status: 'pending' | 'approved' | 'rejected';
  created_at: string | any;
  createdAt?: any;
  reviewedBy?: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  userId?: string;
  title: string;
  message: string;
  content?: string;
  body?: string; // Push body
  type: 'message' | 'application' | 'job_update' | 'premium_update' | 'request_received' | 'request_accepted' | 'request_declined' | 'request_expired' | 'profile_viewed' | 'system';
  is_read?: boolean;
  read?: boolean;
  created_at: string | any;
  createdAt?: any;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  link?: string;
}

export interface PeerRequest {
  id: string;
  fromUserId: string;
  fromUserSnapshot: {
    displayName: string;
    avatar: string;
    title: string;
    profileCompletion: number;
    rating: number;
  };
  toUserId: string;
  subject: string;
  message: string;
  proposedBudget?: number;
  budgetType?: 'permanent' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'fixed' | 'hourly';
  estimatedDuration?: string;
  attachmentUrl?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  viewedAt?: any;
  respondedAt?: any;
  expiresAt: any;
  createdAt: any;
  updatedAt: any;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: 'spam' | 'inappropriate' | 'scam' | 'harassment' | 'other';
  details: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  createdAt: any;
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
  budgetType?: 'fixed' | 'hourly';
  currency?: string; // "USD"
  duration?: string;
  tags: string[];
  status: 'open' | 'closed' | 'in_progress' | 'completed' | 'cancelled';
  userId: string; // legacy identifier
  clientId?: string; // New identifier matching userId
  clientName?: string;
  clientAvatar?: string;
  clientRating?: number;
  proposalsCount?: number;
  applicantsCount?: number; // legacy alias
  createdAt: any;
  updatedAt: any;
}

export interface Proposal {
  id: string;
  job_id: string; // legacy field
  jobId?: string; // New field
  job_title?: string;
  client_id?: string; // legacy field
  clientId?: string; // New field
  freelancer_id?: string; // legacy field
  freelancerId: string; // New field
  freelancer_name?: string; // legacy
  freelancerName: string; // New field
  freelancer_avatar?: string; // legacy
  freelancerAvatar: string; // New field
  bid_amount?: number; // legacy
  bidAmount: number; // New field
  estimated_days?: number; // legacy
  deliveryDays?: number; // New field
  cover_letter?: string; // legacy
  coverLetter: string; // New field
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: string; // legacy
  createdAt: any; // New field
}

export interface Conversation {
  id: string;
  participants: string[]; // [uid, uid]
  jobId?: string | null;
  lastMessage: string;
  lastMessageAt: any; // Firestore Timestamp
  unreadCount: { [uid: string]: number };
  participantsSnapshot?: {
    [uid: string]: {
      displayName: string;
      avatar: string;
      lastSeen?: any;
    }
  };
  initiatedFromRequestId?: string;
}

export interface Message {
  id: string;
  sender_id?: string; // legacy
  senderId: string; // New
  text: string;
  content?: string; // legacy fallback
  attachments?: string[];
  created_at?: string | any; // legacy
  createdAt: any; // New
  readBy?: string[]; // array of uids who read it
  participants?: string[]; // legacy
  receiver_id?: string; // legacy
}

export interface MarketPulseStats {
  totalEconomy: number;
  totalUsers: number;
  activeJobs: number;
  updatedAt: any; // Timestamp
}

