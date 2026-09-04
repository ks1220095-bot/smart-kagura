/**
 * 神社向け授与品レジ＆ご祈祷合算システム - フロントエンドロジック (並び替え整理＆共有メモ完全版)
 */

// ==========================================
// 設定値
// ==========================================
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbylCO8dnFeWjCRIFaZ2XFyXj1uJvTu5ib0VUy9ditp_FC2nHEFnbywk4r0WY7J3bGT7/exec';

// ==========================================
// ユーティリティ
// ==========================================
// 日本時間（JST）基準で YYYY-MM-DD 形式の日付文字列を取得する
function getJstDateString(dateObj = new Date()) {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(dateObj).replace(/\//g, '-');
}

// ==========================================
// ローカルモックデータ (ふりがな初期設定あり)
// ==========================================
const MOCK_ITEMS = [
  { id: 'M-01', name: '家内安全御札', furigana: 'かないあんぜんおふだ', price: 1500, description: 'ご家族の健康と安全を祈願した木札です。', stock: 50, category: 'ofuda', remark: '大サイズ', display: true, imageUrl: '' },
  { id: 'M-02', name: '商売繁盛御札', furigana: 'しょうばいはんじょうおふだ', price: 1500, description: 'ご事業の繁栄と商売の繁盛を祈願した木札です。', stock: 30, category: 'ofuda', remark: '大サイズ', display: true, imageUrl: '' },
  { id: 'M-03', name: '交通安全お守り', furigana: 'こうつうあんぜんおまもり', price: 800, description: '日々の交通安全・道中安全を祈願したお守りです。', stock: 100, category: 'omamori', remark: '錦袋', display: true, imageUrl: '' },
  { id: 'M-04', name: '厄除けお守り', furigana: 'やくよけおまもり', price: 800, description: '災厄を払い、身を守るお守りです。', stock: 0, category: 'omamori', remark: '赤/紫', display: true, imageUrl: '' },
  { id: 'M-05', name: '授与用通常御朱印', furigana: 'じゅよようつうじょうごしゅいん', price: 500, description: '当神社の通常御朱印です。', stock: 200, category: 'goshuin', remark: '記帳・書置き', display: true, imageUrl: '' },
  { id: 'M-06', name: '限定金字御朱印', furigana: 'げんていきんじごしゅいん', price: 1000, description: '季節限定の金文字御朱印です。', stock: 50, category: 'goshuin', remark: '書置きのみ', display: true, imageUrl: '' },
  { id: 'M-07', name: '吉祥干支置物', furigana: 'きっしょうえとおきもの', price: 1200, description: '当年の干支を象った縁起の良い置物です。', stock: 40, category: 'engimono', remark: '箱入り', display: true, imageUrl: '' },
  { id: 'M-08', name: '破魔矢', furigana: 'はまや', price: 1500, description: '魔を除け、幸運を射止める破魔矢です。', stock: 60, category: 'engimono', remark: '絵馬付き', display: true, imageUrl: '' },
  { id: 'M-09', name: '御朱印帳 (和柄)', furigana: 'ごしゅいんちょう', price: 2000, description: '当神社オリジナルの御朱印帳です。', stock: 20, category: 'other', remark: '限定版', display: true, imageUrl: '' },
  { id: 'M-10', name: '祈願絵馬', furigana: 'きがんえま', price: 700, description: '願い事を書くための木製絵馬です。', stock: 80, category: 'other', remark: '干支デザイン', display: true, imageUrl: '' }
];

const MOCK_PRAYERS = {
  '2026-07-18': [
    { type: '個人祈祷 (家内安全)', count: 3, amount: 15000 },
    { type: '個人祈祷 (厄除け)', count: 2, amount: 10000 },
    { type: '会社・団体祈祷', count: 1, amount: 30000 }
  ],
  '2026-07-20': [
    { type: '個人祈祷 (家内安全)', count: 2, amount: 10000 },
    { type: '個人祈祷 (初宮詣)', count: 1, amount: 10000 }
  ]
};

// ==========================================
// 提出用指定書式（清瀧神社〈R8/9/1ver.〉・全62品目）マスタ定義
// ==========================================
const SUBMISSION_SHEET_ITEMS = [
  { name: "木札(大)", price: 5000, remark: "" },
  { name: "木札", price: 2000, remark: "" },
  { name: "四角札", price: 2000, remark: "" },
  { name: "神宮大麻", price: 1000, remark: "" },
  { name: "神社紙札", price: 800, remark: "" },
  { name: "神札セット", price: 1800, remark: "" },
  { name: "切札", price: 300, remark: "" },
  { name: "竈札", price: 300, remark: "" },
  { name: "商売繁盛札", price: 1000, remark: "" },
  { name: "厄除守護札", price: 1000, remark: "" },
  { name: "清瀧御守", price: 800, remark: "" },
  { name: "足御守", price: 2000, remark: "" },
  { name: "必勝安全御守", price: 800, remark: "" },
  { name: "白御守", price: 600, remark: "" },
  { name: "健康守", price: 600, remark: "" },
  { name: "白肌", price: 500, remark: "" },
  { name: "御守(紫)", price: 600, remark: "" },
  { name: "御守(波紋)", price: 800, remark: "" },
  { name: "波紋御守（小）", price: 600, remark: "" },
  { name: "学業成就御守", price: 600, remark: "" },
  { name: "合格祈願御守", price: 600, remark: "" },
  { name: "大祓カード御守", price: 600, remark: "" },
  { name: "開運・厄除カード", price: 500, remark: "" },
  { name: "子授御守", price: 800, remark: "" },
  { name: "安産子宝御守", price: 800, remark: "" },
  { name: "厄除御守", price: 600, remark: "" },
  { name: "方位除御守", price: 600, remark: "" },
  { name: "病気平癒守", price: 600, remark: "" },
  { name: "仕事守", price: 600, remark: "" },
  { name: "勝守", price: 600, remark: "" },
  { name: "交通安全大（青）", price: 1000, remark: "" },
  { name: "交通安全(鈴付･青)", price: 800, remark: "" },
  { name: "交通安全和紙御守", price: 500, remark: "" },
  { name: "交通安全ステッカー", price: 700, remark: "" },
  { name: "旅行安全", price: 600, remark: "" },
  { name: "潜水艦(絆）", price: 800, remark: "" },
  { name: "新清瀧絵馬", price: 600, remark: "" },
  { name: "御札立", price: 500, remark: "" },
  { name: "みそか祓い", price: 700, remark: "" },
  { name: "清瀧歳神様", price: 2500, remark: "" },
  { name: "干支クリスタル", price: 300, remark: "" },
  { name: "特大鏑矢", price: 15000, remark: "" },
  { name: "鏑矢", price: 3000, remark: "" },
  { name: "破魔矢", price: 2000, remark: "" },
  { name: "破魔矢（カラフル）", price: 2500, remark: "" },
  { name: "卓上鏑矢", price: 1500, remark: "" },
  { name: "土鈴", price: 1500, remark: "" },
  { name: "福俵", price: 3000, remark: "" },
  { name: "熊手（新型）", price: 5000, remark: "" },
  { name: "熊手（中型）", price: 3000, remark: "" },
  { name: "熊手（小）台付", price: 2000, remark: "" },
  { name: "おみくじ", price: 100, remark: "" },
  { name: "夢みくじ", price: 100, remark: "" },
  { name: "扇子おみくじ", price: 200, remark: "" },
  { name: "開運おみくじ", price: 200, remark: "" },
  { name: "御朱印", price: 500, remark: "" },
  { name: "季節の御朱印", price: 800, remark: "" },
  { name: "限定御朱印", price: 1000, remark: "" },
  { name: "御朱印帳", price: 1500, remark: "" },
  { name: "七五三絵馬", price: 800, remark: "" },
  { name: "千歳飴", price: 500, remark: "" },
  { name: "絆守（隊員用）", price: 600, remark: "" }
];

// ==========================================
// レジ・マスタ登録名 ➔ 提出用指定書式名への完全名寄せ辞書
// ==========================================
const ITEM_NAME_TO_SUBMISSION_MAP = {
  // 季節の御朱印関連（秋・春・夏・冬）
  "秋の御朱印": "季節の御朱印",
  "春の御朱印": "季節の御朱印",
  "夏の御朱印": "季節の御朱印",
  "冬の御朱印": "季節の御朱印",
  "季節の御朱印": "季節の御朱印",

  // 札関連
  "神社木札": "木札",
  "木札": "木札",
  "木札（大）": "木札(大)",
  "木札(大)": "木札(大)",
  "神社紙札": "神社紙札",
  "紙札セット": "神札セット",
  "神札セット": "神札セット",
  "神社切札": "切札",
  "切札": "切札",
  "竈札": "竈札",
  "商売繁盛紙札": "商売繁盛札",
  "商売繁盛札": "商売繁盛札",
  "厄災除守護紙札": "厄除守護札",
  "厄除守護札": "厄除守護札",
  "神宮大麻": "神宮大麻",
  "四角札": "四角札",
  "お札立て": "御札立",
  "御札立": "御札立",
  "晦日祓": "みそか祓い",
  "みそか祓い": "みそか祓い",
  "歳神様": "清瀧歳神様",
  "清瀧歳神様": "清瀧歳神様",

  // お守り関連
  "波紋御守": "御守(波紋)",
  "御守(波紋)": "御守(波紋)",
  "御守（波紋）": "御守(波紋)",
  "波紋御守（小）": "波紋御守（小）",
  "波紋御守(小)": "波紋御守（小）",
  "清瀧御守": "清瀧御守",
  "足御守": "足御守",
  "必勝安全御守": "必勝安全御守",
  "白御守": "白御守",
  "健康御守": "健康守",
  "健康守": "健康守",
  "白肌守": "白肌",
  "白肌": "白肌",
  "御守（紫）": "御守(紫)",
  "御守(紫)": "御守(紫)",
  "学業成就御守": "学業成就御守",
  "合格御守": "合格祈願御守",
  "合格祈願御守": "合格祈願御守",
  "大祓カード御守": "大祓カード御守",
  "開運厄除カード御守": "開運・厄除カード",
  "開運・厄除カード": "開運・厄除カード",
  "子授け守": "子授御守",
  "子授御守": "子授御守",
  "安産子宝御守": "安産子宝御守",
  "厄除御守": "厄除御守",
  "方位除御守": "方位除御守",
  "病気平癒御守": "病気平癒守",
  "病気平癒守": "病気平癒守",
  "仕事御守": "仕事守",
  "仕事守": "仕事守",
  "勝守": "勝守",
  "交通安全御守（大）": "交通安全大（青）",
  "交通安全御守(大)": "交通安全大（青）",
  "交通安全大（青）": "交通安全大（青）",
  "交通安全鈴御守": "交通安全(鈴付･青)",
  "交通安全(鈴付･青)": "交通安全(鈴付･青)",
  "交通安全和紙御守": "交通安全和紙御守",
  "交通安全ステッカー": "交通安全ステッカー",
  "旅行安全御守": "旅行安全",
  "旅行安全": "旅行安全",
  "絆御守": "潜水艦(絆）",
  "潜水艦(絆）": "潜水艦(絆）",
  "潜水艦（絆）": "潜水艦(絆）",
  "絆御守（隊員用）": "絆守（隊員用）",
  "絆守（隊員用）": "絆守（隊員用）",

  // 縁起物関連
  "絵馬": "新清瀧絵馬",
  "新清瀧絵馬": "新清瀧絵馬",
  "七五三 絵馬": "七五三絵馬",
  "七五三絵馬": "七五三絵馬",
  "千歳飴": "千歳飴",
  "干支クリスタル": "干支クリスタル",
  "特大鏑矢": "特大鏑矢",
  "鏑矢": "鏑矢",
  "破魔矢": "破魔矢",
  "破魔矢（カラフル）": "破魔矢（カラフル）",
  "破魔矢(カラフル)": "破魔矢（カラフル）",
  "卓上鏑矢": "卓上鏑矢",
  "よりそい干支土鈴": "土鈴",
  "土鈴": "土鈴",
  "福俵": "福俵",
  "熊手（大）": "熊手（新型）",
  "熊手(大)": "熊手（新型）",
  "熊手（新型）": "熊手（新型）",
  "熊手（中）": "熊手（中型）",
  "熊手(中)": "熊手（中型）",
  "熊手（中型）": "熊手（中型）",
  "熊手（小）": "熊手（小）台付",
  "熊手(小)": "熊手（小）台付",
  "熊手（小）台付": "熊手（小）台付",

  // おみくじ関連
  "おみくじ": "おみくじ",
  "夢みくじ": "夢みくじ",
  "扇子おみくじ": "扇子おみくじ",
  "開運・招福おみくじ": "開運おみくじ",
  "開運おみくじ": "開運おみくじ",

  // 御朱印関連
  "御朱印": "御朱印",
  "限定御朱印": "限定御朱印",
  "御朱印帳": "御朱印帳"
};

// ==========================================
// アプリケーション状態管理 (State)
// ==========================================
const state = {
  items: [],
  cart: [],
  transactions: [],
  dashboard: {
    rangeTransactions: [],
    trendChart: null,
    categoryChart: null,
    activeRange: 'week', // 'week' | 'month' | 'year' | 'all' | 'custom'
    alertThreshold: 10,
    customStart: '',
    customEnd: '',
    statsRange: 'week', // 'week' | 'month' | 'year' | 'all' | 'custom'
    statsCustomStart: '',
    statsCustomEnd: ''
  },
  currentTab: 'dashboard', // 初期タブをダッシュボードに変更
  selectedCategory: 'all',
  searchQuery: '',
  selectedDate: '',
  isUsingMock: false,
  cancelTargetTxId: null,
  isCheckingOut: false, // 2重会計防止用ガードフラグ
  
  // 報告書書式設定
  reportFormat: 'submission', // 'submission' (提出用B5) | 'standard' (通常A4)
  lastReportData: null,
  
  gridCols: 2,
  pinchCooldown: false,
  pendingAddImage: null
};

// ==========================================
// DOM要素の取得
// ==========================================
const DOM = {
  currentDate: document.getElementById('current-date'),
  btnSync: document.getElementById('btn-sync'),
  tabs: {
    dashboard: document.getElementById('tab-dashboard'),
    register: document.getElementById('tab-register'),
    history: document.getElementById('tab-history'),
    report: document.getElementById('tab-report'),
    master: document.getElementById('tab-master')
  },
  panels: {
    dashboard: document.getElementById('panel-dashboard'),
    register: document.getElementById('panel-register'),
    history: document.getElementById('panel-history'),
    report: document.getElementById('panel-report'),
    master: document.getElementById('panel-master')
  },
  // レジ画面
  searchInput: document.getElementById('search-input'),
  categoryBtns: document.querySelectorAll('.category-btn'),
  itemsGrid: document.getElementById('items-grid'),
  cartItemsList: document.getElementById('cart-items-list'),
  cartTotalPrice: document.getElementById('cart-total-price'),
  cashReceived: document.getElementById('cash-received'),
  cartChangeAmount: document.getElementById('cart-change-amount'),
  btnCheckout: document.getElementById('btn-checkout'),
  
  // カラム数調整ボタン
  colsBtns: document.querySelectorAll('#panel-register .col-ctrl-btn'),
  masterColsBtns: document.querySelectorAll('#master-cols-controller .col-ctrl-btn'),
  
  // スマホ用カート
  mobileCartBar: document.getElementById('mobile-cart-bar'),
  mobileCartCount: document.getElementById('mobile-cart-count'),
  mobileCartTotal: document.getElementById('mobile-cart-total'),
  mobileCartSheet: document.getElementById('mobile-cart-sheet'),
  mobileCartBackdrop: document.getElementById('mobile-cart-backdrop'),
  btnCloseMobileCart: document.getElementById('btn-close-mobile-cart'),
  mobileCartItemsListContainer: document.getElementById('mobile-cart-items-list-container'),
  mobileCartSummaryContainer: document.getElementById('mobile-cart-summary-container'),
  
  // 詳細ポップアップ
  modalItemDetail: document.getElementById('modal-item-detail'),
  btnCloseDetailModal: document.getElementById('btn-close-detail-modal'),
  detailModalImg: document.getElementById('detail-modal-img'),
  detailModalName: document.getElementById('detail-modal-name'),
  detailModalPrice: document.getElementById('detail-modal-price'),
  detailModalDesc: document.getElementById('detail-modal-desc'),
  detailModalRemark: document.getElementById('detail-modal-remark'),
  detailModalStock: document.getElementById('detail-modal-stock'),
  detailModalQty: document.getElementById('detail-modal-qty'),
  btnDetailModalAdd: document.getElementById('btn-detail-modal-add'),

  // 履歴
  historyTableBody: document.getElementById('history-table-body'),
  btnRefreshHistory: document.getElementById('btn-refresh-history'),
  historyGroupSelect: document.getElementById('history-group-select'),
  
  // 報告書
  reportDate: document.getElementById('report-date'),
  btnGenerateReport: document.getElementById('btn-generate-report'),
  btnPrintReport: document.getElementById('btn-print-report'),
  reportSheetView: document.getElementById('report-sheet-view'),
  btnFormatSubmission: document.getElementById('btn-format-submission'),
  btnFormatStandard: document.getElementById('btn-format-standard'),
  containerIncludeItems: document.getElementById('container-include-items'),
  
  // マスタ画面
  masterGrid: document.getElementById('master-grid'),
  btnShowAddItem: document.getElementById('btn-show-add-item'),
  masterViewModeToggle: document.getElementById('master-view-mode-toggle'),
  btnViewCard: document.getElementById('btn-view-card'),
  btnViewList: document.getElementById('btn-view-list'),
  masterListContainer: document.getElementById('master-list-container'),
  masterListBody: document.getElementById('master-list-body'),
  
  // 新規追加モーダル
  modalAddItem: document.getElementById('modal-add-item'),
  formAddItem: document.getElementById('form-add-item'),
  btnCloseAddModal: document.getElementById('btn-close-add-modal'),
  addItemDropzone: document.getElementById('add-item-dropzone'),
  addItemFile: document.getElementById('add-item-file'),
  addItemImagePreview: document.getElementById('add-item-image-preview'),

  // モーダル
  modalCheckoutSuccess: document.getElementById('modal-checkout-success'),
  modalChangeText: document.getElementById('modal-change-text'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  
  modalCancelConfirm: document.getElementById('modal-cancel-confirm'),
  cancelTargetTxIdText: document.getElementById('cancel-target-txid'),
  btnCancelConfirmNo: document.getElementById('btn-cancel-confirm-no'),
  btnCancelConfirmYes: document.getElementById('btn-cancel-confirm-yes'),
  
  toastContainer: document.getElementById('toast-container'),
  
  // 特殊おつりキーパッド
  btnExactAmount: document.getElementById('btn-exact-amount'),
  
  // 職員共有連絡メモ帳
  drawerMemo: document.getElementById('shared-memo-drawer'),
  btnToggleMemo: document.getElementById('btn-toggle-memo'),
  btnSyncMemo: document.getElementById('btn-sync-memo'),
  memoInput: document.getElementById('shared-memo-input'),
  memoStatus: document.getElementById('memo-status'),
  
  // ネットワーク状態
  networkStatus: document.getElementById('network-status')
};

// ==========================================
// 初期化
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupDateTime();
  setupEventListeners();
  loadGridColsSetting();
  loadMasterData();
  initMemoControl();
  restoreCartState(); // ページ読み込み時にカート状態とお預かり金額を復元
  if (state.transactions.length === 0) {
    state.transactions = getMockTransactions(); // 動作確認用の美しい過去履歴を初期セット
  }
  setupOfflineMonitoring();
  syncOfflineTransactions();
});

function setupDateTime() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  DOM.currentDate.textContent = now.toLocaleDateString('ja-JP', options);
  
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  state.selectedDate = `${yyyy}-${mm}-${dd}`;
  DOM.reportDate.value = state.selectedDate;
}

