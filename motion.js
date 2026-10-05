/* 本番サイトの動き：出現アニメーション／サロン検索／イベント・ブログの詳細 */
(function () {
  'use strict';
  var d = document;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var WD = ['日', '月', '火', '水', '木', '金', '土'];
  function ymd(s) { if (!s) return ''; var p = s.split('-'), t = new Date(+p[0], +p[1] - 1, +p[2]); return p[0] + '.' + p[1] + '.' + p[2] + '（' + WD[t.getDay()] + '）'; }
  function paras(t) { return String(t || '').split(/\n{2,}/).map(function (x) { return '<p>' + esc(x).replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function q(name) { return new URLSearchParams(location.search).get(name); }

  /* 出現 */
  var els = d.querySelectorAll('[data-rv]');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion:reduce)').matches) {
    [].forEach.call(els, function (e) { e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .15, rootMargin: '0px 0px -8%' });
    [].forEach.call(els, function (e) { io.observe(e); });
  }

  /* トップ：都道府県を選んだらサロン一覧へ */
  var go = d.querySelector('[data-go-salon]');
  if (go) go.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var v = go.querySelector('select').value;
    location.href = 'salons.html' + (v ? '?pref=' + encodeURIComponent(v) : '');
  });

  /* サロン検索 */
  var f = d.querySelector('[data-finder]');
  if (f && window.DZ_SALONS) {
    var S = window.DZ_SALONS, R = window.DZ_REGIONS, curR = 0, curP = q('pref');
    if (curP) R.forEach(function (r, i) { if (r[1].indexOf(curP) >= 0) curR = i; });
    var total = 0; Object.keys(S).forEach(function (k) { total += S[k].length; });
    var draw = function () {
      f.querySelector('[data-regions]').innerHTML = R.map(function (r, i) {
        return '<button type="button" data-r="' + i + '"' + (i === curR ? ' class="on"' : '') + '>' + esc(r[0]) + '</button>';
      }).join('');
      f.querySelector('[data-prefs]').innerHTML = '<button type="button" data-p=""' + (!curP ? ' class="on"' : '') + '>すべて</button>' +
        R[curR][1].map(function (p) {
          return '<button type="button" data-p="' + esc(p) + '"' + (curP === p ? ' class="on"' : '') + '>' + esc(p) + '<span>' + (S[p] || []).length + '</span></button>';
        }).join('');
      var ps = curP ? [curP] : R[curR][1], items = [];
      ps.forEach(function (p) { (S[p] || []).forEach(function (s) { items.push([p, s]); }); });
      f.querySelector('[data-list]').innerHTML = items.length ? items.map(function (it) {
        var p = it[0], s = it[1];
        var tel = s.tel ? '<a href="tel:' + esc(s.tel.replace(/-/g, '')) + '">電話 ' + esc(s.tel) + '</a>' : '';
        var map = '<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/' + encodeURIComponent(s.addr + ' ' + s.name) + '">地図</a>';
        return '<div class="salon"><span class="sp">' + esc(p) + '</span><b>' + esc(s.name) + '</b><span class="sa">' + esc(s.addr) + (s.note ? '　' + esc(s.note) : '') + '</span><span class="sl">' + tel + map + '</span></div>';
      }).join('') : '<p class="lead-s">この地域のサロンは準備中です。</p>';
      f.querySelector('[data-count]').textContent = '表示 ' + items.length + ' 件　／　全国 ' + total + ' サロン';
    };
    f.addEventListener('click', function (ev) {
      var r = ev.target.closest('[data-r]'), p = ev.target.closest('[data-p]');
      if (r) { curR = +r.getAttribute('data-r'); curP = null; draw(); }
      if (p) { curP = p.getAttribute('data-p') || null; draw(); }
    });
    draw();
  }

  /* イベント詳細 */
  var ed = d.querySelector('[data-event]');
  if (ed && window.DZ_POSTS) {
    var e = window.DZ_POSTS.filter(function (x) { return x.type === 'event' && x.id === q('id'); })[0];
    if (!e) { ed.innerHTML = '<p class="lead-s">イベントが見つかりませんでした。<a href="events.html">イベント一覧へ</a></p>'; }
    else {
      document.title = e.title + '｜一般財団法人ディメンション・ゼロ';
      var rows = [['日時', ymd(e.date) + (e.start ? '　' + e.start + (e.end ? '〜' + e.end : '〜') : '')],
                  ['会場', (e.venue || '') + (e.address ? '<br><small>' + esc(e.address) + '</small>' : '')],
                  ['参加費', e.fee], ['定員', e.capacity], ['主催', e.organizer]].filter(function (r) { return r[1]; });
      ed.innerHTML = '<p class="crumb"><a href="events.html">イベント</a>　／　' + esc(e.title) + '</p>' +
        '<h1 class="dt">' + esc(e.title) + '</h1>' +
        (e.image ? '<div class="d-img"><img src="' + esc(e.image) + '" alt=""></div>' : '') +
        '<table class="info">' + rows.map(function (r) { return '<tr><th>' + r[0] + '</th><td>' + (r[0] === '会場' ? esc(e.venue || '') + (e.address ? '<br><small>' + esc(e.address) + '</small>' : '') : esc(r[1])) + '</td></tr>'; }).join('') + '</table>' +
        '<div class="d-body">' + paras(e.body) + '</div>' +
        (e.applyUrl && /^https?:/.test(e.applyUrl) && e.applyUrl.indexOf('select-type.com/') >= 0 && e.applyUrl.length > 28
          ? '<p class="c"><a class="btn" href="' + esc(e.applyUrl) + '" target="_blank" rel="noopener">お申し込みはこちら</a></p>' : '') +
        '<p class="c"><a class="btn line" href="https://lin.ee/uV9wFms" target="_blank" rel="noopener">公式LINEで問い合わせる</a></p>';
      if (e.date >= new Date().toISOString().slice(0, 10)) {
        var ld = { '@context': 'https://schema.org', '@type': 'Event', name: e.title, startDate: e.date + (e.start ? 'T' + e.start + ':00+09:00' : ''),
          location: { '@type': 'Place', name: e.venue || '', address: e.address || '' }, organizer: { '@type': 'Organization', name: e.organizer || '一般財団法人ディメンション・ゼロ' } };
        var sc = d.createElement('script'); sc.type = 'application/ld+json'; sc.textContent = JSON.stringify(ld); d.head.appendChild(sc);
      }
    }
  }

  /* ブログ詳細 */
  var pd = d.querySelector('[data-post]');
  if (pd && window.DZ_POSTS) {
    var p = window.DZ_POSTS.filter(function (x) { return x.type === 'post' && x.id === q('id'); })[0];
    if (!p) { pd.innerHTML = '<p class="lead-s">記事が見つかりませんでした。<a href="blog.html">ブログ一覧へ</a></p>'; }
    else {
      document.title = p.title + '｜一般財団法人ディメンション・ゼロ';
      pd.innerHTML = '<p class="crumb"><a href="blog.html">ブログ</a>　／　' + esc(p.title) + '</p>' +
        '<time class="d-date">' + ymd(p.date) + (p.author ? '　' + esc(p.author) : '') + '</time>' +
        '<h1 class="dt">' + esc(p.title) + '</h1>' +
        (p.image ? '<div class="d-img"><img src="' + esc(p.image) + '" alt=""></div>' : '') +
        '<div class="d-body">' + paras(p.body) + '</div>' +
        '<p class="c"><a class="btn" href="blog.html">ブログの一覧へ</a></p>';
    }
  }
})();
