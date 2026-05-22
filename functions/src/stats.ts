import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();

// Aggregation trigger when a new user registers
export const onUserCreated = onDocumentCreated("users/{userId}", async (event) => {
  const statsRef = db.doc("stats/marketpulse");
  await statsRef.set({
    totalUsers: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
});

// Aggregation trigger when a user profile is deleted
export const onUserDeleted = onDocumentDeleted("users/{userId}", async (event) => {
  const statsRef = db.doc("stats/marketpulse");
  await statsRef.set({
    totalUsers: FieldValue.increment(-1),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
});

// Aggregation trigger when a new job is posted
export const onJobCreated = onDocumentCreated("jobs/{jobId}", async (event) => {
  const jobData = event.data?.data();
  if (!jobData) return;

  const statsRef = db.doc("stats/marketpulse");
  await statsRef.set({
    totalJobs: FieldValue.increment(1),
    totalVolume: FieldValue.increment(jobData.budget || 0),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
});

// Aggregation trigger when a job is removed or closed
export const onJobDeleted = onDocumentDeleted("jobs/{jobId}", async (event) => {
  const jobData = event.data?.data();
  if (!jobData) return;

  const statsRef = db.doc("stats/marketpulse");
  await statsRef.set({
    totalJobs: FieldValue.increment(-1),
    totalVolume: FieldValue.increment(-(jobData.budget || 0)),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
});

// Aggregation trigger when a job budget gets modified
export const onJobUpdated = onDocumentUpdated("jobs/{jobId}", async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();
  if (!beforeData || !afterData) return;

  const budgetDiff = (afterData.budget || 0) - (beforeData.budget || 0);
  if (budgetDiff === 0) return;

  const statsRef = db.doc("stats/marketpulse");
  await statsRef.set({
    totalVolume: FieldValue.increment(budgetDiff),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
});
