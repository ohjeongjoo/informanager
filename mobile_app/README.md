# 인포매니저 (Informanager) - 모바일 앱

## 개요
인포매니저는 모델하우스, 자동차 매장 등 판매 대리점에서 사용하는 고객 관리 및 직원 출퇴근 관리 시스템의 모바일 애플리케이션입니다.

## 주요 기능

### 1. 직원 인증 및 관리
- 사용자명/비밀번호를 통한 로그인
- 역할 기반 접근 제어 (관리자, 매니저, 직원)
- JWT 토큰 기반 인증

### 2. 출퇴근 관리
- 위치 기반 출근 체크 (0m 설정 가능)
- GPS를 통한 정확한 위치 추적
- 출근/퇴근 시간 기록 및 관리

### 3. 고객 호출 알림
- 실시간 고객 방문 알림
- 예약 고객, 워킹 고객, 재방문 고객 구분
- 푸시 알림 및 앱 내 알림
- 고객 확인 버튼을 통한 알림 해제

### 4. 설정 관리 (관리자 전용)
- 근접성 거리 설정 (미터 단위)
- 알림 소리/진동 설정
- 위치 권한 관리
- 알림 테스트 및 관리

## 기술 스택

- **프레임워크**: React Native (Expo)
- **언어**: TypeScript
- **상태 관리**: React Context API
- **네비게이션**: React Navigation
- **실시간 통신**: Socket.io
- **위치 서비스**: Expo Location
- **알림**: Expo Notifications
- **저장소**: AsyncStorage

## 설치 및 실행

### 사전 요구사항
- Node.js 16.0.0 이상
- npm 또는 yarn
- Expo CLI
- Android Studio (Android 개발용)
- Xcode (iOS 개발용, macOS만)

### 1. 의존성 설치
```bash
cd mobile_app
npm install
```

### 2. Expo 개발 서버 실행
```bash
npm start
# 또는
expo start
```

### 3. 모바일 기기에서 실행
- Expo Go 앱 설치 (Google Play Store / App Store)
- QR 코드 스캔하여 앱 실행

### 4. 시뮬레이터에서 실행
```bash
# Android
npm run android

# iOS
npm run ios
```

## 프로젝트 구조

```
mobile_app/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   ├── context/            # React Context (인증, 알림)
│   ├── screens/            # 화면 컴포넌트
│   ├── services/           # API 및 외부 서비스
│   └── types/              # TypeScript 타입 정의
├── App.tsx                 # 메인 앱 컴포넌트
├── package.json            # 프로젝트 의존성
└── README.md               # 이 파일
```

## 주요 컴포넌트

### 화면 (Screens)
- **LoginScreen**: 사용자 로그인
- **DashboardScreen**: 메인 대시보드 (출퇴근, 알림 요약)
- **NotificationScreen**: 고객 호출 알림 목록
- **SettingsScreen**: 앱 설정 (관리자 전용)

### 서비스 (Services)
- **authService**: 인증 관련 API 호출
- **notificationService**: Socket.io를 통한 실시간 알림
- **notificationHandler**: 네이티브 푸시 알림 처리
- **locationService**: 위치 기반 서비스

### 컨텍스트 (Context)
- **AuthContext**: 사용자 인증 상태 관리
- **NotificationContext**: 알림 상태 및 실시간 업데이트

## 환경 설정

### 환경 변수
`.env` 파일을 생성하여 다음 변수들을 설정하세요:

```env
API_BASE_URL=http://localhost:3000/api
SOCKET_URL=http://localhost:3000
```

### 백엔드 연결
모바일 앱은 백엔드 서버와 통신합니다. 백엔드가 실행 중인지 확인하세요.

## 권한 요청

### 필수 권한
- **위치 권한**: 출근 체크를 위한 GPS 접근
- **알림 권한**: 고객 호출 알림 수신

### 권한 설정 방법
1. 앱 실행 시 권한 요청 다이얼로그 표시
2. 설정 화면에서 수동으로 권한 요청 가능
3. 시스템 설정에서 권한 변경 가능

## 사용법

### 1. 로그인
- 사용자명과 비밀번호 입력
- 역할에 따른 접근 권한 확인

### 2. 출근 체크
- 대시보드에서 "출근 체크" 버튼 클릭
- 위치 권한 확인 후 GPS 기반 출근 처리
- 근무 상태가 "근무 중"으로 변경

### 3. 고객 호출 알림
- 실시간으로 고객 방문 알림 수신
- 알림 화면에서 고객 정보 확인
- "확인" 버튼으로 고객 만남 확인

### 4. 퇴근 체크
- 대시보드에서 "퇴근 체크" 버튼 클릭
- 근무 상태가 "퇴근"으로 변경

### 5. 설정 관리 (관리자)
- 근접성 거리 설정
- 알림 설정 관리
- 권한 요청 및 테스트

## 개발 가이드

### 새 화면 추가
1. `src/screens/` 디렉토리에 새 화면 컴포넌트 생성
2. `App.tsx`에 네비게이션 스택 추가
3. 필요한 경우 타입 정의 추가

### 새 서비스 추가
1. `src/services/` 디렉토리에 새 서비스 클래스 생성
2. 필요한 의존성 설치
3. 컨텍스트에서 서비스 사용

### 스타일링
- StyleSheet를 사용한 컴포넌트별 스타일
- 일관된 색상 팔레트 사용
- 반응형 디자인 고려

## 문제 해결

### 일반적인 문제
1. **의존성 오류**: `npm install` 재실행
2. **Metro 번들러 오류**: `npm start --reset-cache`
3. **권한 오류**: 설정에서 권한 확인
4. **연결 오류**: 백엔드 서버 상태 확인

### 디버깅
- Expo DevTools 사용
- React Native Debugger 사용
- 콘솔 로그 확인

## 배포

### Android APK 빌드
```bash
expo build:android
```

### iOS IPA 빌드
```bash
expo build:ios
```

### EAS Build (권장)
```bash
eas build --platform android
eas build --platform ios
```

## 라이선스
이 프로젝트는 오정주가 개발한 인포매니저 시스템의 일부입니다.

## 지원
기술적 문제나 기능 요청이 있으시면 개발팀에 문의하세요.