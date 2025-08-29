import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, AuthError, AuthChangeEvent, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string;
  mobile_number: string;
  village: string;
  role: 'worker' | 'provider';
  profile_picture_url?: string;
  rating: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

interface UseAuthReturn extends AuthState {
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  retry: () => Promise<void>;
}

// Custom error class for better error handling
class AuthHookError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'AuthHookError';
  }
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    initialized: false,
  });

  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to update state safely
  const updateState = useCallback((updates: Partial<AuthState>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Enhanced profile fetching with retry logic
  const fetchProfile = useCallback(async (
    userId: string, 
    retryCount = 0
  ): Promise<Profile | null> => {
    const maxRetries = 3;
    const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Handle specific Supabase errors
        if (error.code === 'PGRST116') {
          // No profile found - this might be expected for new users
          console.info('No profile found for user:', userId);
          return null;
        }

        // Retry on network errors
        if (retryCount < maxRetries && (
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.code === 'NETWORK_ERROR'
        )) {
          console.warn(`Profile fetch attempt ${retryCount + 1} failed, retrying in ${retryDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return fetchProfile(userId, retryCount + 1);
        }

        throw new AuthHookError(`Failed to fetch profile: ${error.message}`, error.code);
      }

      return data;
    } catch (error) {
      if (error instanceof AuthHookError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching profile:', error);
      throw new AuthHookError(`Profile fetch failed: ${errorMessage}`);
    }
  }, []);

  // Get initial session with improved error handling
  const getInitialSession = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new AuthHookError(`Session retrieval failed: ${error.message}`, error.message);
      }

      let profileData: Profile | null = null;
      if (session?.user) {
        try {
          profileData = await fetchProfile(session.user.id);
        } catch (profileError) {
          // Don't fail the entire auth initialization if profile fetch fails
          console.error('Failed to fetch profile during initialization:', profileError);
          updateState({ 
            error: profileError instanceof AuthHookError 
              ? profileError.message 
              : 'Failed to load user profile' 
          });
        }
      }

      updateState({
        user: session?.user ?? null,
        profile: profileData,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      const errorMessage = error instanceof AuthHookError
        ? error.message
        : error instanceof AuthError 
        ? `Authentication error: ${error.message}`
        : error instanceof Error 
        ? error.message 
        : 'Failed to initialize session';
      
      console.error('Error getting initial session:', error);
      updateState({ 
        error: errorMessage, 
        loading: false,
        initialized: true,
        user: null,
        profile: null
      });
    }
  }, [fetchProfile, updateState]);

  // Retry function for failed operations
  const retry = useCallback(async (): Promise<void> => {
    if (!state.initialized) {
      await getInitialSession();
    } else if (state.user && !state.profile) {
      await refreshProfile();
    }
  }, [state.initialized, state.user, state.profile, getInitialSession]);

  // Refresh profile function with better error handling
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!state.user) {
      throw new AuthHookError('No user logged in');
    }

    try {
      updateState({ error: null });
      const profileData = await fetchProfile(state.user.id);
      updateState({ profile: profileData });
    } catch (error) {
      const errorMessage = error instanceof AuthHookError 
        ? error.message 
        : 'Failed to refresh profile';
      updateState({ error: errorMessage });
      throw error;
    }
  }, [state.user, fetchProfile, updateState]);

  // Enhanced auth state change handler
  const handleAuthStateChange = useCallback(async (
    event: AuthChangeEvent, 
    session: Session | null
  ) => {
    try {
      updateState({ error: null });
      
      const user = session?.user ?? null;
      let profileData: Profile | null = null;

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (user) {
            try {
              profileData = await fetchProfile(user.id);
            } catch (error) {
              console.error('Failed to fetch profile after sign in:', error);
              // Don't block sign-in if profile fetch fails
            }
          }
          break;
        
        case 'SIGNED_OUT':
          // Clear all data on sign out
          profileData = null;
          break;
        
        case 'USER_UPDATED':
          // Keep existing profile data, optionally refresh
          profileData = state.profile;
          break;
        
        default:
          if (user) {
            profileData = await fetchProfile(user.id);
          }
      }

      updateState({
        user,
        profile: profileData,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      const errorMessage = error instanceof AuthHookError
        ? error.message
        : error instanceof Error 
        ? error.message 
        : 'Auth state change error';
      
      console.error('Error in auth state change:', error);
      updateState({ 
        error: errorMessage, 
        loading: false,
        initialized: true,
      });
    }
  }, [fetchProfile, updateState, state.profile]);

  // Set up auth state listener
  useEffect(() => {
    isMountedRef.current = true;
    
    // Get initial session
    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [getInitialSession, handleAuthStateChange]);

  // Sign out function with better error handling
  const signOut = useCallback(async (): Promise<void> => {
    try {
      updateState({ error: null });
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new AuthHookError(`Sign out failed: ${error.message}`, error.message);
      }

      // State will be updated by the auth state change listener
    } catch (error) {
      const errorMessage = error instanceof AuthHookError
        ? error.message
        : error instanceof AuthError
        ? `Sign out failed: ${error.message}`
        : error instanceof Error
        ? error.message
        : 'Failed to sign out';
      
      console.error('Error signing out:', error);
      updateState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  }, [updateState]);

  // Update profile function with optimistic updates
  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<Profile> => {
    if (!state.user) {
      const error = 'No user logged in';
      updateState({ error });
      throw new AuthHookError(error);
    }

    if (!state.profile) {
      const error = 'No profile found to update';
      updateState({ error });
      throw new AuthHookError(error);
    }

    // Optimistic update
    const optimisticProfile = { 
      ...state.profile, 
      ...updates,
      updated_at: new Date().toISOString()
    };
    updateState({ profile: optimisticProfile });

    try {
      updateState({ error: null });
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user.id)
        .select()
        .single();

      if (error) {
        // Revert optimistic update on error
        updateState({ profile: state.profile });
        throw new AuthHookError(`Profile update failed: ${error.message}`, error.code);
      }
      
      updateState({ profile: data });
      return data;
    } catch (error) {
      // Revert optimistic update on any error
      updateState({ profile: state.profile });
      
      const errorMessage = error instanceof AuthHookError 
        ? error.message 
        : error instanceof Error 
        ? `Failed to update profile: ${error.message}` 
        : 'Failed to update profile';
      
      console.error('Error updating profile:', error);
      updateState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  }, [state.user, state.profile, updateState]);

  return {
    ...state,
    signOut,
    updateProfile,
    refreshProfile,
    clearError,
    retry,
  };
}