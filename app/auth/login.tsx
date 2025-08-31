import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { validateEmail, validatePassword } from '@/utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert('Error', passwordValidation.message);
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.user && !data.session) {
          Alert.alert('Success', 'Please check your email to verify your account before proceeding.');
          return;
        }

        if (data.user) {
          Alert.alert('Success', 'Account created! Please select your role.', [
            { text: 'OK', onPress: () => router.replace('/auth/role-selection') }
          ]);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error('Login failed. Please try again.');
        }

        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
          throw new Error('Error checking profile. Please try again.');
        }

        if (!profile) {
          router.replace('/auth/role-selection');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Gramin KaamConnect
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Connect with local work opportunities
        </Text>

        <Card style={styles.formCard}>
          <Card.Content>
            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              autoComplete={isSignUp ? "new-password" : "password"}
              left={<TextInput.Icon icon="lock" />}
            />

            <Button 
              mode="contained" 
              onPress={handleAuth}
              loading={loading}
              disabled={loading}
              style={styles.authButton}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <Button 
              mode="text" 
              onPress={() => setIsSignUp(!isSignUp)}
              style={styles.switchButton}
              disabled={loading}
            >
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"
              }
            </Button>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  formCard: {
    elevation: 4,
  },
  input: {
    marginBottom: 20,
  },
  authButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    marginBottom: 15,
  },
  switchButton: {
    marginTop: 10,
  },
});