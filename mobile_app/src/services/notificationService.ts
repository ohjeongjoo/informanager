import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomerCall } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

class NotificationService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private customerCallCallbacks: ((customerCall: CustomerCall) => void)[] = [];
  private customerConfirmedCallbacks: ((customerId: string) => void)[] = [];

  async connect(userId: string) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      this.userId = userId;
      
      this.socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('Socket.io 연결됨');
      });

      this.socket.on('disconnect', () => {
        console.log('Socket.io 연결 해제됨');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.io 연결 오류:', error);
      });

      // 고객 호출 이벤트 수신
      this.socket.on('customer_call', (data: CustomerCall) => {
        console.log('고객 호출 수신:', data);
        this.customerCallCallbacks.forEach(callback => callback(data));
      });

      // 고객 확인 이벤트 수신
      this.socket.on('customer_confirmed', (data: { customerId: string }) => {
        console.log('고객 확인 수신:', data);
        this.customerConfirmedCallbacks.forEach(callback => callback(data.customerId));
      });

      // 인증 이벤트
      this.socket.emit('authenticate', { userId, token });

    } catch (error) {
      console.error('Socket.io 연결 실패:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  onCustomerCall(callback: (customerCall: CustomerCall) => void) {
    this.customerCallCallbacks.push(callback);
  }

  onCustomerConfirmed(callback: (customerId: string) => void) {
    this.customerConfirmedCallbacks.push(callback);
  }

  async getNotifications(): Promise<CustomerCall[]> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/customers/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('알림 조회 실패:', error);
      return [];
    }
  }

  async confirmCustomerCall(customerId: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.put(`${API_BASE_URL}/customers/${customerId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Socket.io를 통해 확인 이벤트 전송
      if (this.socket) {
        this.socket.emit('customer_confirmed', { customerId });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || '고객 확인에 실패했습니다.');
      }
      throw new Error('고객 확인에 실패했습니다.');
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // 사용자 ID 반환
  getUserId(): string | null {
    return this.userId;
  }
}

export const notificationService = new NotificationService();