// ==========================================
// ユーティリティ: Googleドライブ共有リンクの安定化
// ==========================================
function formatGoogleDriveUrl(url) {
  if (!url) return '';
  
  const match = url.match(/(?:id=|\/d\/|src=)([a-zA-Z0-9_-]{25,})/);
  if (match && (url.includes('google.com') || url.includes('drive.google'))) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

// ユーティリティ: <ruby>タグ生成ヘルパー
function getRubyName(name, furigana) {
  if (!furigana || furigana === name) {
    return name;
  }
  return `<ruby>${name}<rt>${furigana}</rt></ruby>`;
}

// ユーティリティ: 数量オプションの生成
function generateQtyOptions(stock) {
  const maxQty = Math.min(stock, 100);
  let options = [];
  
  for (let i = 1; i <= Math.min(maxQty, 10); i++) {
    options.push(i);
  }
  for (let i = 20; i <= maxQty; i += 10) {
    options.push(i);
  }
  if (maxQty > 10 && maxQty % 10 !== 0 && !options.includes(maxQty)) {
    options.push(maxQty);
  }
  
  return options;
}

// ==========================================
// カート状態のローカルストレージ永続化
// ==========================================
function saveCartState() {
  localStorage.setItem('regi_cart', JSON.stringify(state.cart));
}

function saveCashState() {
  localStorage.setItem('regi_cash_received', DOM.cashReceived.value);
}

function clearCartState() {
  localStorage.removeItem('regi_cart');
  localStorage.removeItem('regi_cash_received');
}

function restoreCartState() {
  const savedCart = localStorage.getItem('regi_cart');
  if (savedCart) {
    try {
      state.cart = JSON.parse(savedCart);
      updateCartUI();
    } catch (e) {
      console.error('Failed to parse restored cart:', e);
    }
  }
  const savedCash = localStorage.getItem('regi_cash_received');
  if (savedCash) {
    DOM.cashReceived.value = savedCash;
    calculateChange();
  }
}

// ==========================================
// カラム調整＆ローカルストレージ
// ==========================================
function loadGridColsSetting() {
  const savedCols = localStorage.getItem('regi_grid_cols');
  if (savedCols) {
    state.gridCols = parseInt(savedCols) || 2;
  }
  updateGridColsUI();
}

function updateGridColsUI() {
  DOM.itemsGrid.className = `items-grid cols-${state.gridCols}`;
  DOM.masterGrid.className = `items-grid cols-${state.gridCols}`;
  
  DOM.colsBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.cols) === state.gridCols);
  });
  
  DOM.masterColsBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.cols) === state.gridCols);
  });
  
  localStorage.setItem('regi_grid_cols', state.gridCols);
}

// ==========================================
// タッチジェスチャー（ピンチイン・アウト：最大8列）
// ==========================================
let touchStartDistance = 0;
function handleTouchStart(e) {
  if (e.touches.length === 2) {
    touchStartDistance = Math.hypot(
      e.touches[0].pageX - e.touches[1].pageX,
      e.touches[0].pageY - e.touches[1].pageY
    );
  }
}

function handleTouchMove(e) {
  if (e.touches.length === 2 && touchStartDistance > 0 && !state.pinchCooldown) {
    const currentDistance = Math.hypot(
      e.touches[0].pageX - e.touches[1].pageX,
      e.touches[0].pageY - e.touches[1].pageY
    );
    
    const ratio = currentDistance / touchStartDistance;
    
    if (ratio > 1.35) {
      if (state.gridCols > 1) {
        state.gridCols--;
        updateGridColsUI();
        triggerPinchCooldown();
      }
    }
    else if (ratio < 0.70) {
      if (state.gridCols < 8) {
        state.gridCols++;
        updateGridColsUI();
        triggerPinchCooldown();
      }
    }
  }
}

function handleTouchEnd(e) {
  if (e.touches.length < 2) {
    touchStartDistance = 0;
  }
}

function triggerPinchCooldown() {
  state.pinchCooldown = true;
  setTimeout(() => {
    state.pinchCooldown = false;
  }, 400);
}

// ==========================================
// イベントリスナーのセットアップ
// ==========================================
function setupEventListeners() {
  Object.keys(DOM.tabs).forEach(tabKey => {
    DOM.tabs[tabKey].addEventListener('click', () => switchTab(tabKey));
  });

  DOM.btnSync.addEventListener('click', async () => {
    await syncOfflineTransactions();
    loadMasterData(true);
    syncMemoFromGAS(true);
  });

  DOM.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderItems();
  });

  DOM.categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      DOM.categoryBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.selectedCategory = e.target.dataset.category;
      renderItems();
    });
  });

  DOM.colsBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.gridCols = parseInt(btn.dataset.cols) || 2;
      updateGridColsUI();
    });
  });

  DOM.masterColsBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.gridCols = parseInt(btn.dataset.cols) || 2;
      updateGridColsUI();
    });
  });

  // マスタ表示形式切り替えイベントの登録
  if (DOM.btnViewCard && DOM.btnViewList) {
    // 初期表示設定
    state.masterViewMode = localStorage.getItem('regi_master_view_mode') || 'card';
    updateMasterViewModeUI();

    DOM.btnViewCard.addEventListener('click', () => {
      state.masterViewMode = 'card';
      localStorage.setItem('regi_master_view_mode', 'card');
      updateMasterViewModeUI();
      renderMasterGrid();
    });

    DOM.btnViewList.addEventListener('click', () => {
      state.masterViewMode = 'list';
      localStorage.setItem('regi_master_view_mode', 'list');
      updateMasterViewModeUI();
      renderMasterGrid();
    });
  }

  DOM.itemsGrid.addEventListener('touchstart', handleTouchStart, { passive: true });
  DOM.itemsGrid.addEventListener('touchmove', handleTouchMove, { passive: true });
  DOM.itemsGrid.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  DOM.masterGrid.addEventListener('touchstart', handleTouchStart, { passive: true });
  DOM.masterGrid.addEventListener('touchmove', handleTouchMove, { passive: true });
  DOM.masterGrid.addEventListener('touchend', handleTouchEnd, { passive: true });

  DOM.cashReceived.addEventListener('input', calculateChange);
  
  // デスクトップ用・全金種加算おつりキーパッド制御
  const keypad = document.querySelector('.change-presets-container');
  if (keypad) {
    keypad.addEventListener('click', (e) => {
      const btn = e.target.closest('.preset-btn');
      if (!btn) return;
      
      const val = parseInt(btn.dataset.value);
      if (!isNaN(val)) {
        const cur = parseInt(DOM.cashReceived.value) || 0;
        DOM.cashReceived.value = cur + val;
        calculateChange();
      }
    });
  }

  DOM.btnExactAmount.addEventListener('click', () => {
    DOM.cashReceived.value = getCartTotal();
    calculateChange();
  });

  document.getElementById('btn-clear-amount').addEventListener('click', () => {
    DOM.cashReceived.value = '';
    calculateChange();
  });

  DOM.btnCheckout.addEventListener('click', processCheckout);

  DOM.btnCloseModal.addEventListener('click', () => {
    DOM.modalCheckoutSuccess.style.display = 'none';
    clearCart();
  });

  DOM.btnCloseDetailModal.addEventListener('click', () => {
    DOM.modalItemDetail.style.display = 'none';
  });
  
  DOM.btnDetailModalAdd.addEventListener('click', () => {
    const itemId = DOM.btnDetailModalAdd.dataset.itemId;
    const item = state.items.find(i => i.id === itemId);
    const qty = parseInt(DOM.detailModalQty.value) || 1;
    if (item) {
      addToCart(item, qty);
      DOM.modalItemDetail.style.display = 'none';
    }
  });

  // 写真詳細モーダル内のハイブリッド数量ステッパー制御
  document.getElementById('btn-detail-minus').addEventListener('click', () => {
    const select = DOM.detailModalQty;
    if (select.selectedIndex > 0) {
      select.selectedIndex--;
      const event = new Event('change');
      select.dispatchEvent(event);
    }
  });
  
  document.getElementById('btn-detail-plus').addEventListener('click', () => {
    const select = DOM.detailModalQty;
    if (select.selectedIndex < select.options.length - 1) {
      select.selectedIndex++;
      const event = new Event('change');
      select.dispatchEvent(event);
    }
  });

  DOM.btnCancelConfirmNo.addEventListener('click', () => {
    DOM.modalCancelConfirm.style.display = 'none';
    state.cancelTargetTxId = null;
  });

  DOM.btnCancelConfirmYes.addEventListener('click', executeCancelTransaction);

  DOM.btnRefreshHistory.addEventListener('click', fetchTransactions);
  if (DOM.historyGroupSelect) {
    DOM.historyGroupSelect.addEventListener('change', () => {
      renderHistoryTable();
    });
  }

  // 報告書式切り替え
  if (DOM.btnFormatSubmission && DOM.btnFormatStandard) {
    // 初期状態の表示制御
    if (DOM.containerIncludeItems) {
      DOM.containerIncludeItems.style.display = state.reportFormat === 'submission' ? 'none' : 'flex';
    }

    DOM.btnFormatSubmission.addEventListener('click', () => {
      state.reportFormat = 'submission';
      DOM.btnFormatSubmission.classList.add('active');
      DOM.btnFormatStandard.classList.remove('active');
      if (DOM.containerIncludeItems) DOM.containerIncludeItems.style.display = 'none';
      if (state.lastReportData) renderDailyReportView(state.lastReportData);
    });

    DOM.btnFormatStandard.addEventListener('click', () => {
      state.reportFormat = 'standard';
      DOM.btnFormatStandard.classList.add('active');
      DOM.btnFormatSubmission.classList.remove('active');
      if (DOM.containerIncludeItems) DOM.containerIncludeItems.style.display = 'flex';
      if (state.lastReportData) renderDailyReportView(state.lastReportData);
    });
  }

  DOM.btnGenerateReport.addEventListener('click', generateDailyReport);
  
  let savedDocTitle = document.title;
  window.addEventListener('beforeprint', () => {
    savedDocTitle = document.title;
    document.title = ''; // ブラウザの標準ヘッダー（タイトル/URL）を完全消去
  });
  window.addEventListener('afterprint', () => {
    document.title = savedDocTitle || '神社 授与品レジ・日次報告システム';
  });

  DOM.btnPrintReport.addEventListener('click', () => {
    // 印刷用紙サイズ（B5/A4）のクラスをbodyに付与して印刷ダイアログを起動
    document.body.classList.toggle('print-format-b5', state.reportFormat === 'submission');
    document.body.classList.toggle('print-format-standard', state.reportFormat === 'standard');
    
    // タイトルを一時的に空にしてURL・システム名のヘッダー印字を防ぐ
    document.title = '';
    window.print();
    setTimeout(() => {
      document.title = savedDocTitle || '神社 授与品レジ・日次報告システム';
    }, 1000);
  });
  DOM.reportDate.addEventListener('change', (e) => {
    state.selectedDate = e.target.value;
  });

  DOM.mobileCartBar.addEventListener('click', openMobileCart);
  DOM.btnCloseMobileCart.addEventListener('click', closeMobileCart);
  DOM.mobileCartBackdrop.addEventListener('click', closeMobileCart);

  DOM.btnShowAddItem.addEventListener('click', () => {
    resetAddItemForm();
    DOM.modalAddItem.style.display = 'flex';
  });
  
  DOM.btnCloseAddModal.addEventListener('click', () => {
    DOM.modalAddItem.style.display = 'none';
  });
  
  DOM.formAddItem.addEventListener('submit', handleAddItemSubmit);

  setupDragAndDrop(DOM.addItemDropzone, DOM.addItemFile, DOM.addItemImagePreview, (fileData) => {
    state.pendingAddImage = fileData;
  });
}

// Drag & Drop
function setupDragAndDrop(dropzone, fileInput, previewImg, callback) {
  dropzone.addEventListener('click', () => fileInput.click());
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0], previewImg, callback);
    }
  });
  
  fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length > 0) {
      handleImageFile(fileInput.files[0], previewImg, callback);
    }
  });

  // ダッシュボード・コントロール関連のイベント設定
  const btnWeek = document.getElementById('btn-chart-week');
  const btnMonth = document.getElementById('btn-chart-month');
  const btnYear = document.getElementById('btn-chart-year');
  const btnAll = document.getElementById('btn-chart-all');
  const btnCustom = document.getElementById('btn-chart-custom');
  const customInputs = document.getElementById('custom-range-inputs');
  const btnApplyCustom = document.getElementById('btn-apply-custom-range');
  
  const inputStart = document.getElementById('input-custom-start');
  const inputEnd = document.getElementById('input-custom-end');
  
  function setRangeActiveButton(activeBtn) {
    [btnWeek, btnMonth, btnYear, btnAll, btnCustom].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    if (activeBtn) activeBtn.classList.add('active');
    
    // 期間指定カレンダーの表示制御
    if (customInputs) {
      customInputs.style.display = (activeBtn === btnCustom) ? 'flex' : 'none';
    }
  }

  if (btnWeek && btnMonth && btnYear && btnAll && btnCustom) {
    btnWeek.addEventListener('click', () => {
      setRangeActiveButton(btnWeek);
      state.dashboard.activeRange = 'week';
      loadDashboardData(); // 週間のデータ範囲で読み込み直す
    });
    btnMonth.addEventListener('click', () => {
      setRangeActiveButton(btnMonth);
      state.dashboard.activeRange = 'month';
      loadDashboardData(); // 月間のデータ範囲で読み込み直す
    });
    btnYear.addEventListener('click', () => {
      setRangeActiveButton(btnYear);
      state.dashboard.activeRange = 'year';
      loadDashboardData(); // 年間のデータ範囲で読み込み直す
    });
    btnAll.addEventListener('click', () => {
      setRangeActiveButton(btnAll);
      state.dashboard.activeRange = 'all';
      loadDashboardData(); // 全期間のデータを読み込む
    });
    btnCustom.addEventListener('click', () => {
      setRangeActiveButton(btnCustom);
      state.dashboard.activeRange = 'custom';
      
      // カレンダーの初期値（今日〜30日前）をセット
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      if (inputStart && !inputStart.value) {
        inputStart.value = getJstDateString(thirtyDaysAgo);
      }
      if (inputEnd && !inputEnd.value) {
        inputEnd.value = getJstDateString(today);
      }
      
      state.dashboard.customStart = inputStart.value;
      state.dashboard.customEnd = inputEnd.value;
      loadDashboardData();
    });

    if (btnApplyCustom && inputStart && inputEnd) {
      btnApplyCustom.addEventListener('click', () => {
        if (!inputStart.value || !inputEnd.value) {
          showToast('開始日と終了日を両方指定してください。', 'error');
          return;
        }
        if (inputStart.value > inputEnd.value) {
          showToast('開始日は終了日より前の日付にしてください。', 'error');
          return;
        }
        state.dashboard.customStart = inputStart.value;
        state.dashboard.customEnd = inputEnd.value;
        loadDashboardData();
      });
    }
  }

  // 在庫しきい値の動的変更イベント
  const inputThreshold = document.getElementById('input-alert-threshold');
  if (inputThreshold) {
    inputThreshold.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      state.dashboard.alertThreshold = isNaN(val) ? 0 : Math.max(0, val);
      renderDashboard(); // ダッシュボードを再描画して在庫警告リストを動的に更新
    });
  }

  // 統計カード独自の期間指定イベント設定
  const btnStatsWeek = document.getElementById('btn-stats-week');
  const btnStatsMonth = document.getElementById('btn-stats-month');
  const btnStatsYear = document.getElementById('btn-stats-year');
  const btnStatsAll = document.getElementById('btn-stats-all');
  const btnStatsCustom = document.getElementById('btn-stats-custom');
  const statsCustomInputs = document.getElementById('stats-range-inputs');
  const btnApplyStats = document.getElementById('btn-apply-stats-range');
  
  const inputStatsStart = document.getElementById('input-stats-start');
  const inputStatsEnd = document.getElementById('input-stats-end');
  
  function setStatsRangeActiveButton(activeBtn) {
    [btnStatsWeek, btnStatsMonth, btnStatsYear, btnStatsAll, btnStatsCustom].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    if (activeBtn) activeBtn.classList.add('active');
    if (statsCustomInputs) {
      statsCustomInputs.style.display = (activeBtn === btnStatsCustom) ? 'flex' : 'none';
    }
  }

  if (btnStatsWeek && btnStatsMonth && btnStatsYear && btnStatsAll && btnStatsCustom) {
    btnStatsWeek.addEventListener('click', () => {
      setStatsRangeActiveButton(btnStatsWeek);
      state.dashboard.statsRange = 'week';
      loadDashboardData();
    });
    btnStatsMonth.addEventListener('click', () => {
      setStatsRangeActiveButton(btnStatsMonth);
      state.dashboard.statsRange = 'month';
      loadDashboardData();
    });
    btnStatsYear.addEventListener('click', () => {
      setStatsRangeActiveButton(btnStatsYear);
      state.dashboard.statsRange = 'year';
      loadDashboardData();
    });
    btnStatsAll.addEventListener('click', () => {
      setStatsRangeActiveButton(btnStatsAll);
      state.dashboard.statsRange = 'all';
      loadDashboardData();
    });
    btnStatsCustom.addEventListener('click', () => {
      setStatsRangeActiveButton(btnStatsCustom);
      state.dashboard.statsRange = 'custom';
      
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      if (inputStatsStart && !inputStatsStart.value) {
        inputStatsStart.value = getJstDateString(thirtyDaysAgo);
      }
      if (inputStatsEnd && !inputStatsEnd.value) {
        inputStatsEnd.value = getJstDateString(today);
      }
      
      state.dashboard.statsCustomStart = inputStatsStart.value;
      state.dashboard.statsCustomEnd = inputStatsEnd.value;
      loadDashboardData();
    });

    if (btnApplyStats && inputStatsStart && inputStatsEnd) {
      btnApplyStats.addEventListener('click', () => {
        if (!inputStatsStart.value || !inputStatsEnd.value) {
          showToast('開始日と終了日を両方指定してください。', 'error');
          return;
        }
        if (inputStatsStart.value > inputStatsEnd.value) {
          showToast('開始日は終了日より前の日付にしてください。', 'error');
          return;
        }
        state.dashboard.statsCustomStart = inputStatsStart.value;
        state.dashboard.statsCustomEnd = inputStatsEnd.value;
        loadDashboardData();
      });
    }
  }

  // ダッシュボード詳細表示モーダルイベント
  const modalDetail = document.getElementById('modal-dashboard-detail');
  const btnCloseDetail = document.getElementById('btn-close-dashboard-detail');
  const btnCloseDetailFooter = document.getElementById('btn-close-dashboard-detail-footer');

  if (modalDetail && btnCloseDetail && btnCloseDetailFooter) {
    const closeFunc = () => { modalDetail.style.display = 'none'; };
    btnCloseDetail.addEventListener('click', closeFunc);
    btnCloseDetailFooter.addEventListener('click', closeFunc);
    modalDetail.addEventListener('click', (e) => {
      if (e.target === modalDetail) closeFunc();
    });
  }

  // 各カードへのクリックイベント紐付け
  const kpiCards = document.querySelectorAll('.kpi-card');
  if (kpiCards.length >= 3) {
    kpiCards[0].addEventListener('click', () => showDashboardDetail('kpi-today'));
    kpiCards[1].addEventListener('click', () => showDashboardDetail('kpi-week'));
    kpiCards[2].addEventListener('click', () => showDashboardDetail('kpi-month'));
  }

  const trendCard = document.querySelector('.dashboard-card.chart-main-card');
  if (trendCard) {
    trendCard.addEventListener('click', (e) => {
      if (e.target.closest('.chart-controls')) return;
      showDashboardDetail('trend');
    });
  }

  const pieCard = document.querySelector('.dashboard-card.chart-pie-card');
  if (pieCard) {
    pieCard.addEventListener('click', () => showDashboardDetail('category'));
  }

  const alertCard = document.querySelector('.dashboard-card.alert-card');
  if (alertCard) {
    alertCard.addEventListener('click', (e) => {
      if (e.target.closest('#input-alert-threshold')) return;
      showDashboardDetail('stock-alert');
    });
  }

  const timelineCard = document.querySelector('.dashboard-card.timeline-card');
  if (timelineCard) {
    timelineCard.addEventListener('click', () => showDashboardDetail('timeline'));
  }
}

