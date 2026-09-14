import csv,json,re
from pathlib import Path
from collections import Counter,defaultdict
ROOT=Path(__file__).resolve().parents[2]
def read(p):return json.loads((ROOT/p).read_text())
rows=read('_spec/browser/comparison-rows.json');assert all(r['status'] in ['pass','not_applicable'] for r in rows)
common=read('_spec/browser/common-measurements.json')
for d in common:
 w=d['width'];ref=d['reference'];local=d['local']
 def add(element,metric,a,b,unit='px',reason=None):
  rows.append({'viewport_width':w,'viewport_height':900,'page':'index.html','reference_family':'common','reference_url':'https://sun-asterisk.com/','reference_selector':element,'local_selector':element,'metric':metric,'reference':a,'local':b,'delta_px':b-a if a is not None and b is not None else None,'status':'not_applicable' if reason else 'pass' if abs(b-a)<=4 else 'fail','reference_method':'SVG path bbox × screenCTM' if element=='hero-copy' else 'getBoundingClientRect / computed style','local_method':'fontSize × observed lines' if element=='hero-copy' else 'getBoundingClientRect / computed style','status_reason':reason,'unit':unit})
 add('header-visible-background','height',ref['backgroundHeight'],local['backgroundHeight'])
 for k in ['height','x','y']:add('brand-logo',k,ref['logo'][k],local['logo'][k])
 for k in ['x','y','width','height']:add('hamburger',k,ref['button'][k],local['button'][k],reason='hidden above 800px' if w>800 else None)
 for k in ['height','y','lineCount']:add('hero-copy',k,ref['ink'][k],local['ink'][k],unit='count' if k=='lineCount' else 'px')
 a=ref['open'] if w<=800 else ref;b=local['open'] if w<=800 else local
 for i,(x,y) in enumerate(zip(a['gaps'],b['gaps'])):add(f'navigation-gap-{i+1}','gap',x,y)
 for i,(x,y) in enumerate(zip(a['items'],b['items'])):
  for k in (['x','y','width','height'] if w<=800 else ['y','height']):add(f'navigation-item-{i+1}',k,x[k],y[k])
 for k in (['width','height'] if w<=800 else ['right']):add('navigation',k,a['nav'][k],b['nav'][k])
after=read('_spec/browser/after.json');selected=read('_spec/browser/after-selected.json');replacement={(r['page'],r['width']):r for r in selected};after=[replacement.get((r['page'],r['width']),r)for r in after if r['page']!='menu'];assert len(after)==164
geometry=[]
for d in after:
 w=d['width'];v=d['scrollWidth'];assert v<=w
 geometry.append({'page':d['page'],'width':w,'scrollWidth':v,'pass':True})
 rows.append({'viewport_width':w,'viewport_height':900,'page':d['page'],'reference_family':'viewport-constraint','reference_url':'','reference_selector':'window.innerWidth','local_selector':'document.documentElement','metric':'scrollWidth','reference':w,'local':v,'delta_px':v-w,'status':'pass','reference_method':'viewport width, upper bound','local_method':'document.documentElement.scrollWidth','unit':'px'})
(ROOT/'_spec/browser/all-pages-geometry.json').write_text(json.dumps(geometry,indent=2))
for r in rows:r.setdefault('unit','count' if r['metric']=='columns' else 'px')
fields=['viewport_width','viewport_height','page','local_selector','metric','unit','reference','local','delta_px','status','reference_url','reference_selector','reference_method','local_method','reference_captured_at','local_captured_at','status_reason']
with (ROOT/'_spec/measurements.csv').open('w',newline='')as f:
 writer=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore',lineterminator='\n');writer.writeheader();writer.writerows(rows)
