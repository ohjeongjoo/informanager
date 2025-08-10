import { locationService } from '../services/locationService';
import { configService } from '../services/configService';

export const testProximityCheck = async (): Promise<{
  currentLocation: { latitude: number; longitude: number } | null;
  kioskLocation: { latitude: number; longitude: number };
  distance: number;
  isWithinRange: boolean;
  proximityDistance: number;
}> => {
  try {
    // 현재 위치 가져오기
    const currentLocation = await locationService.getCurrentLocation();
    if (!currentLocation) {
      throw new Error('현재 위치를 가져올 수 없습니다.');
    }

    // 키오스크 위치 가져오기
    const kioskLocation = configService.getKioskLocation();
    const proximityDistance = configService.getProximityDistance();

    // 거리 계산
    const distance = locationService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      kioskLocation.latitude,
      kioskLocation.longitude
    );

    const isWithinRange = proximityDistance === 0 || distance <= proximityDistance;

    return {
      currentLocation,
      kioskLocation,
      distance: Math.round(distance),
      isWithinRange,
      proximityDistance
    };
  } catch (error) {
    console.error('근접성 확인 테스트 실패:', error);
    throw error;
  }
};

export const simulateProximityCheck = (
  userLat: number,
  userLng: number,
  kioskLat: number,
  kioskLng: number,
  maxDistance: number
): {
  distance: number;
  isWithinRange: boolean;
  message: string;
} => {
  const distance = locationService.calculateDistance(userLat, userLng, kioskLat, kioskLng);
  const isWithinRange = maxDistance === 0 || distance <= maxDistance;
  
  let message = '';
  if (maxDistance === 0) {
    message = '근접성 검사가 비활성화되어 있습니다.';
  } else if (isWithinRange) {
    message = `키오스크에서 ${Math.round(distance)}m 떨어져 있습니다. (허용: ${maxDistance}m)`;
  } else {
    message = `키오스크에서 너무 멀리 떨어져 있습니다. (현재: ${Math.round(distance)}m, 허용: ${maxDistance}m)`;
  }

  return {
    distance: Math.round(distance),
    isWithinRange,
    message
  };
};