import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChange, signInWithGoogle, signOut } from '@/firebase/auth';
import { UserProfile } from '@/firebase/db';

// Emails com privilégio de administrador
const ADMIN_EMAILS = ['fsalamoni@gmail.com'];

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);

        try {
          let profile = await UserProfile.get(firebaseUser.uid);
          const shouldBeAdmin = ADMIN_EMAILS.includes(firebaseUser.email);

          if (!profile) {
            // Primeiro login — cria perfil
            const newProfile = {
              email: firebaseUser.email,
              full_name: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              role: shouldBeAdmin ? 'admin' : 'user'
            };
            await UserProfile.upsert(firebaseUser.uid, newProfile);
            profile = { uid: firebaseUser.uid, ...newProfile };
          } else if (shouldBeAdmin && profile.role !== 'admin') {
            // Eleva automaticamente o admin definido na lista
            await UserProfile.upsert(firebaseUser.uid, { role: 'admin' });
            profile = { ...profile, role: 'admin' };
          }

          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to load user profile:', err);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const logout = async () => {
    await signOut();
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profile = await UserProfile.get(user.uid);
    setUserProfile(profile);
  };

  // Admin: email na lista de admins OU role 'admin' no Firestore
  const isAdmin =
    ADMIN_EMAILS.includes(user?.email) || userProfile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isAuthenticated,
      isLoadingAuth,
      isAdmin,
      login,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
