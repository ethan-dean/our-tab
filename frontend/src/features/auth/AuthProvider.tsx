import { createContext, useEffect, useState, type PropsWithChildren } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authError: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check for auth error in URL on initial load
    const hash = window.location.hash;
    if (hash.includes('error_description=Email+link+is+invalid')) {
      setAuthError('Your invitation link has expired or is invalid. Please log in or ask for a new invite. \n\nIf you don\'t have your password, you can use the "Forgot Password" option.');
      // Clean the URL
      window.history.replaceState(null, '', window.location.pathname);
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading,
    authError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
