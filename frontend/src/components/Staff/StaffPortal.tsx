import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, ListFilter, Settings, Plus, X, Lock, Key } from 'lucide-react';
import type { Booking } from '../../types';
import Dashboard from './Dashboard';
import CalendarView from './CalendarView';
import BookingsList from './BookingsList';
import SettingsView from './SettingsView';
import YomifudaPrint from './YomifudaPrint';
import ReceiptPrint from './ReceiptPrint';

// Era helper to display dates in both Japanese Wareki and Western AD
const getEraString = (y: number) => {
  if (y >= 2019) {
    const reiwa = y - 2018;
    const term = y === 2019 ? '令和元年 (平成31年)' : `令和${reiwa}年`;
    return `${term} / ${y}年`;
  } else if (y >= 1989) {
    const heisei = y - 1988;
    const term = y === 1989 ? '平成元年 (昭和64年)' : `平成${heisei}年`;
    return `${term} / ${y}年`;
  } else if (y >= 1926) {
    const showa = y - 1925;
    const term = y === 1926 ? '昭和元年 (大正15年)' : `昭和${showa}年`;
    return `${term} / ${y}年`;
  } else if (y >= 1912) {
    const taisho = y - 1911;
    const term = y === 1912 ? '大正元年 (明治45年)' : `大正${taisho}年`;
    return `${term} / ${y}年`;
  } else {
    const meiji = y - 1867;
    const term = y === 1868 ? '明治元年' : `明治${meiji}年`;
    return `${term} / ${y}年`;
  }
};

// Synthesize a clean shrine bell chime using Web Audio API
function playBellSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Polyphonic high frequency sine oscillators mimicking metallic bell ring
    const frequencies = [2200, 2600, 3100, 3900];
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq + 30, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(freq - 30, now + 0.3);
      
      gain.gain.setValueAtTime(idx === 0 ? 0.25 : 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3 + (idx * 0.15));
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.8);
    });
  } catch (err) {
    console.error('Failed to play bell sound:', err);
  }
}

// Fire system notification on desktop
function sendDesktopNotification(booking: Booking) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    const isIndiv = booking.booking_type === 'individual';
    const name = isIndiv ? booking.name : booking.company_name;
    new Notification('【清瀧神社】新しいご祈祷予約', {
      body: `日時: ${booking.booking_date} ${booking.booking_time}\n名前: ${name} 様\n願意: ${booking.prayer1}`,
      icon: window.location.origin + '/logo.png'
    });
  }
}

