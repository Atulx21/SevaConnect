import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Text, TextInput, Button, Card, HelperText, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePassword } from '@/utils/validation';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  
  const { user, loading: authLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/(tabs)');
    }
  }, [user, authLoading]);

  // Clear errors when switching between login/signup
  useEffect(() => {
    setErrors({});
  }, [isSignUp]);

  // Clear form when screen gains focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        setEmail('');
        setPassword('');
        setErrors({});
        setLoading(false);
      };
    }, [])
  );

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleAuth = useCallback(async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const trimmedEmail = email.trim().toLowerCase();

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: undefined, // Disable email confirmation for now
          }
        });

        if (error) throw error;

        if (data.user) {
          Alert.alert(
            'Account Created!', 
            'Please select your role to continue.', 
            [{ text: 'OK', onPress: () => router.replace('/auth/role-selection') }]
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) throw error;

        // Check if user has completed profile setup
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // Error other than "no rows returned"
          console.error('Profile check error:', profileError);
        }

        if (!profile) {
          // No profile found, redirect to role selection
          router.replace('/auth/role-selection');
        } else {
          // Profile exists, go to main app
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (error.message?.includes('Unable to validate email address')) {
        errorMessage = 'Please enter a valid email address';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [email, password, isSignUp, validateForm]);

  const toggleAuthMode = useCallback(() => {
    setIsSignUp(!isSignUp);
    setErrors({});
  }, [isSignUp]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar style="dark" backgroundColor="#f5f5f5" />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>
              Gramin KaamConnect
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Connect with local work opportunities in your village
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Card.Content style={styles.formContent}>
              <Text variant="titleLarge" style={styles.formTitle}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              
              <Text variant="bodyMedium" style={styles.formSubtitle}>
                {isSignUp 
                  ? 'Join our community of workers and employers'
                  : 'Sign in to your account'
                }
              </Text>

              <Divider style={styles.divider} />

              <TextInput
                mode="outlined"
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                left={<TextInput.Icon icon="email" />}
                error={!!errors.email}
                disabled={loading}
                onSubmitEditing={() => {
                  // Focus password field if email is valid
                }}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>

              <TextInput
                mode="outlined"
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry={!showPassword}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                error={!!errors.password}
                disabled={loading}
                onSubmitEditing={handleAuth}
              />
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>

              {errors.general && (
                <HelperText type="error" visible={true} style={styles.generalError}>
                  {errors.general}
                </HelperText>
              )}

              <Button 
                mode="contained" 
                onPress={handleAuth}
                loading={loading}
                disabled={loading}
                style={styles.authButton}
                contentStyle={styles.buttonContent}
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>

              <Button 
                mode="text" 
                onPress={toggleAuthMode}
                disabled={loading}
                style={styles.switchButton}
              >
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"
                }
              </Button>
            </Card.Content>
          </Card>

          <Text variant="bodySmall" style={styles.footer}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 20,
  },
  formCard: {
    elevation: 4,
    marginBottom: 20,
  },
  formContent: {
    paddingVertical: 24,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  formSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  divider: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 4,
  },
  generalError: {
    marginBottom: 16,
  },
  authButton: {
    backgroundColor: '#4caf50',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  switchButton: {
    marginTop: 8,
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    paddingHorizontal: 20,
  },
});