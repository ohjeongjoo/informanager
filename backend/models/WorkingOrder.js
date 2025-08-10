const mongoose = require('mongoose');

const workingOrderSchema = new mongoose.Schema({
  // 순번
  order: {
    type: Number,
    required: true,
    unique: true
  },
  
  // 담당자 정보
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 조직 정보
  total: {
    type: String,
    required: true
  },
  headquarters: {
    type: String,
    required: true
  },
  team: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  
  // 상태 관리
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 현재 담당 고객 수
  currentCustomers: {
    type: Number,
    default: 0
  },
  
  // 최대 담당 가능 고객 수
  maxCustomers: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

// 순번으로 정렬을 위한 인덱스
workingOrderSchema.index({ order: 1 });
workingOrderSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('WorkingOrder', workingOrderSchema);