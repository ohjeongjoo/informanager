const express = require('express');
const jwt = require('jsonwebtoken');
const WorkingOrder = require('../models/WorkingOrder');
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

// 워킹 순번 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const workingOrders = await WorkingOrder.find({ isActive: true })
      .populate('staff', 'name total headquarters team position')
      .sort({ order: 1 });
    
    res.json({
      workingOrders,
      total: workingOrders.length
    });
    
  } catch (error) {
    console.error('워킹 순번 조회 오류:', error);
    res.status(500).json({
      message: '워킹 순번 조회 중 오류가 발생했습니다.'
    });
  }
});

// 워킹 순번 생성 (관리자용)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { staffId, order } = req.body;
    
    if (!staffId || !order) {
      return res.status(400).json({
        message: '담당자 ID와 순번을 입력해주세요.'
      });
    }
    
    // 담당자 확인
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        message: '담당자를 찾을 수 없습니다.'
      });
    }
    
    // 순번 중복 확인
    const existingOrder = await WorkingOrder.findOne({ order });
    if (existingOrder) {
      return res.status(400).json({
        message: '이미 존재하는 순번입니다.'
      });
    }
    
    // 담당자 중복 확인
    const existingStaff = await WorkingOrder.findOne({ staff: staffId });
    if (existingStaff) {
      return res.status(400).json({
        message: '이미 워킹 순번에 등록된 담당자입니다.'
      });
    }
    
    const workingOrder = new WorkingOrder({
      order,
      staff: staffId,
      total: staff.total,
      headquarters: staff.headquarters,
      team: staff.team,
      position: staff.position
    });
    
    await workingOrder.save();
    
    const populatedOrder = await WorkingOrder.findById(workingOrder._id)
      .populate('staff', 'name total headquarters team position');
    
    res.status(201).json({
      message: '워킹 순번이 생성되었습니다.',
      workingOrder: populatedOrder
    });
    
  } catch (error) {
    console.error('워킹 순번 생성 오류:', error);
    res.status(500).json({
      message: '워킹 순번 생성 중 오류가 발생했습니다.'
    });
  }
});

// 워킹 순번 수정 (관리자용)
router.put('/:orderId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { order, isActive, maxCustomers } = req.body;
    
    const workingOrder = await WorkingOrder.findById(orderId);
    if (!workingOrder) {
      return res.status(404).json({
        message: '워킹 순번을 찾을 수 없습니다.'
      });
    }
    
    // 순번 변경 시 중복 확인
    if (order && order !== workingOrder.order) {
      const existingOrder = await WorkingOrder.findOne({ order });
      if (existingOrder) {
        return res.status(400).json({
          message: '이미 존재하는 순번입니다.'
        });
      }
    }
    
    const updateData = {};
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (maxCustomers !== undefined) updateData.maxCustomers = maxCustomers;
    
    const updatedOrder = await WorkingOrder.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).populate('staff', 'name total headquarters team position');
    
    res.json({
      message: '워킹 순번이 업데이트되었습니다.',
      workingOrder: updatedOrder
    });
    
  } catch (error) {
    console.error('워킹 순번 수정 오류:', error);
    res.status(500).json({
      message: '워킹 순번 수정 중 오류가 발생했습니다.'
    });
  }
});

// 워킹 순번 삭제 (관리자용)
router.delete('/:orderId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const workingOrder = await WorkingOrder.findByIdAndDelete(orderId);
    if (!workingOrder) {
      return res.status(404).json({
        message: '워킹 순번을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      message: '워킹 순번이 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('워킹 순번 삭제 오류:', error);
    res.status(500).json({
      message: '워킹 순번 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 워킹 순번 일괄 생성 (관리자용)
router.post('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { staffIds } = req.body;
    
    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({
        message: '담당자 ID 배열을 입력해주세요.'
      });
    }
    
    // 기존 워킹 순번 삭제
    await WorkingOrder.deleteMany({});
    
    // 새로운 워킹 순번 생성
    const workingOrders = [];
    for (let i = 0; i < staffIds.length; i++) {
      const staff = await User.findById(staffIds[i]);
      if (staff) {
        const workingOrder = new WorkingOrder({
          order: i + 1,
          staff: staff._id,
          total: staff.total,
          headquarters: staff.headquarters,
          team: staff.team,
          position: staff.position
        });
        workingOrders.push(workingOrder);
      }
    }
    
    await WorkingOrder.insertMany(workingOrders);
    
    const populatedOrders = await WorkingOrder.find()
      .populate('staff', 'name total headquarters team position')
      .sort({ order: 1 });
    
    res.status(201).json({
      message: `${workingOrders.length}개의 워킹 순번이 생성되었습니다.`,
      workingOrders: populatedOrders
    });
    
  } catch (error) {
    console.error('워킹 순번 일괄 생성 오류:', error);
    res.status(500).json({
      message: '워킹 순번 일괄 생성 중 오류가 발생했습니다.'
    });
  }
});

// 다음 담당자 조회
router.get('/next', async (req, res) => {
  try {
    const nextStaff = await WorkingOrder.findOne({
      isActive: true,
      currentCustomers: { $lt: 3 } // 최대 3명까지 담당
    }).sort({ order: 1 });
    
    if (!nextStaff) {
      return res.status(404).json({
        message: '사용 가능한 담당자가 없습니다.'
      });
    }
    
    const populatedOrder = await WorkingOrder.findById(nextStaff._id)
      .populate('staff', 'name total headquarters team position');
    
    res.json({
      nextStaff: populatedOrder
    });
    
  } catch (error) {
    console.error('다음 담당자 조회 오류:', error);
    res.status(500).json({
      message: '다음 담당자 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;