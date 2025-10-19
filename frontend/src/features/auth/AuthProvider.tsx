import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type PropsWithChildren,
} from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import { getProfile } from '../../lib/api';
import { type Profile } from '../../types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isProfileComplete: boolean;
  loading: boolean;
  authError: string | null;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      let userProfile: Profile | null = null;
      let profileComplete = false;

      if (currentUser) {
        userProfile = await getProfile(currentUser.id);
        if (userProfile?.first_name && userProfile?.last_name) {
          profileComplete = true;
        }
      }

      setProfile(userProfile);
      setIsProfileComplete(profileComplete);
    } catch (err: any) {
      console.error('Error refreshing session:', err);
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsProfileComplete(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('error_description=Email+link+is+invalid')) {
      setAuthError(
        'Your invitation link has expired or is invalid. Please log in or ask for a new invite. \n\nIf you don\'t have your password, you can use the "Forgot Password" option.'
      );
      window.history.replaceState(null, '', window.location.pathname);
    }

    refreshSession();
  }, [refreshSession]);

  const value = {
    session,
    user,
    profile,
    isProfileComplete,
    loading,
    authError,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
