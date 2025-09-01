import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, StatusBar } from 'react-native';
import { Text, Card, Button, Divider, Avatar, Surface } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    jobsPosted: 0,
    jobsCompleted: 0,
    applicationsSubmitted: 0,
    jobsHired: 0,
  });

  useEffect(() => {
    if (user && profile) {
      fetchUserStats();
    }
  }, [user, profile]);

  const fetchUserStats = async () => {
    try {
      if (profile?.role === 'provider') {
        // Fetch stats for work provider
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('id, status')
          .eq('provider_id', user.id);

        if (jobsError) throw jobsError;

        const jobsPosted = jobsData.length;
        const jobsCompleted = jobsData.filter(job => job.status === 'completed').length;

        setStats(prev => ({ ...prev, jobsPosted, jobsCompleted }));
      } else {
        // Fetch stats for worker
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('applications')
          .select('id, status')
          .eq('worker_id', user.id);

        if (applicationsError) throw applicationsError;

        const applicationsSubmitted = applicationsData.length;
        const jobsHired = applicationsData.filter(app => app.status === 'hired').length;

        setStats(prev => ({ ...prev, applicationsSubmitted, jobsHired }));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialIcons name="account-circle" size={80} color="#6200ee" />
          <Text variant="titleLarge" style={styles.emptyStateText}>Please log in to view your profile</Text>
          <Button 
            mode="contained" 
            onPress={() => router.push('/auth/login')}
            style={styles.loginButton}
            buttonColor="#6200ee"
          >
            Login
          </Button>
        </View>
      </View>
    );
  }

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<MaterialIcons key={i} name="star" size={20} color="#FFD700" />);
    }
    
    if (hasHalfStar) {
      stars.push(<MaterialIcons key="half" name="star-half" size={20} color="#FFD700" />);
    }
    
    for (let i = stars.length; i < 5; i++) {
      stars.push(<MaterialIcons key={`empty-${i}`} name="star-border" size={20} color="#FFD700" />);
    }
    
    return stars;
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#6200ee" barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Surface style={styles.headerSurface}>
          <LinearGradient
            colors={['#6200ee', '#9c64a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={100} 
                label={profile.full_name.charAt(0).toUpperCase()}
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
              <Text variant="headlineMedium" style={styles.name}>
                {profile.full_name}
              </Text>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={18} color="#fff" />
                <Text variant="bodyLarge" style={styles.village}>
                  {profile.village}
                </Text>
              </View>
              <View style={styles.roleContainer}>
                <MaterialIcons 
                  name={profile.role === 'worker' ? 'build' : 'business'} 
                  size={18} 
                  color="#fff" 
                />
                <Text variant="bodyMedium" style={styles.role}>
                  {profile.role === 'worker' ? 'Worker' : 'Work Provider'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Surface>

        {/* Rating Card */}
        <Card style={styles.ratingCard} mode="elevated">
          <Card.Content style={styles.ratingContent}>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(profile.rating)}
              </View>
              <Text style={styles.ratingText}>
                {profile.rating.toFixed(1)} ({profile.total_ratings} reviews)
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Statistics */}
        <Card style={styles.statsCard} mode="elevated">
          <Card.Content>
            <View style={styles.cardTitleContainer}>
              <MaterialIcons name="insert-chart" size={24} color="#6200ee" />
              <Text variant="titleMedium" style={styles.statsTitle}>
                Statistics
              </Text>
            </View>
            <Divider style={styles.divider} />
            
            {profile.role === 'provider' ? (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Surface style={styles.statSurface}>
                    <Text variant="headlineMedium" style={styles.statNumber}>
                      {stats.jobsPosted}
                    </Text>
                  </Surface>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Jobs Posted
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Surface style={styles.statSurface}>
                    <Text variant="headlineMedium" style={styles.statNumber}>
                      {stats.jobsCompleted}
                    </Text>
                  </Surface>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Jobs Completed
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Surface style={styles.statSurface}>
                    <Text variant="headlineMedium" style={styles.statNumber}>
                      {stats.applicationsSubmitted}
                    </Text>
                  </Surface>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Applications
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Surface style={styles.statSurface}>
                    <Text variant="headlineMedium" style={styles.statNumber}>
                      {stats.jobsHired}
                    </Text>
                  </Surface>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Jobs Hired
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.actionsCard} mode="elevated">
          <Card.Content>
            <View style={styles.cardTitleContainer}>
              <MaterialIcons name="touch-app" size={24} color="#6200ee" />
              <Text variant="titleMedium" style={styles.actionsTitle}>
                Actions
              </Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.buttonGrid}>
              <Button 
                mode="contained-tonal" 
                onPress={() => router.push('/profile/edit')}
                style={styles.actionButton}
                icon="account-edit"
                contentStyle={styles.buttonContent}
              >
                Edit Profile
              </Button>
              
              <Button 
                mode="contained-tonal" 
                onPress={() => router.push('/profile/ratings')}
                style={styles.actionButton}
                icon={props => <MaterialIcons name="star" size={props.size} color={props.color} />}
                contentStyle={styles.buttonContent}
              >
                View Ratings
              </Button>
              
              {profile?.role === 'worker' && (
                <Button 
                  mode="contained-tonal" 
                  onPress={() => router.push('/skills/manage')}
                  style={styles.actionButton}
                  icon={props => <MaterialIcons name="build" size={props.size} color={props.color} />}
                  contentStyle={styles.buttonContent}
                >
                  Manage Skills
                </Button>
              )}
              
              {profile?.role === 'provider' && (
                <Button 
                  mode="contained-tonal" 
                  onPress={() => router.push('/skills/browse')}
                  style={styles.actionButton}
                  icon={props => <MaterialIcons name="search" size={props.size} color={props.color} />}
                  contentStyle={styles.buttonContent}
                >
                  Browse Workers
                </Button>
              )}
              
              {profile?.role === 'provider' && (
                <Button 
                  mode="contained-tonal" 
                  onPress={() => router.push('/jobs/my-jobs')}
                  style={styles.actionButton}
                  icon={props => <MaterialIcons name="work" size={props.size} color={props.color} />}
                  contentStyle={styles.buttonContent}
                >
                  My Jobs
                </Button>
              )}
              
              {profile?.role === 'provider' && (
                <Button 
                  mode="contained-tonal" 
                  onPress={() => router.push('/stats')}
                  style={styles.actionButton}
                  icon={props => <MaterialIcons name="bar-chart" size={props.size} color={props.color} />}
                  contentStyle={styles.buttonContent}
                >
                  Statistics
                </Button>
              )}
              
              <Button 
                mode="contained-tonal" 
                onPress={() => router.push('/equipment/my-equipment')}
                style={styles.actionButton}
                icon={props => <MaterialIcons name="build" size={props.size} color={props.color} />}
                contentStyle={styles.buttonContent}
              >
                My Equipment
              </Button>
            </View>
            
            <Button 
              mode="contained" 
              onPress={handleSignOut}
              style={styles.logoutButton}
              buttonColor="#f44336"
              icon={props => <MaterialIcons name="logout" size={props.size} color="white" />}
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>
        
        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerSurface: {
    elevation: 4,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarLabel: {
    fontSize: 40,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  village: {
    color: '#fff',
    marginLeft: 5,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  role: {
    color: '#fff',
    marginLeft: 5,
  },
  ratingCard: {
    margin: 16,
    marginTop: -20,
    borderRadius: 12,
    elevation: 4,
  },
  ratingContent: {
    paddingVertical: 12,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  ratingText: {
    color: '#666',
    fontWeight: '500',
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statsTitle: {
    color: '#6200ee',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  divider: {
    marginVertical: 12,
    height: 1.5,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    width: '45%',
  },
  statSurface: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(98, 0, 238, 0.08)',
    width: '100%',
    marginBottom: 8,
  },
  statNumber: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  actionsTitle: {
    color: '#6200ee',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
    width: '48%',
    borderRadius: 8,
  },
  buttonContent: {
    height: 44,
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#555',
  },
  loginButton: {
    width: 200,
    borderRadius: 8,
  },
  footer: {
    height: 20,
  },
});