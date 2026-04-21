import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this URL to point to your backend server
const API_URL = 'http://localhost:3000/api';

export interface User {
  id: number;
  email: string;
  createdAt: string;
}

export interface Route {
  id: number;
  userId: number;
  fromCity: string;
  toCity: string;
  travelDate: string;
  thresholdPrice: number;
  alertEnabled: boolean;
  createdAt: string;
}

export interface PriceRecord {
  id: number;
  routeId: number;
  price: number;
  fetchedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { email, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
};

export const routesApi = {
  getAll: async (): Promise<Route[]> => {
    const response = await api.get<Route[]>('/routes');
    return response.data;
  },

  getOne: async (id: number): Promise<Route> => {
    const response = await api.get<Route>(`/routes/${id}`);
    return response.data;
  },

  create: async (data: {
    fromCity: string;
    toCity: string;
    travelDate: string;
    thresholdPrice: number;
    alertEnabled?: boolean;
  }): Promise<Route> => {
    const response = await api.post<Route>('/routes', data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<{
      fromCity: string;
      toCity: string;
      travelDate: string;
      thresholdPrice: number;
      alertEnabled: boolean;
    }>
  ): Promise<Route> => {
    const response = await api.put<Route>(`/routes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/routes/${id}`);
  },

  getPrices: async (
    id: number
  ): Promise<{ route: Route; prices: PriceRecord[] }> => {
    const response = await api.get<{ route: Route; prices: PriceRecord[] }>(
      `/routes/${id}/prices`
    );
    return response.data;
  },

  fetchPrice: async (
    id: number
  ): Promise<{ route: Route; price: PriceRecord }> => {
    const response = await api.post<{ route: Route; price: PriceRecord }>(
      `/routes/${id}/fetch`
    );
    return response.data;
  },
};

export default api;
