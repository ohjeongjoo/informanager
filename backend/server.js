const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/informanager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB 연결 성공'))
.catch(err => console.error('MongoDB 연결 실패:', err));

// Socket.io를 라우터에서 사용할 수 있도록 설정
app.set('io', io);

// 라우터
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const userRoutes = require('./routes/users');
const workingOrderRoutes = require('./routes/workingOrders');

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/working-orders', workingOrderRoutes);

// Socket.io 연결 관리
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id);
  
  // 사용자 인증
  socket.on('authenticate', (data) => {
    const { userId, userRole } = data;
    connectedUsers.set(socket.id, { userId, userRole, socket });
    socket.join(`user_${userId}`);
    
    // 역할별 룸 참가
    if (userRole === 'admin') {
      socket.join('admin');
    }
    if (userRole === 'manager') {
      socket.join('manager');
    }
    
    console.log(`사용자 ${userId} 인증됨 (${userRole})`);
  });
  
  // 고객 호출 알림
  socket.on('customer_call', (data) => {
    const { customerId, customerName, assignedTo, notificationType } = data;
    
    // 담당자에게 알림 전송
    if (assignedTo) {
      io.to(`user_${assignedTo}`).emit('customer_notification', {
        type: notificationType,
        customerId,
        customerName,
        message: `${customerName} 고객이 방문했습니다.`
      });
    }
    
    // 관리자에게도 알림
    io.to('admin').emit('customer_notification', {
      type: 'admin_notification',
      customerId,
      customerName,
      assignedTo,
      message: `새로운 고객 ${customerName}이 등록되었습니다.`
    });
  });
  
  // 고객 확인 알림
  socket.on('customer_confirmed', (data) => {
    const { customerId, confirmedBy } = data;
    
    // 모든 관련자에게 확인 상태 전송
    io.emit('customer_status_update', {
      customerId,
      status: 'confirmed',
      confirmedBy,
      timestamp: new Date()
    });
  });
  
  // 연결 해제
  socket.on('disconnect', () => {
    console.log('사용자 연결 해제:', socket.id);
    connectedUsers.delete(socket.id);
  });
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '인포매니저 API 서버',
    version: '1.0.0',
    author: '오정주'
  });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: '서버 내부 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 처리
app.use('*', (req, res) => {
  res.status(404).json({
    message: '요청한 리소스를 찾을 수 없습니다.'
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`인포매니저 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
});