function handleImageFile(file, previewImg, callback) {
  if (!file.type.startsWith('image/')) {
    showToast('画像ファイルを選択してください。', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.style.display = 'block';
    const children = previewImg.parentElement.children;
    for (let child of children) {
      if (child !== previewImg && child !== previewImg.parentElement.querySelector('input[type="file"]')) {
        child.style.display = 'none';
      }
    }
    callback({
      data: e.target.result,
      name: file.name
    });
  };
  reader.readAsDataURL(file);
}

// Tab Switching
function switchTab(tabKey) {
  state.currentTab = tabKey;
  
  Object.keys(DOM.tabs).forEach(key => {
    const isActive = key === tabKey;
    DOM.tabs[key].classList.toggle('active', isActive);
    DOM.tabs[key].setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  Object.keys(DOM.panels).forEach(key => {
    DOM.panels[key].classList.toggle('active', key === tabKey);
  });

  // ポーリングタイマーのクリア
  if (window.dashboardPollingTimer) {
    clearInterval(window.dashboardPollingTimer);
    window.dashboardPollingTimer = null;
  }

  if (tabKey === 'dashboard') {
    loadDashboardData();
    // 30秒（30000ms）ごとに自動でダッシュボードデータを裏でリロードする
    window.dashboardPollingTimer = setInterval(() => {
      loadDashboardData(true); // isBackground = true で呼び出す
    }, 30000);
  } else if (tabKey === 'register') {
    renderItems();
  } else if (tabKey === 'history') {
    fetchTransactions();
  } else if (tabKey === 'master') {
    renderMasterGrid();
  }
}

// Mobile Cart
function openMobileCart() {
  if (state.cart.length === 0) return;
  DOM.mobileCartSheet.classList.add('open');
  DOM.mobileCartItemsListContainer.innerHTML = DOM.cartItemsList.innerHTML;
  
  DOM.mobileCartSummaryContainer.innerHTML = `
    <div class="summary-row font-large" style="margin-bottom:0.75rem;">
      <span>合計初穂料</span>
      <span style="color:var(--color-vermilion); font-family:var(--font-serif); font-weight:700;">${getCartTotal().toLocaleString()} 円</span>
    </div>
    <div class="cash-input-group" style="margin-bottom:0.75rem;">
      <label for="cash-received-mobile">お釣り計算機能</label>
      <div class="input-with-unit">
        <input type="number" id="cash-received-mobile" class="mobile-cash-input" value="${DOM.cashReceived.value}" placeholder="0">
        <span class="unit">円</span>
      </div>
    </div>
    <div class="change-presets-container-mobile" style="margin-bottom:1rem;">
      ${document.querySelector('.change-presets-container').innerHTML}
    </div>
    <div class="summary-row change-row" style="margin-bottom:1rem;">
      <span>お釣り</span>
      <span id="cart-change-amount-mobile">${DOM.cartChangeAmount.textContent}</span>
    </div>
    <button id="btn-checkout-mobile" class="btn-primary btn-block"><i class="fa-solid fa-check"></i> 会計を確定</button>
  `;
  
  const cashInputMob = document.getElementById('cash-received-mobile');
  cashInputMob.addEventListener('input', (e) => {
    DOM.cashReceived.value = e.target.value;
    calculateChange();
    document.getElementById('cart-change-amount-mobile').textContent = DOM.cartChangeAmount.textContent;
    document.getElementById('cart-change-amount-mobile').style.color = DOM.cartChangeAmount.style.color;
  });
  
  const mobKeypad = DOM.mobileCartSummaryContainer.querySelector('.change-presets-container-mobile');
  mobKeypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    
    if (btn.id === 'btn-exact-amount') {
      DOM.cashReceived.value = getCartTotal();
    } else if (btn.id === 'btn-clear-amount') {
      DOM.cashReceived.value = '';
    } else {
      const val = parseInt(btn.dataset.value);
      if (!isNaN(val)) {
        const cur = parseInt(DOM.cashReceived.value) || 0;
        DOM.cashReceived.value = cur + val;
      }
    }
    
    calculateChange();
    cashInputMob.value = DOM.cashReceived.value;
    document.getElementById('cart-change-amount-mobile').textContent = DOM.cartChangeAmount.textContent;
    document.getElementById('cart-change-amount-mobile').style.color = DOM.cartChangeAmount.style.color;
  });
  
  document.getElementById('btn-checkout-mobile').addEventListener('click', processCheckout);
}

function closeMobileCart() {
  DOM.mobileCartSheet.classList.remove('open');
}

// ==========================================
// 職員共有連絡メモ帳ロジック (追従・自動保存・同期・フォールバック対応)
// ==========================================
function initMemoControl() {
  // 1. 開閉トグル
  DOM.btnToggleMemo.addEventListener('click', () => {
    DOM.drawerMemo.classList.toggle('open');
  });

  // 2. ローカルストレージからの下書き復元
  const savedMemo = localStorage.getItem('regi_shared_memo');
  if (savedMemo) {
    DOM.memoInput.value = savedMemo;
  }

  // 3. 入力監視＆自動保存 (Debounce: 400ms)
  let saveTimer = null;
  DOM.memoInput.addEventListener('input', (e) => {
    DOM.memoStatus.textContent = '変更を保存中...';
    DOM.memoStatus.style.color = 'var(--color-vermilion)';
    
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const text = e.target.value;
      localStorage.setItem('regi_shared_memo', text);
      DOM.memoStatus.textContent = 'ローカル保存済み';
      DOM.memoStatus.style.color = 'var(--color-text-muted)';
      
      // GASサーバーに送信
      await syncMemoToGAS(text);
    }, 400);
  });

  // 4. 手動同期ボタン
  DOM.btnSyncMemo.addEventListener('click', async () => {
    await syncMemoFromGAS(true);
  });

  // 5. 初回読み込み時にGASサーバーの最新メモを取得
  syncMemoFromGAS(false);
}

async function syncMemoToGAS(text) {
  if (state.isUsingMock || GAS_API_URL === 'YOUR_GAS_API_URL') {
    return;
  }
  try {
    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'saveMemo',
        memo: text
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      DOM.memoStatus.textContent = '共有同期 完了';
      DOM.memoStatus.style.color = 'var(--color-green)';
    } else {
      console.warn('Failed to save memo on GAS:', data.message);
    }
  } catch (err) {
    console.warn('Failed to connect to GAS to save memo:', err);
  }
}

async function syncMemoFromGAS(showToastMsg = false) {
  if (state.isUsingMock || GAS_API_URL === 'YOUR_GAS_API_URL') {
    if (showToastMsg) {
      showToast('デモモードのためローカル保存のみ有効です。', 'info');
    }
    return;
  }
  
  DOM.memoStatus.textContent = '読み込み中...';
  try {
    const res = await fetch(`${GAS_API_URL}?action=getMemo`);
    const data = await res.json();
    if (data.status === 'success') {
      DOM.memoInput.value = data.memo || '';
      localStorage.setItem('regi_shared_memo', data.memo || '');
      DOM.memoStatus.textContent = '共有同期 完了';
      DOM.memoStatus.style.color = 'var(--color-green)';
      if (showToastMsg) {
        showToast('最新の共有メモと同期しました。', 'success');
      }
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.warn('Failed to load memo from GAS:', err);
    DOM.memoStatus.textContent = 'ローカル接続中';
    DOM.memoStatus.style.color = 'var(--color-text-muted)';
    if (showToastMsg) {
      showToast('サーバーとの同期に失敗しました（ローカルに一時保存）。', 'error');
    }
  }
}

// カテゴリスペル揺れ・大文字小文字の補正関数
function normalizeCategory(rawCategory) {
  if (!rawCategory) return '';
  const clean = rawCategory.toString().toLowerCase().trim();
  if (clean === 'ofuda' || clean === 'ohuda' || clean === 'ouhda' || clean === 'o-huda') return 'ofuda';
  if (clean === 'omamori' || clean === 'omamory') return 'omamori';
  if (clean === 'goshuin' || clean === 'gosyuin') return 'goshuin';
  if (clean === 'engimono' || clean === 'enngimono') return 'engimono';
  if (clean === 'other' || clean === 'others' || clean === 'oter' || clean === 'othre' || clean === 'otehr' || clean === 'othr') return 'other';
  return clean;
}

// ==========================================
// データ通信処理 (並び順永続ソート対応)
// ==========================================
async function loadMasterData(forceReload = false) {
  if (GAS_API_URL === 'YOUR_GAS_API_URL') {
    if (!state.isUsingMock) {
      showToast('GASのAPI URLが設定されていないため、デモ用のモックデータを使用します。', 'info');
    }
    state.isUsingMock = true;
    state.items = sortItemsBySavedOrder(MOCK_ITEMS);
    renderItems();
    renderMasterGrid();
    return;
  }

  showLoader(true);
  try {
    const res = await fetch(`${GAS_API_URL}?action=getMaster`);
    const data = await res.json();
    
    if (data.status === 'success') {
      const apiItems = data.items.map(item => {
        // スペル揺れを自動補正
        let category = normalizeCategory(item.category || '');
        
        // 補正しても無効なカテゴリである場合は、自動判別フォールバックを適用
        const validCategories = ['ofuda', 'omamori', 'goshuin', 'engimono', 'other'];
        if (!category || !validCategories.includes(category)) {
          const name = item.name || '';
          if (name.includes('札') || name.includes('守札') || name.includes('大麻') || name.includes('神宮') || name.includes('祓') || name.includes('歳神')) category = 'ofuda';
          else if (name.includes('守') || name.includes('まもり') || name.includes('ステッカー')) category = 'omamori';
          else if (name.includes('朱印')) category = 'goshuin';
          else if (name.includes('絵馬') || name.includes('置物') || name.includes('矢') || name.includes('俵') || name.includes('熊手') || name.includes('土鈴')) category = 'engimono';
          else category = 'other';
        }
        let stock = Number(item.stock);
        if (isNaN(stock)) stock = 0;
        
        return { ...item, stock, category };
      });
      
      // 保存済みの並び順でソート
      state.items = sortItemsBySavedOrder(apiItems);
      
      // ローカルキャッシュに本番マスタデータを保存
      localStorage.setItem('cached_master_items', JSON.stringify(apiItems));
      
      renderItems();
      renderMasterGrid();
      if (forceReload) showToast('マスタデータをスプレッドシートと同期しました。', 'success');
      updateNetworkStatusUI(true);
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    const cachedItems = localStorage.getItem('cached_master_items');
    if (cachedItems) {
      try {
        const apiItems = JSON.parse(cachedItems);
        state.items = sortItemsBySavedOrder(apiItems);
        state.isUsingMock = false;
        
        renderItems();
        renderMasterGrid();
        showToast('接続エラーのため、ローカルキャッシュから商品データを読み込みました（オフラインモード）。', 'warning');
        updateNetworkStatusUI(false);
      } catch (parseErr) {
        console.error('Failed to parse cached items:', parseErr);
        loadMockFallback();
      }
    } else {
      loadMockFallback();
    }
  } finally {
    showLoader(false);
    if (state.currentTab === 'dashboard') {
      loadDashboardData();
    }
  }
}

function loadMockFallback() {
  showToast('接続に失敗したため、デモ用モックデータを使用します。', 'error');
  state.isUsingMock = true;
  state.items = sortItemsBySavedOrder(MOCK_ITEMS);
  renderItems();
  renderMasterGrid();
  updateNetworkStatusUI(false);
}

// 永続化された並び順にソートするヘルパー
function sortItemsBySavedOrder(itemsList) {
  const savedOrder = localStorage.getItem('regi_items_order');
  if (!savedOrder) return itemsList;
  
  try {
    const orderIds = JSON.parse(savedOrder);
    if (Array.isArray(orderIds)) {
      return [...itemsList].sort((a, b) => {
        const idxA = orderIds.indexOf(a.id);
        const idxB = orderIds.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }
  } catch (e) {
    console.error('Failed to parse saved items order:', e);
  }
  return itemsList;
}

// GASへ順序変更を送信する関数
async function saveOrderToGAS(orderIds) {
  if (state.isUsingMock || GAS_API_URL === 'YOUR_GAS_API_URL') {
    return;
  }
  try {
    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'reorderMaster',
        itemIds: orderIds
      })
    });
    const data = await res.json();
    if (data.status !== 'success') {
      console.warn('GAS order update failed:', data.message);
    }
  } catch (err) {
    console.error('Failed to sync master order with GAS:', err);
  }
}

// 会計確定
async function processCheckout() {
  // 2重会計防止ガード
  if (state.isCheckingOut) {
    console.warn("すでに会計処理が進行中のため、リクエストをガードしました。");
    return;
  }

  const total = getCartTotal();
  
  // お預かり金インプットの入力値を取得
  const cashInputVal = DOM.cashReceived.value.trim();
  let cash = 0;
  
  // 【新仕様】お預かり金欄が空欄（未入力）の場合は自動的に「ちょうど」として処理
  if (cashInputVal === '') {
    cash = total;
  } else {
    cash = parseInt(cashInputVal) || 0;
  }
  
  if (cash < total) {
    showToast('お預かり金が不足しています。', 'error');
    return;
  }

  const change = cash - total;
  const cartItemsToSend = state.cart.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));

  const now = new Date();
  const transactionId = "TX-" + now.getTime() + "-" + Math.floor(Math.random() * 1000);
  
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${yyyy}/${mm}/${dd} ${hh}:${min}:${ss}`;

  if (state.isUsingMock) {
    state.isCheckingOut = true;
    state.cart.forEach(cartItem => {
      const match = state.items.find(item => item.id === cartItem.id);
      if (match) match.stock = Math.max(0, match.stock - cartItem.quantity);
    });

    state.transactions.unshift({
      transactionId: transactionId,
      timestamp: timestamp,
      items: cartItemsToSend,
      total: total,
      status: '有効'
    });
    
    closeMobileCart();
    clearCart();
    if (change > 0) {
      showToast(`会計が完了しました。（お釣り：${change.toLocaleString()} 円）`, 'success');
    } else {
      showToast('会計が完了しました。', 'success');
    }
    renderItems();
    renderMasterGrid();
    state.isCheckingOut = false;
    return;
  }

  showLoader(true);
  state.isCheckingOut = true;

  // ボタン自体も物理的に無効化してクリック連打を完全に封じる
  if (DOM.btnCheckout) DOM.btnCheckout.disabled = true;
  const btnCheckoutMobile = document.getElementById('btn-checkout-mobile');
  if (btnCheckoutMobile) btnCheckoutMobile.disabled = true;

  try {
    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'checkout',
        items: cartItemsToSend
      })
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      state.cart.forEach(cartItem => {
        const match = state.items.find(item => item.id === cartItem.id);
        if (match) match.stock = Math.max(0, match.stock - cartItem.quantity);
      });
      closeMobileCart();
      clearCart();
      if (change > 0) {
        showToast(`会計が完了しました。（お釣り：${change.toLocaleString()} 円）`, 'success');
      } else {
        showToast('会計が完了しました。', 'success');
      }
      renderItems();
      renderMasterGrid();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    const isOffline = !navigator.onLine || err.message.includes('fetch') || err.message.includes('NetworkError');
    if (isOffline) {
      state.cart.forEach(cartItem => {
        const match = state.items.find(item => item.id === cartItem.id);
        if (match) match.stock = Math.max(0, match.stock - cartItem.quantity);
      });
      
      const localTx = {
        transactionId: transactionId,
        timestamp: timestamp,
        items: cartItemsToSend,
        total: total,
        status: '有効'
      };
      
      if (!state.transactions) state.transactions = [];
      state.transactions.unshift(localTx);
      
      const queue = JSON.parse(localStorage.getItem('offline_checkout_queue') || '[]');
      queue.push(localTx);
      localStorage.setItem('offline_checkout_queue', JSON.stringify(queue));
      
      localStorage.setItem('cached_master_items', JSON.stringify(state.items));
      
      closeMobileCart();
      clearCart();
      if (change > 0) {
        showToast(`オフライン会計を完了しました（お釣り：${change.toLocaleString()} 円 / 未同期保存）。`, 'warning');
      } else {
        showToast('オフライン会計を完了しました（未同期保存）。', 'warning');
      }
      renderItems();
      renderMasterGrid();
      updateNetworkStatusUI(false);
    } else {
      showToast(`売上登録エラー: ${err.message}`, 'error');
      if (DOM.btnCheckout) DOM.btnCheckout.disabled = false;
      if (btnCheckoutMobile) btnCheckoutMobile.disabled = false;
    }
  } finally {
    showLoader(false);
    state.isCheckingOut = false;
    // 会計が成功・またはオフライン記録された段階で、ダッシュボードの表示を裏で最新化する
    loadDashboardData(true);
  }
}

// 取引履歴
async function fetchTransactions() {
  if (state.isUsingMock) {
    renderHistoryTable();
    return;
  }

  DOM.historyTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center"><i class="fa-solid fa-circle-notch fa-spin"></i> 取引履歴を読み込み中...</td>
    </tr>
  `;

  try {
    const res = await fetch(`${GAS_API_URL}?action=getTransactions&date=${state.selectedDate}`);
    const data = await res.json();
    
    if (data.status === 'success') {
      state.transactions = data.transactions;
      renderHistoryTable();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast('取引履歴の取得に失敗しました。', 'error');
  }
}

// 取引取消
async function executeCancelTransaction() {
  const txId = state.cancelTargetTxId;
  if (!txId) return;

  if (state.isUsingMock) {
    const tx = state.transactions.find(t => t.transactionId === txId);
    if (tx && tx.status !== '取消') {
      tx.status = '取消';
      
      tx.items.forEach(txItem => {
        const match = state.items.find(item => item.id === txItem.id);
        if (match) match.stock += txItem.quantity;
      });

      showToast(`取引 ${txId} を取り消しました。`, 'success');
      DOM.modalCancelConfirm.style.display = 'none';
      state.cancelTargetTxId = null;
      renderItems();
      renderMasterGrid();
      renderHistoryTable();
      loadDashboardData(true);
    }
    return;
  }

  showLoader(true);
  try {
    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'cancelTransaction',
        transactionId: txId
      })
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      const tx = state.transactions.find(t => t.transactionId === txId);
      if (tx) {
        tx.status = '取消';
        tx.items.forEach(txItem => {
          const match = state.items.find(item => item.id === txItem.id);
          if (match) match.stock += txItem.quantity;
        });
      }
      
      showToast(`取引 ${txId} を取り消しました。`, 'success');
      DOM.modalCancelConfirm.style.display = 'none';
      state.cancelTargetTxId = null;
      renderItems();
      renderMasterGrid();
      renderHistoryTable();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast(`取引取消エラー: ${err.message}`, 'error');
  } finally {
    showLoader(false);
    loadDashboardData(true);
  }
}

