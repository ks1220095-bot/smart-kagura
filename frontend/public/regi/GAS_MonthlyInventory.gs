/**
 * 神社授与品レジ・日次報告システム
 * 【月次在庫数・授与数管理 ＆ スプレッドシート自動台帳生成スクリプト】
 * 
 * 既存の Google Apps Script (Code.gs) の末尾に追加、または新規スクリプトファイルとして貼り付けてください。
 */

// ==========================================
// 定数・シート名定義
// ==========================================
var SHEET_MONTHLY_LEDGER = '月次在庫台帳';
var SHEET_ANNUAL_MATRIX = '年間月別推移表';
var SHEET_MASTER = '授与品マスタ';
var SHEET_TRANSACTIONS = '取引履歴';

/**
 * 月次在庫データの取得API (GET action: 'getMonthlyInventory')
 */
function handleGetMonthlyInventory(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var yearMonth = (e && e.parameter && e.parameter.yearMonth) ? e.parameter.yearMonth : Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM');
  
  var ledgerSheet = ss.getSheetByName(SHEET_MONTHLY_LEDGER);
  var lockedItems = [];
  var isLocked = false;
  var status = '未確定（最新集計）';
  var lastUpdated = '';
  var operator = '';

  // 1. 月次在庫台帳にすでに確定・保存データがあるか確認
  if (ledgerSheet && ledgerSheet.getLastRow() > 1) {
    var data = ledgerSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (String(row[0]) === String(yearMonth)) {
        isLocked = true;
        status = row[10] || '確定済';
        lastUpdated = row[12] ? Utilities.formatDate(new Date(row[12]), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm') : '';
        operator = row[13] || '';
        
        lockedItems.push({
          yearMonth: String(row[0]),
          id: String(row[1]),
          name: String(row[2]),
          category: String(row[3]),
          price: Number(row[4]) || 0,
          monthlyDistributed: Number(row[5]) || 0,
          monthlySales: Number(row[6]) || 0,
          calculatedStock: Number(row[7]) || 0,
          monthEndStock: Number(row[8]) || 0,
          diff: Number(row[9]) || 0,
          status: String(row[10] || ''),
          remark: String(row[11] || ''),
          updatedAt: lastUpdated,
          operator: operator
        });
      }
    }
  }

  // 2. 確定データが存在する場合はそれを返却
  if (isLocked && lockedItems.length > 0) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      yearMonth: yearMonth,
      isLocked: true,
      closingStatus: status,
      lastUpdated: lastUpdated,
      operator: operator,
      items: lockedItems
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 3. 未確定の場合は、マスタと取引履歴から動的に集計して暫定データを返却
  var dynamicItems = calculateDynamicMonthlyInventory(ss, yearMonth);
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    yearMonth: yearMonth,
    isLocked: false,
    closingStatus: '最新計算値（未確定）',
    lastUpdated: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm'),
    operator: 'システム自動集計',
    items: dynamicItems
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 月次在庫スナップショットの保存API (POST action: 'saveMonthlySnapshot')
 */
function handleSaveMonthlySnapshot(postData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var yearMonth = postData.yearMonth;
  var items = postData.items || [];
  var operator = postData.operator || '授与所職員';
  var syncMaster = Boolean(postData.syncMaster);
  var closingStatus = postData.closingStatus || '✏️ 職員確定済';
  var nowStr = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

  if (!yearMonth || items.length === 0) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '対象年月または品目データが不足しています。'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 1. 『月次在庫台帳』シートの準備
  var ledgerSheet = getOrCreateSheet(ss, SHEET_MONTHLY_LEDGER, [
    '対象年月', '品目ID', '授与品名', 'カテゴリ', '初穂料',
    '当月授与数', '当月授与額', '計算在庫(理論値)', '実棚卸確定在庫', '棚卸差異',
    '締め区分', '調整理由・メモ', '最終記録日時', '担当者'
  ]);

  // 既存の該当年月レコードを削除（重複防止）
  var data = ledgerSheet.getDataRange().getValues();
  for (var r = data.length - 1; r >= 1; r--) {
    if (String(data[r][0]) === String(yearMonth)) {
      ledgerSheet.deleteRow(r + 1);
    }
  }

  // 新規レコード行の一括生成
  var newRows = [];
  var stockUpdateMap = {}; // マスタ同期用

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var distributed = Number(it.distributed !== undefined ? it.distributed : it.monthlyDistributed) || 0;
    var price = Number(it.price) || 0;
    var sales = Number(it.sales !== undefined ? it.sales : (distributed * price)) || 0;
    var calcStock = Number(it.calculatedStock !== undefined ? it.calculatedStock : it.stock) || 0;
    var actualStock = Number(it.monthEndStock !== undefined ? it.monthEndStock : calcStock);
    var diff = Number(it.diff !== undefined ? it.diff : (actualStock - calcStock)) || 0;
    var remark = String(it.remark || '');

    newRows.push([
      yearMonth,
      it.id || ('M-' + (i + 1)),
      it.name || '',
      it.category || 'other',
      price,
      distributed,
      sales,
      calcStock,
      actualStock,
      diff,
      closingStatus,
      remark,
      nowStr,
      operator
    ]);

    stockUpdateMap[it.id || it.name] = actualStock;
  }

  if (newRows.length > 0) {
    var startRow = ledgerSheet.getLastRow() + 1;
    ledgerSheet.getRange(startRow, 1, newRows.length, newRows[0].length).setValues(newRows);
    
    // 見栄えのフォーマット（数値カンマ区切りなど）
    ledgerSheet.getRange(startRow, 5, newRows.length, 3).setNumberFormat('#,##0');
    ledgerSheet.getRange(startRow, 8, newRows.length, 3).setNumberFormat('#,##0');
  }

  // 2. 『年間月別推移表』シートの自動更新
  updateAnnualMatrixSheet(ss, yearMonth, items);

  // 3. レジ在庫マスタへの連動同期（チェックされている場合）
  if (syncMaster) {
    syncActualStockToMaster(ss, stockUpdateMap);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: yearMonth + '度の月次在庫台帳および年間推移表を正常に保存・更新しました。',
    yearMonth: yearMonth,
    updatedCount: newRows.length
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 毎月1日 午前0時05分 定期自動実行トリガー
 * （前月の実績を完全自動で集計し、スプレッドシートへ保存）
 */
function autoMonthlyCloseSnapshot() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = new Date();
  
  // 前月の年月文字列 (YYYY-MM) を計算
  var prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var prevYearMonth = Utilities.formatDate(prevMonthDate, 'Asia/Tokyo', 'yyyy-MM');
  
  Logger.log('[自動月締め] ' + prevYearMonth + '度の自動集計を開始します...');

  // すでに確定済みの場合は上書きしない
  var ledgerSheet = ss.getSheetByName(SHEET_MONTHLY_LEDGER);
  if (ledgerSheet && ledgerSheet.getLastRow() > 1) {
    var values = ledgerSheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(prevYearMonth) && String(values[i][10]).indexOf('職員確定済') !== -1) {
        Logger.log('[自動月締め] ' + prevYearMonth + '度は既に職員確定済のため自動上書きをスキップします。');
        return;
      }
    }
  }

  // 前月の集計データを動的生成
  var items = calculateDynamicMonthlyInventory(ss, prevYearMonth);
  if (!items || items.length === 0) {
    Logger.log('[自動月締め] 集計対象の授与品が存在しません。');
    return;
  }

  // スナップショット保存
  handleSaveMonthlySnapshot({
    yearMonth: prevYearMonth,
    items: items,
    operator: '🤖 定期自動トリガー',
    closingStatus: '🤖 自動保存済',
    syncMaster: false
  });

  Logger.log('[自動月締め] ' + prevYearMonth + '度の自動保存が完了しました。');
}

