import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, ListFilter, Settings, Plus, X, Lock, Key } from 'lucide-react';
import type { Booking } from '../../types';
import Dashboard from './Dashboard';
import CalendarView from './CalendarView';
import BookingsList from './BookingsList';
import SettingsView from './SettingsView';
import YomifudaPrint from './YomifudaPrint';
import ReceiptPrint from './ReceiptPrint';

export const StaffPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'list' | 'settings'>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Security - PIN code authorization
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');

  // Print Preview Selection states
  const [selectedYomifuda, setSelectedYomifuda] = useState<Booking | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(null);

  // Manual Booking Add Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualType, setManualType] = useState<'individual' | 'organization'>('individual');
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('09:30');
  const [manualPrayer1, setManualPrayer1] = useState('家内安全');
  const [manualPrayer2, setManualPrayer2] = useState('');
  const [manualHatsuhoryo, setManualHatsuhoryo] = useState(5000);
  const [manualAttendingCount, setManualAttendingCount] = useState(1);
  const [manualName, setManualName] = useState('');
  const [manualKana, setManualKana] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  
  // Org fields
  const [manualCompanyName, setManualCompanyName] = useState('');
  const [manualCompanyKana, setManualCompanyKana] = useState('');
  const [manualCompanyAddress, setManualCompanyAddress] = useState('');
  const [manualRepName, setManualRepName] = useState('');
  const [manualStaffName, setManualStaffName] = useState('');
  const [manualStaffPhone, setManualStaffPhone] = useState('');
  const [manualStaffEmail, setManualStaffEmail] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/bookings');
      if (!res.ok) throw new Error('予約一覧の取得に失敗しました。');
      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message || '接続エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // Only fetch when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  // Handle manual pricing sync in staff manual form
  useEffect(() => {
    if (manualType === 'individual') {
      const isSpecial = ['初宮詣（お宮参り）', '七五三詣', '車祓（お車のお祓い）'].includes(manualPrayer1);
      setManualHatsuhoryo(isSpecial ? 10000 : 5000);
    } else {
      setManualHatsuhoryo(manualAttendingCount < 5 ? 20000 : 30000);
    }
  }, [manualPrayer1, manualType, manualAttendingCount]);

  // Close administration portal completely (remove query parameter)
  const handleExitPortal = () => {
    window.location.href = window.location.origin;
  };

  // Authenticate staff with PIN
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode === '5417') {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('暗証番号が正しくありません。');
      setPinCode('');
    }
  };

  const handleAddManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDate || !manualTime || !manualPrayer1) return;

    const payload: Booking = {
      booking_type: manualType,
      booking_date: manualDate,
      booking_time: manualTime,
      prayer1: manualPrayer1,
      prayer2: manualType === 'organization' ? manualPrayer2 || undefined : undefined,
      hatsuhoryo: manualHatsuhoryo,
      payment_status: 'unpaid',
      attending_count: manualAttendingCount,
      
      name: manualType === 'individual' ? manualName : undefined,
      kana: manualType === 'individual' ? manualKana : undefined,
      address: manualType === 'individual' ? manualAddress : undefined,
      phone: manualType === 'individual' ? manualPhone : undefined,
      email: manualType === 'individual' ? manualEmail : undefined,
      
      company_name: manualType === 'organization' ? manualCompanyName : undefined,
      company_kana: manualType === 'organization' ? manualCompanyKana : undefined,
      company_address: manualType === 'organization' ? manualCompanyAddress : undefined,
      representative_title_name: manualType === 'organization' ? manualRepName : undefined,
      staff_dept_title_name: manualType === 'organization' ? manualStaffName : undefined,
      staff_phone: manualType === 'organization' ? manualStaffPhone : undefined,
      staff_email: manualType === 'organization' ? manualStaffEmail : undefined,
      
      wants_receipt: 0
    };

    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '手動登録に失敗しました。');
      }

      setShowAddForm(false);
      setManualDate('');
      setManualName('');
      setManualCompanyName('');
      setManualRepName('');
      setManualStaffName('');
      setManualPhone('');
      
      fetchBookings();
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 1. Protection gate: Render PIN Login if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '4rem 0' }} className="no-print">
        <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="card kamidana-border" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-mizuiro-light)',
              color: 'var(--color-mizuiro)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Lock size={24} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>神社職員認証</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-accent-gray)', marginBottom: '1.5rem' }}>
              管理画面を表示するには暗証番号を入力してください。
            </p>

            <form onSubmit={handlePinSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <input
                  type="password"
                  className="form-control"
                  placeholder="暗証番号を入力 (4桁)"
                  value={pinCode}
                  maxLength={4}
                  onChange={(e) => setPinCode(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: '0.2em', border: '1px solid var(--color-gold)' }}
                  autoFocus
                  required
                />
              </div>

              {pinError && (
                <p style={{ color: '#d3381c', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                  {pinError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={handleExitPortal} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}>
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.5rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}>
                  <Key size={14} />
                  認証する
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="container">
        
        {/* Navigation Toolbar */}
        <div className="no-print" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid var(--color-border)', 
          paddingBottom: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Tabs switch */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="btn btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'dashboard' ? 'var(--color-mizuiro)' : 'transparent',
                color: activeTab === 'dashboard' ? '#ffffff' : 'var(--color-urushi)',
                borderColor: 'var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <LayoutDashboard size={16} />
              ダッシュボード
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className="btn btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'calendar' ? 'var(--color-mizuiro)' : 'transparent',
                color: activeTab === 'calendar' ? '#ffffff' : 'var(--color-urushi)',
                borderColor: 'var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Calendar size={16} />
              社務カレンダー
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className="btn btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'list' ? 'var(--color-mizuiro)' : 'transparent',
                color: activeTab === 'list' ? '#ffffff' : 'var(--color-urushi)',
                borderColor: 'var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <ListFilter size={16} />
              予約台帳一覧
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="btn btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'settings' ? 'var(--color-mizuiro)' : 'transparent',
                color: activeTab === 'settings' ? '#ffffff' : 'var(--color-urushi)',
                borderColor: 'var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Settings size={16} />
              予約枠上限設定
            </button>
          </div>

          {/* Quick manual booking add button */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setShowAddForm(true)} 
              className="btn btn-primary" 
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} />
              電話受付（手動登録）
            </button>
            <button
              onClick={handleExitPortal}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
            >
              <X size={16} />
              管理画面を閉じる
            </button>
          </div>
        </div>

        {/* LOADING & ERROR STATES */}
        {loading && <p style={{ color: 'var(--color-accent-gray)' }} className="no-print">データを読み込み中...</p>}
        {error && <p style={{ color: '#d3381c' }} className="no-print">エラー: {error}</p>}

        {/* MOCK POPUP FOR TELEPHONE BOOKING MANUAL ADD */}
        {showAddForm && (
          <div className="no-print" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            padding: '1rem',
            overflowY: 'auto'
          }}>
            <div className="card washi-bg" style={{ 
              maxWidth: '650px', 
              width: '100%', 
              margin: '2rem 0',
              padding: '1.5rem', 
              border: '2px solid var(--color-gold)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)' }}>電話受付の新規手動登録</h4>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddManualBooking}>
                <div className="form-group">
                  <label>祈祷区分</label>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                    <label className="checkbox-label">
                      <input type="radio" checked={manualType === 'individual'} onChange={() => setManualType('individual')} />
                      個人のご祈祷
                    </label>
                    <label className="checkbox-label">
                      <input type="radio" checked={manualType === 'organization'} onChange={() => setManualType('organization')} />
                      団体（企業）のご祈祷
                    </label>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>希望参拝日 <span className="required">*</span></label>
                    <input type="date" className="form-control" value={manualDate} onChange={(e) => setManualDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>希望時間割 <span className="required">*</span></label>
                    <select className="form-control" value={manualTime} onChange={(e) => setManualTime(e.target.value)} required>
                      {['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>主願意 <span className="required">*</span></label>
                    {manualType === 'individual' ? (
                      <select className="form-control" value={manualPrayer1} onChange={(e) => setManualPrayer1(e.target.value)} required>
                        {['家内安全', '厄年のお祓い', '八方除け', '除災招福（開運招福）', '方位除け', '安産祈願', '初宮詣（お宮参り）', '七五三詣', '車祓（お車のお祓い）', '商売繁盛', '病気平癒', '合格祈願', '学業成就', '心願成就', '神恩感謝（お礼参り）', '十三参り', '神棚のお祓い（御霊入れ）', '成人祝い', '寿祝い'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    ) : (
                      <select className="form-control" value={manualPrayer1} onChange={(e) => setManualPrayer1(e.target.value)} required>
                        {['社運隆昌', '商売繁盛', '交通安全', '職場安全', '社内安全', '安全祈願', '工事安全', '作業安全', '営業繫栄', '必勝祈願'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {manualType === 'organization' && (
                    <div className="form-group">
                      <label>副願意</label>
                      <select className="form-control" value={manualPrayer2} onChange={(e) => setManualPrayer2(e.target.value)}>
                        <option value="">-- なし --</option>
                        {['社運隆昌', '商売繁盛', '交通安全', '職場安全', '社内安全', '安全祈願', '工事安全', '作業安全', '営業繫栄', '必勝祈願'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>参列予定人数 <span className="required">*</span></label>
                    <input type="number" className="form-control" min="1" value={manualAttendingCount} onChange={(e) => setManualAttendingCount(Math.max(1, parseInt(e.target.value) || 1))} required />
                  </div>
                  <div className="form-group">
                    <label>初穂料 (目安自動判定)</label>
                    <input type="number" className="form-control" value={manualHatsuhoryo} onChange={(e) => setManualHatsuhoryo(parseInt(e.target.value) || 0)} style={{ fontWeight: 'bold' }} />
                  </div>
                </div>

                <div className="shimenawa-divider" style={{ margin: '1rem 0' }} />

                {manualType === 'individual' ? (
                  // Individual fields
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>氏名 <span className="required">*</span></label>
                        <input type="text" className="form-control" value={manualName} onChange={(e) => setManualName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>フリガナ <span className="required">*</span></label>
                        <input type="text" className="form-control" value={manualKana} onChange={(e) => setManualKana(e.target.value)} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>住所 <span className="required">*</span></label>
                      <input type="text" className="form-control" value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} required />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>電話番号 <span className="required">*</span></label>
                        <input type="tel" className="form-control" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>メールアドレス</label>
                        <input type="email" className="form-control" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
                      </div>
                    </div>
                  </>
                ) : (
                  // Organization fields
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>企業・団体名 <span className="required">*</span></label>
                        <input type="text" className="form-control" value={manualCompanyName} onChange={(e) => setManualCompanyName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>フリガナ <span className="required">*</span></label>
                        <input type="text" className="form-control" value={manualCompanyKana} onChange={(e) => setManualCompanyKana(e.target.value)} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>所在地 <span className="required">*</span></label>
                      <input type="text" className="form-control" value={manualCompanyAddress} onChange={(e) => setManualCompanyAddress(e.target.value)} required />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>代表者役職氏名 <span className="required">*</span></label>
                        <input type="text" className="form-control" value={manualRepName} onChange={(e) => setManualRepName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>申込担当者部署役職氏名 <span className="required">*</span></label>
                        <input type="text" className="form-control" value={manualStaffName} onChange={(e) => setManualStaffName(e.target.value)} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>担当者電話番号 <span className="required">*</span></label>
                        <input type="tel" className="form-control" value={manualStaffPhone} onChange={(e) => setManualStaffPhone(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>担当者メールアドレス</label>
                        <input type="email" className="form-control" value={manualStaffEmail} onChange={(e) => setManualStaffEmail(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                    閉じる
                  </button>
                  <button type="submit" className="btn btn-primary">
                    登録する
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ACTIVE SUBPORTAL COMPONENT DISPLAY */}
        <div className="no-print">
          {activeTab === 'dashboard' && <Dashboard bookings={bookings} />}
          
          {activeTab === 'calendar' && (
            <CalendarView 
              bookings={bookings} 
              onRefreshBookings={fetchBookings} 
            />
          )}

          {activeTab === 'list' && (
            <BookingsList
              bookings={bookings}
              onRefresh={fetchBookings}
              onSelectYomifuda={setSelectedYomifuda}
              onSelectReceipt={setSelectedReceipt}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}
        </div>

        {/* PRINT MODAL OVERLAYS */}
        {selectedYomifuda && (
          <YomifudaPrint 
            booking={selectedYomifuda} 
            onClose={() => setSelectedYomifuda(null)} 
          />
        )}

        {selectedReceipt && (
          <ReceiptPrint 
            booking={selectedReceipt} 
            onClose={() => setSelectedReceipt(null)} 
          />
        )}

      </div>
    </div>
  );
};
export default StaffPortal;
