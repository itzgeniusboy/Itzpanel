import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
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
    
    // Check for redirect result on mount
    getRedirectResult(auth).catch((error) => {
      console.error('Redirect result error:', error);
    });

    // Safety timeout to prevent infinite loading screen
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        clearTimeout(safetyTimeout);
        setProfile(null);
        setLoading(false);
        return;
      }

      const profileRef = doc(db, 'users', firebaseUser.uid);
      
      // Cleanup previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
        clearTimeout(safetyTimeout);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          
          // Auto-elevate owner email to admin if not already
          const ownerEmail = 'itzraviking@gmail.com';
          if (firebaseUser.email?.toLowerCase() === ownerEmail && data.role !== 'admin') {
            try {
              await setDoc(profileRef, { role: 'admin' }, { merge: true });
              data.role = 'admin';
            } catch (e) {
              console.error('Owner elevation failed:', e);
            }
          }
          
          setProfile(data);
          setLoading(false);
        } else {
          const ownerEmail = 'itzraviking@gmail.com';
          const isOwner = firebaseUser.email?.toLowerCase() === ownerEmail;
          
          if (isOwner) {
            console.log('Detected owner, provisioning profile...');
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'admin',
              balance: 1000000,
              createdAt: Date.now()
            };
            try {
              await setDoc(profileRef, newProfile);
              // Profile state will be updated by the next snapshot trigger
            } catch (e) {
              console.error('Initial owner profile creation failed:', e);
              // Fallback: set it locally so they can at least enter
              setProfile(newProfile);
              setLoading(false);
            }
          } else {
            setProfile(null);
            setLoading(false);
          }
        }
      }, (error) => {
        console.error('Profile snapshot error:', error);
        clearTimeout(safetyTimeout);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.warn('Login attempt interrupted or cancelled.');
      } else {
        console.error('Login error:', error.code, error.message);
        if (error.code === 'auth/invalid-action-code' || error.message?.includes('invalid')) {
           const useRedirect = confirm('Authentication error: "Requested Action is Invalid". This usually means popups are blocked or the environment is restricted. Would you like to try the Redirect method instead?');
           if (useRedirect) {
             await signInWithRedirect(auth, provider);
           }
        } else {
           alert(`Authentication Error: ${error.code}\n${error.message}`);
        }
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
