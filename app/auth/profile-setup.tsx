import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { validateMobileNumber, sanitizeInput } from '@/utils/validation';

type Role = 'worker' | 'provider';

export default function ProfileSetupScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [village, setVillage] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate role parameter
  useEffect(() => {
    if (!role || (role !== 'worker' && role !== 'provider')) {
      Alert.alert('Error', 'Invalid role selected. Please try again.', [
        { text: 'OK', onPress: () => router.replace('/auth/role-selection') }
      ]);
    }
  }, [role]);

  // If no user, redirect to login
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user]);

  const handleSetupProfile = async () => {
    if (!fullName.trim() || !mobileNumber.trim() || !village.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateMobileNumber(mobileNumber.trim())) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    if (!role || (role !== 'worker' && role !== 'provider')) {
      Alert.alert('Error', 'Invalid role selected. Please try again.');
      return;
    }

    setLoading(true);
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        Alert.alert('Info', 'Profile already exists. Redirecting to app.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
        return;
      }

      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: sanitizeInput(fullName.trim()),
        mobile_number: mobileNumber.trim().replace(/\s+/g, ''),
        village: sanitizeInput(village.trim()),
        role: role as Role,
        rating: 0,
        total_ratings: 0,
      });

      if (error) {
        console.error('Profile creation error:', error);
        throw error;
      }

      Alert.alert('Success', 'Profile created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      console.error('Error creating profile:', error);
      
      let errorMessage = 'Failed to create profile. Please try again.';
      if (error.code === '23505') {
        errorMessage = 'A profile with this information already exists.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !role) {
    return null;
  }

  const getRoleDisplayInfo = () => {
    return role === 'worker' 
      ? { icon: '👷‍♂️', text: 'Worker' }
      : { icon: '🏢', text: 'Work Provider' };
  };

  const roleInfo = getRoleDisplayInfo();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Complete Your Profile
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Tell us a bit about yourself
        </Text>

        <Card style={styles.formCard}>
          <Card.Content>
            <View style={styles.roleDisplay}>
              <Text variant="titleMedium" style={styles.roleText}>
                {roleInfo.icon} {roleInfo.text}
              </Text>
            </View>

            <TextInput
              mode="outlined"
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              placeholder="Enter your full name"
              maxLength={100}
            />

            <TextInput
              mode="outlined"
              label="Mobile Number"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              style={styles.input}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              placeholder="Enter your 10-digit mobile number"
              maxLength={10}
            />

            <TextInput
              mode="outlined"
              label="Village/Town"
              value={village}
              onChangeText={setVillage}
              style={styles.input}
              left={<TextInput.Icon icon="map-marker" />}
              placeholder="Enter your village or town"
              maxLength={100}
            />

            <Button 
              mode="contained" 
              onPress={handleSetupProfile}
              loading={loading}
              disabled={loading}
              style={styles.setupButton}
              icon="check"
            >
              Complete Setup
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
  roleDisplay: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  roleText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 20,
  },
  setupButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 8,
  },
});