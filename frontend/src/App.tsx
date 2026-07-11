import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VisitorPortal from './components/Visitor/VisitorPortal';
import StaffPortal from './components/Staff/StaffPortal';

export const App: React.FC = () => {
  const [currentPortal, setCurrentPortal] = useState<'visitor' | 'staff'>('visitor');
  const [isStaffEnabled, setIsStaffEnabled] = useState(false);

  // Check URL queries on mount to identify if user has access to administration panel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('staff') === 'true') {
      setIsStaffEnabled(true);
    } else {
      setIsStaffEnabled(false);
      // Force fallback to visitor portal if param is absent
      setCurrentPortal('visitor');
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      {/* Universal navigation header */}
      <Header 
        currentPortal={currentPortal} 
        onPortalChange={setCurrentPortal} 
        isStaffEnabled={isStaffEnabled} 
      />

      {/* Main portal layout */}
      <main style={{ flex: 1 }}>
        {currentPortal === 'visitor' ? (
          <VisitorPortal />
        ) : (
          <StaffPortal />
        )}
      </main>

      {/* Shinto bottom footer */}
      <footer className="no-print" style={{ 
        backgroundColor: 'var(--color-urushi)', 
        color: '#ffffff', 
        padding: '2rem 0', 
        textAlign: 'center', 
        borderTop: '3px solid var(--color-gold)',
        fontSize: '0.85rem'
      }}>
        <div className="container">
          <h3 style={{ 
            fontFamily: 'var(--font-serif)', 
            color: 'var(--color-gold)', 
            fontSize: '1.2rem', 
            letterSpacing: '0.15em',
            marginBottom: '0.5rem'
          }}>
            清 瀧 神 社
          </h3>
          <p style={{ color: 'var(--color-accent-gray)', margin: '0 0 0.75rem 0' }}>
            〒279-0041 千葉県浦安市堀江4-1-5　|　TEL 047-351-5417
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <a 
              href="https://seiryuujinja.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--color-gold)', textDecoration: 'none', borderBottom: '1px solid rgba(178,147,86,0.3)', paddingBottom: '0.1rem', fontSize: '0.8rem' }}
            >
              清瀧神社 公式ホームページに戻る
            </a>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.3)' }}>
            &copy; {new Date().getFullYear()} 清瀧神社. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
export default App;
