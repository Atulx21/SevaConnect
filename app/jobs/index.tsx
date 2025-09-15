import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Searchbar } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Job {
  id: string;
  title: string;
  category: string;
  location: string;
  pay_amount: number;
  pay_type: string;
  workers_needed: number;
  created_at: string;
}

export default function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { profile } = useAuth();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    <Card style={styles.jobCard} onPress={() => router.push(`/jobs/${item.id}`)}>
      <Card.Content>
        <View style={styles.jobHeader}>
          <Text variant="titleLarge" style={styles.jobTitle}>
            {item.title}
          </Text>
          <Chip mode="outlined">{item.category}</Chip>
        </View>
        
        <View style={styles.jobDetails}>
          <Text variant="bodyMedium">📍 {item.location}</Text>
          <Text variant="bodyMedium" style={styles.payText}>
            ₹{item.pay_amount} {item.pay_type === 'per_day' ? 'per day' : 'total'}
          </Text>
        </View>
        
        <View style={styles.jobFooter}>
          <Text variant="bodySmall" style={styles.workersNeeded}>
            {item.workers_needed} worker{item.workers_needed > 1 ? 's' : ''} needed
          </Text>
          <Text variant="bodySmall" style={styles.date}>
            Posted: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Available Jobs</Text>
        {profile?.role === 'provider' && (
          <Button 
            mode="contained" 
            onPress={() => router.push('/jobs/post')}
            icon="plus"
            style={styles.postButton}
          >
            Post Job
          </Button>
        )}
      </View>

      <Searchbar
        placeholder="Search jobs..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={jobs.filter(job => 
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.location.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        renderItem={renderJobCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchJobs} />
        }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: 'white',
  },
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  postButton: {
    backgroundColor: '#4caf50',
  },
  searchbar: {
    margin: 15,
    elevation: 2,
  },
  listContainer: {
    padding: 15,
  },
  jobCard: {
    marginBottom: 15,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  jobTitle: {
    flex: 1,
    marginRight: 10,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  payText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workersNeeded: {
    color: '#666',
  },
  date: {
    color: '#666',
  },
});