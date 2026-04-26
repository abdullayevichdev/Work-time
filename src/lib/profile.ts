import { t } from 'i18next';
import { ADMIN_USERS } from '@/constants';

export const calculateProfileCompletion = (profile: any) => {
  if (!profile) return 0;
  
  // Admins are always 100% complete
  if (profile.email && ADMIN_USERS[profile.email.toLowerCase()]) {
    return 100;
  }

  let score = 0;
  
  // Weights (Total 100)
  if (profile.full_name) score += 15;
  if (profile.title && profile.title !== t('prof_creator')) score += 10;
  if (profile.bio) score += 15;
  if (profile.photo_url) score += 20;
  if (profile.skills && profile.skills.length > 0) score += 15;
  if (profile.location && profile.location !== t('uzbekistan')) score += 10;
  if (profile.experience && profile.experience.length > 0) score += 10;
  if (profile.phone) score += 5;
  
  return score;
};

export const isProfileComplete = (profile: any) => {
  return calculateProfileCompletion(profile) >= 80; // Let's say 80% is "complete enough" or check for specific fields
};