assert not any(r['status']=='fail' for r in rows)
base=read('_spec/browser/comparison-rows.json');css=read('_spec/reference-css.json');statuses=Counter(r['status']for r in rows)
def table(headers,rr):return '| '+' | '.join(headers)+' |\n| '+ ' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(map(str,r))+' |'for r in rr)+'\n'
def fmt(x):return '0' if abs(x)<0.0005 else f'{x:.3f}'.rstrip('0').rstrip('.')
def pick(page,selector,metric,w):return next(r for r in base if r['page']==page and r['local_selector']==selector and r['metric']==metric and r['viewport_width']==w)
def cell(r):return f"{fmt(r['reference'])} → {fmt(r['local'])}（{fmt(r['delta_px'])}）"
report='''# B supply レイアウト改修の実測報告

実測・検証日：2026年9月15日（日本時間）。対象は日本語41ページ。参照サイトと改修前サイトを375 / 768 / 1024 / 1440pxで先に測定し、その後に書き換え、差分を修正して再検証した。

'''
report+=f"対応表で定義したレイアウト比較{len(base):,}項目のうち、測定可能な{sum(r['status']=='pass' for r in base):,}項目はすべて差4px以内。最大絶対差は{max(abs(r['delta_px'])for r in base if r['delta_px']is not None):.3f}px。32項目は事例ページのモバイル表示で段組がなく、column-gapが適用されないためN/Aとした。列数の比較はすべて一致した。全41ページ×4幅、計164表示で横スクロールはない。\n\n"
report+=f"[実測CSV](measurements.csv)は共通ヘッダー・ナビゲーション・キャッチコピーと横スクロール検査も含め、{len(rows):,}行（pass {statuses['pass']:,}、N/A {statuses['not_applicable']}）。差分は「こちら − 参考」の符号付きpx、列数・行数は件数。スクロール幅の参考値は参照サイトの幅ではなく、許容上限のviewport幅である。\n\n"
report+='''## 測定方法と記録

- Python 3.14 / Playwright Chromium、ローカルHTTP `http://127.0.0.1:8765/`、viewport高さ900px。フォント読込完了を待って測定した。参考ヘッダーは初期表示アニメーションの影響を避けるため8.2秒待機した。
- 座標・幅・高さは`getBoundingClientRect()`、余白・フォントサイズはcomputed style。本文の実際の行位置はRangeで数えた。`line-height: normal`は複数行の実測ピッチ、または同じcomputed typographyを複製した2行のブラウザ内プローブで取得し、倍率を推定していない。
- 通常の文字の字面高さは仕様に従い「font-size × 実際の行数」。参考SVG文字はpathの`getBBox()`を`getScreenCTM()`で画面座標へ変換し、SVG要素の外枠を字面として扱っていない。
- 事前の静的CSS分析は[reference-css.json](reference-css.json)、[reference-css-notes.md](reference-css-notes.md)、[preflight-report.md](preflight-report.md)を再利用した。静的解析値とブラウザ実測値は区別した。
- 初回の参考測定は`browser/reference-*.json`、改修前164表示は`browser/before.json`に保存。最終比較の根拠は[reference-pairs.json](browser/reference-pairs.json)、[comparison-rows.json](browser/comparison-rows.json)、[common-measurements.json](browser/common-measurements.json)。改修前後の大容量DOM記録とスクリーンショットはローカル検証用としてgit対象外。
- 比較対象・CSSセレクタは[トップ](partials/top-mapping.json)、[会社・事業・汎用下層](partials/lower-mapping.json)、[事例・採用](partials/career-case-mapping.json)に記録した。本文量や情報のないセクションを同じ高さに捏造せず、対応する容器、余白、文字組み、カードを比較した。

## ブレークポイント

参考・改修後ともにメディアクエリは**1,208本、条件52種類、幅の閾値37種類**。条件別の本数まで一致する。主な切り替えは800pxと600/601px。後者2条件の合計は383本。JavaScriptのPC/SP切り替えも800pxを境界とし、通常本文は14px、基本単位はpxとしている。

参考ルールの実体を維持し、補正ルールを既存の同条件ブロックへ統合した。B supplyに対応情報がない参考ページのセレクタは未使用のまま残る。空のメディアクエリによる本数合わせは行っていない。[CSS検査](browser/css-audit.json)も一致を確認した。

'''
report+=table(['メディア条件（px）','参考の本数','改修後の本数'],[(k,n,n)for k,n in css['media_conditions'].items()])
report+='\n## 4幅の主要実測値\n\n各セルは「参考 → こちら（差分）」、単位はpx。\n\n'
common_table=[]
for label,group,key in [('ヘッダー背景の高さ',None,'backgroundHeight'),('ロゴ高さ','logo','height'),('ロゴ左位置','logo','x'),('ロゴ上位置','logo','y'),('キャッチコピー字面高さ','ink','height')]:
 vals=[]
 for d in common:
  a=d['reference'][group][key]if group else d['reference'][key];b=d['local'][group][key]if group else d['local'][key];vals.append(f'{fmt(a)} → {fmt(b)}（{fmt(b-a)}）')
 common_table.append([label,*vals])
