/**
 * 隔離された iframe を生成し、純粋な HTML/CSS のみを対象に印刷を実行するユーティリティ。
 * メインアプリケーションの CSS や React Portal、#root の干渉を 100% 完全に排除します。
 */
export const printElement = (
  element: HTMLElement | null,
  options: {
    title?: string;
    orientation?: 'landscape' | 'portrait';
    size?: 'A4' | 'B5' | 'A5';
  } = {}
) => {
  if (!element) return;

  const {
    title = '印刷',
    orientation = 'landscape',
    size = 'A4'
  } = options;

  // 1. 隠し iframe の作成（確実にレンダリング可能な十分なサイズを確保して画面外へ配置）
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '-10000px';
  iframe.style.width = '1200px';
  iframe.style.height = '900px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  // 2. 印刷対象の HTML を取得
  const contentHtml = element.outerHTML;

  // 3. 独立した印刷専用の完全な HTML ドキュメントを構築
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="ja">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: ${size} ${orientation};
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif;
            width: 100%;
            height: 100%;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            color: #000000;
          }
          .no-print {
            display: none !important;
          }
          /* 用紙ごとの余白・サイズ調整 */
          .print-landscape-page {
            width: 100% !important;
            height: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-portrait-page {
            width: 100% !important;
            min-height: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-yomifuda-page {
            width: 100% !important;
            height: 100% !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always;
          }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
    </html>
  `);
  doc.close();

  // 4. ドキュメント読み込み後に印刷ダイアログを起動
  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    // 印刷ダイアログ終了後に iframe を削除
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 250);
};
