/**
 * 神社向け授与品レジ＆ご祈祷合算システム - フロントエンドロジック (ビジュアル編集・レスポンシブ・ジェスチャー完全版)
 */

// ==========================================
// 設定値
// ==========================================
// デプロイしたGASのウェブアプリURLを設定してください
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwf6XuzV04Vna-0QF8MoeI4GihPm71Vyfzzd4jURcvdeky2TC8vfZtEz2n4KN1AFEEB/exec';

// ==========================================
// ローカルモックデータ (GAS未設定時のフォールバック用)
// ==========================================
const MOCK_ITEMS = [
  { id: 'M-01', name: '家内安全御札', price: 1500, description: 'ご家族の健康と安全を祈願した木札です。', stock: 50, category: 'ofuda', remark: '大サイズ', display: true, imageUrl: '' },
  { id: 'M-02', name: '商売繁盛御札', price: 1500, description: 'ご事業の繁栄と商売の繁盛を祈願した木札です。', stock: 30, category: 'ofuda', remark: '大サイズ', display: true, imageUrl: '' },
  { id: 'M-03', name: '交通安全お守り', price: 800, description: '日々の交通安全・道中安全を祈願したお守りです。', stock: 100, category: 'omamori', remark: '錦袋', display: true, imageUrl: '' },
  { id: 'M-04', name: '厄除けお守り', price: 800, description: '災厄を払い、身を守るお守りです。', stock: 5, category: 'omamori', remark: '赤/紫', display: true, imageUrl: '' },
  { id: 'M-05', name: '授与用通常御朱印', price: 500, description: '当神社の通常御朱印です。', stock: 200, category: 'goshuin', remark: '記帳・書置き', display: true, imageUrl: '' },
  { id: 'M-06', name: '限定金字御朱印', price: 1000, description: '季節限定の金文字御朱印です。', stock: 50, category: 'goshuin', remark: '書置きのみ', display: true, imageUrl: '' },
  { id: 'M-07', name: '吉祥干支置物', price: 1200, description: '当年の干支を象った縁起の良い置物です。', stock: 40, category: 'engimono', remark: '箱入り', display: true, imageUrl: '' },
  { id: 'M-08', name: '破魔矢', price: 1500, description: '魔を除け、幸運を射止める破魔矢です。', stock: 60, category: 'engimono', remark: '絵馬付き', display: true, imageUrl: '' },
  { id: 'M-09', name: '御朱印帳 (和柄)', price: 2000, description: '当神社オリジナルの御朱印帳です。', stock: 20, category: 'other', remark: '限定版', display: true, imageUrl: '' },
  { id: 'M-10', name: '祈願絵馬', price: 700, description: '願い事を書くための木製絵馬です。', stock: 80, category: 'other', remark: '干支デザイン', display: true, imageUrl: '' }
];

const MOCK_PRAYERS = {
  '2026-07-18': [
    { type: '個人祈祷 (家内安全)', count: 3, amount: 15000 },
    { type: '個人祈祷 (厄除け)', count: 2, amount: 10000 },
    { type: '会社・団体祈祷', count: 1, amount: 30000 }
  ]
};

