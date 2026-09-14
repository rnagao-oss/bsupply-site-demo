# B supply レイアウト改修の実測報告

実測・検証日：2026年9月15日（日本時間）。対象は日本語41ページ。参照サイトと改修前サイトを375 / 768 / 1024 / 1440pxで先に測定し、その後に書き換え、差分を修正して再検証した。

対応表で定義したレイアウト比較6,616項目のうち、測定可能な6,584項目はすべて差4px以内。最大絶対差は3.800px。32項目は事例ページのモバイル表示で段組がなく、column-gapが適用されないためN/Aとした。列数の比較はすべて一致した。全41ページ×4幅、計164表示で横スクロールはない。

[実測CSV](measurements.csv)は共通ヘッダー・ナビゲーション・キャッチコピーと横スクロール検査も含め、6,938行（pass 6,898、N/A 40）。差分は「こちら − 参考」の符号付きpx、列数・行数は件数。スクロール幅の参考値は参照サイトの幅ではなく、許容上限のviewport幅である。

## 測定方法と記録

- Python 3.14 / Playwright Chromium、ローカルHTTP `http://127.0.0.1:8765/`、viewport高さ900px。フォント読込完了を待って測定した。参考ヘッダーは初期表示アニメーションの影響を避けるため8.2秒待機した。
- 座標・幅・高さは`getBoundingClientRect()`、余白・フォントサイズはcomputed style。本文の実際の行位置はRangeで数えた。`line-height: normal`は複数行の実測ピッチ、または同じcomputed typographyを複製した2行のブラウザ内プローブで取得し、倍率を推定していない。
- 通常の文字の字面高さは仕様に従い「font-size × 実際の行数」。参考SVG文字はpathの`getBBox()`を`getScreenCTM()`で画面座標へ変換し、SVG要素の外枠を字面として扱っていない。
- 事前の静的CSS分析は[reference-css.json](reference-css.json)、[reference-css-notes.md](reference-css-notes.md)、[preflight-report.md](preflight-report.md)を再利用した。静的解析値とブラウザ実測値は区別した。
- 初回の参考測定は`browser/reference-*.json`、改修前164表示は`browser/before.json`に保存。最終比較の根拠は[reference-pairs.json](browser/reference-pairs.json)、[comparison-rows.json](browser/comparison-rows.json)、[common-measurements.json](browser/common-measurements.json)。改修前後の大容量DOM記録とスクリーンショットはローカル検証用としてgit対象外。
- 比較対象・CSSセレクタは[トップ](partials/top-mapping.json)、[会社・事業・汎用下層](partials/lower-mapping.json)、[事例・採用](partials/career-case-mapping.json)に記録した。本文量や情報のないセクションを同じ高さに捏造せず、対応する容器、余白、文字組み、カードを比較した。

## ブレークポイント

参考・改修後ともにメディアクエリは**1,208本、条件52種類、幅の閾値37種類**。条件別の本数まで一致する。主な切り替えは800pxと600/601px。後者2条件の合計は383本。JavaScriptのPC/SP切り替えも800pxを境界とし、通常本文は14px、基本単位はpxとしている。

参考ルールの実体を維持し、補正ルールを既存の同条件ブロックへ統合した。B supplyに対応情報がない参考ページのセレクタは未使用のまま残る。空のメディアクエリによる本数合わせは行っていない。[CSS検査](browser/css-audit.json)も一致を確認した。

