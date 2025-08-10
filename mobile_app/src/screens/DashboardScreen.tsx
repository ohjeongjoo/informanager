import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }: any) {
  const { user, checkIn, checkOut, logout } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCheckIn = async () => {
    try {
      await checkIn();
      Alert.alert('출근 체크', '출근이 확인되었습니다.');
    } catch (error) {
      Alert.alert('오류', error instanceof Error ? error.message : '출근 체크에 실패했습니다.');
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      Alert.alert('퇴근 체크', '퇴근이 확인되었습니다.');
    } catch (error) {
      Alert.alert('오류', error instanceof Error ? error.message : '퇴근 체크에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', onPress: logout },
      ]
    );
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    // 여기서 필요한 데이터를 새로고침할 수 있습니다
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatTime = (date: Date | string) => {
    if (!date) return '정보 없음';
    const d = new Date(date);
    return d.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (isWorking: boolean) => {
    return isWorking ? '#27ae60' : '#e74c3c';
  };

  const getStatusText = (isWorking: boolean) => {
    return isWorking ? '근무 중' : '퇴근';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* 사용자 정보 카드 */}
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#3498db" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userPosition}>
              {user?.total} • {user?.headquarters} • {user?.team}
            </Text>
            <Text style={styles.userRole}>{user?.position}</Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(user?.isWorking || false) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(user?.isWorking || false) }]}>
            {getStatusText(user?.isWorking || false)}
          </Text>
        </View>
      </View>

      {/* 출퇴근 체크 카드 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>출퇴근 관리</Text>
        <View style={styles.timeInfo}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>출근 시간</Text>
            <Text style={styles.timeValue}>
              {user?.lastCheckIn ? formatTime(user.lastCheckIn) : '정보 없음'}
            </Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>퇴근 시간</Text>
            <Text style={styles.timeValue}>
              {user?.lastCheckOut ? formatTime(user.lastCheckOut) : '정보 없음'}
            </Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          {!user?.isWorking ? (
            <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
              <Ionicons name="log-in" size={20} color="white" />
              <Text style={styles.buttonText}>출근 체크</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.checkOutButton} onPress={handleCheckOut}>
              <Ionicons name="log-out" size={20} color="white" />
              <Text style={styles.buttonText}>퇴근 체크</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 알림 요약 카드 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>알림</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
            <Text style={styles.viewAllText}>전체보기</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.notificationSummary}>
          <View style={styles.notificationItem}>
            <Ionicons name="notifications" size={24} color="#3498db" />
            <Text style={styles.notificationText}>
              새로운 고객 호출: {unreadCount}건
            </Text>
          </View>
          
          {notifications.length > 0 && (
            <View style={styles.recentNotification}>
              <Text style={styles.recentLabel}>최근 알림:</Text>
              <Text style={styles.recentText} numberOfLines={2}>
                {notifications[0]?.customerName} 고객님이 방문하셨습니다.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 빠른 액션 카드 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>빠른 액션</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings" size={24} color="#3498db" />
            <Text style={styles.actionButtonText}>설정</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
            <Text style={[styles.actionButtonText, { color: '#e74c3c' }]}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  userPosition: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  viewAllText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
  timeInfo: {
    marginBottom: 20,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  checkInButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  checkOutButton: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  notificationSummary: {
    gap: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  recentNotification: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
  },
  recentLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  recentText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
});