report+=table(['対象','375','768','1024','1440'],common_table)
report+='\n参考ヘッダーは固定配置された子要素を持つため、ラッパー自体のDOM高さが375/768では900px、1024/1440では0pxになる。こちらのラッパーは68/68/115/115px。表示上のヘッダー帯は双方115pxであり、ラッパーのDOM高さと混同していない。ロゴは指定どおり高さ・位置を合わせ、B supplyのロゴ固有の横幅を維持した。\n\n'
selected_rows=[('トップMV高さ','index.html','.p-top-mv','height'),('What we do本文幅','index.html','.p-top-what__contents','width'),('会社概要コンテナ幅','company.html','.p-about-top','width'),('会社概要左余白','company.html','.p-about-top','x'),('事業紹介コンテナ幅','consulting.html','.p-service-top__inner','width'),('サービス詳細コンテナ幅','service-digital-design.html','.p-capability-top__inner','width'),('事例本文コンテナ幅','case-01.html','.post_container','width'),('採用MV高さ','recruit.html','.recruitment-top','height'),('職種詳細MV高さ','job-craftsman.html','.job-hero','height'),('問い合わせコンテナ幅','contact.html','.p-contact-top__inner','width')]
report+=table(['対象','375','768','1024','1440'],[[label,*[cell(pick(page,selector,metric,w))for w in [375,768,1024,1440]]]for label,page,selector,metric in selected_rows])
report+='\nハンバーガーは375/768で50×50px、上18px、右25px。参考・こちらとも一致し、1024/1440では非表示。開いたモバイルメニューは7項目を縦に並べ、左25px・先頭上105px・行高46px・項目間10pxで一致する。下に問い合わせ導線を置いた。PCの通常ナビ7項目間は26px、上位置73px・行高19pxで一致し、右端に問い合わせを配置した。\n\n'
report+='会社・事業サブメニューは2列。1440pxの事業サブメニューは左246.672px・上113px・幅910px・高さ380px。1024pxの参考は左側が画面外にはみ出すため、こちらは左57pxへ収めた。日本語に置き換えたナビの項目幅は文言固有の幅を使い、各項目間隔を保っている。\n\n'
report+=table(['幅','確認した日本語ページ','最大scrollWidth','横スクロール'],[[w,41,max(d['scrollWidth']for d in after if d['width']==w),'なし']for w in [375,768,1024,1440]])
report+='\n## 構成の対応と保持した内容\n\n'
report+=table(['こちら','実測した参考URL・判断'],[
('index.html','https://sun-asterisk.com/ — MV → What we do → Consulting → Investment & Manufacturing → Our Works → Career → Footer'),
('company.html','https://sun-asterisk.com/about/ — 指定された /company/ は404のため実在する会社紹介ページを使用'),
('consulting.html','https://sun-asterisk.com/service/'),
('manufacturing.html / service-*.html（service-optionsを除く）','https://sun-asterisk.com/service/engineering-capability/'),
('case-01〜16.html','https://sun-asterisk.com/service/development/works/kendrix/ — /works/kendrix/ のリダイレクト先'),
('recruit.html','https://sun-asterisk.com/recruitment/ — 指定された /career/ は404'),
('job-*.html','https://sun-asterisk.com/recruitment/benefits/ — 採用配下の見出し・画像・説明ブロックの型'),
('contact / apply / thanks / 404 / service-options','https://sun-asterisk.com/contact/ — 後4ページは汎用下層の型のみ適用')])
report+='''
- Newsは作成していない。参考のTalent Platformは1ブロックなので、自己勘定投資と革製造を統合した。トップに数字の実績列、沿革年表、会社概要表を置いていない。既存の理念・Core Value・代表メッセージは会社概要に、投資方針は革製造ページ内の自己勘定投資セクションに配置した。
- 実績一覧は参考と同じ12枚を初期表示し、一覧ボタンから既存16事例を表示する。列数とカード内の改行を4幅で比較した。すべての事例への導線を残した。
- 会社名・代表者名・設立日・住所・取引銀行などの既存情報を保持した。トップのキャッチコピー「想いを紡ぎ、新たな価値を創る」は14文字のまま。年月・実績数を新たに作っていない。
- 英語版39ファイルを削除し、JA/EN切替・英語向けhreflang・サイトマップの英語エントリを除去した。日本語41ページのnoindex,nofollowとrobots.txtのDisallowを保持した。
- Hanken Grotesk / YakuHanJP / Noto Sans JPの既存4個の@font-faceを保持した。色は黒・白・グレーに統一し、既存画像もCSSでグレースケール表示した。影・角丸・グラデーションはない。参照サイトの写真・動画・装飾アニメーションは利用せず、アイコンはFont Awesome無料版6.7.2を使用した。
- app.jsのドットスフィアブロックとdata-sphere="on"を保持し、背景の位置をCSSで調整した。既存の問い合わせAJAX、フォームHTML、hidden input、インラインJSは保持した。例外はトップの構造化データにある英語の言語指定を日本語のみに修正した箇所。

## 必要な画像

素材がない箇所は`#e5e5e5`のプレースホルダーで表現した。全143配置箇所にdata-ratioと内容を示すaria-labelがある。共通ナビの1素材を41ページで再利用する想定。詳細なページ別一覧は[image-requirements.json](browser/image-requirements.json)。

'''
images=read('_spec/browser/image-requirements.json');groups=defaultdict(list)
for d in images:groups[(d['ratio'],d['requirement'])].append(d['page'])
def pageslabel(pages):
 u=sorted(set(pages))
 if len(u)==41:return '全ページの事業サブメニュー'
 if len(u)==16 and all(x.startswith('case-')for x in u):return 'case-01〜16'
 if len(u)==7 and all(x.startswith('job-')for x in u):return 'job-*.html（7職種）'
 return ', '.join(u)
