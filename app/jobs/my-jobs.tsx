import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function MyJobsScreen() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === 'provider') {
      fetchMyJobs();
    }
  }, [user, profile]);

  const fetchMyJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          applications (
            id,
            status,
            profiles:worker_id (full_name)
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching my jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in_progress':
        return '#ff9800';
      case 'cancelled':
        return '#f44336';
      default:
        return '#2196f3';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Open';
    }
  };

  const onRefresh = () => {
    fetchMyJobs();
  };

  if (!user || profile?.role !== 'provider') {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="titleMedium">Access denied</Text>
          <Text variant="bodyMedium">Only work providers can view this page</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button 
          mode="text" 
          onPress={() => router.back()}
          icon="arrow-left"
          style={styles.backButton}
        >
          Back
        </Button>
        <Text variant="headlineSmall" style={styles.title}>
          My Posted Jobs
        </Text>
      </View>

      <ScrollView 
        style={styles.jobsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {jobs.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="work-outline" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Jobs Posted Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Start by posting your first job
            </Text>
            <Button 
              mode="contained" 
              onPress={() => router.push('/jobs/post')}
              style={styles.postFirstJobButton}
            >
              Post Your First Job
            </Button>
          </View>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} style={styles.jobCard}>
              <Card.Content>
                <View style={styles.jobHeader}>
                  <Text variant="titleMedium" style={styles.jobTitle}>
                    {job.title}
                  </Text>
                  <Chip 
                    mode="outlined" 
                    textStyle={{ color: getStatusColor(job.status) }}
                    style={{ borderColor: getStatusColor(job.status) }}
                  >
                    {getStatusText(job.status)}
                  </Chip>
                </View>
                
                <Text variant="bodyMedium" style={styles.jobDescription}>
                  {job.description.length > 80 
                    ? `${job.description.substring(0, 80)}...` 
                    : job.description}
                </Text>
                
                <View style={styles.jobDetails}>
                  <Text style={styles.jobLocation}>📍 {job.location}</Text>
                  <Text style={styles.jobPay}>
                    💰 ₹{job.pay_amount} {job.pay_type === 'per_day' ? 'per day' : 'total'}
                  </Text>
                  <Text style={styles.jobWorkers}>
                    👥 {job.workers_needed} worker{job.workers_needed > 1 ? 's' : ''} needed
                  </Text>
                  <Text style={styles.jobApplications}>
                    📋 {job.applications?.length || 0} applications
                  </Text>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => router.push(`/jobs/${job.id}`)}>
                  View Details
                </Button>
                <Button onPress={() => router.push(`/jobs/${job.id}/applications`)}>
                  Applications ({job.applications?.length || 0})
                </Button>
                {job.status === 'in_progress' && (
                  <Button 
                    mode="contained"
                    onPress={() => router.push(`/jobs/${job.id}/complete`)}
                    style={styles.completeButton}
                  >
                    Complete
                  </Button>
                )}
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/jobs/post')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  jobsList: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
    padding: 40,
  },
  emptyTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: '#666',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
  },
  postFirstJobButton: {
    backgroundColor: '#4caf50',
  },
  jobCard: {
    marginBottom: 15,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    flex: 1,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginRight: 10,
  },
  jobDescription: {
    color: '#666',
    marginBottom: 12,
  },
  jobDetails: {
    gap: 4,
  },
  jobLocation: {
    color: '#666',
  },
  jobPay: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  jobWorkers: {
    color: '#666',
  },
  jobApplications: {
    color: '#888',
    fontSize: 12,
  },
  completeButton: {
    backgroundColor: '#4caf50',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4caf50',
  },
});