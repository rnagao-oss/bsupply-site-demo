# B supply サイト：Sun Asterisk のレイアウトに合わせた書き換え（デモ環境）

作業ディレクトリ: `/tmp/bsupply-site-demo`（git リポジトリ。ここだけを編集する。push はしない。`bsupply-cinema-site` や他のディレクトリは一切触らない）

参考サイト: https://sun-asterisk.com/ （WordPress 自前テーマ。保存済み資料: 作業ディレクトリ内 `_spec/ref/` に index.html / style.css / index.js）

出力先の約束: 実測 CSV・報告書・スクリーンショットは全て作業ディレクトリ内に置く。`_spec/measurements.csv`、`_spec/report.md`、`_verify/`（スクリーンショット。`.gitignore` 済み）。本文中の `bsupply-site-tools/specs/...` や `/tmp/bsupply-demo-verify/` はこの約束に読み替える。

真似する範囲: トップページのファーストビュー（ヘッダーとハンバーガーメニューを含む）と、その他のサイト構成全て（下層ページの型も含む）。

## 0. 前提

- 日本語ページのみ対象（`*.html`）。`en/` ディレクトリは削除し、ヘッダーの言語切替（JA/EN）は非表示にする。英語版は承認後に別工程で再生成する。
- `apply.html`・`thanks.html`・`404.html`・`service-options.html` は「汎用下層ページの型」だけ合わせる（フォームの送信先・hidden input・JS は変更しない）。
- `app.js` の「ドットスフィア」ブロックと `index.html` の `data-sphere="on"` は残す（動きはこちらのものを使う）。球体はファーストビューの背景として位置だけ参考に合わせる。
- 全ページの `<meta name="robots" content="noindex,nofollow"/>` と `robots.txt`（Disallow）は残す。

## 1. 数値の調べ方（推測禁止）

1. `style.css` を読み、メディアクエリを全て抜き出して「切り替え幅は何 px で何本か」を確定する。事前集計では `max-width:800px`（501箇所）と `max-width:600px`/`601px`（計383箇所）が主で、`1000/1100/700/992/500/1200/768/320` が少数。主要ブレークポイントを本数ごと決めて報告する。
2. `body{font-size:14px}` で px 基準。rem は27箇所、vw は84箇所、px は6,600箇所超。JS（index.js）は `window.__G.win.w > 800` で PC/SP を切り替えている。画面幅比例の作りではないので、こちらも px 基準で組む。
3. ブラウザ実測: `python3.14` に playwright（chromium）が入っている。次の4幅でトップページと各種下層ページを開き、要素の位置・大きさを `getBoundingClientRect()` で実測する: **375 / 768 / 1024 / 1440**。
   - 実測対象: ヘッダー高さ、ロゴの高さ、ナビ項目の間隔、ハンバーガーの位置と大きさ、ファーストビューの高さ、キャッチコピーの字面高さ（`getBoundingClientRect` の高さではなくフォントサイズ×行数で字面を出す）、コンテンツ幅（コンテナの左右余白）、セクション間の上下余白、見出しサイズ、本文サイズ・行間、カード/リストの列数と折り返し位置。
   - 参考の見出しが SVG 画像（`svg-mv-copy`）の箇所は、箱ではなく字面の高さで合わせる。
   - 実測値は `bsupply-site-tools/specs/sun-asterisk-ref/measurements.csv`（幅, ページ, 要素, 参考の値, こちらの値）に記録する。

## 2. どこまで真似するか

- 要素の数と並び順を参考とそろえる。参考のトップ構成: MV → What we do → Creative & Engineering → Talent Platform → Our Works → Career → News → Footer。
- 対応付け（参考にあってこちらにない要素は作らない。英語見出しのような情報影響の小さいものは真似する）:
  - MV → B supply のファーストビュー（キャッチコピー・サブコピー・スクロール指標）
  - What we do → 3事業（コンサルティング／自己勘定投資／革製造）
  - Creative & Engineering → コンサルティング事業の紹介
  - Talent Platform → 自己勘定投資事業＋革製造事業の紹介（参考が2ブロックなら2ブロック、1ブロックなら統合）
  - Our Works → クライアント実績（case-*.html の一覧）
  - Career → 採用（recruit.html への導線）
  - News → **作らない**（B supply にニュースはない）