/**
 * 未確定月の動的集計ロジック
 */
function calculateDynamicMonthlyInventory(ss, yearMonth) {
  var masterSheet = ss.getSheetByName(SHEET_MASTER);
  var txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  
  var masterItems = [];
  if (masterSheet && masterSheet.getLastRow() > 1) {
    var mData = masterSheet.getDataRange().getValues();
    var mHeaders = mData[0];
    
    // 列インデックスの特定
    var idCol = 0, nameCol = 1, priceCol = 2, stockCol = 3, catCol = 4;
    for (var c = 0; c < mHeaders.length; c++) {
      var h = String(mHeaders[c]).trim();
      if (h === 'ID' || h === '商品ID') idCol = c;
      else if (h === '商品名' || h === '授与品名' || h === '名称') nameCol = c;
      else if (h === '初穂料' || h === '価格' || h === '単価') priceCol = c;
      else if (h === '在庫数' || h === '在庫') stockCol = c;
      else if (h === 'カテゴリ') catCol = c;
    }

    for (var r = 1; r < mData.length; r++) {
      var row = mData[r];
      if (!row[nameCol]) continue;
      masterItems.push({
        id: String(row[idCol] || ('M-' + r)),
        name: String(row[nameCol]),
        price: Number(row[priceCol]) || 0,
        stock: Number(row[stockCol]) || 0,
        category: String(row[catCol] || 'other')
      });
    }
  }

  // 取引履歴から当月分の授与数を集計
  var salesMap = {};
  if (txSheet && txSheet.getLastRow() > 1) {
    var txData = txSheet.getDataRange().getValues();
    var txHeaders = txData[0];
    
    var dateCol = 0, itemDetailsCol = -1, statusCol = -1;
    for (var t = 0; t < txHeaders.length; t++) {
      var th = String(txHeaders[t]).trim();
      if (th === '日時' || th === '取引日時' || th === '日付') dateCol = t;
      else if (th === '内訳' || th === '商品内訳' || th === '授与品内訳' || th === 'items') itemDetailsCol = t;
      else if (th === '状態' || th === 'ステータス') statusCol = t;
    }

    for (var j = 1; j < txData.length; j++) {
      var tRow = txData[j];
      var statusVal = statusCol >= 0 ? String(tRow[statusCol]) : '有効';
      if (statusVal === '取消' || statusVal === 'キャンセル') continue;

      var rawDate = tRow[dateCol];
      var dateStr = '';
      if (rawDate instanceof Date) {
        dateStr = Utilities.formatDate(rawDate, 'Asia/Tokyo', 'yyyy-MM-dd');
      } else {
        dateStr = String(rawDate || '').split(' ')[0];
      }

      if (dateStr.indexOf(yearMonth) === 0) {
        // 当月の取引
        var details = itemDetailsCol >= 0 ? tRow[itemDetailsCol] : '';
        parseTransactionItemsToMap(details, salesMap);
      }
    }
  }

  // マスタと売上を統合して返却
  return masterItems.map(function(item) {
    var dist = salesMap[item.id] || salesMap[item.name] || 0;
    return {
      yearMonth: yearMonth,
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      monthlyDistributed: dist,
      monthlySales: dist * item.price,
      calculatedStock: item.stock,
      monthEndStock: item.stock,
      diff: 0,
      status: '最新計算値',
      remark: ''
    };
  });
}

