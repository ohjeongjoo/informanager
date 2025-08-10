const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// JWT 미들웨어
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '토큰이 필요합니다.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

// 관리자 권한 확인
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  next();
};

// 출근 체크
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    // 위치 정보 검증 (필요시 거리 계산)
    if (latitude && longitude) {
      // 여기서 설정된 거리 내에 있는지 확인할 수 있음
      // 예: 100m 이내
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    user.isWorking = true;
    user.lastCheckIn = new Date();
    if (latitude && longitude) {
      user.location = {
        latitude,
        longitude,
        lastUpdated: new Date()
      };
    }
    
    await user.save();
    
    res.json({
      message: '출근이 체크되었습니다.',
      checkInTime: user.lastCheckIn,
      isWorking: user.isWorking
    });
    
  } catch (error) {
    console.error('출근 체크 오류:', error);
    res.status(500).json({
      message: '출근 체크 중 오류가 발생했습니다.'
    });
  }
});

// 퇴근 체크
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    user.isWorking = false;
    user.lastCheckOut = new Date();
    
    await user.save();
    
    res.json({
      message: '퇴근이 체크되었습니다.',
      checkOutTime: user.lastCheckOut,
      isWorking: user.isWorking
    });
    
  } catch (error) {
    console.error('퇴근 체크 오류:', error);
    res.status(500).json({
      message: '퇴근 체크 중 오류가 발생했습니다.'
    });
  }
});

// 출퇴근 현황 조회 (관리자용)
router.get('/attendance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { date, total, headquarters, team } = req.query;
    
    let query = {};
    
    // 조직별 필터링
    if (total) query.total = total;
    if (headquarters) query.headquarters = headquarters;
    if (team) query.team = team;
    
    const users = await User.find(query)
      .select('name total headquarters team position isWorking lastCheckIn lastCheckOut')
      .sort({ total: 1, headquarters: 1, team: 1, name: 1 });
    
    // 날짜별 필터링 (필요시)
    let filteredUsers = users;
    if (date) {
      const targetDate = new Date(date);
      filteredUsers = users.filter(user => {
        if (user.lastCheckIn) {
          const checkInDate = new Date(user.lastCheckIn);
          return checkInDate.toDateString() === targetDate.toDateString();
        }
        return false;
      });
    }
    
    res.json({
      users: filteredUsers,
      total: filteredUsers.length,
      working: filteredUsers.filter(u => u.isWorking).length,
      notWorking: filteredUsers.filter(u => !u.isWorking).length
    });
    
  } catch (error) {
    console.error('출퇴근 현황 조회 오류:', error);
    res.status(500).json({
      message: '출퇴근 현황 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 목록 조회 (관리자용)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, total, headquarters, team } = req.query;
    
    let query = {};
    
    if (role) query.role = role;
    if (total) query.total = total;
    if (headquarters) query.headquarters = headquarters;
    if (team) query.team = team;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ total: 1, headquarters: 1, team: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({
      message: '사용자 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 정보 수정 (관리자용)
router.put('/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // 비밀번호는 별도로 처리
    delete updateData.password;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      message: '사용자 정보가 업데이트되었습니다.',
      user
    });
    
  } catch (error) {
    console.error('사용자 정보 수정 오류:', error);
    res.status(500).json({
      message: '사용자 정보 수정 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 삭제 (관리자용)
router.delete('/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      message: '사용자가 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({
      message: '사용자 삭제 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;