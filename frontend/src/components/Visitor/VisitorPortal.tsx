import React, { useState, useEffect } from 'react';
import { User, Users, AlertCircle } from 'lucide-react';
import type { Booking } from '../../types';
import SlotSelector from './SlotSelector';
import BookingSuccess from './BookingSuccess';

const INDIVIDUAL_PRAYERS = [
  { value: '家内安全', price: 5000 },
  { value: '厄年のお祓い', price: 5000 },
  { value: '八方除け', price: 5000 },
  { value: '除災招福（開運招福）', price: 5000 },
  { value: '方位除け', price: 5000 },
  { value: '安産祈願', price: 5000 },
  { value: '初宮詣（お宮参り）', price: 10000 },
  { value: '七五三詣', price: 10000 },
  { value: '車祓（お車のお祓い）', price: 10000 },
  { value: '商売繁盛', price: 5000 },
  { value: '病気平癒', price: 5000 },
  { value: '合格祈願', price: 5000 },
  { value: '学業成就', price: 5000 },
  { value: '心願成就', price: 5000 },
  { value: '神恩感謝（お礼参り）', price: 5000 },
  { value: '十三参り', price: 5000 },
  { value: '神棚のお祓い（御霊入れ）', price: 5000 },
  { value: '成人祝い', price: 5000 },
  { value: '寿祝い', price: 5000 }
];

const ORGANIZATION_PRAYERS = [
  '社運隆昌',
  '商売繁盛',
  '交通安全',
  '職場安全',
  '社内安全',
  '安全祈願',
  '工事安全',
  '作業安全',
  '営業繫栄',
  '必勝祈願',
  'その他（自由入力）'
];

const LONGEVITY_TYPES = [
  '還暦（61歳）', '古希（70歳）', '喜寿（77歳）', '傘寿（80歳）',
  '米寿（88歳）', '卒寿（90歳）', '白寿（99歳）', '百寿（100歳）', 'その他'
];

