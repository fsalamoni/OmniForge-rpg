import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const normalizeStoragePrefix = (value) =>
  (value || 'omniforge').replace(/^\/+|\/+$/g, '');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const firebaseEnvKeys = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID'
};

const isMissingOrPlaceholder = (value) =>
  !value || /^(your_|.*_here$)/i.test(value) || value.includes('your_project_id');

const invalidFirebaseEnvVars = Object.entries(firebaseConfig)
  .filter(([, value]) => isMissingOrPlaceholder(value))
  .map(([key]) => firebaseEnvKeys[key]);

export const firebaseConfigError = invalidFirebaseEnvVars.length > 0
  ? new Error(
    `Configuração do Firebase ausente ou inválida: ${invalidFirebaseEnvVars.join(', ')}. ` +
    'Verifique as variáveis de ambiente e os secrets do deploy.'
  )
  : null;

export const isFirebaseConfigured = !firebaseConfigError;
export const firebaseDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || 'omniforge';
export const firebaseStoragePrefix = normalizeStoragePrefix(import.meta.env.VITE_FIREBASE_STORAGE_PREFIX);

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app, firebaseDatabaseId) : null;
export const storage = app ? getStorage(app) : null;