// ==========================================
// アプリケーション状態管理 (State)
// ==========================================
const state = {
  items: [],              // 授与品マスタ
  cart: [],               // カート内
  transactions: [],       // 当日取引履歴
  currentTab: 'register',
  selectedCategory: 'all',
  searchQuery: '',
  selectedDate: '',
  isUsingMock: false,
  cancelTargetTxId: null,
  
  // カラム数およびジェスチャー管理
  gridCols: 2,            // デフォルト列数
  pinchCooldown: false,
  
  // 新規追加時の画像キャッシュ
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
  presetBtns: document.querySelectorAll('.preset-btn'),
  btnExactAmount: document.getElementById('btn-exact-amount'),
  
  // カラム数調整ボタン
  colsBtns: document.querySelectorAll('#panel-register .col-ctrl-btn'),
  masterColsBtns: document.querySelectorAll('#master-cols-controller .col-ctrl-btn'),
  
  // スマホ用フローティングカート関係
  mobileCartBar: document.getElementById('mobile-cart-bar'),
  mobileCartCount: document.getElementById('mobile-cart-count'),
  mobileCartTotal: document.getElementById('mobile-cart-total'),
  mobileCartSheet: document.getElementById('mobile-cart-sheet'),
  mobileCartBackdrop: document.getElementById('mobile-cart-backdrop'),
  btnCloseMobileCart: document.getElementById('btn-close-mobile-cart'),
  mobileCartItemsListContainer: document.getElementById('mobile-cart-items-list-container'),
  mobileCartSummaryContainer: document.getElementById('mobile-cart-summary-container'),
  
  // 拡大写真・詳細モーダル
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

  // 取引履歴
  historyTableBody: document.getElementById('history-table-body'),
  btnRefreshHistory: document.getElementById('btn-refresh-history'),
  
  // 日次報告書
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

  // 会計成功モーダル
  modalCheckoutSuccess: document.getElementById('modal-checkout-success'),
  modalChangeText: document.getElementById('modal-change-text'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  
  // 取消確認モーダル
  modalCancelConfirm: document.getElementById('modal-cancel-confirm'),
  cancelTargetTxIdText: document.getElementById('cancel-target-txid'),
  btnCancelConfirmNo: document.getElementById('btn-cancel-confirm-no'),
  btnCancelConfirmYes: document.getElementById('btn-cancel-confirm-yes'),
  
  toastContainer: document.getElementById('toast-container')
};

// ==========================================
// 初期化
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupDateTime();
  setupEventListeners();
  loadGridColsSetting();
  loadMasterData();
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
  // レジ画面グリッドクラスの適用
  DOM.itemsGrid.className = `items-grid cols-${state.gridCols}`;
  // マスタ画面グリッドクラスの適用
  DOM.masterGrid.className = `items-grid cols-${state.gridCols}`;
  
  // アクティブボタン表示の切り替え (レジ側)
  DOM.colsBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.cols) === state.gridCols);
  });
  
  // アクティブボタン表示の切り替え (マスタ側)
  DOM.masterColsBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.cols) === state.gridCols);
  });
  
  localStorage.setItem('regi_grid_cols', state.gridCols);
}

// ==========================================
// タッチジェスチャー（ピンチイン・アウト）検知
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
    
    // ピンチアウト (拡大: 列数を減らす)
    if (ratio > 1.35) {
      if (state.gridCols > 1) {
        state.gridCols--;
        updateGridColsUI();
        triggerPinchCooldown();
      }
    }
    // ピンチイン (縮小: 列数を増やす)
    else if (ratio < 0.70) {
      if (state.gridCols < 4) {
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
  }, 400); // 連続動作のクールダウン
}