export const VisitorPortal: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [bookingType, setBookingType] = useState<'individual' | 'organization'>('individual');
  
  // General Booking states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [prayer1, setPrayer1] = useState('');
  const [prayer2, setPrayer2] = useState('');
  const [hatsuhoryo, setHatsuhoryo] = useState(5000);
  const [attendingCount, setAttendingCount] = useState(1);

  // Individual Form fields
  const [name, setName] = useState('');
  const [kana, setKana] = useState('');
  const [address, setAddress] = useState('');
  const [addressKana, setAddressKana] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Individual Dynamic fields
  const [yakudoshiType, setYakudoshiType] = useState<'maeyaku' | 'honyaku' | 'atoyaku' | ''>('');
  const [fatherName, setFatherName] = useState('');
  const [fatherKana, setFatherKana] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherKana, setMotherKana] = useState('');
  const [childName, setChildName] = useState('');
  const [childKana, setChildKana] = useState('');
  const [childBirthday, setChildBirthday] = useState('');
  const [kotobukiType, setKotobukiType] = useState('');
  const [kotobukiOtherText, setKotobukiOtherText] = useState('');

  // Organization Form fields
  const [companyName, setCompanyName] = useState('');
  const [companyKana, setCompanyKana] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyAddressKana, setCompanyAddressKana] = useState('');
  const [representativeTitleName, setRepresentativeTitleName] = useState('');
  const [staffDeptTitleName, setStaffDeptTitleName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  
  // Organization Talisman
  const [talismanName, setTalismanName] = useState('');
  const [additionalTalismans, setAdditionalTalismans] = useState('');

  // Organization Receipt
  const [wantsReceipt, setWantsReceipt] = useState(false);
  const [receiptName, setReceiptName] = useState('');
  const [receiptAmount, setReceiptAmount] = useState(20000);

  // Organization Dynamic fields
  const [orgCustomPrayer1, setOrgCustomPrayer1] = useState('');
  const [orgCustomPrayer2, setOrgCustomPrayer2] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentSchedule, setTournamentSchedule] = useState('');
  const [constructionName, setConstructionName] = useState('');
  const [constructionDesigner, setConstructionDesigner] = useState('');
  const [constructionBuilder, setConstructionBuilder] = useState('');
  const [constructionPeriod, setConstructionPeriod] = useState('');

  // Submission Status
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Self Rescheduling / Cancel Status
  const [changeId, setChangeId] = useState<string | null>(null);
  const [targetBooking, setTargetBooking] = useState<Booking | null>(null);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccessMsg, setChangeSuccessMsg] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cId = params.get('changeId');
    if (cId) {
      setChangeId(cId);
      fetchTargetBooking(cId);
    }
  }, []);

  const fetchTargetBooking = async (id: string) => {
    setChangeLoading(true);
    setChangeError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings/${id}`);
      if (!res.ok) throw new Error('ご予約情報が見つかりません。すでにキャンセルされている可能性があります。');
      const data = await res.json();
      setTargetBooking(data);
    } catch (err: any) {
      setChangeError(err.message || '情報の読み込みに失敗しました。');
    } finally {
      setChangeLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!targetBooking || !targetBooking.id) return;
    if (!confirm('ご予約をキャンセルしてもよろしいですか？この操作は取り消せません。')) return;

    setChangeLoading(true);
    setChangeError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings/${targetBooking.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('キャンセル処理に失敗しました。');
      setChangeSuccessMsg('ご予約のキャンセル手続きが完了いたしました。またのご予約を心よりお待ちしております。');
      setTargetBooking(null);
    } catch (err: any) {
      setChangeError(err.message || '通信エラーが発生しました。');
    } finally {
      setChangeLoading(false);
    }
  };

  const handleRescheduleBooking = async () => {
    if (!targetBooking || !targetBooking.id || !newDate || !newTime) return;

    setChangeLoading(true);
    setChangeError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings/${targetBooking.id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_date: newDate, booking_time: newTime })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '日程の変更に失敗しました。');
      }

      setChangeSuccessMsg(`ご予約の日程変更手続きが完了いたしました。新しい日時: ${newDate} ${newTime}の回`);
      setTargetBooking(null);
      setIsRescheduling(false);
    } catch (err: any) {
      setChangeError(err.message || '通信エラーが発生しました。');
    } finally {
      setChangeLoading(false);
    }
  };

  // 1. Manage Hatsuhoryo changes based on willingness and organization headcount
  useEffect(() => {
    if (bookingType === 'individual') {
      const match = INDIVIDUAL_PRAYERS.find(p => p.value === prayer1);
      setHatsuhoryo(match ? match.price : 5000);
    } else {
      // Organization base pricing: under 5 people = 20k, 5 or more = 30k
      const basePrice = attendingCount < 5 ? 20000 : 30000;
      setHatsuhoryo(basePrice);
      // Auto sync receipt amount
      setReceiptAmount(basePrice);
    }
  }, [prayer1, bookingType, attendingCount]);

  // Sync Organization names to default receipt name
  useEffect(() => {
    if (bookingType === 'organization' && !receiptName) {
      setReceiptName(companyName);
    }
  }, [companyName, bookingType]);

  const handleBookingTypeChange = (type: 'individual' | 'organization') => {
    setBookingType(type);
    setPrayer1('');
    setPrayer2('');
    setSelectedTime('');
    setErrorMsg('');
  };

  const getActivePrayer1 = () => {
    if (bookingType === 'individual') return prayer1;
    return prayer1 === 'その他（自由入力）' ? orgCustomPrayer1 : prayer1;
  };

  const getActivePrayer2 = () => {
    if (bookingType === 'individual') return '';
    return prayer2 === 'その他（自由入力）' ? orgCustomPrayer2 : prayer2;
  };

  // Form Validation
  const validateForm = () => {
    if (!selectedDate || !selectedTime) {
      return 'ご参拝の希望日時を選択してください。';
    }
    if (!prayer1) {
      return '主願意を選択してください。';
    }
    if (bookingType === 'organization' && prayer1 === 'その他（自由入力）' && !orgCustomPrayer1.trim()) {
      return '自由入力の願意を記載してください。';
    }

    if (bookingType === 'individual') {
      if (!name.trim() || !kana.trim() || !address.trim() || !addressKana.trim() || !phone.trim() || !email.trim()) {
        return '必須のお名前・フリガナ・ご住所・電話番号・メールアドレスをご入力ください。';
      }
      if (prayer1 === '厄年のお祓い' && !yakudoshiType) {
        return '厄年区分（前厄・本厄・後厄）を選択してください。';
      }
      if ((prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣')) {
        if (!childName.trim() || !childKana.trim() || !childBirthday) {
          return 'お子様の氏名・フリガナ・生年月日を入力してください。';
        }
        if (!fatherName.trim() && !motherName.trim()) {
          return 'ご両親の氏名はいずれか一方の入力が必須です。';
        }
        if (fatherName.trim() && !fatherKana.trim()) {
          return '父親氏名のフリガナを入力してください。';
        }
        if (motherName.trim() && !motherKana.trim()) {
          return '母親氏名のフリガナを入力してください。';
        }
      }
      if (prayer1 === '寿祝い') {
        if (!kotobukiType) return '長寿祝いの区分を選択してください。';
        if (kotobukiType === 'その他' && !kotobukiOtherText.trim()) {
          return 'その他のお祝い内容をご記入ください。';
        }
      }
    } else {
      // Organization validation
      if (!companyName.trim() || !companyKana.trim() || !companyAddress.trim() || !companyAddressKana.trim() || 
          !representativeTitleName.trim() || !staffDeptTitleName.trim() || !staffPhone.trim() || !staffEmail.trim()) {
        return '企業情報（企業名・所在地・代表者・担当者氏名・連絡先等）をすべてご入力ください。';
      }
      if (wantsReceipt && (!receiptName.trim() || receiptAmount <= 0)) {
        return '領収証の発行に必要な宛名および金額を正しくご入力ください。';
      }
      
      const p1 = getActivePrayer1();
      const p2 = getActivePrayer2();
      const needsVictory = p1 === '必勝祈願' || p2 === '必勝祈願';
      const needsConstruction = p1 === '工事安全' || p2 === '工事安全';

      if (needsVictory && (!tournamentName.trim() || !tournamentSchedule.trim())) {
        return '必勝祈願に伴う大会名称および大会日程をご入力ください。';
      }
      if (needsConstruction && (!constructionName.trim() || !constructionDesigner.trim() || !constructionBuilder.trim() || !constructionPeriod.trim())) {
        return '工事安全祈願に伴う工事名称・設計監理者名・施工者名・工期をすべてご入力ください。';
      }
    }
    return '';
  };

  const handleNextStep = () => {
    const error = validateForm();
    if (error) {
      setErrorMsg(error);
      window.scrollTo(0, 0);
      return;
    }
    setErrorMsg('');
    setStep(3);
    window.scrollTo(0, 0);
  };

  // Submit Reservation
  const handleSubmitBooking = async () => {
    setSubmitting(true);
    setErrorMsg('');
    
    const p1 = getActivePrayer1();
    const p2 = getActivePrayer2();

    const payload: Booking = {
      booking_type: bookingType,
      booking_date: selectedDate,
      booking_time: selectedTime,
      prayer1: p1,
      prayer2: bookingType === 'organization' ? p2 : undefined,
      hatsuhoryo,
      payment_status: 'unpaid',
      attending_count: attendingCount,
      
      name: bookingType === 'individual' ? name : undefined,
      kana: bookingType === 'individual' ? kana : undefined,
      address: bookingType === 'individual' ? address : undefined,
      address_kana: bookingType === 'individual' ? addressKana : undefined,
      phone: bookingType === 'individual' ? phone : undefined,
      email: bookingType === 'individual' ? email : undefined,
      
      company_name: bookingType === 'organization' ? companyName : undefined,
      company_kana: bookingType === 'organization' ? companyKana : undefined,
      company_address: bookingType === 'organization' ? companyAddress : undefined,
      company_address_kana: bookingType === 'organization' ? companyAddressKana : undefined,
      representative_title_name: bookingType === 'organization' ? representativeTitleName : undefined,
      staff_dept_title_name: bookingType === 'organization' ? staffDeptTitleName : undefined,
      staff_phone: bookingType === 'organization' ? staffPhone : undefined,
      staff_email: bookingType === 'organization' ? staffEmail : undefined,
      
      talisman_name: bookingType === 'organization' ? (talismanName || companyName) : undefined,
      additional_talismans: bookingType === 'organization' ? additionalTalismans : undefined,
      
      wants_receipt: bookingType === 'organization' ? (wantsReceipt ? 1 : 0) : 0,
      receipt_name: bookingType === 'organization' && wantsReceipt ? receiptName : undefined,
      receipt_amount: bookingType === 'organization' && wantsReceipt ? receiptAmount : undefined,

      yakudoshi_type: bookingType === 'individual' && prayer1 === '厄年のお祓い' ? yakudoshiType : undefined,
      
      father_name: bookingType === 'individual' && (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? fatherName : undefined,
      father_kana: bookingType === 'individual' && (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? fatherKana : undefined,
      mother_name: bookingType === 'individual' && (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? motherName : undefined,
      mother_kana: bookingType === 'individual' && (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? motherKana : undefined,
      child_name: bookingType === 'individual' && (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? childName : undefined,
      child_kana: bookingType === 'individual' && (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? childKana : undefined,
      child_birthday: bookingType === 'individual' && (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? childBirthday : undefined,

      kotobuki_type: bookingType === 'individual' && prayer1 === '寿祝い' ? kotobukiType : undefined,
      kotobuki_other_text: bookingType === 'individual' && prayer1 === '寿祝い' && kotobukiType === 'その他' ? kotobukiOtherText : undefined,

      tournament_name: bookingType === 'organization' && (p1 === '必勝祈願' || p2 === '必勝祈願') ? tournamentName : undefined,
      tournament_schedule: bookingType === 'organization' && (p1 === '必勝祈願' || p2 === '必勝祈願') ? tournamentSchedule : undefined,

      construction_name: bookingType === 'organization' && (p1 === '工事安全' || p2 === '工事安全') ? constructionName : undefined,
      construction_designer: bookingType === 'organization' && (p1 === '工事安全' || p2 === '工事安全') ? constructionDesigner : undefined,
      construction_builder: bookingType === 'organization' && (p1 === '工事安全' || p2 === '工事安全') ? constructionBuilder : undefined,
      construction_period: bookingType === 'organization' && (p1 === '工事安全' || p2 === '工事安全') ? constructionPeriod : undefined
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '予約の登録に失敗しました。');
      }

      const created = await res.json();
      setCreatedBooking(created);
      setStep(4);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setErrorMsg(err.message || '通信エラーが発生しました。時間をおいて再度お試しください。');
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedDate('');
    setSelectedTime('');
    setPrayer1('');
    setPrayer2('');
    setAttendingCount(1);
    setName('');
    setKana('');
    setAddress('');
    setAddressKana('');
    setPhone('');
    setEmail('');
    setYakudoshiType('');
    setFatherName('');
    setFatherKana('');
    setMotherName('');
    setMotherKana('');
    setChildName('');
    setChildKana('');
    setChildBirthday('');
    setKotobukiType('');
    setKotobukiOtherText('');
    setCompanyName('');
    setCompanyKana('');
    setCompanyAddress('');
    setCompanyAddressKana('');
    setRepresentativeTitleName('');
    setStaffDeptTitleName('');
    setStaffPhone('');
    setStaffEmail('');
    setTalismanName('');
    setAdditionalTalismans('');
    setWantsReceipt(false);
    setReceiptName('');
    setOrgCustomPrayer1('');
    setOrgCustomPrayer2('');
    setTournamentName('');
    setTournamentSchedule('');
    setConstructionName('');
    setConstructionDesigner('');
    setConstructionBuilder('');
    setConstructionPeriod('');
    setCreatedBooking(null);
    setErrorMsg('');
  };

  if (step === 4 && createdBooking) {
    return <BookingSuccess booking={createdBooking} onReset={handleReset} />;
  }

  // Self Reschedule / Cancel View
  if (changeId) {
    return (
      <div style={{ padding: '3rem 0' }}>
        <div className="container" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <div className="card kamidana-border" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
              ご予約の日程変更・キャンセル
            </h3>

            {changeLoading && <p style={{ color: 'var(--color-accent-gray)', textAlign: 'center' }}>処理中...</p>}
            {changeError && (
              <p style={{ color: '#d3381c', backgroundColor: '#fdf3f2', padding: '0.75rem', border: '1px solid #ffa39e', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                エラー: {changeError}
              </p>
            )}

            {changeSuccessMsg ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <p style={{ color: 'var(--color-accent-green)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '2rem' }}>
                  {changeSuccessMsg}
                </p>
                <button 
                  onClick={() => { window.location.href = window.location.origin; }} 
                  className="btn btn-primary"
                >
                  トップページへ戻る
                </button>
              </div>
            ) : (
              targetBooking && (
                <div>
                  <div style={{ backgroundColor: 'var(--color-washi-dark)', border: '1px solid var(--color-border)', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}><strong>お名前:</strong> {targetBooking.booking_type === 'individual' ? targetBooking.name : targetBooking.company_name} 様</p>
                    <p style={{ margin: '0 0 0.5rem 0' }}><strong>ご祈祷:</strong> {targetBooking.prayer1}</p>
                    <p style={{ margin: 0 }}><strong>現在のご希望日時:</strong> {targetBooking.booking_date} {targetBooking.booking_time}の回</p>
                  </div>

                  {!isRescheduling ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                      <button 
                        onClick={() => {
                          setNewDate(targetBooking.booking_date);
                          setNewTime('');
                          setIsRescheduling(true);
                        }} 
                        className="btn btn-primary"
                        style={{ padding: '0.75rem' }}
                      >
                        ご希望日時を変更する
                      </button>
                      <button 
                        onClick={handleCancelBooking} 
                        className="btn btn-secondary"
                        style={{ padding: '0.75rem', color: '#d3381c', borderColor: '#ffa39e', backgroundColor: '#fdf3f2' }}
                      >
                        ご予約をキャンセルする
                      </button>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                      <h4 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>新しい希望日時を選択してください</h4>
                      <SlotSelector
                        selectedDate={newDate}
                        onDateChange={setNewDate}
                        selectedTime={newTime}
                        onTimeChange={setNewTime}
                      />

                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button 
                          onClick={() => setIsRescheduling(false)} 
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          戻る
                        </button>
                        <button 
                          onClick={handleRescheduleBooking} 
                          className="btn btn-primary"
                          disabled={!newDate || !newTime}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          日程を変更する
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="container">
        
        {/* Step Indicator */}
        <div className="no-print" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '2rem', 
          marginBottom: '2rem',
          fontFamily: 'var(--font-serif)',
          fontSize: '0.95rem'
        }}>
          <span style={{ 
            color: step === 1 ? 'var(--color-mizuiro)' : 'var(--color-accent-gray)', 
            fontWeight: step === 1 ? 'bold' : 'normal',
            borderBottom: step === 1 ? '2px solid var(--color-mizuiro)' : 'none',
            paddingBottom: '0.25rem'
          }}>1. 祈祷区分の選択</span>
          <span style={{ 
            color: step === 2 ? 'var(--color-mizuiro)' : 'var(--color-accent-gray)', 
            fontWeight: step === 2 ? 'bold' : 'normal',
            borderBottom: step === 2 ? '2px solid var(--color-mizuiro)' : 'none',
            paddingBottom: '0.25rem'
          }}>2. 予約情報の入力</span>
          <span style={{ 
            color: step === 3 ? 'var(--color-mizuiro)' : 'var(--color-accent-gray)', 
            fontWeight: step === 3 ? 'bold' : 'normal',
            borderBottom: step === 3 ? '2px solid var(--color-mizuiro)' : 'none',
            paddingBottom: '0.25rem'
          }}>3. 入力内容の確認</span>
        </div>

        {errorMsg && (
          <div className="no-print" style={{ 
            backgroundColor: '#fdf3f2', 
            border: '1px solid var(--color-mizuiro)', 
            color: 'var(--color-mizuiro)', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={18} />
            <strong>入力エラー:</strong> {errorMsg}
          </div>
        )}

        {/* STEP 1: SELECT BOOKING TYPE */}
        {step === 1 && (
          <div className="card kamidana-border" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
              ご祈祷区分の選択
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-accent-gray)', textAlign: 'center', marginBottom: '2rem' }}>
              ご予約される祈祷の区分をご選択ください。
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  handleBookingTypeChange('individual');
                  setStep(2);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '2.5rem 1rem',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#ffffff',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                }}
                className="hover-gold-border"
              >
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  backgroundColor: 'rgba(211, 56, 28, 0.05)', 
                  color: 'var(--color-mizuiro)', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <User size={24} />
                </div>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-urushi)' }}>個人のご祈祷</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.5rem', textAlign: 'center' }}>
                  厄除、安産、初宮詣、七五三、車祓い、家内安全など
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleBookingTypeChange('organization');
                  setStep(2);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '2.5rem 1rem',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#ffffff',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  backgroundColor: 'rgba(197, 160, 89, 0.08)', 
                  color: 'var(--color-gold)', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Users size={24} />
                </div>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-urushi)' }}>団体（企業）のご祈祷</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.5rem', textAlign: 'center' }}>
                  社運隆昌、商売繁盛、職場安全、工事安全、必勝祈願など
                </span>
              </button>
            </div>
            
            <div className="shimenawa-divider" />
            
            <div style={{ fontSize: '0.85rem', color: 'var(--color-accent-gray)', lineHeight: '1.6' }}>
              <p>※団体・企業ご参拝の方は、ご予約確定後に準備等について神社担当者より折り返しのご連絡を差し上げます。</p>
              <p>※ご不明な点がございましたら、清瀧神社TEL 047-351-5417 までお問い合わせください。</p>
            </div>
          </div>
        )}

        {/* STEP 2: FILL IN RESERVATION FORM */}
        {step === 2 && (
          <form style={{ maxWidth: '800px', margin: '0 auto' }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
            
            {/* Header info */}
            <div className="card kamidana-border">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', margin: 0 }}>
                  {bookingType === 'individual' ? '個人のご祈祷 予約フォーム' : '団体（企業）のご祈祷 予約フォーム'}
                </h3>
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  戻る
                </button>
              </div>

              {/* DATE & TIME SELECTOR */}
              <SlotSelector
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedTime={selectedTime}
                onTimeChange={setSelectedTime}
              />
            </div>

            {/* PRAYER SELECTION */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>
                ご祈祷の願意（お願いごと）
              </h4>
              
              {bookingType === 'individual' ? (
                // Individual willing select (Max 1)
                <div className="form-group">
                  <label>主願意 <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={prayer1}
                    onChange={(e) => setPrayer1(e.target.value)}
                    style={{ border: '1px solid var(--color-gold)' }}
                  >
                    <option value="">-- 選択してください --</option>
                    {INDIVIDUAL_PRAYERS.map(p => (
                      <option key={p.value} value={p.value}>{p.value}</option>
                    ))}
                  </select>
                </div>
              ) : (
                // Organization willing select (Max 2 + custom text)
                <div className="grid-2">
                  <div className="form-group">
                    <label>主願意 <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={prayer1}
                      onChange={(e) => { setPrayer1(e.target.value); setOrgCustomPrayer1(''); }}
                      style={{ border: '1px solid var(--color-gold)' }}
                    >
                      <option value="">-- 選択してください --</option>
                      {ORGANIZATION_PRAYERS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    {prayer1 === 'その他（自由入力）' && (
                      <input
                        type="text"
                        placeholder="主願意を手入力してください"
                        className="form-control"
                        style={{ marginTop: '0.5rem' }}
                        value={orgCustomPrayer1}
                        onChange={(e) => setOrgCustomPrayer1(e.target.value)}
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label>副願意 （任意・2つ目）</label>
                    <select
                      className="form-control"
                      value={prayer2}
                      onChange={(e) => { setPrayer2(e.target.value); setOrgCustomPrayer2(''); }}
                      style={{ border: '1px solid var(--color-gold)' }}
                    >
                      <option value="">-- なし --</option>
                      {ORGANIZATION_PRAYERS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    {prayer2 === 'その他（自由入力）' && (
                      <input
                        type="text"
                        placeholder="副願意を手入力してください"
                        className="form-control"
                        style={{ marginTop: '0.5rem' }}
                        value={orgCustomPrayer2}
                        onChange={(e) => setOrgCustomPrayer2(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Sub-forms for Individual willing */}
              {bookingType === 'individual' && prayer1 === '厄年のお祓い' && (
                <div className="form-group alert-warning" style={{ margin: '1rem 0 0 0' }}>
                  <label style={{ fontWeight: 'bold' }}>厄年区分をご選択ください <span className="required">*</span></label>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                    {['maeyaku', 'honyaku', 'atoyaku'].map((type) => {
                      const label = type === 'maeyaku' ? '前厄' : type === 'honyaku' ? '本厄' : '後厄';
                      return (
                        <label key={type} className="checkbox-label">
                          <input
                            type="radio"
                            name="yakudoshi"
                            value={type}
                            checked={yakudoshiType === type}
                            onChange={() => setYakudoshiType(type as any)}
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {bookingType === 'individual' && (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') && (
                <div className="alert-warning" style={{ margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>お子様およびご両親の登録情報</h5>
                  
                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>お祝いのお子様の氏名 <span className="required">*</span></label>
                      <input type="text" className="form-control" placeholder="例：清瀧 太郎" value={childName} onChange={(e) => setChildName(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>お子様フリガナ <span className="required">*</span></label>
                      <input type="text" className="form-control" placeholder="例：きよたき たろう" value={childKana} onChange={(e) => setChildKana(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>お子様の生年月日 <span className="required">*</span></label>
                    <input type="date" className="form-control" style={{ maxWidth: '240px' }} value={childBirthday} onChange={(e) => setChildBirthday(e.target.value)} />
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', borderTop: '1px solid rgba(197, 160, 89, 0.3)', paddingTop: '0.5rem' }}>
                    ※ご両親の氏名は片親のみの入力（いずれか一方のみ）でもご予約いただけます。
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>父親の氏名</label>
                      <input type="text" className="form-control" placeholder="例：清瀧 健二" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>父親氏名フリガナ</label>
                      <input type="text" className="form-control" placeholder="例：きよたき けんじ" value={fatherKana} onChange={(e) => setFatherKana(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>母親の氏名</label>
                      <input type="text" className="form-control" placeholder="例：清瀧 花子" value={motherName} onChange={(e) => setMotherName(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>母親氏名フリガナ</label>
                      <input type="text" className="form-control" placeholder="例：きよたき はなこ" value={motherKana} onChange={(e) => setMotherKana(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {bookingType === 'individual' && prayer1 === '寿祝い' && (
                <div className="form-group alert-warning" style={{ margin: '1rem 0 0 0' }}>
                  <label style={{ fontWeight: 'bold' }}>長寿祝いの区分 <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={kotobukiType}
                    onChange={(e) => { setKotobukiType(e.target.value); setKotobukiOtherText(''); }}
                    style={{ maxWidth: '300px', marginTop: '0.5rem' }}
                  >
                    <option value="">-- 選択してください --</option>
                    {LONGEVITY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {kotobukiType === 'その他' && (
                    <input
                      type="text"
                      placeholder="長寿祝いの内容をご記入ください (例: 傘寿祝い)"
                      className="form-control"
                      style={{ marginTop: '0.5rem', maxWidth: '400px' }}
                      value={kotobukiOtherText}
                      onChange={(e) => setKotobukiOtherText(e.target.value)}
                    />
                  )}
                </div>
              )}

              {/* Dynamic Sub-forms for Organization willing */}
              {bookingType === 'organization' && (getActivePrayer1() === '必勝祈願' || getActivePrayer2() === '必勝祈願') && (
                <div className="alert-warning" style={{ margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>必勝祈願 詳細情報</h5>
                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>大会名称 <span className="required">*</span></label>
                      <input type="text" className="form-control" placeholder="例：第108回 全国甲子園大会" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>大会日程 <span className="required">*</span></label>
                      <input type="text" className="form-control" placeholder="例：令和8年8月5日〜" value={tournamentSchedule} onChange={(e) => setTournamentSchedule(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {bookingType === 'organization' && (getActivePrayer1() === '工事安全' || getActivePrayer2() === '工事安全') && (
                <div className="alert-warning" style={{ margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>工事安全祈願 詳細情報</h5>
                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>工事名称 <span className="required">*</span></label>
                      <input type="text" className="form-control" placeholder="例：〇〇ビル新築工事" value={constructionName} onChange={(e) => setConstructionName(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>設計監理者名 <span className="required">*</span></label>
                      <input type="text" className="form-control" placeholder="例：〇〇設計事務所" value={constructionDesigner} onChange={(e) => setConstructionDesigner(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>施工者名 <span className="required">*</span></label>
                      <input type="text" className="form-control" placeholder="例：〇〇建設株式会社" value={constructionBuilder} onChange={(e) => setConstructionBuilder(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>工期 <span className="required">*</span></label>
                      <input type="text" className="form-control" placeholder="例：令和8年10月〜令和9年6月" value={constructionPeriod} onChange={(e) => setConstructionPeriod(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Show Amulet base prices (Text display only) */}
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-accent-gray)', fontWeight: 500 }}>お初穂料のご案内</span>
                <div style={{ fontSize: '1.25rem', color: 'var(--color-mizuiro)', fontWeight: 'bold', fontFamily: 'var(--font-serif)', marginTop: '0.25rem' }}>
                  {hatsuhoryo.toLocaleString()} 円以上 （お気持ち、当日現金納め）
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.25rem' }}>
                  {bookingType === 'individual' 
                    ? '※選択された願意の基準額です。のし袋か封筒などに包み、ご持参ください。' 
                    : '※団体参拝は5名未満は20,000円以上、5名以上は30,000円以上のお気持ちとさせていただいております。'}
                </p>
              </div>
            </div>

            {/* VISITOR/ORGANIZATION DETAILS FORM */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>
                ご予約者様のご連絡先情報
              </h4>

              {bookingType === 'individual' ? (
                // Individual Fields
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>ご本人の氏名 <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：清瀧 太郎"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>フリガナ <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：きよたき たろう"
                        value={kana}
                        onChange={(e) => setKana(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>ご住所 <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：千葉県浦安市堀江4-1-5"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>住所フリガナ <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：うらやすしほりえ"
                        value={addressKana}
                        onChange={(e) => setAddressKana(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>携帯（または自宅）電話番号 <span className="required">*</span></label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="例：090-0000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>メールアドレス <span className="required">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="例：your-email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ maxWidth: '200px' }}>
                    <label>参列予定人数 <span className="required">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={attendingCount}
                      onChange={(e) => setAttendingCount(Math.max(1, parseInt(e.target.value) || 1))}
                      required
                    />
                  </div>
                </>
              ) : (
                // Organization Fields
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>会社・団体名 <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：清瀧株式会社"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>会社名フリガナ <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：きよたきかぶしきがいしゃ"
                        value={companyKana}
                        onChange={(e) => setCompanyKana(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>お札に書かれるお名前 （お札に墨書きする正式名称）</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="未入力の場合は会社名が入ります。例: 清瀧株式会社 代表取締役 清瀧太郎"
                      value={talismanName}
                      onChange={(e) => setTalismanName(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>会社所在地 <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：千葉県浦安市堀江4-1-5"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>所在地フリガナ <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：うらやすしほりえ"
                        value={companyAddressKana}
                        onChange={(e) => setCompanyAddressKana(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>団体（企業）代表者 役職・氏名 <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：代表取締役社長 清瀧太郎"
                        value={representativeTitleName}
                        onChange={(e) => setRepresentativeTitleName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>申込担当者 部署・役職・氏名 <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：総務部 課長 浦安次郎"
                        value={staffDeptTitleName}
                        onChange={(e) => setStaffDeptTitleName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>申込担当者宛の電話番号 <span className="required">*</span></label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="例：047-351-5417"
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>メールアドレス <span className="required">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="例：staff@example.com"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ maxWidth: '200px' }}>
                      <label>参列予定人数 <span className="required">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={attendingCount}
                        onChange={(e) => setAttendingCount(Math.max(1, parseInt(e.target.value) || 1))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>追加で希望される守札（お札・お守り）</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：交通安全守 10体、厄除守 2体 (当日追加精算)"
                        value={additionalTalismans}
                        onChange={(e) => setAdditionalTalismans(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Receipt Options */}
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <label className="checkbox-label" style={{ marginBottom: wantsReceipt ? '0.75rem' : '0' }}>
                      <input
                        type="checkbox"
                        checked={wantsReceipt}
                        onChange={(e) => setWantsReceipt(e.target.checked)}
                      />
                      領収証の発行を希望する
                    </label>

                    {wantsReceipt && (
                      <div className="form-row alert-warning" style={{ margin: 0, padding: '1rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>領収証の宛名 <span className="required">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            value={receiptName}
                            onChange={(e) => setReceiptName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>領収証の金額 (円) <span className="required">*</span></label>
                          <input
                            type="number"
                            className="form-control"
                            min="1"
                            value={receiptAmount}
                            onChange={(e) => setReceiptAmount(Math.max(1, parseInt(e.target.value) || 0))}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* WARNINGS & PRE-SUBMIT NOTES */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--color-mizuiro)', fontFamily: 'var(--font-serif)' }}>
                参拝当日のご案内とお願い （ご一読ください）
              </h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-urushi-light)', lineHeight: '1.6' }}>
                <p>・ご祈祷の準備の関係上、**開始時刻の15分前**にはご来社いただきますようお願いいたします。</p>
                <p style={{ color: '#d3381c', fontWeight: 'bold' }}>・ご祈祷の開始時刻5分前を過ぎるとその時間のご祈祷は受け付けない場合がございます、ご了承願います。</p>
                <p style={{ color: '#d3381c', fontWeight: 'bold' }}>・カメラマンの方は、神社社殿へのお立ち入りはご遠慮いただきます。</p>
                <p>・お初穂料はご神前にお供えいたしますので、のし袋か封筒などに入れご持参ください。</p>
                <p>・ご祈祷の所要時間は、約20〜30分ほどかかります。</p>
                <p>・神社で恒例祭典等の行事があります場合、ご予約がお受けできない日時がございます。</p>
                <p>・ご一緒に参拝（昇殿）いただくご家族等の人数制限は設けておりません。</p>

                {/* Conditional dynamically rendered notes */}
                {prayer1 === '車祓（お車のお祓い）' && (
                  <p style={{ color: 'var(--color-mizuiro)', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    ※車祓（お車のお祓い）の方は、お車を駐車場に停めず、神社正面の鳥居をくぐり、参道に停車していただきますようお願いいたします。
                  </p>
                )}
                {prayer1 === '安産祈願' && (
                  <p style={{ color: 'var(--color-accent-green)', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    ※安産祈願の方は、すでにお持ちの腹帯（妊婦帯）をご持参いただけますと、ご神前にてお祓いいたします。当日受付の際、職員へお渡しください。
                  </p>
                )}
                {bookingType === 'organization' && (
                  <p style={{ color: 'var(--color-accent-orange)', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    ※【団体祈祷限定】予約が完了次第、お申込内容を確認の上、担当より折り返し確認のご連絡を差し上げます。
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                区分選択に戻る
              </button>
              <button type="submit" className="btn btn-primary">
                確認画面へ進む
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: CONFIRM RESERVATION INFO */}
        {step === 3 && (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div className="card kamidana-border">
              <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem', textAlign: 'center' }}>
                ご入力内容の確認
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                  <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>ご祈祷の種類</span>
                  <span style={{ fontWeight: 'bold' }}>{bookingType === 'individual' ? '個人のご祈祷' : '団体（企業）のご祈祷'}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                  <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>ご参拝日時</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-mizuiro)' }}>{selectedDate}　{selectedTime}の回</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                  <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>主願意</span>
                  <span style={{ fontWeight: 'bold' }}>{getActivePrayer1()}</span>
                </div>
                {bookingType === 'organization' && getActivePrayer2() && (
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>副願意</span>
                    <span style={{ fontWeight: 'bold' }}>{getActivePrayer2()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                  <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>お初穂料</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-mizuiro)' }}>{hatsuhoryo.toLocaleString()} 円以上 (当日お気持ち)</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                  <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>参列予定人数</span>
                  <span style={{ fontWeight: 'bold' }}>{attendingCount} 名</span>
                </div>

                {/* Individual Details */}
                {bookingType === 'individual' ? (
                  <>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>お名前 (フリガナ)</span>
                      <span>{name} 様 ({kana})</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>ご住所 (フリガナ)</span>
                      <span>{address} ({addressKana})</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>電話番号</span>
                      <span>{phone}</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>メールアドレス</span>
                      <span>{email}</span>
                    </div>
                    
                    {prayer1 === '厄年のお祓い' && yakudoshiType && (
                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', backgroundColor: '#fff9e6', padding: '0.5rem' }}>
                        <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>厄年区分</span>
                        <span style={{ fontWeight: 'bold' }}>{yakudoshiType === 'maeyaku' ? '前厄' : yakudoshiType === 'honyaku' ? '本厄' : '後厄'}</span>
                      </div>
                    )}
                    {childName && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#fcfbf7', padding: '0.75rem', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-gold)' }}>お子様・ご両親情報</div>
                        <div>お子様名: {childName} 様 ({childKana})</div>
                        <div>生年月日: {childBirthday}</div>
                        {fatherName && <div>父親: {fatherName} ({fatherKana})</div>}
                        {motherName && <div>母親: {motherName} ({motherKana})</div>}
                      </div>
                    )}
                    {prayer1 === '寿祝い' && kotobukiType && (
                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', backgroundColor: '#fff9e6', padding: '0.5rem' }}>
                        <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>寿祝い区分</span>
                        <span style={{ fontWeight: 'bold' }}>{kotobukiType === 'その他' ? kotobukiOtherText : kotobukiType}</span>
                      </div>
                    )}
                  </>
                ) : (
                  // Organization Details
                  <>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>会社・団体名</span>
                      <span>{companyName} ({companyKana})</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>お札のお名前</span>
                      <span>{talismanName || companyName}</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>所在地 (フリガナ)</span>
                      <span>{companyAddress} ({companyAddressKana})</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>代表者名</span>
                      <span>{representativeTitleName}</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>お申込担当者</span>
                      <span>{staffDeptTitleName}</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>担当者連絡先</span>
                      <span>{staffPhone} / {staffEmail}</span>
                    </div>
                    {additionalTalismans && (
                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>追加希望の守札</span>
                        <span>{additionalTalismans}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>領収証</span>
                      <span>{wantsReceipt ? `希望する (宛名: ${receiptName} / 金額: ${receiptAmount.toLocaleString()}円)` : '希望しない'}</span>
                    </div>

                    {/* Victory Prayer Info */}
                    {tournamentName && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: '#fff9e6', padding: '0.5rem', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--color-gold)' }}>必勝祈願 詳細</div>
                        <div>大会名称: {tournamentName}</div>
                        <div>大会日程: {tournamentSchedule}</div>
                      </div>
                    )}

                    {/* Construction Prayer Info */}
                    {constructionName && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: '#fff9e6', padding: '0.5rem', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--color-gold)' }}>工事安全祈願 詳細</div>
                        <div>工事名称: {constructionName}</div>
                        <div>設計監理: {constructionDesigner}</div>
                        <div>施工者名: {constructionBuilder}</div>
                        <div>工事期間: {constructionPeriod}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(2)}
                disabled={submitting}
              >
                修正する
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitBooking}
                disabled={submitting}
              >
                {submitting ? '予約送信中...' : 'この内容で予約を確定する'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default VisitorPortal;
