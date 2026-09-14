# Sun Asterisk レイアウト対応：事前確認で停止

## 実施状況

サイトの書き換えは未着手です。指定された Python 3.14・Playwright の事前計測を試みましたが、実行環境の権限制限で Chromium が起動せず、レイアウトの実測値は取得できませんでした。CSS の宣言値をブラウザーの実測値として扱っていません。

- 作業対象：このリポジトリの日本語41ページ。`en/` は39ページ。
- Python：3.14.6、Playwright：1.61.0。
- Chromium 起動：`bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)` で終了。
- ローカル HTTP サーバー：`PermissionError: [Errno 1] Operation not permitted` で待受けに失敗。
- エラー原文：[`preflight-errors.log`](preflight-errors.log)。起動前のファイル確認：[`preflight-inventory.json`](preflight-inventory.json)。hidden input の値は記録していません。
- コミット：`git add` が `.git/index.lock` を作成できず、`Operation not permitted` で失敗。コミット・push ともに未実施。

「計測を変更前に実施する」という条件に従い、既存の HTML・styles.css・app.js・robots.txt・en/ は変更していません。

## 保存済み CSS の集計

対象は `_spec/ref/style.css` のみです。保存済み HTML のインラインCSSや現在の公開サイトのCSSは、この集計に含めていません。

`@media` は1,208ブロック、条件文字列は52種類です。完全一致条件 `screen and (max-width:800px)` は501本、`screen and (max-width:600px)` は204本、`screen and (max-width:601px)` は179本（600 / 601 の合計383本）でした。

`(max-width:800px)` 単独や複合条件は別行で数えています。したがって「800pxを含む条件の総数」と「完全一致条件の501本」は別の集計です。主要な切り替え幅は保存CSS上で800pxと600 / 601pxですが、ブラウザーでの境界確認と移植するルールの確定は未実施です。

単位の出現回数は px：6,653、rem：27、vw：84です。`body` の `font-size:14px` と、保存済み `index.js` の PC / SP 判定 `window.__G.win.w > 800` を静的に確認しました。

全条件と宣言値の抽出結果は [`reference-css.json`](reference-css.json)、ヘッダー・メニュー・各ページ型の静的確認は [`reference-css-notes.md`](reference-css-notes.md) に保存しました。

| メディア条件（原文） | ブロック数 |
|---|---:|
| `(max-width:1200px)` | 1 |
| `(max-width:767.98px)` | 4 |
| `(max-width:800px)` | 1 |
| `(max-width:991.98px)` | 1 |
| `(min-width:768px)` | 1 |
| `screen and (-ms-high-contrast:active),(-ms-high-contrast:none)` | 1 |
| `screen and (max-width:1000px)` | 66 |
| `screen and (max-width:1024px)` | 3 |
| `screen and (max-width:1064px)` | 2 |
| `screen and (max-width:1100px)` | 52 |
| `screen and (max-width:1120px)` | 4 |
| `screen and (max-width:1120px) and (max-width:1000px)` | 1 |
| `screen and (max-width:1120px) and (max-width:800px)` | 1 |
| `screen and (max-width:1127px)` | 1 |
| `screen and (max-width:1127px) and (min-width:801px)` | 2 |
| `screen and (max-width:1200px)` | 8 |
| `screen and (max-width:1366px)` | 3 |
| `screen and (max-width:1380px)` | 4 |
| `screen and (max-width:1380px) and (max-width:1100px)` | 2 |
| `screen and (max-width:1380px) and (max-width:800px)` | 2 |
| `screen and (max-width:1439px)` | 3 |
| `screen and (max-width:1600px)` | 4 |
| `screen and (max-width:1920px)` | 1 |
| `screen and (max-width:320px)` | 6 |
| `screen and (max-width:375px)` | 3 |
| `screen and (max-width:500px)` | 9 |
| `screen and (max-width:540px)` | 2 |
| `screen and (max-width:600px)` | 204 |
| `screen and (max-width:601px)` | 179 |
| `screen and (max-width:650px)` | 2 |
| `screen and (max-width:660px)` | 1 |
| `screen and (max-width:700px)` | 27 |
| `screen and (max-width:768px)` | 7 |
| `screen and (max-width:800px)` | 501 |
| `screen and (max-width:800px) and (max-height:590px)` | 1 |
| `screen and (max-width:800px) and (min-width:501px)` | 2 |
| `screen and (max-width:800px) and (min-width:601px)` | 2 |
| `screen and (max-width:801px)` | 2 |
| `screen and (max-width:900px)` | 5 |
| `screen and (max-width:991px)` | 1 |
| `screen and (max-width:992px)` | 20 |
| `screen and (min-width:1001px)` | 2 |
| `screen and (min-width:1201px)` | 1 |
| `screen and (min-width:1501px)` | 1 |
| `screen and (min-width:501px)` | 1 |
| `screen and (min-width:601px)` | 2 |
| `screen and (min-width:602px)` | 4 |
| `screen and (min-width:701px)` | 1 |
| `screen and (min-width:801px)` | 49 |
| `screen and (min-width:801px) and (max-width:1127px)` | 1 |
| `screen and (min-width:802px)` | 3 |
| `screen and (min-width:961px)` | 1 |

