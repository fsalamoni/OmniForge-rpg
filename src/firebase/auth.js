import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfigError } from './config';

const googleProvider = new GoogleAuthProvider();

const requireAuth = () => {
  if (!auth) {
    throw firebaseConfigError || new Error('Firebase Auth não está configurado.');
  }
  return auth;
};

export const signInWithGoogle = () => signInWithPopup(requireAuth(), googleProvider);

export const signOut = () => firebaseSignOut(requireAuth());

export const onAuthStateChange = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
};
