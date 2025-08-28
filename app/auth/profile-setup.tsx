import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { validateMobileNumber, sanitizeInput } from '@/utils/validation';

export default function ProfileSetupScreen() {
  const { role } = useLocalSearchParams();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [village, setVillage] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: sanitizeInput(fullName),
        mobile_number: mobileNumber.trim().replace(/\s+/g, ''),
        village: sanitizeInput(village),
        role: role as 'worker' | 'provider',
      });

      if (error) throw error;

      Alert.alert('Success', 'Profile created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                {role === 'worker' ? '👷‍♂️ Worker' : '🏢 Work Provider'}
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
            />

            <TextInput
              mode="outlined"
              label="Mobile Number"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              style={styles.input}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              placeholder="Enter your mobile number"
            />

            <TextInput
              mode="outlined"
              label="Village/Town"
              value={village}
              onChangeText={setVillage}
              style={styles.input}
              left={<TextInput.Icon icon="map-marker" />}
              placeholder="Enter your village or town"
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