import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile } from "../types";
import { calculateProfileCompletion } from "../lib/profile";

const PROFILE_THRESHOLD = 80;

function getCompletion(user: any): number {
  const stored = user.profileCompletion ?? user.profileCompleteness ?? 0;
  const calculated = calculateProfileCompletion(user);
  return Math.max(stored, calculated);
}

function getJoinedAt(user: any): number {
  const raw = user.createdAt ?? user.created_at;
  if (!raw) return 0;
  if (raw?.toDate) return raw.toDate().getTime();
  return new Date(raw).getTime();
}

export function useTalents(
  searchTerm: string, 
  maxRate: number, 
  selectedLevels: string[],
  selectedLocation: string,
  selectedSkills: string[]
) {
  const [talents, setTalents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const q = query(collection(db, "users"));

    const unsub = onSnapshot(q, (snap) => {
      const allTalents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const filtered = allTalents.filter((u: any) => {
        if (u.isDeleted) return false;

        const completion = getCompletion(u);
        if (completion < PROFILE_THRESHOLD) return false;

        const rate = u.hourly_rate || 0;
        if (rate > maxRate) return false;

        if (selectedLocation && u.location) {
          if (!u.location.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
        }

        if (selectedSkills.length > 0 && u.skills) {
          const hasAllSkills = selectedSkills.every((s: string) => 
            u.skills.some((us: string) => us.toLowerCase() === s.toLowerCase())
          );
          if (!hasAllSkills) return false;
        }

        if (selectedLevels.length > 0) {
          const level = u.experience_level || "intermediate";
          if (!selectedLevels.includes(level)) return false;
        }

        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          const matchName = u.full_name?.toLowerCase().includes(lowerSearch) || u.displayName?.toLowerCase().includes(lowerSearch);
          const matchTitle = u.title?.toLowerCase().includes(lowerSearch);
          const matchBio = u.bio?.toLowerCase().includes(lowerSearch);
          const matchSkillsList = u.skills?.some((s: string) => s.toLowerCase().includes(lowerSearch));
          
          if (!matchName && !matchTitle && !matchBio && !matchSkillsList) return false;
        }

        return true;
      });

      filtered.sort((a, b) => getJoinedAt(b) - getJoinedAt(a));

      setTalents(filtered);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to talents:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [searchTerm, maxRate, selectedLevels, selectedLocation, selectedSkills]);

  return { talents, loading };
}