| メディア条件（px） | 参考の本数 | 改修後の本数 |
| --- | --- | --- |
| screen and (min-width:1001px) | 2 | 2 |
| screen and (min-width:801px) | 49 | 49 |
| screen and (min-width:701px) | 1 | 1 |
| screen and (min-width:601px) | 2 | 2 |
| screen and (min-width:501px) | 1 | 1 |
| screen and (max-width:1000px) | 66 | 66 |
| screen and (max-width:800px) | 501 | 501 |
| screen and (max-width:600px) | 204 | 204 |
| screen and (max-width:500px) | 9 | 9 |
| screen and (max-width:700px) | 27 | 27 |
| screen and (max-width:320px) | 6 | 6 |
| screen and (max-width:800px) and (max-height:590px) | 1 | 1 |
| screen and (max-width:800px) and (min-width:501px) | 2 | 2 |
| screen and (max-width:768px) | 7 | 7 |
| screen and (max-width:1127px) and (min-width:801px) | 2 | 2 |
| screen and (max-width:1120px) | 4 | 4 |
| screen and (max-width:1120px) and (max-width:1000px) | 1 | 1 |
| screen and (max-width:1120px) and (max-width:800px) | 1 | 1 |
| screen and (max-width:1200px) | 8 | 8 |
| screen and (min-width:1201px) | 1 | 1 |
| screen and (min-width:1501px) | 1 | 1 |
| screen and (max-width:650px) | 2 | 2 |
| screen and (max-width:1100px) | 52 | 52 |
| screen and (max-width:540px) | 2 | 2 |
| screen and (max-width:900px) | 5 | 5 |
| screen and (max-width:992px) | 20 | 20 |
| screen and (max-width:800px) and (min-width:601px) | 2 | 2 |
| screen and (-ms-high-contrast:active),(-ms-high-contrast:none) | 1 | 1 |
| screen and (max-width:1127px) | 1 | 1 |
| screen and (min-width:801px) and (max-width:1127px) | 1 | 1 |
| screen and (max-width:1366px) | 3 | 3 |
| screen and (max-width:1024px) | 3 | 3 |
| screen and (max-width:1600px) | 4 | 4 |
| screen and (max-width:660px) | 1 | 1 |
| screen and (max-width:1380px) | 4 | 4 |
| screen and (max-width:1380px) and (max-width:1100px) | 2 | 2 |
| screen and (max-width:1380px) and (max-width:800px) | 2 | 2 |
| (max-width:1200px) | 1 | 1 |
| (max-width:800px) | 1 | 1 |
| screen and (max-width:991px) | 1 | 1 |
| screen and (max-width:375px) | 3 | 3 |
| screen and (max-width:1064px) | 2 | 2 |
| screen and (max-width:601px) | 179 | 179 |
| screen and (max-width:1920px) | 1 | 1 |
| screen and (max-width:801px) | 2 | 2 |
| screen and (min-width:802px) | 3 | 3 |
| screen and (max-width:1439px) | 3 | 3 |
| (min-width:768px) | 1 | 1 |
| (max-width:767.98px) | 4 | 4 |
| (max-width:991.98px) | 1 | 1 |
| screen and (min-width:602px) | 4 | 4 |
| screen and (min-width:961px) | 1 | 1 |

## 4幅の主要実測値

各セルは「参考 → こちら（差分）」、単位はpx。

| 対象 | 375 | 768 | 1024 | 1440 |
| --- | --- | --- | --- | --- |
| ヘッダー背景の高さ | 115 → 115（0） | 115 → 115（0） | 115 → 115（0） | 115 → 115（0） |
| ロゴ高さ | 29 → 29（0） | 29 → 29（0） | 34 → 34（0） | 34 → 34（0） |
| ロゴ左位置 | 23 → 23（0） | 23 → 23（0） | 57 → 57（0） | 57 → 57（0） |
| ロゴ上位置 | 27 → 27（0） | 27 → 27（0） | 57 → 57（0） | 57 → 57（0） |
| キャッチコピー字面高さ | 55.95 → 55.95（0） | 25.156 → 25.156（0） | 25.156 → 25.156（0） | 25.156 → 25.156（0） |

参考ヘッダーは固定配置された子要素を持つため、ラッパー自体のDOM高さが375/768では900px、1024/1440では0pxになる。こちらのラッパーは68/68/115/115px。表示上のヘッダー帯は双方115pxであり、ラッパーのDOM高さと混同していない。ロゴは指定どおり高さ・位置を合わせ、B supplyのロゴ固有の横幅を維持した。

