import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, FAB, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useJobs } from '@/hooks/useJobs';

export default function HomeScreen() {
  const theme = useTheme();
  const { user, profile } = useAuth();
  const { jobs } = useJobs();
  
  const recentJobs = jobs.slice(0, 3);

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Gramin KaamConnect
          </Text>
        </View>
        <View style={styles.content}>
          <Text variant="headlineLarge" style={styles.welcomeTitle}>
            Welcome!
          </Text>
          <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
            Connect with local work opportunities in your village
          </Text>
          <Button 
            mode="contained" 
            onPress={() => router.push('/auth/login')}
            style={styles.loginButton}
          >
            Get Started
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.loggedInHeader}>
          <Text variant="headlineSmall" style={styles.greeting}>
            Namaste, {profile?.full_name || 'User'}!
          </Text>
          <Text variant="bodyMedium" style={styles.location}>
            📍 {profile?.village}
          </Text>
        </View>

        {profile?.role === 'provider' ? (
          <View style={styles.providerSection}>
            <Card style={styles.actionCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Need to hire workers?
                </Text>
                <Text variant="bodyMedium" style={styles.cardSubtitle}>
                  Post a job and connect with skilled workers in your area
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="contained" 
                  onPress={() => router.push('/jobs/post')}
                  style={styles.primaryButton}
                >
                  Post a New Job
                </Button>
              </Card.Actions>
            </Card>
          </View>
        ) : (
          <View style={styles.workerSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Recent Job Opportunities
            </Text>
            {recentJobs.map((job) => (
              <Card key={job.id} style={styles.jobCard}>
                <Card.Content>
                  <Text variant="titleMedium">{job.title}</Text>
                  <Text variant="bodyMedium" style={styles.jobLocation}>
                    📍 {job.location}
                  </Text>
                  <Text variant="bodyMedium" style={styles.jobPay}>
                    💰 ₹{job.pay_amount} {job.pay_type === 'per_day' ? 'per day' : 'total'}
                  </Text>
                </Card.Content>
                <Card.Actions>
                  <Button onPress={() => router.push(`/jobs/${job.id}`)}>
                    View Details
                  </Button>
                </Card.Actions>
              </Card>
            ))}
            <Button 
              mode="outlined" 
              onPress={() => router.push('/jobs')}
              style={styles.viewAllButton}
            >
              View All Jobs
            </Button>
          </View>
        )}
      </ScrollView>
      
      {profile?.role === 'provider' && (
        <FAB
          icon="plus"
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#2e7d32',
  },
  welcomeSubtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  loginButton: {
    minWidth: 200,
    backgroundColor: '#4caf50',
  },
  loggedInHeader: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  location: {
    color: '#666',
    marginTop: 4,
  },
  providerSection: {
    padding: 20,
  },
  workerSection: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 15,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  actionCard: {
    marginBottom: 20,
  },
  cardTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: '#666',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#4caf50',
  },
  jobCard: {
    marginBottom: 15,
  },
  jobLocation: {
    color: '#666',
    marginTop: 4,
  },
  jobPay: {
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  viewAllButton: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4caf50',
  },
});