// ==========================================
// イベントリスナーのセットアップ
// ==========================================
function setupEventListeners() {
  // タブ切り替え
  Object.keys(DOM.tabs).forEach(tabKey => {
    DOM.tabs[tabKey].addEventListener('click', () => switchTab(tabKey));
  });

  // 同期ボタン
  DOM.btnSync.addEventListener('click', () => loadMasterData(true));

  // 検索・フィルタ
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

  // レジのカラム調整ボタン
  DOM.colsBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cols = parseInt(btn.dataset.cols) || 2;
      state.gridCols = cols;
      updateGridColsUI();
    });
  });

  // マスタのカラム調整ボタン
  DOM.masterColsBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cols = parseInt(btn.dataset.cols) || 2;
      state.gridCols = cols;
      updateGridColsUI();
    });
  });

  // ピンチジェスチャーのリスナー登録
  DOM.itemsGrid.addEventListener('touchstart', handleTouchStart, { passive: true });
  DOM.itemsGrid.addEventListener('touchmove', handleTouchMove, { passive: true });
  DOM.itemsGrid.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  DOM.masterGrid.addEventListener('touchstart', handleTouchStart, { passive: true });
  DOM.masterGrid.addEventListener('touchmove', handleTouchMove, { passive: true });
  DOM.masterGrid.addEventListener('touchend', handleTouchEnd, { passive: true });

  // カート内のお釣り計算
  DOM.cashReceived.addEventListener('input', calculateChange);
  
  DOM.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.value);
      if (!isNaN(val)) {
        DOM.cashReceived.value = val;
        calculateChange();
      }
    });
  });

  DOM.btnExactAmount.addEventListener('click', () => {
    DOM.cashReceived.value = getCartTotal();
    calculateChange();
  });

  // 会計確定
  DOM.btnCheckout.addEventListener('click', processCheckout);

  // 会計完了モーダルクローズ
  DOM.btnCloseModal.addEventListener('click', () => {
    DOM.modalCheckoutSuccess.style.display = 'none';
    clearCart();
  });

  // 写真詳細・拡大モーダル
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

  // 取引取消モーダル
  DOM.btnCancelConfirmNo.addEventListener('click', () => {
    DOM.modalCancelConfirm.style.display = 'none';
    state.cancelTargetTxId = null;
  });

  DOM.btnCancelConfirmYes.addEventListener('click', executeCancelTransaction);

  // 履歴更新
  DOM.btnRefreshHistory.addEventListener('click', fetchTransactions);

  // 日次報告
  DOM.btnGenerateReport.addEventListener('click', generateDailyReport);
  DOM.btnPrintReport.addEventListener('click', () => window.print());
  DOM.reportDate.addEventListener('change', (e) => {
    state.selectedDate = e.target.value;
  });

  // スマホ用ハーフシートカート制御
  DOM.mobileCartBar.addEventListener('click', openMobileCart);
  DOM.btnCloseMobileCart.addEventListener('click', closeMobileCart);
  DOM.mobileCartBackdrop.addEventListener('click', closeMobileCart);

  // 新規授与品登録モーダル
  DOM.btnShowAddItem.addEventListener('click', () => {
    resetAddItemForm();
    DOM.modalAddItem.style.display = 'flex';
  });
  
  DOM.btnCloseAddModal.addEventListener('click', () => {
    DOM.modalAddItem.style.display = 'none';
  });
  
  DOM.formAddItem.addEventListener('submit', handleAddItemSubmit);

  // 新規追加ドラッグ＆ドロップドラッグイベント
  setupDragAndDrop(DOM.addItemDropzone, DOM.addItemFile, DOM.addItemImagePreview, (fileData) => {
    state.pendingAddImage = fileData;
  });
}

// ==========================================
// ドラッグ＆ドロップの共通設定
// ==========================================
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
    
    // ドロップゾーン内のテキストとアイコンを隠す
    const children = previewImg.parentElement.children;
    for (let child of children) {
      if (child !== previewImg && child !== previewImg.parentElement.querySelector('input[type="file"]')) {
        child.style.display = 'none';
      }
    }
    
    callback({
      data: e.target.result, // base64 DataURL
      name: file.name
    });
  };
  reader.readAsDataURL(file);
}

// ==========================================
// タブ切り替え
// ==========================================
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

  if (tabKey === 'history') {
    fetchTransactions();
  } else if (tabKey === 'master') {
    renderMasterGrid();
  }
}

// ==========================================
// モバイルカートハーフシート制御
// ==========================================
function openMobileCart() {
  if (state.cart.length === 0) return;
  DOM.mobileCartSheet.classList.add('open');
  
  // デスクトップ用カートのアイテムと計算部をハーフシート側に複製投影する
  DOM.mobileCartItemsListContainer.innerHTML = DOM.cartItemsList.innerHTML;
  
  // 合計、インプット、お釣り部分を複製
  DOM.mobileCartSummaryContainer.innerHTML = `
    <div class="summary-row font-large" style="margin-bottom:1rem;">
      <span>合計初穂料</span>
      <span style="color:var(--color-vermilion); font-family:var(--font-serif); font-weight:700;">${getCartTotal().toLocaleString()} 円</span>
    </div>
    <div class="cash-input-group" style="margin-bottom:1rem;">
      <label for="cash-received-mobile">お預かり金</label>
      <div class="input-with-unit">
        <input type="number" id="cash-received-mobile" class="mobile-cash-input" value="${DOM.cashReceived.value}" placeholder="0">
        <span class="unit">円</span>
      </div>
    </div>
    <div class="summary-row change-row" style="margin-bottom:1rem;">
      <span>お釣り</span>
      <span id="cart-change-amount-mobile">${DOM.cartChangeAmount.textContent}</span>
    </div>
    <button id="btn-checkout-mobile" class="btn-primary btn-block"><i class="fa-solid fa-check"></i> 会計を確定</button>
  `;
  
  // イベントの再バインド
  const cashInputMob = document.getElementById('cash-received-mobile');
  cashInputMob.addEventListener('input', (e) => {
    DOM.cashReceived.value = e.target.value;
    calculateChange();
    document.getElementById('cart-change-amount-mobile').textContent = DOM.cartChangeAmount.textContent;
    document.getElementById('cart-change-amount-mobile').style.color = DOM.cartChangeAmount.style.color;
  });
  
  document.getElementById('btn-checkout-mobile').addEventListener('click', processCheckout);
}

