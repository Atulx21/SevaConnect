import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Text, TextInput, Button, Card, HelperText, Divider, ProgressBar } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { validateMobileNumber, sanitizeInput, validateName } from '@/utils/validation';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate 
} from 'react-native-reanimated';

type Role = 'worker' | 'provider';

interface FormErrors {
  fullName?: string;
  mobileNumber?: string;
  village?: string;
  general?: string;
}

const getRoleConfig = (role: Role) => {
  const configs = {
    worker: {
      icon: '👷‍♂️',
      title: 'Worker Profile',
      subtitle: 'Let employers know about you',
      color: '#4caf50',
      nameLabel: 'Full Name',
      namePlaceholder: 'Enter your full name',
      villageLabel: 'Your Location',
      villagePlaceholder: 'Village/Town/City',
      benefits: [
        'Build trust with employers',
        'Get matched with relevant jobs',
        'Showcase your work experience'
      ]
    },
    provider: {
      icon: '🏢',
      title: 'Employer Profile',
      subtitle: 'Help workers find you',
      color: '#2196f3',
      nameLabel: 'Business/Full Name',
      namePlaceholder: 'Your name or business name',
      villageLabel: 'Business Location',
      villagePlaceholder: 'Where is your business located?',
      benefits: [
        'Attract quality workers',
        'Build your reputation',
        'Manage your workforce easily'
      ]
    }
  };
  return configs[role];
};