| 対象 | 375 | 768 | 1024 | 1440 |
| --- | --- | --- | --- | --- |
| トップMV高さ | 900 → 900（0） | 900 → 900（0） | 900 → 900（0） | 900 → 900（0） |
| What we do本文幅 | 324.75 → 324.75（0） | 600 → 600（0） | 800 → 800（0） | 800 → 800（0） |
| 会社概要コンテナ幅 | 324.75 → 324.75（0） | 650 → 650（0） | 924 → 924（0） | 1054.078 → 1054.078（0） |
| 会社概要左余白 | 25.125 → 25.125（0） | 59 → 59（0） | 50 → 50（0） | 192.953 → 192.953（0） |
| 事業紹介コンテナ幅 | 324.75 → 324.75（0） | 650 → 650（0） | 924 → 924（0） | 1054.078 → 1054.078（0） |
| サービス詳細コンテナ幅 | 324.75 → 324.75（0） | 650 → 650（0） | 924 → 924（0） | 1054.078 → 1054.078（0） |
| 事例本文コンテナ幅 | 375 → 375（0） | 768 → 768（0） | 1024 → 1024（0） | 1200 → 1200（0） |
| 採用MV高さ | 900 → 900（0） | 900 → 900（0） | 900 → 900（0） | 900 → 900（0） |
| 職種詳細MV高さ | 300 → 300（0） | 300 → 300（0） | 300 → 300（0） | 300 → 300（0） |
| 問い合わせコンテナ幅 | 324.75 → 324.75（0） | 650 → 650（0） | 924 → 924（0） | 1054.078 → 1054.078（0） |

ハンバーガーは375/768で50×50px、上18px、右25px。参考・こちらとも一致し、1024/1440では非表示。開いたモバイルメニューは7項目を縦に並べ、左25px・先頭上105px・行高46px・項目間10pxで一致する。下に問い合わせ導線を置いた。PCの通常ナビ7項目間は26px、上位置73px・行高19pxで一致し、右端に問い合わせを配置した。

会社・事業サブメニューは2列。1440pxの事業サブメニューは左246.672px・上113px・幅910px・高さ380px。1024pxの参考は左側が画面外にはみ出すため、こちらは左57pxへ収めた。日本語に置き換えたナビの項目幅は文言固有の幅を使い、各項目間隔を保っている。

| 幅 | 確認した日本語ページ | 最大scrollWidth | 横スクロール |
| --- | --- | --- | --- |
| 375 | 41 | 375 | なし |
| 768 | 41 | 768 | なし |
| 1024 | 41 | 1024 | なし |
| 1440 | 41 | 1440 | なし |

## 構成の対応と保持した内容

| こちら | 実測した参考URL・判断 |
| --- | --- |
| index.html | https://sun-asterisk.com/ — MV → What we do → Consulting → Investment & Manufacturing → Our Works → Career → Footer |
| company.html | https://sun-asterisk.com/about/ — 指定された /company/ は404のため実在する会社紹介ページを使用 |
| consulting.html | https://sun-asterisk.com/service/ |
| manufacturing.html / service-*.html（service-optionsを除く） | https://sun-asterisk.com/service/engineering-capability/ |
| case-01〜16.html | https://sun-asterisk.com/service/development/works/kendrix/ — /works/kendrix/ のリダイレクト先 |
| recruit.html | https://sun-asterisk.com/recruitment/ — 指定された /career/ は404 |
| job-*.html | https://sun-asterisk.com/recruitment/benefits/ — 採用配下の見出し・画像・説明ブロックの型 |
| contact / apply / thanks / 404 / service-options | https://sun-asterisk.com/contact/ — 後4ページは汎用下層の型のみ適用 |