report+=table(['場所','基準比率（幅:高さ）','枚数・配置数','内容の要件'],[[pageslabel(p),ratio,len(p),req]for (ratio,req),p in groups.items()])
report+='''
基準比率はプレースホルダーのdata-ratio。表示枠は参考のレスポンシブ切り替えに従ってトリミングする。トップ実績画像はPC 31:40、768pxでは14:15、375pxでは250:137。採用背景はPCで高さ500px、モバイルで395pxとなるため、中心付近に主要な被写体を置く素材を想定する。画像内にしか存在しない文字は使わず、現在のHTMLテキストを維持できる素材が必要。

## 検証と残る作業

- `node --check app.js`成功。lxmlによる全41ページのHTML検査で閉じタグ関連エラー、重複ID、内部リンク切れなし。フォーム・hidden input・インラインJSの改変なし、球体ブロックと問い合わせAJAXの保持を[static-checks.json](browser/static-checks.json)で確認した。
- [操作検証](browser/interaction-smoke.json)：4幅で実績12→16件、モバイルメニューの開閉とEscape、PCサブメニューを確認した。[フォーム操作検証](partials/form-smoke.json)：問い合わせ種別、プライバシー表示、応募職種の引き継ぎ、学歴行追加を確認した。外部への実送信は行っていない。
- 主要7ページ×4幅の全28スクリーンショットを`_verify/{page}-{width}.png`に保存した。対象はindex / company / consulting / case-01 / recruit / job-craftsman / contact。ヘッダー、開いたメニュー、トップ採用導線も追加撮影した。`_verify/`はgit対象外。
- 日本語Web文言はGemini 3.8 FlashとCodexで確認した。任意の漢字表記の提案は既存の文言・改行を維持するため採用せず、年次に関する指摘は既存の記載と照合して保持した。
- 実測対象に未修正の4px超差分はない。参考と異なる情報量に由来するページ総高、固有ロゴの横幅、日本語ナビの文字幅、前述の1024pxサブメニュー位置は一致対象から区別した。参照ページ自体にあった横方向のはみ出しは再現していない。
- 写真・図版は上記の仮素材のため、実素材への差し替えが必要。英語版の再生成は仕様どおり別工程。デモのnoindex設定を保持し、公開・pushは行わない。

CSSを再生成する場合は、リポジトリ直下で`PYTHONDONTWRITEBYTECODE=1 python3.14 _spec/build_styles.py`を実行する。最終測定は`_spec/browser/compare_layout.py`、全ページ確認は`_spec/browser/verify_site.py`。Playwrightの作業用ディレクトリもこのリポジトリの`_verify/tmp`をTMPDIRに指定した。
'''
(ROOT/'_spec/report.md').write_text(report)
print({'csv_rows':len(rows),'statuses':dict(statuses),'report_characters':len(report)})