// ==========================================
// レジ画面 UI描画 (双方向ドラッグ＆ドロップソート対応)
// ==========================================
function renderItems() {
  DOM.itemsGrid.innerHTML = '';
  
  const filtered = state.items.filter(item => {
    const matchesCategory = state.selectedCategory === 'all' || item.category === state.selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(state.searchQuery) || item.id.toLowerCase().includes(state.searchQuery);
    const matchesDisplay = item.display !== false;
    return matchesCategory && matchesSearch && matchesDisplay;
  });

  if (filtered.length === 0) {
    DOM.itemsGrid.innerHTML = `
      <div class="cart-empty" style="grid-column:1/-1;">
        <i class="fa-solid fa-leaf" style="color: var(--color-border); font-size: 3rem;"></i>
        <p>該当する授与品がありません。</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    const isOutOfStock = item.stock <= 0;
    card.className = `item-card ${isOutOfStock ? 'out-of-stock' : ''}`;
    card.id = `regi-card-${item.id}`;
    
    let imageHtml = `<div class="item-image-placeholder"><i class="fa-solid fa-om"></i></div>`;
    if (item.imageUrl) {
      const stableUrl = formatGoogleDriveUrl(item.imageUrl);
      imageHtml = `<img src="${stableUrl}" alt="${item.name}" class="item-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="item-image-placeholder" style="display:none;"><i class="fa-solid fa-om"></i></div>`;
    }
    
    let stockClass = '';
    if (item.stock > 0 && item.stock <= 5) stockClass = 'warning';

    let qtyOptions = '';
    const qtyList = generateQtyOptions(item.stock);
    qtyList.forEach(q => {
      qtyOptions += `<option value="${q}">${q}</option>`;
    });
    
    const rubyNameHtml = getRubyName(item.name, item.furigana);
    
    card.innerHTML = `
      <!-- ドラッググリップハンドル自体をdraggable=trueに設定 -->
      <div class="card-drag-handle" draggable="true" title="ドラッグして並び替え">
        <i class="fa-solid fa-grip-vertical"></i>
      </div>
      
      ${isOutOfStock ? '<span class="stock-badge sold-out">在庫切れ</span>' : ''}
      <div class="item-image-wrapper" id="img-wrapper-${item.id}">
        ${imageHtml}
      </div>
      <div class="item-info">
        <h3 class="item-name">${rubyNameHtml}</h3>
        <p class="item-desc">${item.description || '説明なし'}</p>
        <div class="item-price-stock">
          <span class="item-price">${item.price.toLocaleString()} 円</span>
          <span class="item-stock ${stockClass}">${isOutOfStock ? '残 0' : `残 ${item.stock}`}</span>
        </div>
        
        <div class="item-qty-selector">
          <div class="qty-stepper" style="width: 105px;">
            <button class="stepper-btn" id="btn-minus-${item.id}" ${isOutOfStock ? 'disabled' : ''}>−</button>
            <select id="qty-select-${item.id}" class="stepper-select" ${isOutOfStock ? 'disabled' : ''}>
              ${qtyOptions || '<option value="0">0</option>'}
            </select>
            <button class="stepper-btn" id="btn-plus-${item.id}" ${isOutOfStock ? 'disabled' : ''}>＋</button>
          </div>
          <button id="btn-add-${item.id}" class="btn-add-item" ${isOutOfStock ? 'disabled' : ''}>
            <i class="fa-solid fa-plus"></i> 追加
          </button>
        </div>
      </div>
    `;
    
    const dragHandle = card.querySelector('.card-drag-handle');
    
    // ドラッググリップハンドル自身に対するドラッグ開始・終了イベント
    dragHandle.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.id);
      card.classList.add('dragging');
      e.stopPropagation();
    });

    dragHandle.addEventListener('dragend', (e) => {
      card.classList.remove('dragging');
      const cards = DOM.itemsGrid.querySelectorAll('.item-card');
      cards.forEach(c => c.classList.remove('drag-over'));
      e.stopPropagation();
    });

    // 親カード要素に対するドロップ先イベント
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    card.addEventListener('dragenter', (e) => {
      e.preventDefault();
      const draggingCard = DOM.itemsGrid.querySelector('.item-card.dragging') || document.querySelector('.item-card.dragging');
      if (draggingCard && draggingCard !== card) {
        card.classList.add('drag-over');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', async (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      
      const dragSourceId = e.dataTransfer.getData('text/plain');
      if (!dragSourceId || dragSourceId === item.id) return;

      const srcIdx = state.items.findIndex(i => i.id === dragSourceId);
      const destIdx = state.items.findIndex(i => i.id === item.id);
      
      if (srcIdx !== -1 && destIdx !== -1) {
        const [movedItem] = state.items.splice(srcIdx, 1);
        state.items.splice(destIdx, 0, movedItem);
        
        const orderIds = state.items.map(i => i.id);
        localStorage.setItem('regi_items_order', JSON.stringify(orderIds));
        
        renderItems();
        renderMasterGrid();
        
        await saveOrderToGAS(orderIds);
        showToast('授与品の並び順を保存・変更しました。', 'success');
      }
    });
    
    const imgWrapper = card.querySelector(`#img-wrapper-${item.id}`);
    imgWrapper.addEventListener('click', () => {
      showItemDetailPopup(item);
    });

    if (!isOutOfStock) {
      const btnAdd = card.querySelector(`#btn-add-${item.id}`);
      const select = card.querySelector(`#qty-select-${item.id}`);
      const btnMinus = card.querySelector(`#btn-minus-${item.id}`);
      const btnPlus = card.querySelector(`#btn-plus-${item.id}`);
      
      select.addEventListener('click', (e) => e.stopPropagation());
      select.addEventListener('change', (e) => e.stopPropagation());
      
      btnMinus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (select.selectedIndex > 0) {
          select.selectedIndex--;
        }
      });
      
      btnPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (select.selectedIndex < select.options.length - 1) {
          select.selectedIndex++;
        }
      });
      
      btnAdd.addEventListener('click', (e) => {
        e.stopPropagation();
        const qty = parseInt(select.value) || 1;
        addToCart(item, qty);
      });
    }
    DOM.itemsGrid.appendChild(card);
  });
}

// カート関連
function addToCart(item, quantity = 1) {
  if (item.stock <= 0) {
    showToast('在庫切れのためカートに追加できません。', 'error');
    return;
  }
  
  const existing = state.cart.find(cartItem => cartItem.id === item.id);
  
  if (existing) {
    const totalQty = existing.quantity + quantity;
    if (totalQty > item.stock) {
      showToast(`「${item.name}」の在庫上限を超えています。`, 'error');
      return;
    }
    existing.quantity = totalQty;
  } else {
    state.cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: quantity,
      maxStock: item.stock
    });
  }
  
  updateCartUI();
  saveCartState(); // 状態を永続化
  showToast(`${item.name}をカートに追加しました。`, 'success');
}

// カートから一撃削除
window.removeFromCart = function(itemId) {
  const match = state.cart.find(item => item.id === itemId);
  if (match) {
    state.cart = state.cart.filter(item => item.id !== itemId);
    updateCartUI();
    saveCartState(); // 状態を永続化
    showToast(`${match.name}をカートから削除しました。`, 'info');
    
    if (DOM.mobileCartSheet.classList.contains('open')) {
      DOM.mobileCartItemsListContainer.innerHTML = DOM.cartItemsList.innerHTML;
      openMobileCart();
    }
  }
};

window.updateQuantity = function(itemId, change) {
  const cartItem = state.cart.find(item => item.id === itemId);
  if (!cartItem) return;

  const newQty = cartItem.quantity + change;
  if (newQty <= 0) {
    removeFromCart(itemId);
  } else {
    if (newQty > cartItem.maxStock) {
      showToast('在庫上限を超える数量は指定できません。', 'error');
      return;
    }
    cartItem.quantity = newQty;
    updateCartUI();
    saveCartState(); // 状態を永続化
    
    if (DOM.mobileCartSheet.classList.contains('open')) {
      DOM.mobileCartItemsListContainer.innerHTML = DOM.cartItemsList.innerHTML;
      openMobileCart();
    }
  }
};

function updateCartUI() {
  DOM.cartItemsList.innerHTML = '';
  
  if (state.cart.length === 0) {
    DOM.cartItemsList.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-leaf empty-icon"></i>
        <p>カートは空です。<br>個数を選んで「追加」を押してください。</p>
      </div>
    `;
    DOM.cartTotalPrice.textContent = '0 円';
    DOM.btnCheckout.disabled = true;
    DOM.cashReceived.value = '';
    calculateChange();
    DOM.mobileCartBar.style.display = 'none';
    closeMobileCart();
    return;
  }

  state.cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <span class="cart-item-name">${item.name}</span>
      <div class="cart-item-controls">
        <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
        <span class="cart-item-qty">${item.quantity}</span>
        <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
        <button class="delete-cart-item-btn" onclick="removeFromCart('${item.id}')" title="カートから削除">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      <span class="cart-item-price">${(item.price * item.quantity).toLocaleString()} 円</span>
    `;
    DOM.cartItemsList.appendChild(row);
  });

  const total = getCartTotal();
  DOM.cartTotalPrice.textContent = `${total.toLocaleString()} 円`;
  DOM.btnCheckout.disabled = false;
  
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  DOM.mobileCartCount.textContent = totalCount;
  DOM.mobileCartTotal.textContent = `${total.toLocaleString()} 円`;
  
  if (window.innerWidth <= 1024) {
    DOM.mobileCartBar.style.display = 'flex';
  } else {
    DOM.mobileCartBar.style.display = 'none';
  }
  
  calculateChange();
}

function calculateChange() {
  const total = getCartTotal();
  const cash = parseInt(DOM.cashReceived.value) || 0;
  const change = cash - total;
  
  if (cash === 0) {
    DOM.cartChangeAmount.textContent = '0 円';
    DOM.cartChangeAmount.style.color = 'var(--color-text-muted)';
  } else if (change < 0) {
    DOM.cartChangeAmount.textContent = '不足しています';
    DOM.cartChangeAmount.style.color = 'var(--color-vermilion)';
  } else {
    DOM.cartChangeAmount.textContent = `${change.toLocaleString()} 円`;
    DOM.cartChangeAmount.style.color = 'var(--color-green)';
  }
  saveCashState(); // お預かり金の入力状態を永続化
}

function clearCart() {
  state.cart = [];
  DOM.cashReceived.value = '';
  updateCartUI();
  clearCartState(); // 永続化データを消去
}

// 確認ダイアログ
window.confirmCancelTransaction = function(txId) {
  state.cancelTargetTxId = txId;
  DOM.cancelTargetTxIdText.textContent = txId;
  DOM.modalCancelConfirm.style.display = 'flex';
};

function showCheckoutSuccess(change) {
  DOM.modalChangeText.textContent = `${change.toLocaleString()} 円`;
  DOM.modalCheckoutSuccess.style.display = 'flex';
}

// ==========================================
// 写真拡大・詳細ポップアップ表示 (100拡張)
// ==========================================
function showItemDetailPopup(item) {
  DOM.detailModalName.innerHTML = getRubyName(item.name, item.furigana);
  DOM.detailModalPrice.textContent = `${item.price.toLocaleString()} 円`;
  DOM.detailModalDesc.textContent = item.description || '説明なし';
  DOM.detailModalRemark.textContent = item.remark || 'なし';
  
  const isOutOfStock = item.stock <= 0;
  DOM.detailModalStock.textContent = isOutOfStock ? '在庫切れ' : `残 ${item.stock}`;
  DOM.detailModalStock.className = `item-stock ${item.stock <= 5 && item.stock > 0 ? 'warning' : ''}`;
  
  if (item.imageUrl) {
    const stableUrl = formatGoogleDriveUrl(item.imageUrl);
    DOM.detailModalImg.src = stableUrl;
    DOM.detailModalImg.style.display = 'block';
  } else {
    DOM.detailModalImg.src = '';
    DOM.detailModalImg.style.display = 'none';
  }
  
  DOM.detailModalQty.innerHTML = '';
  const qtyList = generateQtyOptions(item.stock);
  if (isOutOfStock || qtyList.length === 0) {
    DOM.detailModalQty.innerHTML = '<option value="0">0</option>';
    DOM.btnDetailModalAdd.disabled = true;
    document.getElementById('btn-detail-minus').disabled = true;
    document.getElementById('btn-detail-plus').disabled = true;
  } else {
    qtyList.forEach(q => {
      DOM.detailModalQty.innerHTML += `<option value="${q}">${q}</option>`;
    });
    DOM.btnDetailModalAdd.disabled = false;
    document.getElementById('btn-detail-minus').disabled = false;
    document.getElementById('btn-detail-plus').disabled = false;
  }
  DOM.btnDetailModalAdd.dataset.itemId = item.id;
  DOM.modalItemDetail.style.display = 'flex';
}

// 取引履歴の動作確認用ダミーモックデータ
function getMockTransactions() {
  return [
    {
      transactionId: "TX-1784429186572-98",
      timestamp: "2026/07/19 14:46:20",
      items: [{ name: "家内安全御札", price: 1500, quantity: 1 }, { name: "交通安全お守り", price: 800, quantity: 2 }],
      total: 3100,
      status: "有効"
    },
    {
      transactionId: "TX-1784427328487-552",
      timestamp: "2026/07/19 13:08:40",
      items: [
        { name: "授与用通常御朱印", price: 500, quantity: 2 },
        { name: "交通安全お守り", price: 800, quantity: 4 }
      ],
      total: 4200,
      status: "有効"
    },
    {
      transactionId: "TX-1784370966572-884",
      timestamp: "2026/07/19 10:08:10",
      items: [{ name: "吉祥干支置物", price: 1200, quantity: 1 }],
      total: 1200,
      status: "有効"
    },
    {
      transactionId: "TX-178432321589-58",
      timestamp: "2026/07/18 10:18:41",
      items: [{ name: "厄除けお守り", price: 800, quantity: 5 }],
      total: 4000,
      status: "有効"
    },
    {
      transactionId: "TX-1784310595200-468",
      timestamp: "2026/07/18 09:59:52",
      items: [{ name: "破魔矢", price: 1500, quantity: 1 }],
      total: 1500,
      status: "有効"
    },
    {
      transactionId: "TX-1784270966500-111",
      timestamp: "2026/07/15 15:32:00",
      items: [
        { name: "家内安全御札", price: 1500, quantity: 2 },
        { name: "吉祥干支置物", price: 1200, quantity: 1 }
      ],
      total: 4200,
      status: "有効"
    },
    {
      transactionId: "TX-1783980966500-222",
      timestamp: "2026/07/08 14:15:00",
      items: [{ name: "限定金字御朱印", price: 1000, quantity: 5 }],
      total: 5000,
      status: "有効"
    },
    {
      transactionId: "TX-1783680966500-333",
      timestamp: "2026/07/02 11:20:00",
      items: [
        { name: "交通安全お守り", price: 800, quantity: 10 },
        { name: "祈願絵馬", price: 700, quantity: 5 }
      ],
      total: 11500,
      status: "有効"
    },
    {
      transactionId: "TX-1783080966500-444",
      timestamp: "2026/06/25 16:45:00",
      items: [{ name: "破魔矢", price: 1500, quantity: 2 }],
      total: 3000,
      status: "有効"
    },
    {
      transactionId: "TX-1782080966500-555",
      timestamp: "2026/06/10 10:30:00",
      items: [{ name: "御朱印帳 (和柄)", price: 2000, quantity: 3 }],
      total: 6000,
      status: "有効"
    }
  ];
}

