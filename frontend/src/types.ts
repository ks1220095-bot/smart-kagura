export interface Booking {
  id?: number;
  receipt_number?: string;
  booking_type: 'individual' | 'organization';
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:MM
  prayer1: string;      // 主願意
  prayer2?: string;     // 副願意 (団体のみ)
  hatsuhoryo: number;   // 初穂料
  payment_status: 'unpaid' | 'paid';
  attending_count: number; // 参列予定人数
  
  // 個人用フィールド
  name?: string;
  kana?: string;
  address?: string;
  address_kana?: string;
  phone?: string;
  email?: string;
  
  // 団体用フィールド
  company_name?: string;
  company_kana?: string;
  company_address?: string;
  company_address_kana?: string;
  representative_title_name?: string;
  representative_kana?: string;
  staff_dept_title_name?: string;
  staff_phone?: string;
  staff_email?: string;
  
  // 団体お札・授与品
  talisman_name?: string;
  additional_talismans?: string;
  wood_talisman_count?: number; // 祈願符（木札・約36cm）体数
  wood_talisman_large_count?: number; // 祈願符（木札・大・約45cm）体数
  wood_talisman_name?: string; // 木札に書かれる名前（墨書名）
  wood_talisman_items_data?: string; // 各体数ごとの個別名前JSON { standard?: string[], large?: string[] }
  
  // 団体領収書
  wants_receipt?: number; // 0 or 1
  receipt_name?: string;
  receipt_amount?: number;
  receipt_split_count?: number; // 1 or 2
  receipt_name2?: string;
  receipt_amount2?: number;
  receipts_data?: string; // JSON string of ReceiptItem[]
  receipts?: ReceiptItem[]; // Array of ReceiptItem during booking creation/editing

  // 個人厄年
  yakudoshi_type?: 'maeyaku' | 'honyaku' | 'atoyaku' | '';

  // 個人初宮・七五三
  father_name?: string;
  father_kana?: string;
  mother_name?: string;
  mother_kana?: string;
  child_name?: string;
  child_kana?: string;
  child_birthday?: string;
  children_data?: string; // JSON string of ChildItem[] for multiple children (七五三・初宮・双子・きょうだい)

  // 個人寿祝い
  kotobuki_type?: string;
  kotobuki_other_text?: string;

  // 団体必勝祈願
  tournament_name?: string;
  tournament_schedule?: string;

  // 団体工事安全祈願
  construction_name?: string;
  construction_designer?: string;
  construction_builder?: string;
  construction_period?: string;

  is_accepted?: number;
  is_receipt_issued?: number;
  is_cancelled?: number;
  is_changed?: number;
  notes?: string;
  progress_status?: '新規です♪' | 'チェック済み！' | '受付済み♪' | 'ご祈祷中👏' | '返信済み！' | '遅刻中＞＜';
  progress_status_updated_at?: string;
  changed_at?: string;
  changed_history?: string;
  cancelled_at?: string;
  created_at?: string;
  is_manual?: number;
  has_past_prayer?: number;
  is_twin?: number;
  child_name2?: string;
  child_kana2?: string;
  child_birthday2?: string;
  child_gender?: '男' | '女';
  child_gender2?: '男' | '女';
  car_maker?: string;
  car_model?: string;
  car_number?: string;
  saishu?: string; // 斎主（ご祈祷をご奉仕する神職名）
}

export interface CalendarEvent {
  id?: number;
  title: string;
  event_date: string; // YYYY-MM-DD
  start_time: string;  // HH:MM
  end_time: string;    // HH:MM
  description?: string;
  is_closed_slot: number; // 0 or 1 (予約枠を自動クローズするか)
}

export interface SlotAvailability {
  time: string;
  count: number;
  capacity: number;
  status: 'O' | '▲' | 'X';
  label: string;
}

export interface ReceiptItem {
  name: string;
  amount: number;
}

export const getBookingReceipts = (b: Booking): ReceiptItem[] => {
  if (b.receipts_data) {
    try {
      const parsed = JSON.parse(b.receipts_data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((item: any) => item && typeof item.name === 'string');
      }
    } catch (e) {
      console.error('Failed to parse receipts_data', e);
    }
  }
  if (b.wants_receipt) {
    const list: ReceiptItem[] = [];
    if (b.receipt_name || b.company_name || b.name) {
      list.push({
        name: b.receipt_name || b.company_name || b.name || '',
        amount: b.receipt_amount || b.hatsuhoryo || 0
      });
    }
    if (b.receipt_split_count === 2 && b.receipt_name2) {
      list.push({
        name: b.receipt_name2,
        amount: b.receipt_amount2 || 0
      });
    }
    return list;
  }
  return [];
};

export interface OrgPrayerItem {
  id: string;
  prayer1: string;
  org_custom_prayer1?: string;
  prayer2?: string;
  org_custom_prayer2?: string;
  hatsuhoryo: number;
  talisman_name?: string;
  tournament_name?: string;
  tournament_schedule?: string;
  construction_name?: string;
  construction_designer?: string;
  construction_builder?: string;
  construction_period?: string;
}

export interface ChildItem {
  name: string;
  kana: string;
  gender?: '男' | '女';
  birthday: string;
  age_text?: string;
}

export const getBookingChildren = (b: {
  children_data?: string;
  child_name?: string;
  child_kana?: string;
  child_gender?: '男' | '女';
  child_birthday?: string;
  child_name2?: string;
  child_kana2?: string;
  child_gender2?: '男' | '女';
  child_birthday2?: string;
  [key: string]: any;
}): ChildItem[] => {
  if (b.children_data) {
    try {
      const parsed = JSON.parse(b.children_data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
  }
  const list: ChildItem[] = [];
  if (b.child_name) {
    list.push({
      name: b.child_name,
      kana: b.child_kana || '',
      gender: b.child_gender,
      birthday: b.child_birthday || ''
    });
  }
  if (b.child_name2) {
    list.push({
      name: b.child_name2,
      kana: b.child_kana2 || '',
      gender: b.child_gender2,
      birthday: b.child_birthday2 || ''
    });
  }
  return list;
};

