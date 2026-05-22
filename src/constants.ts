export const ADMIN_USERS: Record<string, string> = {
  'abdulxayavazxanov2012@gmail.com': 'Admin_Abdulxay',
  'unknownprogrammerdev@gmail.com': 'Admin_Javohir',
  'tuyginovsardor4@gmail.com': 'Admin_Sardor'
};

export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return !!ADMIN_USERS[email.toLowerCase()];
};

export const getAdminName = (email: string | null | undefined): string | null => {
  if (!email) return null;
  return ADMIN_USERS[email.toLowerCase()] || null;
};

export const PROFILE_WEIGHTS = {
  fullName: 15,
  title: 10,
  bio: 15,
  photoUrl: 20,
  skills: 15,
  location: 10,
  experience: 10,
  phone: 5
};

export const LIMITS = {
  STANDARD_POSTINGS: 3,
  STANDARD_APPLICATIONS: 5,
  PREMIUM_FEE: 3
};

export type PaymentPeriod = 'permanent' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export const PAYMENT_PERIODS: { value: PaymentPeriod; labelKey: string }[] = [
  { value: 'permanent', labelKey: 'payment_period_permanent' },
  { value: 'daily', labelKey: 'payment_period_daily' },
  { value: 'weekly', labelKey: 'payment_period_weekly' },
  { value: 'monthly', labelKey: 'payment_period_monthly' },
  { value: 'quarterly', labelKey: 'payment_period_quarterly' },
  { value: 'yearly', labelKey: 'payment_period_yearly' },
];