// 日時文字列（UTCや各種形式）を端末の現地時間形式 (yyyy/MM/dd HH:mm:ss) にフォーマットするヘルパー関数
function formatLocalTimestamp(timestampStr) {
  if (!timestampStr) return '';
  
  // もし既に yyyy/MM/dd HH:mm:ss 形式（Z無し・T無し）なら、そのまま返す
  if (/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(timestampStr)) {
    return timestampStr;
  }

  try {
    let date;
    if (typeof timestampStr === 'string' && timestampStr.includes('T')) {
      date = new Date(timestampStr); // ISO 8601 形式 ("2026-07-27T21:39:32.000Z")
    } else {
      // ハイフンやスラッシュ形式の文字列をDateにパース
      const normalized = timestampStr.replace(/\//g, '-');
      date = new Date(normalized);
    }

    if (isNaN(date.getTime())) {
      return timestampStr;
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    
    return `${yyyy}/${mm}/${dd} ${hh}:${min}:${ss}`;
  } catch (e) {
    console.error("日時フォーマットエラー:", e);
    return timestampStr;
  }
}

// タイムスタンプから指定の分類キーと表示名を返す
function getTransactionGroupInfo(timestampStr, groupType) {
  // まず現地時間の標準フォーマットに変換する
  const localTimeStr = formatLocalTimestamp(timestampStr);
  // Safariや様々なブラウザエンジンとの互換性を確保するため、ハイフン区切りではなくスラッシュ区切りに統一してパースします
  const normalized = localTimeStr.replace(/-/g, '/');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) {
    return { key: 'unknown', label: 'その他分類不能' };
  }
  
  const yyyy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  
  if (groupType === 'daily') {
    const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
    const dayStr = dayLabels[d.getDay()];
    const key = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const label = `${yyyy}年${mm}月${dd}日 (${dayStr})`;
    return { key, label };
  }
  
  if (groupType === 'biweekly') {
    const startOfYear = new Date(yyyy, 0, 1);
    const msInDay = 24 * 60 * 60 * 1000;
    const daysDiff = Math.floor((d - startOfYear) / msInDay);
    
    const weekNum = Math.floor(daysDiff / 7);
    const biweekIndex = Math.floor(weekNum / 2);
    
    const biweekStart = new Date(startOfYear.getTime() + biweekIndex * 2 * 7 * msInDay);
    const biweekEnd = new Date(biweekStart.getTime() + (14 * msInDay) - 1);
    
    const key = `${yyyy}-bw-${biweekIndex}`;
    const label = `${biweekStart.getFullYear()}年 ${biweekStart.getMonth()+1}月${biweekStart.getDate()}日 〜 ${biweekEnd.getMonth()+1}月${biweekEnd.getDate()}日 (隔週分類)`;
    return { key, label };
  }
  
  if (groupType === 'bimonthly') {
    const bimonthStart = mm % 2 === 0 ? mm - 1 : mm;
    const bimonthEnd = bimonthStart + 1;
    const key = `${yyyy}-bm-${bimonthStart}`;
    const label = `${yyyy}年 ${bimonthStart}月 〜 ${bimonthEnd}月 (隔月分類)`;
    return { key, label };
  }
  
  return { key: 'unknown', label: 'その他分類' };
}

// 取引履歴描画 (日別・隔週別・隔月別 グループ分類対応 ＆ 内訳アコーディオン明細対応 ＆ グループ自体の開閉対応)
function renderHistoryTable() {
  DOM.historyTableBody.innerHTML = '';

  if (state.transactions.length === 0) {
    DOM.historyTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">取引履歴はありません。</td>
      </tr>
    `;
    return;
  }

  const groupType = DOM.historyGroupSelect ? DOM.historyGroupSelect.value : 'daily';

  // 取引データをグループ化する
  const groups = {};
  const groupOrder = [];

  state.transactions.forEach(tx => {
    const { key, label } = getTransactionGroupInfo(tx.timestamp, groupType);
    if (!groups[key]) {
      groups[key] = {
        label: label,
        txs: [],
        activeCount: 0,
        totalSales: 0
      };
      groupOrder.push(key);
    }
    groups[key].txs.push(tx);
    if (tx.status === '有効') {
      groups[key].activeCount++;
      groups[key].totalSales += tx.total;
    }
  });

  // グループ順序をソート (最新取引日付の降順)
  groupOrder.sort((a, b) => {
    const timeA = new Date(formatLocalTimestamp(groups[a].txs[0].timestamp).replace(/\//g, '-')).getTime();
    const timeB = new Date(formatLocalTimestamp(groups[b].txs[0].timestamp).replace(/\//g, '-')).getTime();
    return timeB - timeA;
  });

  groupOrder.forEach((key, idx) => {
    const grp = groups[key];
    
    // 初期状態の開閉設定：最新（0番目）グループのみ展開し、過去グループは折りたたむ
    const isInitiallyOpen = idx === 0;
    
    // 和風のグループヘッダー行を生成
    const headerRow = document.createElement('tr');
    headerRow.className = 'history-group-header';
    headerRow.id = `group-header-${key}`;
    headerRow.innerHTML = `
      <td colspan="6">
        <i class="fa-solid ${isInitiallyOpen ? 'fa-chevron-down' : 'fa-chevron-right'} group-toggle-icon" id="group-icon-${key}"></i>
        <strong>${grp.label}</strong> 
        <span style="margin-left: 1.5rem; font-weight: normal; font-size: 0.88rem; color: var(--color-text-muted);">
          有効取引: <strong>${grp.activeCount}</strong> 件 | 
          合計初穂料: <strong style="color: var(--color-vermilion); font-family: var(--font-serif);">${grp.totalSales.toLocaleString()} 円</strong>
        </span>
      </td>
    `;
    
    headerRow.addEventListener('click', () => toggleHistoryGroup(key));
    DOM.historyTableBody.appendChild(headerRow);

    // グループ内の各取引を描画
    grp.txs.forEach(tx => {
      // 通常取引行 (アコーディオン開閉トグル用クラス tx-row)
      const row = document.createElement('tr');
      row.className = `tx-row group-row-${key}`;
      row.id = `tx-row-${tx.transactionId}`;
      row.style.display = isInitiallyOpen ? 'table-row' : 'none'; // グループの開閉状態を初期反映
      
      const totalItemsCount = tx.items.reduce((sum, item) => sum + item.quantity, 0);

      // 内訳のプレビュー表示用トグルボタン
      const toggleTriggerHtml = `
        <div style="color:var(--color-green); font-weight:700; display:flex; align-items:center; justify-content:center; gap:0.35rem;">
          <span>内訳を表示 (${totalItemsCount}品)</span>
          <i class="fa-solid fa-chevron-down toggle-icon" id="icon-${tx.transactionId}"></i>
        </div>
      `;

      const isCancelled = tx.status === '取消';
      const statusClass = isCancelled ? 'cancelled' : 'active';
      
      row.innerHTML = `
        <td>${formatLocalTimestamp(tx.timestamp)}</td>
        <td style="font-family: monospace; font-size: 0.85rem;">${tx.transactionId}</td>
        <td class="toggle-trigger-cell">${toggleTriggerHtml}</td>
        <td style="font-family: var(--font-serif); font-weight:600; color:var(--color-vermilion);">${tx.total.toLocaleString()} 円</td>
        <td><span class="status-badge ${statusClass}">${tx.status}</span></td>
        <td>
          <button class="btn-cancel-tx" ${isCancelled ? 'disabled' : ''} onclick="confirmCancelTransaction('${tx.transactionId}'); event.stopPropagation();">
            <i class="fa-solid fa-trash-can"></i> 取消
          </button>
        </td>
      `;
      
      // 行全体をクリックしたときにアコーディオンを開閉する
      row.addEventListener('click', () => toggleTxDetails(tx.transactionId));
      DOM.historyTableBody.appendChild(row);

      // 詳細アコーディオン明細行 (初期非表示)
      const detailRow = document.createElement('tr');
      detailRow.className = `tx-detail-row group-row-${key}`;
      detailRow.id = `detail-${tx.transactionId}`;
      detailRow.style.display = 'none';

      let itemsTableRows = '';
      tx.items.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        itemsTableRows += `
          <tr>
            <td style="text-align:left;">${item.name}</td>
            <td style="text-align:center; color:var(--color-text-muted);">${item.price.toLocaleString()} 円</td>
            <td style="text-align:center;">${item.quantity} 体</td>
            <td style="text-align:right; font-weight:700; color:var(--color-vermilion);">${itemSubtotal.toLocaleString()} 円</td>
          </tr>
        `;
      });

      detailRow.innerHTML = `
        <td colspan="6">
          <div class="tx-detail-container">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; font-weight:700; color:#5c4e33;">
              <i class="fa-solid fa-clipboard-list" style="margin-right:0.35rem; color:var(--color-gold);"></i> 授与品内訳明細
            </h4>
            <table class="detail-mini-table">
              <thead>
                <tr>
                  <th style="text-align:left;">授与品名</th>
                  <th style="text-align:center; width:120px;">初穂料単価</th>
                  <th style="text-align:center; width:80px;">授与数</th>
                  <th style="text-align:right; width:150px;">初穂料小計</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTableRows}
              </tbody>
            </table>
          </div>
        </td>
      `;
      DOM.historyTableBody.appendChild(detailRow);
    });
  });
}

// 履歴グループのアコーディオン開閉
function toggleHistoryGroup(groupKey) {
  const iconEl = document.getElementById(`group-icon-${groupKey}`);
  const rows = DOM.historyTableBody.querySelectorAll(`.group-row-${groupKey}`);
  if (!rows.length) return;

  // 現在グループが開いているかを判断する (通常の取引行 tx-row のいずれかが none でないか)
  const isCurrentlyOpen = [...rows].some(row => row.classList.contains('tx-row') && row.style.display !== 'none');

  rows.forEach(row => {
    if (isCurrentlyOpen) {
      row.style.display = 'none'; // 閉じる時は取引行も内訳詳細もすべて非表示
    } else {
      // 開く時は通常の取引行 (tx-row) のみ表示する (個別内訳は閉じたまま)
      if (row.classList.contains('tx-row')) {
        row.style.display = 'table-row';
      }
    }
  });

  if (iconEl) {
    iconEl.classList.toggle('fa-chevron-down', !isCurrentlyOpen);
    iconEl.classList.toggle('fa-chevron-right', isCurrentlyOpen);
  }
}

// 個別アコーディオンの開閉トグル
function toggleTxDetails(txId) {
  const detailEl = document.getElementById(`detail-${txId}`);
  const iconEl = document.getElementById(`icon-${txId}`);
  if (!detailEl) return;

  const isOpen = detailEl.style.display !== 'none';
  if (isOpen) {
    detailEl.style.display = 'none';
    if (iconEl) iconEl.classList.remove('open');
  } else {
    detailEl.style.display = 'table-row';
    if (iconEl) iconEl.classList.add('open');
  }
}

// 一括アコーディオン開閉 (グループ＆個別詳細の両方を完全連動トグル)
function toggleAllTxDetails(open) {
  // 1. 個別取引内訳の一括開閉
  const detailRows = DOM.historyTableBody.querySelectorAll('.tx-detail-row');
  const icons = DOM.historyTableBody.querySelectorAll('.toggle-icon');
  
  detailRows.forEach(row => {
    row.style.display = open ? 'table-row' : 'none';
  });
  
  icons.forEach(icon => {
    icon.classList.toggle('open', open);
  });

  // 2. 期間グループの一括開閉
  const groupHeaders = DOM.historyTableBody.querySelectorAll('.history-group-header');
  groupHeaders.forEach(header => {
    const key = header.id.replace('group-header-', '');
    const rows = DOM.historyTableBody.querySelectorAll(`.group-row-${key}`);
    const groupIcon = document.getElementById(`group-icon-${key}`);
    
    rows.forEach(row => {
      if (open) {
        if (row.classList.contains('tx-row')) {
          row.style.display = 'table-row';
        }
      } else {
        row.style.display = 'none';
      }
    });

    if (groupIcon) {
      groupIcon.classList.toggle('fa-chevron-down', open);
      groupIcon.classList.toggle('fa-chevron-right', !open);
    }
  });
}

// グローバル関数への露出
window.toggleHistoryGroup = toggleHistoryGroup;
window.toggleTxDetails = toggleTxDetails;
window.toggleAllTxDetails = toggleAllTxDetails;

// 日次報告書 (社入表記への統一 ＆ 押印欄の削除)
async function generateDailyReport() {
  if (!state.selectedDate) {
    showToast('日付を選択してください。', 'error');
    return;
  }

  showLoader(true);
  DOM.reportSheetView.innerHTML = `
    <div class="loading-spinner">
      <i class="fa-solid fa-circle-notch fa-spin"></i> 社入・ご祈祷データを集計中...
    </div>
  `;

  if (state.isUsingMock) {
    setTimeout(() => {
      const reportDate = state.selectedDate;
      
      // MOCK_PRAYERSに該当日のデータがなければ動的自動生成する（日付変更テストでも二度と0件・0円にならないようにする）
      let prayers = MOCK_PRAYERS[reportDate];
      if (!prayers) {
        const dateObj = new Date(reportDate.replace(/-/g, '/'));
        const day = dateObj.getDate() || 1;
        const dayOfWeek = dateObj.getDay();
        
        let countSafety = 1;
        let countBaby = 0;
        let countCompany = 0;
        
        if (dayOfWeek === 0 || dayOfWeek === 6) { // 土日は多め
          countSafety = (day % 3) + 2; 
          countBaby = (day % 2) + 1;   
          if (day % 3 === 0) countCompany = 1;
        } else { // 平日
          countSafety = (day % 2) + 1; 
          countBaby = day % 2;         
        }
        
        prayers = [];
        if (countSafety > 0) prayers.push({ type: '個人祈祷 (家内安全)', count: countSafety, amount: countSafety * 5000 });
        if (countBaby > 0) prayers.push({ type: '個人祈祷 (初宮詣)', count: countBaby, amount: countBaby * 10000 });
        if (countCompany > 0) prayers.push({ type: '会社・団体祈祷', count: countCompany, amount: countCompany * 20000 });
      }
      
      const prayerSalesTotal = prayers.reduce((sum, p) => sum + p.amount, 0);
      const prayerCount = prayers.reduce((sum, p) => sum + p.count, 0);
      
      const validTx = state.transactions.filter(t => t.status === '有効');
      let itemSalesTotal = 0;
      const itemDetails = {};

      validTx.forEach(tx => {
        itemSalesTotal += tx.total; // 単純モック計算
        tx.items.forEach(item => {
          if (!itemDetails[item.name]) {
            itemDetails[item.name] = { quantity: 0, amount: 0 };
          }
          itemDetails[item.name].quantity += item.quantity;
          itemDetails[item.name].amount += item.price * item.quantity;
        });
      });
      
      const mockResult = {
        date: reportDate,
        itemSalesTotal: itemSalesTotal,
        itemDetails: itemDetails,
        prayerSalesTotal: prayerSalesTotal,
        prayerCount: prayerCount,
        prayerDetails: prayers.reduce((acc, p) => {
          acc[p.type] = { count: p.count, amount: p.amount };
          return acc;
        }, {}),
        grandTotal: itemSalesTotal + prayerSalesTotal
      };
      renderDailyReportView(mockResult);
      DOM.btnPrintReport.disabled = false;
      showLoader(false);
    }, 1000);
    return;
  }

  try {
    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'dailyReport',
        date: state.selectedDate
      })
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      renderDailyReportView(data);
      DOM.btnPrintReport.disabled = false;
      showToast('日次データをスプレッドシートへ同期しました。', 'success');
      
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast(`報告書集計エラー: ${err.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

function renderDailyReportView(data) {
  state.lastReportData = data;
  if (state.reportFormat === 'submission') {
    renderB5SubmissionReportView(data);
  } else {
    renderStandardDailyReportView(data);
  }
}

// 提出用指定書式 (清瀧神社〈R8/9/1ver.〉・B5) レンダリング
function renderB5SubmissionReportView(data) {
  const dateObj = new Date(data.date.replace(/-/g, '/'));
  const year = dateObj.getFullYear();
  const reiwaYear = year >= 2019 ? (year - 2018) : 1;
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  
  const formattedReiwa = `令和 ${reiwaYear} 年 ${month} 月 ${day} 日`;

  // 当日の取引データを指定書式の正式品名ごとに正規化・名寄せ集計
  const normalizedStats = {};
  if (data.itemDetails) {
    for (let rawName in data.itemDetails) {
      const details = data.itemDetails[rawName];
      if (!details) continue;

      // 1. マッピング辞書から正規化名を取得
      let targetName = ITEM_NAME_TO_SUBMISSION_MAP[rawName];
      
      // 2. 空白・括弧の全角半角正規化で再検索
      if (!targetName) {
        const cleanRaw = rawName.replace(/[\s\(\)（）]/g, '');
        const matchedKey = Object.keys(ITEM_NAME_TO_SUBMISSION_MAP).find(k => k.replace(/[\s\(\)（）]/g, '') === cleanRaw);
        if (matchedKey) targetName = ITEM_NAME_TO_SUBMISSION_MAP[matchedKey];
      }

      // 3. 指定書式品名リストと直接一致するか確認
      if (!targetName) {
        const directMatch = SUBMISSION_SHEET_ITEMS.find(s => s.name === rawName || s.name.replace(/[\s\(\)（）]/g, '') === rawName.replace(/[\s\(\)（）]/g, ''));
        if (directMatch) targetName = directMatch.name;
      }

      // 見つからなければ元の名称を採用
      targetName = targetName || rawName;

      if (!normalizedStats[targetName]) {
        normalizedStats[targetName] = { quantity: 0, amount: 0 };
      }
      normalizedStats[targetName].quantity += details.quantity;
      normalizedStats[targetName].amount += details.amount;
    }
  }

  let totalQty = 0;
  let totalAmount = 0;

  // 全62品目の行を構築
  const rowsHtml = SUBMISSION_SHEET_ITEMS.map((sheetItem) => {
    const stats = normalizedStats[sheetItem.name];
    const qty = stats ? stats.quantity : 0;
    const amount = stats ? stats.amount : 0;

    if (qty > 0) {
      totalQty += qty;
      totalAmount += amount;
    }

    const qtyDisplay = qty > 0 ? `${qty}` : '';
    const amountDisplay = amount > 0 ? `${amount.toLocaleString()}` : '';
    const hasQtyClass = qty > 0 ? 'row-has-qty' : '';

    return `
      <tr class="${hasQtyClass}">
        <td class="b5-col-name">${sheetItem.name}</td>
        <td class="b5-col-price">${sheetItem.price.toLocaleString()}</td>
        <td class="b5-col-qty">${qtyDisplay}</td>
        <td class="b5-col-amount">${amountDisplay}</td>
        <td class="b5-col-remark">${sheetItem.remark || ''}</td>
      </tr>
    `;
  }).join('');

  // 総合計の数量と金額
  const grandQtyDisplay = totalQty > 0 ? `${totalQty}` : '';
  const grandAmountDisplay = totalAmount > 0 ? `${totalAmount.toLocaleString()}` : (data.itemSalesTotal > 0 ? data.itemSalesTotal.toLocaleString() : '0');

  DOM.reportSheetView.innerHTML = `
    <div class="report-b5-sheet">
      <div class="b5-report-header">
        <div class="b5-report-title">清瀧神社〈R8/9/1ver.〉</div>
        <div class="b5-report-date">${formattedReiwa}</div>
      </div>
      
      <table class="b5-report-table">
        <thead>
          <tr>
            <th class="b5-col-name">授与品名(入金項目)</th>
            <th class="b5-col-price">初穂料(単価)</th>
            <th class="b5-col-qty">数量</th>
            <th class="b5-col-amount">金額</th>
            <th class="b5-col-remark">備考</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="row-total">
            <td colspan="2" class="b5-total-label">入金合計</td>
            <td class="b5-col-qty">${grandQtyDisplay}</td>
            <td class="b5-col-amount">${grandAmountDisplay}</td>
            <td class="b5-col-remark"></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// 従来の通常書式 (A4) レンダリング
function renderStandardDailyReportView(data) {
  const dateObj = new Date(data.date.replace(/-/g, '/'));
  const formattedDate = dateObj.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  
  // 出力項目のチェック状態を取得
  const includeItems = document.getElementById('chk-include-items') ? document.getElementById('chk-include-items').checked : true;
  
  let itemRowsHtml = '';
  if (Object.keys(data.itemDetails).length === 0) {
    itemRowsHtml = '<tr><td colspan="3" class="text-center">授与履歴なし</td></tr>';
  } else {
    // マスタ（state.items）の並び順に合わせてソートして出力します
    const sortedNames = Object.keys(data.itemDetails).sort((a, b) => {
      const idxA = state.items.findIndex(item => item.name === a);
      const idxB = state.items.findIndex(item => item.name === b);
      const posA = idxA === -1 ? 9999 : idxA;
      const posB = idxB === -1 ? 9999 : idxB;
      return posA - posB;
    });

    for (let name of sortedNames) {
      const details = data.itemDetails[name];
      itemRowsHtml += `
        <tr>
          <td>${name}</td>
          <td class="text-center">${details.quantity} 体</td>
          <td class="text-right">${details.amount.toLocaleString()} 円</td>
        </tr>
      `;
    }
  }

  const itemTotalQty = Object.values(data.itemDetails).reduce((sum, item) => sum + item.quantity, 0);

  // 授与品内訳セクション
  let itemsSectionHtml = '';
  if (includeItems) {
    itemsSectionHtml = `
      <h3 style="margin-bottom:0.75rem; border-left:3px solid var(--color-vermilion); padding-left:0.5rem; margin-top:2rem;">授与品 内訳</h3>
      <table class="report-table">
        <thead>
          <tr>
            <th>授与品名</th>
            <th style="width: 120px;">授与数</th>
            <th style="width: 180px;">初穂料総額</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
          <tr style="font-weight: bold; background-color: #FAF9F6;">
            <td>授与品 小計</td>
            <td class="text-center">${itemTotalQty} 体</td>
            <td class="text-right">${data.itemSalesTotal.toLocaleString()} 円</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  DOM.reportSheetView.innerHTML = `
    <div class="report-paper">
      <div class="report-paper-header">
        <h2 class="report-paper-title">日次社入報告書</h2>
        <div class="report-paper-meta" style="display:flex; justify-content:space-between; margin-top:1rem; font-size:0.9rem; color:var(--color-text-muted);">
          <span>奉仕日: ${formattedDate}</span>
          <span>出力日: ${new Date().toLocaleDateString('ja-JP')}</span>
        </div>
      </div>
      
      <div class="report-summary-boxes" style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
        <div class="report-sum-box" style="max-width: 360px; width: 100%; border-color: var(--color-vermilion); padding: 1.2rem; text-align: center;">
          <span style="font-size: 0.9rem; color: var(--color-text-muted); display: block; margin-bottom: 0.4rem; font-weight: 700; letter-spacing: 0.05em;">授与品 合計初穂料</span>
          <span class="report-sum-value" style="color: var(--color-vermilion); font-weight: 700; font-size: 2.2rem; display: block; line-height: 1.2;">${data.itemSalesTotal.toLocaleString()} 円</span>
        </div>
      </div>
      
      ${itemsSectionHtml}
    </div>
  `;
}

// ==========================================
// マスタ表示形式 (カード/リスト) UI切り替え制御
// ==========================================
function updateMasterViewModeUI() {
  if (state.masterViewMode === 'list') {
    if (DOM.btnViewCard) DOM.btnViewCard.classList.remove('active');
    if (DOM.btnViewList) DOM.btnViewList.classList.add('active');
    if (DOM.masterGrid) DOM.masterGrid.style.display = 'none';
    if (DOM.masterListContainer) DOM.masterListContainer.style.display = 'block';
    
    const colsCtrl = document.getElementById('master-cols-controller');
    if (colsCtrl) colsCtrl.style.display = 'none';
  } else {
    if (DOM.btnViewCard) DOM.btnViewCard.classList.add('active');
    if (DOM.btnViewList) DOM.btnViewList.classList.remove('active');
    if (DOM.masterGrid) DOM.masterGrid.style.display = 'grid';
    if (DOM.masterListContainer) DOM.masterListContainer.style.display = 'none';
    
    const colsCtrl = document.getElementById('master-cols-controller');
    if (colsCtrl) colsCtrl.style.display = 'flex';
  }
}

// ==========================================
// マスタ管理画面 (ドラッグ＆ドロップ並び替えソート対応)
// ==========================================
function renderMasterGrid() {
  if (state.masterViewMode === 'list') {
    renderMasterList();
    return;
  }

  DOM.masterGrid.innerHTML = '';
  
  state.items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.id = `master-card-${item.id}`;
    card.setAttribute('draggable', 'false'); // 最初はドラッグ不可
    
    const isHidden = item.display === false;
    
    let imageHtml = `<div class="item-image-placeholder"><i class="fa-solid fa-om"></i></div>`;
    if (item.imageUrl) {
      const stableUrl = formatGoogleDriveUrl(item.imageUrl);
      imageHtml = `<img src="${stableUrl}" alt="${item.name}" class="item-image" id="master-img-view-${item.id}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="item-image-placeholder" style="display:none;"><i class="fa-solid fa-om"></i></div>`;
    }
    
    const rubyNameHtml = getRubyName(item.name, item.furigana);
    
    card.innerHTML = `
      <!-- ドラッググリップハンドル自体をdraggable=trueに設定 -->
      <div class="card-drag-handle" draggable="true" title="ドラッグして並び替え">
        <i class="fa-solid fa-grip-vertical"></i>
      </div>
      
      <div class="item-image-wrapper dropzone-wrapper" id="master-dropzone-${item.id}" style="cursor:pointer; position:relative;">
        ${imageHtml}
        <div class="dropzone-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); color:#fff; display:none; flex-direction:column; align-items:center; justify-content:center; font-size:0.8rem;">
          <i class="fa-solid fa-cloud-arrow-up" style="font-size:1.5rem; margin-bottom:0.25rem;"></i>
          写真ドロップで変更
        </div>
        <input type="file" id="master-file-input-${item.id}" accept="image/*" style="display:none;">
        ${isHidden ? '<span class="stock-badge" style="background-color:var(--color-text-muted);">非表示</span>' : ''}
      </div>
      <div class="item-info" id="master-info-container-${item.id}">
        <h3 class="item-name">${rubyNameHtml}</h3>
        <p class="item-desc" style="-webkit-line-clamp: 1; height: 1.2rem;">${item.description || '説明なし'}</p>
        <div class="item-price-stock">
          <span class="item-price">${item.price.toLocaleString()} 円</span>
          <span class="item-stock">在庫 ${item.stock} (備考: ${item.remark || '-'})</span>
        </div>
        
        <div class="master-card-action-bar">
          <button class="btn-card-icon ${!isHidden ? 'active' : ''}" id="btn-toggle-display-${item.id}" title="表示/非表示"><i class="fa-solid ${!isHidden ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
          <button class="btn-card-icon" id="btn-edit-master-${item.id}" title="編集"><i class="fa-solid fa-pencil"></i></button>
        </div>
      </div>
    `;
    
    const dragHandle = card.querySelector('.card-drag-handle');
    
    // ドラッググリップハンドル自身に対するドラッグ開始・終了イベント
    dragHandle.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.id);
      card.classList.add('dragging');
      e.stopPropagation();
    });

    dragHandle.addEventListener('dragend', (e) => {
      card.classList.remove('dragging');
      const cards = DOM.masterGrid.querySelectorAll('.item-card');
      cards.forEach(c => c.classList.remove('drag-over'));
      e.stopPropagation();
    });

    // 親カード要素に対するドロップ先イベント
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    card.addEventListener('dragenter', (e) => {
      e.preventDefault();
      const draggingCard = DOM.masterGrid.querySelector('.item-card.dragging') || document.querySelector('.item-card.dragging');
      if (draggingCard && draggingCard !== card) {
        card.classList.add('drag-over');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', async (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      
      const dragSourceId = e.dataTransfer.getData('text/plain');
      if (!dragSourceId || dragSourceId === item.id) return;

      const srcIdx = state.items.findIndex(i => i.id === dragSourceId);
      const destIdx = state.items.findIndex(i => i.id === item.id);
      
      if (srcIdx !== -1 && destIdx !== -1) {
        // 配列要素の再配置
        const [movedItem] = state.items.splice(srcIdx, 1);
        state.items.splice(destIdx, 0, movedItem);
        
        // ローカル順序の保存
        const orderIds = state.items.map(i => i.id);
        localStorage.setItem('regi_items_order', JSON.stringify(orderIds));
        
        // 両画面の再描画
        renderMasterGrid();
        renderItems();
        
        // GASサーバーに順序を同期送信 (非同期)
        await saveOrderToGAS(orderIds);
        showToast('授与品の並び順を保存・変更しました。', 'success');
      }
    });

    const dropzone = card.querySelector(`#master-dropzone-${item.id}`);
    const fileInput = card.querySelector(`#master-file-input-${item.id}`);
    const imgElement = card.querySelector(`#master-img-view-${item.id}`) || card.querySelector('.item-image-placeholder');
    const overlay = card.querySelector('.dropzone-overlay');
    
    dropzone.addEventListener('mouseenter', () => overlay.style.display = 'flex');
    dropzone.addEventListener('mouseleave', () => overlay.style.display = 'none');
    
    setupDragAndDrop(dropzone, fileInput, imgElement, async (fileData) => {
      showLoader(true);
      if (state.isUsingMock) {
        item.imageUrl = fileData.data;
        showToast('画像を変更しました(デモ)。', 'success');
        renderMasterGrid();
        renderItems();
        showLoader(false);
        return;
      }
      
      try {
        const res = await fetch(GAS_API_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'updateMasterItem',
            item: {
              ...item,
              image: fileData
            }
          })
        });
        const data = await res.json();
        if (data.status === 'success') {
          item.imageUrl = data.item.imageUrl;
          showToast('写真をアップデートしました。', 'success');
          renderMasterGrid();
          renderItems();
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        console.error(err);
        showToast(`写真の変更に失敗しました: ${err.message}`, 'error');
      } finally {
        showLoader(false);
      }
    });

    const btnToggle = card.querySelector(`#btn-toggle-display-${item.id}`);
    btnToggle.addEventListener('click', () => toggleItemDisplay(item));

    const btnEdit = card.querySelector(`#btn-edit-master-${item.id}`);
    btnEdit.addEventListener('click', () => enterInlineEditMode(item));

    DOM.masterGrid.appendChild(card);
  });
}