/**
 * 内訳セルから品目ごとの数量を集計
 */
function parseTransactionItemsToMap(rawDetails, map) {
  if (!rawDetails) return;
  
  // JSON形式の場合
  if (typeof rawDetails === 'string' && (rawDetails.indexOf('[') === 0 || rawDetails.indexOf('{') === 0)) {
    try {
      var parsed = JSON.parse(rawDetails);
      var arr = Array.isArray(parsed) ? parsed : [parsed];
      for (var i = 0; i < arr.length; i++) {
        var it = arr[i];
        var key = it.id || it.name;
        var qty = Number(it.quantity || it.count || 1);
        map[key] = (map[key] || 0) + qty;
        if (it.name && it.name !== key) {
          map[it.name] = (map[it.name] || 0) + qty;
        }
      }
      return;
    } catch (e) {}
  }

  // テキスト形式（例: "家内安全御札 x2, 厄除けお守り x1"）の場合
  var parts = String(rawDetails).split(/[,、\n]/);
  for (var p = 0; p < parts.length; p++) {
    var match = parts[p].match(/^(.*?)[x×*](\d+)/);
    if (match) {
      var name = match[1].trim();
      var count = parseInt(match[2], 10);
      map[name] = (map[name] || 0) + count;
    }
  }
}

/**
 * 『年間月別推移表』シートの生成・更新
 */
