import React, { useState, useEffect } from 'react';
import { User, Users, AlertCircle } from 'lucide-react';
import { getBookingReceipts, getBookingChildren, type Booking, type OrgPrayerItem, type ChildItem } from '../../types';
import { getApiUrl } from '../../config/api';
import SlotSelector from './SlotSelector';
import BookingSuccess from './BookingSuccess';

const INDIVIDUAL_PRAYERS = [
  { value: '家内安全', price: 5000 },
  { value: '身体健全', price: 5000 },
  { value: '厄年のお祓い', price: 5000 },
  { value: '八方除け', price: 5000 },
  { value: '除災招福（開運招福）', price: 5000 },
  { value: '方位除け', price: 5000 },
  { value: '安産祈願', price: 10000 },
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
  { value: '交通安全', label: '交通安全（※お車本体のお祓いは「車祓」をお選びください）', price: 5000 },
  { value: '良縁祈願（縁結び）', price: 5000 },
  { value: '子授け（子宝）祈願', price: 5000 },
  { value: '留学安全', price: 5000 },
  { value: '渡航安全', price: 5000 },
  { value: '就職祈願', price: 5000 }
];

export const getIndividualMinPrice = (prayer: string, twin?: boolean, childCount?: number) => {
  if (prayer === '初宮詣（お宮参り）' && twin) {
    return 15000;
  }
  if (prayer === '七五三詣') {
    const count = (childCount && childCount > 0) ? childCount : (twin ? 2 : 1);
    return 10000 * count;
  }
  const match = INDIVIDUAL_PRAYERS.find(p => p.value === prayer);
  return match ? match.price : 5000;
};

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

const FAQ_ITEMS = [
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
  },
  {
    q: 'Q. 安産祈願のご祈祷の際、持参した腹帯を一緒にお祓いしてもらうことは出来ますか？',
    a: 'A. はい、可能でございます。拝殿（ご祈祷をする場所）へご案内された際に、神職へお申し付けくださいませ。'
  },
  {
    q: 'Q. ご祈祷料を入れた封筒やのし袋の表書きはどのように書けばいいですか？',
    a: 'A. 「初穂料」、若しくは「玉串料」とご記入ください。'
  },
  {
    q: 'Q. 厄年ではないけれど、お祓いを受けることは可能ですか？',
    a: 'A. はい、可能でございます。災いを除き福を招く「除災招福」の御祈願をご案内しております。'
  },
  {
    q: 'Q. どのような服装でお祓いを受ければいいですか？',
    a: 'A. （丁寧な方はフォーマルな装いで参列されますが）過度に華美、ラフな服装でなければ問題ございません。'
  },
  {
    q: 'Q. お祓いを受ける本人がいなくても、お祓いは可能ですか？',
    a: 'A. ご本人様にご参列いただくことが望ましいですが、（何かしらの事情で参列が叶わない場合は）代理の方にお祓いを受けていただくことも可能でございます。'
  },
  {
    q: 'Q. 車のお祓いをするときは、どこに車を停めたら良いですか？',
    a: 'A. 清瀧神社 正面にてお祓いしております。正面の鳥居をくぐって参道中央付近でお停めください（社務の都合上により、停める場所が変更となる場合がございます）。'
  },
  {
    q: 'Q. 車を購入したのでお祓いをしてほしいのですが、「交通安全」と「車祓」のどちらを選べばいいですか？',
    a: 'A. 新車・中古車を問わず、お車本体のお祓い・お清めをご希望の場合は、願意で【車祓（お車のお祓い）】をお選びください。（「交通安全」は、ドライバー様やご家族ご自身の身の安全をご祈願する願意となります）。'
  },
  {
    q: 'Q. 初宮詣（お宮参り）の授与品に”歯固め石”はありますか？',
    a: 'A. いいえ、ございません（もし必要な方は、境内の石をお持ちいただき、ご利用後に元の場所へお戻し下さい）。'
  },
  {
    q: 'Q. 記念撮影で出張カメラマン（プロカメラマン）を同行しても良いですか？撮影許可証は必要ですか？',
    a: 'A. 撮影でカメラマンの方をお願いされるご家族様には撮影許可証などは設けておりません。他のご参拝の方のご迷惑にならないよう、どうぞお撮り下さいませ。（※なお、神事の厳修のため、社殿・拝殿内へのカメラマンのお立ち入り・ご祈祷中の撮影はご遠慮いただいております）。'
  },
  {
    q: 'Q. 予約の日程を変更したいのですが、どうすればよいですか？',
    a: 'A. ご祈祷開始日時の24時間前（前日同時刻）まででしたら、予約完了メールに記載の専用URL、または当サイトの「ご予約の確認・変更・キャンセル」メニューよりオンラインでいつでも日時をご変更いただけます。開始24時間を切った直前の変更につきましては、清瀧神社社務所（047-351-5417）までお電話にて直接ご連絡をお願いいたします。'
  },
  {
    q: 'Q. 予約をキャンセルしたい場合、キャンセル料はかかりますか？',
    a: 'A. いいえ、キャンセル料等は一切発生いたしませんのでご安心ください。オンラインでのお取り消しはご祈祷開始の24時間前まで受付可能です。以降の直前キャンセルにつきましては、準備の都合がございますため、お電話（047-351-5417）にてご連絡いただけますようお願いいたします。'
  },
  {
    q: 'Q. 当日、急な体調不良や交通機関の遅延等で時間に遅れそうな場合はどうすればいいですか？',
    a: 'A. お気兼ねなくお電話（047-351-5417）にて社務所までご一報ください。後続の回へのスライド対応や、別のお日にちへの振り替えなど、柔軟に対応させていただきます。'
  }
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

export const getChildAgeDetail = (yStr: string, mStr: string, dStr: string, targetDateStr?: string) => {
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  if (!y || !m || !d) return null;

  const tDate = targetDateStr ? new Date(targetDateStr) : new Date();
  let manAge = tDate.getFullYear() - y;
  const mDiff = tDate.getMonth() - (m - 1);
  if (mDiff < 0 || (mDiff === 0 && tDate.getDate() < d)) {
    manAge--;
  }
  if (manAge < 0) manAge = 0;

  const kazoeAge = (tDate.getFullYear() - y) + 1;

  let celebrationStage = '';
  if (manAge === 3 || kazoeAge === 3) {
    celebrationStage = '3歳のお祝い';
  } else if (manAge === 5 || kazoeAge === 5) {
    celebrationStage = '5歳のお祝い';
  } else if (manAge === 7 || kazoeAge === 7) {
    celebrationStage = '7歳のお祝い';
  } else if (manAge > 0) {
    celebrationStage = `${manAge}歳`;
  }

  const eraPart = getEraString(y).split(' / ')[0];
  return {
    eraText: `${eraPart}${m}月${d}日生`,
    manAge,
    kazoeAge,
    celebrationStage,
    fullText: `${eraPart}${m}月${d}日生（満${manAge}歳 / 数え${kazoeAge}歳${celebrationStage ? `・${celebrationStage}` : ''}）`
  };
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
  children_data?: string;
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
  child_gender?: '男' | '女';
  child_gender2?: '男' | '女';
  car_maker?: string;
  car_model?: string;
  car_number?: string;
}

