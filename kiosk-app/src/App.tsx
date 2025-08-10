import React, { useState } from 'react';
import './App.css';
import CustomerRegistration from './components/CustomerRegistration';
import CustomerSearch from './components/CustomerSearch';

function App() {
  const [currentView, setCurrentView] = useState<'registration' | 'search'>('registration');

  return (
    <div className="App">
      <header className="App-header">
        <h1>인포매니저</h1>
        <p>고객 방문 관리 시스템</p>
      </header>
      
      <nav className="App-nav">
        <button 
          className={currentView === 'registration' ? 'active' : ''}
          onClick={() => setCurrentView('registration')}
        >
          고객 등록
        </button>
        <button 
          className={currentView === 'search' ? 'active' : ''}
          onClick={() => setCurrentView('search')}
        >
          고객 검색
        </button>
      </nav>
      
      <main className="App-main">
        {currentView === 'registration' ? (
          <CustomerRegistration />
        ) : (
          <CustomerSearch />
        )}
      </main>
      
      <footer className="App-footer">
        <p>&copy; 2024 인포매니저 - 발명자: 오정주</p>
      </footer>
    </div>
  );
}

export default App;