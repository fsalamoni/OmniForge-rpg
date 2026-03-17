import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChange, signInWithGoogle, signOut } from '@/firebase/auth';
import { UserProfile } from '@/firebase/db';

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

        // Load or create Firestore profile
        try {
          let profile = await UserProfile.get(firebaseUser.uid);
          if (!profile) {
            // First login — create profile
            const newProfile = {
              email: firebaseUser.email,
              full_name: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'user'
            };
            await UserProfile.upsert(firebaseUser.uid, newProfile);
            profile = { uid: firebaseUser.uid, ...newProfile };
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

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isAuthenticated,
      isLoadingAuth,
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
