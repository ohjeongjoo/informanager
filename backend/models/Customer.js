const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // 예약 여부 (필수)
  hasReservation: {
    type: Boolean,
    required: true
  },
  
  // 고객 기본 정보
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['남', '여'],
    required: true
  },
  ageGroup: {
    type: String,
    enum: ['10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대'],
    required: true
  },
  
  // 방문 정보
  visitDate: {
    type: Date,
    default: Date.now
  },
  visitTime: {
    type: Date,
    default: Date.now
  },
  
  // 담당자 정보
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 고객 유형
  customerType: {
    type: String,
    enum: ['reserved', 'walkin', 'returning'],
    default: 'walkin'
  },
  
  // 예약 정보 (예약 고객인 경우)
  reservationInfo: {
    total: String,
    headquarters: String,
    team: String,
    assignedStaff: String,
    position: String,
    expectedVisitTime: Date
  },
  
  // 상태 관리
  status: {
    type: String,
    enum: ['waiting', 'meeting', 'completed'],
    default: 'waiting'
  },
  
  // 알림 상태
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationConfirmed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 전화번호로 고객 검색을 위한 인덱스
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 1, phone: 1 });

module.exports = mongoose.model('Customer', customerSchema);