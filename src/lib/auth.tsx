import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isReseller: boolean;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Cleanup previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(firebaseUser);
      
      if (firebaseUser) {
        const profileRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            
            // Auto-elevate owner email to admin if not already
            if (firebaseUser.email === 'itzraviking@gmail.com' && data.role !== 'admin') {
              data.role = 'admin';
              await setDoc(profileRef, data, { merge: true });
            }
            
            setProfile(data);
            setLoading(false);
          } else {
            const isBootstrappedAdmin = firebaseUser.email === 'itzraviking@gmail.com';
            if (isBootstrappedAdmin) {
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: 'admin',
                createdAt: Date.now()
              };
              await setDoc(profileRef, newProfile);
              setProfile(newProfile);
              setLoading(false);
            } else {
              setProfile(null);
              setLoading(false);
            }
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.warn('Login attempt interrupted or cancelled.');
      } else {
        console.error('Login error:', error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isReseller = profile?.role === 'reseller';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isLoggingIn, isAdmin, isReseller, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