- Newsは作成していない。参考のTalent Platformは1ブロックなので、自己勘定投資と革製造を統合した。トップに数字の実績列、沿革年表、会社概要表を置いていない。既存の理念・Core Value・代表メッセージは会社概要に、投資方針は革製造ページ内の自己勘定投資セクションに配置した。
- 実績一覧は参考と同じ12枚を初期表示し、一覧ボタンから既存16事例を表示する。列数とカード内の改行を4幅で比較した。すべての事例への導線を残した。
- 会社名・代表者名・設立日・住所・取引銀行などの既存情報を保持した。トップのキャッチコピー「想いを紡ぎ、新たな価値を創る」は14文字のまま。年月・実績数を新たに作っていない。
- 英語版39ファイルを削除し、JA/EN切替・英語向けhreflang・サイトマップの英語エントリを除去した。日本語41ページのnoindex,nofollowとrobots.txtのDisallowを保持した。
- Hanken Grotesk / YakuHanJP / Noto Sans JPの既存4個の@font-faceを保持した。色は黒・白・グレーに統一し、既存画像もCSSでグレースケール表示した。影・角丸・グラデーションはない。参照サイトの写真・動画・装飾アニメーションは利用せず、アイコンはFont Awesome無料版6.7.2を使用した。
- app.jsのドットスフィアブロックとdata-sphere="on"を保持し、背景の位置をCSSで調整した。既存の問い合わせAJAX、フォームHTML、hidden input、インラインJSは保持した。例外はトップの構造化データにある英語の言語指定を日本語のみに修正した箇所。

## 必要な画像

素材がない箇所は`#e5e5e5`のプレースホルダーで表現した。全143配置箇所にdata-ratioと内容を示すaria-labelがある。共通ナビの1素材を41ページで再利用する想定。詳細なページ別一覧は[image-requirements.json](browser/image-requirements.json)。

| 場所 | 基準比率（幅:高さ） | 枚数・配置数 | 内容の要件 |
| --- | --- | --- | --- |
| 全ページの事業サブメニュー | 1:1 | 41 | 事業紹介画像 |
| manufacturing.html, service-digital-design.html, service-digital-strategy.html, service-growth-strategy.html, service-hr-strategy.html, service-m-and-a.html, service-marketing-sales.html, service-new-business.html, service-operation.html | 1:1 | 27 | 支援内容の説明画像 |
| case-01〜16 | 1024:588 | 16 | 支援事例のメイン画像 |
| case-01〜16 | 1024:330 | 16 | 支援内容を説明する図版 |
| recruit.html | 16:9 | 1 | B supplyの事業と働く風景 |
| recruit.html | 16:9 | 1 | コンサルティング事業の仕事風景 |
| recruit.html | 16:9 | 1 | 自己勘定投資事業の仕事風景 |
| recruit.html | 16:9 | 1 | 革製造事業の仕事風景 |
| recruit.html | 560:315 | 1 | Business Designerの仕事風景 |
| recruit.html | 560:315 | 1 | Directorの仕事風景 |
| recruit.html | 560:315 | 1 | 投資フロントメンバーの仕事風景 |
| recruit.html | 560:315 | 1 | 革職人の仕事風景 |
| recruit.html | 560:315 | 1 | 生産管理の仕事風景 |
| recruit.html | 560:315 | 1 | マーケティングの仕事風景 |
| recruit.html | 560:315 | 1 | 検品・裁断スタッフ（パート社員）の仕事風景 |
| index.html | 800:632.77 | 1 | 3事業をつなぐ事業紹介図 |
| index.html | 275:264.34375 | 1 | コンサルティング事業の紹介画像 |
| index.html | 275:264.34375 | 1 | 自己勘定投資と革製造事業の紹介画像 |
| index.html | 31:40 | 1 | 大手IT企業のM&A戦略策定・BDD支援の事例画像 |
| index.html | 31:40 | 1 | M&A仲介企業の営業戦略策定の事例画像 |
| index.html | 31:40 | 1 | 大手広告代理店の生成AI市場調査の事例画像 |
| index.html | 31:40 | 1 | 土木IT企業のSaaS事業戦略の事例画像 |
| index.html | 31:40 | 1 | 土木IT企業の管理会計基盤構築の事例画像 |
| index.html | 31:40 | 1 | 土木IT企業のM&Aロールアップ戦略の事例画像 |
| index.html | 31:40 | 1 | 老舗フルーツ店の新規事業戦略の事例画像 |
| index.html | 31:40 | 1 | マッチングアプリ企業の事業戦略の事例画像 |
| index.html | 31:40 | 1 | 物流会社の事業再生戦略の事例画像 |
| index.html | 31:40 | 1 | BtoB SaaS企業のGrowth戦略の事例画像 |
| index.html | 31:40 | 1 | DX支援企業の新規事業戦略の事例画像 |
| index.html | 31:40 | 1 | 半導体企業の営業戦略の事例画像 |
| index.html | 31:40 | 1 | フェムテック企業のマーケティング戦略の事例画像 |
| index.html | 31:40 | 1 | フェムテック企業のアライアンス戦略の事例画像 |
| index.html | 31:40 | 1 | 医療コンサルティング会社の事業戦略の事例画像 |
| index.html | 31:40 | 1 | 化学メーカーの採用戦略の事例画像 |
| index.html | 1440:500 | 1 | 仕事の様子が伝わる採用画像 |
| job-*.html（7職種） | 1440:300 | 7 | 募集職種の仕事風景 |
| consulting.html | 1000:479.8 | 1 | コンサルティングから投資・事業経営へつながる事業フローの図版 |
| consulting.html | 382:367.19 | 1 | コンサルティング事業の紹介画像 |
| consulting.html | 1000:479.8 | 1 | 戦略策定から現場実行までの支援領域図 |
| consulting.html | 1:1 | 2 | コンサルティングの支援姿勢を示す画像 |