- 参考になくてこちらにある要素（数字の実績列、沿革年表、私たちの強み、会社概要テーブルなど）はトップからは外す。下層ページに残す場合も、参考の下層ページの型（Company / Service / Works / Career / Contact）に合わせて置き直す。
- 下層ページの対応: `company.html`↔/company/、`consulting.html`・`manufacturing.html`・`service-*.html`↔/service/ 配下、`case-*.html`↔/works/ 詳細、`recruit.html`・`job-*.html`↔/career/ 配下、`contact.html`↔/contact/。参考の各ページも playwright で開いて構成と数値を取る。

## 3. そろえる数値

- 画面幅の切り替えは参考と同じ px で同じ本数にする（現在の styles.css のブレークポイントは全て置き換える）。
- 幅ごとに、コンテンツ幅・余白・要素の大きさ・改行位置・リストの折り返しを合わせる。
- ヘッダー: ロゴはこちらの SVG/画像を使い、高さだけ参考にそろえる。ナビ項目はこちらの項目（事業 / コンサルティング / 自己勘定投資 / 革製造 / 実績 / 会社概要 / 採用 / お問い合わせ）を参考と同じ配置・間隔で。ハンバーガーの位置・大きさ・開いた時のメニューの段組・項目の並びを合わせる（開閉の動きは既存の簡素なものでよい）。

## 4. 文字数

- 社名・住所・代表者名・設立日・取引銀行など変えてはいけない情報はそのまま。
- 見出しと本文は、参考の同じ位置の文字数に近づけて書き換える（意味は B supply の現行文言を保つ。数字の捏造は禁止。現行ページにない事実を足さない）。
- キャッチコピー（現行のヒーローの見出し文）は文字数を変えない。

## 5. 真似しないもの

- 配色・装飾・動きは真似しない。レイアウトだけ合わせる。色は黒 #000 / 白 #fff / グレー階調のみ。
- フォントは現行の `styles.css` の定義（Hanken Grotesk、YakuHanJP、Noto Sans JP）をそのまま使う。Sun Asterisk の Noto Sans JP 500/700 の指定は真似しない。
- 影・角丸・ピル型バッジ・グラデーションは使わない。

## 6. 画像とアイコン

- ロゴはこちらのもの。高さだけ参考に合わせる。
- 参考で文字が画像になっている箇所は、同じ文字数程度の文をテキストで置く。
- アイコンは Font Awesome 無料版（cdnjs の `font-awesome/6.x/css/all.min.css`）を使う。参考でアイコンがある箇所だけ。
- 参考に写真・動画があってこちらに素材がない箇所は、同じ比率のグレー（#e5e5e5）のプレースホルダー `<div class="ph" data-ratio="16:9">` を置き、報告書に「必要な画像の一覧（場所・比率・内容の要件）」を書く。動画は置かない。

## 7. 出す前に、自分で直す

- 375 / 768 / 1024 / 1440 の4幅で、参考とこちらの数値を突き合わせる（measurements.csv を埋める。差が 4px 超の項目は直してから出す）。
- 4幅で `document.documentElement.scrollWidth <= window.innerWidth` を確認し、横スクロールが無いことを確かめる（全ページ）。
- 4幅×主要ページ（index / company / consulting / case-01 / recruit / job-craftsman / contact）のスクリーンショットを `/tmp/bsupply-demo-verify/` に保存する（リポジトリには入れない）。
- `node --check app.js`、HTML の構文（閉じタグ）を確認する。

## 8. 成果物

- `/tmp/bsupply-site-demo` 内の書き換え済み HTML / styles.css / app.js（git commit まで。push はしない）
- `bsupply-site-tools/specs/sun-asterisk-ref/measurements.csv`
- 報告書 `bsupply-site-tools/specs/2026-09-15_sun-asterisk-layout.report.md`: ブレークポイント（px と本数）、4幅の突き合わせ表（差分 px）、横スクロール確認結果、対応付けの判断（何を外し何を統合したか）、必要な画像一覧、未達事項。推測で書かず、実測結果だけを書く。
