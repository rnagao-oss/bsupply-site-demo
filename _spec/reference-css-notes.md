# 保存済み参考CSSの静的確認

対象: `_spec/ref/style.css`、`index.html`、`index.js`。Python 3.14 で集計した。以下はソース宣言値であり、`getBoundingClientRect()` によるブラウザ実測値ではない。実測が完了するまで書き換えの確定値にしない。

## ブレークポイントの数え方

- `@media` ブロック数: 1208
- 完全一致する条件文字列の種類: 52
- min/max の区別を除いた幅の数値: 37 種
- 単位付き数値トークン: px 6,653、rem 27、vw 84
- `window.__G.win.w > 800` の一致: 3 箇所

`screen and (max-width:800px)` の完全一致条件は501本。`screen and (max-width:600px)` は204本、`screen and (max-width:601px)` は179本で計383本。複合条件や `screen and` の有無を合算すると本数が変わるため、JSONには完全条件別と幅条件の出現数を分けて記録した。

「同じpxで同じ本数」は、主要2段階だけを採用すると全条件一致にはならない。実装時は全1,208条件の頻度と52種類を要件の厳密な照合対象にし、ページ用途がない条件をどう扱うかも報告する必要がある。単に同じ条件の空ブロックを追加することはレイアウト一致の検証にならない。

## ヘッダーとメニューの宣言値

|対象|801px以上|800px以下|
|---|---|---|
|ロゴ `.l-fixed__head`|left/top 57px|left 23px、top 27px|
|ロゴSVG|94 × 34px|79 × 29px|
|メニュー `.l-nav`|top 73px、right 25px、横flex|全画面、上padding 105px、下10px、縦配置|
|ナビ項目 `.l-nav__item`|左margin 26px|左右外側25px、右padding 40px、下margin 10px、右寄せ|
|ナビ文字|14px|24px|
|開閉ボタン `.l-fixed__btn`|`.u-showMedium` により非表示|top18px / right25px / 50 × 50px|

500px以下でモバイルナビは左寄せ、右padding 0へ変わる。メニュー全体の段組はモバイルで1列。PCの子メニューは `.l-nav__box` 内で左40%・右57%の2列と幅210pxの画像を配置する。サービス用だけ外箱910px・高さ380px、左52%・右最大306px。汎用の子メニュー外箱は700 × 330px、内部padding20px。実物は丸ボタン・ドットだが、本タスクでは装飾禁止条件が優先する。

`.l-fixed` はPCで絶対配置の子要素のみ持ち高さを宣言していない。背景疑似要素 `:before` は高さ115px。モバイルの `.l-fixed` 自体はheight100%。従って「ヘッダー高さ」は外箱のDOM高さと視覚上の占有領域を区別して測る必要がある。

## トップと下層の宣言値

- MV `.p-top-mv`: height100vh。コピーは中央絶対配置。PC箱446 × 29px、600px以下はwidth80vw/height28vw、上限320 × 112px。SVGの箱寸法なので字面高さとは同一視しない。
- What we do: 上margin169px。800px以下は71px、幅86.6%。
- 事業紹介: `.p-top-service__box` はHTML内に2個。PCは各幅50%・高さ486px、800px以下は幅100%・高さautoの縦配置。見出し26px。自己勘定投資と革製造はTalent Platform相当の1ブロックへ統合する対応になる。
- Our Works: 上margin200px、幅calc(100% - 20px)、最大1243px。1127px以下は幅100%。800px以下は幅88%・上145px。
- Career: 上margin190px、高さ500px、上padding93px。800px以下は上margin100px、高さ395px、padding47px 23px。
- Footer: 最大幅1600px、padding120px 0 70px。1000px以下100px 0 20px。700px以下75px 0 0。
- Company相当 `.p-about-top`: 幅73.2%、最大1400px、最小1000px。1100px以下では幅calc(100% - 100px)・最小750px。800px以下では幅86.6%、最大650px、最小320px。
- Works詳細 `.p-detail-main`: 横flex、右padding8.126%、上40px。992px以下で縦配置、幅calc(100% - 100px)・最小750px、800px以下では幅86.6%・最大650px・最小320px。
- Service `.p-service-top`: 下padding120px、800px以下60px。Contactフォーム `.p-contact-form`: padding16px 0 120px、800px以下60px 0。
- 参考の保存HTMLで会社概要のリンクは `/about/`、採用は `/recruitment/`。仕様記載の `/company/`・`/career/` へのアクセス結果と最終URLは、ブラウザ実測時に確認する。

完全な条件一覧と抽出した宣言は `reference-css.json` を参照。静的確認だけでは、表示フォント、SVG字面、改行、実際の余白・段組、JSによる変更、画像比率の最終値を確定できない。
