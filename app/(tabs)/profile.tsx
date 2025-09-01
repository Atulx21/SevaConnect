import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, Button, Divider, Avatar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

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
          <Text variant="titleMedium">Please log in to view your profile</Text>
          <Button mode="contained" onPress={() => router.push('/auth/login')}>
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
      stars.push(<MaterialIcons key={i} name="star" size={20} color="#ffc107" />);
    }
    
    if (hasHalfStar) {
      stars.push(<MaterialIcons key="half" name="star-half" size={20} color="#ffc107" />);
    }
    
    for (let i = stars.length; i < 5; i++) {
      stars.push(<MaterialIcons key={i} name="star-border" size={20} color="#ffc107" />);
    }
    
    return stars;
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={profile.full_name.charAt(0).toUpperCase()}
              style={styles.avatar}
            />
            <Text variant="headlineSmall" style={styles.name}>
              {profile.full_name}
            </Text>
            <Text variant="bodyLarge" style={styles.village}>
              📍 {profile.village}
            </Text>
            <Text variant="bodyMedium" style={styles.role}>
              {profile.role === 'worker' ? '👷‍♂️ Worker' : '🏢 Work Provider'}
            </Text>
            
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
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.statsTitle}>
              Statistics
            </Text>
            <Divider style={styles.divider} />
            
            {profile.role === 'provider' ? (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text variant="headlineSmall" style={styles.statNumber}>
                    {stats.jobsPosted}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Jobs Posted
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineSmall" style={styles.statNumber}>
                    {stats.jobsCompleted}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Jobs Completed
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text variant="headlineSmall" style={styles.statNumber}>
                    {stats.applicationsSubmitted}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Applications
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineSmall" style={styles.statNumber}>
                    {stats.jobsHired}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Jobs Hired
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.actionsTitle}>
              Actions
            </Text>
            <Divider style={styles.divider} />
            
            <Button 
              mode="outlined" 
              onPress={() => router.push('/profile/edit')}
              style={styles.actionButton}
              icon="account-edit"
            >
              Edit Profile
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={() => router.push('/profile/ratings')}
              style={styles.actionButton}
              icon={props => <MaterialIcons name="star" {...props} />}
            >
              View All Ratings
            </Button>
            
            {profile?.role === 'worker' && (
              <Button 
                mode="outlined" 
                onPress={() => router.push('/skills/manage')}
                style={styles.actionButton}
                icon={props => <MaterialIcons name="build" {...props} />}
              >
                Manage My Skills
              </Button>
            )}
            
            {profile?.role === 'provider' && (
              <Button 
                mode="outlined" 
                onPress={() => router.push('/skills/browse')}
                style={styles.actionButton}
                icon={props => <MaterialIcons name="search" {...props} />}
              >
                Browse Skilled Workers
              </Button>
            )}
            
            {profile?.role === 'provider' && (
              <Button 
                mode="outlined" 
                onPress={() => router.push('/jobs/my-jobs')}
                style={styles.actionButton}
                icon={props => <MaterialIcons name="work" {...props} />}
              >
                My Posted Jobs
              </Button>
            )}
            
            {profile?.role === 'provider' && (
              <Button 
                mode="outlined" 
                onPress={() => router.push('/stats')}
                style={styles.actionButton}
                icon={props => <MaterialIcons name="bar-chart" {...props} />}
              >
                Platform Statistics
              </Button>
            )}
            
            <Button 
              mode="outlined" 
              onPress={() => router.push('/equipment/my-equipment')}
              style={styles.actionButton}
              icon={props => <MaterialIcons name="build" {...props} />}
            >
              My Equipment
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={handleSignOut}
              style={[styles.actionButton, styles.logoutButton]}
              icon={props => <MaterialIcons name="logout" {...props} />}
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    margin: 15,
    marginTop: 60,
    elevation: 2,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    backgroundColor: '#4caf50',
    marginBottom: 15,
  },
  name: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  village: {
    color: '#666',
    marginBottom: 5,
  },
  role: {
    color: '#666',
    marginBottom: 15,
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
  },
  statsCard: {
    margin: 15,
    elevation: 2,
  },
  statsTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  actionsCard: {
    margin: 15,
    elevation: 2,
  },
  actionsTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  actionButton: {
    marginBottom: 10,
  },
  signOutButton: {
    borderColor: '#f44336',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
});