// Convert VAPID key to Uint8Array for PushManager subscribe applicationServerKey parameter
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe user browser to background Web Push notifications
async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Web Push is not supported in this browser.');
    return;
  }

  try {
    // 1. Register sw.js Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[Service Worker] SW registered successfully:', registration);

    // 2. Request browser permission to show desktop popups
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied by user.');
      return;
    }

    // 3. Get VAPID Public key from server settings endpoint
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const keyRes = await fetch(`${apiUrl}/api/notifications/vapid-key`);
    if (!keyRes.ok) throw new Error('VAPID key endpoint error');
    const { publicKey } = await keyRes.json();

    if (!publicKey) {
      console.warn('No VAPID public key returned from backend.');
      return;
    }

    // 4. Register browser push sub key
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    console.log('[Push Manager] Subscribed subscription details:', subscription);

    // 5. Send registration payload back to backend database
    const subRes = await fetch(`${apiUrl}/api/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription })
    });

    if (subRes.ok) {
      console.log('[Web Push Service] Subscription successfully registered on backend.');
    } else {
      console.error('[Web Push Service] Failed to register subscription payload.');
    }
  } catch (err) {
    console.error('[Web Push Service Error] SW/Push registration failed:', err);
  }
}

export const StaffPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'list' | 'settings'>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastMaxId, setLastMaxId] = useState<number | null>(null);

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
  const [manualAttendingCount, setManualAttendingCount] = useState<number | ''>(1);
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
  const [manualHasPastPrayer, setManualHasPastPrayer] = useState<number>(0);
  const [manualNotes, setManualNotes] = useState('');

  // お祝いのお子様情報 (初宮・七五三用)
  const [manualIsTwin, setManualIsTwin] = useState(false);
  const [manualChildName, setManualChildName] = useState('');
  const [manualChildKana, setManualChildKana] = useState('');
  const [manualBirthYear, setManualBirthYear] = useState('');
  const [manualBirthMonth, setManualBirthMonth] = useState('');
  const [manualBirthDay, setManualBirthDay] = useState('');

  const [manualChildName2, setManualChildName2] = useState('');
  const [manualChildKana2, setManualChildKana2] = useState('');
  const [manualBirthYear2, setManualBirthYear2] = useState('');
  const [manualBirthMonth2, setManualBirthMonth2] = useState('');
  const [manualBirthDay2, setManualBirthDay2] = useState('');

  const [manualUserBirthYear, setManualUserBirthYear] = useState('');
  const [manualUserBirthMonth, setManualUserBirthMonth] = useState('');
  const [manualUserBirthDay, setManualUserBirthDay] = useState('');

  // 初宮詣の双子の場合に15000円へ、それ以外は通常価格へ自動セット
  useEffect(() => {
    if (manualType === 'individual') {
      if (manualPrayer1 === '初宮詣（お宮参り）') {
        setManualHatsuhoryo(manualIsTwin ? 15000 : 10000);
      } else if (manualPrayer1 === '七五三詣') {
        setManualHatsuhoryo(5000);
      }
    }
  }, [manualPrayer1, manualIsTwin, manualType]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings`);
      if (!res.ok) throw new Error('予約一覧の取得に失敗しました。');
      const data = await res.json();
      setBookings(data);
      
      // Initialize lastMaxId with the current highest booking ID to prevent alert spam on load
      if (data.length > 0 && lastMaxId === null) {
        const maxId = Math.max(...data.map((b: Booking) => b.id || 0));
        setLastMaxId(maxId);
      }
    } catch (err: any) {
      setError(err.message || '接続エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // Register Service Worker and subscribe to Web Push on mount
  useEffect(() => {
    subscribeUserToPush();
  }, []);

  // Set up 30-second automated polling for new bookings when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/bookings`);
        if (res.ok) {
          const data = await res.json();
          
          // Detect new entries using lastMaxId boundary
          if (data.length > 0 && lastMaxId !== null) {
            const newBookings = data.filter((b: Booking) => b.id && b.id > lastMaxId);
            if (newBookings.length > 0) {
              playBellSound();
              newBookings.forEach((b: Booking) => {
                sendDesktopNotification(b);
              });
            }
          }
          
          // Seed/update maximum ID tracker
          if (data.length > 0) {
            const maxId = Math.max(...data.map((b: Booking) => b.id || 0));
            setLastMaxId(maxId);
          }
          
          setBookings(data);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, lastMaxId]);

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
      setManualHatsuhoryo(Number(manualAttendingCount) < 5 ? 20000 : 30000);
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
      attending_count: manualAttendingCount === '' ? 1 : manualAttendingCount,
      
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
      
      wants_receipt: 0,
      has_past_prayer: manualHasPastPrayer,
      is_twin: manualIsTwin ? 1 : 0,
      is_manual: 1,
      notes: (() => {
        const userBday = manualUserBirthYear && manualUserBirthMonth && manualUserBirthDay
          ? `【生年月日】${getEraString(Number(manualUserBirthYear)).split(' / ')[0]} (${manualUserBirthYear}-${manualUserBirthMonth.padStart(2, '0')}-${manualUserBirthDay.padStart(2, '0')})`
          : '';
        if (manualNotes && userBday) return `${manualNotes}\n${userBday}`;
        return manualNotes || userBday || undefined;
      })(),
      child_name: manualType === 'individual' ? manualChildName || undefined : undefined,
      child_kana: manualType === 'individual' ? manualChildKana || undefined : undefined,
      child_birthday: manualType === 'individual' && manualBirthYear && manualBirthMonth && manualBirthDay
        ? `${manualBirthYear}-${manualBirthMonth.padStart(2, '0')}-${manualBirthDay.padStart(2, '0')}`
        : undefined,
      child_name2: manualType === 'individual' && manualIsTwin ? manualChildName2 || undefined : undefined,
      child_kana2: manualType === 'individual' && manualIsTwin ? manualChildKana2 || undefined : undefined,
      child_birthday2: manualType === 'individual' && manualIsTwin && manualBirthYear2 && manualBirthMonth2 && manualBirthDay2
        ? `${manualBirthYear2}-${manualBirthMonth2.padStart(2, '0')}-${manualBirthDay2.padStart(2, '0')}`
        : undefined
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([payload]) // Wrap in array as API expects batch payloads
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
      setManualHasPastPrayer(0);
      setManualNotes('');
      setManualIsTwin(false);
      setManualChildName('');
      setManualChildKana('');
      setManualBirthYear('');
      setManualBirthMonth('');
      setManualBirthDay('');
      setManualChildName2('');
      setManualChildKana2('');
      setManualBirthYear2('');
      setManualBirthMonth2('');
      setManualBirthDay2('');
      
      setManualUserBirthYear('');
      setManualUserBirthMonth('');
      setManualUserBirthDay('');
      
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
                      {['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* リアルタイム空き状況確認ミニカレンダービューア */}
                {manualDate && (
                  <div style={{
                    backgroundColor: '#faf7f0',
                    border: '1px solid var(--color-gold)',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-urushi)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📅 {manualDate} の時間枠別空き状況 (予約件数 / 最大8枠)</span>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                      gap: '0.4rem',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      paddingRight: '0.2rem'
                    }}>
                      {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(t => {
                        const count = bookings.filter(b => b.booking_date === manualDate && b.booking_time === t && Number(b.is_cancelled) === 0).length;
                        const isFull = count >= 8;
                        const isSelected = manualTime === t;
                        
                        let btnBg = '#ffffff';
                        let btnColor = 'var(--color-urushi)';
                        let btnBorder = '1px solid var(--color-border)';
                        
                        if (isSelected) {
                          btnBg = 'var(--color-mizuiro)';
                          btnColor = '#ffffff';
                          btnBorder = '1px solid var(--color-mizuiro)';
                        } else if (isFull) {
                          btnBg = '#fff1f0';
                          btnColor = '#f5222d';
                          btnBorder = '1px solid #ffa39e';
                        }
                        
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => !isFull && setManualTime(t)}
                            disabled={isFull && !isSelected}
                            style={{
                              backgroundColor: btnBg,
                              color: btnColor,
                              border: btnBorder,
                              borderRadius: '2px',
                              padding: '0.3rem 0.5rem',
                              fontSize: '0.75rem',
                              cursor: isFull && !isSelected ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span>{t}</span>
                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                              {isFull ? '満席' : `${count}件/8`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={manualAttendingCount}
                      onChange={(e) => setManualAttendingCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                      onBlur={() => { if (manualAttendingCount === '') setManualAttendingCount(1); }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>初穂料 (目安自動判定)</label>
                    <input type="number" className="form-control" value={manualHatsuhoryo} onChange={(e) => setManualHatsuhoryo(parseInt(e.target.value) || 0)} style={{ fontWeight: 'bold' }} />
                  </div>
                </div>

                {/* 過去祈祷歴チェックボックス */}
                <div className="form-group" style={{ margin: '0.75rem 0 1.25rem 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={manualHasPastPrayer === 1}
                      onChange={(e) => setManualHasPastPrayer(e.target.checked ? 1 : 0)}
                    />
                    <span>過去に清瀧神社でご祈祷（お祓い）を受けたことがある</span>
                  </label>
                </div>

                <div className="shimenawa-divider" style={{ margin: '1rem 0' }} />

                {manualType === 'individual' ? (
                  // Individual fields
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>氏名 <span className="required">*</span></label>
                        <div style={{ fontSize: '0.7rem', color: '#d3381c', margin: '0.1rem 0 0.3rem 0', lineHeight: '1.3' }}>
                          ※お札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（吉や𠮷、高や髙、邊や邉、斉や齊や齋、瀬や瀨、柳や栁、等々）
                        </div>
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
                        <input type="email" className="form-control" placeholder="例：email@example.com" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                      <label>ご祈祷される方の生年月日 <span className="required">*</span></label>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select className="form-control" style={{ width: '180px' }} value={manualUserBirthYear} onChange={(e) => setManualUserBirthYear(e.target.value)} required>
                          <option value="">-- 年 (和暦/西暦) --</option>
                          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y.toString()}>{getEraString(y)}</option>
                          ))}
                        </select>
                        <select className="form-control" style={{ width: '90px' }} value={manualUserBirthMonth} onChange={(e) => setManualUserBirthMonth(e.target.value)} required>
                          <option value="">-- 月 --</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m.toString()}>{m}月</option>
                          ))}
                        </select>
                        <select className="form-control" style={{ width: '90px' }} value={manualUserBirthDay} onChange={(e) => setManualUserBirthDay(e.target.value)} required>
                          <option value="">-- 日 --</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                            <option key={d} value={d.toString()}>{d}日</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* お子様情報入力欄 (初宮詣または七五三詣のみ) */}
                    {(manualPrayer1 === '初宮詣（お宮参り）' || manualPrayer1 === '七五三詣') && (() => {
                      const currentYear = new Date().getFullYear();
                      const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - i);
                      return (
                        <div className="alert-warning" style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', border: '1px solid rgba(197, 160, 89, 0.25)', borderRadius: '2px' }}>
                          <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>お子様の登録情報 (手動登録)</h5>
                          
                          {manualPrayer1 === '初宮詣（お宮参り）' && (
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                                <input
                                  type="checkbox"
                                  checked={manualIsTwin}
                                  onChange={(e) => {
                                    setManualIsTwin(e.target.checked);
                                    if (!e.target.checked) {
                                      setManualChildName2('');
                                      setManualChildKana2('');
                                      setManualBirthYear2('');
                                      setManualBirthMonth2('');
                                      setManualBirthDay2('');
                                    }
                                  }}
                                />
                                <span>双子のご祈祷（お二人分）を希望する</span>
                              </label>
                            </div>
                          )}

                          <div style={{ border: '1px solid rgba(197, 160, 89, 0.2)', padding: '0.75rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gold)', display: 'block', marginBottom: '0.5rem' }}>
                              {manualIsTwin ? 'お子様（一人目）' : 'お子様情報'}
                            </span>
                            <div className="form-row" style={{ marginBottom: '0.5rem' }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label>お子様の氏名 <span className="required">*</span></label>
                                <div style={{ fontSize: '0.7rem', color: '#d3381c', margin: '0.1rem 0 0.3rem 0', lineHeight: '1.3' }}>
                                  ※お札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（吉や𠮷、高や髙、邊や邉、斉や齊や齋、瀬や瀨、柳や栁、等々）
                                </div>
                                <input type="text" className="form-control" placeholder="例：清瀧 太郎" value={manualChildName} onChange={(e) => setManualChildName(e.target.value)} required />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label>お子様フリガナ <span className="required">*</span></label>
                                <input type="text" className="form-control" placeholder="例：セイリュウ タロウ" value={manualChildKana} onChange={(e) => setManualChildKana(e.target.value)} required />
                              </div>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                              <label>生年月日 <span className="required">*</span></label>
                              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <select className="form-control" style={{ width: '180px' }} value={manualBirthYear} onChange={(e) => setManualBirthYear(e.target.value)} required>
                                  <option value="">-- 年 (和暦/西暦) --</option>
                                  {yearOptions.map(y => (
                                    <option key={y} value={y.toString()}>{getEraString(y)}</option>
                                  ))}
                                </select>
                                <select className="form-control" style={{ width: '90px' }} value={manualBirthMonth} onChange={(e) => setManualBirthMonth(e.target.value)} required>
                                  <option value="">-- 月 --</option>
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m.toString()}>{m}月</option>
                                  ))}
                                </select>
                                <select className="form-control" style={{ width: '90px' }} value={manualBirthDay} onChange={(e) => setManualBirthDay(e.target.value)} required>
                                  <option value="">-- 日 --</option>
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d.toString()}>{d}日</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {manualIsTwin && (
                            <div style={{ border: '1px solid rgba(197, 160, 89, 0.2)', padding: '0.75rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gold)', display: 'block', marginBottom: '0.5rem' }}>
                                お子様（二人目）
                              </span>
                              <div className="form-row" style={{ marginBottom: '0.5rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                  <label>お子様の氏名 <span className="required">*</span></label>
                                  <input type="text" className="form-control" placeholder="例：清瀧 次郎" value={manualChildName2} onChange={(e) => setManualChildName2(e.target.value)} required />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                  <label>お子様フリガナ <span className="required">*</span></label>
                                  <input type="text" className="form-control" placeholder="例：セイリュウ ジロウ" value={manualChildKana2} onChange={(e) => setManualChildKana2(e.target.value)} required />
                                </div>
                              </div>

                              <div className="form-group" style={{ margin: 0 }}>
                                <label>生年月日 <span className="required">*</span></label>
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <select className="form-control" style={{ width: '180px' }} value={manualBirthYear2} onChange={(e) => setManualBirthYear2(e.target.value)} required>
                                    <option value="">-- 年 (和暦/西暦) --</option>
                                    {yearOptions.map(y => (
                                      <option key={y} value={y.toString()}>{getEraString(y)}</option>
                                    ))}
                                  </select>
                                  <select className="form-control" style={{ width: '90px' }} value={manualBirthMonth2} onChange={(e) => setManualBirthMonth2(e.target.value)} required>
                                    <option value="">-- 月 --</option>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                      <option key={m} value={m.toString()}>{m}月</option>
                                    ))}
                                  </select>
                                  <select className="form-control" style={{ width: '90px' }} value={manualBirthDay2} onChange={(e) => setManualBirthDay2(e.target.value)} required>
                                    <option value="">-- 日 --</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                      <option key={d} value={d.toString()}>{d}日</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  // Organization fields
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>企業・団体名 <span className="required">*</span></label>
                        <div style={{ fontSize: '0.7rem', color: '#d3381c', margin: '0.1rem 0 0.3rem 0', lineHeight: '1.3' }}>
                          ※お札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（吉や𠮷、高や髙、邊や邉、斉や齊や齋、瀬や瀨、柳や栁、等々）
                        </div>
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

                {/* 備考欄 (個人・団体共通) */}
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label style={{ fontWeight: 'bold' }}>備考（任意）</label>
                  <div style={{ fontSize: '0.75rem', color: '#d3381c', margin: '0.15rem 0 0.35rem 0', lineHeight: '1.4' }}>
                    ※お名前の漢字が入力できない方や、車椅子の方がご参列される予定の場合などの特記事項はこちらにご記入ください。
                  </div>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="例：お名前の漢字に外字（𠮷など）が含まれます。 / 当日は車椅子利用者が1名ご参列されます。"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    style={{ resize: 'vertical', width: '100%' }}
                  />
                </div>

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
