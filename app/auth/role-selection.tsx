import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function RoleSelectionScreen() {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'worker' | 'provider' | null>(null);

  const handleRoleSelect = (role: 'worker' | 'provider') => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      router.push({
        pathname: '/auth/profile-setup',
        params: { role: selectedRole }
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          What brings you here?
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Choose your primary role to get started
        </Text>

        <View style={styles.roleCards}>
          <Card 
            style={[
              styles.roleCard, 
              selectedRole === 'worker' && styles.selectedCard
            ]}
            onPress={() => handleRoleSelect('worker')}
          >
            <Card.Content style={styles.roleContent}>
              <Text style={styles.roleIcon}>👷‍♂️</Text>
              <Text variant="titleLarge" style={styles.roleTitle}>
                I need work
              </Text>
              <Text variant="bodyMedium" style={styles.roleDescription}>
                Find daily wage jobs in your village
              </Text>
            </Card.Content>
          </Card>

          <Card 
            style={[
              styles.roleCard, 
              selectedRole === 'provider' && styles.selectedCard
            ]}
            onPress={() => handleRoleSelect('provider')}
          >
            <Card.Content style={styles.roleContent}>
              <Text style={styles.roleIcon}>🏢</Text>
              <Text variant="titleLarge" style={styles.roleTitle}>
                I need to hire
              </Text>
              <Text variant="bodyMedium" style={styles.roleDescription}>
                Post jobs and hire local workers
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Button 
          mode="contained" 
          onPress={handleContinue}
          disabled={!selectedRole}
          style={[
            styles.continueButton,
            !selectedRole && styles.disabledButton
          ]}
        >
          Continue
        </Button>
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
  roleCards: {
    gap: 20,
    marginBottom: 40,
  },
  roleCard: {
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
  },
  roleContent: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  roleTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleDescription: {
    color: '#666',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});