function closeMobileCart() {
  DOM.mobileCartSheet.classList.remove('open');
}

// ==========================================
// データ通信処理
// ==========================================
async function loadMasterData(forceReload = false) {
  if (GAS_API_URL === 'YOUR_GAS_API_URL') {
    if (!state.isUsingMock) {
      showToast('GASのAPI URLが設定されていないため、デモ用のモックデータを使用します。', 'info');
    }
    state.isUsingMock = true;
    state.items = MOCK_ITEMS;
    renderItems();
    renderMasterGrid();
    return;
  }

  showLoader(true);
  try {
    const res = await fetch(`${GAS_API_URL}?action=getMaster`);
    const data = await res.json();
    
    if (data.status === 'success') {
      state.items = data.items.map(item => {
        let category = item.category || 'other';
        if (!item.category) {
          if (item.name.includes('札') || item.name.includes('守札')) category = 'ofuda';
          else if (item.name.includes('守') || item.name.includes('まもり')) category = 'omamori';
          else if (item.name.includes('朱印')) category = 'goshuin';
          else if (item.name.includes('絵馬') || item.name.includes('置物') || item.name.includes('矢')) category = 'engimono';
        }
        return { ...item, category };
      });
      renderItems();
      renderMasterGrid();
      if (forceReload) showToast('マスタデータをスプレッドシートと同期しました。', 'success');
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast('スプレッドシートからの取得に失敗したため、デモ用モックデータを使用します。', 'error');
    state.isUsingMock = true;
    state.items = MOCK_ITEMS;
    renderItems();
    renderMasterGrid();
  } finally {
    showLoader(false);
  }
}

// 会計の確定
async function processCheckout() {
  const total = getCartTotal();
  const cash = parseInt(DOM.cashReceived.value) || 0;
  
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
  const timestamp = now.toLocaleDateString('ja-JP') + ' ' + now.toTimeString().split(' ')[0];

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
    showCheckoutSuccess(change);
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
      showCheckoutSuccess(change);
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

// 取引取消の実行
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
      
      showToast(`取引 ${txId} を正常に取り消しました。`, 'success');
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
// レジ画面 UI描画
// ==========================================
function renderItems() {
  DOM.itemsGrid.innerHTML = '';
  
  const filtered = state.items.filter(item => {
    const matchesCategory = state.selectedCategory === 'all' || item.category === state.selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(state.searchQuery) || item.id.toLowerCase().includes(state.searchQuery);
    const matchesDisplay = item.display !== false; // 非表示設定のものは除外
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
    
    let imageHtml = `<div class="item-image-placeholder"><i class="fa-solid fa-om"></i></div>`;
    if (item.imageUrl) {
      imageHtml = `<img src="${item.imageUrl}" alt="${item.name}" class="item-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="item-image-placeholder" style="display:none;"><i class="fa-solid fa-om"></i></div>`;
    }
    
    let stockClass = '';
    if (item.stock > 0 && item.stock <= 5) stockClass = 'warning';

    let qtyOptions = '';
    const maxSelectQty = Math.min(item.stock, 10);
    for (let q = 1; q <= maxSelectQty; q++) {
      qtyOptions += `<option value="${q}">${q}体</option>`;
    }
    
    card.innerHTML = `
      ${isOutOfStock ? '<span class="stock-badge sold-out">在庫切れ</span>' : ''}
      <div class="item-image-wrapper" id="img-wrapper-${item.id}">
        ${imageHtml}
      </div>
      <div class="item-info">
        <h3 class="item-name">${item.name}</h3>
        <p class="item-desc">${item.description || '説明なし'}</p>
        <div class="item-price-stock">
          <span class="item-price">${item.price.toLocaleString()} 円</span>
          <span class="item-stock ${stockClass}">${isOutOfStock ? '残 0' : `残 ${item.stock}`}</span>
        </div>
        
        <div class="item-qty-selector">
          <select id="qty-select-${item.id}" class="qty-select" ${isOutOfStock ? 'disabled' : ''}>
            ${qtyOptions || '<option value="0">0体</option>'}
          </select>
          <button id="btn-add-${item.id}" class="btn-add-item" ${isOutOfStock ? 'disabled' : ''}>
            <i class="fa-solid fa-plus"></i> 追加
          </button>
        </div>
      </div>
    `;
    
    // 写真タップで拡大表示イベント
    const imgWrapper = card.querySelector(`#img-wrapper-${item.id}`);
    imgWrapper.addEventListener('click', () => {
      showItemDetailPopup(item);
    });

    if (!isOutOfStock) {
      const btnAdd = card.querySelector(`#btn-add-${item.id}`);
      btnAdd.addEventListener('click', (e) => {
        e.stopPropagation();
        const select = card.querySelector(`#qty-select-${item.id}`);
        const qty = parseInt(select.value) || 1;
        addToCart(item, qty);
      });
    }
    DOM.itemsGrid.appendChild(card);
  });
}

// ==========================================
// カート操作
// ==========================================
function addToCart(item, quantity = 1) {
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
  showToast(`${item.name}をカートに追加しました。`, 'success');
}

window.updateQuantity = function(itemId, change) {
  const cartItem = state.cart.find(item => item.id === itemId);
  if (!cartItem) return;

  const newQty = cartItem.quantity + change;
  if (newQty <= 0) {
    state.cart = state.cart.filter(item => item.id !== itemId);
  } else {
    if (newQty > cartItem.maxStock) {
      showToast('在庫上限を超える数量は指定できません。', 'error');
      return;
    }
    cartItem.quantity = newQty;
  }
  
  updateCartUI();
  
  // モバイルハーフシート表示中ならそこも再描画
  if (DOM.mobileCartSheet.classList.contains('open')) {
    DOM.mobileCartItemsListContainer.innerHTML = DOM.cartItemsList.innerHTML;
    // 金額再更新
    openMobileCart();
  }
};

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

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
    
    // スマホ用フローティングバー非表示
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
      </div>
      <span class="cart-item-price">${(item.price * item.quantity).toLocaleString()} 円</span>
    `;
    DOM.cartItemsList.appendChild(row);
  });

  const total = getCartTotal();
  DOM.cartTotalPrice.textContent = `${total.toLocaleString()} 円`;
  DOM.btnCheckout.disabled = false;
  
  // スマホ用フローティングバー更新
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  DOM.mobileCartCount.textContent = totalCount;
  DOM.mobileCartTotal.textContent = `${total.toLocaleString()} 円`;
  
  // レスポンシブ幅（1024px以下）の時のみフローティングバーを表示
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
}

function clearCart() {
  state.cart = [];
  DOM.cashReceived.value = '';
  updateCartUI();
}

function showCheckoutSuccess(change) {
  DOM.modalChangeText.textContent = `${change.toLocaleString()} 円`;
  DOM.modalCheckoutSuccess.style.display = 'flex';
}

// ==========================================
// 写真拡大・詳細ポップアップ表示
// ==========================================
function showItemDetailPopup(item) {
  DOM.detailModalName.textContent = item.name;
  DOM.detailModalPrice.textContent = `${item.price.toLocaleString()} 円`;
  DOM.detailModalDesc.textContent = item.description || '説明なし';
  DOM.detailModalRemark.textContent = item.remark || 'なし';
  
  DOM.detailModalStock.textContent = item.stock <= 0 ? '在庫切れ' : `残 ${item.stock}`;
  DOM.detailModalStock.className = `item-stock ${item.stock <= 5 && item.stock > 0 ? 'warning' : ''}`;
  
  if (item.imageUrl) {
    DOM.detailModalImg.src = item.imageUrl;
    DOM.detailModalImg.style.display = 'block';
  } else {
    DOM.detailModalImg.src = '';
    DOM.detailModalImg.style.display = 'none';
  }
  
  // 数量プルダウン初期化
  DOM.detailModalQty.innerHTML = '';
  const maxQty = Math.min(item.stock, 10);
  if (maxQty <= 0) {
    DOM.detailModalQty.innerHTML = '<option value="0">0体</option>';
    DOM.btnDetailModalAdd.disabled = true;
  } else {
    for (let q = 1; q <= maxQty; q++) {
      DOM.detailModalQty.innerHTML += `<option value="${q}">${q}体</option>`;
    }
    DOM.btnDetailModalAdd.disabled = false;
  }
  DOM.btnDetailModalAdd.dataset.itemId = item.id;
  
  DOM.modalItemDetail.style.display = 'flex';
}

// ==========================================
// 当日取引履歴 描画
// ==========================================
function renderHistoryTable() {
  DOM.historyTableBody.innerHTML = '';

  if (state.transactions.length === 0) {
    DOM.historyTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">本日の取引履歴はありません。</td>
      </tr>
    `;
    return;
  }

  state.transactions.forEach(tx => {
    const row = document.createElement('tr');
    
    let detailsHtml = '<ul class="history-details-list" style="list-style:none; padding:0;">';
    tx.items.forEach(item => {
      detailsHtml += `<li class="history-details-item" style="margin-bottom:0.25rem;">${item.name} (${item.price.toLocaleString()}円) × ${item.quantity}</li>`;
    });
    detailsHtml += '</ul>';

    const isCancelled = tx.status === '取消';
    const statusClass = isCancelled ? 'cancelled' : 'active';
    
    row.innerHTML = `
      <td>${tx.timestamp}</td>
      <td style="font-family: monospace; font-size: 0.85rem;">${tx.transactionId}</td>
      <td>${detailsHtml}</td>
      <td style="font-family: var(--font-serif); font-weight:600; color:var(--color-vermilion);">${tx.total.toLocaleString()} 円</td>
      <td><span class="status-badge ${statusClass}">${tx.status}</span></td>
      <td>
        <button class="btn-cancel-tx" ${isCancelled ? 'disabled' : ''} onclick="confirmCancelTransaction('${tx.transactionId}')">
          <i class="fa-solid fa-trash-can"></i> 取消
        </button>
      </td>
    `;
    DOM.historyTableBody.appendChild(row);
  });
}