function updateAnnualMatrixSheet(ss, yearMonth, items) {
  var parts = yearMonth.split('-');
  var targetYear = parts[0];
  var targetMonth = parseInt(parts[1], 10); // 1〜12

  var sheetName = targetYear + '年_月別推移表';
  var matrixSheet = ss.getSheetByName(sheetName) || ss.getSheetByName(SHEET_ANNUAL_MATRIX);
  
  var headers = [
    '品目ID', '授与品名', '区分',
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月',
    '年間累計授与', '最新月末在庫'
  ];

  if (!matrixSheet) {
    matrixSheet = ss.insertSheet(sheetName);
    matrixSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    matrixSheet.getRange(1, 1, 1, headers.length).setBackground('#3F5145').setFontColor('#FFFFFF').setFontWeight('bold');
    matrixSheet.setFrozenRows(1);
    matrixSheet.setFrozenColumns(3);
  }

  var data = matrixSheet.getDataRange().getValues();
  var rowMap = {}; // itemID_区分 -> 行番号 (1-indexed)

  for (var r = 1; r < data.length; r++) {
    var itemId = String(data[r][0]);
    var rowType = String(data[r][2]); // '授与数' or '月末在庫'
    rowMap[itemId + '_' + rowType] = r + 1;
  }

  // 各品目ごとに「授与数」と「月末在庫」の2行を確保して更新
  var targetCol = 3 + targetMonth; // 1月は第4列 (インデックス4)

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var id = it.id || ('M-' + (i + 1));
    var name = it.name || '';
    var dist = Number(it.distributed !== undefined ? it.distributed : it.monthlyDistributed) || 0;
    var stock = Number(it.monthEndStock !== undefined ? it.monthEndStock : (it.calculatedStock || 0));

    // 1. 授与数行の更新
    var distRow = rowMap[id + '_授与数'];
    if (!distRow) {
      distRow = matrixSheet.getLastRow() + 1;
      var newDistRow = [id, name, '授与数', '', '', '', '', '', '', '', '', '', '', '', '', 0, ''];
      matrixSheet.getRange(distRow, 1, 1, newDistRow.length).setValues([newDistRow]);
      rowMap[id + '_授与数'] = distRow;
    }
    matrixSheet.getRange(distRow, targetCol).setValue(dist);

    // 年間累計数式のセット
    matrixSheet.getRange(distRow, 16).setFormula('=SUM(D' + distRow + ':O' + distRow + ')');

    // 2. 月末在庫行の更新
    var stockRow = rowMap[id + '_月末在庫'];
    if (!stockRow) {
      stockRow = matrixSheet.getLastRow() + 1;
      var newStockRow = [id, name, '月末在庫', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
      matrixSheet.getRange(stockRow, 1, 1, newStockRow.length).setValues([newStockRow]);
      rowMap[id + '_月末在庫'] = stockRow;
      matrixSheet.getRange(stockRow, 1, 1, headers.length).setBackground('#F9FBF9');
    }
    matrixSheet.getRange(stockRow, targetCol).setValue(stock);
    matrixSheet.getRange(stockRow, 17).setValue(stock); // 最新月末在庫
  }
}

/**
 * 実棚卸数を授与品マスタへ同期反映
 */
function syncActualStockToMaster(ss, stockMap) {
  var masterSheet = ss.getSheetByName(SHEET_MASTER);
  if (!masterSheet || masterSheet.getLastRow() <= 1) return;

  var data = masterSheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = 0, nameCol = 1, stockCol = 3;

  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim();
    if (h === 'ID' || h === '商品ID') idCol = c;
    else if (h === '商品名' || h === '授与品名') nameCol = c;
    else if (h === '在庫数' || h === '在庫') stockCol = c;
  }

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var id = String(row[idCol]);
    var name = String(row[nameCol]);

    if (stockMap[id] !== undefined) {
      masterSheet.getRange(r + 1, stockCol + 1).setValue(stockMap[id]);
    } else if (stockMap[name] !== undefined) {
      masterSheet.getRange(r + 1, stockCol + 1).setValue(stockMap[name]);
    }
  }
}

/**
 * シート取得・初期化ユーティリティ
 */
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setBackground('#3F5145').setFontColor('#FFFFFF').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// ==========================================
// 過去実績データ ＆ 年間発注計画 連携関数
// ==========================================
var SHEET_HISTORICAL = '過去実績台帳';
var SHEET_ORDER_PLAN = '年間発注計画表';

/**
 * 過去実績データの取得 (GET action: 'getHistoricalData')
 */
