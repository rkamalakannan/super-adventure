import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { routesApi, type Route, type PriceRecord } from '../api/client';

const screenWidth = Dimensions.get('window').width;

interface Props {
  routeId: number;
  onBack: () => void;
}

export default function RouteDetailScreen({ routeId, onBack }: Props) {
  const [route, setRoute] = useState<Route | null>(null);
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [togglingAlerts, setTogglingAlerts] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await routesApi.getPrices(routeId);
      setRoute(data.route);
      setPrices(data.prices);
    } catch (err) {
      Alert.alert('Error', 'Failed to load route details');
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFetchPrice = async () => {
    setFetchingPrice(true);
    try {
      await routesApi.fetchPrice(routeId);
      await fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch the latest price');
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleToggleAlerts = async () => {
    if (!route) return;
    setTogglingAlerts(true);
    try {
      const updated = await routesApi.update(route.id, {
        alertEnabled: !route.alertEnabled,
      });
      setRoute(updated);
    } catch (err) {
      Alert.alert('Error', 'Failed to update alert setting');
    } finally {
      setTogglingAlerts(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!route) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Route not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Prepare chart data (show up to last 10 entries, oldest → newest)
  const chartPrices = [...prices].reverse().slice(-10);
  const hasChartData = chartPrices.length >= 2;

  const chartData = {
    labels: chartPrices.map((p) => {
      const d = new Date(p.fetchedAt);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    datasets: [
      {
        data: chartPrices.map((p) => p.price),
        color: () => '#4f46e5',
        strokeWidth: 2,
      },
    ],
  };

  const latestPrice = prices.length > 0 ? prices[0].price : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TrainTracker</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route info card */}
        <View style={styles.card}>
          <Text style={styles.routeTitle}>
            {route.fromCity} → {route.toCity}
          </Text>
          <Text style={styles.routeDate}>Travel Date: {route.travelDate}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Threshold</Text>
              <Text style={styles.statValue}>€{route.thresholdPrice}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Latest Price</Text>
              <Text style={styles.statValue}>
                {latestPrice != null ? `€${latestPrice.toFixed(2)}` : '—'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Alerts</Text>
              <Text style={styles.statValue}>
                {route.alertEnabled ? 'Active' : 'Off'}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleFetchPrice}
              disabled={fetchingPrice}
            >
              {fetchingPrice ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Fetch Latest Price</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                route.alertEnabled ? styles.alertButtonActive : styles.alertButtonInactive,
              ]}
              onPress={handleToggleAlerts}
              disabled={togglingAlerts}
            >
              {togglingAlerts ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.alertButtonText}>
                  {route.alertEnabled ? 'Alerts On' : 'Alerts Off'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price History</Text>
          {!hasChartData ? (
            <Text style={styles.emptyText}>
              {prices.length === 0
                ? 'No price data yet. Tap "Fetch Latest Price" to get started.'
                : 'Need at least 2 data points to display a chart.'}
            </Text>
          ) : (
            <LineChart
              data={chartData}
              width={screenWidth - 64}
              height={200}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                labelColor: () => '#9ca3af',
                style: { borderRadius: 8 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#4f46e5',
                },
              }}
              bezier
              style={{ borderRadius: 8, marginLeft: -8 }}
              formatYLabel={(value) => `€${value}`}
            />
          )}
        </View>

        {/* Price History Table */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Price Checks</Text>
          {prices.length === 0 ? (
            <Text style={styles.emptyText}>No price checks yet.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Date & Time</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>
                  Price
                </Text>
              </View>
              {prices.slice(0, 10).map((price) => (
                <View key={price.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {new Date(price.fetchedAt).toLocaleString()}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.priceCell,
                      { flex: 1, textAlign: 'right' },
                    ]}
                  >
                    €{price.price.toFixed(2)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
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
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  backLink: {
    flex: 1,
  },
  backLinkText: {
    fontSize: 16,
    color: '#6b7280',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  routeDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  alertButtonActive: {
    backgroundColor: '#16a34a',
  },
  alertButtonInactive: {
    backgroundColor: '#d1d5db',
  },
  alertButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceCell: {
    fontWeight: '600',
    color: '#374151',
  },
});
