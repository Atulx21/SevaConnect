import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useJobs } from '@/hooks/useJobs';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { JOB_CATEGORIES } from '@/utils/constants';

export default function JobsScreen() {
  const { profile } = useAuth();
  const { jobs, loading, error, refreshJobs } = useJobs();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = ['Farming', 'Construction', 'Cleaning', 'Delivery', 'Cooking', 'Other'];

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery, selectedCategory]);

  const filterJobs = () => {
    let filtered = jobs;

    if (searchQuery) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(job => job.category === selectedCategory);
    }

    setFilteredJobs(filtered);
  };

  const onRefresh = () => {
    refreshJobs();
  };

  if (loading) {
    return <LoadingSpinner message="Loading available jobs..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Unable to Load Jobs"
        message={error}
        onRetry={refreshJobs}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Available Jobs
        </Text>
        
        <Searchbar
          placeholder="Search jobs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          <Chip
            selected={selectedCategory === ''}
            onPress={() => setSelectedCategory('')}
            style={styles.categoryChip}
          >
            All
          </Chip>
          {JOB_CATEGORIES.map(category => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={styles.categoryChip}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.jobsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {filteredJobs.map((job) => (
          <Card key={job.id} style={styles.jobCard}>
            <Card.Content>
              <View style={styles.jobHeader}>
                <Text variant="titleMedium" style={styles.jobTitle}>
                  {job.title}
                </Text>
                <Chip mode="outlined" compact>
                  {job.category}
                </Chip>
              </View>
              
              <Text variant="bodyMedium" style={styles.jobDescription}>
                {job.description.length > 100 
                  ? `${job.description.substring(0, 100)}...` 
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
                <Text style={styles.jobProvider}>
                  Posted by: {job.profiles?.full_name} ({job.profiles?.village})
                  {job.profiles?.rating > 0 && ` ⭐ ${job.profiles.rating.toFixed(1)}`}
                </Text>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => router.push(`/jobs/${job.id}`)}>
                View Details
              </Button>
            </Card.Actions>
          </Card>
        ))}
        
        {filteredJobs.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text variant="titleMedium">No jobs found</Text>
            <Text variant="bodyMedium">Try adjusting your search or filters</Text>
          </View>
        )}
      </ScrollView>
      
      {profile?.role === 'provider' && (
        <FAB
          icon={props => <MaterialIcons name="add" {...props} />}
          style={styles.fab}
          onPress={() => router.push('/jobs/post')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  searchBar: {
    marginBottom: 15,
    elevation: 2,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoryChip: {
    marginRight: 10,
  },
  jobsList: {
    flex: 1,
    padding: 15,
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
  jobProvider: {
    color: '#888',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4caf50',
  },
});