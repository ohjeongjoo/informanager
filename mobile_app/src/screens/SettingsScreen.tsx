import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { locationService } from '../services/locationService';
import { notificationHandler } from '../services/notificationHandler';
import { configService, KioskLocation } from '../services/configService';

interface SettingsState {
  proximityDistance: number;
  notificationSound: boolean;
  notificationVibration: boolean;
  autoLocationTracking: boolean;
  darkMode: boolean;
  kioskLocation: KioskLocation;
}

export default function SettingsScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsState>({
    proximityDistance: 0,
    notificationSound: true,
    notificationVibration: true,
    autoLocationTracking: false,
    darkMode: false,
    kioskLocation: {
      latitude: 37.5665,
      longitude: 126.9780,
      name: '기본 키오스크',
      address: '서울특별시 중구 세종대로 110'
    },
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // 설정 서비스에서 모든 설정 로드
      const config = configService.getConfig();
      setSettings(prev => ({
        ...prev,
        proximityDistance: config.proximityDistance,
        notificationSound: config.notificationSound,
        notificationVibration: config.notificationVibration,
        autoLocationTracking: config.autoLocationTracking,
        darkMode: config.darkMode,
        kioskLocation: config.kioskLocation,
      }));
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  const updateProximityDistance = async (distance: number) => {
    setSettings(prev => ({ ...prev, proximityDistance: distance }));
    await configService.setProximityDistance(distance);
  };

  const updateKioskLocation = async (location: KioskLocation) => {
    setSettings(prev => ({ ...prev, kioskLocation: location }));
    await configService.setKioskLocation(location);
  };

  const setCurrentLocationAsKiosk = async () => {
    try {
      const hasPermission = await locationService.requestLocationPermissions();
      if (!hasPermission) {
        Alert.alert('권한 필요', '현재 위치를 키오스크로 설정하려면 위치 권한이 필요합니다.');
        return;
      }

      const currentLocation = await locationService.getCurrentLocation();
      if (currentLocation) {
        const newKioskLocation: KioskLocation = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          name: '현재 위치 키오스크',
          address: '현재 위치에서 설정됨'
        };
        await updateKioskLocation(newKioskLocation);
        Alert.alert('완료', '현재 위치가 키오스크 위치로 설정되었습니다.');
      }
    } catch (error) {
      console.error('키오스크 위치 설정 실패:', error);
      Alert.alert('오류', '키오스크 위치 설정에 실패했습니다.');
    }
  };

  const toggleSetting = async (key: keyof SettingsState) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    // 설정 서비스에 변경사항 저장
    try {
      await configService.updateConfig({ [key]: newValue });
    } catch (error) {
      console.error('설정 저장 실패:', error);
      // 변경사항 되돌리기
      setSettings(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const status = await notificationHandler.requestNotificationPermissions();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '푸시 알림을 받으려면 알림 권한이 필요합니다.');
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
    }
  };

  const requestLocationPermissions = async () => {
    try {
      const hasPermission = await locationService.requestLocationPermissions();
      if (!hasPermission) {
        Alert.alert('권한 필요', '위치 기반 출근체크를 사용하려면 위치 권한이 필요합니다.');
      }
    } catch (error) {
      console.error('위치 권한 요청 실패:', error);
    }
  };

  const testNotification = async () => {
    try {
      const testCustomerCall = {
        customerId: 'test',
        customerName: '테스트 고객',
        customerPhone: '010-1234-5678',
        customerType: 'walkin' as const,
        assignedTo: user!,
        timestamp: new Date(),
        status: 'pending' as const,
      };
      
      await notificationHandler.showCustomerCallNotification(testCustomerCall);
      Alert.alert('알림 테스트', '테스트 알림이 전송되었습니다.');
    } catch (error) {
      console.error('알림 테스트 실패:', error);
      Alert.alert('오류', '알림 테스트에 실패했습니다.');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationHandler.cancelAllNotifications();
      await notificationHandler.clearBadgeCount();
      Alert.alert('완료', '모든 알림이 삭제되었습니다.');
    } catch (error) {
      console.error('알림 삭제 실패:', error);
      Alert.alert('오류', '알림 삭제에 실패했습니다.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>관리자만 접근할 수 있습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>위치 설정</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>근접성 거리 (미터)</Text>
          <TextInput
            style={styles.input}
            value={settings.proximityDistance.toString()}
            onChangeText={(text) => {
              const distance = parseInt(text) || 0;
              updateProximityDistance(distance);
            }}
            keyboardType="numeric"
            placeholder="0"
            maxLength={3}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>자동 위치 추적</Text>
          <Switch
            value={settings.autoLocationTracking}
            onValueChange={() => toggleSetting('autoLocationTracking')}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={requestLocationPermissions}>
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.buttonText}>위치 권한 요청</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={setCurrentLocationAsKiosk}>
          <Ionicons name="navigate" size={20} color="#007AFF" />
          <Text style={styles.buttonText}>현재 위치를 키오스크로 설정</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={async () => {
          try {
            const { testProximityCheck } = await import('../utils/proximityTest');
            const result = await testProximityCheck();
            
            Alert.alert(
              '근접성 확인 테스트',
              `현재 위치: ${result.currentLocation?.latitude.toFixed(6)}, ${result.currentLocation?.longitude.toFixed(6)}\n` +
              `키오스크 위치: ${result.kioskLocation.latitude.toFixed(6)}, ${result.kioskLocation.longitude.toFixed(6)}\n` +
              `거리: ${result.distance}m\n` +
              `허용 거리: ${result.proximityDistance}m\n` +
              `결과: ${result.isWithinRange ? '허용 범위 내' : '허용 범위 밖'}`,
              [{ text: '확인' }]
            );
          } catch (error) {
            console.error('근접성 테스트 실패:', error);
            Alert.alert('오류', '근접성 테스트에 실패했습니다.');
          }
        }}>
          <Ionicons name="analytics" size={20} color="#007AFF" />
          <Text style={styles.buttonText}>근접성 확인 테스트</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>키오스크 위치</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>키오스크 이름</Text>
          <TextInput
            style={[styles.input, { width: 150 }]}
            value={settings.kioskLocation.name}
            onChangeText={(text) => updateKioskLocation({
              ...settings.kioskLocation,
              name: text
            })}
            placeholder="키오스크 이름"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>위도</Text>
          <TextInput
            style={styles.input}
            value={settings.kioskLocation.latitude.toString()}
            onChangeText={(text) => {
              const latitude = parseFloat(text) || 0;
              updateKioskLocation({
                ...settings.kioskLocation,
                latitude
              });
            }}
            keyboardType="numeric"
            placeholder="37.5665"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>경도</Text>
          <TextInput
            style={styles.input}
            value={settings.kioskLocation.longitude.toString()}
            onChangeText={(text) => {
              const longitude = parseFloat(text) || 0;
              updateKioskLocation({
                ...settings.kioskLocation,
                longitude
              });
            }}
            keyboardType="numeric"
            placeholder="126.9780"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>주소</Text>
          <TextInput
            style={[styles.input, { width: 200 }]}
            value={settings.kioskLocation.address}
            onChangeText={(text) => updateKioskLocation({
              ...settings.kioskLocation,
              address: text
            })}
            placeholder="키오스크 주소"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>알림 설정</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>알림 소리</Text>
          <Switch
            value={settings.notificationSound}
            onValueChange={() => toggleSetting('notificationSound')}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>알림 진동</Text>
          <Switch
            value={settings.notificationVibration}
            onValueChange={() => toggleSetting('notificationVibration')}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={requestNotificationPermissions}>
          <Ionicons name="notifications" size={20} color="#007AFF" />
          <Text style={styles.buttonText}>알림 권한 요청</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testNotification}>
          <Ionicons name="play" size={20} color="#007AFF" />
          <Text style={styles.buttonText}>알림 테스트</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={clearAllNotifications}>
          <Ionicons name="trash" size={20} color="#FF3B30" />
          <Text style={[styles.buttonText, { color: '#FF3B30' }]}>모든 알림 삭제</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 설정</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>다크 모드</Text>
          <Switch
            value={settings.darkMode}
            onValueChange={() => toggleSetting('darkMode')}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={async () => {
          try {
            await configService.resetToDefaults();
            await loadSettings();
            Alert.alert('완료', '설정이 기본값으로 초기화되었습니다.');
          } catch (error) {
            console.error('설정 초기화 실패:', error);
            Alert.alert('오류', '설정 초기화에 실패했습니다.');
          }
        }}>
          <Ionicons name="refresh" size={20} color="#FF9500" />
          <Text style={[styles.buttonText, { color: '#FF9500' }]}>설정 초기화</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>정보</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>앱 버전</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>개발자</Text>
          <Text style={styles.infoValue}>오정주</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingLabel: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  infoLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 50,
  },
});