基準比率はプレースホルダーのdata-ratio。表示枠は参考のレスポンシブ切り替えに従ってトリミングする。トップ実績画像はPC 31:40、768pxでは14:15、375pxでは250:137。採用背景はPCで高さ500px、モバイルで395pxとなるため、中心付近に主要な被写体を置く素材を想定する。画像内にしか存在しない文字は使わず、現在のHTMLテキストを維持できる素材が必要。

## 検証と残る作業

- `node --check app.js`成功。lxmlによる全41ページのHTML検査で閉じタグ関連エラー、重複ID、内部リンク切れなし。フォーム・hidden input・インラインJSの改変なし、球体ブロックと問い合わせAJAXの保持を[static-checks.json](browser/static-checks.json)で確認した。
- [操作検証](browser/interaction-smoke.json)：4幅で実績12→16件、モバイルメニューの開閉とEscape、PCサブメニューを確認した。[フォーム操作検証](partials/form-smoke.json)：問い合わせ種別、プライバシー表示、応募職種の引き継ぎ、学歴行追加を確認した。外部への実送信は行っていない。
- 主要7ページ×4幅の全28スクリーンショットを`_verify/{page}-{width}.png`に保存した。対象はindex / company / consulting / case-01 / recruit / job-craftsman / contact。ヘッダー、開いたメニュー、トップ採用導線も追加撮影した。`_verify/`はgit対象外。
- 日本語Web文言はGemini 3.8 FlashとCodexで確認した。任意の漢字表記の提案は既存の文言・改行を維持するため採用せず、年次に関する指摘は既存の記載と照合して保持した。
- 実測対象に未修正の4px超差分はない。参考と異なる情報量に由来するページ総高、固有ロゴの横幅、日本語ナビの文字幅、前述の1024pxサブメニュー位置は一致対象から区別した。参照ページ自体にあった横方向のはみ出しは再現していない。
- 写真・図版は上記の仮素材のため、実素材への差し替えが必要。英語版の再生成は仕様どおり別工程。デモのnoindex設定を保持し、公開・pushは行わない。

CSSを再生成する場合は、リポジトリ直下で`PYTHONDONTWRITEBYTECODE=1 python3.14 _spec/build_styles.py`を実行する。最終測定は`_spec/browser/compare_layout.py`、全ページ確認は`_spec/browser/verify_site.py`。Playwrightの作業用ディレクトリもこのリポジトリの`_verify/tmp`をTMPDIRに指定した。
