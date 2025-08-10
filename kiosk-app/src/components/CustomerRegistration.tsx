import React, { useState } from 'react';
import axios from 'axios';
import './CustomerRegistration.css';

interface CustomerData {
  hasReservation: boolean;
  name: string;
  phone: string;
  city: string;
  district: string;
  gender: '남' | '여';
  ageGroup: '10대' | '20대' | '30대' | '40대' | '50대' | '60대' | '70대' | '80대' | '90대';
}

const CustomerRegistration: React.FC = () => {
  const [customerData, setCustomerData] = useState<CustomerData>({
    hasReservation: false,
    name: '',
    phone: '',
    city: '',
    district: '',
    gender: '남',
    ageGroup: '30대'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const cities = ['서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시'];
  const districts = ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'];

  const handleInputChange = (field: keyof CustomerData, value: any) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerData.name || !customerData.phone || !customerData.city || !customerData.district) {
      setMessage('모든 필수 항목을 입력해주세요.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:3000/api/customers/register', customerData);
      
      setMessage('고객이 성공적으로 등록되었습니다!');
      setMessageType('success');
      
      // 폼 초기화
      setCustomerData({
        hasReservation: false,
        name: '',
        phone: '',
        city: '',
        district: '',
        gender: '남',
        ageGroup: '30대'
      });
      
      // 3초 후 메시지 제거
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error: any) {
      setMessage(error.response?.data?.message || '고객 등록 중 오류가 발생했습니다.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="customer-registration">
      <h2>고객 방문 등록</h2>
      
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-group">
          <label>예약 여부 *</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="hasReservation"
                checked={customerData.hasReservation === true}
                onChange={() => handleInputChange('hasReservation', true)}
              />
              예약함
            </label>
            <label>
              <input
                type="radio"
                name="hasReservation"
                checked={customerData.hasReservation === false}
                onChange={() => handleInputChange('hasReservation', false)}
              />
              예약 안함
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="name">이름 *</label>
          <input
            type="text"
            id="name"
            value={customerData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="고객 이름을 입력하세요"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">연락처 *</label>
          <input
            type="tel"
            id="phone"
            value={customerData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="010-0000-0000"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">시 *</label>
            <select
              id="city"
              value={customerData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              required
            >
              <option value="">시를 선택하세요</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="district">구 *</label>
            <select
              id="district"
              value={customerData.district}
              onChange={(e) => handleInputChange('district', e.target.value)}
              required
            >
              <option value="">구를 선택하세요</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gender">성별 *</label>
            <select
              id="gender"
              value={customerData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              required
            >
              <option value="남">남</option>
              <option value="여">여</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ageGroup">연령대 *</label>
            <select
              id="ageGroup"
              value={customerData.ageGroup}
              onChange={(e) => handleInputChange('ageGroup', e.target.value)}
              required
            >
              <option value="10대">10대</option>
              <option value="20대">20대</option>
              <option value="30대">30대</option>
              <option value="40대">40대</option>
              <option value="50대">50대</option>
              <option value="60대">60대</option>
              <option value="70대">70대</option>
              <option value="80대">80대</option>
              <option value="90대">90대</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? '등록 중...' : '고객 등록'}
        </button>
      </form>
    </div>
  );
};

export default CustomerRegistration;