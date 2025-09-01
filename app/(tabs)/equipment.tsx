import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useEquipment } from '@/hooks/useEquipment';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function EquipmentScreen() {
  const { user, profile } = useAuth();
  const { equipment, loading, error, refreshEquipment } = useEquipment();
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const equipmentTypes = ['Tractor', 'Water Pump', 'Thresher', 'Harvester', 'Plough', 'Other'];

  useEffect(() => {
    filterEquipment();
  }, [equipment, searchQuery, selectedType]);

  const filterEquipment = () => {
    let filtered = equipment;

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(item => item.equipment_type === selectedType);
    }

    setFilteredEquipment(filtered);
  };

  const onRefresh = () => {
    refreshEquipment();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialIcons name="build" size={64} color="#ccc" />
          <Text variant="titleMedium">Please log in to rent equipment</Text>
          <Button mode="contained" onPress={() => router.push('/auth/login')}>
            Login
          </Button>
        </View>
      </View>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading available equipment..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Unable to Load Equipment"
        message={error}
        onRetry={refreshEquipment}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Rent Equipment
        </Text>
        
        <Searchbar
          placeholder="Search equipment..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.typesContainer}
          contentContainerStyle={styles.typesContentContainer}
        >
          <Chip
            selected={selectedType === ''}
            onPress={() => setSelectedType('')}
            style={styles.typeChip}
            selectedColor="#2e7d32"
          >
            All
          </Chip>
          {equipmentTypes.map(type => (
            <Chip
              key={type}
              selected={selectedType === type}
              onPress={() => setSelectedType(type)}
              style={styles.typeChip}
              selectedColor="#2e7d32"
            >
              {type}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.equipmentList}
        contentContainerStyle={styles.equipmentListContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {filteredEquipment.map((item) => (
          <Card key={item.id} style={styles.equipmentCard} mode="elevated">
            <Card.Content>
              <View style={styles.equipmentHeader}>
                <Text variant="titleMedium" style={styles.equipmentName}>
                  {item.name}
                </Text>
                <Chip mode="outlined" compact selectedColor="#2e7d32">
                  {item.equipment_type}
                </Chip>
              </View>
              
              <Text variant="bodyMedium" style={styles.equipmentDescription}>
                {item.description.length > 100 
                  ? `${item.description.substring(0, 100)}...` 
                  : item.description}
              </Text>
              
              <View style={styles.equipmentDetails}>
                <Text style={styles.equipmentLocation}>📍 {item.location}</Text>
                <Text style={styles.equipmentPrice}>
                  💰 ₹{item.rental_price} {item.price_type === 'per_hour' ? 'per hour' : 'per day'}
                </Text>
                <Text style={styles.equipmentAvailability}>
                  📅 Available: {new Date(item.availability_start).toLocaleDateString()} - {new Date(item.availability_end).toLocaleDateString()}
                </Text>
                <Text style={styles.equipmentOwner}>
                  Owner: {item.profiles?.full_name} ({item.profiles?.village})
                  {item.profiles?.rating > 0 && ` ⭐ ${item.profiles.rating.toFixed(1)}`}
                </Text>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button 
                onPress={() => router.push(`/equipment/${item.id}`)}
                icon={props => <MaterialIcons name="info" {...props} />}
              >
                Details
              </Button>
              <Button 
                mode="contained" 
                onPress={() => router.push(`/equipment/${item.id}/book`)}
                style={styles.bookButton}
                icon={props => <MaterialIcons name="date-range" {...props} />}
              >
                Book Now
              </Button>
            </Card.Actions>
          </Card>
        ))}
        
        {filteredEquipment.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <MaterialIcons name="build" size={64} color="#ccc" />
            <Text variant="titleMedium">No equipment found</Text>
            <Text variant="bodyMedium">Try adjusting your search or filters</Text>
          </View>
        )}
      </ScrollView>
      
      <FAB
        icon={props => <MaterialIcons name="add" {...props} />}
        style={styles.fab}
        onPress={() => router.push('/equipment/add')}
      />
      
      <Button 
        mode="outlined" 
        onPress={() => router.push('/equipment/my-equipment')}
        style={styles.actionButton}
        icon={props => <MaterialIcons name="build" {...props} />}
      >
        My Equipment
      </Button>
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
    elevation: 2,
  },
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  searchBar: {
    marginBottom: 15,
    elevation: 2,
    backgroundColor: '#fff',
  },
  typesContainer: {
    marginBottom: 10,
  },
  typesContentContainer: {
    paddingRight: 10,
  },
  typeChip: {
    marginRight: 10,
  },
  equipmentList: {
    flex: 1,
  },
  equipmentListContent: {
    padding: 15,
    paddingBottom: 80, // Add extra padding at bottom for FAB
  },
  equipmentCard: {
    marginBottom: 15,
    elevation: 3,
    borderRadius: 8,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipmentName: {
    flex: 1,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginRight: 10,
  },
  equipmentDescription: {
    color: '#666',
    marginBottom: 12,
  },
  equipmentDetails: {
    gap: 4,
  },
  equipmentLocation: {
    color: '#666',
  },
  equipmentPrice: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  equipmentAvailability: {
    color: '#666',
  },
  equipmentOwner: {
    color: '#888',
    fontSize: 12,
  },
  bookButton: {
    backgroundColor: '#4caf50',
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
  actionButton: {
    position: 'absolute',
    margin: 16,
    left: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderColor: '#4caf50',
  },
});