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
  staff_dept_title_name?: string;
  staff_phone?: string;
  staff_email?: string;
  
  // 団体お札・授与品
  talisman_name?: string;
  additional_talismans?: string;
  
  // 団体領収書
  wants_receipt?: number; // 0 or 1
  receipt_name?: string;
  receipt_amount?: number;

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
  created_at?: string;
  is_manual?: number;
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

export interface Setting {
  key: string;
  value: string;
}
