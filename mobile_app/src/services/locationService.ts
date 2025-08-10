import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface ProximitySettings {
  maxDistance: number; // 미터 단위
  updateInterval: number; // 밀리초 단위
}

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private currentLocation: LocationCoordinates | null = null;
  private proximitySettings: ProximitySettings = {
    maxDistance: 0, // 0m (설정 가능)
    updateInterval: 10000, // 10초마다 업데이트
  };

  // 위치 권한 요청
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('위치 권한이 거부되었습니다.');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.log('백그라운드 위치 권한이 거부되었습니다.');
        // 백그라운드 권한이 없어도 기본 기능은 동작
      }

      return true;
    } catch (error) {
      console.error('위치 권한 요청 실패:', error);
      return false;
    }
  }

  // 현재 위치 가져오기
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 1,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('현재 위치 가져오기 실패:', error);
      return null;
    }
  }

  // 위치 추적 시작
  async startLocationTracking(
    onLocationUpdate?: (location: LocationCoordinates) => void,
    onProximityChange?: (isNearby: boolean) => void
  ): Promise<void> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('위치 권한이 필요합니다.');
      }

      // 위치 추적 시작
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: this.proximitySettings.updateInterval,
          distanceInterval: 1,
        },
        (location) => {
          const newLocation: LocationCoordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          this.currentLocation = newLocation;

          if (onLocationUpdate) {
            onLocationUpdate(newLocation);
          }

          // 근접성 확인
          if (onProximityChange) {
            const isNearby = this.checkProximity(newLocation);
            onProximityChange(isNearby);
          }
        }
      );

      console.log('위치 추적이 시작되었습니다.');
    } catch (error) {
      console.error('위치 추적 시작 실패:', error);
      throw error;
    }
  }

  // 위치 추적 중지
  stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      console.log('위치 추적이 중지되었습니다.');
    }
  }

  // 두 지점 간 거리 계산 (미터 단위)
  calculateDistance(
    point1: LocationCoordinates,
    point2: LocationCoordinates
  ): number {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // 근접성 확인
  checkProximity(location: LocationCoordinates): boolean {
    if (!this.currentLocation) {
      return false;
    }

    const distance = this.calculateDistance(this.currentLocation, location);
    return distance <= this.proximitySettings.maxDistance;
  }

  // 근접성 설정 업데이트
  updateProximitySettings(settings: Partial<ProximitySettings>): void {
    this.proximitySettings = { ...this.proximitySettings, ...settings };
    console.log('근접성 설정이 업데이트되었습니다:', this.proximitySettings);
  }

  // 현재 근접성 설정 반환
  getProximitySettings(): ProximitySettings {
    return { ...this.proximitySettings };
  }

  // 현재 위치 반환
  getCurrentLocation(): LocationCoordinates | null {
    return this.currentLocation ? { ...this.currentLocation } : null;
  }

  // 위치 서비스 활성화 상태 확인
  async isLocationServiceEnabled(): Promise<boolean> {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      return isEnabled;
    } catch (error) {
      console.error('위치 서비스 상태 확인 실패:', error);
      return false;
    }
  }

  // 위치 정확도 정보 가져오기
  async getLocationAccuracy(): Promise<Location.Accuracy | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      // 정확도 레벨 반환
      if (location.coords.accuracy && location.coords.accuracy <= 5) {
        return Location.Accuracy.BestForNavigation;
      } else if (location.coords.accuracy && location.coords.accuracy <= 10) {
        return Location.Accuracy.High;
      } else if (location.coords.accuracy && location.coords.accuracy <= 100) {
        return Location.Accuracy.Balanced;
      } else {
        return Location.Accuracy.Low;
      }
    } catch (error) {
      console.error('위치 정확도 확인 실패:', error);
      return null;
    }
  }

  // 주소 정보 가져오기 (역지오코딩)
  async getAddressFromCoordinates(
    coordinates: LocationCoordinates
  ): Promise<string | null> {
    try {
      const address = await Location.reverseGeocodeAsync(coordinates);
      if (address && address.length > 0) {
        const addr = address[0];
        return `${addr.city || ''} ${addr.district || ''} ${addr.street || ''}`.trim();
      }
      return null;
    } catch (error) {
      console.error('주소 정보 가져오기 실패:', error);
      return null;
    }
  }
}

export const locationService = new LocationService();