# 인포매니저 (Informanager) - 고객 관리 및 직원 출퇴근 시스템

## 개요
인포매니저는 모델하우스, 자동차 매장 등 판매 대리점에서 사용하는 종합적인 고객 관리 및 직원 출퇴근 관리 시스템입니다. 고객의 방문 정보를 관리하고, 직원들에게 실시간 알림을 제공하며, 위치 기반 출퇴근 체크를 지원합니다.

**발명자**: 오정주

## 시스템 구성

### 1. 백엔드 서버 (Node.js + Express)
- RESTful API 제공
- MongoDB 데이터베이스 연동
- Socket.io를 통한 실시간 통신
- JWT 기반 인증 및 권한 관리

### 2. 키오스크 앱 (React)
- 고객 방문 등록
- 고객 정보 검색
- 직원 호출 시스템

### 3. 모바일 앱 (React Native + Expo)
- 직원 로그인 및 대시보드
- 실시간 고객 호출 알림
- 위치 기반 출퇴근 체크
- 관리자 설정 관리

## 주요 기능

### 고객 관리
1. **예약 여부 체크** - 고객의 예약 상태 확인
2. **고객 정보 수집** - 이름, 연락처, 거주지, 성별, 연령대
3. **방문예정 고객 등록** - 관리자 전용 예약 고객 등록
4. **고객 검색** - 이전 방문 이력 및 담당자 연결

### 직원 호출 시스템
1. **자동 직원 배정** - 워킹 순번에 따른 자동 호출
2. **계층별 알림** - 담당자, 팀장, 본부장, 총괄에게 동시 알림
3. **알림 해제** - 4명 중 1명이 확인하면 알림 해제

### 출퇴근 관리
1. **위치 기반 체크** - 키오스크 근처 0m(설정 가능)에서 출퇴근
2. **실시간 상태 관리** - 직원들의 근무 상태 실시간 모니터링
3. **관리자 전용 접근** - 출퇴근 현황은 관리자만 열람 가능

## 프로젝트 구조

```
informanager/
├── backend/                 # Node.js 백엔드 서버
│   ├── models/             # MongoDB 스키마
│   ├── routes/             # API 라우트
│   ├── server.js           # 메인 서버 파일
│   └── package.json        # 백엔드 의존성
├── kiosk-app/              # React 키오스크 앱
│   ├── src/
│   │   ├── components/     # 키오스크 컴포넌트
│   │   └── App.tsx         # 메인 앱
│   └── package.json        # 키오스크 의존성
├── mobile_app/             # React Native 모바일 앱
│   ├── src/
│   │   ├── screens/        # 모바일 화면
│   │   ├── services/       # API 및 알림 서비스
│   │   ├── context/        # 상태 관리
│   │   └── types/          # TypeScript 타입
│   └── package.json        # 모바일 앱 의존성
├── database/               # 데이터베이스 스크립트
└── docs/                   # 프로젝트 문서
```

## 설치 및 실행

### 사전 요구사항
- Node.js 16.0.0 이상
- MongoDB 4.4 이상
- npm 또는 yarn
- Expo CLI (모바일 앱 개발용)

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd informanager
```

### 2. 백엔드 설정 및 실행
```bash
cd backend
npm install
cp .env.example .env  # 환경 변수 설정
# .env 파일에서 데이터베이스 연결 정보 수정
npm run dev
```

### 3. 키오스크 앱 실행
```bash
cd kiosk-app
npm install
npm start
```

### 4. 모바일 앱 실행
```bash
cd mobile_app
npm install
npm start
```

## 환경 변수 설정

### 백엔드 (.env)
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/informanager
JWT_SECRET=your-secret-key
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
SOCKET_CORS_ORIGIN=http://localhost:3001
```

### 모바일 앱
```env
API_BASE_URL=http://localhost:3000/api
SOCKET_URL=http://localhost:3000
```

## 데이터베이스 스키마

