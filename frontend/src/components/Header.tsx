import React from 'react';
import { User, ShieldCheck, ExternalLink } from 'lucide-react';

interface HeaderProps {
  currentPortal: 'visitor' | 'staff';
  onPortalChange: (portal: 'visitor' | 'staff') => void;
  isStaffEnabled: boolean;
}

// Header Component
export const Header: React.FC<HeaderProps> = ({ currentPortal, onPortalChange, isStaffEnabled }) => {
  return (
    <header className="no-print" style={{ backgroundColor: 'var(--color-urushi)', color: '#ffffff', padding: '1rem 0', borderBottom: '3px solid var(--color-gold)' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', margin: 0, letterSpacing: '0.05em', color: '#ffffff' }}>清瀧神社</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-gold)', margin: 0, fontFamily: 'var(--font-serif)', letterSpacing: '0.1em' }}>
              オンライン祈祷予約システム
            </p>
          </div>
        </div>

        {/* Navigation actions */}
        <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          
          <a 
            href="https://seiryuujinja.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              color: 'var(--color-border)',
              textDecoration: 'none',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.5rem 0.75rem',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '2px',
              marginRight: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            className="hover-gold-border"
          >
            清瀧神社 公式サイトへ
            <ExternalLink size={12} />
          </a>

          <button
            onClick={() => onPortalChange('visitor')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '2px',
              border: 'none',
              backgroundColor: currentPortal === 'visitor' ? 'var(--color-mizuiro)' : 'transparent',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-serif)',
              borderBottom: currentPortal === 'visitor' ? '2px solid var(--color-gold)' : '2px solid transparent'
            }}
          >
            <User size={16} />
            ご祈祷のご予約
          </button>

          {/* Render Staff Switch ONLY when queries authorized (?staff=true) */}
          {isStaffEnabled && (
            <button
              onClick={() => onPortalChange('staff')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '2px',
                border: 'none',
                backgroundColor: currentPortal === 'staff' ? 'var(--color-gold)' : 'transparent',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-serif)',
                borderBottom: currentPortal === 'staff' ? '2px solid #ffffff' : '2px solid transparent'
              }}
            >
              <ShieldCheck size={16} />
              神社管理画面
            </button>
          )}

        </nav>
      </div>
    </header>
  );
};
export default Header;
