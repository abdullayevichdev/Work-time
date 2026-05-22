import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { Job } from "../types";

export async function createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) {
  return await addDoc(collection(db, "jobs"), {
    ...jobData,
    status: jobData.status || 'open',
    proposalsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
