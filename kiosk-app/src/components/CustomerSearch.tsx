import React, { useState } from 'react';
import axios from 'axios';
import './CustomerSearch.css';

interface Customer {
  id: string;
  name: string;
  hasReservation: boolean;
  customerType: string;
  assignedTo: {
    name: string;
    total: string;
    headquarters: string;
    team: string;
    position: string;
  };
  visitDate: string;
}

const CustomerSearch: React.FC = () => {
  const [searchData, setSearchData] = useState({
    name: '',
    phone: ''
  });
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleInputChange = (field: 'name' | 'phone', value: string) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchData.name || !searchData.phone) {
      setMessage('이름과 연락처를 모두 입력해주세요.');
      setMessageType('error');
      return;
    }

    setIsSearching(true);
    setMessage('');
    setCustomer(null);

    try {
      const response = await axios.get('http://localhost:3000/api/customers/search', {
        params: searchData
      });
      
      setCustomer(response.data.customer);
      setMessage('고객을 찾았습니다!');
      setMessageType('success');
      
      // 3초 후 메시지 제거
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error: any) {
      if (error.response?.status === 404) {
        setMessage('해당 고객을 찾을 수 없습니다. 신규 고객으로 등록해주세요.');
        setMessageType('error');
      } else {
        setMessage(error.response?.data?.message || '고객 검색 중 오류가 발생했습니다.');
        setMessageType('error');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="customer-search">
      <h2>고객 검색</h2>
      
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="form-group">
          <label htmlFor="searchName">이름 *</label>
          <input
            type="text"
            id="searchName"
            value={searchData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="고객 이름을 입력하세요"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="searchPhone">연락처 *</label>
          <input
            type="tel"
            id="searchPhone"
            value={searchData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="010-0000-0000"
            required
          />
        </div>

        <button 
          type="submit" 
          className="search-btn"
          disabled={isSearching}
        >
          {isSearching ? '검색 중...' : '고객 검색'}
        </button>
      </form>

      {customer && (
        <div className="customer-result">
          <h3>고객 정보</h3>
          <div className="customer-info">
            <div className="info-row">
              <span className="label">이름:</span>
              <span className="value">{customer.name}</span>
            </div>
            <div className="info-row">
              <span className="label">예약 여부:</span>
              <span className="value">
                {customer.hasReservation ? '예약함' : '예약 안함'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">고객 유형:</span>
              <span className="value">
                {customer.customerType === 'reserved' && '예약 고객'}
                {customer.customerType === 'walkin' && '워킹 고객'}
                {customer.customerType === 'returning' && '재방문 고객'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">방문일:</span>
              <span className="value">{formatDate(customer.visitDate)}</span>
            </div>
            
            {customer.assignedTo && (
              <>
                <div className="info-row">
                  <span className="label">담당자:</span>
                  <span className="value">{customer.assignedTo.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">소속:</span>
                  <span className="value">
                    {customer.assignedTo.total} - {customer.assignedTo.headquarters} - {customer.assignedTo.team}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">직함:</span>
                  <span className="value">{customer.assignedTo.position}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="notification-info">
            <p>담당자에게 고객 방문 알림이 전송되었습니다.</p>
            <p>담당자가 확인할 때까지 잠시 기다려주세요.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;