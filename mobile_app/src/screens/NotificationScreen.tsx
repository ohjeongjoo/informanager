import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNotifications } from '../context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { CustomerCall } from '../types';

export default function NotificationScreen() {
  const { notifications, confirmCustomerCall, clearNotification, markAsRead } = useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    // 여기서 알림을 새로고침할 수 있습니다
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleConfirmCustomer = (customerCall: CustomerCall) => {
    Alert.alert(
      '고객 확인',
      `${customerCall.customerName} 고객님을 만나셨나요?`,
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '네, 확인했습니다',
          onPress: async () => {
            try {
              await confirmCustomerCall(customerCall.customerId);
              Alert.alert('확인 완료', '고객 확인이 완료되었습니다.');
            } catch (error) {
              Alert.alert('오류', error instanceof Error ? error.message : '고객 확인에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleClearNotification = (customerId: string) => {
    Alert.alert(
      '알림 삭제',
      '이 알림을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', onPress: () => clearNotification(customerId) },
      ]
    );
  };

  const formatTime = (date: Date | string) => {
    if (!date) return '정보 없음';
    const d = new Date(date);
    return d.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCustomerTypeText = (type: string) => {
    switch (type) {
      case 'reserved':
        return '예약 고객';
      case 'walkin':
        return '워킹 고객';
      case 'returning':
        return '재방문 고객';
      default:
        return '기타';
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'reserved':
        return '#e74c3c';
      case 'walkin':
        return '#f39c12';
      case 'returning':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'pending' ? '#e74c3c' : '#27ae60';
  };

  const getStatusText = (status: string) => {
    return status === 'pending' ? '대기 중' : '확인됨';
  };

  const renderNotificationItem = ({ item }: { item: CustomerCall }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.customerPhone}>{item.customerPhone}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.notificationDetails}>
        <View style={styles.typeContainer}>
          <View style={[styles.typeBadge, { backgroundColor: getCustomerTypeColor(item.customerType) }]}>
            <Text style={styles.typeText}>
              {getCustomerTypeText(item.customerType)}
            </Text>
          </View>
        </View>

        <Text style={styles.timestamp}>
          {formatTime(item.timestamp)}
        </Text>

        <View style={styles.assignedStaff}>
          <Text style={styles.assignedLabel}>담당자:</Text>
          <Text style={styles.assignedName}>
            {item.assignedTo.name} ({item.assignedTo.position})
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => handleConfirmCustomer(item)}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.confirmButtonText}>고객 확인</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => handleClearNotification(item.customerId)}
        >
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          <Text style={styles.clearButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off" size={64} color="#bdc3c7" />
      <Text style={styles.emptyTitle}>알림이 없습니다</Text>
      <Text style={styles.emptySubtitle}>
        새로운 고객 호출이 있을 때 알림이 표시됩니다
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.customerId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notificationDetails: {
    marginBottom: 20,
  },
  typeContainer: {
    marginBottom: 12,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 12,
  },
  assignedStaff: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 8,
  },
  assignedName: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  clearButton: {
    borderWidth: 1,
    borderColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 20,
  },
});