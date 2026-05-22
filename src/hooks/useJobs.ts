import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Job } from "../types";

export function useJobs(searchTerm: string) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const q = query(
      collection(db, "jobs"),
      where("status", "==", "open")
    );

    const unsub = onSnapshot(q, (snap) => {
      const allJobs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      const sortedJobs = [...allJobs].sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.created_at || 0).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      });
      
      // Client-side text search (Firestore does not support full-text search directly without index plugins)
      const q = searchTerm.toLowerCase();
      const filtered = sortedJobs.filter(job => 
        (job.title || '').toLowerCase().includes(q) ||
        (job.description || '').toLowerCase().includes(q) ||
        (job.tags || []).some((tag: string) => tag.toLowerCase().includes(q))
      );

      setJobs(filtered);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to jobs:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [searchTerm]);

  return { jobs, loading };
}
