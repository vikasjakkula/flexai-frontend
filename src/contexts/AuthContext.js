import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setUser(null);
      } else {
        setUser(data?.user ?? null);
      }
      setLoading(false);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Email/Password sign in
  const signInWithEmail = useCallback(async (email, password) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      // Provide more user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        setError('No account found with this email. Please sign up to create an account.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please check your email and confirm your account before signing in.');
      } else {
        setError(error.message);
      }
    }
    setLoading(false);
  }, []);

  // Email/Password sign up
  const signUpWithEmail = useCallback(async (email, password) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account created successfully! Please check your email to confirm your account before signing in.');
    }
    setLoading(false);
  }, []);

  // Google OAuth sign in
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
    setLoading(false);
  }, []);

  // Password reset
  const resetPassword = useCallback(async (email) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    if (error) setError(error.message);
    setLoading(false);
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
    setLoading(false);
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      success,
      signInWithEmail, 
      signUpWithEmail, 
      signInWithGoogle, 
      resetPassword, 
      signOut,
      clearMessages
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  return { user, loading };
} 