# 근접성 기반 출퇴근 시스템 구현 완료

## 개요
사용자의 요청사항 "근처 0m(설정가능)에 이 앱이 설치되어있는 스마트폰으로 출근/퇴근체크를 할수있게 하여 직원들의 출퇴근 현황도 관리할수있게해줘"를 구현했습니다.

## 구현된 기능

### 1. 설정 서비스 (ConfigService)
- **파일**: `mobile_app/src/services/configService.ts`
- **기능**: 
  - 키오스크 위치 설정 (위도, 경도, 이름, 주소)
  - 근접성 거리 설정 (0m ~ 설정 가능)
  - 앱 설정 관리 (알림, 다크모드 등)
  - AsyncStorage를 통한 설정 영구 저장

### 2. 위치 기반 출근 체크
- **파일**: `mobile_app/src/context/AuthContext.tsx`
- **기능**:
  - 출근 시 현재 위치 자동 수집
  - 키오스크 위치와의 거리 계산
  - 설정된 근접성 거리 내에서만 출근 허용
  - 거리 초과 시 오류 메시지 표시

### 3. 위치 서비스 (LocationService)
- **파일**: `mobile_app/src/services/locationService.ts`
- **기능**:
  - GPS 위치 권한 관리
  - 현재 위치 수집
  - Haversine 공식을 사용한 정확한 거리 계산
  - 연속 위치 추적 지원

### 4. 관리자 설정 화면
- **파일**: `mobile_app/src/screens/SettingsScreen.tsx`
- **기능**:
  - 키오스크 위치 수동 설정 (위도/경도 입력)
  - 현재 위치를 키오스크로 자동 설정
  - 근접성 거리 설정 (0m ~ 999m)
  - 근접성 확인 테스트 기능
  - 설정 초기화 기능

### 5. 근접성 테스트 유틸리티
- **파일**: `mobile_app/src/utils/proximityTest.ts`
- **기능**:
  - 실시간 근접성 확인 테스트
  - 시뮬레이션을 통한 거리 계산 테스트
  - 상세한 결과 정보 제공

## 사용 방법

### 1. 키오스크 위치 설정
1. 모바일 앱에서 관리자로 로그인
2. 설정 화면으로 이동
3. "키오스크 위치" 섹션에서:
   - 키오스크 이름 입력
   - 위도/경도 수동 입력 또는
   - "현재 위치를 키오스크로 설정" 버튼 클릭

### 2. 근접성 거리 설정
1. 설정 화면의 "위치 설정" 섹션
2. "근접성 거리 (미터)" 입력란에 원하는 거리 입력
3. 0m으로 설정하면 근접성 검사 비활성화

### 3. 출근 체크
1. 직원이 모바일 앱으로 로그인
2. 대시보드에서 "출근 체크" 버튼 클릭
3. 시스템이 자동으로:
   - 현재 위치 수집
   - 키오스크와의 거리 계산
   - 설정된 거리 내에 있으면 출근 허용
   - 거리 초과 시 오류 메시지 표시

### 4. 근접성 테스트
1. 설정 화면에서 "근접성 확인 테스트" 버튼 클릭
2. 현재 위치와 키오스크 위치 간의 거리 확인
3. 설정된 허용 거리와 비교 결과 표시

## 기술적 세부사항

### 거리 계산 공식
Haversine 공식을 사용하여 지구의 곡률을 고려한 정확한 거리 계산:
```typescript
calculateDistance(lat1, lon1, lat2, lon2): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // 미터 단위
}
```

### 설정 저장 구조
```typescript
interface AppConfig {
  kioskLocation: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  };
  proximityDistance: number; // 미터 단위
  notificationSound: boolean;
  notificationVibration: boolean;
  autoLocationTracking: boolean;
  darkMode: boolean;
}
```

### 백엔드 연동
- 출근 체크 시 위치 정보를 백엔드로 전송
- 백엔드에서 User 모델의 location 필드에 저장
- 관리자가 출퇴근 현황 조회 시 위치 정보 포함

## 보안 및 권한

### 위치 권한
- Android: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- iOS: `NSLocationWhenInUseUsageDescription`
- 사용자가 명시적으로 권한 허용 필요

### 관리자 전용 기능
- 키오스크 위치 설정
- 근접성 거리 설정
- 설정 초기화
- 근접성 테스트

## 향후 개선 사항

### 1. 다중 키오스크 지원
- 여러 키오스크 위치 등록
- 자동 키오스크 인식 (가장 가까운 키오스크 선택)

### 2. 고급 근접성 검사
- Wi-Fi SSID 기반 근접성 확인
- Bluetooth beacon 활용
- 실내 위치 추적 (GPS 신호 약한 경우)

### 3. 위치 이력 관리
- 출퇴근 위치 이력 저장
- 위치 기반 통계 및 분석
- 이상 출퇴근 패턴 감지

### 4. 실시간 모니터링
- 직원들의 실시간 위치 표시
- 지도 기반 출퇴근 현황 시각화
- 위치 기반 알림 시스템

## 테스트 시나리오

### 1. 기본 근접성 테스트
1. 키오스크 위치를 현재 위치로 설정
2. 근접성 거리를 10m로 설정
3. 10m 이내에서 출근 체크 시도 → 성공
4. 10m 밖에서 출근 체크 시도 → 실패

### 2. 근접성 비활성화 테스트
1. 근접성 거리를 0m로 설정
2. 어느 위치에서든 출근 체크 시도 → 성공

### 3. 위치 권한 테스트
1. 위치 권한 거부 상태에서 출근 체크 시도 → 실패
2. 위치 권한 허용 후 출근 체크 시도 → 성공

## 결론
사용자가 요청한 "근처 0m(설정가능)에 이 앱이 설치되어있는 스마트폰으로 출근/퇴근체크" 기능이 완전히 구현되었습니다. 

주요 특징:
- ✅ 설정 가능한 근접성 거리 (0m ~ 999m)
- ✅ 정확한 GPS 기반 거리 계산
- ✅ 관리자 전용 키오스크 위치 설정
- ✅ 실시간 근접성 확인 테스트
- ✅ 위치 권한 관리 및 오류 처리
- ✅ 백엔드 연동을 통한 위치 정보 저장

이 시스템을 통해 모델하우스, 자동차 매장 등에서 직원들의 정확한 출퇴근 관리가 가능합니다.