import { t } from 'i18next';
import { isAdminEmail, PROFILE_WEIGHTS } from '@/constants';

export const calculateProfileCompletion = (profile: any) => {
  if (!profile) return 0;
  
  // Admins are always 100% complete
  if (profile.email && isAdminEmail(profile.email)) {
    return 100;
  }

  let score = 0;
  
  // Weights (Total 100)
  if (profile.full_name) score += PROFILE_WEIGHTS.fullName;
  if (profile.title && profile.title !== t('prof_creator')) score += PROFILE_WEIGHTS.title;
  if (profile.bio) score += PROFILE_WEIGHTS.bio;
  if (profile.photo_url) score += PROFILE_WEIGHTS.photoUrl;
  if (profile.skills && profile.skills.length > 0) score += PROFILE_WEIGHTS.skills;
  if (profile.location && profile.location !== t('uzbekistan')) score += PROFILE_WEIGHTS.location;
  if (profile.experience && profile.experience.length > 0) score += PROFILE_WEIGHTS.experience;
  if (profile.phone) score += PROFILE_WEIGHTS.phone;
  
  return score;
};

export const isProfileComplete = (profile: any) => {
  return calculateProfileCompletion(profile) >= 80;
};
