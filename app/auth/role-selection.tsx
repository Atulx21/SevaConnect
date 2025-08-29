import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Text, Button, Card, Divider, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type Role = 'worker' | 'provider';

interface RoleOption {
  key: Role;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  benefits: string[];
}

const roleOptions: RoleOption[] = [
  {
    key: 'worker',
    title: 'I need work',
    subtitle: 'Looking for opportunities',
    description: 'Find daily wage jobs and connect with local employers in your village',
    icon: '👷‍♂️',
    color: '#4caf50',
    benefits: [
      'Browse available jobs nearby',
      'Apply directly to employers',
      'Build your work profile',
      'Get paid securely'
    ]
  },
  {
    key: 'provider',
    title: 'I need to hire',
    subtitle: 'Looking for workers',
    description: 'Post jobs and find reliable local workers for your projects',
    icon: '🏢',
    color: '#2196f3',
    benefits: [
      'Post job requirements',
      'Find skilled workers',
      'Manage applications',
      'Rate and review workers'
    ]
  }
];

export default function RoleSelectionScreen() {
  const { user, loading: authLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const cardAnimationValue = useSharedValue(0);
  const buttonAnimationValue = useSharedValue(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading]);

  // Reset selection when screen gains focus
  useFocusEffect(
    useCallback(() => {
      setSelectedRole(null);
      cardAnimationValue.value = 0;
      buttonAnimationValue.value = 0;
      
      // Animate cards entrance
      cardAnimationValue.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      
      return () => {
        setSelectedRole(null);
        setIsLoading(false);
      };
    }, [])
  );

  // Animate button when role is selected
  useEffect(() => {
    if (selectedRole) {
      buttonAnimationValue.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    } else {
      buttonAnimationValue.value = withTiming(0, { duration: 200 });
    }
  }, [selectedRole]);

  const handleRoleSelect = useCallback((role: Role) => {
    setSelectedRole(prevRole => prevRole === role ? null : role);
  }, []);

  const handleContinue = useCallback(async () => {
    if (!selectedRole) return;
    
    setIsLoading(true);
    
    try {
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      router.push({
        pathname: '/auth/profile-setup',
        params: { role: selectedRole }
      });
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(cardAnimationValue.value, [0, 1], [0, 1]),
      transform: [
        {
          translateY: interpolate(cardAnimationValue.value, [0, 1], [50, 0])
        },
        {
          scale: interpolate(cardAnimationValue.value, [0, 1], [0.9, 1])
        }
      ]
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonAnimationValue.value,
      transform: [
        {
          translateY: interpolate(buttonAnimationValue.value, [0, 1], [20, 0])
        },
        {
          scale: interpolate(buttonAnimationValue.value, [0, 1], [0.9, 1])
        }
      ]
    };
  });

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          What brings you here?
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Choose your primary role to get started with KaamConnect
        </Text>
      </View>

      <Animated.View style={[styles.roleCards, cardAnimatedStyle]}>
        {roleOptions.map((option, index) => (
          <Pressable
            key={option.key}
            onPress={() => handleRoleSelect(option.key)}
            style={({ pressed }) => [
              { opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Card 
              style={[
                styles.roleCard,
                selectedRole === option.key && [
                  styles.selectedCard,
                  { borderColor: option.color }
                ]
              ]}
            >
              <Card.Content style={styles.roleContent}>
                <View style={styles.roleHeader}>
                  <Text style={styles.roleIcon}>{option.icon}</Text>
                  <View style={styles.roleTitleContainer}>
                    <Text variant="titleLarge" style={[
                      styles.roleTitle,
                      { color: option.color }
                    ]}>
                      {option.title}
                    </Text>
                    <Text variant="bodyMedium" style={styles.roleSubtitle}>
                      {option.subtitle}
                    </Text>
                  </View>
                  {selectedRole === option.key && (
                    <IconButton 
                      icon="check-circle" 
                      iconColor={option.color}
                      size={24}
                    />
                  )}
                </View>

                <Text variant="bodyMedium" style={styles.roleDescription}>
                  {option.description}
                </Text>

                <Divider style={styles.benefitsDivider} />

                <Text variant="labelLarge" style={styles.benefitsTitle}>
                  What you can do:
                </Text>
                
                <View style={styles.benefitsList}>
                  {option.benefits.map((benefit, benefitIndex) => (
                    <View key={benefitIndex} style={styles.benefitItem}>
                      <Text style={[styles.benefitBullet, { color: option.color }]}>
                        •
                      </Text>
                      <Text variant="bodySmall" style={styles.benefitText}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          </Pressable>
        ))}
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
        <Button 
          mode="contained" 
          onPress={handleContinue}
          loading={isLoading}
          disabled={!selectedRole || isLoading}
          style={[
            styles.continueButton,
            selectedRole && { 
              backgroundColor: roleOptions.find(r => r.key === selectedRole)?.color 
            }
          ]}
          contentStyle={styles.buttonContent}
          icon="arrow-right"
        >
          Continue Setup
        </Button>

        {selectedRole && (
          <Text variant="bodySmall" style={styles.changeRoleHint}>
            You can change your role later in settings
          </Text>
        )}
      </Animated.View>
    </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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
    paddingHorizontal: 10,
  },
  roleCards: {
    gap: 20,
    marginBottom: 30,
  },
  roleCard: {
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  selectedCard: {
    elevation: 8,
    borderWidth: 2,
    backgroundColor: '#fafafa',
  },
  roleContent: {
    paddingVertical: 24,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  roleIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  roleTitleContainer: {
    flex: 1,
  },
  roleTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleSubtitle: {
    color: '#666',
  },
  roleDescription: {
    color: '#444',
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitsDivider: {
    marginBottom: 16,
  },
  benefitsTitle: {
    color: '#2e7d32',
    marginBottom: 12,
    fontWeight: '600',
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitBullet: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    color: '#555',
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  changeRoleHint: {
    marginTop: 12,
    color: '#999',
    textAlign: 'center',
  },
});