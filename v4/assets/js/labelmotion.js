/* labelmotion.js — トップの MISSION / CORE VALUE ラベルを1字ずつに分け、表示時にせり上がらせる（CSSは styles.css 末尾） */
(() => {
  document.querySelectorAll('.mission .sec-label, .cv-block .sec-label').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    let i = 0;
    el.replaceChildren(...text.split(' ').flatMap((word, w) => {
      const wrap = document.createElement('span');
      wrap.className = 'lm-w';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.append(...Array.from(word).map((ch) => {
        const m = document.createElement('span');
        m.className = 'lm-m';
        const c = document.createElement('span');
        c.className = 'lm-c';
        c.style.setProperty('--i', i++);
        c.textContent = ch;
        m.append(c);
        return m;
      }));
      return w ? [document.createTextNode(' '), wrap] : [wrap];
    }));
  });
})();