### User (직원)
- 사용자 인증 정보
- 조직 계층 구조 (총괄, 본부, 팀, 담당자)
- 출퇴근 상태 및 위치 정보

### Customer (고객)
- 고객 방문 정보
- 예약 상태 및 담당자 배정
- 방문 이력 및 상태

### WorkingOrder (워킹 순번)
- 직원들의 고객 배정 순서
- 활성 상태 및 최대 고객 수 관리

## API 엔드포인트

### 인증
- `POST /api/auth/login` - 사용자 로그인
- `POST /api/auth/register` - 사용자 등록 (관리자 전용)
- `GET /api/auth/verify` - 토큰 검증

### 고객 관리
- `POST /api/customers/register` - 고객 방문 등록
- `POST /api/customers/reservation` - 예약 고객 등록 (관리자 전용)
- `GET /api/customers/search` - 고객 검색
- `PUT /api/customers/:id/confirm` - 고객 확인
- `GET /api/customers` - 고객 목록 (관리자 전용)

### 직원 관리
- `POST /api/users/checkin` - 출근 체크
- `POST /api/users/checkout` - 퇴근 체크
- `GET /api/users/attendance` - 출퇴근 현황 (관리자 전용)
- `GET /api/users` - 직원 목록 (관리자 전용)
- `PUT /api/users/:id` - 직원 정보 수정 (관리자 전용)
- `DELETE /api/users/:id` - 직원 삭제 (관리자 전용)

### 워킹 순번
- `GET /api/working-orders` - 워킹 순번 목록
- `POST /api/working-orders` - 워킹 순번 생성 (관리자 전용)
- `POST /api/working-orders/bulk` - 일괄 워킹 순번 생성 (관리자 전용)
- `GET /api/working-orders/next` - 다음 배정 가능한 직원

## 실시간 통신 (Socket.io)

### 이벤트
- `authenticate` - 클라이언트 인증
- `customer_call` - 고객 호출 알림
- `customer_confirmed` - 고객 확인 알림
- `customer_status_update` - 고객 상태 업데이트

## 보안 기능

- JWT 토큰 기반 인증
- 역할 기반 접근 제어 (RBAC)
- 비밀번호 해싱 (bcrypt)
- CORS 설정
- 입력 데이터 검증

## 개발 가이드

### 새 기능 추가
1. 백엔드에 필요한 모델 및 API 추가
2. 프론트엔드에 해당 기능 UI 구현
3. 실시간 통신이 필요한 경우 Socket.io 이벤트 추가

### 테스트
```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd kiosk-app
npm test

cd mobile_app
npm test
```

## 배포

### 백엔드
```bash
cd backend
npm run build
npm start
```

### 키오스크 앱
```bash
cd kiosk-app
npm run build
# 빌드된 파일을 웹 서버에 배포
```

### 모바일 앱
```bash
cd mobile_app
expo build:android  # Android APK
expo build:ios      # iOS IPA
```

## 문제 해결

### 일반적인 문제
1. **MongoDB 연결 오류**: MongoDB 서비스 실행 상태 확인
2. **포트 충돌**: 다른 서비스가 사용 중인 포트 확인
3. **권한 오류**: 파일 및 폴더 권한 설정 확인
4. **의존성 오류**: `npm install` 재실행

### 로그 확인
- 백엔드: `npm run dev` 실행 시 콘솔 로그
- 프론트엔드: 브라우저 개발자 도구
- 모바일 앱: Expo DevTools

## 라이선스
이 프로젝트는 오정주가 개발한 인포매니저 시스템입니다.

## 지원 및 문의
기술적 문제나 기능 요청이 있으시면 개발팀에 문의하세요.

## 업데이트 로그

### v1.0.0 (2024)
- 초기 버전 릴리즈
- 기본 고객 관리 기능
- 실시간 알림 시스템
- 위치 기반 출퇴근 관리
- 관리자 대시보드