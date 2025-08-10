const express = require('express');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const User = require('../models/User');
const WorkingOrder = require('../models/WorkingOrder');
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

// 새 고객 등록 (키오스크용)
router.post('/register', async (req, res) => {
  try {
    const {
      hasReservation,
      name,
      phone,
      city,
      district,
      gender,
      ageGroup
    } = req.body;
    
    // 필수 필드 검증
    if (hasReservation === undefined || !name || !phone || !city || !district || !gender || !ageGroup) {
      return res.status(400).json({
        message: '모든 필수 필드를 입력해주세요.'
      });
    }
    
    // 기존 고객 검색 (이름 + 전화번호)
    const existingCustomer = await Customer.findOne({
      name,
      phone
    });
    
    let customerData = {
      hasReservation,
      name,
      phone,
      city,
      district,
      gender,
      ageGroup,
      visitDate: new Date(),
      visitTime: new Date()
    };
    
    if (existingCustomer) {
      // 기존 고객인 경우
      customerData.customerType = 'returning';
      customerData.assignedTo = existingCustomer.assignedTo;
      
      // 기존 담당자가 있으면 해당 담당자 호출
      if (existingCustomer.assignedTo) {
        // Socket.io를 통해 담당자 호출 알림
        req.app.get('io').emit('customer_call', {
          customerId: existingCustomer._id,
          customerName: name,
          assignedTo: existingCustomer.assignedTo,
          notificationType: 'returning_customer'
        });
      }
    } else {
      // 신규 고객인 경우
      customerData.customerType = 'walkin';
      
      // 워킹 순번에 따라 담당자 배정
      const availableStaff = await WorkingOrder.findOne({
        isActive: true,
        currentCustomers: { $lt: 3 } // 최대 3명까지 담당
      }).sort({ order: 1 });
      
      if (availableStaff) {
        customerData.assignedTo = availableStaff.staff;
        
        // 워킹 순번 업데이트
        await WorkingOrder.findByIdAndUpdate(availableStaff._id, {
          $inc: { currentCustomers: 1 }
        });
        
        // 담당자 호출 알림
        req.app.get('io').emit('customer_call', {
          customerId: null, // 아직 저장되지 않음
          customerName: name,
          assignedTo: availableStaff.staff,
          notificationType: 'new_customer'
        });
      }
    }
    
    const newCustomer = new Customer(customerData);
    await newCustomer.save();
    
    res.status(201).json({
      message: '고객이 성공적으로 등록되었습니다.',
      customer: {
        id: newCustomer._id,
        name: newCustomer.name,
        hasReservation: newCustomer.hasReservation,
        customerType: newCustomer.customerType,
        assignedTo: newCustomer.assignedTo
      }
    });
    
  } catch (error) {
    console.error('고객 등록 오류:', error);
    res.status(500).json({
      message: '고객 등록 중 오류가 발생했습니다.'
    });
  }
});

// 예약 고객 등록 (관리자용)
router.post('/reservation', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      phone,
      total,
      headquarters,
      team,
      assignedStaff,
      position,
      expectedVisitTime
    } = req.body;
    
    if (!name || !phone || !total || !headquarters || !team || !assignedStaff || !position) {
      return res.status(400).json({
        message: '모든 필수 필드를 입력해주세요.'
      });
    }
    
    // 담당자 찾기
    const assignedUser = await User.findOne({
      name: assignedStaff,
      total,
      headquarters,
      team
    });
    
    if (!assignedUser) {
      return res.status(400).json({
        message: '담당자를 찾을 수 없습니다.'
      });
    }
    
    const reservationCustomer = new Customer({
      hasReservation: true,
      name,
      phone,
      customerType: 'reserved',
      assignedTo: assignedUser._id,
      reservationInfo: {
        total,
        headquarters,
        team,
        assignedStaff,
        position,
        expectedVisitTime: expectedVisitTime ? new Date(expectedVisitTime) : null
      }
    });
    
    await reservationCustomer.save();
    
    res.status(201).json({
      message: '예약 고객이 성공적으로 등록되었습니다.',
      customer: reservationCustomer
    });
    
  } catch (error) {
    console.error('예약 고객 등록 오류:', error);
    res.status(500).json({
      message: '예약 고객 등록 중 오류가 발생했습니다.'
    });
  }
});

// 고객 검색 (이름 + 전화번호)
router.get('/search', async (req, res) => {
  try {
    const { name, phone } = req.query;
    
    if (!name || !phone) {
      return res.status(400).json({
        message: '이름과 전화번호를 모두 입력해주세요.'
      });
    }
    
    const customer = await Customer.findOne({
      name,
      phone
    }).populate('assignedTo', 'name total headquarters team position');
    
    if (!customer) {
      return res.status(404).json({
        message: '해당 고객을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      customer: {
        id: customer._id,
        name: customer.name,
        hasReservation: customer.hasReservation,
        customerType: customer.customerType,
        assignedTo: customer.assignedTo,
        visitDate: customer.visitDate
      }
    });
    
  } catch (error) {
    console.error('고객 검색 오류:', error);
    res.status(500).json({
      message: '고객 검색 중 오류가 발생했습니다.'
    });
  }
});

// 고객 상태 업데이트 (담당자 확인)
router.put('/:customerId/confirm', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.body;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        message: '고객을 찾을 수 없습니다.'
      });
    }
    
    // 담당자 본인만 확인 가능
    if (customer.assignedTo.toString() !== req.user.userId) {
      return res.status(403).json({
        message: '담당자만 고객을 확인할 수 있습니다.'
      });
    }
    
    customer.status = status || 'meeting';
    customer.notificationConfirmed = true;
    await customer.save();
    
    // Socket.io를 통해 상태 업데이트 알림
    req.app.get('io').emit('customer_status_update', {
      customerId,
      status: customer.status,
      confirmedBy: req.user.userId,
      timestamp: new Date()
    });
    
    res.json({
      message: '고객 상태가 업데이트되었습니다.',
      customer: {
        id: customer._id,
        status: customer.status,
        notificationConfirmed: customer.notificationConfirmed
      }
    });
    
  } catch (error) {
    console.error('고객 상태 업데이트 오류:', error);
    res.status(500).json({
      message: '고객 상태 업데이트 중 오류가 발생했습니다.'
    });
  }
});

// 고객 목록 조회 (관리자용)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, date, status } = req.query;
    
    let query = {};
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.visitDate = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    if (status) {
      query.status = status;
    }
    
    const customers = await Customer.find(query)
      .populate('assignedTo', 'name total headquarters team position')
      .sort({ visitDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Customer.countDocuments(query);
    
    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('고객 목록 조회 오류:', error);
    res.status(500).json({
      message: '고객 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;