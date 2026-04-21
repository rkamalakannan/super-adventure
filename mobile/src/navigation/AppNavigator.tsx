import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import RouteDetailScreen from '../screens/RouteDetailScreen';

type Screen = 'login' | 'register' | 'dashboard' | 'routeDetail';

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (screen === 'register') {
      return (
        <RegisterScreen onNavigateToLogin={() => setScreen('login')} />
      );
    }
    return (
      <LoginScreen onNavigateToRegister={() => setScreen('register')} />
    );
  }

  // Authenticated screens
  if (screen === 'routeDetail' && selectedRouteId != null) {
    return (
      <RouteDetailScreen
        routeId={selectedRouteId}
        onBack={() => {
          setScreen('dashboard');
          setSelectedRouteId(null);
        }}
      />
    );
  }

  return (
    <DashboardScreen
      onNavigateToRoute={(id) => {
        setSelectedRouteId(id);
        setScreen('routeDetail');
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});
