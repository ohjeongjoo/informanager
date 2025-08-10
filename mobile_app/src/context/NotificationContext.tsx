import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { NotificationState, CustomerCall } from '../types';
import { notificationService } from '../services/notificationService';
import { notificationHandler } from '../services/notificationHandler';
import { useAuth } from './AuthContext';

interface NotificationContextType extends NotificationState {
  confirmCustomerCall: (customerId: string) => Promise<void>;
  clearNotification: (customerId: string) => void;
  markAsRead: (customerId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

type NotificationAction =
  | { type: 'SET_NOTIFICATIONS'; payload: CustomerCall[] }
  | { type: 'ADD_NOTIFICATION'; payload: CustomerCall }
  | { type: 'UPDATE_NOTIFICATION'; payload: { customerId: string; updates: Partial<CustomerCall> } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'CLEAR_ALL' };

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => n.status === 'pending').length,
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.customerId === action.payload.customerId
            ? { ...notification, ...action.payload.updates }
            : notification
        ),
        unreadCount: state.notifications.filter(n => n.status === 'pending').length,
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.customerId !== action.payload),
        unreadCount: state.notifications.filter(n => n.status === 'pending' && n.customerId !== action.payload).length,
      };
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    case 'CLEAR_ALL':
      return { notifications: [], unreadCount: 0 };
    default:
      return state;
  }
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // 푸시 알림 권한 요청 및 토큰 등록
      notificationHandler.registerForPushNotificationsAsync();
      
      // Socket.io 연결 및 알림 수신
      notificationService.connect(user._id);
      
      // 기존 알림 로드
      loadNotifications();
      
      // Socket 이벤트 리스너 등록
      notificationService.onCustomerCall((customerCall: CustomerCall) => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: customerCall });
        // 네이티브 알림 표시
        notificationHandler.showCustomerCallNotification(customerCall);
      });

      notificationService.onCustomerConfirmed((customerId: string) => {
        dispatch({
          type: 'UPDATE_NOTIFICATION',
          payload: { customerId, updates: { status: 'confirmed' } }
        });
      });

      // 네이티브 알림 응답 리스너 설정
      notificationHandler.setNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.customerId) {
          confirmCustomerCall(data.customerId);
        }
      });

      return () => {
        notificationService.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  const loadNotifications = async () => {
    try {
      const notifications = await notificationService.getNotifications();
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const confirmCustomerCall = async (customerId: string) => {
    try {
      await notificationService.confirmCustomerCall(customerId);
      dispatch({
        type: 'UPDATE_NOTIFICATION',
        payload: { customerId, updates: { status: 'confirmed' } }
      });
    } catch (error) {
      console.error('Failed to confirm customer call:', error);
      throw error;
    }
  };

  const clearNotification = (customerId: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: customerId });
  };

  const markAsRead = (customerId: string) => {
    dispatch({
      type: 'UPDATE_NOTIFICATION',
      payload: { customerId, updates: { status: 'confirmed' } }
    });
  };

  const value: NotificationContextType = {
    ...state,
    confirmCustomerCall,
    clearNotification,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};