import { auth } from './firebase';
import { toast } from 'sonner';
import i18n from './i18n';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  const jsonError = JSON.stringify(errInfo);
  console.error('Firestore Error:', jsonError);

  // User-facing notification
  if (errorMessage.toLowerCase().includes('unavailable') || errorMessage.toLowerCase().includes('reaching the backend')) {
    toast.error(i18n.t('network_error'), {
      description: i18n.t('network_error_desc') || "Could not connect to the database. Please check your internet connection.",
      duration: 10000,
    });
  } else if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('insufficient')) {
    toast.error(i18n.t('access_denied'), {
      description: i18n.t('access_denied_desc') || "You do not have permission to perform this action.",
    });
  }

  throw new Error(jsonError);
}