// 表示・非表示トグル
async function toggleItemDisplay(item) {
  const nextDisplayState = !(item.display !== false);
  
  if (state.isUsingMock) {
    item.display = nextDisplayState;
    showToast(`「${item.name}」を${nextDisplayState ? '表示' : '非表示'}に設定しました。`, 'success');
    renderMasterGrid();
    renderItems();
    return;
  }
  
  showLoader(true);
  try {
    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateMasterItem',
        item: {
          ...item,
          display: nextDisplayState
        }
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      item.display = nextDisplayState;
      showToast(`表示ステータスを更新しました。`, 'success');
      renderMasterGrid();
      renderItems();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast(`表示切替に失敗しました: ${err.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

// インライン編集モード
function enterInlineEditMode(item) {
  const card = document.getElementById(`master-card-${item.id}`);
  card.classList.add('editing');
  
  const container = document.getElementById(`master-info-container-${item.id}`);
  
  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <div style="display:flex; gap:0.25rem; align-items:center;">
        <label style="font-size:0.75rem; font-weight:700; min-width:45px;">商品名</label>
        <input type="text" id="edit-name-${item.id}" class="edit-input" value="${item.name}">
      </div>
      <div style="display:flex; gap:0.25rem; align-items:center;">
        <label style="font-size:0.75rem; font-weight:700; min-width:45px;">ふりがな</label>
        <input type="text" id="edit-furigana-${item.id}" class="edit-input" value="${item.furigana || ''}" placeholder="ルビ(ひらがな表記)">
      </div>
      <div style="display:flex; gap:0.25rem; align-items:center;">
        <label style="font-size:0.75rem; font-weight:700; min-width:45px;">初穂料</label>
        <input type="number" id="edit-price-${item.id}" class="edit-input" value="${item.price}">
      </div>
      <div style="display:flex; gap:0.25rem; align-items:center;">
        <label style="font-size:0.75rem; font-weight:700; min-width:45px;">在庫数</label>
        <input type="number" id="edit-stock-${item.id}" class="edit-input" value="${item.stock}">
      </div>
      <div style="display:flex; gap:0.25rem; align-items:center;">
        <label style="font-size:0.75rem; font-weight:700; min-width:45px;">説明</label>
        <textarea id="edit-desc-${item.id}" class="edit-input" rows="2" style="resize:none;">${item.description || ''}</textarea>
      </div>
      <div style="display:flex; gap:0.25rem; align-items:center;">
        <label style="font-size:0.75rem; font-weight:700; min-width:45px;">備考</label>
        <input type="text" id="edit-remark-${item.id}" class="edit-input" value="${item.remark || ''}">
      </div>
      <div style="display:flex; gap:0.25rem; align-items:center;">
        <label style="font-size:0.75rem; font-weight:700; min-width:45px;">カテゴリ</label>
        <select id="edit-category-${item.id}" class="edit-input">
          <option value="ofuda" ${item.category === 'ofuda' ? 'selected' : ''}>お札</option>
          <option value="omamori" ${item.category === 'omamori' ? 'selected' : ''}>お守り</option>
          <option value="goshuin" ${item.category === 'goshuin' ? 'selected' : ''}>御朱印</option>
          <option value="engimono" ${item.category === 'engimono' ? 'selected' : ''}>縁起物</option>
          <option value="other" ${item.category === 'other' ? 'selected' : ''}>その他</option>
        </select>
      </div>
    </div>
    <div class="master-card-action-bar">
      <button class="btn-secondary" id="btn-cancel-edit-${item.id}" style="padding:0.35rem 0.6rem; font-size:0.8rem; color:var(--color-text);">キャンセル</button>
      <button class="btn-primary" id="btn-save-edit-${item.id}" style="padding:0.35rem 0.6rem; font-size:0.8rem;"><i class="fa-solid fa-floppy-disk"></i> 保存</button>
    </div>
  `;
  
  document.getElementById(`btn-cancel-edit-${item.id}`).addEventListener('click', () => {
    card.classList.remove('editing');
    renderMasterGrid();
  });
  
  document.getElementById(`btn-save-edit-${item.id}`).addEventListener('click', async () => {
    const newName = document.getElementById(`edit-name-${item.id}`).value.trim();
    const newFurigana = document.getElementById(`edit-furigana-${item.id}`).value.trim();
    const newPrice = parseInt(document.getElementById(`edit-price-${item.id}`).value) || 0;
    const newStock = parseInt(document.getElementById(`edit-stock-${item.id}`).value) || 0;
    const newDesc = document.getElementById(`edit-desc-${item.id}`).value;
    const newRemark = document.getElementById(`edit-remark-${item.id}`).value;
    const newCategory = document.getElementById(`edit-category-${item.id}`).value;
    
    if (!newName) {
      showToast('商品名を入力してください。', 'error');
      return;
    }

    const updatedItem = {
      ...item,
      name: newName,
      furigana: newFurigana,
      price: newPrice,
      stock: newStock,
      description: newDesc,
      remark: newRemark,
      category: newCategory
    };

    showLoader(true);
    
    if (state.isUsingMock) {
      const idx = state.items.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        state.items[idx] = updatedItem;
      }
      showToast('授与品データを保存しました。', 'success');
      card.classList.remove('editing');
      renderMasterGrid();
      renderItems();
      showLoader(false);
      return;
    }

    try {
      const res = await fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateMasterItem',
          item: updatedItem
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        const idx = state.items.findIndex(i => i.id === item.id);
        if (idx !== -1) {
          state.items[idx] = {
            ...updatedItem,
            imageUrl: data.item.imageUrl
          };
        }
        showToast('授与品データを同期・保存しました。', 'success');
        card.classList.remove('editing');
        renderMasterGrid();
        renderItems();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error(err);
      showToast(`保存に失敗しました: ${err.message}`, 'error');
    } finally {
      showLoader(false);
    }
  });
}

// 新規登録
function resetAddItemForm() {
  DOM.formAddItem.reset();
  state.pendingAddImage = null;
  DOM.addItemImagePreview.src = '';
  DOM.addItemImagePreview.style.display = 'none';
  const dropzone = DOM.addItemDropzone;
  const icon = dropzone.querySelector('.dropzone-icon');
  const text = dropzone.querySelector('p');
  icon.style.display = 'block';
  text.style.display = 'block';
}

async function handleAddItemSubmit(e) {
  e.preventDefault();
  
  const newItem = {
    name: document.getElementById('add-item-name').value.trim(),
    furigana: document.getElementById('add-item-furigana').value.trim(),
    price: parseInt(document.getElementById('add-item-price').value) || 0,
    stock: parseInt(document.getElementById('add-item-stock').value) || 0,
    category: document.getElementById('add-item-category').value,
    remark: document.getElementById('add-item-remark').value.trim(),
    description: document.getElementById('add-item-desc').value.trim(),
    display: true,
    image: state.pendingAddImage
  };

  DOM.modalAddItem.style.display = 'none';
  showLoader(true);

  if (state.isUsingMock) {
    const nextNum = state.items.length + 1;
    const mockNew = {
      ...newItem,
      id: 'M-' + String(nextNum).padStart(2, '0'),
      imageUrl: newItem.image ? newItem.image.data : ''
    };
    state.items.push(mockNew);
    
    // 新規登録時もlocalStorageの順序配列の末尾に追加して永続化
    const savedOrder = localStorage.getItem('regi_items_order');
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        orderIds.push(mockNew.id);
        localStorage.setItem('regi_items_order', JSON.stringify(orderIds));
      } catch (e) {}
    }
    
    showToast(`「${newItem.name}」を新規登録しました(デモ)。`, 'success');
    renderMasterGrid();
    renderItems();
    showLoader(false);
    return;
  }

  try {
    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'addMasterItem',
        item: newItem
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      const added = {
        ...newItem,
        id: data.item.id,
        imageUrl: data.item.imageUrl
      };
      state.items.push(added);
      
      const savedOrder = localStorage.getItem('regi_items_order');
      if (savedOrder) {
        try {
          const orderIds = JSON.parse(savedOrder);
          orderIds.push(added.id);
          localStorage.setItem('regi_items_order', JSON.stringify(orderIds));
        } catch (e) {}
      }
      
      showToast(`「${newItem.name}」を正常に新規登録しました。`, 'success');
      renderMasterGrid();
      renderItems();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast(`新規登録に失敗しました: ${err.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

// 共通ヘルパー (合計値)
function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// 確認ダイアログ
window.confirmCancelTransaction = function(txId) {
  state.cancelTargetTxId = txId;
  DOM.cancelTargetTxIdText.textContent = txId;
  DOM.modalCancelConfirm.style.display = 'flex';
};

// 共通ユーティリティ
function showLoader(show) {
  const fullScreenLoader = document.getElementById('full-screen-loader');
  if (fullScreenLoader) {
    fullScreenLoader.style.display = show ? 'flex' : 'none';
  }
  
  if (show) {
    document.body.classList.add('loading-state');
  } else {
    document.body.classList.remove('loading-state');
  }

  if (DOM.itemsGrid) {
    DOM.itemsGrid.style.opacity = show ? '0.5' : '1';
    DOM.itemsGrid.style.pointerEvents = show ? 'none' : 'auto';
  }
  if (DOM.masterGrid) {
    DOM.masterGrid.style.opacity = show ? '0.5' : '1';
    DOM.masterGrid.style.pointerEvents = show ? 'none' : 'auto';
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '<i class="fa-solid fa-info-circle"></i>';
  if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'error') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
  
  toast.innerHTML = `${icon} <span>${message}</span>`;
  DOM.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// マスタ管理リスト形式の描画 (ドラッグ＆ドロップ ＆ インライン簡単編集)
// ==========================================
function renderMasterList() {
  DOM.masterListBody.innerHTML = '';
  
  state.items.forEach(item => {
    const row = document.createElement('tr');
    row.className = 'master-list-row';
    row.id = `master-list-row-${item.id}`;
    row.setAttribute('draggable', 'false'); // 最初はドラッグ不可（グリップハンドルを掴んだときだけ有効）

    const isHidden = item.display === false;
    
    // 画像
    let imgHtml = `<div class="item-image-placeholder" style="width:40px; height:40px; font-size:1.2rem; border-radius:4px;"><i class="fa-solid fa-om"></i></div>`;
    if (item.imageUrl) {
      const stableUrl = formatGoogleDriveUrl(item.imageUrl);
      imgHtml = `<img src="${stableUrl}" alt="${item.name}" class="list-item-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div class="item-image-placeholder" style="width:40px; height:40px; font-size:1.2rem; border-radius:4px; display:none;"><i class="fa-solid fa-om"></i></div>`;
    }

    const rubyNameHtml = getRubyName(item.name, item.furigana);

    row.innerHTML = `
      <!-- ドラッグハンドル -->
      <td style="text-align: center; vertical-align: middle;">
        <div class="list-drag-handle" draggable="true" title="ドラッグして並び替え">
          <i class="fa-solid fa-grip-vertical"></i>
        </div>
      </td>
      <td style="text-align: center;">${imgHtml}</td>
      <td style="font-family: monospace; font-weight: bold; color: var(--color-text-muted);">${item.id}</td>
      <td id="list-name-cell-${item.id}">
        <div style="font-weight: bold;">${rubyNameHtml}</div>
      </td>
      <td id="list-price-cell-${item.id}" style="font-family: var(--font-serif); font-weight: 700; color: var(--color-vermilion);">${item.price.toLocaleString()} 円</td>
      <td id="list-stock-cell-${item.id}" style="font-weight: bold;">${item.stock} 体</td>
      <td id="list-desc-cell-${item.id}" style="color: var(--color-text-muted); font-size: 0.8rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.description || '-'}</td>
      <td id="list-remark-cell-${item.id}" style="color: var(--color-text-muted); font-size: 0.8rem;">${item.remark || '-'}</td>
      <td id="list-category-cell-${item.id}">
        <span class="status-badge" style="background-color: rgba(196,162,100,0.08); color: var(--color-gold); font-size:0.75rem;">
          ${item.category === 'ofuda' ? 'お札' : item.category === 'omamori' ? 'お守り' : item.category === 'goshuin' ? '御朱印' : item.category === 'engimono' ? '縁起物' : 'その他'}
        </span>
      </td>
      <td style="text-align: center;">
        <button class="list-btn-icon ${!isHidden ? 'active' : ''}" id="btn-list-toggle-display-${item.id}" title="表示/非表示">
          <i class="fa-solid ${!isHidden ? 'fa-eye' : 'fa-eye-slash'}"></i>
        </button>
      </td>
      <td style="text-align: center;">
        <div class="list-action-btns">
          <button class="list-btn-icon" id="btn-list-edit-${item.id}" title="編集"><i class="fa-solid fa-pencil"></i></button>
        </div>
      </td>
    `;

    // ドラッグ＆ドロップイベントの紐付け (カード型とロジック統一)
    const dragHandle = row.querySelector('.list-drag-handle');
    
    dragHandle.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.id);
      row.classList.add('dragging');
      row.setAttribute('draggable', 'true');
      e.stopPropagation();
    });

    dragHandle.addEventListener('dragend', (e) => {
      row.classList.remove('dragging');
      row.setAttribute('draggable', 'false');
      const rows = DOM.masterListBody.querySelectorAll('.master-list-row');
      rows.forEach(r => r.classList.remove('drag-over'));
      e.stopPropagation();
    });

    // グリップハンドルを掴んだときだけ一時的にdraggable=trueにする (iOS等でのスクロール競合防止・滑らかなドラッグ用)
    dragHandle.addEventListener('mousedown', () => {
      row.setAttribute('draggable', 'true');
    });
    
    dragHandle.addEventListener('mouseup', () => {
      row.setAttribute('draggable', 'false');
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    row.addEventListener('dragenter', (e) => {
      e.preventDefault();
      const draggingRow = DOM.masterListBody.querySelector('.master-list-row.dragging');
      if (draggingRow && draggingRow !== row) {
        row.classList.add('drag-over');
      }
    });

    row.addEventListener('dragleave', () => {
      row.classList.remove('drag-over');
    });

    row.addEventListener('drop', async (e) => {
      e.preventDefault();
      row.classList.remove('drag-over');
      
      const dragSourceId = e.dataTransfer.getData('text/plain');
      if (!dragSourceId || dragSourceId === item.id) return;

      const srcIdx = state.items.findIndex(i => i.id === dragSourceId);
      const destIdx = state.items.findIndex(i => i.id === item.id);
      
      if (srcIdx !== -1 && destIdx !== -1) {
        const [movedItem] = state.items.splice(srcIdx, 1);
        state.items.splice(destIdx, 0, movedItem);
        
        const orderIds = state.items.map(i => i.id);
        localStorage.setItem('regi_items_order', JSON.stringify(orderIds));
        
        renderMasterGrid(); // リストモードが再描画される
        renderItems();
        
        await saveOrderToGAS(orderIds);
        showToast('授与品の並び順を保存・変更しました。', 'success');
      }
    });

    // 表示トグル
    row.querySelector(`#btn-list-toggle-display-${item.id}`).addEventListener('click', () => toggleItemDisplay(item));

    // インラインリスト編集への遷移
    row.querySelector(`#btn-list-edit-${item.id}`).addEventListener('click', () => enterListInlineEditMode(item));

    DOM.masterListBody.appendChild(row);
  });
}