export default function ProfileSetupScreen() {
  const { role } = useLocalSearchParams<{ role: Role }>();
  const { user, refreshProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    village: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Animation values
  const formAnimationValue = useSharedValue(0);
  const progressValue = useSharedValue(0);
  
  // Refs for form navigation
  const mobileRef = useRef<any>(null);
  const villageRef = useRef<any>(null);

  const roleConfig = role ? getRoleConfig(role) : null;

  // Redirect if no role or user
  useEffect(() => {
    if (!role || !user) {
      router.replace('/auth/login');
      return;
    }
  }, [role, user]);

  // Animate form entrance and calculate progress
  useFocusEffect(
    useCallback(() => {
      formAnimationValue.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      
      return () => {
        setFormData({ fullName: '', mobileNumber: '', village: '' });
        setErrors({});
        setLoading(false);
        formAnimationValue.value = 0;
        progressValue.value = 0;
      };
    }, [])
  );

  // Update progress based on form completion
  useEffect(() => {
    const { fullName, mobileNumber, village } = formData;
    let progress = 0;
    
    if (fullName.trim()) progress += 0.33;
    if (mobileNumber.trim()) progress += 0.33;
    if (village.trim()) progress += 0.34;
    
    progressValue.value = withSpring(progress, {
      damping: 15,
      stiffness: 100,
    });
  }, [formData]);

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    const { fullName, mobileNumber, village } = formData;

    // Validate full name
    if (!fullName.trim()) {
      newErrors.fullName = 'Name is required';
    } else {
      const nameValidation = validateName ? validateName(fullName.trim()) : { isValid: true };
      if (!nameValidation.isValid && nameValidation.message) {
        newErrors.fullName = nameValidation.message;
      }
    }

    // Validate mobile number
    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!validateMobileNumber(mobileNumber.trim())) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    // Validate village/location
    if (!village.trim()) {
      newErrors.village = `${roleConfig?.villageLabel || 'Location'} is required`;
    } else if (village.trim().length < 2) {
      newErrors.village = 'Please enter a valid location';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, roleConfig]);

  const handleInputChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleSetupProfile = useCallback(async () => {
    Keyboard.dismiss();
    
    if (!validateForm() || !user || !role) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { fullName, mobileNumber, village } = formData;
      
      // Clean and format data
      const cleanedData = {
        id: user.id,
        full_name: sanitizeInput(fullName.trim()),
        mobile_number: mobileNumber.trim().replace(/\s+/g, ''),
        village: sanitizeInput(village.trim()),
        role: role as 'worker' | 'provider',
        rating: 0,
        total_ratings: 0,
        profile_picture_url: null,
      };

      const { error } = await supabase
        .from('profiles')
        .insert(cleanedData);

      if (error) {
        if (error.code === '23505') {
          // Duplicate key error
          throw new Error('A profile already exists for this account');
        }
        throw error;
      }

      // Refresh the auth profile state
      await refreshProfile();

      Alert.alert(
        'Profile Created!', 
        `Welcome to KaamConnect! Your ${role} profile is now complete.`,
        [{ 
          text: 'Get Started', 
          onPress: () => router.replace('/(tabs)') 
        }]
      );

    } catch (error: any) {
      console.error('Error creating profile:', error);
      
      let errorMessage = 'Failed to create profile. Please try again.';
      
      if (error.message?.includes('already exists')) {
        errorMessage = 'A profile already exists for this account';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [formData, user, role, validateForm, refreshProfile]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(formAnimationValue.value, [0, 1], [0, 1]),
      transform: [
        {
          translateY: interpolate(formAnimationValue.value, [0, 1], [30, 0])
        }
      ]
    };
  });

  if (!roleConfig) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Invalid role selected</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" backgroundColor="#f5f5f5" />
      
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerIcon}>{roleConfig.icon}</Text>
            <Text variant="headlineMedium" style={[styles.title, { color: roleConfig.color }]}>
              {roleConfig.title}
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {roleConfig.subtitle}
            </Text>
            
            <ProgressBar 
              progress={progressValue} 
              color={roleConfig.color}
              style={styles.progressBar}
            />
          </View>

          <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
            <Card style={styles.formCard}>
              <Card.Content style={styles.formContent}>
                <View style={styles.roleDisplay}>
                  <Text variant="titleMedium" style={[styles.roleText, { color: roleConfig.color }]}>
                    Setting up your {role} profile
                  </Text>
                </View>

                <Divider style={styles.divider} />

                <TextInput
                  mode="outlined"
                  label={roleConfig.nameLabel}
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                  style={styles.input}
                  left={<TextInput.Icon icon="account" />}
                  placeholder={roleConfig.namePlaceholder}
                  error={!!errors.fullName}
                  disabled={loading}
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                  onSubmitEditing={() => mobileRef.current?.focus()}
                />
                <HelperText type="error" visible={!!errors.fullName}>
                  {errors.fullName}
                </HelperText>

                <TextInput
                  ref={mobileRef}
                  mode="outlined"
                  label="Mobile Number"
                  value={formData.mobileNumber}
                  onChangeText={(value) => handleInputChange('mobileNumber', value)}
                  style={styles.input}
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone" />}
                  placeholder="Enter your mobile number"
                  error={!!errors.mobileNumber}
                  disabled={loading}
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={() => villageRef.current?.focus()}
                />
                <HelperText type="error" visible={!!errors.mobileNumber}>
                  {errors.mobileNumber}
                </HelperText>

                <TextInput
                  ref={villageRef}
                  mode="outlined"
                  label={roleConfig.villageLabel}
                  value={formData.village}
                  onChangeText={(value) => handleInputChange('village', value)}
                  style={styles.input}
                  left={<TextInput.Icon icon="map-marker" />}
                  placeholder={roleConfig.villagePlaceholder}
                  error={!!errors.village}
                  disabled={loading}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleSetupProfile}
                />
                <HelperText type="error" visible={!!errors.village}>
                  {errors.village}
                </HelperText>

                {errors.general && (
                  <HelperText type="error" visible={true} style={styles.generalError}>
                    {errors.general}
                  </HelperText>
                )}

                <View style={styles.benefitsContainer}>
                  <Text variant="labelLarge" style={[styles.benefitsTitle, { color: roleConfig.color }]}>
                    Why complete your profile?
                  </Text>
                  {roleConfig.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Text style={[styles.benefitBullet, { color: roleConfig.color }]}>✓</Text>
                      <Text variant="bodySmall" style={styles.benefitText}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>

                <Button 
                  mode="contained" 
                  onPress={handleSetupProfile}
                  loading={loading}
                  disabled={loading}
                  style={[styles.setupButton, { backgroundColor: roleConfig.color }]}
                  contentStyle={styles.buttonContent}
                  icon="check-circle"
                >
                  Complete Profile Setup
                </Button>
              </Card.Content>
            </Card>
          </Animated.View>

          <Text variant="bodySmall" style={styles.footer}>
            Your information is secure and will only be shared with relevant employers/workers
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  progressBar: {
    width: '80%',
    height: 6,
    borderRadius: 3,
  },
  formContainer: {
    marginBottom: 20,
  },
  formCard: {
    elevation: 4,
    borderRadius: 16,
  },
  formContent: {
    paddingVertical: 24,
  },
  roleDisplay: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  roleText: {
    fontWeight: 'bold',
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
  benefitsContainer: {
    marginVertical: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  benefitsTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  benefitBullet: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 1,
  },
  benefitText: {
    flex: 1,
    color: '#555',
    lineHeight: 18,
  },
  setupButton: {
    marginTop: 8,
    borderRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    paddingHorizontal: 20,
    marginTop: 10,
  },
});