import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Proposal } from "../types";

export function useProposals(jobId: string) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const q = query(
      collection(db, "jobs", jobId, "proposals"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setProposals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      setLoading(false);
    }, (error) => {
      console.error("Error listening to proposals:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [jobId]);

  return { proposals, loading };
}

export async function submitProposal(jobId: string, proposalData: Omit<Proposal, 'id' | 'createdAt'>) {
  if (!auth.currentUser) throw new Error("User must be authenticated");

  const jobRef = doc(db, "jobs", jobId);
  const subProposalRef = doc(collection(db, "jobs", jobId, "proposals"));
  const rootProposalRef = doc(db, "proposals", subProposalRef.id);

  return await runTransaction(db, async (transaction) => {
    const jobSnap = await transaction.get(jobRef);
    if (!jobSnap.exists()) {
      throw new Error("Job does not exist!");
    }

    const currentCount = jobSnap.data().proposalsCount || 0;

    // 1. Increment proposalsCount inside jobs parent document
    transaction.update(jobRef, { proposalsCount: currentCount + 1, applicantsCount: currentCount + 1 });

    // 2. Set nested proposal document
    const fullProposal = {
      ...proposalData,
      id: subProposalRef.id,
      freelancerId: auth.currentUser.uid,
      freelancer_id: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      created_at: new Date().toISOString()
    };

    transaction.set(subProposalRef, fullProposal);
    transaction.set(rootProposalRef, fullProposal);
  });
}