## 4幅の突き合わせ

[`measurements.csv`](measurements.csv) に、375 / 768 / 1024 / 1440px × 日本語41ページの164行を作成しました。すべて状態は「未計測」で、参考値・こちらの値・差分欄は空欄です。空欄は0pxや合格を意味しません。

| 幅 | 参考の実測値 | こちらの実測値 | 差分 | 横スクロール確認 |
|---:|---|---|---|---|
| 375px | 未取得 | 未取得 | 算出不可 | 未実施 |
| 768px | 未取得 | 未取得 | 算出不可 | 未実施 |
| 1024px | 未取得 | 未取得 | 算出不可 | 未実施 |
| 1440px | 未取得 | 未取得 | 算出不可 | 未実施 |

ヘッダー、ロゴ、ナビ間隔、ハンバーガー、開いたメニュー、MV、キャッチコピーの字面、コンテンツ幅、セクション余白、見出し、本文、カード列数の実測はすべて未実施です。4px以内への調整も未実施です。

スクリーンショットは取得できていません。`_verify/` が `.gitignore` の対象であることは確認しました。

## 構成の対応付け

以下は仕様と保存HTMLの照合結果です。サイトへの反映は未実施です。

| 参考側 | B supply側の対応 | 確認結果 |
|---|---|---|
| MV | 現行キャッチコピー・サブコピー・スクロール指標 | キャッチコピーとドットスフィアを維持する指定 |
| What we do | コンサルティング／自己勘定投資／革製造 | 3事業を紹介する指定 |
| Creative & Engineering | コンサルティング事業 | 保存HTMLの `.p-top-service__box` の1個目 |
| Talent Platform | 自己勘定投資＋革製造 | 同クラスの2個目。後者は1ブロックなので、この2事業を統合する対応 |
| Our Works | case-*.html の一覧 | 日本語の事例ページは16件 |
| Career | recruit.html への導線 | 保存HTMLのリンク先は `/recruitment/` |
| News | 作成しない | 仕様の明示的な除外 |
| Footer | B supply の既存情報・導線 | レイアウト計測待ち |

数字の実績列、沿革年表、私たちの強み、会社概要テーブルなどをトップから外す作業は未実施です。保存HTMLの会社概要リンク先は `/about/`、採用は `/recruitment/` で、仕様に記載された `/company/`、`/career/` と異なります。移植前にブラウザーで遷移先を確認する必要があります。下層ページの型は未計測です。

## 必要な画像一覧

必要な画像の一覧は未確定です。配置場所、比率、内容の要件を確定するための参照ページの実画面確認と、既存素材の照合が未実施です。推測で比率を記載したり、プレースホルダーを配置したりしていません。

## 既存状態の検査

- `node --check app.js`：成功。変更前の構文確認です。
- `robots.txt`：`User-agent: *` と `Disallow: /` を保持。
- `404.html`、`thanks.html`、`service-options.html` の robots 指定は既存状態で `noindex` のみです。仕様にある `nofollow` が含まれていません。
- フォーム送信先、hidden input、ページ内JS、`app.js` のドットスフィア、`index.html` の `data-sphere="on"`：変更していません。
- 全HTMLの閉じタグ検査、全ページの横スクロール検査、メニュー操作確認：未実施。

## 未達事項と再開条件

事前計測、サイト全面書き換え、英語ページ削除、4幅の比較・修正、画像要件一覧、28枚の主要ページスクリーンショット、全HTMLの構文検査、コミットが未完了です。

この実行環境では権限昇格も許可されていません。Python 3.14 から Chromium を起動でき、ローカル HTTP を待受けできる実行環境で、事前計測から再開する必要があります。また、コミットには `.git` への書き込み権限が必要です。

## 日本語確認

日本語部分を抽出して Gemini 3.8 Flash による確認を試みましたが、APIへの接続に失敗しました。Geminiでの確認は未実施です。報告書と静的確認メモはCodexで確認しました。接続結果は [`japanese-check.log`](japanese-check.log) に保存しています。