window.confirmCancelTransaction = function(txId) {
  state.cancelTargetTxId = txId;
  DOM.cancelTargetTxIdText.textContent = txId;
  DOM.modalCancelConfirm.style.display = 'flex';
};

// ==========================================
// 日次報告書集計
// ==========================================
async function generateDailyReport() {
  if (!state.selectedDate) {
    showToast('日付を選択してください。', 'error');
    return;
  }

  showLoader(true);
  DOM.reportSheetView.innerHTML = `
    <div class="loading-spinner">
      <i class="fa-solid fa-circle-notch fa-spin"></i> 売上・ご祈祷データを集計中...
    </div>
  `;

  if (state.isUsingMock) {
    setTimeout(() => {
      const reportDate = state.selectedDate;
      const prayers = MOCK_PRAYERS[reportDate] || [];
      const prayerSalesTotal = prayers.reduce((sum, p) => sum + p.amount, 0);
      const prayerCount = prayers.reduce((sum, p) => sum + p.count, 0);
      
      const validTx = state.transactions.filter(t => t.status === '有効');
      let itemSalesTotal = 0;
      const itemDetails = {};

      validTx.forEach(tx => {
        tx.items.forEach(item => {
          itemSalesTotal += item.price * item.quantity;
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
    DOM.reportSheetView.innerHTML = `
      <div class="report-empty-state">
        <i class="fa-solid fa-triangle-exclamation empty-icon" style="color:var(--color-vermilion);"></i>
        <p>エラーが発生しました。設定をご確認ください。<br>${err.message}</p>
      </div>
    `;
  } finally {
    showLoader(false);
  }
}

function renderDailyReportView(data) {
  const dateObj = new Date(data.date);
  const formattedDate = dateObj.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  
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

  DOM.reportSheetView.innerHTML = `
    <div class="report-paper">
      <div class="report-paper-header">
        <h2 class="report-paper-title">日次売上報告書</h2>
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
      
      <h3 style="margin-bottom:0.75rem; border-left:3px solid var(--color-vermilion); padding-left:0.5rem;">授与品 内訳</h3>
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
      
      <div class="report-signature">
        <div class="signature-box">宮司 印</div>
        <div class="signature-box">担当者 印</div>
      </div>
    </div>
  `;
}

// ==========================================
// マスタ管理画面 (カード型ビジュアルエディタ) 描画
// ==========================================
function renderMasterGrid() {
  DOM.masterGrid.innerHTML = '';
  
  state.items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.id = `master-card-${item.id}`;
    
    // 非表示マークのオーバーレイ設定
    const isHidden = item.display === false;
    
    let imageHtml = `<div class="item-image-placeholder"><i class="fa-solid fa-om"></i></div>`;
    if (item.imageUrl) {
      imageHtml = `<img src="${item.imageUrl}" alt="${item.name}" class="item-image" id="master-img-view-${item.id}">`;
    }
    
    card.innerHTML = `
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
        <!-- 表示モード表示 -->
        <h3 class="item-name">${item.name}</h3>
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
    
    // イベント処理: 画像ドラッグ＆ドロップとクリックファイル選択
    const dropzone = card.querySelector(`#master-dropzone-${item.id}`);
    const fileInput = card.querySelector(`#master-file-input-${item.id}`);
    const imgElement = card.querySelector(`#master-img-view-${item.id}`) || card.querySelector('.item-image-placeholder');
    const overlay = card.querySelector('.dropzone-overlay');
    
    dropzone.addEventListener('mouseenter', () => overlay.style.display = 'flex');
    dropzone.addEventListener('mouseleave', () => overlay.style.display = 'none');
    
    setupDragAndDrop(dropzone, fileInput, imgElement, async (fileData) => {
      // 画像ドロップ時に即座にGASにアップロード・保存して同期する
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
          showToast('写真をアップデートし、Googleドライブへ保存しました。', 'success');
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

    // イベント: 目（表示/非表示トグル）
    const btnToggle = card.querySelector(`#btn-toggle-display-${item.id}`);
    btnToggle.addEventListener('click', () => toggleItemDisplay(item));

    // イベント: 鉛筆（インライン編集モードへの移行）
    const btnEdit = card.querySelector(`#btn-edit-master-${item.id}`);
    btnEdit.addEventListener('click', () => enterInlineEditMode(item));

    DOM.masterGrid.appendChild(card);
  });
}

// 表示・非表示トグル処理
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
      showToast(`「${item.name}」の表示ステータスを更新しました。`, 'success');
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

// インライン編集モードの描画と処理
function enterInlineEditMode(item) {
  const card = document.getElementById(`master-card-${item.id}`);
  card.classList.add('editing');
  
  const container = document.getElementById(`master-info-container-${item.id}`);
  
  // 編集用の入力欄を生成
  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <div style="display:flex; gap:0.25rem; align-items:center;">
        <label style="font-size:0.75rem; font-weight:700; min-width:45px;">商品名</label>
        <input type="text" id="edit-name-${item.id}" class="edit-input" value="${item.name}">
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
  
  // キャンセルボタン
  document.getElementById(`btn-cancel-edit-${item.id}`).addEventListener('click', () => {
    card.classList.remove('editing');
    renderMasterGrid();
  });
  
  // 保存ボタン
  document.getElementById(`btn-save-edit-${item.id}`).addEventListener('click', async () => {
    const newName = document.getElementById(`edit-name-${item.id}`).value.trim();
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
        showToast('授与品データを保存し、同期しました。', 'success');
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

// ==========================================
// 新規授与品の登録
// ==========================================
function resetAddItemForm() {
  DOM.formAddItem.reset();
  state.pendingAddImage = null;
  DOM.addItemImagePreview.src = '';
  DOM.addItemImagePreview.style.display = 'none';
  
  // ドロップゾーンの中身を初期化
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
    price: parseInt(document.getElementById('add-item-price').value) || 0,
    stock: parseInt(document.getElementById('add-item-stock').value) || 0,
    category: document.getElementById('add-item-category').value,
    remark: document.getElementById('add-item-remark').value.trim(),
    description: document.getElementById('add-item-desc').value.trim(),
    display: true,
    image: state.pendingAddImage // Base64データ
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
      state.items.push({
        ...newItem,
        id: data.item.id,
        imageUrl: data.item.imageUrl
      });
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

// ==========================================
// 共通UIユーティリティ
// ==========================================
function showLoader(show) {
  // グローバルローダーはないため、ローカルのトースト等でフィードバックするか、
  // ロード時に適切な進捗スピナーを置く。今回は同期ボタンやレジグリッドの透明化で対応
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
