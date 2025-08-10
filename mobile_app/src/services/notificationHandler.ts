import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { CustomerCall } from '../types';

// 알림 설정 구성
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationHandler {
  private expoPushToken: string | null = null;

  // Expo 푸시 토큰 등록
  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('푸시 알림 권한이 거부되었습니다!');
        return null;
      }
      
      try {
        token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        this.expoPushToken = token.data;
        console.log('Expo 푸시 토큰:', token.data);
      } catch (error) {
        console.error('Expo 푸시 토큰 가져오기 실패:', error);
      }
    } else {
      console.log('실제 기기에서만 푸시 알림을 사용할 수 있습니다.');
    }

    return token?.data || null;
  }

  // 로컬 알림 표시 (고객 호출용)
  async showCustomerCallNotification(customerCall: CustomerCall): Promise<void> {
    const notificationContent = {
      title: '고객 호출',
      body: `${customerCall.customerName} 고객님이 방문하셨습니다.`,
      data: {
        customerId: customerCall.customerId,
        customerName: customerCall.customerName,
        customerPhone: customerCall.customerPhone,
        customerType: customerCall.customerType,
        assignedTo: customerCall.assignedTo,
        timestamp: customerCall.timestamp,
        status: customerCall.status,
      },
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      android: {
        channelId: 'customer-calls',
        priority: 'high',
        sound: 'default',
        vibrate: [0, 250, 250, 250],
        icon: '@drawable/ic_notification',
        color: '#FF6B6B',
        actions: [
          {
            title: '확인',
            icon: '@drawable/ic_check',
            action: 'confirm',
          },
          {
            title: '거부',
            icon: '@drawable/ic_close',
            action: 'reject',
          },
        ],
      },
      ios: {
        sound: 'default',
        badge: 1,
        categoryIdentifier: 'customer-call',
      },
    };

    try {
      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // 즉시 표시
      });
      console.log('고객 호출 알림이 표시되었습니다.');
    } catch (error) {
      console.error('알림 표시 실패:', error);
    }
  }

  // 알림 응답 처리
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const data = response.notification.request.content.data;
    const action = response.actionIdentifier;

    if (action === 'confirm' || action === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      // 고객 확인 처리
      console.log('고객 확인됨:', data.customerId);
      // 여기서 고객 확인 API 호출
    } else if (action === 'reject') {
      // 고객 거부 처리
      console.log('고객 거부됨:', data.customerId);
    }
  }

  // 알림 수신 리스너 설정
  setNotificationReceivedListener(listener: (notification: Notifications.Notification) => void): void {
    Notifications.addNotificationReceivedListener(listener);
  }

  // 알림 응답 리스너 설정
  setNotificationResponseReceivedListener(listener: (response: Notifications.NotificationResponse) => void): void {
    Notifications.addNotificationResponseReceivedListener(listener);
  }

  // 배지 수 제거
  async clearBadgeCount(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  // 특정 알림 취소
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // 모든 알림 취소
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // 현재 Expo 푸시 토큰 반환
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // 알림 권한 상태 확인
  async getNotificationPermissions(): Promise<Notifications.PermissionStatus> {
    return await Notifications.getPermissionsAsync();
  }

  // 알림 권한 요청
  async requestNotificationPermissions(): Promise<Notifications.PermissionStatus> {
    return await Notifications.requestPermissionsAsync();
  }
}

export const notificationHandler = new NotificationHandler();