function handleGetHistoricalData(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var targetYear = (e && e.parameter && e.parameter.year) ? String(e.parameter.year) : '2025';
  var sheet = ss.getSheetByName(SHEET_HISTORICAL);
  
  var records = [];
  if (sheet && sheet.getLastRow() > 1) {
    var data = sheet.getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      if (String(row[0]) === targetYear) {
        records.push({
          year: String(row[0]),
          id: String(row[1]),
          name: String(row[2]),
          category: String(row[3]),
          mode: String(row[4] || 'monthly'),
          m1: Number(row[5]) || 0,
          m2: Number(row[6]) || 0,
          m3: Number(row[7]) || 0,
          m4: Number(row[8]) || 0,
          m5: Number(row[9]) || 0,
          m6: Number(row[10]) || 0,
          m7: Number(row[11]) || 0,
          m8: Number(row[12]) || 0,
          m9: Number(row[13]) || 0,
          m10: Number(row[14]) || 0,
          m11: Number(row[15]) || 0,
          m12: Number(row[16]) || 0,
          total: Number(row[17]) || 0,
          remark: String(row[18] || '')
        });
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    year: targetYear,
    items: records
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 過去実績データの保存 (POST action: 'saveHistoricalData')
 */
function handleSaveHistoricalData(postData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var targetYear = String(postData.year || '2025');
  var items = postData.items || [];
  var operator = postData.operator || '授与所職員';
  var nowStr = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

  var sheet = getOrCreateSheet(ss, SHEET_HISTORICAL, [
    '年度', '品目ID', '授与品名', 'カテゴリ', '入力形式',
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月',
    '年間合計', '備考', '最終登録日時', '登録者'
  ]);

  // 既存の該当年レコードを削除
  var data = sheet.getDataRange().getValues();
  for (var r = data.length - 1; r >= 1; r--) {
    if (String(data[r][0]) === targetYear) {
      sheet.deleteRow(r + 1);
    }
  }

  var newRows = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var m = it.monthly || [];
    var total = Number(it.total) || 0;
    if (m.length > 0) {
      total = m.reduce(function(a, b) { return a + (Number(b) || 0); }, 0);
    }

    newRows.push([
      targetYear,
      it.id || ('M-' + (i + 1)),
      it.name || '',
      it.category || 'other',
      it.mode || 'monthly',
      m[0] || 0, m[1] || 0, m[2] || 0, m[3] || 0, m[4] || 0, m[5] || 0,
      m[6] || 0, m[7] || 0, m[8] || 0, m[9] || 0, m[10] || 0, m[11] || 0,
      total,
      it.remark || '',
      nowStr,
      operator
    ]);
  }

  if (newRows.length > 0) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: targetYear + '年の過去実績データをスプレッドシートへ保存しました。',
    savedCount: newRows.length
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 年間発注計画表の保存 (POST action: 'saveAnnualOrderPlan')
 */
function handleSaveAnnualOrderPlan(postData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var planYear = String(postData.planYear || (new Date().getFullYear() + 1));
  var items = postData.items || [];
  var operator = postData.operator || '授与所職員';
  var nowStr = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

  var sheet = getOrCreateSheet(ss, SHEET_ORDER_PLAN, [
    '発注対象年度', '品目ID', '授与品名', 'カテゴリ', '初穂料',
    '基準過去実績', '現在庫数', '採用安全係数', '発注ロット単位',
    '年間予想需要', '年間推奨発注数', '確定発注数',
    '正月用手配数(12月納品)', '通常期手配数(平月補充)', '想定初穂料規模',
    '備考・発注ステータス', '計画確定日時', '担当者'
  ]);

  // 既存の計画年度レコードを削除
  var data = sheet.getDataRange().getValues();
  for (var r = data.length - 1; r >= 1; r--) {
    if (String(data[r][0]) === planYear) {
      sheet.deleteRow(r + 1);
    }
  }

  var newRows = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    newRows.push([
      planYear,
      it.id || '',
      it.name || '',
      it.category || 'other',
      Number(it.price) || 0,
      Number(it.historicalTotal) || 0,
      Number(it.currentStock) || 0,
      Number(it.safetyFactor) || 1.15,
      Number(it.lotSize) || 50,
      Number(it.predictedDemand) || 0,
      Number(it.recommendedOrder) || 0,
      Number(it.confirmedOrder) || 0,
      Number(it.newYearOrder) || 0,
      Number(it.normalOrder) || 0,
      (Number(it.confirmedOrder) || 0) * (Number(it.price) || 0),
      it.status || '発注検討中',
      nowStr,
      operator
    ]);
  }

  if (newRows.length > 0) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: planYear + '年度の年間発注計画表をスプレッドシートへ保存しました。',
    savedCount: newRows.length
  })).setMimeType(ContentService.MimeType.JSON);
}
