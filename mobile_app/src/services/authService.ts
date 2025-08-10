import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { User } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터로 토큰 추가
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터로 토큰 만료 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      // 로그인 화면으로 리다이렉트 처리는 AuthContext에서 처리
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
        throw new Error(error.response?.data?.message || '로그인에 실패했습니다.');
      }
      throw new Error('로그인에 실패했습니다.');
    }
  },

  async verifyToken(token: string): Promise<User> {
    try {
      const response = await api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.user;
    } catch (error) {
      throw new Error('토큰 검증에 실패했습니다.');
    }
  },

  async checkIn(location?: { latitude: number; longitude: number }): Promise<User> {
    try {
      const response = await api.post('/users/checkin', {
        ...(location && { latitude: location.latitude, longitude: location.longitude }),
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || '출근 체크에 실패했습니다.');
      }
      throw error;
    }
  },

  async checkOut(): Promise<User> {
    try {
      const response = await api.post('/users/checkout');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || '퇴근 체크에 실패했습니다.');
      }
      throw new Error('퇴근 체크에 실패했습니다.');
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || '프로필 조회에 실패했습니다.');
      }
      throw new Error('프로필 조회에 실패했습니다.');
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await api.put('/users/profile', updates);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || '프로필 수정에 실패했습니다.');
      }
      throw new Error('프로필 수정에 실패했습니다.');
    }
  },
};