import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../types';
import { authService } from '../services/authService';
import { locationService } from '../services/locationService';
import { configService } from '../services/configService';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const user = await authService.verifyToken(token);
        dispatch({ type: 'SET_TOKEN', payload: token });
        dispatch({ type: 'SET_USER', payload: user });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await AsyncStorage.removeItem('authToken');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (username: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { user, token } = await authService.login(username, password);
      
      await AsyncStorage.setItem('authToken', token);
      dispatch({ type: 'SET_TOKEN', payload: token });
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const checkIn = async () => {
    try {
      if (!state.user) return;
      
      // 위치 권한 확인 및 현재 위치 가져오기
      const hasPermission = await locationService.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('위치 권한이 필요합니다.');
      }

      const currentLocation = await locationService.getCurrentLocation();
      if (!currentLocation) {
        throw new Error('현재 위치를 가져올 수 없습니다.');
      }

      // 키오스크 위치와의 근접성 확인
      const kioskLocation = configService.getKioskLocation();
      const proximityDistance = configService.getProximityDistance();
      
      if (proximityDistance > 0) {
        const distance = locationService.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          kioskLocation.latitude,
          kioskLocation.longitude
        );
        
        if (distance > proximityDistance) {
          throw new Error(
            `키오스크에서 너무 멀리 떨어져 있습니다. (현재: ${Math.round(distance)}m, 허용: ${proximityDistance}m)`
          );
        }
      }
      
      // 위치 정보와 함께 체크인 요청
      const updatedUser = await authService.checkIn({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      });
      
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      console.error('Check-in failed:', error);
      throw error;
    }
  };

  const checkOut = async () => {
    try {
      if (!state.user) return;
      
      const updatedUser = await authService.checkOut();
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      console.error('Check-out failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkIn,
    checkOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};