export const VisitorPortal: React.FC = () => {
  // Load draft from localStorage if available
  const savedDraft = (() => {
    try {
      const raw = localStorage.getItem('kagura_booking_form_state');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  })();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(savedDraft?.step ?? 1);
  const [bookingType, setBookingType] = useState<'individual' | 'organization'>(savedDraft?.bookingType ?? 'individual');
  
  // General Booking states
  const [selectedDate, setSelectedDate] = useState(savedDraft?.selectedDate ?? '');
  const [selectedTime, setSelectedTime] = useState(savedDraft?.selectedTime ?? '');
  const [prayer1, setPrayer1] = useState(savedDraft?.prayer1 ?? '');
  const [prayer2, setPrayer2] = useState(savedDraft?.prayer2 ?? '');
  const [hatsuhoryo, setHatsuhoryo] = useState(savedDraft?.hatsuhoryo ?? 5000);
  const [attendingCount, setAttendingCount] = useState<number | ''>(savedDraft?.attendingCount ?? 1);
  const [prayerItems, setPrayerItems] = useState<PrayerItem[]>(savedDraft?.prayerItems ?? []);

  // Calligraphy warnings, past prayer logs, twin baby forms and FAQ states
  const [hasPastPrayer, setHasPastPrayer] = useState<number>(savedDraft?.hasPastPrayer ?? 0);
  const [isTwin, setIsTwin] = useState(savedDraft?.isTwin ?? false);
  const [shichigosanChildCount, setShichigosanChildCount] = useState<number>(savedDraft?.shichigosanChildCount ?? 1);
  const [childName2, setChildName2] = useState(savedDraft?.childName2 ?? '');
  const [childKana2, setChildKana2] = useState(savedDraft?.childKana2 ?? '');
  const [childBirthday2, setChildBirthday2] = useState(savedDraft?.childBirthday2 ?? '');
  const [childGender2, setChildGender2] = useState<'男' | '女' | ''>(savedDraft?.childGender2 ?? '');

  const [childName3, setChildName3] = useState(savedDraft?.childName3 ?? '');
  const [childKana3, setChildKana3] = useState(savedDraft?.childKana3 ?? '');
  const [childBirthday3, setChildBirthday3] = useState(savedDraft?.childBirthday3 ?? '');
  const [childGender3, setChildGender3] = useState<'男' | '女' | ''>(savedDraft?.childGender3 ?? '');

  const [childName4, setChildName4] = useState(savedDraft?.childName4 ?? '');
  const [childKana4, setChildKana4] = useState(savedDraft?.childKana4 ?? '');
  const [childBirthday4, setChildBirthday4] = useState(savedDraft?.childBirthday4 ?? '');
  const [childGender4, setChildGender4] = useState<'男' | '女' | ''>(savedDraft?.childGender4 ?? '');
  const [notes, setNotes] = useState(savedDraft?.notes ?? '');

  // Child birthday dropdown segments
  const [birthYear, setBirthYear] = useState(savedDraft?.birthYear ?? '');
  const [birthMonth, setBirthMonth] = useState(savedDraft?.birthMonth ?? '');
  const [birthDay, setBirthDay] = useState(savedDraft?.birthDay ?? '');

  const [birthYear2, setBirthYear2] = useState(savedDraft?.birthYear2 ?? '');
  const [birthMonth2, setBirthMonth2] = useState(savedDraft?.birthMonth2 ?? '');
  const [birthDay2, setBirthDay2] = useState(savedDraft?.birthDay2 ?? '');

  const [birthYear3, setBirthYear3] = useState(savedDraft?.birthYear3 ?? '');
  const [birthMonth3, setBirthMonth3] = useState(savedDraft?.birthMonth3 ?? '');
  const [birthDay3, setBirthDay3] = useState(savedDraft?.birthDay3 ?? '');

  const [birthYear4, setBirthYear4] = useState(savedDraft?.birthYear4 ?? '');
  const [birthMonth4, setBirthMonth4] = useState(savedDraft?.birthMonth4 ?? '');
  const [birthDay4, setBirthDay4] = useState(savedDraft?.birthDay4 ?? '');

  // Talisman viewer modal states (scraping)
  const [talismansList, setTalismansList] = useState<any[]>([]);
  const [showTalismanViewer, setShowTalismanViewer] = useState(false);
  const [loadingTalismans, setLoadingTalismans] = useState(false);
  const [syncingTalismans, setSyncingTalismans] = useState(false);
  const [talismanFilterCategory, setTalismanFilterCategory] = useState<'all' | 'ofuda' | 'omamori'>('all');

  // Form editing mode states (For full reschedule updates)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editBookingId, setEditBookingId] = useState<number | null>(null);
  const [relatedBookings, setRelatedBookings] = useState<Booking[]>([]);
  const [batchRescheduleRelated, setBatchRescheduleRelated] = useState(true);
  const [batchCancelRelated, setBatchCancelRelated] = useState(true);

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
    setChildGender('');
    setKotobukiType('');
    setKotobukiOtherText('');
    // Auto-fill typical price (skip in edit mode to preserve existing fee)
    if (isEditMode) return;
    if (prayer1 === '初宮詣（お宮参り）' && isTwin) {
      setHatsuhoryo(15000);
    } else {
      const found = INDIVIDUAL_PRAYERS.find(p => p.value === prayer1);
      if (found) {
        setHatsuhoryo(found.price);
      }
    }
  }, [prayer1, isTwin, isEditMode]);

  // Individual Form fields
  const [isRestored, setIsRestored] = useState(false);
  const [name, setName] = useState(savedDraft?.name ?? '');
  const [kana, setKana] = useState(savedDraft?.kana ?? '');
  const [prayerName, setPrayerName] = useState(savedDraft?.prayerName ?? '');
  const [prayerKana, setPrayerKana] = useState(savedDraft?.prayerKana ?? '');
  const [address, setAddress] = useState(savedDraft?.address ?? '');
  const [addressKana, setAddressKana] = useState(savedDraft?.addressKana ?? '');
  const [phone, setPhone] = useState(savedDraft?.phone ?? '');
  const [email, setEmail] = useState(savedDraft?.email ?? '');

  // Individual Dynamic fields
  const [yakudoshiType, setYakudoshiType] = useState<'maeyaku' | 'honyaku' | 'atoyaku' | ''>(savedDraft?.yakudoshiType ?? '');
  const [fatherName, setFatherName] = useState(savedDraft?.fatherName ?? '');
  const [fatherKana, setFatherKana] = useState(savedDraft?.fatherKana ?? '');
  const [motherName, setMotherName] = useState(savedDraft?.motherName ?? '');
  const [motherKana, setMotherKana] = useState(savedDraft?.motherKana ?? '');
  const [childSkipFather, setChildSkipFather] = useState(savedDraft?.childSkipFather ?? false);
  const [childSkipMother, setChildSkipMother] = useState(savedDraft?.childSkipMother ?? false);
  const [childName, setChildName] = useState(savedDraft?.childName ?? '');
  const [childKana, setChildKana] = useState(savedDraft?.childKana ?? '');
  const [childBirthday, setChildBirthday] = useState(savedDraft?.childBirthday ?? '');
  const [childGender, setChildGender] = useState<'男' | '女' | ''>(savedDraft?.childGender ?? '');
  const [kotobukiType, setKotobukiType] = useState(savedDraft?.kotobukiType ?? '');
  const [kotobukiOtherText, setKotobukiOtherText] = useState(savedDraft?.kotobukiOtherText ?? '');

  // Organization Form fields
  const [companyName, setCompanyName] = useState(savedDraft?.companyName ?? '');
  const [companyKana, setCompanyKana] = useState(savedDraft?.companyKana ?? '');
  const [companyAddress, setCompanyAddress] = useState(savedDraft?.companyAddress ?? '');
  const [companyAddressKana, setCompanyAddressKana] = useState(savedDraft?.companyAddressKana ?? '');
  const [representativeTitleName, setRepresentativeTitleName] = useState(savedDraft?.representativeTitleName ?? '');
  const [representativeKana, setRepresentativeKana] = useState(savedDraft?.representativeKana ?? '');
  const [staffDeptTitleName, setStaffDeptTitleName] = useState(savedDraft?.staffDeptTitleName ?? '');
  const [staffPhone, setStaffPhone] = useState(savedDraft?.staffPhone ?? '');
  const [staffEmail, setStaffEmail] = useState(savedDraft?.staffEmail ?? '');
  
  // Organization Talisman
  const [talismanName, setTalismanName] = useState(savedDraft?.talismanName ?? '');
  const [additionalTalismans, setAdditionalTalismans] = useState(savedDraft?.additionalTalismans ?? '');

  // Organization Receipt
  const [wantsReceipt, setWantsReceipt] = useState(savedDraft?.wantsReceipt ?? false);
  const [receipts, setReceipts] = useState<Array<{ id: string; name: string; amount: number }>>(() => {
    if (savedDraft?.receipts && Array.isArray(savedDraft.receipts) && savedDraft.receipts.length > 0) {
      return savedDraft.receipts;
    }
    if (savedDraft?.hasAdditionalReceipt) {
      return [
        { id: 'rec-1', name: savedDraft.receiptName || '', amount: savedDraft.receiptAmount || 10000 },
        { id: 'rec-2', name: savedDraft.receiptName2 || '', amount: savedDraft.receiptAmount2 || 10000 }
      ];
    }
    if (savedDraft?.receiptName || savedDraft?.receiptAmount) {
      return [{ id: 'rec-1', name: savedDraft.receiptName || '', amount: savedDraft.receiptAmount || 20000 }];
    }
    return [{ id: 'rec-1', name: '', amount: 20000 }];
  });

  const handleAddReceipt = () => {
    setReceipts(prev => [
      ...prev,
      { id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6), name: '', amount: 0 }
    ]);
  };

  const handleRemoveReceipt = (index: number) => {
    setReceipts(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleUpdateReceipt = (index: number, field: 'name' | 'amount', value: any) => {
    setReceipts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Organization Prayer Cart State
  const [orgPrayerItems, setOrgPrayerItems] = useState<OrgPrayerItem[]>(savedDraft?.orgPrayerItems ?? []);
  const [orgItemTalismanName, setOrgItemTalismanName] = useState(savedDraft?.orgItemTalismanName ?? '');

  // Additional Wooden Talismans (祈願符 木札) State
  const [wantsWoodTalisman, setWantsWoodTalisman] = useState<boolean>(savedDraft?.wantsWoodTalisman ?? false);
  const [woodTalismanCount, setWoodTalismanCount] = useState<number | ''>(savedDraft?.woodTalismanCount ?? '');
  const [woodTalismanLargeCount, setWoodTalismanLargeCount] = useState<number | ''>(savedDraft?.woodTalismanLargeCount ?? '');
  const [woodTalismanName, setWoodTalismanName] = useState<string>(savedDraft?.woodTalismanName ?? '');
  const [woodTalismanNames, setWoodTalismanNames] = useState<string[]>(() => {
    if (savedDraft?.woodTalismanNames && Array.isArray(savedDraft.woodTalismanNames)) {
      return savedDraft.woodTalismanNames;
    }
    const count = Number(savedDraft?.woodTalismanCount) || 0;
    return count > 0 ? Array(count).fill('') : [];
  });
  const [woodTalismanLargeNames, setWoodTalismanLargeNames] = useState<string[]>(() => {
    if (savedDraft?.woodTalismanLargeNames && Array.isArray(savedDraft.woodTalismanLargeNames)) {
      return savedDraft.woodTalismanLargeNames;
    }
    const count = Number(savedDraft?.woodTalismanLargeCount) || 0;
    return count > 0 ? Array(count).fill('') : [];
  });

  const handleWoodTalismanCountChange = (val: number | '') => {
    setWoodTalismanCount(val);
    const count = val === '' ? 0 : Math.max(0, val);
    setWoodTalismanNames(prev => {
      const next = [...prev];
      if (next.length < count) {
        while (next.length < count) next.push('');
      } else if (next.length > count) {
        return next.slice(0, count);
      }
      return next;
    });
  };

  const handleWoodTalismanLargeCountChange = (val: number | '') => {
    setWoodTalismanLargeCount(val);
    const count = val === '' ? 0 : Math.max(0, val);
    setWoodTalismanLargeNames(prev => {
      const next = [...prev];
      if (next.length < count) {
        while (next.length < count) next.push('');
      } else if (next.length > count) {
        return next.slice(0, count);
      }
      return next;
    });
  };

  const handleUpdateWoodTalismanName = (index: number, val: string) => {
    setWoodTalismanNames(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleUpdateWoodTalismanLargeName = (index: number, val: string) => {
    setWoodTalismanLargeNames(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleApplyDefaultNameToAllWoodTalismans = () => {
    const defaultBaseName = talismanName || (companyName ? (representativeTitleName ? `${companyName} ${representativeTitleName}` : companyName) : '');
    if (!defaultBaseName) {
      alert('会社名または代表者名を入力してから実行してください。');
      return;
    }
    const stdCount = Number(woodTalismanCount) || 0;
    const lrgCount = Number(woodTalismanLargeCount) || 0;
    setWoodTalismanNames(Array(stdCount).fill(defaultBaseName));
    setWoodTalismanLargeNames(Array(lrgCount).fill(defaultBaseName));
  };

  const getCombinedWoodTalismanName = () => {
    const defaultBaseName = talismanName || (companyName ? (representativeTitleName ? `${companyName} ${representativeTitleName}` : companyName) : '');
    const stdCount = Number(woodTalismanCount) || 0;
    const lrgCount = Number(woodTalismanLargeCount) || 0;
    const stdItems = stdCount > 0 ? woodTalismanNames.slice(0, stdCount) : [];
    const lrgItems = lrgCount > 0 ? woodTalismanLargeNames.slice(0, lrgCount) : [];
    const totalCount = stdItems.length + lrgItems.length;
    if (totalCount === 0) return '';
    if (totalCount === 1) {
      if (stdItems.length === 1) return stdItems[0].trim() || defaultBaseName;
      return lrgItems[0].trim() || defaultBaseName;
    }
    const parts: string[] = [];
    if (stdItems.length > 0) {
      const list = stdItems.map((n, i) => `${i + 1}:${n.trim() || defaultBaseName}`).join(' ');
      parts.push(`【36cm】${list}`);
    }
    if (lrgItems.length > 0) {
      const list = lrgItems.map((n, i) => `${i + 1}:${n.trim() || defaultBaseName}`).join(' ');
      parts.push(`【大45cm】${list}`);
    }
    return parts.join(' / ');
  };

  const getWoodTalismanItemsDataStr = () => {
    const defaultBaseName = talismanName || (companyName ? (representativeTitleName ? `${companyName} ${representativeTitleName}` : companyName) : '');
    const stdCount = Number(woodTalismanCount) || 0;
    const lrgCount = Number(woodTalismanLargeCount) || 0;
    return JSON.stringify({
      standard: stdCount > 0 ? woodTalismanNames.slice(0, stdCount).map(n => n.trim() || defaultBaseName) : [],
      large: lrgCount > 0 ? woodTalismanLargeNames.slice(0, lrgCount).map(n => n.trim() || defaultBaseName) : []
    });
  };

  const woodTalismanTotal = wantsWoodTalisman
    ? ((Number(woodTalismanCount) || 0) * 2000 + (Number(woodTalismanLargeCount) || 0) * 5000)
    : 0;
  const orgPrayersTotal = orgPrayerItems.reduce((sum, item) => sum + item.hatsuhoryo, 0);
  const effectiveOrgHatsuhoryo = (orgPrayerItems.length > 0 ? orgPrayersTotal : hatsuhoryo) + woodTalismanTotal;

  const targetReceiptCheckAmount = bookingType === 'organization' ? effectiveOrgHatsuhoryo : hatsuhoryo;
  const totalReceiptAmount = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const isReceiptAmountMatched = totalReceiptAmount === targetReceiptCheckAmount;

  const handleDistributeReceiptsEqually = () => {
    if (receipts.length === 0) return;
    const count = receipts.length;
    const basePerItem = Math.floor(targetReceiptCheckAmount / count);
    const remainder = targetReceiptCheckAmount % count;
    setReceipts(prev => prev.map((item, idx) => ({
      ...item,
      amount: idx === 0 ? basePerItem + remainder : basePerItem
    })));
  };

  // Organization Dynamic fields
  const [orgCustomPrayer1, setOrgCustomPrayer1] = useState(savedDraft?.orgCustomPrayer1 ?? '');
  const [orgCustomPrayer2, setOrgCustomPrayer2] = useState(savedDraft?.orgCustomPrayer2 ?? '');
  const [tournamentName, setTournamentName] = useState(savedDraft?.tournamentName ?? '');
  const [tournamentSchedule, setTournamentSchedule] = useState(savedDraft?.tournamentSchedule ?? '');
  const [constructionName, setConstructionName] = useState(savedDraft?.constructionName ?? '');
  const [constructionDesigner, setConstructionDesigner] = useState(savedDraft?.constructionDesigner ?? '');
  const [constructionBuilder, setConstructionBuilder] = useState(savedDraft?.constructionBuilder ?? '');
  const [constructionPeriod, setConstructionPeriod] = useState(savedDraft?.constructionPeriod ?? '');

  const [skipVictoryDetails, setSkipVictoryDetails] = useState(savedDraft?.skipVictoryDetails ?? false);
  const [skipConstructionDetails, setSkipConstructionDetails] = useState(savedDraft?.skipConstructionDetails ?? false);

  const handleAddOrgPrayerItem = () => {
    if (!prayer1) {
      setErrorMsg('主願意を選択してください。');
      return;
    }
    if (prayer1 === 'その他（自由入力）' && !orgCustomPrayer1.trim()) {
      setErrorMsg('主願意の自由入力内容をご入力ください。');
      return;
    }
    if (prayer2 === 'その他（自由入力）' && !orgCustomPrayer2.trim()) {
      setErrorMsg('副願意の自由入力内容をご入力ください。');
      return;
    }

    const orgMinPrice = Number(attendingCount) < 5 ? 20000 : 30000;
    if (hatsuhoryo < orgMinPrice) {
      setErrorMsg(`団体参拝の初穂料は目安金額（${orgMinPrice.toLocaleString()}円以上）をご入力ください。`);
      return;
    }

    const isVictory = prayer1 === '必勝祈願' || prayer2 === '必勝祈願';
    if (isVictory && !skipVictoryDetails && (!tournamentName.trim() || !tournamentSchedule.trim())) {
      setErrorMsg('必勝祈願の大会名称および大会日程をご入力ください（不要な場合は「詳細情報の入力をスキップする」にチェックしてください）。');
      return;
    }

    const isConstruction = prayer1 === '工事安全' || prayer2 === '工事安全';
    if (isConstruction && !skipConstructionDetails && (!constructionName.trim() || !constructionDesigner.trim() || !constructionBuilder.trim() || !constructionPeriod.trim())) {
      setErrorMsg('工事安全祈願の工事名称・設計監理者・施工者・工期をすべてご入力ください（不要な場合は「詳細情報の入力をスキップする」にチェックしてください）。');
      return;
    }

    setErrorMsg('');

    const newOrgItem: OrgPrayerItem = {
      id: Math.random().toString(36).substring(2, 9),
      prayer1,
      org_custom_prayer1: prayer1 === 'その他（自由入力）' ? orgCustomPrayer1.trim() : undefined,
      prayer2: prayer2 || undefined,
      org_custom_prayer2: prayer2 === 'その他（自由入力）' ? orgCustomPrayer2.trim() : undefined,
      hatsuhoryo,
      talisman_name: orgItemTalismanName.trim() || undefined,
      tournament_name: isVictory && !skipVictoryDetails ? tournamentName.trim() : undefined,
      tournament_schedule: isVictory && !skipVictoryDetails ? tournamentSchedule.trim() : undefined,
      construction_name: isConstruction && !skipConstructionDetails ? constructionName.trim() : undefined,
      construction_designer: isConstruction && !skipConstructionDetails ? constructionDesigner.trim() : undefined,
      construction_builder: isConstruction && !skipConstructionDetails ? constructionBuilder.trim() : undefined,
      construction_period: isConstruction && !skipConstructionDetails ? constructionPeriod.trim() : undefined
    };

    setOrgPrayerItems(prev => [...prev, newOrgItem]);

    // Reset current prayer inputs
    setPrayer1('');
    setOrgCustomPrayer1('');
    setPrayer2('');
    setOrgCustomPrayer2('');
    setOrgItemTalismanName('');
    setTournamentName('');
    setTournamentSchedule('');
    setSkipVictoryDetails(false);
    setConstructionName('');
    setConstructionDesigner('');
    setConstructionBuilder('');
    setConstructionPeriod('');
    setSkipConstructionDetails(false);
  };

  const handleRemoveOrgPrayerItem = (id: string) => {
    setOrgPrayerItems(prev => prev.filter(item => item.id !== id));
  };

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
  const [userBirthYear, setUserBirthYear] = useState(savedDraft?.userBirthYear ?? '');
  const [userBirthMonth, setUserBirthMonth] = useState(savedDraft?.userBirthMonth ?? '');
  const [userBirthDay, setUserBirthDay] = useState(savedDraft?.userBirthDay ?? '');
  const [activeMainTab, setActiveMainTab] = useState<'form' | 'faq' | 'lookup'>('form');
  const [lookupReceiptNumber, setLookupReceiptNumber] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [carMaker, setCarMaker] = useState(savedDraft?.carMaker ?? '');
  const [carModel, setCarModel] = useState(savedDraft?.carModel ?? '');
  const [carNumber, setCarNumber] = useState(savedDraft?.carNumber ?? '');
  const [carInfoPending, setCarInfoPending] = useState(savedDraft?.carInfoPending ?? false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [anzanHusbandName, setAnzanHusbandName] = useState(savedDraft?.anzanHusbandName ?? '');
  const [anzanHusbandKana, setAnzanHusbandKana] = useState(savedDraft?.anzanHusbandKana ?? '');
  const [anzanSkipHusband, setAnzanSkipHusband] = useState(savedDraft?.anzanSkipHusband ?? false);
  const [anzanWifeName, setAnzanWifeName] = useState(savedDraft?.anzanWifeName ?? '');
  const [anzanWifeKana, setAnzanWifeKana] = useState(savedDraft?.anzanWifeKana ?? '');
  const [anzanSkipWife, setAnzanSkipWife] = useState(savedDraft?.anzanSkipWife ?? false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const apiUrl = getApiUrl();
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

  // Save form draft to localStorage whenever relevant fields change
  useEffect(() => {
    // Redundant save effect disabled to prevent duplicate writes
    return;
    // If booking is completed, we don't save the draft
    if (createdBooking) {
      return;
    }
    const draftData = {
      step,
      bookingType,
      selectedDate,
      selectedTime,
      prayer1,
      prayer2,
      hatsuhoryo,
      attendingCount,
      prayerItems,
      hasPastPrayer,
      isTwin,
      childName2,
      childKana2,
      childBirthday2,
      childGender2,
      notes,
      birthYear,
      birthMonth,
      birthDay,
      birthYear2,
      birthMonth2,
      birthDay2,
      name,
      kana,
      prayerName,
      prayerKana,
      address,
      addressKana,
      phone,
      email,
      yakudoshiType,
      fatherName,
      fatherKana,
      motherName,
      motherKana,
      childName,
      childKana,
      childBirthday,
      childGender,
      kotobukiType,
      kotobukiOtherText,
      companyName,
      companyKana,
      companyAddress,
      companyAddressKana,
      representativeTitleName,
      representativeKana,
      staffDeptTitleName,
      staffPhone,
      staffEmail,
      talismanName,
      additionalTalismans,
      wantsReceipt,
      receipts,
      orgPrayerItems,
      orgItemTalismanName,
      wantsWoodTalisman,
      woodTalismanCount,
      woodTalismanLargeCount,
      woodTalismanName,
      woodTalismanNames,
      woodTalismanLargeNames,
      orgCustomPrayer1,
      orgCustomPrayer2,
      tournamentName,
      tournamentSchedule,
      constructionName,
      constructionDesigner,
      constructionBuilder,
      constructionPeriod,
      skipVictoryDetails,
      skipConstructionDetails,
      userBirthYear,
      userBirthMonth,
      userBirthDay,
      carMaker,
      carModel,
      carNumber,
      anzanHusbandName,
      anzanHusbandKana,
      anzanSkipHusband,
      anzanWifeName,
      anzanWifeKana,
      anzanSkipWife
    };
    try {
      localStorage.setItem('kagura_booking_form_state', JSON.stringify(draftData));
    } catch (e) {
      console.error('Failed to save booking draft:', e);
    }
  }, [
    step,
    bookingType,
    selectedDate,
    selectedTime,
    prayer1,
    prayer2,
    hatsuhoryo,
    attendingCount,
    prayerItems,
    hasPastPrayer,
    isTwin,
    childName2,
    childKana2,
    childBirthday2,
    notes,
    birthYear,
    birthMonth,
    birthDay,
    birthYear2,
    birthMonth2,
    birthDay2,
    name,
    kana,
    prayerName,
    prayerKana,
    address,
    addressKana,
    phone,
    email,
    yakudoshiType,
    fatherName,
    fatherKana,
    motherName,
    motherKana,
    childName,
    childKana,
    childBirthday,
    kotobukiType,
    kotobukiOtherText,
    companyName,
    companyKana,
    companyAddress,
    companyAddressKana,
    representativeTitleName,
    representativeKana,
    staffDeptTitleName,
    staffPhone,
    staffEmail,
    talismanName,
    additionalTalismans,
    wantsReceipt,
    receipts,
    orgPrayerItems,
    orgItemTalismanName,
    wantsWoodTalisman,
    woodTalismanCount,
    woodTalismanLargeCount,
    woodTalismanName,
    woodTalismanNames,
    woodTalismanLargeNames,
    orgCustomPrayer1,
    orgCustomPrayer2,
    tournamentName,
    tournamentSchedule,
    constructionName,
    constructionDesigner,
    constructionBuilder,
    constructionPeriod,
    skipVictoryDetails,
    skipConstructionDetails,
    userBirthYear,
    userBirthMonth,
    userBirthDay,
    carMaker,
    carModel,
    carNumber,
    anzanHusbandName,
    anzanHusbandKana,
    anzanSkipHusband,
    childGender,
    childGender2,
    anzanWifeName,
    anzanWifeKana,
    anzanSkipWife,
    createdBooking
  ]);

  // Block accidental page navigation/reload during booking
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't warn if booking completed or editMode is on or form is entirely blank
      const isBlank = step === 1 && !name && !companyName && !selectedDate && !prayer1;
      if (createdBooking || isEditMode || isBlank) {
        return;
      }
      e.preventDefault();
      e.returnValue = 'ご入力中の予約情報は失われます。本当にページを離れますか？';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [step, name, companyName, selectedDate, prayer1, createdBooking, isEditMode]);

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
      const parsedReceipts = getBookingReceipts(b);
      if (parsedReceipts.length > 0) {
        setReceipts(parsedReceipts.map((r, idx) => ({
          id: `rec-${Date.now()}-${idx}`,
          name: r.name,
          amount: r.amount
        })));
      } else {
        setReceipts([{ id: 'rec-1', name: b.receipt_name || b.company_name || '', amount: b.receipt_amount || b.hatsuhoryo || 20000 }]);
      }

      // Additional Wood Talismans
      const hasWoodTalisman = Boolean((b.wood_talisman_count && b.wood_talisman_count > 0) || (b.wood_talisman_large_count && b.wood_talisman_large_count > 0));
      setWantsWoodTalisman(hasWoodTalisman);
      setWoodTalismanCount(b.wood_talisman_count || '');
      setWoodTalismanLargeCount(b.wood_talisman_large_count || '');
      setWoodTalismanName(b.wood_talisman_name || '');
      let parsedWoodItems: { standard?: string[]; large?: string[] } | null = null;
      if (b.wood_talisman_items_data) {
        try { parsedWoodItems = JSON.parse(b.wood_talisman_items_data); } catch(e) {}
      }
      if (parsedWoodItems) {
        setWoodTalismanNames(parsedWoodItems.standard || []);
        setWoodTalismanLargeNames(parsedWoodItems.large || []);
      } else {
        const stdCount = b.wood_talisman_count || 0;
        const lrgCount = b.wood_talisman_large_count || 0;
        setWoodTalismanNames(stdCount > 0 ? Array(stdCount).fill(b.wood_talisman_name || '') : []);
        setWoodTalismanLargeNames(lrgCount > 0 ? Array(lrgCount).fill(b.wood_talisman_name || '') : []);
      }

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

  useEffect(() => {
    if (birthYear3 && birthMonth3 && birthDay3) {
      setChildBirthday3(`${birthYear3}-${birthMonth3.padStart(2, '0')}-${birthDay3.padStart(2, '0')}`);
    } else {
      setChildBirthday3('');
    }
  }, [birthYear3, birthMonth3, birthDay3]);

  useEffect(() => {
    if (birthYear4 && birthMonth4 && birthDay4) {
      setChildBirthday4(`${birthYear4}-${birthMonth4.padStart(2, '0')}-${birthDay4.padStart(2, '0')}`);
    } else {
      setChildBirthday4('');
    }
  }, [birthYear4, birthMonth4, birthDay4]);

  const getChildItemAtIndex = (idx: number) => {
    if (idx === 1) return {
      name: childName, kana: childKana, birthday: childBirthday, gender: childGender,
      y: birthYear, m: birthMonth, d: birthDay,
      setName: setChildName, setKana: setChildKana, setGender: setChildGender,
      setY: setBirthYear, setM: setBirthMonth, setD: setBirthDay
    };
    if (idx === 2) return {
      name: childName2, kana: childKana2, birthday: childBirthday2, gender: childGender2,
      y: birthYear2, m: birthMonth2, d: birthDay2,
      setName: setChildName2, setKana: setChildKana2, setGender: setChildGender2,
      setY: setBirthYear2, setM: setBirthMonth2, setD: setBirthDay2
    };
    if (idx === 3) return {
      name: childName3, kana: childKana3, birthday: childBirthday3, gender: childGender3,
      y: birthYear3, m: birthMonth3, d: birthDay3,
      setName: setChildName3, setKana: setChildKana3, setGender: setChildGender3,
      setY: setBirthYear3, setM: setBirthMonth3, setD: setBirthDay3
    };
    return {
      name: childName4, kana: childKana4, birthday: childBirthday4, gender: childGender4,
      y: birthYear4, m: birthMonth4, d: birthDay4,
      setName: setChildName4, setKana: setChildKana4, setGender: setChildGender4,
      setY: setBirthYear4, setM: setBirthMonth4, setD: setBirthDay4
    };
  };

  const buildChildrenData = (count: number): ChildItem[] => {
    const list: ChildItem[] = [];
    for (let i = 1; i <= count; i++) {
      const c = getChildItemAtIndex(i);
      const ageInfo = getChildAgeDetail(c.y, c.m, c.d, selectedDate);
      list.push({
        name: c.name,
        kana: c.kana,
        gender: (c.gender === '男' || c.gender === '女') ? c.gender : undefined,
        birthday: c.birthday,
        age_text: ageInfo ? `${ageInfo.celebrationStage || `${ageInfo.manAge}歳`} (満${ageInfo.manAge}歳/数え${ageInfo.kazoeAge}歳)` : undefined
      });
    }
    return list;
  };

  // Save fields on changes (skip complete screen)
  const isCompleted = sessionStorage.getItem('booking_completed') === 'true';
  useEffect(() => {
    if (!isRestored || isCompleted || step === 4) return;

    const stateToSave = {
      step, bookingType, selectedDate, selectedTime,
      prayer1, prayer2, hatsuhoryo, attendingCount, prayerItems,
      name, kana, address, addressKana, phone, email,
      companyName, companyKana, companyAddress, companyAddressKana,
      representativeTitleName, representativeKana, staffDeptTitleName, staffPhone, staffEmail,
      talismanName, additionalTalismans, wantsReceipt, receipts,
      hasPastPrayer, isTwin, shichigosanChildCount,
      childName2, childKana2, childBirthday2, childGender2,
      childName3, childKana3, childBirthday3, childGender3,
      childName4, childKana4, childBirthday4, childGender4,
      notes,
      birthYear, birthMonth, birthDay,
      birthYear2, birthMonth2, birthDay2,
      birthYear3, birthMonth3, birthDay3,
      birthYear4, birthMonth4, birthDay4,
      userBirthYear, userBirthMonth, userBirthDay,
      activeMainTab, childName, childKana, childBirthday, childGender,
      yakudoshiType, fatherName, fatherKana, motherName, motherKana,
      childSkipFather, childSkipMother,
      kotobukiType, kotobukiOtherText,
      carMaker, carModel, carNumber, carInfoPending,
      prayerName, prayerKana,
      anzanHusbandName, anzanHusbandKana, anzanSkipHusband,
      anzanWifeName, anzanWifeKana, anzanSkipWife
    };
    try {
      localStorage.setItem('kagura_booking_form_state', JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save booking draft:', e);
    }
  }, [
    isRestored, step, bookingType, selectedDate, selectedTime,
    prayer1, prayer2, hatsuhoryo, attendingCount, prayerItems,
    name, kana, address, addressKana, phone, email,
    companyName, companyKana, companyAddress, companyAddressKana,
    representativeTitleName, representativeKana, staffDeptTitleName, staffPhone, staffEmail,
    talismanName, additionalTalismans, wantsReceipt, receipts,
    hasPastPrayer, isTwin, shichigosanChildCount,
    childName2, childKana2, childBirthday2, childGender2,
    childName3, childKana3, childBirthday3, childGender3,
    childName4, childKana4, childBirthday4, childGender4,
    notes,
    birthYear, birthMonth, birthDay,
    birthYear2, birthMonth2, birthDay2,
    birthYear3, birthMonth3, birthDay3,
    birthYear4, birthMonth4, birthDay4,
    userBirthYear, userBirthMonth, userBirthDay,
    activeMainTab, childName, childKana, childBirthday, childGender,
    yakudoshiType, fatherName, fatherKana, motherName, motherKana,
    childSkipFather, childSkipMother,
    kotobukiType, kotobukiOtherText,
    carMaker, carModel, carNumber, carInfoPending,
    prayerName, prayerKana,
    anzanHusbandName, anzanHusbandKana, anzanSkipHusband,
    anzanWifeName, anzanWifeKana, anzanSkipWife
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
        if (state.representativeKana) setRepresentativeKana(state.representativeKana);
        if (state.staffDeptTitleName) setStaffDeptTitleName(state.staffDeptTitleName);
        if (state.staffPhone) setStaffPhone(state.staffPhone);
        if (state.staffEmail) setStaffEmail(state.staffEmail);

        if (state.talismanName) setTalismanName(state.talismanName);
        if (state.additionalTalismans) setAdditionalTalismans(state.additionalTalismans);
        if (state.wantsReceipt !== undefined) setWantsReceipt(state.wantsReceipt);
        if (state.receipts && Array.isArray(state.receipts) && state.receipts.length > 0) {
          setReceipts(state.receipts);
        } else if (state.receiptName || state.receiptAmount) {
          const items = [{ id: 'rec-1', name: state.receiptName || '', amount: state.receiptAmount || 20000 }];
          if (state.hasAdditionalReceipt && state.receiptName2) {
            items.push({ id: 'rec-2', name: state.receiptName2, amount: state.receiptAmount2 || 0 });
          }
          setReceipts(items);
        }

        if (state.hasPastPrayer !== undefined) setHasPastPrayer(state.hasPastPrayer);
        if (state.isTwin !== undefined) setIsTwin(state.isTwin);
        if (state.shichigosanChildCount) setShichigosanChildCount(state.shichigosanChildCount);
        if (state.childName2) setChildName2(state.childName2);
        if (state.childKana2) setChildKana2(state.childKana2);
        if (state.childBirthday2) setChildBirthday2(state.childBirthday2);
        if (state.childGender2) setChildGender2(state.childGender2);

        if (state.childName3) setChildName3(state.childName3);
        if (state.childKana3) setChildKana3(state.childKana3);
        if (state.childBirthday3) setChildBirthday3(state.childBirthday3);
        if (state.childGender3) setChildGender3(state.childGender3);

        if (state.childName4) setChildName4(state.childName4);
        if (state.childKana4) setChildKana4(state.childKana4);
        if (state.childBirthday4) setChildBirthday4(state.childBirthday4);
        if (state.childGender4) setChildGender4(state.childGender4);
        if (state.notes) setNotes(state.notes);

        if (state.birthYear) setBirthYear(state.birthYear);
        if (state.birthMonth) setBirthMonth(state.birthMonth);
        if (state.birthDay) setBirthDay(state.birthDay);

        if (state.birthYear2) setBirthYear2(state.birthYear2);
        if (state.birthMonth2) setBirthMonth2(state.birthMonth2);
        if (state.birthDay2) setBirthDay2(state.birthDay2);

        if (state.birthYear3) setBirthYear3(state.birthYear3);
        if (state.birthMonth3) setBirthMonth3(state.birthMonth3);
        if (state.birthDay3) setBirthDay3(state.birthDay3);

        if (state.birthYear4) setBirthYear4(state.birthYear4);
        if (state.birthMonth4) setBirthMonth4(state.birthMonth4);
        if (state.birthDay4) setBirthDay4(state.birthDay4);

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
        if (state.carInfoPending !== undefined) setCarInfoPending(state.carInfoPending);

        if (state.prayerName) setPrayerName(state.prayerName);
        if (state.prayerKana) setPrayerKana(state.prayerKana);
        if (state.anzanHusbandName) setAnzanHusbandName(state.anzanHusbandName);
        if (state.anzanHusbandKana) setAnzanHusbandKana(state.anzanHusbandKana);
        if (state.anzanSkipHusband !== undefined) setAnzanSkipHusband(state.anzanSkipHusband);
        if (state.childGender) setChildGender(state.childGender);
        if (state.childGender2) setChildGender2(state.childGender2);
        if (state.anzanWifeName) setAnzanWifeName(state.anzanWifeName);
        if (state.anzanWifeKana) setAnzanWifeKana(state.anzanWifeKana);
        if (state.anzanSkipWife !== undefined) setAnzanSkipWife(state.anzanSkipWife);
      } catch (e) {
        console.error('Failed to restore form state:', e);
      } finally {
        setIsRestored(true);
      }
    } else {
      setIsRestored(true);
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
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/bookings/${id}`);
      if (!res.ok) throw new Error('ご予約情報が見つかりません。すでにキャンセルされている可能性があります。');
      const data = await res.json();
      setTargetBooking(data);
      if (Array.isArray(data.related_bookings)) {
        setRelatedBookings(data.related_bookings);
      }
    } catch (err: any) {
      setChangeError(err.message || '情報の読み込みに失敗しました。');
    } finally {
      setChangeLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!targetBooking || !targetBooking.id) return;
    
    const count = 1 + (batchCancelRelated ? relatedBookings.length : 0);
    const confirmMsg = count > 1
      ? `同一申込者のご予約（合計 ${count} 件）をすべてキャンセルしてもよろしいですか？この操作は取り消せません。`
      : 'ご予約をキャンセルしてもよろしいですか？この操作は取り消せません。';
    if (!confirm(confirmMsg)) return;

    setChangeLoading(true);
    setChangeError('');
    try {
      const apiUrl = getApiUrl();
      
      // 1. Cancel primary target
      const res = await fetch(`${apiUrl}/api/bookings/${targetBooking.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('キャンセル処理に失敗しました。');

      // 2. Batch cancel related bookings if checked
      if (batchCancelRelated && relatedBookings.length > 0) {
        for (const rel of relatedBookings) {
          if (rel.id) {
            await fetch(`${apiUrl}/api/bookings/${rel.id}`, { method: 'DELETE' });
          }
        }
      }

      setChangeSuccessMsg(count > 1 
        ? `ご予約（関連予約を含む合計 ${count} 件）のキャンセル手続きがすべて完了いたしました。またのご参拝を心よりお待ちしております。`
        : 'ご予約のキャンセル手続きが完了いたしました。またのご予約を心よりお待ちしております。');
      setTargetBooking(null);
      setRelatedBookings([]);
    } catch (err: any) {
      setChangeError(err.message || '通信エラーが発生しました。');
    } finally {
      setChangeLoading(false);
    }
  };

  const handleLookupBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupReceiptNumber.trim() || !lookupPhone.trim()) {
      setLookupError('受付番号とお電話番号を入力してください。');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt_number: lookupReceiptNumber.trim(),
          phone: lookupPhone.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '該当する予約が見つかりませんでした。');
      }
      setChangeId(String(data.id));
      fetchTargetBooking(String(data.id));
      window.history.replaceState({}, '', `${window.location.pathname}?changeId=${data.id}`);
    } catch (err: any) {
      setLookupError(err.message || '照会に失敗しました。');
    } finally {
      setLookupLoading(false);
    }
  };



  // 1. Manage Hatsuhoryo changes based on willingness and organization headcount
  useEffect(() => {
    if (bookingType === 'individual') {
      setHatsuhoryo(getIndividualMinPrice(prayer1, isTwin, prayer1 === '七五三詣' ? shichigosanChildCount : 1));
    } else {
      // Organization base pricing: under 5 people = 20k, 5 or more = 30k
      const basePrice = Number(attendingCount) < 5 ? 20000 : 30000;
      setHatsuhoryo(basePrice);
      // Auto sync receipt amount if only 1 receipt
      setReceipts(prev => {
        if (prev.length === 1 && prev[0].amount !== basePrice) {
          return [{ ...prev[0], amount: basePrice }];
        }
        return prev;
      });
    }
  }, [prayer1, bookingType, attendingCount, isTwin, shichigosanChildCount]);

  // Sync Organization names to default receipt name
  useEffect(() => {
    if (bookingType === 'organization' && companyName) {
      setReceipts(prev => {
        if (prev.length > 0 && !prev[0].name) {
          const next = [...prev];
          next[0] = { ...next[0], name: companyName };
          return next;
        }
        return prev;
      });
    }
  }, [companyName, bookingType]);

  // Sync single receipt amount to total organization hatsuhoryo (including wood talismans)
  useEffect(() => {
    if (bookingType === 'organization') {
      setReceipts(prev => {
        if (prev.length === 1 && prev[0].amount !== effectiveOrgHatsuhoryo) {
          return [{ ...prev[0], amount: effectiveOrgHatsuhoryo }];
        }
        return prev;
      });
    }
  }, [bookingType, effectiveOrgHatsuhoryo]);

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
      for (let i = 0; i < prayerItems.length; i++) {
        const item = prayerItems[i];
        const childCount = item.children_data ? getBookingChildren(item).length : (item.is_twin ? 2 : 1);
        const minPrice = getIndividualMinPrice(item.prayer1, Boolean(item.is_twin), childCount);
        const effectiveMin = (isEditMode && item.prayer1 === '安産祈願' && item.hatsuhoryo >= 5000) ? 5000 : minPrice;
        if (item.hatsuhoryo < effectiveMin) {
          return `【${item.prayer1}（${item.name}様）】の初穂料（${item.hatsuhoryo.toLocaleString()}円）が目安金額（${effectiveMin.toLocaleString()}円）を下回っています。目安金額以上の金額をご設定ください。`;
        }
        if (item.prayer1 === '初宮詣（お宮参り）' || item.prayer1 === '七五三詣' || item.prayer1 === '十三参り') {
          const hasFather = Boolean(item.father_name?.trim() || item.father_kana?.trim());
          const hasMother = Boolean(item.mother_name?.trim() || item.mother_kana?.trim());
          if (!hasFather && !hasMother) {
            return `【${item.prayer1}】では、ご両親（父親または母親）のいずれか一方の氏名およびフリガナの入力が必須です。`;
          }
          if (hasFather && (!item.father_name?.trim() || !item.father_kana?.trim())) {
            return `【${item.prayer1}】父親のお名前を入力される場合は、氏名とフリガナの両方を入力してください。`;
          }
          if (hasMother && (!item.mother_name?.trim() || !item.mother_kana?.trim())) {
            return `【${item.prayer1}】母親のお名前を入力される場合は、氏名とフリガナの両方を入力してください。`;
          }
        }
      }
      if (!name.trim() || !kana.trim() || !address.trim() || !addressKana.trim() || !phone.trim() || !email.trim()) {
        return '必須のご予約者様情報（お名前・フリガナ・ご住所・電話番号・メールアドレス）をご入力ください。';
      }
    } else {
      // Organization validation
      if (orgPrayerItems.length === 0) {
        if (!prayer1) {
          return '主願意を選択し、「このご祈祷（願意）を予約リストに追加」ボタンを押してリストに1件以上追加してください。';
        } else {
          return '入力中のご祈祷（願意）を「このご祈祷（願意）を予約リストに追加」ボタンを押してリストに追加してください。';
        }
      }

      const orgMinPrice = Number(attendingCount) < 5 ? 20000 : 30000;
      for (let i = 0; i < orgPrayerItems.length; i++) {
        const item = orgPrayerItems[i];
        if (item.hatsuhoryo < orgMinPrice) {
          const pName = item.prayer1 === 'その他（自由入力）' ? item.org_custom_prayer1 : item.prayer1;
          return `【${pName}】の初穂料（${item.hatsuhoryo.toLocaleString()}円）が目安金額（${orgMinPrice.toLocaleString()}円）を下回っています。目安金額以上の金額をご設定ください。`;
        }
      }

      if (!companyName.trim() || !companyKana.trim() || !companyAddress.trim() || !companyAddressKana.trim() || 
          !representativeTitleName.trim() || !representativeKana.trim() || !staffDeptTitleName.trim() || !staffPhone.trim() || !staffEmail.trim() ||
          !talismanName.trim()) {
        return '企業情報（企業名・所在地・代表者・担当者氏名・連絡先等）および神札墨書名をすべてご入力ください。';
      }

      if (wantsWoodTalisman) {
        const totalCount = (Number(woodTalismanCount) || 0) + (Number(woodTalismanLargeCount) || 0);
        if (totalCount <= 0) {
          return '追加の木の御札をお求めの場合は、祈願符（木札）または祈願符（木札・大）の必要体数を1体以上ご入力ください。';
        }
      }

      if (wantsReceipt) {
        if (receipts.length === 0) {
          return '領収証の発行情報を入力してください。';
        }
        for (let idx = 0; idx < receipts.length; idx++) {
          const r = receipts[idx];
          if (!r.name.trim() || Number(r.amount) <= 0) {
            return receipts.length > 1
              ? `追加の領収証（${idx + 1}社目）に必要な宛名および金額を正しくご入力ください。`
              : '領収証の発行に必要な宛名および金額を正しくご入力ください。';
          }
        }
        if (!isReceiptAmountMatched) {
          return `領収証の合計金額（${totalReceiptAmount.toLocaleString()}円）が、初穂料・御札の合計金額（${targetReceiptCheckAmount.toLocaleString()}円）と一致していません。`;
        }
      }
    }
    return '';
  };

  const handleCopyFromPrayerItem = () => {
    if (prayerItems.length === 0) return;
    const firstItem = prayerItems[0];
    
    // Resolve name and kana to copy
    let nameToCopy = '';
    let kanaToCopy = '';

    if (firstItem.prayer1 === '安産祈願') {
      // For pregnancy, try wife name first, then husband name
      if (firstItem.mother_name) {
        nameToCopy = firstItem.mother_name;
        kanaToCopy = firstItem.mother_kana || '';
      } else if (firstItem.father_name) {
        nameToCopy = firstItem.father_name;
        kanaToCopy = firstItem.father_kana || '';
      }
    } else if (firstItem.prayer1 === '初宮詣（お宮参り）' || firstItem.prayer1 === '七五三詣') {
      // For baby/children, copy father or mother name
      if (firstItem.father_name) {
        nameToCopy = firstItem.father_name;
        kanaToCopy = firstItem.father_kana || '';
      } else if (firstItem.mother_name) {
        nameToCopy = firstItem.mother_name;
        kanaToCopy = firstItem.mother_kana || '';
      }
    } else {
      // For normal prayers, copy the target person's name
      nameToCopy = firstItem.name || '';
      kanaToCopy = firstItem.kana || '';
    }

    if (nameToCopy) setName(nameToCopy);
    if (kanaToCopy) setKana(kanaToCopy);
  };

  const handleAddPrayerItem = () => {
    if (!prayer1) {
      alert('願意を選択してください。');
      return;
    }

    const minPrice = getIndividualMinPrice(prayer1, isTwin, prayer1 === '七五三詣' ? shichigosanChildCount : 1);
    const effectiveMin = (isEditMode && prayer1 === '安産祈願' && hatsuhoryo >= 5000) ? 5000 : minPrice;
    if (hatsuhoryo < effectiveMin) {
      alert(`初穂料は選択された願意の目安金額（${effectiveMin.toLocaleString()}円以上）をご入力ください。`);
      return;
    }

    if (prayer1 === '安産祈願') {
      if (anzanSkipHusband && anzanSkipWife) {
        alert('夫と妻のどちらか一方のお名前は必ず登録してください。');
        return;
      }
      if (!anzanSkipHusband && (!anzanHusbandName.trim() || !anzanHusbandKana.trim())) {
        alert('夫のお名前とフリガナを入力してください（登録しない場合は「夫のお名前を登録しない」にチェックを入れてください）。');
        return;
      }
      if (!anzanSkipWife && (!anzanWifeName.trim() || !anzanWifeKana.trim())) {
        alert('妻のお名前とフリガナを入力してください（登録しない場合は「妻のお名前を登録しない」にチェックを入れてください）。');
        return;
      }
    } else {
      if (!prayerName.trim() || !prayerKana.trim()) {
        alert('ご祈祷を受けられる方のお名前とフリガナを入力してください。');
        return;
      }
    }

    // Dynamic field validation
    if (prayer1 === '厄年のお祓い' && !yakudoshiType) {
      alert('厄年区分を選択してください。');
      return;
    }
    if (prayer1 === '七五三詣') {
      for (let i = 1; i <= shichigosanChildCount; i++) {
        const c = getChildItemAtIndex(i);
        if (!c.name.trim() || !c.kana.trim() || !c.birthday || !c.gender) {
          alert(`七五三詣のお子様（${i}人目）のお名前、フリガナ、性別、生年月日はすべて必須です。`);
          return;
        }
      }
      if (childSkipFather && childSkipMother) {
        alert('父親または母親のいずれか一方のお名前は必ずご登録ください。');
        return;
      }
      if (!childSkipFather && (!fatherName.trim() || !fatherKana.trim())) {
        alert('父親のお名前とフリガナを入力してください（片親のご家庭など登録されない場合は「父親のお名前を登録しない」にチェックを入れてください）。');
        return;
      }
      if (!childSkipMother && (!motherName.trim() || !motherKana.trim())) {
        alert('母親のお名前とフリガナを入力してください（片親のご家庭など登録されない場合は「母親のお名前を登録しない」にチェックを入れてください）。');
        return;
      }
    } else if (prayer1 === '初宮詣（お宮参り）' || prayer1 === '十三参り') {
      const isCurrentTwin = prayer1 === '初宮詣（お宮参り）' && isTwin;
      if (isCurrentTwin) {
        if (!childName.trim() || !childKana.trim() || !childBirthday || !childGender || !childName2.trim() || !childKana2.trim() || !childBirthday2 || !childGender2) {
          alert('双子のお子様お二人分のお名前、フリガナ、性別、生年月日はすべて必須です。');
          return;
        }
      } else {
        if (!childName.trim() || !childKana.trim() || !childBirthday || !childGender) {
          alert('お子様のお名前、フリガナ、性別、生年月日は必須です。');
          return;
        }
      }
      if (childSkipFather && childSkipMother) {
        alert('父親または母親のいずれか一方のお名前は必ずご登録ください。');
        return;
      }
      if (!childSkipFather && (!fatherName.trim() || !fatherKana.trim())) {
        alert('父親のお名前とフリガナを入力してください（片親のご家庭など登録されない場合は「父親のお名前を登録しない」にチェックを入れてください）。');
        return;
      }
      if (!childSkipMother && (!motherName.trim() || !motherKana.trim())) {
        alert('母親のお名前とフリガナを入力してください（片親のご家庭など登録されない場合は「母親のお名前を登録しない」にチェックを入れてください）。');
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
    if (prayer1 === '車祓（お車のお祓い）' && !carInfoPending && (!carMaker.trim() || !carModel.trim() || !carNumber.trim())) {
      alert('お車のメーカー、車種、ナンバーをご入力ください（未定の場合は「納車前などでお車情報が未定」にチェックを入れてください）。');
      return;
    }

    // Resolve displayed names
    let resolvedName = prayerName;
    let resolvedKana = prayerKana;

    if (prayer1 === '安産祈願') {
      const parts = [];
      const kanaParts = [];
      if (!anzanSkipHusband) {
        parts.push(`${anzanHusbandName} (夫)`);
        kanaParts.push(anzanHusbandKana);
      }
      if (!anzanSkipWife) {
        parts.push(`${anzanWifeName} (妻)`);
        kanaParts.push(anzanWifeKana);
      }
      resolvedName = parts.join('・');
      resolvedKana = kanaParts.join('・');
    }

    // Add to prayerItems
    const isCurrentTwin = prayer1 === '初宮詣（お宮参り）' && isTwin;
    const isChildPrayer = prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣' || prayer1 === '十三参り';
    const effectiveCount = prayer1 === '七五三詣' ? shichigosanChildCount : (isCurrentTwin ? 2 : 1);
    const childrenList = isChildPrayer ? buildChildrenData(effectiveCount) : [];
    const childrenDataStr = childrenList.length > 0 ? JSON.stringify(childrenList) : undefined;
    const c1 = getChildItemAtIndex(1);
    const c2 = getChildItemAtIndex(2);

    const newItem: PrayerItem = {
      id: Math.random().toString(36).substring(2, 9),
      prayer1,
      hatsuhoryo,
      name: resolvedName,
      kana: resolvedKana,
      yakudoshi_type: prayer1 === '厄年のお祓い' ? yakudoshiType : undefined,
      child_name: isChildPrayer ? c1.name : undefined,
      child_kana: isChildPrayer ? c1.kana : undefined,
      child_birthday: isChildPrayer ? c1.birthday : undefined,
      child_gender: isChildPrayer ? ((c1.gender === '男' || c1.gender === '女') ? c1.gender : undefined) : undefined,
      children_data: childrenDataStr,
      father_name: (isChildPrayer && !childSkipFather) ? fatherName : (prayer1 === '安産祈願' && !anzanSkipHusband) ? anzanHusbandName : undefined,
      father_kana: (isChildPrayer && !childSkipFather) ? fatherKana : (prayer1 === '安産祈願' && !anzanSkipHusband) ? anzanHusbandKana : undefined,
      mother_name: (isChildPrayer && !childSkipMother) ? motherName : (prayer1 === '安産祈願' && !anzanSkipWife) ? anzanWifeName : undefined,
      mother_kana: (isChildPrayer && !childSkipMother) ? motherKana : (prayer1 === '安産祈願' && !anzanSkipWife) ? anzanWifeKana : undefined,
      kotobuki_type: prayer1 === '寿祝い' ? kotobukiType : undefined,
      kotobuki_other_text: (prayer1 === '寿祝い' && kotobukiType === 'その他') ? kotobukiOtherText : undefined,
      is_twin: (isCurrentTwin || (prayer1 === '七五三詣' && shichigosanChildCount > 1)) ? 1 : 0,
      child_name2: (isCurrentTwin || (prayer1 === '七五三詣' && shichigosanChildCount > 1)) ? c2.name : undefined,
      child_kana2: (isCurrentTwin || (prayer1 === '七五三詣' && shichigosanChildCount > 1)) ? c2.kana : undefined,
      child_birthday2: (isCurrentTwin || (prayer1 === '七五三詣' && shichigosanChildCount > 1)) ? c2.birthday : undefined,
      child_gender2: (isCurrentTwin || (prayer1 === '七五三詣' && shichigosanChildCount > 1)) ? ((c2.gender === '男' || c2.gender === '女') ? c2.gender : undefined) : undefined,
      car_maker: prayer1 === '車祓（お車のお祓い）' ? (carInfoPending ? '未定（手書き記入）' : (carMaker.trim() || '未定')) : undefined,
      car_model: prayer1 === '車祓（お車のお祓い）' ? (carInfoPending ? '未定' : (carModel.trim() || '未定')) : undefined,
      car_number: prayer1 === '車祓（お車のお祓い）' ? (carInfoPending ? '未定' : (carNumber.trim() || '未定')) : undefined
    };

    setPrayerItems([...prayerItems, newItem]);

    // Auto-fill representative name if empty
    if (prayerItems.length === 0) {
      let nameToCopy = '';
      let kanaToCopy = '';

      if (prayer1 === '安産祈願') {
        if (anzanWifeName) {
          nameToCopy = anzanWifeName;
          kanaToCopy = anzanWifeKana;
        } else if (anzanHusbandName) {
          nameToCopy = anzanHusbandName;
          kanaToCopy = anzanHusbandKana;
        }
      } else if (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣') {
        if (fatherName) {
          nameToCopy = fatherName;
          kanaToCopy = fatherKana;
        } else if (motherName) {
          nameToCopy = motherName;
          kanaToCopy = motherKana;
        }
      } else {
        nameToCopy = resolvedName;
        kanaToCopy = resolvedKana;
      }

      if (!name && nameToCopy) setName(nameToCopy);
      if (!kana && kanaToCopy) setKana(kanaToCopy);
    }

    // Reset current prayer fields
    setPrayer1('');
    setPrayer2('');
    setPrayerName('');
    setPrayerKana('');
    setHatsuhoryo(5000);
    setIsTwin(false);
    setShichigosanChildCount(1);
    setChildName('');
    setChildKana('');
    setChildBirthday('');
    setChildGender('');
    setChildName2('');
    setChildKana2('');
    setChildBirthday2('');
    setChildGender2('');
    setChildName3('');
    setChildKana3('');
    setChildBirthday3('');
    setChildGender3('');
    setChildName4('');
    setChildKana4('');
    setChildBirthday4('');
    setChildGender4('');
    setBirthYear('');
    setBirthMonth('');
    setBirthDay('');
    setBirthYear2('');
    setBirthMonth2('');
    setBirthDay2('');
    setBirthYear3('');
    setBirthMonth3('');
    setBirthDay3('');
    setBirthYear4('');
    setBirthMonth4('');
    setBirthDay4('');
    setCarMaker('');
    setCarModel('');
    setFatherName('');
    setFatherKana('');
    setMotherName('');
    setMotherKana('');
    setChildSkipFather(false);
    setChildSkipMother(false);
    setAnzanHusbandName('');
    setAnzanHusbandKana('');
    setAnzanSkipHusband(false);
    setAnzanWifeName('');
    setAnzanWifeKana('');
    setAnzanSkipWife(false);
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
      hatsuhoryo: bookingType === 'individual' ? (prayerItems[0]?.hatsuhoryo || hatsuhoryo) : effectiveOrgHatsuhoryo,
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
      representative_kana: bookingType === 'organization' ? representativeKana : undefined,
      staff_dept_title_name: bookingType === 'organization' ? staffDeptTitleName : undefined,
      staff_phone: bookingType === 'organization' ? staffPhone : undefined,
      staff_email: bookingType === 'organization' ? staffEmail : undefined,
      
      talisman_name: bookingType === 'organization' ? (talismanName || companyName) : undefined,
      additional_talismans: bookingType === 'organization' ? additionalTalismans : undefined,
      wood_talisman_count: (bookingType === 'organization' && wantsWoodTalisman) ? (Number(woodTalismanCount) || undefined) : undefined,
      wood_talisman_large_count: (bookingType === 'organization' && wantsWoodTalisman) ? (Number(woodTalismanLargeCount) || undefined) : undefined,
      wood_talisman_name: (bookingType === 'organization' && wantsWoodTalisman) ? (getCombinedWoodTalismanName() || undefined) : undefined,
      wood_talisman_items_data: (bookingType === 'organization' && wantsWoodTalisman) ? getWoodTalismanItemsDataStr() : undefined,
      
      wants_receipt: bookingType === 'organization' ? (wantsReceipt ? 1 : 0) : 0,
      receipt_split_count: (bookingType === 'organization' && wantsReceipt) ? receipts.length : 1,
      receipt_name: (bookingType === 'organization' && wantsReceipt && receipts[0]) ? receipts[0].name : undefined,
      receipt_amount: (bookingType === 'organization' && wantsReceipt && receipts[0]) ? Number(receipts[0].amount) || undefined : undefined,
      receipt_name2: (bookingType === 'organization' && wantsReceipt && receipts[1]) ? receipts[1].name : undefined,
      receipt_amount2: (bookingType === 'organization' && wantsReceipt && receipts[1]) ? Number(receipts[1].amount) || undefined : undefined,
      receipts_data: (bookingType === 'organization' && wantsReceipt) ? JSON.stringify(receipts.map(r => ({ name: r.name, amount: Number(r.amount) || 0 }))) : undefined,
      receipts: (bookingType === 'organization' && wantsReceipt) ? receipts.map(r => ({ name: r.name, amount: Number(r.amount) || 0 })) : undefined,

      yakudoshi_type: bookingType === 'individual' ? (prayerItems[0]?.yakudoshi_type || yakudoshiType) : undefined,
      
      father_name: bookingType === 'individual' ? (prayerItems[0]?.father_name || fatherName) : undefined,
      father_kana: bookingType === 'individual' ? (prayerItems[0]?.father_kana || fatherKana) : undefined,
      mother_name: bookingType === 'individual' ? (prayerItems[0]?.mother_name || motherName) : undefined,
      mother_kana: bookingType === 'individual' ? (prayerItems[0]?.mother_kana || motherKana) : undefined,
      child_name: bookingType === 'individual' ? (prayerItems[0]?.child_name || childName) : undefined,
      child_kana: bookingType === 'individual' ? (prayerItems[0]?.child_kana || childKana) : undefined,
      child_birthday: bookingType === 'individual' ? (prayerItems[0]?.child_birthday || childBirthday) : undefined,
      child_gender: bookingType === 'individual' ? (() => {
        const val = prayerItems[0]?.child_gender || childGender;
        return (val === '男' || val === '女') ? val : undefined;
      })() : undefined,

      kotobuki_type: bookingType === 'individual' ? (prayerItems[0]?.kotobuki_type || kotobukiType) : undefined,
      kotobuki_other_text: bookingType === 'individual' ? (prayerItems[0]?.kotobuki_other_text || kotobukiOtherText) : undefined,
      car_maker: bookingType === 'individual' ? (prayerItems[0]?.car_maker || carMaker) : undefined,
      car_model: bookingType === 'individual' ? (prayerItems[0]?.car_model || carModel) : undefined,
      car_number: bookingType === 'individual' ? (prayerItems[0]?.car_number || carNumber) : undefined,

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
      child_gender2: bookingType === 'individual' && isTwin ? ((childGender2 === '男' || childGender2 === '女') ? childGender2 : undefined) : undefined,
      children_data: bookingType === 'individual' ? (prayerItems[0]?.children_data) : undefined,
      notes: (() => {
        const userBday = userBirthYear && userBirthMonth && userBirthDay
          ? `【生年月日】${getEraString(Number(userBirthYear)).split(' / ')[0]} (${userBirthYear}-${userBirthMonth.padStart(2, '0')}-${userBirthDay.padStart(2, '0')})`
          : '';
        const currentPrayer1 = bookingType === 'individual' ? (prayerItems[0]?.prayer1 || prayer1) : p1;
        const currentCarMaker = bookingType === 'individual' ? (prayerItems[0]?.car_maker || carMaker) : undefined;
        const currentCarModel = bookingType === 'individual' ? (prayerItems[0]?.car_model || carModel) : undefined;
        const currentCarNumber = bookingType === 'individual' ? (prayerItems[0]?.car_number || carNumber) : undefined;

        const carInfoText = currentPrayer1 === '車祓（お車のお祓い）' && currentCarMaker && currentCarModel && currentCarNumber
          ? `【お車】メーカー: ${currentCarMaker} / 車種: ${currentCarModel} / ナンバー: ${currentCarNumber}`
          : '';

        let resolvedNotes = notes || '';
        if (userBday) {
          resolvedNotes = resolvedNotes ? `${resolvedNotes}\n${userBday}` : userBday;
        }
        if (carInfoText) {
          resolvedNotes = resolvedNotes ? `${resolvedNotes}\n${carInfoText}` : carInfoText;
        }
        return resolvedNotes || undefined;
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
          child_gender: item.child_gender,
          children_data: item.children_data,
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
          child_gender2: item.child_gender2 || undefined,
          car_maker: item.car_maker || undefined,
          car_model: item.car_model || undefined,
          car_number: item.car_number || undefined,
          notes: (() => {
            const carInfoText = item.prayer1 === '車祓（お車のお祓い）' && item.car_maker && item.car_model && item.car_number
              ? `【お車】メーカー: ${item.car_maker} / 車種: ${item.car_model} / ナンバー: ${item.car_number}`
              : '';
            
            let baseNotes = notes ? `${notes} (代表: ${name})` : `申込代表者: ${name} (${kana})`;
            if (carInfoText) {
              baseNotes += `\n${carInfoText}`;
            }
            return baseNotes;
          })()
        }))
      : orgPrayerItems.length > 0
        ? orgPrayerItems.map((item, idx) => ({
            booking_type: 'organization',
            booking_date: selectedDate,
            booking_time: selectedTime,
            payment_status: 'unpaid',
            attending_count: attendingCount === '' ? 1 : attendingCount,
            company_name: companyName,
            company_kana: companyKana,
            company_address: companyAddress,
            company_address_kana: companyAddressKana,
            representative_title_name: representativeTitleName,
            representative_kana: representativeKana,
            staff_dept_title_name: staffDeptTitleName,
            staff_phone: staffPhone,
            staff_email: staffEmail,
            prayer1: item.prayer1,
            org_custom_prayer1: item.org_custom_prayer1,
            prayer2: item.prayer2,
            org_custom_prayer2: item.org_custom_prayer2,
            // 1st item carries wood talisman fee so total sum matches effectiveOrgHatsuhoryo
            hatsuhoryo: idx === 0 ? item.hatsuhoryo + woodTalismanTotal : item.hatsuhoryo,
            talisman_name: item.talisman_name || talismanName || companyName,
            additional_talismans: idx === 0 ? additionalTalismans : undefined,
            wood_talisman_count: (idx === 0 && wantsWoodTalisman) ? (Number(woodTalismanCount) || undefined) : undefined,
            wood_talisman_large_count: (idx === 0 && wantsWoodTalisman) ? (Number(woodTalismanLargeCount) || undefined) : undefined,
            wood_talisman_name: (idx === 0 && wantsWoodTalisman) ? (getCombinedWoodTalismanName() || undefined) : undefined,
            wood_talisman_items_data: (idx === 0 && wantsWoodTalisman) ? getWoodTalismanItemsDataStr() : undefined,
            wants_receipt: (idx === 0 && wantsReceipt) ? 1 : 0,
            receipt_split_count: (idx === 0 && wantsReceipt) ? receipts.length : 1,
            receipt_name: (idx === 0 && wantsReceipt && receipts[0]) ? receipts[0].name : undefined,
            receipt_amount: (idx === 0 && wantsReceipt && receipts[0]) ? Number(receipts[0].amount) || undefined : undefined,
            receipt_name2: (idx === 0 && wantsReceipt && receipts[1]) ? receipts[1].name : undefined,
            receipt_amount2: (idx === 0 && wantsReceipt && receipts[1]) ? Number(receipts[1].amount) || undefined : undefined,
            receipts_data: (idx === 0 && wantsReceipt) ? JSON.stringify(receipts.map(r => ({ name: r.name, amount: Number(r.amount) || 0 }))) : undefined,
            receipts: (idx === 0 && wantsReceipt) ? receipts.map(r => ({ name: r.name, amount: Number(r.amount) || 0 })) : undefined,
            tournament_name: item.tournament_name,
            tournament_schedule: item.tournament_schedule,
            construction_name: item.construction_name,
            construction_designer: item.construction_designer,
            construction_builder: item.construction_builder,
            construction_period: item.construction_period,
            has_past_prayer: hasPastPrayer,
            notes: notes || undefined
          }))
        : [singlePayload];

    try {
      const apiUrl = getApiUrl();
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

      // If batch reschedule is enabled, update related bookings to new date/time as well
      if (isEditMode && batchRescheduleRelated && relatedBookings.length > 0) {
        for (const rel of relatedBookings) {
          if (rel.id) {
            const updatedRel = {
              ...rel,
              booking_date: selectedDate,
              booking_time: selectedTime
            };
            await fetch(`${apiUrl}/api/bookings/${rel.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedRel)
            });
          }
        }
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
    setRepresentativeKana('');
    setStaffDeptTitleName('');
    setStaffPhone('');
    setStaffEmail('');
    setTalismanName('');
    setAdditionalTalismans('');
    setWantsReceipt(false);
    setReceipts([{ id: 'rec-1', name: '', amount: 20000 }]);
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
      const apiUrl = getApiUrl();
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
              targetBooking && (() => {
                const now = new Date();
                const bookingDateTime = new Date(`${targetBooking.booking_date}T${targetBooking.booking_time}:00+09:00`);
                const isLessThan24Hours = (bookingDateTime.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;

                return (
                  <div>
                    {isLessThan24Hours ? (
                      <div style={{
                        backgroundColor: '#fff1f0',
                        border: '2px solid #ffa39e',
                        borderRadius: '6px',
                        padding: '1.5rem',
                        textAlign: 'center',
                        marginBottom: '1.5rem'
                      }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#d3381c', marginBottom: '0.5rem' }}>
                          ⚠️ オンライン受付期限終了（開始24時間以内）
                        </div>
                        <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: '1.6', margin: '0 0 1.25rem 0' }}>
                          オンラインでの日程変更・キャンセル手続きは【ご祈祷開始時間の24時間前まで】となっております。<br />
                          直前・当日のご変更やキャンセルにつきましては、神事準備の都合上、恐れ入りますが社務所まで直接お電話をお願いいたします。<br />
                          <span style={{ color: '#274916', fontWeight: 'bold', backgroundColor: '#f6ffed', padding: '0.2rem 0.5rem', borderRadius: '2px', display: 'inline-block', marginTop: '0.3rem' }}>
                            ※直前の変更・キャンセルでも、キャンセル料等は一切発生いたしません。
                          </span>
                        </p>
                        <a
                          href="tel:0473515417"
                          className="btn btn-primary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.75rem',
                            fontSize: '1.05rem',
                            textDecoration: 'none',
                            backgroundColor: '#d3381c',
                            borderColor: '#d3381c'
                          }}
                        >
                          📞 047-351-5417（社務所）に電話する
                        </a>
                        <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem', marginBottom: 0 }}>
                          （受付時間: 9:30 〜 15:30）
                        </p>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: '4px',
                        padding: '0.85rem 1.1rem',
                        marginBottom: '1.25rem',
                        fontSize: '0.85rem',
                        color: '#274916',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>✅</span> オンライン変更・キャンセル受付中（キャンセル料は一切かかりません）
                        </div>
                        ご祈祷開始日時の24時間前（前日同時刻）まででしたら、日時の変更やキャンセルがオンラインでいつでも行えます。
                      </div>
                    )}

                    <div style={{ backgroundColor: 'var(--color-washi-dark)', border: '1px solid var(--color-border)', padding: '1.2rem', marginBottom: '1.25rem', fontSize: '0.9rem', borderRadius: '4px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <th style={{ padding: '0.4rem 0', textAlign: 'left', color: 'var(--color-accent-gray)', width: '35%' }}>受付番号</th>
                            <td style={{ padding: '0.4rem 0', fontWeight: 'bold', fontFamily: 'monospace' }}>{targetBooking.receipt_number}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <th style={{ padding: '0.4rem 0', textAlign: 'left', color: 'var(--color-accent-gray)' }}>お名前</th>
                            <td style={{ padding: '0.4rem 0', fontWeight: 'bold' }}>{targetBooking.booking_type === 'individual' ? targetBooking.name : targetBooking.company_name} 様</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <th style={{ padding: '0.4rem 0', textAlign: 'left', color: 'var(--color-accent-gray)' }}>ご祈祷の願意</th>
                            <td style={{ padding: '0.4rem 0', fontWeight: 'bold' }}>{targetBooking.prayer1}{targetBooking.prayer2 ? ` / ${targetBooking.prayer2}` : ''}</td>
                          </tr>
                          <tr>
                            <th style={{ padding: '0.4rem 0', textAlign: 'left', color: 'var(--color-accent-gray)' }}>現在のご予約日時</th>
                            <td style={{ padding: '0.4rem 0', fontWeight: 'bold', color: 'var(--color-mizuiro)' }}>{targetBooking.booking_date} {targetBooking.booking_time}の回</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Related Bookings Box for Same Applicant */}
                    {relatedBookings.length > 0 && (
                      <div style={{
                        backgroundColor: '#fffdf7',
                        border: '1px solid var(--color-gold)',
                        borderRadius: '4px',
                        padding: '0.9rem 1rem',
                        marginBottom: '1.5rem'
                      }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--color-urushi)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>💡</span> 同時に申し込まれた関連するご予約が他に {relatedBookings.length} 件 あります：
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                          {relatedBookings.map((rel, idx) => (
                            <div key={rel.id || idx} style={{ fontSize: '0.82rem', color: '#555', backgroundColor: '#ffffff', padding: '0.35rem 0.6rem', borderRadius: '3px', border: '1px solid #eee' }}>
                              ・<strong>{rel.booking_time}</strong> {rel.name || rel.company_name} 様 【{rel.prayer1}】 {rel.hatsuhoryo.toLocaleString()}円
                            </div>
                          ))}
                        </div>
                        {!isLessThan24Hours && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-urushi)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={batchCancelRelated && batchRescheduleRelated}
                              onChange={(e) => {
                                setBatchCancelRelated(e.target.checked);
                                setBatchRescheduleRelated(e.target.checked);
                              }}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                            日程変更・キャンセル時は、これらの関連予約（合計 {relatedBookings.length + 1} 件）も一緒にまとめて変更・キャンセルする
                          </label>
                        )}
                      </div>
                    )}

                    {!isLessThan24Hours && (
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
                    )}

                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                      <button 
                        type="button"
                        onClick={() => {
                          setChangeId(null);
                          setTargetBooking(null);
                          window.history.replaceState({}, '', window.location.pathname);
                        }} 
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                      >
                        トップページへ戻る
                      </button>
                    </div>
                  </div>
                );
              })()
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
    <>
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
          <button
            type="button"
            onClick={() => setActiveMainTab('lookup')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              borderBottom: activeMainTab === 'lookup' ? '2px solid var(--color-urushi)' : 'none',
              color: activeMainTab === 'lookup' ? 'var(--color-urushi)' : 'var(--color-accent-gray)',
              fontWeight: activeMainTab === 'lookup' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem',
              fontFamily: 'var(--font-serif)'
            }}
          >
            🔍 ご予約の確認・変更・キャンセル
          </button>
        </div>

        {activeMainTab === 'form' && (
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
              <p style={{ color: '#d3381c', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '0.5rem' }}>※令和8年の七五三時期（11月中）と令和9年のお正月時期（1月中）と節分（2月3日）は、臨時の駐車場を設けることが出来ません。ご不便をお掛けいたしますが、境内裏手の駐車場（約12台駐車可能）が満車の際は、お近くのコインパーキングをご利用いただくか、公共交通機関をご利用の上、ご参拝賜りますよう伏してお願い申し上げます。</p>
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
                            <option key={p.value} value={p.value}>{(p as any).label || p.value}</option>
                          ))}
                        </select>
                      </div>

                      {(() => {
                        const minPrice = getIndividualMinPrice(prayer1, isTwin);
                        const effectiveMin = (isEditMode && prayer1 === '安産祈願' && hatsuhoryo >= 5000) ? 5000 : minPrice;
                        const isBelowMin = Boolean(prayer1 && hatsuhoryo < effectiveMin);
                        return (
                          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ margin: 0 }}>
                                初穂料 (目安自動設定) <span className="required">*</span>
                              </label>
                              {prayer1 && (
                                <span style={{ fontSize: '0.75rem', color: isBelowMin ? '#d3381c' : 'var(--color-accent-gray)', fontWeight: isBelowMin ? 'bold' : 'normal' }}>
                                  目安: {effectiveMin.toLocaleString()}円〜
                                </span>
                              )}
                            </div>
                            <input
                              type="number"
                              className="form-control"
                              min={effectiveMin}
                              step="1000"
                              value={hatsuhoryo || ''}
                              onChange={(e) => setHatsuhoryo(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                              style={{
                                marginTop: '0.25rem',
                                border: isBelowMin ? '2px solid #d3381c' : undefined,
                                backgroundColor: isBelowMin ? '#fff2f0' : undefined,
                                color: isBelowMin ? '#d3381c' : undefined,
                                fontWeight: isBelowMin ? 'bold' : undefined
                              }}
                            />
                            {isBelowMin && (
                              <div style={{ fontSize: '0.78rem', color: '#d3381c', marginTop: '0.35rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span>⚠️</span> 初穂料は目安金額（{effectiveMin.toLocaleString()}円以上）をご入力ください。
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {prayer1 === '安産祈願' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', gridColumn: 'span 2' }}>
                        {/* Husband Section */}
                        <div style={{ border: '1px solid rgba(197, 160, 89, 0.25)', padding: '1rem', borderRadius: '4px', backgroundColor: 'var(--color-washi-dark)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-urushi)' }}>夫（旦那様）のお名前</span>
                            <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', margin: 0, color: 'var(--color-accent-gray)' }}>
                              <input 
                                type="checkbox" 
                                checked={anzanSkipHusband} 
                                onChange={(e) => {
                                  setAnzanSkipHusband(e.target.checked);
                                  if (e.target.checked) {
                                    setAnzanHusbandName('');
                                    setAnzanHusbandKana('');
                                  }
                                }} 
                              />
                              夫のお名前を登録しない
                            </label>
                          </div>
                          
                          <div className="grid-2">
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>氏名 {!anzanSkipHusband && <span className="required">*</span>}</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="例：清瀧 太郎"
                                value={anzanHusbandName}
                                onChange={(e) => setAnzanHusbandName(e.target.value)}
                                disabled={anzanSkipHusband}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>フリガナ {!anzanSkipHusband && <span className="required">*</span>}</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="例：セイリュウ タロウ"
                                value={anzanHusbandKana}
                                onChange={(e) => setAnzanHusbandKana(e.target.value)}
                                disabled={anzanSkipHusband}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Wife Section */}
                        <div style={{ border: '1px solid rgba(197, 160, 89, 0.25)', padding: '1rem', borderRadius: '4px', backgroundColor: 'var(--color-washi-dark)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-urushi)' }}>妻（妊婦様）のお名前</span>
                            <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', margin: 0, color: 'var(--color-accent-gray)' }}>
                              <input 
                                type="checkbox" 
                                checked={anzanSkipWife} 
                                onChange={(e) => {
                                  setAnzanSkipWife(e.target.checked);
                                  if (e.target.checked) {
                                    setAnzanWifeName('');
                                    setAnzanWifeKana('');
                                  }
                                }} 
                              />
                              妻のお名前を登録しない
                            </label>
                          </div>
                          
                          <div className="grid-2">
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>氏名 {!anzanSkipWife && <span className="required">*</span>}</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="例：清瀧 花子"
                                value={anzanWifeName}
                                onChange={(e) => setAnzanWifeName(e.target.value)}
                                disabled={anzanSkipWife}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>フリガナ {!anzanSkipWife && <span className="required">*</span>}</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="例：セイリュウ ハナコ"
                                value={anzanWifeKana}
                                onChange={(e) => setAnzanWifeKana(e.target.value)}
                                disabled={anzanSkipWife}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid-2" style={{ gridColumn: 'span 2' }}>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <label>ご祈祷を受ける方の氏名 <span className="required">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="例：清瀧 太郎"
                            value={prayerName}
                            onChange={(e) => setPrayerName(e.target.value)}
                            autoComplete="off"
                          />
                          {prayer1 !== '安産祈願' && prayer1 !== '初宮詣（お宮参り）' && (
                            <div style={{ fontSize: '0.7rem', color: '#d3381c', margin: '0.35rem 0 0 0', lineHeight: '1.3' }}>
                              ※お札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（吉や𠮷、高や髙、邊や邉、斉や齊や齋、瀬や瀨、柳や栁、等々）
                            </div>
                          )}
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <label>氏名フリガナ <span className="required">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="例：セイリュウ タロウ"
                            value={prayerKana}
                            onChange={(e) => setPrayerKana(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Organization willing select (Cart mode: Max 2 willing per item + custom text)
                <div>
                  {/* Organization Cart Display */}
                  <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--color-washi-dark)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                    <h5 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-urushi)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '0.5rem' }}>
                      📋 追加されたご祈祷の内容（{orgPrayerItems.length}件）
                    </h5>
                    {orgPrayerItems.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-accent-gray)', margin: 0, padding: '0.5rem 0' }}>
                        ※現在、追加されたご祈祷はありません。下のフォームから主願意（必須）・副願意（任意）と初穂料を入力し、「このご祈祷（願意）を予約リストに追加」ボタンを押して追加してください。
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {orgPrayerItems.map((item, idx) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '2px', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.85rem' }}>
                              <span style={{ backgroundColor: 'var(--color-gold)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.75rem', marginRight: '0.5rem' }}>
                                第{idx + 1}祈願
                              </span>
                              <strong>【主願意】</strong> {item.prayer1 === 'その他（自由入力）' ? item.org_custom_prayer1 : item.prayer1}
                              {item.prayer2 && (
                                <>
                                  <span style={{ margin: '0 0.35rem', color: 'var(--color-border)' }}>/</span>
                                  <strong>【副願意】</strong> {item.prayer2 === 'その他（自由入力）' ? item.org_custom_prayer2 : item.prayer2}
                                </>
                              )}
                              {item.talisman_name && (
                                <>
                                  <span style={{ margin: '0 0.35rem', color: 'var(--color-border)' }}>|</span>
                                  <strong>【お札名】</strong> {item.talisman_name}
                                </>
                              )}
                              <span style={{ margin: '0 0.35rem', color: 'var(--color-border)' }}>|</span>
                              <strong>【初穂料】</strong> {item.hatsuhoryo.toLocaleString()}円
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOrgPrayerItem(item.id)}
                              className="btn"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#fdf3f2', color: '#d3381c', border: '1px solid #ffa39e' }}
                            >
                              削除
                            </button>
                          </div>
                        ))}
                        <div style={{ textAlign: 'right', fontSize: '0.9rem', fontWeight: 'bold', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                          ご祈祷 初穂料小計: <span style={{ color: 'var(--color-mizuiro)', fontSize: '1.1rem' }}>{orgPrayersTotal.toLocaleString()}</span> 円
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add New Organization Prayer Form */}
                  <div style={{ border: '1px solid var(--color-border)', padding: '1.25rem 1rem', borderRadius: '4px', position: 'relative', backgroundColor: '#ffffff', marginBottom: '1rem' }}>
                    <div style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: '#ffffff', padding: '0 0.5rem', fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 'bold' }}>
                      ご祈祷内容の入力
                    </div>

                    <div className="grid-2" style={{ marginTop: '0.5rem' }}>
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

                    <div className="form-group" style={{ marginTop: '0.75rem' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>この願意のお札に書かれるお名前（任意）</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', fontWeight: 'normal' }}>
                          ※空欄の場合は会社情報で入力する「お札に書かれるお名前」が共通適用されます
                        </span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例: 清瀧株式会社 営業本部（個別指定がある場合のみ入力）"
                        value={orgItemTalismanName}
                        onChange={(e) => setOrgItemTalismanName(e.target.value)}
                      />
                    </div>

                    {/* Organization Hatsuhoryo Input */}
                    {(() => {
                      const orgMinPrice = Number(attendingCount) < 5 ? 20000 : 30000;
                      const isBelowMin = hatsuhoryo < orgMinPrice;
                      return (
                        <div className="form-group" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ margin: 0 }}>
                              初穂料 (目安自動設定) <span className="required">*</span>
                            </label>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)' }}>
                              目安: {orgMinPrice.toLocaleString()}円〜（参列{attendingCount || 1}名）
                            </span>
                          </div>
                          <input
                            type="number"
                            className="form-control"
                            min={orgMinPrice}
                            step="5000"
                            value={hatsuhoryo || ''}
                            onChange={(e) => setHatsuhoryo(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                            style={{
                              marginTop: '0.25rem',
                              border: isBelowMin ? '1.5px solid #d3381c' : undefined,
                              backgroundColor: isBelowMin ? '#fff8f7' : undefined
                            }}
                          />
                          {isBelowMin && (
                            <div style={{ fontSize: '0.75rem', color: '#d3381c', marginTop: '0.35rem', fontWeight: 500 }}>
                              ⚠️ 団体参拝の初穂料は目安金額（{orgMinPrice.toLocaleString()}円以上）をご入力ください。
                            </div>
                          )}
                        </div>
                      );
                    })()}
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

              {bookingType === 'individual' && (prayer1 === '初宮詣（お宮参り）' || prayer1 === '七五三詣' || prayer1 === '十三参り') && (() => {
                const currentYear = new Date().getFullYear();
                const yearOptions = Array.from({ length: 16 }, (_, i) => currentYear - i);
                return (
                  <div className="alert-warning" style={{ margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>お子様およびご両親の登録情報</h5>

                    {/* 境内での記念撮影・カメラマン撮影について */}
                    <div style={{
                      backgroundColor: '#f6faf7',
                      border: '1.5px solid #2e7d32',
                      borderRadius: '6px',
                      padding: '0.85rem 1rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1b5e20', fontWeight: 'bold', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1.15rem' }}>📷</span>
                        <span>境内での記念撮影・カメラマン撮影について</span>
                      </div>
                      <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem', color: '#2e7d32', lineHeight: '1.5', fontWeight: 600 }}>
                        撮影でカメラマンの方をお願いされるご家族様には撮影許可証などは設けておりません。他のご参拝の方のご迷惑にならないよう、どうぞお撮り下さいませ。
                      </p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#666', lineHeight: '1.4' }}>
                        ※なお、神前での厳粛なご祈祷を厳修するため、社殿・拝殿内へのカメラマンのお立ち入り・ご祈祷中の撮影はご遠慮いただいております。境内外での記念撮影をどうぞご自由にお楽しみください。
                      </p>
                    </div>

                    {/* 七五三詣：お祝いのお子様人数セレクター */}
                    {prayer1 === '七五三詣' && (
                      <div style={{ backgroundColor: '#fff', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: '6px', padding: '0.85rem 1rem' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.88rem', color: 'var(--color-urushi)', marginBottom: '0.5rem' }}>
                          お祝いのお子様の人数 <span className="required">*</span>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                          {[1, 2, 3, 4].map(num => (
                            <button
                              key={num}
                              type="button"
                              className="btn"
                              style={{
                                backgroundColor: shichigosanChildCount === num ? 'var(--color-urushi, #9e2a2b)' : '#fdfaf5',
                                color: shichigosanChildCount === num ? '#fff' : '#444',
                                borderColor: shichigosanChildCount === num ? 'var(--color-urushi, #9e2a2b)' : 'rgba(197, 160, 89, 0.4)',
                                fontWeight: shichigosanChildCount === num ? 'bold' : 'normal',
                                padding: '0.6rem 0.5rem',
                                fontSize: '0.85rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.15rem'
                              }}
                              onClick={() => {
                                setShichigosanChildCount(num);
                                setHatsuhoryo(10000 * num);
                              }}
                            >
                              <span>{num}人 {num === 1 ? '（単身）' : num === 2 ? '（兄弟・姉妹・双子等）' : '（兄弟姉妹等）'}</span>
                              <span style={{ fontSize: '0.72rem', opacity: shichigosanChildCount === num ? 0.95 : 0.7 }}>
                                初穂料目安: {(10000 * num).toLocaleString()}円
                              </span>
                            </button>
                          ))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', lineHeight: '1.4' }}>
                          ※兄弟・姉妹・双子など、同時に七五三のお祝いをお受けになるお子様全員をご登録いただけます。初穂料はお子様1名につき10,000円（お札・千歳飴・記念授与品一式）が目安となります。
                        </div>
                      </div>
                    )}

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

                    {/* 各お子様情報の入力カード */}
                    {(() => {
                      const renderChildCard = (idx: number, cardLabel: string) => {
                        const c = getChildItemAtIndex(idx);
                        return (
                          <div key={idx} style={{ border: '1px solid rgba(197, 160, 89, 0.25)', padding: '0.85rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.7)', width: '100%', boxSizing: 'border-box' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-gold)', display: 'block', marginBottom: '0.6rem' }}>
                              {cardLabel}
                            </span>
                            <div className="form-row" style={{ marginBottom: '0.5rem' }}>
                              <div className="form-group" style={{ margin: 0, width: '100%' }}>
                                <label>お子様の氏名 <span className="required">*</span></label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder={idx === 1 ? '例：清瀧 太郎' : idx === 2 ? '例：清瀧 次郎' : idx === 3 ? '例：清瀧 三郎' : '例：清瀧 四郎'}
                                  value={c.name}
                                  onChange={(e) => c.setName(e.target.value)}
                                  style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                                {prayer1 !== '初宮詣（お宮参り）' && (
                                  <div style={{ fontSize: '0.7rem', color: '#d3381c', margin: '0.35rem 0 0 0', lineHeight: '1.3' }}>
                                    ※お札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（吉や𠮷、高や髙、邊や邉、斉や齊や齋、瀬や瀨、柳や栁、等々）
                                  </div>
                                )}
                              </div>
                              <div className="form-group" style={{ margin: 0, width: '100%' }}>
                                <label>お子様フリガナ <span className="required">*</span></label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder={idx === 1 ? '例：セイリュウ タロウ' : idx === 2 ? '例：セイリュウ ジロウ' : idx === 3 ? '例：セイリュウ サブロウ' : '例：セイリュウ シロウ'}
                                  value={c.kana}
                                  onChange={(e) => c.setKana(e.target.value)}
                                  style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                              </div>
                            </div>

                            <div className="form-group" style={{ margin: '0 0 0.5rem 0' }}>
                              <label>お子様の性別 <span className="required">*</span></label>
                              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.35rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: 'normal', fontSize: '0.9rem' }}>
                                  <input 
                                    type="radio" 
                                    name={`child_gender_${idx}`} 
                                    value="男" 
                                    checked={c.gender === '男'} 
                                    onChange={() => c.setGender('男')} 
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                  />
                                  <span>男の子</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: 'normal', fontSize: '0.9rem' }}>
                                  <input 
                                    type="radio" 
                                    name={`child_gender_${idx}`} 
                                    value="女" 
                                    checked={c.gender === '女'} 
                                    onChange={() => c.setGender('女')} 
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                  />
                                  <span>女の子</span>
                                </label>
                              </div>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                              <label>生年月日 <span className="required">*</span></label>
                              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <select className="form-control" style={{ width: '180px' }} value={c.y} onChange={(e) => c.setY(e.target.value)}>
                                  <option value="">-- 年 (和暦/西暦) --</option>
                                  {yearOptions.map(y => (
                                    <option key={y} value={y.toString()}>{getEraString(y)}</option>
                                  ))}
                                </select>
                                <select className="form-control" style={{ width: '90px' }} value={c.m} onChange={(e) => c.setM(e.target.value)}>
                                  <option value="">-- 月 --</option>
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m.toString()}>{m}月</option>
                                  ))}
                                </select>
                                <select className="form-control" style={{ width: '90px' }} value={c.d} onChange={(e) => c.setD(e.target.value)}>
                                  <option value="">-- 日 --</option>
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d.toString()}>{d}日</option>
                                  ))}
                                </select>
                              </div>

                              {/* 祝齢・年齢リアルタイム表示 */}
                              {(() => {
                                const ageInfo = getChildAgeDetail(c.y, c.m, c.d, selectedDate);
                                if (!ageInfo) return null;
                                return (
                                  <div style={{
                                    marginTop: '0.5rem',
                                    padding: '0.4rem 0.65rem',
                                    backgroundColor: '#fef7e6',
                                    border: '1px solid #f0c36d',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    fontSize: '0.8rem',
                                    color: '#8a6d3b',
                                    flexWrap: 'wrap'
                                  }}>
                                    <span style={{ fontWeight: 'bold' }}>🎂 祝齢・年齢判定:</span>
                                    <span>{ageInfo.eraText}</span>
                                    <span style={{
                                      backgroundColor: '#9e2a2b',
                                      color: '#fff',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '3px',
                                      fontWeight: 'bold',
                                      fontSize: '0.75rem'
                                    }}>
                                      満{ageInfo.manAge}歳 / 数え{ageInfo.kazoeAge}歳
                                      {ageInfo.celebrationStage ? `【${ageInfo.celebrationStage}】` : ''}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      };

                      if (prayer1 === '七五三詣') {
                        return Array.from({ length: shichigosanChildCount }, (_, idx) => {
                          const num = idx + 1;
                          const label = `お子様（${num === 1 ? '一人目' : num === 2 ? '二人目' : num === 3 ? '三人目' : '四人目'}）`;
                          return renderChildCard(num, label);
                        });
                      } else if (prayer1 === '初宮詣（お宮参り）') {
                        return (
                          <>
                            {renderChildCard(1, isTwin ? 'お子様（一人目）' : 'お子様情報')}
                            {isTwin && renderChildCard(2, 'お子様（二人目）')}
                          </>
                        );
                      } else {
                        return renderChildCard(1, 'お子様情報');
                      }
                    })()}

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-accent-gray)', borderTop: '1px solid rgba(197, 160, 89, 0.3)', paddingTop: '0.6rem', lineHeight: '1.4' }}>
                      ※ご両親のお名前・フリガナを入力してください。<br />
                      <span style={{ color: 'var(--color-urushi)', fontWeight: 500 }}>
                        💡 片親（ひとり親家庭等）の場合は、登録されない側の「お名前を登録しない」にチェックを入れていただくことで、片親のみでご予約いただけます。
                      </span>
                    </div>

                    {/* 父親セクション */}
                    <div style={{ backgroundColor: childSkipFather ? '#fafafa' : 'transparent', padding: childSkipFather ? '0.5rem 0.75rem' : '0', borderRadius: '4px', border: childSkipFather ? '1px dashed #ccc' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: childSkipFather ? '0' : '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: childSkipFather ? '#888' : 'var(--color-urushi)' }}>
                          父親の情報 {!childSkipFather && <span className="required">*</span>}
                        </span>
                        <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', margin: 0, color: childSkipFather ? 'var(--color-gold)' : 'var(--color-accent-gray)' }}>
                          <input 
                            type="checkbox" 
                            checked={childSkipFather} 
                            onChange={(e) => {
                              setChildSkipFather(e.target.checked);
                              if (e.target.checked) {
                                setFatherName('');
                                setFatherKana('');
                              }
                            }} 
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <span>父親のお名前を登録しない（母子家庭等）</span>
                        </label>
                      </div>

                      {!childSkipFather && (
                        <div className="form-row">
                          <div className="form-group" style={{ margin: 0 }}>
                            <label>父親の氏名 <span className="required">*</span></label>
                            <input type="text" className="form-control" placeholder="例：清瀧 健二" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label>父親氏名フリガナ <span className="required">*</span></label>
                            <input type="text" className="form-control" placeholder="例：セイリュウ ケンジ" value={fatherKana} onChange={(e) => setFatherKana(e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 母親セクション */}
                    <div style={{ backgroundColor: childSkipMother ? '#fafafa' : 'transparent', padding: childSkipMother ? '0.5rem 0.75rem' : '0', borderRadius: '4px', border: childSkipMother ? '1px dashed #ccc' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: childSkipMother ? '0' : '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: childSkipMother ? '#888' : 'var(--color-urushi)' }}>
                          母親の情報 {!childSkipMother && <span className="required">*</span>}
                        </span>
                        <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', margin: 0, color: childSkipMother ? 'var(--color-gold)' : 'var(--color-accent-gray)' }}>
                          <input 
                            type="checkbox" 
                            checked={childSkipMother} 
                            onChange={(e) => {
                              setChildSkipMother(e.target.checked);
                              if (e.target.checked) {
                                setMotherName('');
                                setMotherKana('');
                              }
                            }} 
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <span>母親のお名前を登録しない（父子家庭等）</span>
                        </label>
                      </div>

                      {!childSkipMother && (
                        <div className="form-row">
                          <div className="form-group" style={{ margin: 0 }}>
                            <label>母親の氏名 <span className="required">*</span></label>
                            <input type="text" className="form-control" placeholder="例：清瀧 花子" value={motherName} onChange={(e) => setMotherName(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label>母親氏名フリガナ <span className="required">*</span></label>
                            <input type="text" className="form-control" placeholder="例：セイリュウ ハナコ" value={motherKana} onChange={(e) => setMotherKana(e.target.value)} />
                          </div>
                        </div>
                      )}
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

              {/* 個人祈祷で「交通安全」が選択された場合のお車お祓い案内ブロック */}
              {bookingType === 'individual' && prayer1 === '交通安全' && (
                <div className="form-group alert-warning" style={{ 
                  margin: '1rem 0 0 0', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem', 
                  padding: '1rem', 
                  border: '1.5px solid rgba(50, 136, 163, 0.35)', 
                  borderRadius: '4px', 
                  backgroundColor: '#f5fafc' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px dashed rgba(50, 136, 163, 0.25)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>🚗</span>
                    <h5 style={{ fontSize: '0.92rem', fontWeight: 'bold', margin: 0, color: 'var(--color-mizuiro-hover)' }}>
                      お車本体のお祓い（新車・中古車購入等）をご希望の方へ
                    </h5>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#444', lineHeight: '1.6' }}>
                    新車・中古車のご購入など、<strong>お車自体のお祓い・お清めをご希望の場合は、願意で【車祓（お車のお祓い）】をご選択ください。</strong><br />
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                      ※「交通安全」は、お車本体ではなく、ご参拝者様ご自身の身の安全（ドライバー・ご家族様の交通安全）をご祈祷する願意となります。
                    </span>
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPrayer1('車祓（お車のお祓い）');
                        setHatsuhoryo(10000);
                      }}
                      className="btn btn-primary"
                      style={{
                        padding: '0.45rem 1.1rem',
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: 'var(--color-mizuiro)',
                        borderColor: 'var(--color-mizuiro)',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🚗「車祓（お車のお祓い）」に変更する
                    </button>
                  </div>
                </div>
              )}

              {bookingType === 'individual' && prayer1 === '車祓（お車のお祓い）' && (
                <div className="form-group alert-warning" style={{ margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', border: '1.5px solid rgba(197, 160, 89, 0.4)', borderRadius: '4px', backgroundColor: '#fffcf7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px dashed rgba(197, 160, 89, 0.3)', paddingBottom: '0.6rem' }}>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: 0, color: 'var(--color-urushi)' }}>
                      🚗 お祓いするお車の情報
                    </h5>
                    <label style={{ 
                      fontSize: '0.85rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.45rem', 
                      fontWeight: 'bold', 
                      color: carInfoPending ? '#d3381c' : 'var(--color-mizuiro-hover)', 
                      cursor: 'pointer', 
                      margin: 0, 
                      backgroundColor: '#ffffff', 
                      padding: '0.35rem 0.75rem', 
                      borderRadius: '4px', 
                      border: carInfoPending ? '2px solid #d3381c' : '1.5px solid var(--color-mizuiro-hover)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={carInfoPending} 
                        onChange={(e) => {
                          setCarInfoPending(e.target.checked);
                          if (e.target.checked) {
                            setCarMaker('');
                            setCarModel('');
                            setCarNumber('');
                          }
                        }} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>納車前などでお車情報（ナンバー等）が未定</span>
                    </label>
                  </div>
                  {carInfoPending ? (
                    <div style={{ padding: '0.75rem 1rem', backgroundColor: '#ffffff', border: '1.5px dashed #d3381c', borderRadius: '4px', fontSize: '0.88rem', color: '#444', lineHeight: 1.5 }}>
                      💡 <strong>【お車情報未定のご予約】</strong><br />
                      メーカー名・車種名・ナンバーは空欄のままでご予約を完了いただけます。<br />
                      参拝当日に社務所受付にて直接お伺い・確認させていただきます。
                    </div>
                  ) : (
                    <>
                      <div className="form-row">
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>メーカー名 <span className="required">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="例：トヨタ、ホンダなど"
                            value={carMaker}
                            onChange={(e) => setCarMaker(e.target.value)}
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
                        />
                      </div>
                    </>
                  )}
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

              {bookingType === 'organization' && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px dashed var(--color-border)', paddingTop: '1rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={handleAddOrgPrayerItem}
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
                  {bookingType === 'individual' 
                    ? (prayerItems.length > 0 
                        ? `${prayerItems.reduce((sum, item) => sum + item.hatsuhoryo, 0).toLocaleString()} 円（合計 ${prayerItems.length}件）より お気持ち（当日現金納め）`
                        : `${hatsuhoryo.toLocaleString()} 円より お気持ち（当日現金納め）`)
                    : (orgPrayerItems.length > 0
                        ? `${effectiveOrgHatsuhoryo.toLocaleString()} 円（ご祈祷 ${orgPrayerItems.length}件${wantsWoodTalisman && woodTalismanTotal > 0 ? ` ＋ 木札 ${woodTalismanTotal.toLocaleString()}円` : ''}）より お気持ち（当日現金納め）`
                        : `${effectiveOrgHatsuhoryo.toLocaleString()} 円より お気持ち（当日現金納め）`)}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.25rem' }}>
                  {bookingType === 'individual' 
                    ? '※選択された願意の目安金額です。のし袋か封筒などに包み、ご持参ください。' 
                    : '※団体参拝は5名未満は20,000円より、5名以上は30,000円よりのお気持ち（当日現金納め）とさせていただいております。複数の願意を追加された場合はそれぞれの合算となります。'}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <label style={{ margin: 0 }}>ご本人の氏名 <span className="required">*</span></label>
                        {prayerItems.length > 0 && (
                          <button
                            type="button"
                            onClick={handleCopyFromPrayerItem}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-mizuiro)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              padding: 0,
                              textDecoration: 'underline',
                              fontWeight: 500,
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-urushi)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-mizuiro)'}
                          >
                            ご祈祷を受ける方のお名前をコピー
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：清瀧 太郎"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoComplete="off"
                      />
                      <div style={{ fontSize: '0.75rem', color: '#d3381c', margin: '0.35rem 0 0 0', lineHeight: '1.4' }}>
                        ※お札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（吉や𠮷、高や髙、邊や邉、斉や齊や齋、瀬や瀨、柳や栁、等々）
                      </div>
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
                        autoComplete="off"
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
                        autoComplete="off"
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
                        autoComplete="off"
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
                        autoComplete="off"
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
                        autoComplete="off"
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
                        autoComplete="off"
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
                        autoComplete="off"
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
                      autoComplete="off"
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
                        autoComplete="off"
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
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>団体（企業）代表者 役職・氏名 <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：代表取締役社長 清瀧太郎"
                        value={representativeTitleName}
                        onChange={(e) => setRepresentativeTitleName(e.target.value)}
                        required
                        autoComplete="off"
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>代表者 役職・氏名（フリガナ） <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例：ダイヒョウトリシマリヤクシャチョウ キヨタキタロウ"
                        value={representativeKana}
                        onChange={(e) => setRepresentativeKana(e.target.value)}
                        required
                        autoComplete="off"
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
                        autoComplete="off"
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
                        autoComplete="off"
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
                        autoComplete="off"
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

                  {/* Additional Wooden Talismans (祈願符 木札) Section */}
                  <div style={{
                    marginTop: '1.25rem',
                    border: wantsWoodTalisman ? '1.5px solid #d48806' : '1px solid var(--color-border)',
                    borderRadius: '6px',
                    backgroundColor: wantsWoodTalisman ? '#fffbe6' : '#fafafa',
                    padding: '1rem',
                    transition: 'all 0.2s ease'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={wantsWoodTalisman}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setWantsWoodTalisman(checked);
                          if (!checked) {
                            setWoodTalismanCount('');
                            setWoodTalismanLargeCount('');
                            setWoodTalismanName('');
                            setWoodTalismanNames([]);
                            setWoodTalismanLargeNames([]);
                          } else {
                            if (!woodTalismanCount && !woodTalismanLargeCount) {
                              handleWoodTalismanCountChange(1);
                            }
                          }
                        }}
                        style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: wantsWoodTalisman ? '#b22222' : 'var(--color-urushi)' }}>
                          追加で木の御札をお求めの場合、祈願符（木札）・祈願符（木札・大）の必要体数を以下の入力欄にお願いします
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-accent-gray)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                          社名・団体名や願意を墨書した大型の木札（祈願符）を追加で授与ご希望の場合はチェックを入れてください。
                        </div>
                      </div>
                    </label>

                    {wantsWoodTalisman && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #d48806' }}>
                        {/* Notice */}
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #ffd591',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '4px',
                          fontSize: '0.82rem',
                          lineHeight: '1.5',
                          color: '#873800',
                          marginBottom: '1rem'
                        }}>
                          📌 <strong>【追加初穂料のご案内】</strong><br />
                          初穂料は<strong>祈願符（木札）が1体 2,000円</strong>、<strong>祈願符（木札・大）が1体 5,000円</strong>のお納めで、<strong>ご祈祷の初穂料と合算</strong>になります。
                        </div>

                        {/* Counts Input */}
                        <div className="form-row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                          <div className="form-group" style={{ flex: '1 1 240px', margin: 0 }}>
                            <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>
                              祈願符（木札）・・・高さ約３６cm
                              <span style={{ fontSize: '0.75rem', color: '#b22222', marginLeft: '0.5rem', fontWeight: 'normal' }}>
                                (1体 2,000円)
                              </span>
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                              <input
                                type="number"
                                className="form-control"
                                min="0"
                                max="100"
                                placeholder="0"
                                value={woodTalismanCount}
                                onChange={(e) => handleWoodTalismanCountChange(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                                style={{ width: '100px', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }}
                              />
                              <span style={{ fontSize: '0.9rem', color: '#555' }}>体</span>
                              {Number(woodTalismanCount) > 0 && (
                                <span style={{ fontSize: '0.82rem', color: '#b22222', fontWeight: 600 }}>
                                  ＝ {((Number(woodTalismanCount) || 0) * 2000).toLocaleString()}円
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="form-group" style={{ flex: '1 1 240px', margin: 0 }}>
                            <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>
                              祈願符（木札・大）・・・高さ約４５ｃｍ
                              <span style={{ fontSize: '0.75rem', color: '#b22222', marginLeft: '0.5rem', fontWeight: 'normal' }}>
                                (1体 5,000円)
                              </span>
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                              <input
                                type="number"
                                className="form-control"
                                min="0"
                                max="100"
                                placeholder="0"
                                value={woodTalismanLargeCount}
                                onChange={(e) => handleWoodTalismanLargeCountChange(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                                style={{ width: '100px', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }}
                              />
                              <span style={{ fontSize: '0.9rem', color: '#555' }}>体</span>
                              {Number(woodTalismanLargeCount) > 0 && (
                                <span style={{ fontSize: '0.82rem', color: '#b22222', fontWeight: 600 }}>
                                  ＝ {((Number(woodTalismanLargeCount) || 0) * 5000).toLocaleString()}円
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Individual Names on Wood Talismans (Anti-Squash Vertical Layout) */}
                        <div style={{ marginTop: '1.25rem' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            borderBottom: '1px solid #ffd591',
                            paddingBottom: '0.4rem',
                            marginBottom: '0.65rem'
                          }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-urushi)', margin: 0 }}>
                              🎋 各木札に書かれるお名前（墨書名）の入力
                            </label>
                            {((Number(woodTalismanCount) || 0) > 0 || (Number(woodTalismanLargeCount) || 0) > 0) && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleApplyDefaultNameToAllWoodTalismans}
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '0.25rem 0.65rem',
                                  backgroundColor: '#ffffff',
                                  borderColor: 'var(--color-gold)',
                                  color: 'var(--color-urushi)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                                title="入力中の会社名・代表者名をすべての木札のお名前に一括反映します"
                              >
                                <span>📋</span>
                                <span>会社名・代表者名をすべてに反映</span>
                              </button>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#d3381c', margin: '0.2rem 0 0.75rem 0', lineHeight: '1.4' }}>
                            ※木札にお名前を墨書いたしますのでお間違えの無いようお気を付けください（未入力の場合は会社名・代表者名が適用されます）
                          </div>

                          {/* 36cm Individual Names */}
                          {Number(woodTalismanCount) > 0 && (
                            <div style={{ marginBottom: '1rem', width: '100%' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#873800', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>🏷️</span>
                                <span>祈願符（木札・約36cm）のお名前（全 {woodTalismanCount} 体）</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                {Array.from({ length: Number(woodTalismanCount) }).map((_, idx) => (
                                  <div
                                    key={`36cm-${idx}`}
                                    style={{
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #ffd591',
                                      borderRadius: '4px',
                                      padding: '0.65rem 0.85rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      width: '100%',
                                      boxSizing: 'border-box'
                                    }}
                                  >
                                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#333', marginBottom: '0.3rem' }}>
                                      【36cm・{idx + 1}体目】お名前（墨書名）
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      style={{ width: '100%', minHeight: '40px', boxSizing: 'border-box', fontSize: '0.92rem' }}
                                      placeholder={idx === 0 
                                        ? (talismanName || (companyName ? (representativeTitleName ? `${companyName} ${representativeTitleName}` : companyName) : '例：清瀧株式会社 代表取締役 清瀧太郎'))
                                        : `例：${companyName ? `${companyName} 部署名など` : '例：関連組織名・役職氏名など'}`}
                                      value={woodTalismanNames[idx] || ''}
                                      onChange={(e) => handleUpdateWoodTalismanName(idx, e.target.value)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 45cm Large Individual Names */}
                          {Number(woodTalismanLargeCount) > 0 && (
                            <div style={{ marginBottom: '1rem', width: '100%' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#873800', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>🏷️</span>
                                <span>祈願符（木札・大・約45cm）のお名前（全 {woodTalismanLargeCount} 体）</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                {Array.from({ length: Number(woodTalismanLargeCount) }).map((_, idx) => (
                                  <div
                                    key={`45cm-${idx}`}
                                    style={{
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #ffd591',
                                      borderRadius: '4px',
                                      padding: '0.65rem 0.85rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      width: '100%',
                                      boxSizing: 'border-box'
                                    }}
                                  >
                                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#333', marginBottom: '0.3rem' }}>
                                      【大45cm・{idx + 1}体目】お名前（墨書名）
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      style={{ width: '100%', minHeight: '40px', boxSizing: 'border-box', fontSize: '0.92rem' }}
                                      placeholder={idx === 0 
                                        ? (talismanName || (companyName ? (representativeTitleName ? `${companyName} ${representativeTitleName}` : companyName) : '例：清瀧株式会社 代表取締役 清瀧太郎'))
                                        : `例：${companyName ? `${companyName} 部署名など` : '例：関連組織名・役職氏名など'}`}
                                      value={woodTalismanLargeNames[idx] || ''}
                                      onChange={(e) => handleUpdateWoodTalismanLargeName(idx, e.target.value)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {Number(woodTalismanCount) === 0 && Number(woodTalismanLargeCount) === 0 && (
                            <div style={{ fontSize: '0.82rem', color: '#777', fontStyle: 'italic', padding: '0.5rem 0' }}>
                              ※上記で体数を入力すると、各体数分のお名前（墨書名）入力欄が表示されます。
                            </div>
                          )}
                        </div>

                        {/* Subtotal bar */}
                        <div style={{
                          marginTop: '0.75rem',
                          backgroundColor: '#ffffff',
                          border: '1px dashed #d48806',
                          borderRadius: '4px',
                          padding: '0.5rem 0.85rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.88rem'
                        }}>
                          <span style={{ color: '#555' }}>
                            追加木札 小計（計 {(Number(woodTalismanCount) || 0) + (Number(woodTalismanLargeCount) || 0)}体）:
                          </span>
                          <span style={{ fontWeight: 'bold', color: '#b22222', fontSize: '1.05rem' }}>
                            ＋{woodTalismanTotal.toLocaleString()} 円
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Receipt Options */}
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <label className="checkbox-label" style={{ marginBottom: wantsReceipt ? '0.75rem' : '0' }}>
                      <input
                        type="checkbox"
                        checked={wantsReceipt}
                        onChange={(e) => {
                          setWantsReceipt(e.target.checked);
                        }}
                      />
                      領収証の発行を希望する
                    </label>

                    {wantsReceipt && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
                        {receipts.map((r, idx) => (
                          <div
                            key={r.id || idx}
                            style={{
                              backgroundColor: idx === 0 ? '#fbfbfb' : '#fffdf7',
                              border: idx === 0 ? '1px solid var(--color-border)' : '1px solid var(--color-gold)',
                              borderLeft: idx === 0 ? '4px solid var(--color-mizuiro)' : '4px solid var(--color-gold)',
                              borderRadius: '4px',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.75rem'
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderBottom: idx === 0 ? '1px dashed var(--color-border)' : '1px dashed rgba(197, 160, 89, 0.4)',
                              paddingBottom: '0.4rem'
                            }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-urushi)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>📄</span>
                                <span>{receipts.length > 1 ? `領収証（${idx + 1}社目）` : '領収証の発行情報'}</span>
                              </div>
                              {receipts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReceipt(idx)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#d3381c',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    padding: '0.2rem 0.4rem',
                                    borderRadius: '3px',
                                    fontWeight: 'bold'
                                  }}
                                  title="この領収証を削除"
                                >
                                  <span>✕</span>
                                  <span>削除</span>
                                </button>
                              )}
                            </div>

                            <div className="form-row" style={{ margin: 0, flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div className="form-group" style={{ margin: 0, flex: '2 1 240px' }}>
                                <label>
                                  {receipts.length > 1 ? `領収証の宛名（${idx + 1}社目）` : '領収証の宛名'} <span className="required">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder={idx === 0 ? (companyName ? `例：${companyName}` : '例：株式会社〇〇') : '例：関連企業・協力会社名など'}
                                  value={r.name}
                                  onChange={(e) => handleUpdateReceipt(idx, 'name', e.target.value)}
                                  required
                                />
                              </div>
                              <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
                                <label>
                                  {receipts.length > 1 ? `領収証の金額（${idx + 1}社目・円）` : '領収証の金額 (円)'} <span className="required">*</span>
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  min="1"
                                  value={r.amount || ''}
                                  onChange={(e) => handleUpdateReceipt(idx, 'amount', Math.max(0, parseInt(e.target.value) || 0))}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* 追加ボタン */}
                        <div>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 1rem',
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              borderColor: 'var(--color-gold)',
                              color: 'var(--color-urushi)',
                              backgroundColor: '#fffdf7'
                            }}
                            onClick={handleAddReceipt}
                          >
                            <span style={{ fontSize: '1rem', lineHeight: 1 }}>＋</span>
                            <span>領収証を追加する（他社名義・分割発行）</span>
                          </button>
                          <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '0.75rem' }}>
                            ※1回のお申込みで何社分でも無制限に追加可能です
                          </span>
                        </div>

                        {/* 合計とお初穂料の照合バー（独立ブロック） */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.6rem 0.75rem',
                          backgroundColor: '#ffffff',
                          border: '1px solid rgba(197, 160, 89, 0.35)',
                          borderRadius: '4px',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          marginTop: '0.25rem'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isReceiptAmountMatched ? 'var(--color-accent-green)' : '#d3381c' }}>
                              {isReceiptAmountMatched ? '✓ ' : '⚠ '}
                              領収証合計: {totalReceiptAmount.toLocaleString()} 円
                              {receipts.length > 1 && `（全${receipts.length}社分）`}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#666' }}>
                              初穂料・御札 合計： <strong>{targetReceiptCheckAmount.toLocaleString()} 円</strong>
                              {!isReceiptAmountMatched && (
                                <span style={{ color: '#d3381c', fontWeight: 'bold', marginLeft: '0.4rem' }}>
                                  ※合計額と一致していません（差額: {(totalReceiptAmount - targetReceiptCheckAmount > 0 ? '+' : '') + (totalReceiptAmount - targetReceiptCheckAmount).toLocaleString()} 円）
                                </span>
                              )}
                            </div>
                          </div>
                          {receipts.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                              onClick={handleDistributeReceiptsEqually}
                            >
                              初穂料を均等配分
                            </button>
                          )}
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
                <p style={{ color: '#2e7d32', fontWeight: 'bold' }}>・**境内での記念撮影・カメラマン撮影について**: 撮影でカメラマンの方をお願いされるご家族様には撮影許可証などは設けておりません。他のご参拝の方のご迷惑にならないよう、どうぞお撮り下さいませ。（※なお、神前での厳粛なご祈祷を厳修するため、社殿・拝殿内へのカメラマンのお立ち入り・ご祈祷中の撮影はご遠慮いただきます）</p>
                <p>・お初穂料はご神前にお供えいたしますので、のし袋か封筒などに入れご持参ください。</p>
                <p>・ご祈祷の所要時間は、約20〜30分ほどかかります。</p>
                <p>・神社で恒例祭典等の行事があります場合、ご予約がお受けできない日時がございます。</p>
                <p>・ご一緒に参拝（昇殿）いただくご家族等の人数制限は設けておりません。</p>
                <p style={{ color: '#d3381c', fontWeight: 'bold' }}>・令和8年の七五三時期（11月中）と令和9年のお正月時期（1月中）と節分（2月3日）は、臨時の駐車場を設けることが出来ません。ご不便をお掛けいたしますが、境内裏手の駐車場（約12台駐車可能）が満車の際は、お近くのコインパーキングをご利用いただくか、公共交通機関をご利用の上、ご参拝賜りますよう伏してお願い申し上げます。</p>

                {/* Conditional dynamically rendered notes */}
                {prayer1 === '車祓（お車のお祓い）' && (
                  <p style={{ color: 'var(--color-mizuiro)', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    ※車祓（お車のお祓い）の方は、お車を駐車場に停めず、神社正面の鳥居をくぐり、参道に停車していただきますようお願いいたします。
                  </p>
                )}
                {prayer1 === '安産祈願' && (
                  <p style={{ color: 'var(--color-accent-green)', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    ※安産祈願の方は、ご祈祷の授与品として腹帯をお渡しする予定でございます。
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
              {FAQ_ITEMS.map((faq, idx) => (
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
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>ご祈祷のお申込件数</span>
                      <span style={{ fontWeight: 'bold' }}>{orgPrayerItems.length > 0 ? orgPrayerItems.length : 1} 件</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>お初穂料 合計</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--color-mizuiro)', fontSize: '1.05rem' }}>
                          {effectiveOrgHatsuhoryo.toLocaleString()} 円より お気持ち（当日現金納め）
                        </span>
                        {wantsWoodTalisman && woodTalismanTotal > 0 && (
                          <span style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.2rem' }}>
                            （内訳: ご祈祷 {(orgPrayerItems.length > 0 ? orgPrayersTotal : hatsuhoryo).toLocaleString()}円 ＋ 木札 {woodTalismanTotal.toLocaleString()}円）
                          </span>
                        )}
                      </div>
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
                        {(() => {
                          const children = getBookingChildren(item);
                          if (children.length === 0) return null;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-accent-gray)' }}>
                              {children.map((c, cIdx) => (
                                <div key={cIdx} style={{ borderBottom: cIdx < children.length - 1 ? '1px dashed #eee' : 'none', paddingBottom: '0.25rem' }}>
                                  <div><strong>お子様{children.length > 1 ? `（${cIdx + 1}人目）` : ''}:</strong> {c.name} 様 ({c.kana}){c.gender ? ` [${c.gender}の子]` : ''}</div>
                                  <div>生年月日: {c.birthday} {c.age_text ? `(${c.age_text})` : ''}</div>
                                </div>
                              ))}
                              {item.father_name && <div>父親: {item.father_name} ({item.father_kana})</div>}
                              {item.mother_name && <div>母親: {item.mother_name} ({item.mother_kana})</div>}
                            </div>
                          );
                        })()}
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
                      <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>代表者名 (フリガナ)</span>
                      <span>{representativeTitleName} ({representativeKana})</span>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>領収証の発行</span>
                        <span style={{ fontWeight: 'bold', color: wantsReceipt ? 'var(--color-urushi)' : '#888' }}>
                          {wantsReceipt ? (receipts.length > 1 ? `希望する（全${receipts.length}社名義・計${receipts.length}枚発行）` : '希望する（1枚発行）') : '希望しない'}
                        </span>
                      </div>
                      {wantsReceipt && (
                        <div style={{ backgroundColor: '#fcfbf7', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {receipts.map((r, idx) => (
                            <div
                              key={r.id || idx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: idx < receipts.length - 1 ? '1px dashed #e0dcd3' : 'none',
                                paddingBottom: idx < receipts.length - 1 ? '0.5rem' : '0',
                                flexWrap: 'wrap',
                                gap: '0.25rem'
                              }}
                            >
                              <span style={{ fontSize: '0.88rem', color: '#444' }}>
                                {receipts.length > 1 ? `【${idx + 1}社目】宛名: ` : '宛名: '}
                                <strong style={{ color: '#222', fontSize: '0.95rem' }}>{r.name || '（未入力）'}</strong> 様
                              </span>
                              <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-urushi)' }}>
                                {Number(r.amount).toLocaleString()} 円
                              </span>
                            </div>
                          ))}
                          {receipts.length > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e0dcd3', paddingTop: '0.4rem', fontSize: '0.82rem' }}>
                              <span style={{ color: '#666' }}>領収証 合計金額</span>
                              <span style={{ fontWeight: 'bold', color: isReceiptAmountMatched ? 'var(--color-accent-green)' : '#d3381c' }}>
                                {totalReceiptAmount.toLocaleString()} 円
                                {isReceiptAmountMatched ? '（お初穂料と一致）' : '（※お初穂料と不一致）'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Organization Prayer Items Card List in Step 3 */}
                    {orgPrayerItems.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-urushi)' }}>
                          📋 お申込みのご祈祷一覧（{orgPrayerItems.length}件）
                        </div>
                        {orgPrayerItems.map((item, idx) => (
                          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: '#fcfbf7', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-gold)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                              <span>第{idx + 1}祈願</span>
                              <span style={{ color: 'var(--color-mizuiro)' }}>{item.hatsuhoryo.toLocaleString()} 円</span>
                            </div>
                            <div style={{ fontSize: '0.88rem' }}>
                              <strong>主願意:</strong> {item.prayer1 === 'その他（自由入力）' ? item.org_custom_prayer1 : item.prayer1}
                            </div>
                            {item.prayer2 && (
                              <div style={{ fontSize: '0.88rem' }}>
                                <strong>副願意:</strong> {item.prayer2 === 'その他（自由入力）' ? item.org_custom_prayer2 : item.prayer2}
                              </div>
                            )}
                            {item.talisman_name && (
                              <div style={{ fontSize: '0.82rem', color: '#555' }}>
                                <strong>お札名:</strong> {item.talisman_name}
                              </div>
                            )}
                            {item.tournament_name && (
                              <div style={{ fontSize: '0.8rem', backgroundColor: '#fff9e6', padding: '0.35rem 0.5rem', borderRadius: '3px' }}>
                                <div><strong>必勝祈願 大会名:</strong> {item.tournament_name}</div>
                                <div><strong>日程:</strong> {item.tournament_schedule}</div>
                              </div>
                            )}
                            {item.construction_name && (
                              <div style={{ fontSize: '0.8rem', backgroundColor: '#fff9e6', padding: '0.35rem 0.5rem', borderRadius: '3px' }}>
                                <div><strong>工事安全祈願 工事名:</strong> {item.construction_name}</div>
                                <div><strong>設計監理:</strong> {item.construction_designer} | <strong>施工:</strong> {item.construction_builder}</div>
                                <div><strong>工期:</strong> {item.construction_period}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                          <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>主願意</span>
                          <span>{getActivePrayer1()}</span>
                        </div>
                        {getActivePrayer2() && (
                          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                            <span style={{ width: '35%', color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>副願意</span>
                            <span>{getActivePrayer2()}</span>
                          </div>
                        )}
                        {tournamentName && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: '#fff9e6', padding: '0.5rem', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--color-gold)' }}>必勝祈願 詳細</div>
                            <div>大会名称: {tournamentName}</div>
                            <div>大会日程: {tournamentSchedule}</div>
                          </div>
                        )}
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

                    {/* Additional Wooden Talismans (祈願符) Step 3 Confirmation */}
                    {wantsWoodTalisman && (
                      <div style={{
                        marginTop: '0.75rem',
                        backgroundColor: '#fffbe6',
                        border: '1.5px solid #d48806',
                        borderRadius: '4px',
                        padding: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                      }}>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '0.88rem',
                          color: '#b22222',
                          borderBottom: '1px dashed #d48806',
                          paddingBottom: '0.35rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>🎋 追加木の御札（祈願符）</span>
                          <span style={{ fontSize: '0.95rem' }}>＋{woodTalismanTotal.toLocaleString()} 円</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                          {Number(woodTalismanCount) > 0 && (
                            <span>・祈願符（約36cm）: <strong>{woodTalismanCount}</strong> 体 ({((Number(woodTalismanCount) || 0) * 2000).toLocaleString()}円)</span>
                          )}
                          {Number(woodTalismanLargeCount) > 0 && (
                            <span>・祈願符・大（約45cm）: <strong>{woodTalismanLargeCount}</strong> 体 ({((Number(woodTalismanLargeCount) || 0) * 5000).toLocaleString()}円)</span>
                          )}
                        </div>
                        {Number(woodTalismanCount) > 0 && woodTalismanNames.length > 0 && (
                          <div style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
                            <span style={{ fontWeight: 600, color: '#873800' }}>【祈願符（約36cm）墨書名】</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.15rem', paddingLeft: '0.5rem' }}>
                              {woodTalismanNames.slice(0, Number(woodTalismanCount)).map((name, i) => (
                                <div key={i}>
                                  {i + 1}体目: <strong>{name.trim() || (talismanName || (companyName ? (representativeTitleName ? `${companyName} ${representativeTitleName}` : companyName) : '（未入力・会社名代表者名適用）'))}</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {Number(woodTalismanLargeCount) > 0 && woodTalismanLargeNames.length > 0 && (
                          <div style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
                            <span style={{ fontWeight: 600, color: '#873800' }}>【祈願符・大（約45cm）墨書名】</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.15rem', paddingLeft: '0.5rem' }}>
                              {woodTalismanLargeNames.slice(0, Number(woodTalismanLargeCount)).map((name, i) => (
                                <div key={i}>
                                  {i + 1}体目: <strong>{name.trim() || (talismanName || (companyName ? (representativeTitleName ? `${companyName} ${representativeTitleName}` : companyName) : '（未入力・会社名代表者名適用）'))}</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Related Bookings Batch Reschedule Option in Confirmation Step */}
            {isEditMode && relatedBookings.length > 0 && (
              <div style={{
                backgroundColor: '#fffdf7',
                border: '1px solid var(--color-gold)',
                borderRadius: '4px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-urushi)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>💡</span> 同時に申し込まれた関連するご予約が他に {relatedBookings.length} 件 あります：
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {relatedBookings.map((rel, idx) => (
                    <div key={rel.id || idx} style={{ fontSize: '0.82rem', color: '#555', backgroundColor: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '3px', border: '1px solid #eee' }}>
                      ・【{rel.prayer1}】 {rel.name || rel.company_name} 様 / {rel.hatsuhoryo.toLocaleString()}円 (現在: {rel.booking_date} {rel.booking_time}の回)
                    </div>
                  ))}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-urushi)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={batchRescheduleRelated}
                    onChange={(e) => setBatchRescheduleRelated(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  これらの関連予約（合計 {relatedBookings.length + 1} 件）も一緒に新しい日時（{selectedDate} {selectedTime}の回）に変更する
                </label>
              </div>
            )}

            {/* Booking Change & Cancellation Policy Guidance */}
            <div style={{
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '4px',
              padding: '1rem 1.25rem',
              marginBottom: '1.75rem',
              fontSize: '0.88rem',
              lineHeight: '1.6',
              color: '#274916'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.92rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#389e0d' }}>
                <span>ℹ️</span> ご予約の日程変更・キャンセルについて
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li>万一ご都合が悪くなった場合、<strong>ご祈祷開始日時の24時間前（前日同時刻）まで</strong>でしたら、予約完了メールのURLよりオンラインで日時変更・キャンセルが可能です。</li>
                <li><strong>キャンセル料等は一切発生いたしません</strong>ので、安心してご予約ください。</li>
                <li>開始24時間以内の直前の変更・キャンセルにつきましては、清瀧神社社務所（<a href="tel:0473515417" style={{ color: '#274916', fontWeight: 'bold', textDecoration: 'underline' }}>047-351-5417</a>）までお電話にて直接ご連絡をお願いいたします。</li>
              </ul>
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
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.2rem',
                              flex: 1,
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <span style={{
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                color: 'var(--color-urushi)',
                                lineHeight: '1.4'
                              }}>
                                {item.title}
                              </span>
                              {item.price && (
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  color: 'var(--color-gold)',
                                  backgroundColor: 'rgba(197, 160, 89, 0.08)',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '2px',
                                  marginTop: '0.1rem',
                                  display: 'inline-block'
                                }}>
                                  初穂料: {item.price}
                                </span>
                              )}
                            </div>
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
        )}

        {/* FAQ Tab Display */}
        {activeMainTab === 'faq' && (
          <div className="card kamidana-border" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-serif)' }}>
              ご予約にあたってのよくあるご質問 (FAQ)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {FAQ_ITEMS.map((faq, idx) => (
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

        {/* Lookup Tab Display */}
        {activeMainTab === 'lookup' && (
          <div className="card kamidana-border" style={{ padding: '2.5rem 1.75rem', maxWidth: '620px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-serif)', color: 'var(--color-urushi)' }}>
              ご予約の確認・日程変更・キャンセル
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-accent-gray)', textAlign: 'center', marginBottom: '1.75rem', lineHeight: '1.6' }}>
              予約完了メールまたは予約完了画面に表示された「受付番号」と、お申し込み時の「お電話番号」を入力して照会してください。
            </p>

            {lookupError && (
              <div style={{
                backgroundColor: '#fff1f0',
                border: '1px solid #ffa39e',
                color: '#d3381c',
                padding: '0.85rem 1rem',
                borderRadius: '4px',
                fontSize: '0.88rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={18} />
                <span>{lookupError}</span>
              </div>
            )}

            <form onSubmit={handleLookupBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--color-urushi)' }}>
                  受付番号 <span style={{ color: '#d3381c' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="例: SRY-260925-ABCD"
                  value={lookupReceiptNumber}
                  onChange={(e) => setLookupReceiptNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1.05rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'monospace'
                  }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.35rem', display: 'block' }}>
                  ※予約完了時にお控えいただいた「SRY-」から始まる受付番号です。
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--color-urushi)' }}>
                  お電話番号 <span style={{ color: '#d3381c' }}>*</span>
                </label>
                <input
                  type="tel"
                  placeholder="例: 09012345678 （ハイフン有無どちらでも可）"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)'
                  }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.35rem', display: 'block' }}>
                  ※ご予約時に入力されたお電話番号（ハイフンの有無は問いません）を入力してください。
                </span>
              </div>

              <div style={{
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                padding: '0.9rem 1.1rem',
                fontSize: '0.84rem',
                color: '#274916',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.3rem', color: '#389e0d' }}>
                  ℹ️ ご変更・キャンセルについてのご案内
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <li>オンラインでの変更・キャンセルは、<strong>ご祈祷開始日時の24時間前（前日同時刻）まで</strong>受付可能です。</li>
                  <li><strong>キャンセル料等は一切発生いたしません</strong>のでご安心ください。</li>
                  <li>24時間以内の直前変更・キャンセルにつきましては、清瀧神社社務所（<a href="tel:0473515417" style={{ color: '#274916', fontWeight: 'bold', textDecoration: 'underline' }}>047-351-5417</a>）までお電話にて直接ご連絡ください。</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={lookupLoading}
                className="btn btn-primary"
                style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}
              >
                {lookupLoading ? '照会中...' : '🔍 ご予約を照会する'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>

    {submitting && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        transition: 'all 0.3s ease'
      }}>
        <div className="card kamidana-border washi-bg" style={{
          padding: '2.5rem 3rem',
          textAlign: 'center',
          maxWidth: '450px',
          border: '2px solid var(--color-urushi)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          animation: 'fadeInUp 0.4s ease'
        }}>
          <div className="spinner" style={{ 
            width: '50px', 
            height: '50px', 
            borderWidth: '4px',
            borderColor: 'var(--color-urushi) transparent var(--color-urushi) transparent',
            margin: '0 auto 1.5rem auto'
          }} />
          <h3 style={{ 
            fontFamily: 'var(--font-serif)', 
            color: 'var(--color-urushi)', 
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '0.75rem'
          }}>
            {isEditMode ? '変更内容を送信中' : 'ご祈祷予約を確定中'}
          </h3>
          <p style={{ 
            fontSize: '0.9rem', 
            color: 'var(--color-shu)', 
            fontWeight: 'bold',
            margin: 0,
            backgroundColor: 'rgba(211, 56, 28, 0.05)',
            padding: '0.5rem 1rem',
            borderRadius: '2px',
            border: '1px solid rgba(211, 56, 28, 0.15)'
          }}>
            ⚠️ 画面が切り替わるまで操作しないでください
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.75rem' }}>
            ※通信状況により、完了まで数秒かかる場合があります。
          </p>
        </div>
      </div>
    )}
    </>
  );
};
export default VisitorPortal;
