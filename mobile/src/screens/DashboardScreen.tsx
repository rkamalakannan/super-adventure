import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { routesApi, type Route } from '../api/client';

const AUSTRIAN_CITIES = [
  'Vienna',
  'Salzburg',
  'Innsbruck',
  'Graz',
  'Linz',
  'Klagenfurt',
  'Bregenz',
  'St. Pölten',
  'Wels',
  'Villach',
];

interface Props {
  onNavigateToRoute: (id: number) => void;
}

export default function DashboardScreen({ onNavigateToRoute }: Props) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRoute, setNewRoute] = useState({
    fromCity: '',
    toCity: '',
    travelDate: '',
    thresholdPrice: '50',
  });
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const { user, logout } = useAuth();

  const fetchRoutes = useCallback(async () => {
    try {
      const data = await routesApi.getAll();
      setRoutes(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load routes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRoutes();
  };

  const handleAddRoute = async () => {
    if (!newRoute.fromCity || !newRoute.toCity) {
      Alert.alert('Error', 'Please select origin and destination cities');
      return;
    }
    if (!newRoute.travelDate) {
      Alert.alert('Error', 'Please enter a travel date (YYYY-MM-DD)');
      return;
    }
    if (!newRoute.thresholdPrice || isNaN(Number(newRoute.thresholdPrice))) {
      Alert.alert('Error', 'Please enter a valid price threshold');
      return;
    }

    setSubmitting(true);
    try {
      await routesApi.create({
        fromCity: newRoute.fromCity,
        toCity: newRoute.toCity,
        travelDate: newRoute.travelDate,
        thresholdPrice: Number(newRoute.thresholdPrice),
      });
      setShowAddModal(false);
      setNewRoute({ fromCity: '', toCity: '', travelDate: '', thresholdPrice: '50' });
      fetchRoutes();
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Failed to add route';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoute = (id: number) => {
    Alert.alert(
      'Delete Route',
      'Are you sure you want to delete this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await routesApi.delete(id);
              fetchRoutes();
            } catch {
              Alert.alert('Error', 'Failed to delete route');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout },
    ]);
  };

  const renderRouteItem = ({ item }: { item: Route }) => (
    <TouchableOpacity
      style={styles.routeCard}
      onPress={() => onNavigateToRoute(item.id)}
    >
      <View style={styles.routeCardHeader}>
        <Text style={styles.routeTitle}>
          {item.fromCity} → {item.toCity}
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteRoute(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteButton}>Delete</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.routeDetails}>
        <View style={styles.routeDetailItem}>
          <Text style={styles.routeDetailLabel}>Date</Text>
          <Text style={styles.routeDetailValue}>{item.travelDate}</Text>
        </View>
        <View style={styles.routeDetailItem}>
          <Text style={styles.routeDetailLabel}>Threshold</Text>
          <Text style={styles.routeDetailValue}>€{item.thresholdPrice}</Text>
        </View>
        <View style={styles.routeDetailItem}>
          <Text style={styles.routeDetailLabel}>Alerts</Text>
          <View
            style={[
              styles.alertBadge,
              item.alertEnabled ? styles.alertBadgeActive : styles.alertBadgeInactive,
            ]}
          >
            <Text
              style={[
                styles.alertBadgeText,
                item.alertEnabled
                  ? styles.alertBadgeTextActive
                  : styles.alertBadgeTextInactive,
              ]}
            >
              {item.alertEnabled ? 'Active' : 'Disabled'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TrainTracker</Text>
        <View style={styles.headerRight}>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutButton}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Tracked Routes</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add Route</Text>
          </TouchableOpacity>
        </View>

        {routes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No routes yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first route to start tracking train prices.
            </Text>
          </View>
        ) : (
          <FlatList
            data={routes}
            renderItem={renderRouteItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>

      {/* Add Route Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Route</Text>
            <TouchableOpacity onPress={handleAddRoute} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalLabel}>From City</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                setShowFromPicker(!showFromPicker);
                setShowToPicker(false);
              }}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !newRoute.fromCity && styles.pickerPlaceholder,
                ]}
              >
                {newRoute.fromCity || 'Select origin city'}
              </Text>
            </TouchableOpacity>
            {showFromPicker && (
              <View style={styles.cityList}>
                {AUSTRIAN_CITIES.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.cityOption,
                      newRoute.fromCity === city && styles.cityOptionSelected,
                    ]}
                    onPress={() => {
                      setNewRoute({ ...newRoute, fromCity: city });
                      setShowFromPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.cityOptionText,
                        newRoute.fromCity === city && styles.cityOptionTextSelected,
                      ]}
                    >
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.modalLabel}>To City</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                setShowToPicker(!showToPicker);
                setShowFromPicker(false);
              }}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !newRoute.toCity && styles.pickerPlaceholder,
                ]}
              >
                {newRoute.toCity || 'Select destination city'}
              </Text>
            </TouchableOpacity>
            {showToPicker && (
              <View style={styles.cityList}>
                {AUSTRIAN_CITIES.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.cityOption,
                      newRoute.toCity === city && styles.cityOptionSelected,
                    ]}
                    onPress={() => {
                      setNewRoute({ ...newRoute, toCity: city });
                      setShowToPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.cityOptionText,
                        newRoute.toCity === city && styles.cityOptionTextSelected,
                      ]}
                    >
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.modalLabel}>Travel Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={newRoute.travelDate}
              onChangeText={(text) => setNewRoute({ ...newRoute, travelDate: text })}
              placeholder="2024-12-01"
              placeholderTextColor="#9ca3af"
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            />

            <Text style={styles.modalLabel}>Alert Threshold (€)</Text>
            <TextInput
              style={styles.modalInput}
              value={newRoute.thresholdPrice}
              onChangeText={(text) => setNewRoute({ ...newRoute, thresholdPrice: text })}
              placeholder="50"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  logoutButton: {
    fontSize: 14,
    color: '#ef4444',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  deleteButton: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeDetailItem: {
    alignItems: 'center',
  },
  routeDetailLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  alertBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  alertBadgeInactive: {
    backgroundColor: '#f3f4f6',
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertBadgeTextActive: {
    color: '#16a34a',
  },
  alertBadgeTextInactive: {
    color: '#6b7280',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalSave: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerPlaceholder: {
    color: '#9ca3af',
  },
  cityList: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  cityOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cityOptionSelected: {
    backgroundColor: '#ede9fe',
  },
  cityOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  cityOptionTextSelected: {
    color: '#4f46e5',
    fontWeight: '600',
  },
});
