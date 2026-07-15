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
  { value: '寿祝い', price: 5000 },
  { value: '交通安全', price: 5000 },
  { value: '良縁祈願（縁結び）', price: 5000 },
  { value: '子授け（子宝）祈願', price: 5000 },
  { value: '留学安全', price: 5000 },
  { value: '渡航安全', price: 5000 },
  { value: '就職祈願', price: 5000 }
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

interface PrayerItem {
  id: string;
  prayer1: string;
  prayer2?: string;
  hatsuhoryo: number;
  name: string;
  kana: string;
  yakudoshi_type?: 'maeyaku' | 'honyaku' | 'atoyaku' | '';
  child_name?: string;
  child_kana?: string;
  child_birthday?: string;
  father_name?: string;
  father_kana?: string;
  mother_name?: string;
  mother_kana?: string;
  kotobuki_type?: string;
  kotobuki_other_text?: string;
  is_twin?: number;
  child_name2?: string;
  child_kana2?: string;
  child_birthday2?: string;
  car_maker?: string;
  car_model?: string;
  car_number?: string;
}

export const VisitorPortal: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [bookingType, setBookingType] = useState<'individual' | 'organization'>('individual');
  
  // General Booking states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [prayer1, setPrayer1] = useState('');
  const [prayer2, setPrayer2] = useState('');
  const [hatsuhoryo, setHatsuhoryo] = useState(5000);
  const [attendingCount, setAttendingCount] = useState<number | ''>(1);
  const [prayerItems, setPrayerItems] = useState<PrayerItem[]>([]);

  // Calligraphy warnings, past prayer logs, twin baby forms and FAQ states
  const [hasPastPrayer, setHasPastPrayer] = useState<number>(0);
  const [isTwin, setIsTwin] = useState(false);
  const [childName2, setChildName2] = useState('');
  const [childKana2, setChildKana2] = useState('');
  const [childBirthday2, setChildBirthday2] = useState('');
  const [notes, setNotes] = useState('');

  // Child birthday dropdown segments
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');

  const [birthYear2, setBirthYear2] = useState('');
  const [birthMonth2, setBirthMonth2] = useState('');
  const [birthDay2, setBirthDay2] = useState('');

  // Talisman viewer modal states (scraping)
  const [talismansList, setTalismansList] = useState<any[]>([]);
  const [showTalismanViewer, setShowTalismanViewer] = useState(false);
  const [loadingTalismans, setLoadingTalismans] = useState(false);
  const [syncingTalismans, setSyncingTalismans] = useState(false);
  const [talismanFilterCategory, setTalismanFilterCategory] = useState<'all' | 'ofuda' | 'omamori'>('all');

  // Reset dynamic fields when main prayer changes to prevent leftover data
  useEffect(() => {
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
    // Auto-fill typical price
    if (prayer1 === '初宮詣（お宮参り）' && isTwin) {
      setHatsuhoryo(15000);
    } else {
      const found = INDIVIDUAL_PRAYERS.find(p => p.value === prayer1);
      if (found) {
        setHatsuhoryo(found.price);
      }
    }
  }, [prayer1, isTwin]);

  // Individual Form fields
  const [name, setName] = useState('');
  const [kana, setKana] = useState('');
  const [prayerName, setPrayerName] = useState('');
  const [prayerKana, setPrayerKana] = useState('');
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

  const [skipVictoryDetails, setSkipVictoryDetails] = useState(false);
  const [skipConstructionDetails, setSkipConstructionDetails] = useState(false);

  // Submission Status
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [createdBookings, setCreatedBookings] = useState<Booking[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Self Rescheduling / Cancel Status
  const [changeId, setChangeId] = useState<string | null>(null);
  const [targetBooking, setTargetBooking] = useState<Booking | null>(null);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccessMsg, setChangeSuccessMsg] = useState('');


  const [isBookingActive, setIsBookingActive] = useState(true);
  const [userBirthYear, setUserBirthYear] = useState('');
  const [userBirthMonth, setUserBirthMonth] = useState('');
  const [userBirthDay, setUserBirthDay] = useState('');
  const [activeMainTab, setActiveMainTab] = useState<'form' | 'faq'>('form');
  const [carMaker, setCarMaker] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [faq1Open, setFaq1Open] = useState(false);
  const [faq2Open, setFaq2Open] = useState(false);
  const [faq3Open, setFaq3Open] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/settings`);
        if (res.ok) {
          const settings = await res.json();
          setIsBookingActive(settings.is_booking_active !== 'false');
          setMaintenanceMessage(settings.maintenance_message || '現在、オンラインでのご祈祷予約の受付を一時的に停止しております。');
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Form editing mode states (For full reschedule updates)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editBookingId, setEditBookingId] = useState<number | null>(null);

  const loadBookingIntoForm = (b: Booking) => {
    setBookingType(b.booking_type);
    setSelectedDate(b.booking_date);
    setSelectedTime(b.booking_time);
    setPrayer1(b.prayer1);
    setPrayer2(b.prayer2 || '');
    setHatsuhoryo(b.hatsuhoryo);
    setAttendingCount(b.attending_count);

    if (b.booking_type === 'individual') {
      setName(b.name || '');
      setKana(b.kana || '');
      setAddress(b.address || '');
      setAddressKana(b.address_kana || '');
      setPhone(b.phone || '');
      setEmail(b.email || '');

      setYakudoshiType(b.yakudoshi_type || '');
      setFatherName(b.father_name || '');
      setFatherKana(b.father_kana || '');
      setMotherName(b.mother_name || '');
      setMotherKana(b.mother_kana || '');
      setChildName(b.child_name || '');
      setChildKana(b.child_kana || '');
      setChildBirthday(b.child_birthday || '');
      setKotobukiType(b.kotobuki_type || '');
      setKotobukiOtherText(b.kotobuki_other_text || '');
    } else {
      setCompanyName(b.company_name || '');
      setCompanyKana(b.company_kana || '');
      setCompanyAddress(b.company_address || '');
      setCompanyAddressKana(b.company_address_kana || '');
      setRepresentativeTitleName(b.representative_title_name || '');
      setStaffDeptTitleName(b.staff_dept_title_name || '');
      setStaffPhone(b.staff_phone || '');
      setStaffEmail(b.staff_email || '');
      setTalismanName(b.talisman_name || '');
      setAdditionalTalismans(b.additional_talismans || '');
      setWantsReceipt(b.wants_receipt === 1);
      setReceiptName(b.receipt_name || '');
      setReceiptAmount(b.receipt_amount || 0);

      // Org dynamic fields
      if (b.prayer1 !== '社運隆盛' && b.prayer1 !== '商売繁昌' && b.prayer1 !== '安全祈願' && b.prayer1 !== '必勝祈願' && b.prayer1 !== '工事安全') {
        setOrgCustomPrayer1(b.prayer1);
      }
      if (b.prayer2 && b.prayer2 !== '社運隆盛' && b.prayer2 !== '商売繁昌' && b.prayer2 !== '安全祈願' && b.prayer2 !== '必勝祈願' && b.prayer2 !== '工事安全') {
        setOrgCustomPrayer2(b.prayer2);
      }
      setTournamentName(b.tournament_name || '');
      setTournamentSchedule(b.tournament_schedule || '');
      setConstructionName(b.construction_name || '');
      setConstructionDesigner(b.construction_designer || '');
      setConstructionBuilder(b.construction_builder || '');
      setConstructionPeriod(b.construction_period || '');
    }

    setIsEditMode(true);
    setEditBookingId(b.id || null);
    
    // Clear URL parameters and changeId to close self-service overview portal
    window.history.replaceState({}, '', window.location.origin);
    setChangeId(null);
    setStep(1); // Redirect back to slot/type selector
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cId = params.get('changeId');
    if (cId) {
      setChangeId(cId);
      fetchTargetBooking(cId);
    }
  }, []);

  // compiled child birthdate hooks
  useEffect(() => {
    if (birthYear && birthMonth && birthDay) {
      setChildBirthday(`${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`);
    } else {
      setChildBirthday('');
    }
  }, [birthYear, birthMonth, birthDay]);

  useEffect(() => {
    if (birthYear2 && birthMonth2 && birthDay2) {
      setChildBirthday2(`${birthYear2}-${birthMonth2.padStart(2, '0')}-${birthDay2.padStart(2, '0')}`);
    } else {
      setChildBirthday2('');
    }
  }, [birthYear2, birthMonth2, birthDay2]);

  // Save fields on changes (skip complete screen)
  const isCompleted = sessionStorage.getItem('booking_completed') === 'true';
  useEffect(() => {
    if (isCompleted || step === 4) return;

    const stateToSave = {
      step, bookingType, selectedDate, selectedTime,
      prayer1, prayer2, hatsuhoryo, attendingCount, prayerItems,
      name, kana, address, addressKana, phone, email,
      companyName, companyKana, companyAddress, companyAddressKana,
      representativeTitleName, staffDeptTitleName, staffPhone, staffEmail,
      talismanName, additionalTalismans, wantsReceipt, receiptName, receiptAmount,
      hasPastPrayer, isTwin, childName2, childKana2, notes,
      birthYear, birthMonth, birthDay,
      birthYear2, birthMonth2, birthDay2,
      userBirthYear, userBirthMonth, userBirthDay,
      activeMainTab, childName, childKana, childBirthday,
      yakudoshiType, fatherName, fatherKana, motherName, motherKana,
      kotobukiType, kotobukiOtherText,
      carMaker, carModel, carNumber
    };
    localStorage.setItem('kagura_booking_form_state', JSON.stringify(stateToSave));
  }, [
    step, bookingType, selectedDate, selectedTime,
    prayer1, prayer2, hatsuhoryo, attendingCount, prayerItems,
    name, kana, address, addressKana, phone, email,
    companyName, companyKana, companyAddress, companyAddressKana,
    representativeTitleName, staffDeptTitleName, staffPhone, staffEmail,
    talismanName, additionalTalismans, wantsReceipt, receiptName, receiptAmount,
    hasPastPrayer, isTwin, childName2, childKana2, notes,
    birthYear, birthMonth, birthDay,
    birthYear2, birthMonth2, birthDay2,
    userBirthYear, userBirthMonth, userBirthDay,
    activeMainTab, childName, childKana, childBirthday,
    yakudoshiType, fatherName, fatherKana, motherName, motherKana,
    kotobukiType, kotobukiOtherText,
    carMaker, carModel, carNumber
  ]);

  // Restore fields on mount
  useEffect(() => {
    const saved = localStorage.getItem('kagura_booking_form_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.step) setStep(state.step);
        if (state.bookingType) setBookingType(state.bookingType);
        if (state.selectedDate) setSelectedDate(state.selectedDate);
        if (state.selectedTime) setSelectedTime(state.selectedTime);
        if (state.prayer1) setPrayer1(state.prayer1);
        if (state.prayer2) setPrayer2(state.prayer2);
        if (state.hatsuhoryo) setHatsuhoryo(state.hatsuhoryo);
        if (state.attendingCount) setAttendingCount(state.attendingCount);
        if (state.prayerItems) setPrayerItems(state.prayerItems);
        
        if (state.name) setName(state.name);
        if (state.kana) setKana(state.kana);
        if (state.address) setAddress(state.address);
        if (state.addressKana) setAddressKana(state.addressKana);
        if (state.phone) setPhone(state.phone);
        if (state.email) setEmail(state.email);

        if (state.companyName) setCompanyName(state.companyName);
        if (state.companyKana) setCompanyKana(state.companyKana);
        if (state.companyAddress) setCompanyAddress(state.companyAddress);
        if (state.companyAddressKana) setCompanyAddressKana(state.companyAddressKana);
        if (state.representativeTitleName) setRepresentativeTitleName(state.representativeTitleName);
        if (state.staffDeptTitleName) setStaffDeptTitleName(state.staffDeptTitleName);
        if (state.staffPhone) setStaffPhone(state.staffPhone);
        if (state.staffEmail) setStaffEmail(state.staffEmail);

        if (state.talismanName) setTalismanName(state.talismanName);
        if (state.additionalTalismans) setAdditionalTalismans(state.additionalTalismans);
        if (state.wantsReceipt !== undefined) setWantsReceipt(state.wantsReceipt);
        if (state.receiptName) setReceiptName(state.receiptName);
        if (state.receiptAmount) setReceiptAmount(state.receiptAmount);

        if (state.hasPastPrayer !== undefined) setHasPastPrayer(state.hasPastPrayer);
        if (state.isTwin !== undefined) setIsTwin(state.isTwin);
        if (state.childName2) setChildName2(state.childName2);
        if (state.childKana2) setChildKana2(state.childKana2);
        if (state.notes) setNotes(state.notes);

        if (state.birthYear) setBirthYear(state.birthYear);
        if (state.birthMonth) setBirthMonth(state.birthMonth);
        if (state.birthDay) setBirthDay(state.birthDay);

        if (state.birthYear2) setBirthYear2(state.birthYear2);
        if (state.birthMonth2) setBirthMonth2(state.birthMonth2);
        if (state.birthDay2) setBirthDay2(state.birthDay2);

        // 新しく追加したステートの復元
        if (state.userBirthYear) setUserBirthYear(state.userBirthYear);
        if (state.userBirthMonth) setUserBirthMonth(state.userBirthMonth);
        if (state.userBirthDay) setUserBirthDay(state.userBirthDay);
        if (state.activeMainTab) setActiveMainTab(state.activeMainTab);
        if (state.childName) setChildName(state.childName);
        if (state.childKana) setChildKana(state.childKana);
        if (state.childBirthday) setChildBirthday(state.childBirthday);
        if (state.yakudoshiType) setYakudoshiType(state.yakudoshiType);
        if (state.fatherName) setFatherName(state.fatherName);
        if (state.fatherKana) setFatherKana(state.fatherKana);
        if (state.motherName) setMotherName(state.motherName);
        if (state.motherKana) setMotherKana(state.motherKana);
        if (state.kotobukiType) setKotobukiType(state.kotobukiType);
        if (state.kotobukiOtherText) setKotobukiOtherText(state.kotobukiOtherText);
        if (state.carMaker) setCarMaker(state.carMaker);
        if (state.carModel) setCarModel(state.carModel);
        if (state.carNumber) setCarNumber(state.carNumber);
      } catch (e) {
        console.error('Failed to restore form state:', e);
      }
    }
  }, []);

  // Prevent browser back button after successful booking to avoid duplicate submissions
  useEffect(() => {
    if (createdBooking) {
      // Push a dummy state to block the first back button click
      window.history.pushState(null, '', window.location.href);

      const handlePopState = () => {
        // Clear all form states
        localStorage.removeItem('kagura_booking_form_state');
        sessionStorage.removeItem('booking_completed');
        
        alert('⚠️ ご予約手続きはすでに完了しております。\n二重予約防止のため、ブラウザの「戻る」ボタンは使用できません。トップページへ戻ります。');
        
        // Redirect to top page
        window.location.href = window.location.origin;
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [createdBooking]);

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



  // 1. Manage Hatsuhoryo changes based on willingness and organization headcount
  useEffect(() => {
    if (bookingType === 'individual') {
      if (prayer1 === '初宮詣（お宮参り）' && isTwin) {
        setHatsuhoryo(15000);
      } else {
        const match = INDIVIDUAL_PRAYERS.find(p => p.value === prayer1);
        setHatsuhoryo(match ? match.price : 5000);
      }
    } else {
      // Organization base pricing: under 5 people = 20k, 5 or more = 30k
      const basePrice = Number(attendingCount) < 5 ? 20000 : 30000;
      setHatsuhoryo(basePrice);
      // Auto sync receipt amount
      setReceiptAmount(basePrice);
    }
  }, [prayer1, bookingType, attendingCount, isTwin]);

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

    if (bookingType === 'individual') {
      if (prayerItems.length === 0) {
        return 'ご祈祷内容（願意と受ける方のお名前）を入力し、「ご祈祷を予約リストに追加」ボタンを押してリストに1件以上追加してください。';
      }
      if (!name.trim() || !kana.trim() || !address.trim() || !addressKana.trim() || !phone.trim() || !email.trim()) {
        return '必須のご予約者様情報（お名前・フリガナ・ご住所・電話番号・メールアドレス）をご入力ください。';
      }
    } else {
      // Organization validation
      if (!prayer1) {
        return '主願意を選択してください。';
      }
      if (prayer1 === 'その他（自由入力）' && !orgCustomPrayer1.trim()) {
        return '自由入力の願意を記載してください。';
      }
      if (!companyName.trim() || !companyKana.trim() || !companyAddress.trim() || !companyAddressKana.trim() || 
          !representativeTitleName.trim() || !staffDeptTitleName.trim() || !staffPhone.trim() || !staffEmail.trim() ||
          !talismanName.trim()) {
        return '企業情報（企業名・所在地・代表者・担当者氏名・連絡先等）および神札墨書名をすべてご入力ください。';
      }
      if (wantsReceipt && (!receiptName.trim() || receiptAmount <= 0)) {
        return '領収証の発行に必要な宛名および金額を正しくご入力ください。';
      }
      
      const p1 = getActivePrayer1();
      const p2 = getActivePrayer2();
      const needsVictory = p1 === '必勝祈願' || p2 === '必勝祈願';
      const needsConstruction = p1 === '工事安全' || p2 === '工事安全';

      if (needsVictory && !skipVictoryDetails && (!tournamentName.trim() || !tournamentSchedule.trim())) {
        return '必勝祈願に伴う大会名称および大会日程をご入力ください。';
      }
      if (needsConstruction && !skipConstructionDetails && (!constructionName.trim() || !constructionDesigner.trim() || !constructionBuilder.trim() || !constructionPeriod.trim())) {
        return '工事安全祈願に伴う工事名称・設計監理者名・施工者名・工期をすべてご入力ください。';
      }
    }
    return '';
  };

  const handleAddPrayerItem = () => {
    if (!prayer1) {
      alert('願意を選択してください。');
      return;
    }
    if (!prayerName.trim() || !prayerKana.trim()) {
      alert('ご祈祷を受けられる方のお名前とフリガナを入力してください。');
      return;
    }

    // Dynamic field validation
    if (prayer1 === '厄年のお祓い' && !yakudoshiType) {
      alert('厄年区分を選択してください。');
      return;
    }
    if (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') {
      const isCurrentTwin = prayer1 === '初宮詣（お宮参り）' && isTwin;
      if (isCurrentTwin) {
        if (!childName.trim() || !childKana.trim() || !childBirthday || !childName2.trim() || !childKana2.trim() || !childBirthday2) {
          alert('双子のお子様お二人分のお名前、フリガナ、生年月日はすべて必須です。');
          return;
        }
      } else {
        if (!childName.trim() || !childKana.trim() || !childBirthday) {
          alert('お子様のお名前、フリガナ、生年月日は必須です。');
          return;
        }
      }
      if (!fatherName.trim() && !motherName.trim()) {
        alert('ご両親（父親または母親）のいずれか一方の氏名は入力してください。');
        return;
      }
    }
    if (prayer1 === '寿祝い' && !kotobukiType) {
      alert('長寿祝いの区分を選択してください。');
      return;
    }
    if (prayer1 === '寿祝い' && kotobukiType === 'その他' && !kotobukiOtherText.trim()) {
      alert('長寿祝いの内容を入力してください。');
      return;
    }
    if (prayer1 === '車祓（お車のお祓い）' && (!carMaker.trim() || !carModel.trim() || !carNumber.trim())) {
      alert('お車のメーカー、車種、ナンバーは必須です。');
      return;
    }

    // Add to prayerItems
    const isCurrentTwin = prayer1 === '初宮詣（お宮参り）' && isTwin;
    const newItem: PrayerItem = {
      id: Math.random().toString(36).substring(2, 9),
      prayer1,
      hatsuhoryo,
      name: prayerName,
      kana: prayerKana,
      yakudoshi_type: prayer1 === '厄年のお祓い' ? yakudoshiType : undefined,
      child_name: (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? childName : undefined,
      child_kana: (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? childKana : undefined,
      child_birthday: (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? childBirthday : undefined,
      father_name: (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? fatherName : undefined,
      father_kana: (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? fatherKana : undefined,
      mother_name: (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? motherName : undefined,
      mother_kana: (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') ? motherKana : undefined,
      kotobuki_type: prayer1 === '寿祝い' ? kotobukiType : undefined,
      kotobuki_other_text: (prayer1 === '寿祝い' && kotobukiType === 'その他') ? kotobukiOtherText : undefined,
      is_twin: isCurrentTwin ? 1 : 0,
      child_name2: isCurrentTwin ? childName2 : undefined,
      child_kana2: isCurrentTwin ? childKana2 : undefined,
      child_birthday2: isCurrentTwin ? childBirthday2 : undefined,
      car_maker: prayer1 === '車祓（お車のお祓い）' ? carMaker : undefined,
      car_model: prayer1 === '車祓（お車のお祓い）' ? carModel : undefined,
      car_number: prayer1 === '車祓（お車のお祓い）' ? carNumber : undefined
    };

    setPrayerItems([...prayerItems, newItem]);

    // Auto-fill representative name if empty
    if (prayerItems.length === 0) {
      if (!name) setName(prayerName);
      if (!kana) setKana(prayerKana);
    }

    // Reset current prayer fields
    setPrayer1('');
    setPrayer2('');
    setPrayerName('');
    setPrayerKana('');
    setHatsuhoryo(5000);
    setIsTwin(false);
    setChildName2('');
    setChildKana2('');
    setChildBirthday2('');
    setBirthYear('');
    setBirthMonth('');
    setBirthDay('');
    setBirthYear2('');
    setBirthMonth2('');
    setBirthDay2('');
    setCarMaker('');
    setCarModel('');
    setCarNumber('');
  };

  const handleRemovePrayerItem = (id: string) => {
    setPrayerItems(prayerItems.filter(item => item.id !== id));
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

    const singlePayload: Booking = {
      booking_type: bookingType,
      booking_date: selectedDate,
      booking_time: selectedTime,
      prayer1: bookingType === 'individual' ? (prayerItems[0]?.prayer1 || prayer1) : p1,
      prayer2: bookingType === 'organization' ? p2 : undefined,
      hatsuhoryo: bookingType === 'individual' ? (prayerItems[0]?.hatsuhoryo || hatsuhoryo) : hatsuhoryo,
      payment_status: 'unpaid',
      attending_count: attendingCount === '' ? 1 : attendingCount,
      
      name: bookingType === 'individual' ? (prayerItems[0]?.name || prayerName || name) : undefined,
      kana: bookingType === 'individual' ? (prayerItems[0]?.kana || prayerKana || kana) : undefined,
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

      yakudoshi_type: bookingType === 'individual' ? (prayerItems[0]?.yakudoshi_type || yakudoshiType) : undefined,
      
      father_name: bookingType === 'individual' ? (prayerItems[0]?.father_name || fatherName) : undefined,
      father_kana: bookingType === 'individual' ? (prayerItems[0]?.father_kana || fatherKana) : undefined,
      mother_name: bookingType === 'individual' ? (prayerItems[0]?.mother_name || motherName) : undefined,
      mother_kana: bookingType === 'individual' ? (prayerItems[0]?.mother_kana || motherKana) : undefined,
      child_name: bookingType === 'individual' ? (prayerItems[0]?.child_name || childName) : undefined,
      child_kana: bookingType === 'individual' ? (prayerItems[0]?.child_kana || childKana) : undefined,
      child_birthday: bookingType === 'individual' ? (prayerItems[0]?.child_birthday || childBirthday) : undefined,

      kotobuki_type: bookingType === 'individual' ? (prayerItems[0]?.kotobuki_type || kotobukiType) : undefined,
      kotobuki_other_text: bookingType === 'individual' ? (prayerItems[0]?.kotobuki_other_text || kotobukiOtherText) : undefined,

      tournament_name: bookingType === 'organization' && (p1 === '必勝祈願' || p2 === '必勝祈願') ? tournamentName : undefined,
      tournament_schedule: bookingType === 'organization' && (p1 === '必勝祈願' || p2 === '必勝祈願') ? tournamentSchedule : undefined,

      construction_name: bookingType === 'organization' && (p1 === '工事安全' || p2 === '工事安全') ? constructionName : undefined,
      construction_designer: bookingType === 'organization' && (p1 === '工事安全' || p2 === '工事安全') ? constructionDesigner : undefined,
      construction_builder: bookingType === 'organization' && (p1 === '工事安全' || p2 === '工事安全') ? constructionBuilder : undefined,
      construction_period: bookingType === 'organization' && (p1 === '工事安全' || p2 === '工事安全') ? constructionPeriod : undefined,

      has_past_prayer: hasPastPrayer,
      is_twin: bookingType === 'individual' && isTwin ? 1 : 0,
      child_name2: bookingType === 'individual' && isTwin ? childName2 : undefined,
      child_kana2: bookingType === 'individual' && isTwin ? childKana2 : undefined,
      child_birthday2: bookingType === 'individual' && isTwin ? childBirthday2 : undefined,
      notes: (() => {
        const userBday = userBirthYear && userBirthMonth && userBirthDay
          ? `【生年月日】${getEraString(Number(userBirthYear)).split(' / ')[0]} (${userBirthYear}-${userBirthMonth.padStart(2, '0')}-${userBirthDay.padStart(2, '0')})`
          : '';
        if (notes && userBday) return `${notes}\n${userBday}`;
        return notes || userBday || undefined;
      })()
    };

    // If batching mode, map cart items to full bookings array
    const batchPayloads: Booking[] = bookingType === 'individual'
      ? prayerItems.map(item => ({
          booking_type: 'individual',
          booking_date: selectedDate,
          booking_time: selectedTime,
          prayer1: item.prayer1,
          hatsuhoryo: item.hatsuhoryo,
          payment_status: 'unpaid',
          attending_count: attendingCount === '' ? 1 : attendingCount,
          name: item.name,
          kana: item.kana,
          address,
          address_kana: addressKana,
          phone,
          email,
          yakudoshi_type: item.yakudoshi_type,
          child_name: item.child_name,
          child_kana: item.child_kana,
          child_birthday: item.child_birthday,
          father_name: item.father_name,
          father_kana: item.father_kana,
          mother_name: item.mother_name,
          mother_kana: item.mother_kana,
          kotobuki_type: item.kotobuki_type,
          kotobuki_other_text: item.kotobuki_other_text,
          has_past_prayer: hasPastPrayer,
          is_twin: item.is_twin || 0,
          child_name2: item.child_name2 || undefined,
          child_kana2: item.child_kana2 || undefined,
          child_birthday2: item.child_birthday2 || undefined,
          notes: notes ? `${notes} (代表: ${name})` : `申込代表者: ${name} (${kana})`
        }))
      : [singlePayload];

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = isEditMode && editBookingId 
        ? `${apiUrl}/api/bookings/${editBookingId}`
        : `${apiUrl}/api/bookings`;
      const method = isEditMode && editBookingId ? 'PUT' : 'POST';
      const sendBody: any = isEditMode && editBookingId ? singlePayload : batchPayloads;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendBody)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || (isEditMode ? '予約内容の変更に失敗しました。' : '予約の登録に失敗しました。'));
      }

      const created = await res.json();
      const createdArray = Array.isArray(created) ? created : [created];
      setCreatedBookings(createdArray);
      setCreatedBooking(createdArray[0]);
      
      // Clear persistence and block duplicate submissions
      localStorage.removeItem('kagura_booking_form_state');
      sessionStorage.setItem('booking_completed', 'true');
      
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
    setCreatedBooking(null);
    sessionStorage.removeItem('booking_completed');
    localStorage.removeItem('kagura_booking_form_state');
    setStep(1);
    setPrayerItems([]);
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
    setCarMaker('');
    setCarModel('');
    setCarNumber('');
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

  const fetchTalismans = async (forceSync = false) => {
    setShowTalismanViewer(true);
    if (forceSync) {
      setSyncingTalismans(true);
    } else {
      setLoadingTalismans(true);
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/talismans${forceSync ? '?sync=true' : ''}`);
      if (!res.ok) throw new Error('授与品データのフェッチに失敗しました。');
      const data = await res.json();
      setTalismansList(data);
    } catch (err) {
      console.error(err);
      alert('授与品一覧の取得に失敗しました。時間をおいて再度お試しいただくか、公式ホームページにて直接ご確認ください。');
    } finally {
      setLoadingTalismans(false);
      setSyncingTalismans(false);
    }
  };

  // Double submission block screen on browser-back
  if (isCompleted && step !== 4) {
    return (
      <div style={{ padding: '3rem 0' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card kamidana-border washi-bg" style={{ padding: '2.5rem', textAlign: 'center', border: '2px solid var(--color-shu)' }}>
            <h4 style={{ fontSize: '1.25rem', color: 'var(--color-shu)', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
              ⚠️ ご予約はすでに完了しております
            </h4>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--color-urushi)', marginBottom: '2rem' }}>
              二重予約（多重送信）を防ぐため、ブラウザバックによる再送信は行えません。<br />
              新しくご祈祷の予約をされる場合は、恐れ入りますが以下のボタンをクリックしてトップページよりお手続きをやり直してください。
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReset}
              style={{ padding: '0.6rem 2rem', fontSize: '0.9rem' }}
            >
              トップページに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4 && createdBookings.length > 0) {
    return <BookingSuccess bookings={createdBookings} onReset={handleReset} />;
  }

  if (settingsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p style={{ color: 'var(--color-accent-gray)', fontFamily: 'var(--font-serif)' }}>読み込み中...</p>
      </div>
    );
  }

  // If booking is stopped (except when in editMode or changeId mode)
  if (!isBookingActive && !isEditMode && !changeId) {
    return (
      <div style={{ padding: '3rem 0' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card kamidana-border washi-bg" style={{ padding: '2.5rem', textAlign: 'center', border: '2px solid var(--color-urushi)' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(211, 56, 28, 0.1)', 
              color: 'var(--color-shu)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem auto',
              fontSize: '2rem'
            }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--color-urushi)', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              オンライン予約受付 停止中のお知らせ
            </h3>
            <p style={{ 
              fontSize: '0.95rem', 
              lineHeight: '1.8', 
              color: 'var(--color-urushi-light)', 
              textAlign: 'left', 
              whiteSpace: 'pre-wrap',
              backgroundColor: 'rgba(255,255,255,0.7)',
              padding: '1.25rem',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              marginBottom: '1.5rem'
            }}>
              {maintenanceMessage}
            </p>
            <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-accent-gray)', marginBottom: '0.5rem' }}>お急ぎの場合のお問い合わせ：</p>
              <h4 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-urushi)', margin: 0 }}>
                📞 047-351-5417
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.25rem' }}>(受付時間: 9:30 〜 15:30)</p>
            </div>
          </div>
        </div>
      </div>
    );
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
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#d3381c',
                    backgroundColor: '#fff1f0',
                    border: '1px solid #ffa39e',
                    borderRadius: '4px',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.5rem',
                    lineHeight: '1.4'
                  }}>
                    <strong>⚠️ オンライン手続き期限について</strong><br />
                    オンラインでの日程変更・キャンセル手続きは【ご祈祷開始時間の30分前まで】となっております。社務の都合上、それ以降の直前の変更・キャンセルにつきましては、恐れ入りますが清瀧神社社務所（047-351-5417）までお電話にて直接ご連絡をお願いいたします。ご理解・ご協力のほどお願い申し上げます。
                  </div>

                  <div style={{ backgroundColor: 'var(--color-washi-dark)', border: '1px solid var(--color-border)', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}><strong>お名前:</strong> {targetBooking.booking_type === 'individual' ? targetBooking.name : targetBooking.company_name} 様</p>
                    <p style={{ margin: '0 0 0.5rem 0' }}><strong>ご祈祷:</strong> {targetBooking.prayer1}</p>
                    <p style={{ margin: 0 }}><strong>現在のご希望日時:</strong> {targetBooking.booking_date} {targetBooking.booking_time}の回</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                    <button 
                      onClick={() => loadBookingIntoForm(targetBooking)} 
                      className="btn btn-primary"
                      style={{ padding: '0.75rem' }}
                    >
                      ご予約内容（日時・お名前等）を変更する
                    </button>
                    <button 
                      onClick={handleCancelBooking} 
                      className="btn btn-secondary"
                      style={{ padding: '0.75rem', color: '#d3381c', borderColor: '#ffa39e', backgroundColor: '#fdf3f2' }}
                    >
                      ご予約をキャンセルする
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // If already completed and user tries to access forms via direct navigation/back
  if (isCompleted && step !== 4 && !createdBooking) {
    return (
      <div style={{ padding: '3rem 0' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div className="card kamidana-border" style={{ padding: '2.5rem' }}>
            <h3 style={{ fontSize: '1.45rem', color: 'var(--color-urushi)', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: 600 }}>
              ⚠️ ご予約手続きはすでに完了しております
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-accent-gray)', lineHeight: '1.6', marginBottom: '2rem' }}>
              すでにオンラインでのご予約完了画面が表示されたか、または手続きが終了しております。<br />
              二重予約防止のため、入力フォームへの再アクセスは制限されています。
            </p>
            <button 
              onClick={() => {
                sessionStorage.removeItem('booking_completed');
                localStorage.removeItem('kagura_booking_form_state');
                window.location.href = window.location.origin;
              }} 
              className="btn btn-primary"
            >
              新しく予約を行う
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Shrine Header Title Only (Logo image deleted) */}
        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.65rem', fontFamily: 'var(--font-serif)', color: 'var(--color-urushi)', marginTop: '0.5rem', letterSpacing: '0.15em', fontWeight: 600 }}>
            清瀧神社 ご祈祷予約受付
          </h2>
        </div>

        {/* Main Tab Switcher */}
        <div className="no-print" style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => setActiveMainTab('form')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              borderBottom: activeMainTab === 'form' ? '2px solid var(--color-urushi)' : 'none',
              color: activeMainTab === 'form' ? 'var(--color-urushi)' : 'var(--color-accent-gray)',
              fontWeight: activeMainTab === 'form' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem',
              fontFamily: 'var(--font-serif)'
            }}
          >
            ⛩️ ご予約手続き
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('faq')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              borderBottom: activeMainTab === 'faq' ? '2px solid var(--color-urushi)' : 'none',
              color: activeMainTab === 'faq' ? 'var(--color-urushi)' : 'var(--color-accent-gray)',
              fontWeight: activeMainTab === 'faq' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem',
              fontFamily: 'var(--font-serif)'
            }}
          >
            ❓ よくあるご質問
          </button>
        </div>

        {activeMainTab === 'form' ? (
          <>
            {/* Step Indicator */}
            <div className="no-print" style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '1.25rem', 
              marginBottom: '2rem',
              fontFamily: 'var(--font-serif)',
              fontSize: '0.85rem',
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                color: step === 1 ? 'var(--color-mizuiro)' : 'var(--color-accent-gray)', 
                fontWeight: step === 1 ? 'bold' : 'normal',
                borderBottom: step === 1 ? '2px solid var(--color-mizuiro)' : 'none',
                paddingBottom: '0.25rem',
                whiteSpace: 'nowrap'
              }}>1. 祈祷区分の選択</span>
              <span style={{ 
                color: step === 2 ? 'var(--color-mizuiro)' : 'var(--color-accent-gray)', 
                fontWeight: step === 2 ? 'bold' : 'normal',
                borderBottom: step === 2 ? '2px solid var(--color-mizuiro)' : 'none',
                paddingBottom: '0.25rem',
                whiteSpace: 'nowrap'
              }}>2. 予約情報の入力</span>
              <span style={{ 
                color: step === 3 ? 'var(--color-mizuiro)' : 'var(--color-accent-gray)', 
                fontWeight: step === 3 ? 'bold' : 'normal',
                borderBottom: step === 3 ? '2px solid var(--color-mizuiro)' : 'none',
                paddingBottom: '0.25rem',
                whiteSpace: 'nowrap'
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
                bookingType={bookingType}
              />
            </div>

            {/* PRAYER SELECTION */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>
                ご祈祷の願意（お願いごと）
              </h4>
              
              {bookingType === 'individual' ? (
                <div>
                  {/* Cart Display */}
                  <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--color-washi-dark)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                    <h5 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-urushi)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '0.5rem' }}>
                      📋 追加されたご祈祷の内容（{prayerItems.length}件）
                    </h5>
                    {prayerItems.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-accent-gray)', margin: 0, padding: '0.5rem 0' }}>
                        ※現在、追加されたご祈祷はありません。下のフォームから願意（お願い事）と受ける方の情報を入力し、追加してください。
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {prayerItems.map((item) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '2px' }}>
                            <div style={{ fontSize: '0.85rem' }}>
                              <strong>【願意】</strong> {item.prayer1} 
                              <span style={{ margin: '0 0.5rem', color: 'var(--color-border)' }}>|</span> 
                              <strong>【氏名】</strong> {item.name} 様
                              <span style={{ margin: '0 0.5rem', color: 'var(--color-border)' }}>|</span> 
                              <strong>【初穂料】</strong> {item.hatsuhoryo.toLocaleString()}円
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePrayerItem(item.id)}
                              className="btn"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#fdf3f2', color: '#d3381c', border: '1px solid #ffa39e' }}
                            >
                              削除
                            </button>
                          </div>
                        ))}
                        <div style={{ textAlign: 'right', fontSize: '0.9rem', fontWeight: 'bold', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                          お初穂料 合計: <span style={{ color: 'var(--color-mizuiro)', fontSize: '1.1rem' }}>{prayerItems.reduce((s, i) => s + i.hatsuhoryo, 0).toLocaleString()}</span> 円より
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                          お気持ち（当日現金納め）<br />
                          ※選択された願意の基準額です。のし袋か封筒などに包み、ご持参ください。
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add New Prayer Form */}
                  <div style={{ border: '1px solid var(--color-border)', padding: '1.25rem 1rem', borderRadius: '4px', position: 'relative', backgroundColor: '#ffffff', marginBottom: '1rem' }}>
                    <div style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: '#ffffff', padding: '0 0.5rem', fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 'bold' }}>
                      ご祈祷内容の入力
                    </div>
                    
                    <div className="grid-2" style={{ marginTop: '0.5rem' }}>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>願意（お願い事） <span className="required">*</span></label>
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

                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>初穂料 (目安自動設定) <span className="required">*</span></label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          value={hatsuhoryo}
                          onChange={(e) => setHatsuhoryo(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>ご祈祷を受ける方の氏名 <span className="required">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="例：清瀧 太郎"
                          value={prayerName}
                          onChange={(e) => setPrayerName(e.target.value)}
                        />
                        <div style={{ fontSize: '0.7rem', color: '#d3381c', margin: '0.35rem 0 0 0', lineHeight: '1.3' }}>
                          ※お札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（吉や𠮷、高や髙、邊や邉、斉や齊や齋、瀬や瀨、柳や栁、等々）
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>氏名フリガナ <span className="required">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="例：セイリュウ タロウ"
                          value={prayerKana}
                          onChange={(e) => setPrayerKana(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
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

              {bookingType === 'individual' && (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') && (() => {
                const currentYear = new Date().getFullYear();
                const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - i);
                return (
                  <div className="alert-warning" style={{ margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>お子様およびご両親の登録情報</h5>

                    {prayer1 === '初宮詣（お宮参り）' && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                          <input
                            type="checkbox"
                            checked={isTwin}
                            onChange={(e) => {
                              setIsTwin(e.target.checked);
                              if (!e.target.checked) {
                                setChildName2('');
                                setChildKana2('');
                                setChildBirthday2('');
                                setBirthYear2('');
                                setBirthMonth2('');
                                setBirthDay2('');
                              }
                            }}
                          />
                          <span>双子のご祈祷（お二人分）を希望する</span>
                        </label>
                      </div>
                    )}

                    <div style={{ border: '1px solid rgba(197, 160, 89, 0.2)', padding: '0.75rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gold)', display: 'block', marginBottom: '0.5rem' }}>
                        {isTwin ? 'お子様（一人目）' : 'お子様情報'}
                      </span>
                      <div className="form-row" style={{ marginBottom: '0.5rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>お子様の氏名 <span className="required">*</span></label>
                          <input type="text" className="form-control" placeholder="例：清瀧 太郎" value={childName} onChange={(e) => setChildName(e.target.value)} />
                          <div style={{ fontSize: '0.7rem', color: '#d3381c', margin: '0.35rem 0 0 0', lineHeight: '1.3' }}>
                            ※お札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（吉や𠮷、高や髙、邊や邉、斉や齊や齋、瀬や瀨、柳や栁、等々）
                          </div>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>お子様フリガナ <span className="required">*</span></label>
                          <input type="text" className="form-control" placeholder="例：セイリュウ タロウ" value={childKana} onChange={(e) => setChildKana(e.target.value)} />
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label>生年月日 <span className="required">*</span></label>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <select className="form-control" style={{ width: '180px' }} value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
                            <option value="">-- 年 (和暦/西暦) --</option>
                            {yearOptions.map(y => (
                              <option key={y} value={y.toString()}>{getEraString(y)}</option>
                            ))}
                          </select>
                          <select className="form-control" style={{ width: '90px' }} value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                            <option value="">-- 月 --</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                              <option key={m} value={m.toString()}>{m}月</option>
                            ))}
                          </select>
                          <select className="form-control" style={{ width: '90px' }} value={birthDay} onChange={(e) => setBirthDay(e.target.value)}>
                            <option value="">-- 日 --</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                              <option key={d} value={d.toString()}>{d}日</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {prayer1 === '初宮詣（お宮参り）' && isTwin && (
                      <div style={{ border: '1px solid rgba(197, 160, 89, 0.2)', padding: '0.75rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gold)', display: 'block', marginBottom: '0.5rem' }}>
                          お子様（二人目）
                        </span>
                        <div className="form-row" style={{ marginBottom: '0.5rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label>お子様の氏名 <span className="required">*</span></label>
                            <input type="text" className="form-control" placeholder="例：清瀧 次郎" value={childName2} onChange={(e) => setChildName2(e.target.value)} />
                            <div style={{ fontSize: '0.7rem', color: '#d3381c', margin: '0.35rem 0 0 0', lineHeight: '1.3' }}>
                              ※お札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（吉や𠮷、高や髙、邊や邉、斉や齊や齋、瀬や瀨、柳や栁、等々）
                            </div>
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label>お子様フリガナ <span className="required">*</span></label>
                            <input type="text" className="form-control" placeholder="例：セイリュウ ジロウ" value={childKana2} onChange={(e) => setChildKana2(e.target.value)} />
                          </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label>生年月日 <span className="required">*</span></label>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select className="form-control" style={{ width: '180px' }} value={birthYear2} onChange={(e) => setBirthYear2(e.target.value)}>
                              <option value="">-- 年 (和暦/西暦) --</option>
                              {yearOptions.map(y => (
                                <option key={y} value={y.toString()}>{getEraString(y)}</option>
                              ))}
                            </select>
                            <select className="form-control" style={{ width: '90px' }} value={birthMonth2} onChange={(e) => setBirthMonth2(e.target.value)}>
                              <option value="">-- 月 --</option>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m.toString()}>{m}月</option>
                              ))}
                            </select>
                            <select className="form-control" style={{ width: '90px' }} value={birthDay2} onChange={(e) => setBirthDay2(e.target.value)}>
                              <option value="">-- 日 --</option>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                <option key={d} value={d.toString()}>{d}日</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

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
                        <input type="text" className="form-control" placeholder="例：セイリュウ ケンジ" value={fatherKana} onChange={(e) => setFatherKana(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>母親の氏名</label>
                        <input type="text" className="form-control" placeholder="例：清瀧 花子" value={motherName} onChange={(e) => setMotherName(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>母親氏名フリガナ</label>
                        <input type="text" className="form-control" placeholder="例：セイリュウ ハナコ" value={motherKana} onChange={(e) => setMotherKana(e.target.value)} />
                      </div>
                    </div>
                  </div>
                );
              })()}

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

              {bookingType === 'individual' && prayer1 === '車祓（お車のお祓い）' && (
                <div className="form-group alert-warning" style={{ margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0, color: 'var(--color-mizuiro-hover)' }}>🚗 お祓いするお車の情報をご入力ください</h5>
                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>メーカー名 <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：トヨタ、ホンダなど"
                        value={carMaker}
                        onChange={(e) => setCarMaker(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>車種名 <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：プリウス、フィットなど"
                        value={carModel}
                        onChange={(e) => setCarModel(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>車両ナンバー <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="例：習志野330 さ 12-34"
                      value={carNumber}
                      onChange={(e) => setCarNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Sub-forms for Organization willing */}
              {bookingType === 'organization' && (getActivePrayer1() === '必勝祈願' || getActivePrayer2() === '必勝祈願') && (
                <div className="alert-warning" style={{ margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>必勝祈願 詳細情報</h5>
                    <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'normal', cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={skipVictoryDetails} 
                        onChange={(e) => { 
                          setSkipVictoryDetails(e.target.checked); 
                          if (e.target.checked) {
                            setTournamentName('');
                            setTournamentSchedule('');
                          }
                        }} 
                      />
                      詳細情報の入力をスキップする
                    </label>
                  </div>
                  {!skipVictoryDetails && (
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
                  )}
                </div>
              )}

              {bookingType === 'organization' && (getActivePrayer1() === '工事安全' || getActivePrayer2() === '工事安全') && (
                <div className="alert-warning" style={{ margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>工事安全祈願 詳細情報</h5>
                    <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'normal', cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={skipConstructionDetails} 
                        onChange={(e) => { 
                          setSkipConstructionDetails(e.target.checked); 
                          if (e.target.checked) {
                            setConstructionName('');
                            setConstructionDesigner('');
                            setConstructionBuilder('');
                            setConstructionPeriod('');
                          }
                        }} 
                      />
                      詳細情報の入力をスキップする
                    </label>
                  </div>
                  {!skipConstructionDetails && (
                    <>
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
                    </>
                  )}
                </div>
              )}

              {bookingType === 'individual' && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px dashed var(--color-border)', paddingTop: '1rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={handleAddPrayerItem}
                    className="btn btn-gold"
                    style={{ fontSize: '0.9rem', padding: '0.6rem 1.5rem' }}
                  >
                    ➕ このご祈祷（願意）を予約リストに追加
                  </button>
                </div>
              )}

              {/* Show Amulet base prices (Text display only) */}
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-accent-gray)', fontWeight: 500 }}>お初穂料のご案内</span>
                <div style={{ fontSize: '1.25rem', color: 'var(--color-mizuiro)', fontWeight: 'bold', fontFamily: 'var(--font-serif)', marginTop: '0.25rem' }}>
                  {hatsuhoryo.toLocaleString()} 円より お気持ち（当日現金納め）
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.25rem' }}>
                  {bookingType === 'individual' 
                    ? '※選択された願意の基準額です。のし袋か封筒などに包み、ご持参ください。' 
                    : '※団体参拝は5名未満は20,000円より、5名以上は30,000円よりのお気持ち（当日現金納め）とさせていただいております。'}
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
                      <div style={{ fontSize: '0.75rem', color: '#d3381c', margin: '0.15rem 0 0.35rem 0', lineHeight: '1.4' }}>
                        ※お札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（吉や𠮷、高や髙、邊や邉、斉や齊や齋、瀬や瀨、柳や栁、等々）
                      </div>
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
                        placeholder="例：セイリュウ タロウ"
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
                        placeholder="例：ウラヤスシホリエ"
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
                      onChange={(e) => setAttendingCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                      onBlur={() => { if (attendingCount === '') setAttendingCount(1); }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label>ご祈祷される方の生年月日 <span className="required">*</span></label>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select className="form-control" style={{ width: '180px' }} value={userBirthYear} onChange={(e) => setUserBirthYear(e.target.value)} required>
                        <option value="">-- 年 (和暦/西暦) --</option>
                        {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                          <option key={y} value={y.toString()}>{getEraString(y)}</option>
                        ))}
                      </select>
                      <select className="form-control" style={{ width: '90px' }} value={userBirthMonth} onChange={(e) => setUserBirthMonth(e.target.value)} required>
                        <option value="">-- 月 --</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m.toString()}>{m}月</option>
                        ))}
                      </select>
                      <select className="form-control" style={{ width: '90px' }} value={userBirthDay} onChange={(e) => setUserBirthDay(e.target.value)} required>
                        <option value="">-- 日 --</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d.toString()}>{d}日</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: '1rem 0 0 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                      <input
                        type="checkbox"
                        checked={hasPastPrayer === 1}
                        onChange={(e) => setHasPastPrayer(e.target.checked ? 1 : 0)}
                      />
                      <span>過去に清瀧神社でご祈祷（お祓い）を受けたことがあります。</span>
                    </label>
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
                        placeholder="例：セイリュウカブシキガイシャ"
                        value={companyKana}
                        onChange={(e) => setCompanyKana(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>お札に書かれるお名前 （お札に墨書きする正式名称） <span className="required">*</span></label>
                    <div style={{ fontSize: '0.75rem', color: '#d3381c', margin: '0.15rem 0 0.35rem 0', lineHeight: '1.4' }}>
                      ※お札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（吉や𠮷、高や髙、邊や邉、斉や齊や齋、瀬や瀨、柳や栁、等々）
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="例: 清瀧株式会社 代表取締役 清瀧太郎"
                      value={talismanName}
                      onChange={(e) => setTalismanName(e.target.value)}
                      required
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
                        placeholder="例：ウラヤスシホリエ"
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
                        onChange={(e) => setAttendingCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                        onBlur={() => { if (attendingCount === '') setAttendingCount(1); }}
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
                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-gold"
                          onClick={() => fetchTalismans(false)}
                          style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          🖼️ 授与品（お札・お守り）の一覧と画像を確認する
                        </button>
                      </div>
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

                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                      <input
                        type="checkbox"
                        checked={hasPastPrayer === 1}
                        onChange={(e) => setHasPastPrayer(e.target.checked ? 1 : 0)}
                      />
                      <span>過去に清瀧神社でご祈祷（お祓い）を受けたことがあります。</span>
                    </label>
                  </div>
                </>
              )}

              {/* Shared Considerations & Notes Field */}
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 'bold' }}>備考（任意）</label>
                  <div style={{ fontSize: '0.75rem', color: '#d3381c', margin: '0.15rem 0 0.5rem 0', lineHeight: '1.4', fontWeight: '500' }}>
                    ※お名前の漢字が入力できない方や車椅子の方がご参列される予定の場合など、ご要望や特別な配慮が必要な事項がございましたらご記入ください。
                  </div>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="例：お名前の漢字に外字（𠮷など）が含まれます。 / 参拝当日は車椅子の方が1名ご参列されます。"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ resize: 'vertical', width: '100%' }}
                  />
                </div>
              </div>
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

        {/* FAQ Accordion Section */}
        {step === 2 && (
          <div className="card kamidana-border" style={{ marginTop: '2rem', padding: '1.5rem', maxWidth: '800px', margin: '2rem auto' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--color-gold)', paddingBottom: '0.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-urushi)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>❓</span> ご予約にあたってのよくある質問（FAQ）
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  q: 'Q. 本人以外の家族も参列できますか？',
                  a: 'A. はい、可能でございます。ただし、繁忙期（お正月・七五三の時期）では、殿内等でご起立の上、神事に参加していただく等のご協力をお願いすることがございます。'
                },
                {
                  q: 'Q. 駐車場はありますか？',
                  a: 'A. はい、境内に12台分の駐車スペースがございます。ただし、数に限りがございますので、極力お乗り合わせいただくか、公共交通機関でのご来社をお願いいたします。'
                },
                {
                  q: 'Q. 古いお札やお守りは引き取ってもらえますか？',
                  a: 'A. はい、可能でございます。毎日午前9時から午後4時30分までの間、社務所受付にてお預かりいたします。また、年末年始（12月25日〜1月15日頃まで）の間は境内に特別納札所を設けておりますので、そちらへ直接お納めいただけます。'
                }
              ].map((faq, idx) => (
                <details
                  key={idx}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    padding: '0'
                  }}
                >
                  <summary
                    style={{
                      padding: '1rem',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: 'var(--color-urushi)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      listStyle: 'none'
                    }}
                  >
                    <span>{faq.q}</span>
                    <span className="accordion-icon" style={{ fontSize: '0.8rem', color: 'var(--color-gold)' }}>▼</span>
                  </summary>
                  <div
                    style={{
                      padding: '1rem',
                      fontSize: '0.85rem',
                      lineHeight: '1.7',
                      color: 'var(--color-urushi-light)',
                      borderTop: '1px dashed var(--color-border)',
                      backgroundColor: 'var(--color-washi-dark)'
                    }}
                  >
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
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
                {bookingType === 'organization' ? (
                  <>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>主願意</span>
                      <span style={{ fontWeight: 'bold' }}>{getActivePrayer1()}</span>
                    </div>
                    {getActivePrayer2() && (
                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>副願意</span>
                        <span style={{ fontWeight: 'bold' }}>{getActivePrayer2()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>お初穂料</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-mizuiro)' }}>{hatsuhoryo.toLocaleString()} 円より お気持ち（当日現金納め）</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>ご祈祷のお申込件数</span>
                      <span style={{ fontWeight: 'bold' }}>{prayerItems.length} 件</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>お初穂料 合計</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-mizuiro)' }}>{prayerItems.reduce((s, i) => s + i.hatsuhoryo, 0).toLocaleString()} 円より お気持ち（当日現金納め）</span>
                    </div>
                  </>
                )}
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
                    
                    {prayerItems.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#fcfbf7', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '2px', marginTop: '0.5rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-gold)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '0.25rem' }}>
                          ご祈祷 {idx + 1}件目
                        </div>
                        <div style={{ fontSize: '0.9rem' }}><strong>願意:</strong> {item.prayer1}</div>
                        <div style={{ fontSize: '0.9rem' }}><strong>初穂料:</strong> {item.hatsuhoryo.toLocaleString()} 円</div>
                        <div style={{ fontSize: '0.9rem' }}><strong>受ける方のお名前:</strong> {item.name} 様 ({item.kana})</div>
                        
                        {item.prayer1 === '厄年のお祓い' && item.yakudoshi_type && (
                          <div style={{ fontSize: '0.9rem', color: '#8a6d3b' }}><strong>厄年区分:</strong> {item.yakudoshi_type === 'maeyaku' ? '前厄' : item.yakudoshi_type === 'honyaku' ? '本厄' : '後厄'}</div>
                        )}
                        {item.child_name && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-accent-gray)' }}>
                            <div>お子様名: {item.child_name} 様 ({item.child_kana})</div>
                            <div>生年月日: {item.child_birthday}</div>
                            {item.father_name && <div>父親: {item.father_name} ({item.father_kana})</div>}
                            {item.mother_name && <div>母親: {item.mother_name} ({item.mother_kana})</div>}
                          </div>
                        )}
                        {item.prayer1 === '寿祝い' && item.kotobuki_type && (
                          <div style={{ fontSize: '0.9rem', color: '#8a6d3b' }}><strong>寿祝い区分:</strong> {item.kotobuki_type === 'その他' ? item.kotobuki_other_text : item.kotobuki_type}</div>
                        )}
                      </div>
                    ))}
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
                {submitting 
                  ? '変更内容を送信中...' 
                  : isEditMode 
                    ? 'この内容で予約変更を確定する' 
                    : 'この内容で予約を確定する'}
              </button>
            </div>
          </div>
        )}

        {/* 授与品ビューアモーダル */}
        {showTalismanViewer && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}>
            <div className="card washi-bg kamidana-border" style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              border: '2px solid var(--color-gold)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid var(--color-gold)',
                paddingBottom: '0.75rem',
                marginBottom: '1rem'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', margin: 0, color: 'var(--color-urushi)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⛩️</span> 清瀧神社 授与品（お札・お守り）一覧
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTalismanViewer(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: 'var(--color-accent-gray)',
                    lineHeight: 1
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Sub-header / Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { value: 'all', label: 'すべて' },
                    { value: 'ofuda', label: 'お札' },
                    { value: 'omamori', label: 'お守り' }
                  ].map(tab => (
                    <button
                      key={tab.value}
                      type="button"
                      className={`btn ${talismanFilterCategory === tab.value ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setTalismanFilterCategory(tab.value as any)}
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Reload / Sync */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={syncingTalismans || loadingTalismans}
                  onClick={() => fetchTalismans(true)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    borderColor: 'var(--color-gold)',
                    color: 'var(--color-gold)'
                  }}
                >
                  {syncingTalismans ? '同期中...' : '🔄 最新の公式情報に更新する'}
                </button>
              </div>

              {/* Scrollable grid area */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem', marginBottom: '1rem' }}>
                {loadingTalismans || syncingTalismans ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="spinner" />
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-accent-gray)' }}>
                      {syncingTalismans ? '公式ホームページより授与品情報をリアルタイム同期中...' : '授与品データを読み込み中...'}
                    </p>
                  </div>
                ) : (
                  (() => {
                    const filtered = talismansList.filter(t => {
                      if (talismanFilterCategory === 'all') return true;
                      return t.type === talismanFilterCategory;
                    });

                    if (filtered.length === 0) {
                      return (
                        <p style={{ textAlign: 'center', color: 'var(--color-accent-gray)', fontSize: '0.9rem', padding: '2rem 0' }}>
                          該当する授与品がありません。
                        </p>
                      );
                    }

                    return (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '1rem'
                      }}>
                        {filtered.map((item, idx) => (
                          <div
                            key={idx}
                            className="card"
                            style={{
                              padding: '0.75rem',
                              border: '1px solid var(--color-border)',
                              borderRadius: '3px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              backgroundColor: '#ffffff',
                              textAlign: 'center',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{
                              width: '100%',
                              height: '140px',
                              backgroundColor: '#f9f9f9',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderRadius: '2px',
                              overflow: 'hidden',
                              marginBottom: '0.5rem',
                              border: '1px solid #f0f0f0'
                            }}>
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)' }}>画像なし</span>
                              )}
                            </div>
                            <span style={{
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              color: 'var(--color-urushi)',
                              lineHeight: '1.4',
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Note and Close button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '0.75rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', margin: 0 }}>
                  ※名称と画像は、公式ホームページ（seiryuujinja.com）の情報をリアルタイムに取得したものです。
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTalismanViewer(false)}
                  style={{ padding: '0.4rem 1.25rem', fontSize: '0.85rem' }}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

          </>
        ) : (
          /* FAQ Tab Display */
          <div className="card kamidana-border" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-serif)' }}>
              ご予約にあたってのよくあるご質問 (FAQ)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* FAQ 1 */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '2px', backgroundColor: '#ffffff' }}>
                <button
                  type="button"
                  onClick={() => setFaq1Open(!faq1Open)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: 'var(--color-urushi)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <span style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--color-mizuiro)' }}>Q.</span>
                    <span>本人以外の家族も参列できますか？</span>
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--color-gold)' }}>{faq1Open ? '▲' : '▼'}</span>
                </button>
                {faq1Open && (
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    borderTop: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-washi-dark)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: '#333'
                  }}>
                    <strong style={{ color: 'var(--color-urushi-light)' }}>A.</strong> はい、可能でございます。繁忙期（お正月・七五三の時期）では、殿内などでご起立の上、神事ご参列いただく場合がございますのでご了承願います。
                  </div>
                )}
              </div>

              {/* FAQ 2 */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '2px', backgroundColor: '#ffffff' }}>
                <button
                  type="button"
                  onClick={() => setFaq2Open(!faq2Open)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: 'var(--color-urushi)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <span style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--color-mizuiro)' }}>Q.</span>
                    <span>駐車場は利用できますか？</span>
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--color-gold)' }}>{faq2Open ? '▲' : '▼'}</span>
                </button>
                {faq2Open && (
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    borderTop: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-washi-dark)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: '#333'
                  }}>
                    <strong style={{ color: 'var(--color-urushi-light)' }}>A.</strong> はい、利用可能でございます。清瀧神社 境内 裏手にて、12台ほど駐車可能でございます。台数に限りがございますので、ご利用される場合は、ご関係の皆様お声掛けにて乗り合わせていただけますと幸いでございます。
                  </div>
                )}
              </div>

              {/* FAQ 3 */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '2px', backgroundColor: '#ffffff' }}>
                <button
                  type="button"
                  onClick={() => setFaq3Open(!faq3Open)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '1.05rem',
                    color: 'var(--color-urushi)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <span style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--color-mizuiro)' }}>Q.</span>
                    <span>以前の古いお札・お守りを持って行きたいのですが、預かっていただくことは出来ますか？</span>
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--color-gold)' }}>{faq3Open ? '▲' : '▼'}</span>
                </button>
                {faq3Open && (
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    borderTop: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-washi-dark)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: '#333'
                  }}>
                    <strong style={{ color: 'var(--color-urushi-light)' }}>A.</strong> はい、預かっております。平時は社務所が開いている時間帯（09:00~16:30 平日・土日・祝祭日)にお声掛けいただけますとお預かりいたします。また、年末年始の時期（旧年中の12月下旬辺り～翌年の中旬頃）は清瀧神社 境内 裏手にて納札所（お札を収める場所）を設けますのでそちらをご利用ください。
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default VisitorPortal;
