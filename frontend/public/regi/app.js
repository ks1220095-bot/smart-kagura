/**
 * 神社向け授与品レジ＆ご祈祷合算システム - フロントエンドロジック (追加機能対応版)
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
  { id: 'M-01', name: '家内安全御札', price: 1500, description: 'ご家族の健康と安全を祈願した木札です。', stock: 50, category: 'ofuda', remark: '大サイズ' },
  { id: 'M-02', name: '商売繁盛御札', price: 1500, description: '事業繁栄と商売繁盛を祈願した木札です。', stock: 30, category: 'ofuda', remark: '大サイズ' },
  { id: 'M-03', name: '厄除神札', price: 1000, description: 'あらゆる災いを除けるお札です。', stock: 40, category: 'ofuda', remark: '紙札' },
  { id: 'M-04', name: '交通安全お守り', price: 800, description: '日々の交通安全・道中安全を祈願したお守りです。', stock: 120, category: 'omamori', remark: '錦袋・錦色' },
  { id: 'M-05', name: '厄除けお守り', price: 800, description: '災厄を払い、身を守るお守りです。', stock: 5, category: 'omamori', remark: '赤/紫' },
  { id: 'M-06', name: '学業成就お守り', price: 800, description: '学業向上と合格を祈願したお守りです。', stock: 60, category: 'omamori', remark: '錦袋' },
  { id: 'M-07', name: '縁結びお守り', price: 800, description: '良縁と和合を祈願したお守りです。', stock: 15, category: 'omamori', remark: '桃/白' },
  { id: 'M-08', name: '御朱印 (通常)', price: 500, description: '当神社の通常御朱印です。', stock: 200, category: 'goshuin', remark: '記帳・書置き' },
  { id: 'M-09', name: '限定金字御朱印', price: 1000, description: '季節限定の金文字御朱印です。', stock: 25, category: 'goshuin', remark: '書置きのみ' },
  { id: 'M-10', name: '吉祥干支置物', price: 1200, description: '当年の干支を象った縁起の良い置物です。', stock: 35, category: 'engimono', remark: '桐箱入り' },
  { id: 'M-11', name: '破魔矢 (大)', price: 1500, description: '魔を除け、幸運を射止める破魔矢です。', stock: 45, category: 'engimono', remark: '絵馬付き' },
  { id: 'M-12', name: '御朱印帳 (和柄)', price: 2000, description: '当神社オリジナルの御朱印帳です。', stock: 25, category: 'other', remark: '限定版' },
  { id: 'M-13', name: '絵馬', price: 700, description: '祈願を書くための木製絵馬です。', stock: 80, category: 'other', remark: '干支デザイン' }
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
  items: [],          // 授与品マスタ
  cart: [],           // カート内: { id, name, price, quantity, maxStock }
  transactions: [],   // 当日取引履歴: { transactionId, timestamp, items: [], total, status: '有効'/'取消' }
  currentTab: 'register',
  selectedCategory: 'all',
  searchQuery: '',
  selectedDate: '',
  isUsingMock: false,
  cancelTargetTxId: null
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
  // 履歴画面
  historyTableBody: document.getElementById('history-table-body'),
  btnRefreshHistory: document.getElementById('btn-refresh-history'),
  // 報告書画面
  reportDate: document.getElementById('report-date'),
  btnGenerateReport: document.getElementById('btn-generate-report'),
  btnPrintReport: document.getElementById('btn-print-report'),
  reportSheetView: document.getElementById('report-sheet-view'),
  // マスタ画面
  masterTableBody: document.getElementById('master-table-body'),
  // モーダル
  modalCheckoutSuccess: document.getElementById('modal-checkout-success'),
  modalChangeText: document.getElementById('modal-change-text'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  
  modalCancelConfirm: document.getElementById('modal-cancel-confirm'),
  cancelTargetTxIdText: document.getElementById('cancel-target-txid'),
  btnCancelConfirmNo: document.getElementById('btn-cancel-confirm-no'),
  btnCancelConfirmYes: document.getElementById('btn-cancel-confirm-yes'),
  // 通知
  toastContainer: document.getElementById('toast-container')
};

// ==========================================
// 初期化処理
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupDateTime();
  setupEventListeners();
  loadMasterData();
});

// 日付の設定
function setupDateTime() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  DOM.currentDate.textContent = now.toLocaleDateString('ja-JP', options);
  
  // レポート対象日付のデフォルト値 (今日)
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  state.selectedDate = `${yyyy}-${mm}-${dd}`;
  DOM.reportDate.value = state.selectedDate;
}

// イベントリスナーのセットアップ
function setupEventListeners() {
  // タブ切り替え
  Object.keys(DOM.tabs).forEach(tabKey => {
    DOM.tabs[tabKey].addEventListener('click', () => switchTab(tabKey));
  });

  // マスタ同期ボタン
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

  // お預かり金入力とお釣り計算
  DOM.cashReceived.addEventListener('input', calculateChange);
  
  // お預かり金プリセットボタン
  DOM.presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const val = parseInt(e.target.dataset.value);
      if (!isNaN(val)) {
        DOM.cashReceived.value = val;
        calculateChange();
      }
    });
  });

  DOM.btnExactAmount.addEventListener('click', () => {
    const total = getCartTotal();
    DOM.cashReceived.value = total;
    calculateChange();
  });

  // 会計確定
  DOM.btnCheckout.addEventListener('click', processCheckout);

  // モーダル閉じる
  DOM.btnCloseModal.addEventListener('click', () => {
    DOM.modalCheckoutSuccess.style.display = 'none';
    clearCart();
  });

  // 取引取消モーダル操作
  DOM.btnCancelConfirmNo.addEventListener('click', () => {
    DOM.modalCancelConfirm.style.display = 'none';
    state.cancelTargetTxId = null;
  });

  DOM.btnCancelConfirmYes.addEventListener('click', executeCancelTransaction);

  // 取引履歴の更新ボタン
  DOM.btnRefreshHistory.addEventListener('click', fetchTransactions);

  // 日次報告書
  DOM.btnGenerateReport.addEventListener('click', generateDailyReport);
  DOM.btnPrintReport.addEventListener('click', () => window.print());
  DOM.reportDate.addEventListener('change', (e) => {
    state.selectedDate = e.target.value;
  });
}

// ==========================================
// タブ切り替え制御
// ==========================================
function switchTab(tabKey) {
  state.currentTab = tabKey;
  
  // タブボタンのアクティブ表示切り替え
  Object.keys(DOM.tabs).forEach(key => {
    const isActive = key === tabKey;
    DOM.tabs[key].classList.toggle('active', isActive);
    DOM.tabs[key].setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // パネルの表示切り替え
  Object.keys(DOM.panels).forEach(key => {
    DOM.panels[key].classList.toggle('active', key === tabKey);
  });

  if (tabKey === 'history') {
    fetchTransactions();
  }
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
    renderMasterTable();
    return;
  }

  showLoader(true);
  try {
    const res = await fetch(`${GAS_API_URL}?action=getMaster`);
    const data = await res.json();
    
    if (data.status === 'success') {
      state.items = data.items.map(item => {
        let category = 'other';
        if (item.name.includes('札') || item.name.includes('守札')) category = 'ofuda';
        else if (item.name.includes('守') || item.name.includes('まもり')) category = 'omamori';
        else if (item.name.includes('朱印')) category = 'goshuin';
        else if (item.name.includes('絵馬') || item.name.includes('置物') || item.name.includes('矢')) category = 'engimono';
        
        return { ...item, category };
      });
      renderItems();
      renderMasterTable();
      if (forceReload) showToast('マスタデータをスプレッドシートと同期しました。', 'success');
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast('スプレッドシートからのデータ取得に失敗しました。モックデータを使用します。', 'error');
    state.isUsingMock = true;
    state.items = MOCK_ITEMS;
    renderItems();
    renderMasterTable();
  } finally {
    showLoader(false);
  }
}

// 会計の確定処理
async function processCheckout() {
  const total = getCartTotal();
  const cash = parseInt(DOM.cashReceived.value) || 0;
  
  if (cash < total) {
    showToast('お預かり金が合計金額に満たないため、会計できません。', 'error');
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
    
    showCheckoutSuccess(change);
    renderItems();
    renderMasterTable();
    return;
  }

  DOM.btnCheckout.disabled = true;
  DOM.btnCheckout.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> 登録中...';

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
      showCheckoutSuccess(change);
      renderItems();
      renderMasterTable();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast(`売上登録エラー: ${err.message}`, 'error');
  } finally {
    DOM.btnCheckout.disabled = false;
    DOM.btnCheckout.innerHTML = '<i class="fa-solid fa-check"></i> 会計を確定する';
  }
}

// 取引履歴の取得
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
    DOM.historyTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center" style="color: var(--color-vermilion);">履歴の取得に失敗しました。</td>
      </tr>
    `;
  }
}

// 取引の取り消し実行
async function executeCancelTransaction() {
  const txId = state.cancelTargetTxId;
  if (!txId) return;

  DOM.btnCancelConfirmYes.disabled = true;
  DOM.btnCancelConfirmYes.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> 取消中...';

  if (state.isUsingMock) {
    const tx = state.transactions.find(t => t.transactionId === txId);
    if (tx && tx.status !== '取消') {
      tx.status = '取消';
      
      tx.items.forEach(txItem => {
        const match = state.items.find(item => item.id === txItem.id);
        if (match) match.stock += txItem.quantity;
      });

      showToast(`取引 ${txId} を取り消し、在庫を復元しました。`, 'success');
      DOM.modalCancelConfirm.style.display = 'none';
      state.cancelTargetTxId = null;
      renderItems();
      renderMasterTable();
      renderHistoryTable();
    }
    DOM.btnCancelConfirmYes.disabled = false;
    DOM.btnCancelConfirmYes.textContent = '取り消す';
    return;
  }

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
      renderMasterTable();
      renderHistoryTable();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast(`取引取消エラー: ${err.message}`, 'error');
  } finally {
    DOM.btnCancelConfirmYes.disabled = false;
    DOM.btnCancelConfirmYes.textContent = '取り消す';
  }
}

// 日次報告書の集計
async function generateDailyReport() {
  if (!state.selectedDate) {
    showToast('日付を選択してください。', 'error');
    return;
  }

  DOM.btnGenerateReport.disabled = true;
  DOM.btnGenerateReport.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> 集計中...';
  
  DOM.reportSheetView.innerHTML = `
    <div class="loading-spinner">
      <i class="fa-solid fa-circle-notch fa-spin"></i> 売上およびご祈祷データを集計中...
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
      DOM.btnGenerateReport.disabled = false;
      DOM.btnGenerateReport.innerHTML = '<i class="fa-solid fa-file-shield"></i> 日次報告書を集計・同期';
      DOM.btnPrintReport.disabled = false;
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
      showToast('日次売上・ご祈祷データをスプレッドシートへ同期しました。', 'success');
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast(`日次報告書の作成に失敗しました: ${err.message}`, 'error');
    DOM.reportSheetView.innerHTML = `
      <div class="report-empty-state">
        <i class="fa-solid fa-triangle-exclamation empty-icon" style="color: var(--color-vermilion);"></i>
        <p>エラーが発生しました。スプレッドシート接続および設定をご確認ください。<br>${err.message}</p>
      </div>
    `;
  } finally {
    DOM.btnGenerateReport.disabled = false;
    DOM.btnGenerateReport.innerHTML = '<i class="fa-solid fa-file-shield"></i> 日次報告書を集計・同期';
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
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    DOM.itemsGrid.innerHTML = `
      <div class="loading-spinner" style="grid-column:1/-1;">
        <i class="fa-solid fa-leaf" style="color: var(--color-border);"></i>
        該当する授与品が見つかりません。
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
      <div class="item-image-wrapper">
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
// カート操作ロジック
// ==========================================
function addToCart(item, quantity = 1) {
  const existing = state.cart.find(cartItem => cartItem.id === item.id);
  
  if (existing) {
    const totalQty = existing.quantity + quantity;
    if (totalQty > item.stock) {
      showToast(`「${item.name}」の在庫上限 (${item.stock}個) を超えてカートに追加できません。(現在カート内: ${existing.quantity}個)`, 'error');
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
  showToast(`${item.name}を ${quantity}体 カートに追加しました。`, 'success');
}

function updateQuantity(itemId, change) {
  const cartItem = state.cart.find(item => item.id === itemId);
  if (!cartItem) return;

  const newQty = cartItem.quantity + change;
  if (newQty <= 0) {
    state.cart = state.cart.filter(item => item.id !== itemId);
  } else {
    if (newQty > cartItem.maxStock) {
      showToast(`在庫上限 (${cartItem.maxStock}個) を超える数量は指定できません。`, 'error');
      return;
    }
    cartItem.quantity = newQty;
  }
  
  updateCartUI();
}

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function updateCartUI() {
  DOM.cartItemsList.innerHTML = '';
  
  if (state.cart.length === 0) {
    DOM.cartItemsList.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-leaf empty-icon"></i>
        <p>カートは空です。<br>授与品の数量を選択し、「追加」ボタンを押してください。</p>
      </div>
    `;
    DOM.cartTotalPrice.textContent = '0 円';
    DOM.btnCheckout.disabled = true;
    DOM.cashReceived.value = '';
    calculateChange();
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
// 取引履歴 UI描画
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
    
    let detailsHtml = '<ul class="history-details-list">';
    tx.items.forEach(item => {
      detailsHtml += `<li class="history-details-item">${item.name} (${item.price.toLocaleString()}円) × ${item.quantity}</li>`;
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
// 日次報告書 描画ロジック
// ==========================================
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
    prayerRowsHtml = '<tr><td colspan="3" class="text-center">ご祈祷の受付履歴なし</td></tr>';
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
        <div class="report-paper-meta">
          <span>奉仕日: ${formattedDate}</span>
          <span>作成日: ${new Date().toLocaleDateString('ja-JP')}</span>
        </div>
      </div>
      
      <div class="report-summary-boxes">
        <div class="report-sum-box">
          <span class="report-sum-label">授与品 合計初穂料</span>
          <span class="report-sum-value">${data.itemSalesTotal.toLocaleString()} 円</span>
        </div>
        <div class="report-sum-box">
          <span class="report-sum-label">ご祈祷 合計初穂料</span>
          <span class="report-sum-value">${data.prayerSalesTotal.toLocaleString()} 円 (計 ${data.prayerCount}件)</span>
        </div>
        <div class="report-sum-box highlight">
          <span class="report-sum-label">本日 総合計初穂料</span>
          <span class="report-sum-value">${data.grandTotal.toLocaleString()} 円</span>
        </div>
      </div>
      
      <h3 class="report-section-title">授与品 内訳</h3>
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
      
      <h3 class="report-section-title">ご祈祷 内訳 (自動連携)</h3>
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
// マスタ画面 描画ロジック
// ==========================================
function renderMasterTable() {
  DOM.masterTableBody.innerHTML = '';
  
  state.items.forEach(item => {
    const row = document.createElement('tr');
    
    let imgHtml = `<div class="master-table-img" style="display:flex; align-items:center; justify-content:center; background-color:var(--color-light-gray); color:var(--color-text-muted);"><i class="fa-solid fa-om"></i></div>`;
    if (item.imageUrl) {
      imgHtml = `<img src="${item.imageUrl}" alt="${item.name}" class="master-table-img" onerror="this.outerHTML='<div class=&quot;master-table-img&quot; style=&quot;display:flex; align-items:center; justify-content:center; background-color:var(--color-light-gray); color:var(--color-text-muted);&quot;><i class=&quot;fa-solid fa-om&quot;></i></div>'">`;
    }

    row.innerHTML = `
      <td>${item.id}</td>
      <td>${imgHtml}</td>
      <td style="font-weight:600;">${item.name}</td>
      <td class="master-table-price">${item.price.toLocaleString()} 円</td>
      <td>
        <span class="badge-stock" id="badge-stock-${item.id}">${item.stock}</span>
      </td>
      <td>
        <div class="stock-adjust-group">
          <input type="number" id="adjust-input-${item.id}" class="stock-input" value="${item.stock}" min="0">
          <button class="btn-adjust" onclick="adjustStock('${item.id}')">反映</button>
        </div>
      </td>
      <td style="font-size:0.85rem; color:var(--color-text-muted);">${item.remark || '-'}</td>
    `;
    DOM.masterTableBody.appendChild(row);
  });
}

async function adjustStock(itemId) {
  const input = document.getElementById(`adjust-input-${itemId}`);
  const newStock = parseInt(input.value);
  
  if (isNaN(newStock) || newStock < 0) {
    showToast('有効な数値を入力してください。', 'error');
    return;
  }

  const match = state.items.find(item => item.id === itemId);
  if (!match) return;

  if (state.isUsingMock) {
    match.stock = newStock;
    document.getElementById(`badge-stock-${itemId}`).textContent = newStock;
    showToast(`${match.name}の在庫数を${newStock}個に変更しました(デモ)。`, 'success');
    renderItems();
    return;
  }
  showToast('在庫の調整はスプレッドシートのマスタ上で直接行うか、GASの更新機能（本番）をご利用ください。', 'info');
}

// ==========================================
// 共通UIユーティリティ
// ==========================================
function showLoader(show) {
  if (show) {
    DOM.itemsGrid.innerHTML = `
      <div class="loading-spinner">
        <i class="fa-solid fa-circle-notch fa-spin"></i>
        <span>データを同期しています...</span>
      </div>
    `;
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
