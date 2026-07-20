/**
 * 神社向け授与品レジ＆ご祈祷合算システム - フロントエンドロジック (並び替え整理＆共有メモ完全版)
 */

// ==========================================
// 設定値
// ==========================================
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbz25_WoXF1NJnUNNc1fT8SX5RuvRsYO_zxPtABH4Rk_R3Z-xOGrcBMUciaCS5-tmtnb/exec';

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
// アプリケーション状態管理 (State)
// ==========================================
const state = {
  items: [],
  cart: [],
  transactions: [],
  currentTab: 'register',
  selectedCategory: 'all',
  searchQuery: '',
  selectedDate: '',
  isUsingMock: false,
  cancelTargetTxId: null,
  
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
    register: document.getElementById('tab-register'),
    history: document.getElementById('tab-history'),
    report: document.getElementById('tab-report'),
    master: document.getElementById('tab-master')
  },
  panels: {
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
  
  // マスタ画面
  masterGrid: document.getElementById('master-grid'),
  btnShowAddItem: document.getElementById('btn-show-add-item'),
  
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
  memoStatus: document.getElementById('memo-status')
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

  DOM.btnSync.addEventListener('click', () => {
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

  DOM.btnGenerateReport.addEventListener('click', generateDailyReport);
  DOM.btnPrintReport.addEventListener('click', () => window.print());
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

  if (tabKey === 'register') {
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
        let category = item.category || 'other';
        if (!item.category) {
          if (item.name.includes('札') || item.name.includes('守札')) category = 'ofuda';
          else if (item.name.includes('守') || item.name.includes('まもり')) category = 'omamori';
          else if (item.name.includes('朱印')) category = 'goshuin';
          else if (item.name.includes('絵馬') || item.name.includes('置物') || item.name.includes('矢')) category = 'engimono';
        }
        let stock = Number(item.stock);
        if (isNaN(stock)) stock = 0;
        
        return { ...item, stock, category };
      });
      
      // 保存済みの並び順でソート
      state.items = sortItemsBySavedOrder(apiItems);
      renderItems();
      renderMasterGrid();
      if (forceReload) showToast('マスタデータをスプレッドシートと同期しました。', 'success');
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast('接続に失敗したため、デモ用モックデータを使用します。', 'error');
    state.isUsingMock = true;
    state.items = sortItemsBySavedOrder(MOCK_ITEMS);
    renderItems();
    renderMasterGrid();
  } finally {
    showLoader(false);
  }
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
    return;
  }

  showLoader(true);
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
    showToast(`売上登録エラー: ${err.message}`, 'error');
  } finally {
    showLoader(false);
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

// タイムスタンプから指定の分類キーと表示名を返す
function getTransactionGroupInfo(timestampStr, groupType) {
  // Safariや様々なブラウザエンジンとの互換性を確保するため、ハイフン区切りではなくスラッシュ区切りに統一してパースします
  const normalized = timestampStr.replace(/-/g, '/');
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
    const timeA = new Date(groups[a].txs[0].timestamp.replace(/\//g, '-')).getTime();
    const timeB = new Date(groups[b].txs[0].timestamp.replace(/\//g, '-')).getTime();
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
        <td>${tx.timestamp}</td>
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
  const dateObj = new Date(data.date);
  const formattedDate = dateObj.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  
  // 出力項目のチェック状態を取得
  const includeItems = document.getElementById('chk-include-items').checked;
  const includePrayers = document.getElementById('chk-include-prayers').checked;
  
  let itemRowsHtml = '';
  if (Object.keys(data.itemDetails).length === 0) {
    itemRowsHtml = '<tr><td colspan="3" class="text-center">授与履歴なし</td></tr>';
  } else {
    for (let name in data.itemDetails) {
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

  let prayerRowsHtml = '';
  if (!data.prayerDetails || Object.keys(data.prayerDetails).length === 0) {
    prayerRowsHtml = '<tr><td colspan="3" class="text-center">ご祈祷受付なし</td></tr>';
  } else {
    for (let type in data.prayerDetails) {
      const details = data.prayerDetails[type];
      prayerRowsHtml += `
        <tr>
          <td>${type}</td>
          <td class="text-center">${details.count} 件</td>
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

  // ご祈祷内訳セクション
  let prayersSectionHtml = '';
  if (includePrayers) {
    prayersSectionHtml = `
      <h3 style="margin-bottom:0.75rem; border-left:3px solid var(--color-green); padding-left:0.5rem; margin-top:2rem;">ご祈祷 内訳</h3>
      <table class="report-table">
        <thead>
          <tr>
            <th>祈祷種別</th>
            <th style="width: 120px;">件数</th>
            <th style="width: 180px;">初穂料総額</th>
          </tr>
        </thead>
        <tbody>
          ${prayerRowsHtml}
          <tr style="font-weight: bold; background-color: #FAF9F6;">
            <td>ご祈祷 小計</td>
            <td class="text-center">${data.prayerCount} 件</td>
            <td class="text-right">${data.prayerSalesTotal.toLocaleString()} 円</td>
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
      
      <div class="report-summary-boxes">
        <div class="report-sum-box">
          <span style="font-size:0.8rem; color:var(--color-text-muted); display:block; margin-bottom:0.25rem;">授与品 合計初穂料</span>
          <span class="report-sum-value" style="color:var(--color-vermilion);">${data.itemSalesTotal.toLocaleString()} 円</span>
        </div>
        <div class="report-sum-box">
          <span style="font-size:0.8rem; color:var(--color-text-muted); display:block; margin-bottom:0.25rem;">ご祈祷 合計初穂料</span>
          <span class="report-sum-value">${data.prayerSalesTotal.toLocaleString()} 円 (${data.prayerCount}件)</span>
        </div>
        <div class="report-sum-box" style="border-color:var(--color-gold); background-color:rgba(196,162,100,0.05);">
          <span style="font-size:0.8rem; color:var(--color-text-muted); display:block; margin-bottom:0.25rem; font-weight:700;">本日 総合計初穂料</span>
          <span class="report-sum-value" style="color:var(--color-vermilion); font-weight:700;">${data.grandTotal.toLocaleString()} 円</span>
        </div>
      </div>
      
      ${itemsSectionHtml}
      ${prayersSectionHtml}
    </div>
  `;
}

// ==========================================
// マスタ管理画面 (ドラッグ＆ドロップ並び替えソート対応)
// ==========================================
function renderMasterGrid() {
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