// リスト表示用インライン行編集モード
function enterListInlineEditMode(item) {
  const row = document.getElementById(`master-list-row-${item.id}`);
  row.classList.add('editing');
  
  // 各セルをインプット要素に書き換える
  const nameCell = document.getElementById(`list-name-cell-${item.id}`);
  const priceCell = document.getElementById(`list-price-cell-${item.id}`);
  const stockCell = document.getElementById(`list-stock-cell-${item.id}`);
  const descCell = document.getElementById(`list-desc-cell-${item.id}`);
  const remarkCell = document.getElementById(`list-remark-cell-${item.id}`);
  const categoryCell = document.getElementById(`list-category-cell-${item.id}`);
  
  nameCell.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0.25rem;">
      <input type="text" id="list-edit-name-${item.id}" class="list-edit-input" value="${item.name}" placeholder="商品名">
      <input type="text" id="list-edit-furigana-${item.id}" class="list-edit-input" value="${item.furigana || ''}" placeholder="ルビ(ひらがな)">
    </div>
  `;
  
  priceCell.innerHTML = `
    <input type="number" id="list-edit-price-${item.id}" class="list-edit-input" value="${item.price}" style="width: 80px;">
  `;
  
  stockCell.innerHTML = `
    <input type="number" id="list-edit-stock-${item.id}" class="list-edit-input" value="${item.stock}" style="width: 70px;">
  `;
  
  descCell.innerHTML = `
    <input type="text" id="list-edit-desc-${item.id}" class="list-edit-input" value="${item.description || ''}" placeholder="説明書き">
  `;
  
  remarkCell.innerHTML = `
    <input type="text" id="list-edit-remark-${item.id}" class="list-edit-input" value="${item.remark || ''}" placeholder="備考">
  `;
  
  categoryCell.innerHTML = `
    <select id="list-edit-category-${item.id}" class="list-edit-input" style="width: 100px; padding: 0.3rem;">
      <option value="ofuda" ${item.category === 'ofuda' ? 'selected' : ''}>お札</option>
      <option value="omamori" ${item.category === 'omamori' ? 'selected' : ''}>お守り</option>
      <option value="goshuin" ${item.category === 'goshuin' ? 'selected' : ''}>御朱印</option>
      <option value="engimono" ${item.category === 'engimono' ? 'selected' : ''}>縁起物</option>
      <option value="other" ${item.category === 'other' ? 'selected' : ''}>その他</option>
    </select>
  `;

  // 操作ボタンエリアを「保存 ＆ キャンセル」に置き換える
  const actionTd = row.querySelector('td:last-child');
  actionTd.innerHTML = `
    <div class="list-action-btns">
      <button class="list-btn-icon editing-active" id="btn-list-save-edit-${item.id}" title="保存" style="color:var(--color-green); border-color:var(--color-green);"><i class="fa-solid fa-floppy-disk"></i></button>
      <button class="list-btn-icon" id="btn-list-cancel-edit-${item.id}" title="キャンセル" style="color:var(--color-vermilion); border-color:var(--color-vermilion);"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `;

  // キャンセルイベント
  document.getElementById(`btn-list-cancel-edit-${item.id}`).addEventListener('click', () => {
    row.classList.remove('editing');
    renderMasterGrid(); // リストを再描画して元に戻す
  });

  // 保存イベント (Enterキーでも動作するようにインプット要素にkeyupハンドラを設定)
  const saveAction = async () => {
    const newName = document.getElementById(`list-edit-name-${item.id}`).value.trim();
    const newFurigana = document.getElementById(`list-edit-furigana-${item.id}`).value.trim();
    const newPrice = parseInt(document.getElementById(`list-edit-price-${item.id}`).value) || 0;
    const newStock = parseInt(document.getElementById(`list-edit-stock-${item.id}`).value) || 0;
    const newDesc = document.getElementById(`list-edit-desc-${item.id}`).value;
    const newRemark = document.getElementById(`list-edit-remark-${item.id}`).value;
    const newCategory = document.getElementById(`list-edit-category-${item.id}`).value;
    
    if (!newName) {
      showToast('商品名を入力してください。', 'error');
      return;
    }

    const updatedItem = {
      ...item,
      name: newName,
      furigana: newFurigana,
      price: newPrice,
      stock: newStock,
      description: newDesc,
      remark: newRemark,
      category: newCategory
    };

    showLoader(true);
    
    if (state.isUsingMock) {
      const idx = state.items.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        state.items[idx] = updatedItem;
      }
      showToast('授与品データを保存しました。', 'success');
      row.classList.remove('editing');
      renderMasterGrid();
      renderItems();
      showLoader(false);
      return;
    }

    try {
      const res = await fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateMasterItem',
          item: updatedItem
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        const idx = state.items.findIndex(i => i.id === item.id);
        if (idx !== -1) {
          state.items[idx] = {
            ...updatedItem,
            imageUrl: data.item.imageUrl
          };
        }
        showToast('授与品データを同期・保存しました。', 'success');
        row.classList.remove('editing');
        renderMasterGrid();
        renderItems();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error(err);
      showToast(`保存に失敗しました: ${err.message}`, 'error');
    } finally {
      showLoader(false);
    }
  };

  document.getElementById(`btn-list-save-edit-${item.id}`).addEventListener('click', saveAction);

  // 全インプット欄で Enter キーを押した際に保存を実行するハンドラ
  const inputs = row.querySelectorAll('.list-edit-input');
  inputs.forEach(input => {
    input.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        saveAction();
      }
    });
  });
}

// ==========================================
// ネットワーク状態＆オフライン同期機能
// ==========================================
function updateNetworkStatusUI(isOnline) {
  if (!DOM.networkStatus) return;
  
  const queue = JSON.parse(localStorage.getItem('offline_checkout_queue') || '[]');
  const pendingCount = queue.length;
  
  if (isOnline && navigator.onLine) {
    DOM.networkStatus.className = 'network-status online';
    if (pendingCount > 0) {
      DOM.networkStatus.innerHTML = `<i class="fa-solid fa-circle" style="font-size:0.5rem; vertical-align:middle; margin-right:0.25rem;"></i>オンライン (未同期 ${pendingCount} 件)`;
    } else {
      DOM.networkStatus.innerHTML = `<i class="fa-solid fa-circle" style="font-size:0.5rem; vertical-align:middle; margin-right:0.25rem;"></i>オンライン`;
    }
  } else {
    DOM.networkStatus.className = 'network-status offline';
    if (pendingCount > 0) {
      DOM.networkStatus.innerHTML = `<i class="fa-solid fa-circle" style="font-size:0.5rem; vertical-align:middle; margin-right:0.25rem;"></i>オフライン (未同期 ${pendingCount} 件)`;
    } else {
      DOM.networkStatus.innerHTML = `<i class="fa-solid fa-circle" style="font-size:0.5rem; vertical-align:middle; margin-right:0.25rem;"></i>オフライン`;
    }
  }
}

async function syncOfflineTransactions() {
  const queue = JSON.parse(localStorage.getItem('offline_checkout_queue') || '[]');
  if (queue.length === 0) {
    updateNetworkStatusUI(true);
    return;
  }
  
  if (!navigator.onLine) {
    showToast('オフライン状態のため、保留されている取引データを同期できません。', 'warning');
    updateNetworkStatusUI(false);
    return;
  }
  
  showLoader(true);
  showToast(`保留されている売上データ（${queue.length} 件）をスプレッドシートへ同期中...`, 'info');
  
  let successCount = 0;
  const remainingQueue = [];
  
  for (let tx of queue) {
    try {
      const res = await fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'checkout',
          items: tx.items
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        successCount++;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Failed to sync offline transaction:', tx.transactionId, err);
      remainingQueue.push(tx);
    }
  }
  
  localStorage.setItem('offline_checkout_queue', JSON.stringify(remainingQueue));
  showLoader(false);
  
  if (successCount > 0) {
    showToast(`${successCount} 件の保留売上データをスプレッドシートへ同期しました！`, 'success');
  }
  
  if (remainingQueue.length > 0) {
    showToast(`一部の売上データ（${remainingQueue.length} 件）の同期に失敗しました。接続環境をご確認ください。`, 'error');
    updateNetworkStatusUI(false);
  } else {
    updateNetworkStatusUI(true);
  }
}

function setupOfflineMonitoring() {
  window.addEventListener('online', () => {
    updateNetworkStatusUI(true);
    syncOfflineTransactions();
  });
  window.addEventListener('offline', () => {
    updateNetworkStatusUI(false);
  });
  // 初期状態の設定
  updateNetworkStatusUI(navigator.onLine);
}

// ==========================================
// 総合ダッシュボードの制御ロジック
// ==========================================
async function loadDashboardData(isBackground = false) {
  const now = new Date();
  
  // 今月1日
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthStr = getJstDateString(firstDayOfMonth);
  
  // 直近7日前
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);
  const startOfWeekStr = getJstDateString(sevenDaysAgo);
  
  // 本日
  const todayStr = getJstDateString(now);
  
  // 選択された範囲に応じた開始日・終了日を設定
  const range = state.dashboard.activeRange;
  let startDate = '';
  
  if (range === 'week') {
    startDate = startOfWeekStr;
  } else if (range === 'month') {
    startDate = startOfMonthStr;
  } else if (range === 'year') {
    startDate = `${now.getFullYear()}-01-01`;
  } else if (range === 'all') {
    startDate = '2025-01-01'; // システム稼働初期の十分に古い日付を設定
  } else if (range === 'custom') {
    startDate = state.dashboard.customStart || startOfWeekStr;
  }

  // 統計テーブル専用の範囲に応じた開始日を設定
  const statsRange = state.dashboard.statsRange;
  let statsStartDate = '';
  
  if (statsRange === 'week') {
    statsStartDate = startOfWeekStr;
  } else if (statsRange === 'month') {
    statsStartDate = startOfMonthStr;
  } else if (statsRange === 'year') {
    statsStartDate = `${now.getFullYear()}-01-01`;
  } else if (statsRange === 'all') {
    statsStartDate = '2025-01-01';
  } else if (statsRange === 'custom') {
    statsStartDate = state.dashboard.statsCustomStart || startOfWeekStr;
  }

  // 表示に必要な全範囲をカバーするために「推移表示開始日」「統計表示開始日」「今月開始日」の中で最も過去の日付を採用
  let fetchStartDate = startOfMonthStr;
  if (startDate < fetchStartDate) fetchStartDate = startDate;
  if (statsStartDate < fetchStartDate) fetchStartDate = statsStartDate;

  // 終了日も同様に「本日」「推移終了日」「統計終了日」の中で最も未来の日付を採用
  let fetchEndDate = todayStr;
  if (range === 'custom' && state.dashboard.customEnd && state.dashboard.customEnd > fetchEndDate) {
    fetchEndDate = state.dashboard.customEnd;
  }
  if (statsRange === 'custom' && state.dashboard.statsCustomEnd && state.dashboard.statsCustomEnd > fetchEndDate) {
    fetchEndDate = state.dashboard.statsCustomEnd;
  }
  
  if (state.isUsingMock || GAS_API_URL === 'YOUR_GAS_API_URL') {
    // デモ用モックモード
    state.dashboard.rangeTransactions = getMockRangeTransactions(fetchStartDate, fetchEndDate);
    renderDashboard();
    return;
  }
  
  if (!isBackground) showLoader(true);
  try {
    const res = await fetch(`${GAS_API_URL}?action=getRangeTransactions&startDate=${fetchStartDate}&endDate=${fetchEndDate}`);
    const data = await res.json();
    
    if (data.status === 'success') {
      state.dashboard.rangeTransactions = data.transactions;
      renderDashboard();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    // エラー時のフォールバックはバックグラウンド時以外にトースト表示
    if (!isBackground) {
      showToast('ダッシュボードデータの読み込みに失敗しました。ローカルデータで代用します。', 'warning');
    }
    // エラー時はローカルの当日分だけで代用
    state.dashboard.rangeTransactions = state.transactions.map(tx => {
      return tx.items.map(item => ({
        transactionId: tx.transactionId,
        timestamp: tx.timestamp,
        date: tx.timestamp.split(' ')[0],
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        status: tx.status || '有効'
      }));
    }).flat();
    renderDashboard();
  } finally {
    if (!isBackground) showLoader(false);
  }
}

function renderDashboard() {
  const now = new Date();
  const todayStr = getJstDateString(now);
  
  // 今週（直近7日前〜本日）の範囲
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);
  const startOfWeekStr = getJstDateString(sevenDaysAgo);
  
  // 今月（当月1日〜本日）の範囲
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthStr = getJstDateString(firstDayOfMonth);

  // 1. KPIの計算
  let todaySales = 0, todayCount = 0;
  let weeklySales = 0, weeklyCount = 0;
  let monthlySales = 0, monthlyCount = 0;
  
  const txCounted = { today: new Set(), week: new Set(), month: new Set() };
  
  state.dashboard.rangeTransactions.forEach(tx => {
    if (tx.status !== '有効') return;
    
    // 本日
    if (tx.date === todayStr) {
      todaySales += tx.subtotal;
      txCounted.today.add(tx.transactionId);
    }
    // 今週
    if (tx.date >= startOfWeekStr && tx.date <= todayStr) {
      weeklySales += tx.subtotal;
      txCounted.week.add(tx.transactionId);
    }
    // 今月
    if (tx.date >= startOfMonthStr && tx.date <= todayStr) {
      monthlySales += tx.subtotal;
      txCounted.month.add(tx.transactionId);
    }
  });
  
  document.getElementById('kpi-today-sales').textContent = `¥${todaySales.toLocaleString()}`;
  document.getElementById('kpi-today-count').textContent = `${txCounted.today.size} 件の取引`;
  
  document.getElementById('kpi-weekly-sales').textContent = `¥${weeklySales.toLocaleString()}`;
  document.getElementById('kpi-weekly-count').textContent = `${txCounted.week.size} 件の取引`;
  
  document.getElementById('kpi-monthly-sales').textContent = `¥${monthlySales.toLocaleString()}`;
  document.getElementById('kpi-monthly-count').textContent = `${txCounted.month.size} 件の取引`;

  // 2. 在庫不足アラートの描画
  const inputThreshold = document.getElementById('input-alert-threshold');
  if (inputThreshold && inputThreshold.value != state.dashboard.alertThreshold) {
    inputThreshold.value = state.dashboard.alertThreshold;
  }

  const alertsList = document.getElementById('dashboard-stock-alerts');
  const alertItems = state.items.filter(item => item.display && item.stock <= state.dashboard.alertThreshold);
  
  if (alertItems.length === 0) {
    alertsList.innerHTML = '<li class="alert-empty-msg">在庫不足の授与品はありません。</li>';
  } else {
    alertsList.innerHTML = alertItems.map(item => `
      <li class="alert-item ${item.stock === 0 ? 'out-of-stock' : ''}">
        <div class="alert-item-info">
          <i class="fa-solid fa-triangle-exclamation" style="color:var(--color-vermilion);"></i>
          <span>${item.name} <small style="color:var(--color-text-muted);">(${item.id})</small></span>
        </div>
        <span class="alert-item-stock">${item.stock === 0 ? '在庫切れ' : `残り ${item.stock} 体`}</span>
      </li>
    `).join('');
  }

  // 3. 直近の取引履歴 (本日) の描画
  const timeline = document.getElementById('dashboard-timeline');
  const todayTxs = state.dashboard.rangeTransactions.filter(tx => tx.date === todayStr && tx.status === '有効');
  
  if (todayTxs.length === 0) {
    timeline.innerHTML = '<li class="timeline-empty-msg">本日の取引はまだありません。</li>';
  } else {
    // 取引ID単位でまとめて、最新5件を表示
    const groupedTxs = {};
    todayTxs.forEach(tx => {
      if (!groupedTxs[tx.transactionId]) {
        // UTCのタイムスタンプを日本時間（ローカル時間）に変換して時・分を安全に抽出
        let timeStr = '00:00';
        if (tx.timestamp) {
          const dateObj = new Date(tx.timestamp);
          if (!isNaN(dateObj.getTime())) {
            const hh = String(dateObj.getHours()).padStart(2, '0');
            const mm = String(dateObj.getMinutes()).padStart(2, '0');
            timeStr = `${hh}:${mm}`;
          } else {
            const match = tx.timestamp.match(/(\d{2}):(\d{2})/);
            timeStr = match ? `${match[1]}:${match[2]}` : '00:00';
          }
        }
        
        groupedTxs[tx.transactionId] = {
          time: timeStr,
          items: [],
          total: 0
        };
      }
      groupedTxs[tx.transactionId].items.push(`${tx.itemName}×${tx.quantity}`);
      groupedTxs[tx.transactionId].total += tx.subtotal;
    });
    
    const sortedTimeline = Object.values(groupedTxs).reverse().slice(0, 5);
    timeline.innerHTML = sortedTimeline.map(tx => `
      <li class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div>
            <span class="timeline-time">${tx.time}</span>
            <span class="timeline-item-name">${tx.items.join(', ')}</span>
          </div>
          <span class="timeline-item-price">¥${tx.total.toLocaleString()}</span>
        </div>
      </li>
    `).join('');
  }

  // 4. グラフの描画
  renderDashboardCharts();
}

function renderDashboardCharts() {
  const now = new Date();
  const range = state.dashboard.activeRange; // 'week' | 'month'
  
  // チャート描画先のCanvas
  const trendCtx = document.getElementById('sales-trend-chart').getContext('2d');
  const categoryCtx = document.getElementById('sales-category-chart').getContext('2d');
  
  // 二重描画バグ防止のため既存チャートがあれば破棄
  if (state.dashboard.trendChart) state.dashboard.trendChart.destroy();
  if (state.dashboard.categoryChart) state.dashboard.categoryChart.destroy();

  // 期間に合わせた売上データの抽出
  let filteredTxs = [];
  let labels = [];
  let salesData = [];
  
  if (range === 'week') {
    // 直近7日間の日別
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = getJstDateString(d);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      labels.push(label);
      
      const daySales = state.dashboard.rangeTransactions
        .filter(tx => tx.date === dateStr && (tx.status === '有効' || tx.status === 'true'))
        .reduce((sum, tx) => sum + tx.subtotal, 0);
      salesData.push(daySales);
    }
  } else if (range === 'month') {
    // 今月（週別推移：第1週〜第5週）
    const tempLabels = ['第1週 (1~7日)', '第2週 (8~14日)', '第3週 (15~21日)', '第4週 (22~28日)', '第5週 (29日~)'];
    const tempSales = [0, 0, 0, 0, 0];
    
    state.dashboard.rangeTransactions.forEach(tx => {
      if (tx.status !== '有効' && tx.status !== 'true') return;
      const txDate = new Date(tx.date.replace(/-/g, "/"));
      if (txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth()) {
        const day = txDate.getDate();
        if (day <= 7) tempSales[0] += tx.subtotal;
        else if (day <= 14) tempSales[1] += tx.subtotal;
        else if (day <= 21) tempSales[2] += tx.subtotal;
        else if (day <= 28) tempSales[3] += tx.subtotal;
        else tempSales[4] += tx.subtotal;
      }
    });
    labels = tempLabels;
    salesData = tempSales;
  } else if (range === 'year') {
    // 年間（今年1月〜12月の月別）
    labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const tempSales = Array(12).fill(0);
    
    state.dashboard.rangeTransactions.forEach(tx => {
      if (tx.status !== '有効' && tx.status !== 'true') return;
      const txDate = new Date(tx.date.replace(/-/g, "/"));
      if (txDate.getFullYear() === now.getFullYear()) {
        const m = txDate.getMonth(); // 0〜11
        tempSales[m] += tx.subtotal;
      }
    });
    salesData = tempSales;
  } else if (range === 'custom') {
    // 期間指定（31日以下なら日別、それ以上なら月別）
    const start = new Date((state.dashboard.customStart || '').replace(/-/g, "/"));
    const end = new Date((state.dashboard.customEnd || '').replace(/-/g, "/"));
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      labels = ['範囲無効'];
      salesData = [0];
    } else {
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 31) {
        // 日別
        let cur = new Date(start);
        while (cur <= end) {
          const dateStr = getJstDateString(cur);
          const label = `${cur.getMonth() + 1}/${cur.getDate()}`;
          labels.push(label);
          
          const daySales = state.dashboard.rangeTransactions
            .filter(tx => tx.date === dateStr && (tx.status === '有効' || tx.status === 'true'))
            .reduce((sum, tx) => sum + tx.subtotal, 0);
          salesData.push(daySales);
          
          cur.setDate(cur.getDate() + 1);
        }
      } else {
        // 月別
        let cur = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        
        const monthSales = {};
        while (cur <= endMonth) {
          const yyyymmLabel = `${cur.getFullYear()}/${String(cur.getMonth() + 1).padStart(2, '0')}`;
          labels.push(yyyymmLabel);
          monthSales[yyyymmLabel] = 0;
          cur.setMonth(cur.getMonth() + 1);
        }
        
        state.dashboard.rangeTransactions.forEach(tx => {
          if (tx.status !== '有効' && tx.status !== 'true') return;
          const txDate = new Date(tx.date.replace(/-/g, "/"));
          const yyyymm = `${txDate.getFullYear()}/${String(txDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthSales[yyyymm] !== undefined) {
            monthSales[yyyymm] += tx.subtotal;
          }
        });
        salesData = labels.map(lbl => monthSales[lbl]);
      }
    }
  } else if (range === 'all') {
    // 全期間（すべての年月の月別集計）
    if (state.dashboard.rangeTransactions.length === 0) {
      labels = ['データ無し'];
      salesData = [0];
    } else {
      const dates = state.dashboard.rangeTransactions.map(tx => new Date(tx.date.replace(/-/g, "/")));
      const start = new Date(Math.min(...dates));
      const end = new Date(Math.max(...dates));
      
      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      
      const monthSales = {};
      while (cur <= endMonth) {
        const yyyymmLabel = `${cur.getFullYear()}/${String(cur.getMonth() + 1).padStart(2, '0')}`;
        labels.push(yyyymmLabel);
        monthSales[yyyymmLabel] = 0;
        cur.setMonth(cur.getMonth() + 1);
      }
      
      state.dashboard.rangeTransactions.forEach(tx => {
        if (tx.status !== '有効' && tx.status !== 'true') return;
        const txDate = new Date(tx.date.replace(/-/g, "/"));
        const yyyymm = `${txDate.getFullYear()}/${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthSales[yyyymm] !== undefined) {
          monthSales[yyyymm] += tx.subtotal;
        }
      });
      salesData = labels.map(lbl => monthSales[lbl]);
    }
  }

  // 1. 授与料推移グラフ (縦棒)
  state.dashboard.trendChart = new Chart(trendCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '初穂料合計（授与料）',
        data: salesData,
        backgroundColor: '#3f5145', // 深緑（神社の木々）
        borderColor: '#c4a264', // 金茶
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (val) => `¥${val.toLocaleString()}`
          }
        }
      }
    }
  });

  // 2. カテゴリ別授与料比率の集計 (本日または期間中)
  const todayStr = getJstDateString(now);
  const categorySales = { ofuda: 0, omamori: 0, goshuin: 0, engimono: 0, other: 0 };
  const targetTxs = state.dashboard.rangeTransactions.filter(tx => {
    if (tx.status !== '有効' && tx.status !== 'true') return false;
    
    if (range === 'week') {
      const d = new Date();
      d.setDate(now.getDate() - 6);
      return tx.date >= getJstDateString(d) && tx.date <= todayStr;
    } else if (range === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return tx.date >= getJstDateString(firstDay) && tx.date <= todayStr;
    } else if (range === 'year') {
      const startStr = `${now.getFullYear()}-01-01`;
      const endStr = `${now.getFullYear()}-12-31`;
      return tx.date >= startStr && tx.date <= endStr;
    } else if (range === 'all') {
      return true; // 全期間はすべての有効取引を対象
    } else if (range === 'custom') {
      return tx.date >= state.dashboard.customStart && tx.date <= state.dashboard.customEnd;
    }
    return false;
  });

  targetTxs.forEach(tx => {
    const item = state.items.find(i => i.id === tx.itemId);
    const cat = item ? item.category : 'other';
    if (categorySales[cat] !== undefined) {
      categorySales[cat] += tx.subtotal;
    } else {
      categorySales.other += tx.subtotal;
    }
  });

  const categoryLabels = ['お札', 'お守り', '御朱印', '縁起物', 'その他'];
  const categoryValues = [categorySales.ofuda, categorySales.omamori, categorySales.goshuin, categorySales.engimono, categorySales.other];
  const categoryColors = ['#3f5145', '#d94b34', '#c4a264', '#e8cf97', '#7a7a7a'];

  state.dashboard.categoryChart = new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
      labels: categoryLabels,
      datasets: [{
        data: categoryValues,
        backgroundColor: categoryColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      cutout: '65%'
    }
  });

  // 凡例の描画
  const legendList = document.getElementById('pie-legend-list');
  const totalSales = categoryValues.reduce((a, b) => a + b, 0);
  
  legendList.innerHTML = categoryLabels.map((lbl, idx) => {
    const val = categoryValues[idx];
    const pct = totalSales > 0 ? Math.round((val / totalSales) * 100) : 0;
    return `
      <div class="legend-item">
        <div class="legend-color" style="background-color:${categoryColors[idx]};"></div>
        <span>${lbl}: ${pct}% (¥${val.toLocaleString()})</span>
      </div>
    `;
  }).join('');

  // 3. 🎁 授与品別統計の集計と出力
  const stRange = state.dashboard.statsRange;
  let subtitleText = '授与品別統計（多い順）';
  if (stRange === 'week') subtitleText = '今週の授与品別統計（多い順）';
  else if (stRange === 'month') subtitleText = '今月の授与品別統計（多い順）';
  else if (stRange === 'year') subtitleText = '今年の授与品別統計（多い順）';
  else if (stRange === 'all') subtitleText = '全期間の授与品別統計（多い順）';
  else if (stRange === 'custom') subtitleText = `指定期間 (${state.dashboard.statsCustomStart} 〜 ${state.dashboard.statsCustomEnd}) の授与品別統計（多い順）`;
  
  const subtitleEl = document.getElementById('dashboard-stats-subtitle');
  if (subtitleEl) {
    subtitleEl.textContent = subtitleText;
  }

  // 統計テーブル用の対象取引を statsRange の条件に従って絞り込む
  const statsTargetTxs = state.dashboard.rangeTransactions.filter(tx => {
    if (tx.status !== '有効' && tx.status !== 'true') return false;
    
    if (stRange === 'week') {
      const d = new Date();
      d.setDate(now.getDate() - 6);
      return tx.date >= getJstDateString(d) && tx.date <= todayStr;
    } else if (stRange === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return tx.date >= getJstDateString(firstDay) && tx.date <= todayStr;
    } else if (stRange === 'year') {
      const startStr = `${now.getFullYear()}-01-01`;
      const endStr = `${now.getFullYear()}-12-31`;
      return tx.date >= startStr && tx.date <= endStr;
    } else if (stRange === 'all') {
      return true; // 全有効レコードを対象
    } else if (stRange === 'custom') {
      return tx.date >= state.dashboard.statsCustomStart && tx.date <= state.dashboard.statsCustomEnd;
    }
    return false;
  });

  const itemStats = {};
  statsTargetTxs.forEach(tx => {
    if (!itemStats[tx.itemId]) {
      const item = state.items.find(i => i.id === tx.itemId);
      const categoryNameMap = {
        'ofuda': 'お札',
        'omamori': 'お守り',
        'goshuin': '御朱印',
        'engimono': '縁起物',
        'other': 'その他'
      };
      const rawCat = item ? item.category : 'other';
      const categoryName = categoryNameMap[rawCat] || 'その他';
      
      itemStats[tx.itemId] = {
        name: tx.itemName,
        category: categoryName,
        quantity: 0,
        total: 0
      };
    }
    itemStats[tx.itemId].quantity += tx.quantity;
    itemStats[tx.itemId].total += tx.subtotal;
  });

  const sortedStats = Object.values(itemStats).sort((a, b) => {
    if (b.quantity !== a.quantity) {
      return b.quantity - a.quantity;
    }
    return b.total - a.total;
  });

  const statsTableBody = document.getElementById('dashboard-item-stats');
  if (statsTableBody) {
    if (sortedStats.length === 0) {
      statsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">この期間の授与履歴はありません。</td></tr>`;
    } else {
      statsTableBody.innerHTML = sortedStats.map(stat => {
        let badgeClass = 'badge-other';
        if (stat.category === 'お札') badgeClass = 'category-badge badge-ofuda';
        else if (stat.category === 'お守り') badgeClass = 'category-badge badge-omamori';
        else if (stat.category === '御朱印') badgeClass = 'category-badge badge-goshuin';
        else if (stat.category === '縁起物') badgeClass = 'category-badge badge-engimono';
        
        return `
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td style="padding: 0.75rem; font-weight: 500; color: var(--color-text);">${stat.name}</td>
            <td style="padding: 0.75rem; text-align: center;">
              <span class="${badgeClass}" style="font-size:0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight:700;">${stat.category}</span>
            </td>
            <td style="padding: 0.75rem; text-align: right; font-weight: 700; color: var(--color-text);">${stat.quantity.toLocaleString()} 体</td>
            <td style="padding: 0.75rem; text-align: right; font-weight: 700; color: var(--color-vermilion);">¥${stat.total.toLocaleString()}</td>
          </tr>
        `;
      }).join('');
    }
  }
}

// 動作確認用モックダミー売上データを生成する関数
function getMockRangeTransactions(startDate, endDate) {
  const list = [];
  const categories = ['ofuda', 'omamori', 'goshuin', 'engimono', 'other'];
  const names = {
    'ofuda': ['家内安全御札', '商売繁盛御札'],
    'omamori': ['交通安全お守り', '厄除けお守り'],
    'goshuin': ['授与用通常御朱印', '限定金字御朱印'],
    'engimono': ['吉祥干支置物', '破魔矢'],
    'other': ['御朱印帳 (和柄)', '祈願絵馬']
  };
  const prices = {
    '家内安全御札': 1500, '商売繁盛御札': 1500,
    '交通安全お守り': 800, '厄除けお守り': 800,
    '授与用通常御朱印': 500, '限定金字御朱印': 1000,
    '吉祥干支置物': 1200, '破魔矢': 1500,
    '御朱印帳 (和柄)': 2000, '祈願絵馬': 700
  };
  
  let current = new Date(startDate.replace(/-/g, "/"));
  const end = new Date(endDate.replace(/-/g, "/"));
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const count = Math.floor(Math.random() * 4) + 2; // 1日あたり2〜5件
    for (let i = 0; i < count; i++) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const name = names[cat][Math.floor(Math.random() * names[cat].length)];
      const price = prices[name];
      const qty = Math.floor(Math.random() * 2) + 1;
      
      list.push({
        transactionId: `TX-MOCK-${current.getTime()}-${i}`,
        timestamp: `${dateStr} ${String(9 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        date: dateStr,
        itemId: `M-0${Math.floor(Math.random() * 9) + 1}`,
        itemName: name,
        quantity: qty,
        price: price,
        subtotal: price * qty,
        status: '有効'
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return list;
}

// ダッシュボード各パーツのクリック時詳細ポップアップ表示関数
function showDashboardDetail(type) {
  const modal = document.getElementById('modal-dashboard-detail');
  const titleEl = document.getElementById('dashboard-detail-title');
  const contentEl = document.getElementById('dashboard-detail-content');
  
  if (!modal || !titleEl || !contentEl) return;
  
  let title = '詳細情報';
  let html = '';
  const now = new Date();
  
  if (type.startsWith('kpi-')) {
    // KPIカード詳細
    let filtered = [];
    const todayStr = getJstDateString(now);
    
    if (type === 'kpi-today') {
      title = '本日（今日）の授与取引明細';
      filtered = state.dashboard.rangeTransactions.filter(tx => tx.date === todayStr);
    } else if (type === 'kpi-week') {
      title = '今週（直近7日間）の授与取引明細';
      const d = new Date();
      d.setDate(now.getDate() - 6);
      const startStr = getJstDateString(d);
      filtered = state.dashboard.rangeTransactions.filter(tx => tx.date >= startStr && tx.date <= todayStr);
    } else if (type === 'kpi-month') {
      title = '今月の授与取引明細';
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const startStr = getJstDateString(firstDay);
      filtered = state.dashboard.rangeTransactions.filter(tx => tx.date >= startStr && tx.date <= todayStr);
    }
    
    const activeTxs = filtered.filter(tx => tx.status === '有効' || tx.status === 'true');
    const grouped = {};
    
    activeTxs.forEach(tx => {
      if (!grouped[tx.transactionId]) {
        let timeStr = tx.timestamp;
        const dateObj = new Date(tx.timestamp);
        if (!isNaN(dateObj.getTime())) {
          timeStr = `${dateObj.getFullYear()}/${dateObj.getMonth()+1}/${dateObj.getDate()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
        }
        grouped[tx.transactionId] = {
          id: tx.transactionId,
          time: timeStr,
          items: [],
          total: 0
        };
      }
      grouped[tx.transactionId].items.push(`${tx.itemName} × ${tx.quantity}`);
      grouped[tx.transactionId].total += tx.subtotal;
    });
    
    const list = Object.values(grouped).sort((a,b) => b.id.localeCompare(a.id));
    
    if (list.length === 0) {
      html = '<p style="text-align:center; padding:2rem; color:var(--color-text-muted);">期間中の取引データはありません。</p>';
    } else {
      html = `
        <table class="detail-modal-table">
          <thead>
            <tr>
              <th>取引日時</th>
              <th>取引ID</th>
              <th>授与内容</th>
              <th style="text-align:right;">初穂料合計</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(tx => `
              <tr>
                <td>${tx.time}</td>
                <td style="font-family:monospace; font-size:0.8rem;">${tx.id}</td>
                <td>${tx.items.join('<br>')}</td>
                <td style="text-align:right; font-weight:700; color:var(--color-green);">¥${tx.total.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
  } else if (type === 'trend') {
    const range = state.dashboard.activeRange;
    let rangeName = '週間';
    if (range === 'month') rangeName = '月間';
    else if (range === 'year') rangeName = '年間';
    else if (range === 'all') rangeName = '全期間';
    else if (range === 'custom') rangeName = '期間指定';
    
    title = `${rangeName}・授与料推移の明細`;
    
    const chart = state.dashboard.trendChart;
    if (chart && chart.data && chart.data.labels) {
      const labels = chart.data.labels;
      const data = chart.data.datasets[0].data;
      
      html = `
        <table class="detail-modal-table">
          <thead>
            <tr>
              <th>期間・日付</th>
              <th style="text-align:right;">合計初穂料 (授与料)</th>
            </tr>
          </thead>
          <tbody>
            ${labels.map((lbl, idx) => `
              <tr>
                <td style="font-weight:700; color:var(--color-text);">${lbl}</td>
                <td style="text-align:right; font-weight:700; color:var(--color-vermilion);">¥${(data[idx] || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      html = '<p>データがありません。</p>';
    }
    
  } else if (type === 'category') {
    title = 'カテゴリ別・授与品ごとの内訳';
    const range = state.dashboard.activeRange;
    const todayStr = getJstDateString(now);
    
    const targetTxs = state.dashboard.rangeTransactions.filter(tx => {
      if (tx.status !== '有効' && tx.status !== 'true') return false;
      if (range === 'week') {
        const d = new Date();
        d.setDate(now.getDate() - 6);
        return tx.date >= getJstDateString(d) && tx.date <= todayStr;
      } else if (range === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return tx.date >= getJstDateString(firstDay) && tx.date <= todayStr;
      } else if (range === 'year') {
        const startStr = `${now.getFullYear()}-01-01`;
        return tx.date >= startStr && tx.date <= `${now.getFullYear()}-12-31`;
      } else if (range === 'all') {
        return true;
      } else if (range === 'custom') {
        return tx.date >= state.dashboard.customStart && tx.date <= state.dashboard.customEnd;
      }
      return false;
    });

    const catDetails = {};
    const catNameMap = { ofuda: 'お札', omamori: 'お守り', goshuin: '御朱印', engimono: '縁起物', other: 'その他' };
    
    targetTxs.forEach(tx => {
      const item = state.items.find(i => i.id === tx.itemId);
      const catKey = item ? item.category : 'other';
      const catName = catNameMap[catKey] || 'その他';
      
      if (!catDetails[catName]) {
        catDetails[catName] = { total: 0, items: {} };
      }
      
      if (!catDetails[catName].items[tx.itemName]) {
        catDetails[catName].items[tx.itemName] = { quantity: 0, total: 0 };
      }
      
      catDetails[catName].items[tx.itemName].quantity += tx.quantity;
      catDetails[catName].items[tx.itemName].total += tx.subtotal;
      catDetails[catName].total += tx.subtotal;
    });
    
    if (Object.keys(catDetails).length === 0) {
      html = '<p style="text-align:center; padding:2rem; color:var(--color-text-muted);">期間中のカテゴリ集計データはありません。</p>';
    } else {
      html = Object.entries(catDetails).map(([catName, data]) => {
        const itemsList = Object.entries(data.items).sort((a,b) => b[1].quantity - a[1].quantity);
        return `
          <div style="margin-bottom:1.5rem; border:1px solid var(--color-border); border-radius:8px; overflow:hidden;">
            <div style="background-color:rgba(63, 81, 69, 0.05); padding:0.6rem 1rem; display:flex; justify-content:space-between; font-weight:700; border-bottom:1px solid var(--color-border);">
              <span style="color:var(--color-green);"><i class="fa-solid fa-folder-open"></i> ${catName}</span>
              <span style="color:var(--color-vermilion);">合計: ¥${data.total.toLocaleString()}</span>
            </div>
            <table class="detail-modal-table" style="margin:0; font-size:0.82rem;">
              <thead>
                <tr style="background:transparent;">
                  <th style="border-bottom:1px solid var(--color-border); background:none; padding:0.5rem 1rem;">授与品名</th>
                  <th style="border-bottom:1px solid var(--color-border); background:none; padding:0.5rem 1rem; text-align:right;">数量</th>
                  <th style="border-bottom:1px solid var(--color-border); background:none; padding:0.5rem 1rem; text-align:right;">初穂料合計</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList.map(([name, stats]) => `
                  <tr>
                    <td style="padding:0.5rem 1rem;">${name}</td>
                    <td style="padding:0.5rem 1rem; text-align:right;">${stats.quantity} 体</td>
                    <td style="padding:0.5rem 1rem; text-align:right; font-weight:700;">¥${stats.total.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }).join('');
    }
    
  } else if (type === 'stock-alert') {
    title = '全授与品 在庫状況一覧（在庫の少ない順）';
    const sortedItems = [...state.items].filter(i => i.display).sort((a,b) => a.stock - b.stock);
    
    html = `
      <table class="detail-modal-table">
        <thead>
          <tr>
            <th>授与品名 (ID)</th>
            <th style="text-align:center;">カテゴリ</th>
            <th style="text-align:right;">初穂料</th>
            <th style="text-align:right; width: 120px;">現在の在庫数</th>
          </tr>
        </thead>
        <tbody>
          ${sortedItems.map(item => {
            const catNameMap = { ofuda: 'お札', omamori: 'お守り', goshuin: '御朱印', engimono: '縁起物', other: 'その他' };
            const catName = catNameMap[item.category] || 'その他';
            let badgeClass = 'badge-other';
            if (catName === 'お札') badgeClass = 'category-badge badge-ofuda';
            else if (catName === 'お守り') badgeClass = 'category-badge badge-omamori';
            else if (catName === '御朱印') badgeClass = 'category-badge badge-goshuin';
            else if (catName === '縁起物') badgeClass = 'category-badge badge-engimono';
            
            let stockStyle = 'font-weight:700; color:var(--color-green);';
            if (item.stock === 0) stockStyle = 'font-weight:700; color:var(--color-vermilion); background-color:rgba(217,75,52,0.1); padding: 0.2rem 0.4rem; border-radius:4px;';
            else if (item.stock <= state.dashboard.alertThreshold) stockStyle = 'font-weight:700; color:var(--color-vermilion);';
            
            return `
              <tr>
                <td><strong>${item.name}</strong> <small style="color:var(--color-text-muted);">(${item.id})</small></td>
                <td style="text-align:center;"><span class="${badgeClass}" style="font-size:0.75rem; padding: 0.15rem 0.4rem; border-radius:4px; font-weight:700;">${catName}</span></td>
                <td style="text-align:right;">¥${item.price.toLocaleString()}</td>
                <td style="text-align:right;"><span style="${stockStyle}">${item.stock.toLocaleString()} 体</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
  } else if (type === 'timeline') {
    title = '本日の取引明細一覧 (全件)';
    const todayStr = getJstDateString(now);
    const todayTxs = state.dashboard.rangeTransactions.filter(tx => tx.date === todayStr);
    
    const grouped = {};
    todayTxs.forEach(tx => {
      if (!grouped[tx.transactionId]) {
        let timeStr = tx.timestamp;
        const dateObj = new Date(tx.timestamp);
        if (!isNaN(dateObj.getTime())) {
          timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
        }
        grouped[tx.transactionId] = {
          id: tx.transactionId,
          time: timeStr,
          items: [],
          total: 0,
          status: tx.status || '有効'
        };
      }
      grouped[tx.transactionId].items.push(`${tx.itemName} × ${tx.quantity}`);
      if (tx.status === '有効' || tx.status === 'true') {
        grouped[tx.transactionId].total += tx.subtotal;
      }
    });
    
    const list = Object.values(grouped).sort((a,b) => b.id.localeCompare(a.id));
    
    if (list.length === 0) {
      html = '<p style="text-align:center; padding:2rem; color:var(--color-text-muted);">本日の取引履歴はまだありません。</p>';
    } else {
      html = `
        <table class="detail-modal-table">
          <thead>
            <tr>
              <th>時刻</th>
              <th>取引ID</th>
              <th>内訳</th>
              <th style="text-align:right;">合計初穂料</th>
              <th style="text-align:center;">状態</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(tx => {
              const isCanceled = tx.status === '取消';
              const rowStyle = isCanceled ? 'opacity: 0.6; text-decoration: line-through; background-color: rgba(0,0,0,0.02);' : '';
              const statusBadge = isCanceled ? 
                '<span style="background-color:rgba(217,75,52,0.1); color:var(--color-vermilion); font-size:0.75rem; padding:0.15rem 0.4rem; border-radius:4px; font-weight:700;">取消済</span>' : 
                '<span style="background-color:rgba(63,81,69,0.1); color:var(--color-green); font-size:0.75rem; padding:0.15rem 0.4rem; border-radius:4px; font-weight:700;">有効</span>';
                
              return `
                <tr style="${rowStyle}">
                  <td style="font-weight:700;">${tx.time}</td>
                  <td style="font-family:monospace; font-size:0.8rem;">${tx.id}</td>
                  <td>${tx.items.join(', ')}</td>
                  <td style="text-align:right; font-weight:700; color:${isCanceled ? 'var(--color-text-muted)' : 'var(--color-green)'};">¥${tx.total.toLocaleString()}</td>
                  <td style="text-align:center;">${statusBadge}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  }
  
  titleEl.innerHTML = `<i class="fa-solid fa-magnifying-glass-chart" style="color:var(--color-green); margin-right:0.5rem;"></i> ${title}`;
  contentEl.innerHTML = html;
  modal.style.display = 'flex';
}

